/**
 * Zenith Daily - LocalStorage & State Management Engine (Clean Production Mode)
 * Multi-layer persistence: LocalStorage + Redundant Backup + IndexedDB + Disk Sync
 */

const STORAGE_KEYS = {
  TASKS: 'zenith_tasks_prod_v2',
  BACKUP: 'zenith_tasks_backup',
  HISTORY: 'zenith_history_prod_v2',
  CATEGORIES: 'zenith_categories_prod_v2',
  LAST_DATE: 'zenith_last_date_prod_v2',
  OVERALL_STREAK: 'zenith_streak_prod_v2',
  THEME: 'zenith_theme_v1'
};

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Tasks', icon: 'layers', color: 'indigo' },
  { id: 'work', name: 'Works', icon: 'briefcase', color: 'indigo' },
  { id: 'hobby', name: 'Hobbies', icon: 'palette', color: 'pink' },
  { id: 'health', name: 'Health & Habits', icon: 'heart-pulse', color: 'emerald' },
  { id: 'learning', name: 'Learning', icon: 'book-open', color: 'amber' }
];

// Clean Day 1 Blueprint (All 0 streaks, unchecked, for optional 1-click starter)
const DAY_ONE_TEMPLATE = [
  {
    id: 'task-opt-1',
    title: 'High-Impact Deep Work (MIT)',
    description: 'Focus on your single most critical career objective. No distractions.',
    category: 'work',
    priority: 'high',
    timeOfDay: 'morning',
    targetMinutes: 90,
    completed: false,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-opt-2',
    title: 'Creative Passion & Hobby Practice',
    description: 'Engage with your craft (music, drawing, coding an indie project, or writing).',
    category: 'hobby',
    priority: 'high',
    timeOfDay: 'afternoon',
    targetMinutes: 30,
    completed: false,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-opt-3',
    title: 'Morning Hydration & Physical Movement',
    description: 'Large glass of water, sunlight, and 20 mins cardio or mobility stretches.',
    category: 'health',
    priority: 'medium',
    timeOfDay: 'morning',
    targetMinutes: 20,
    completed: false,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-opt-4',
    title: 'Read 15 Pages of High-Value Non-Fiction',
    description: 'Read a book that expands your mindset, knowledge, or philosophy.',
    category: 'learning',
    priority: 'medium',
    timeOfDay: 'evening',
    targetMinutes: 25,
    completed: false,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-opt-5',
    title: 'Daily Admin, Inbox & Tomorrow Prep',
    description: 'Clear communications, review tomorrow’s priorities, and close tabs.',
    category: 'work',
    priority: 'low',
    timeOfDay: 'evening',
    targetMinutes: 15,
    completed: false,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    createdAt: new Date().toISOString()
  }
];

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class StorageManager {
  constructor() {
    this.db = null;
    this.checkDailyRollover();
    this.initIndexedDB();
    this.syncWithBackend();
  }

  getTodayDateString() {
    return getTodayDateString();
  }

  checkDailyRollover() {
    const today = getTodayDateString();
    const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_DATE);

    if (!lastDate) {
      // First run: pure clean start
      this.initCleanData();
      localStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
      return;
    }

    if (lastDate !== today) {
      // Date changed! Record yesterday's record in history
      const tasks = this.getTasks();
      const completedCount = tasks.filter(t => t.completed).length;
      const totalCount = tasks.length;

      if (totalCount > 0) {
        this.recordDayHistory(lastDate, completedCount, totalCount);
      }

      // Reset completed status for the fresh day
      // Crucial: ALL TASKS REMAIN IN THE LIST! No task is ever deleted!
      tasks.forEach(t => {
        if (!t.completed) {
          t.streak = 0;
        }
        t.completed = false;
      });

      this.saveTasks(tasks);
      localStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
    }
  }

  initCleanData() {
    // Pure clean state: empty tasks, empty history, standard categories
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      // Check backup first before setting empty
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (backup && backup !== '[]') {
        localStorage.setItem(STORAGE_KEYS.TASKS, backup);
      } else {
        this.saveTasks([]);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    }
  }

  getTasks() {
    try {
      let data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data || data === '[]') {
        // Redundant fallback: check backup key
        const backup = localStorage.getItem(STORAGE_KEYS.BACKUP);
        if (backup && backup !== '[]') {
          data = backup;
          localStorage.setItem(STORAGE_KEYS.TASKS, backup);
        }
      }
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load tasks', e);
      return [];
    }
  }

  saveTasks(tasks) {
    try {
      const json = JSON.stringify(tasks);
      localStorage.setItem(STORAGE_KEYS.TASKS, json);
      if (tasks && tasks.length > 0) {
        localStorage.setItem(STORAGE_KEYS.BACKUP, json);
      }
      // Persistent storage layers
      this.saveToIndexedDB(tasks);
      this.saveToBackend(tasks);
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }

  addTask(taskData) {
    const tasks = this.getTasks();
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : '',
      category: taskData.category || 'work',
      customCategoryName: taskData.customCategoryName || '',
      priority: taskData.priority || 'medium',
      timeOfDay: taskData.timeOfDay || 'anytime',
      targetMinutes: parseInt(taskData.targetMinutes, 10) || 30,
      completed: false,
      streak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  updateTask(id, updatedFields) {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks[idx] = { ...tasks[idx], ...updatedFields };
      this.saveTasks(tasks);
      return tasks[idx];
    }
    return null;
  }

  // Deleting is the ONLY way a task is removed from the task list
  deleteTask(id) {
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.id !== id);
    this.saveTasks(tasks);
    return tasks;
  }

  // Toggling completion NEVER deletes a task! It only marks completed = true/false.
  toggleTaskCompletion(id) {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    const today = getTodayDateString();
    task.completed = !task.completed;

    if (task.completed) {
      task.streak = (task.streak || 0) + 1;
      if (task.streak > (task.longestStreak || 0)) {
        task.longestStreak = task.streak;
      }
      task.lastCompletedDate = today;
    } else {
      task.streak = Math.max(0, (task.streak || 1) - 1);
    }

    this.saveTasks(tasks);
    return task;
  }

  getCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  addCategory(category) {
    const categories = this.getCategories();
    if (!categories.find(c => c.id === category.id)) {
      categories.push(category);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
    return categories;
  }

  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  recordDayHistory(dateStr, completed, total) {
    const history = this.getHistory();
    const existing = history.find(h => h.date === dateStr);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (existing) {
      existing.completed = completed;
      existing.total = total;
      existing.rate = rate;
    } else {
      history.push({ date: dateStr, completed, total, rate });
    }

    if (history.length > 60) {
      history.shift();
    }
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  getOverallStreak() {
    const tasks = this.getTasks();
    if (!tasks.length) return 0;
    return Math.max(...tasks.map(t => t.streak || 0), 0);
  }

  resetToday() {
    const tasks = this.getTasks();
    tasks.forEach(t => {
      t.completed = false;
    });
    this.saveTasks(tasks);
    return tasks;
  }

  loadDayOneBlueprint() {
    this.saveTasks(DAY_ONE_TEMPLATE);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    return this.getTasks();
  }

  clearAllData() {
    this.saveTasks([]);
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    return [];
  }

  exportData() {
    const exportObject = {
      tasks: this.getTasks(),
      categories: this.getCategories(),
      history: this.getHistory(),
      exportedAt: new Date().toISOString(),
      app: 'Zenith Daily'
    };
    return JSON.stringify(exportObject, null, 2);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        this.saveTasks(parsed.tasks);
        if (parsed.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(parsed.categories));
        if (parsed.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(parsed.history));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import parse error', e);
      return false;
    }
  }

  /* ==========================================================================
     Indestructible Storage Fallbacks (IndexedDB + Backend File Sync)
     ========================================================================== */
  initIndexedDB() {
    if (!window.indexedDB) return;
    try {
      const request = indexedDB.open('ZenithDB', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        // Check if localStorage was emptied by browser session close
        const currentTasks = this.getTasks();
        if (!currentTasks || currentTasks.length === 0) {
          this.restoreFromIndexedDB();
        }
      };
    } catch (e) {
      console.warn('IndexedDB initialization failed', e);
    }
  }

  saveToIndexedDB(tasks) {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      store.put(tasks, 'tasks');
      store.put(this.getHistory(), 'history');
    } catch (e) {
      console.warn('IndexedDB save failed', e);
    }
  }

  restoreFromIndexedDB() {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('store', 'readonly');
      const store = tx.objectStore('store');
      const req = store.get('tasks');
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result) && req.result.length > 0) {
          console.log('Restoring tasks from IndexedDB');
          this.saveTasks(req.result);
          if (window.appReloadTrigger) {
            window.appReloadTrigger();
          }
        }
      };
    } catch (e) {
      console.warn('IndexedDB restore failed', e);
    }
  }

  saveToBackend(tasks) {
    if (window.location && window.location.protocol.startsWith('http')) {
      try {
        fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks: tasks,
            history: this.getHistory(),
            lastDate: localStorage.getItem(STORAGE_KEYS.LAST_DATE)
          })
        }).catch(() => {});
      } catch (e) {}
    }
  }

  syncWithBackend() {
    if (window.location && window.location.protocol.startsWith('http')) {
      fetch('/api/tasks')
        .then(res => res.json())
        .then(data => {
          if (data && data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
            const currentTasks = this.getTasks();
            if (!currentTasks || currentTasks.length === 0) {
              console.log('Restoring tasks from backend file');
              this.saveTasks(data.tasks);
              if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
              if (window.appReloadTrigger) {
                window.appReloadTrigger();
              }
            }
          }
        })
        .catch(() => {});
    }
  }
}

window.storageManager = new StorageManager();
