/**
 * Zenith Daily - Core Application Controller (Clean Production Engine)
 * Pure Day 1 startup with zero mock data.
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentCategory = 'all';
  let currentStatus = 'all'; // 'all', 'active', 'completed'
  let searchQuery = '';
  let editingTaskId = null;

  // Focus Timer State
  let activeFocusTaskId = null;
  let timerDuration = 25 * 60; // 25 minutes default
  let timerRemaining = 25 * 60;
  let timerInterval = null;
  let timerIsRunning = false;

  // Quotes Collection
  const MOTIVATIONAL_QUOTES = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" }
  ];

  // DOM Elements
  const taskListEl = document.getElementById('taskList');
  const emptyStateEl = document.getElementById('emptyState');
  const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
  const emptyStateBlueprintBtn = document.getElementById('emptyStateBlueprintBtn');
  const searchInputEl = document.getElementById('taskSearchInput');
  const progressRingCircle = document.getElementById('progressRingCircle');
  const progressPercentEl = document.getElementById('progressPercent');
  const progressCountEl = document.getElementById('progressCount');
  const heroGreetingEl = document.getElementById('heroGreeting');
  const heroQuoteEl = document.getElementById('heroQuote');
  const streakCountBadgeEl = document.getElementById('streakCountBadge');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconEl = document.getElementById('soundIcon');
  const themeIconEl = document.getElementById('themeIcon');
  const realTimeClockEl = document.getElementById('realTimeClock');
  const currentDateEl = document.getElementById('currentDateDisplay');

  // Modals
  const taskModal = document.getElementById('taskModal');
  const taskModalTitle = document.getElementById('taskModalTitle');
  const taskForm = document.getElementById('taskForm');
  const openAddTaskBtn = document.getElementById('openAddTaskBtn');
  const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
  const cancelTaskModalBtn = document.getElementById('cancelTaskModalBtn');

  // Focus Companion Modal
  const focusModal = document.getElementById('focusModal');
  const closeFocusModalBtn = document.getElementById('closeFocusModalBtn');
  const focusTaskTitleEl = document.getElementById('focusTaskTitle');
  const timerDisplayEl = document.getElementById('timerDisplay');
  const timerStartPauseBtn = document.getElementById('timerStartPauseBtn');
  const timerResetBtn = document.getElementById('timerResetBtn');
  const timerModeBtns = document.querySelectorAll('.timer-mode-btn');

  // Data Actions
  const resetTodayBtn = document.getElementById('resetTodayBtn');
  const loadBlueprintBtn = document.getElementById('loadBlueprintBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  const importDataBtn = document.getElementById('importDataBtn');

  // Initialize App
  initClockAndDate();
  initTheme();
  initSoundUI();
  initQuote();
  renderCategoryTabs();
  renderTasks();
  updateProgressGauge();
  updateAnalytics();

  // Attach Event Listeners
  attachEventListeners();

  /* ==========================================================================
     Clock & Date Engine
     ========================================================================== */
  function initClockAndDate() {
    function update() {
      const now = new Date();
      if (realTimeClockEl) {
        realTimeClockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }

      // Dynamic Greeting
      const hour = now.getHours();
      let greeting = 'Good morning';
      if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
      else if (hour >= 17) greeting = 'Good evening';

      if (heroGreetingEl) {
        heroGreetingEl.textContent = `${greeting}, Ready to Thrive?`;
      }
    }
    update();
    setInterval(update, 1000);
  }

  function initQuote() {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    if (heroQuoteEl) {
      heroQuoteEl.innerHTML = `"${randomQuote.text}" <span class="opacity-75 block text-xs mt-1">— ${randomQuote.author}</span>`;
    }
  }

  /* ==========================================================================
     Theme & Sound Controls
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem('zenith_theme_v1') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    if (!themeIconEl) return;
    if (theme === 'light') {
      themeIconEl.setAttribute('data-lucide', 'sun');
    } else {
      themeIconEl.setAttribute('data-lucide', 'moon');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function toggleTheme() {
    window.soundEngine.playClick();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('zenith_theme_v1', newTheme);
    updateThemeIcon(newTheme);

    if (window.analyticsEngine) {
      window.analyticsEngine.onThemeChange();
    }
  }

  function initSoundUI() {
    const isMuted = window.soundEngine.isMuted();
    updateSoundIcon(isMuted);
  }

  function updateSoundIcon(isMuted) {
    if (!soundIconEl) return;
    if (isMuted) {
      soundIconEl.setAttribute('data-lucide', 'volume-x');
    } else {
      soundIconEl.setAttribute('data-lucide', 'volume-2');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  /* ==========================================================================
     Category Tabs
     ========================================================================== */
  function renderCategoryTabs() {
    const container = document.getElementById('categoryTabsContainer');
    if (!container) return;

    const categories = window.storageManager.getCategories();
    const tasks = window.storageManager.getTasks();

    container.innerHTML = '';

    categories.forEach(cat => {
      let count = 0;
      if (cat.id === 'all') {
        count = tasks.length;
      } else {
        count = tasks.filter(t => t.category === cat.id).length;
      }

      const btn = document.createElement('button');
      btn.className = `category-tab px-4 py-2 text-xs md:text-sm font-medium flex items-center gap-2 border transition-all ${
        currentCategory === cat.id
          ? 'active text-white border-transparent'
          : 'glass-pill text-slate-400 hover:text-white border-white/10'
      }`;
      btn.innerHTML = `
        <i data-lucide="${cat.icon || 'folder'}" class="w-3.5 h-3.5"></i>
        <span>${cat.name}</span>
        <span class="tab-badge text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/10">${count}</span>
      `;

      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        currentCategory = cat.id;
        renderCategoryTabs();
        renderTasks();
      });

      container.appendChild(btn);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  /* ==========================================================================
     Task List Rendering & Management
     ========================================================================== */
  function renderTasks() {
    if (!taskListEl) return;

    let tasks = window.storageManager.getTasks();

    // Category Filter
    if (currentCategory !== 'all') {
      tasks = tasks.filter(t => t.category === currentCategory);
    }

    // Status Filter
    if (currentStatus === 'active') {
      tasks = tasks.filter(t => !t.completed);
    } else if (currentStatus === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    taskListEl.innerHTML = '';

    if (tasks.length === 0) {
      if (emptyStateEl) emptyStateEl.classList.remove('hidden');
      return;
    } else {
      if (emptyStateEl) emptyStateEl.classList.add('hidden');
    }

    // Sort: incomplete first, then by priority
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    });

    tasks.forEach(task => {
      const card = createTaskCardElement(task);
      taskListEl.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'is-completed' : ''}`;
    card.setAttribute('data-category', task.category);
    card.setAttribute('data-id', task.id);

    // Badges & styling
    const categoryLabels = {
      work: { text: 'Work', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      hobby: { text: 'Hobby', class: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
      health: { text: 'Health', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      learning: { text: 'Learning', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      custom: { text: 'Custom', class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' }
    };

    const priorityBadges = {
      high: '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/20">High</span>',
      medium: '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20">Med</span>',
      low: '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/20">Low</span>'
    };

    const catBadge = categoryLabels[task.category] || categoryLabels.custom;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <!-- Checkbox & Title -->
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div class="zenith-checkbox-container pt-0.5" data-action="toggle">
            <div class="zenith-checkbox ${task.completed ? 'checked' : ''}">
              <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 8 6.5 11.5 13 4.5"></polyline>
              </svg>
            </div>
          </div>

          <div class="flex-1 min-w-0 cursor-pointer" data-action="toggle">
            <div class="flex items-center flex-wrap gap-2 mb-1">
              <span class="text-xs px-2 py-0.5 rounded-full border font-medium ${catBadge.class}">
                ${task.customCategoryName || catBadge.text}
              </span>
              ${priorityBadges[task.priority] || ''}
              
              ${task.streak > 0 ? `
                <span class="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <i data-lucide="flame" class="w-3 h-3 text-amber-400 fill-amber-400/50"></i>
                  ${task.streak}d streak
                </span>
              ` : ''}
            </div>

            <h3 class="task-title font-semibold text-sm md:text-base text-slate-100 transition-colors leading-snug">
              ${escapeHtml(task.title)}
            </h3>

            ${task.description ? `
              <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                ${escapeHtml(task.description)}
              </p>
            ` : ''}

            <!-- Meta info: Target time & slot -->
            <div class="flex items-center gap-3 mt-2.5 text-[11px] text-slate-400 font-medium">
              <span class="flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3"></i>
                ${task.targetMinutes || 30} mins
              </span>
              <span class="flex items-center gap-1 capitalize">
                <i data-lucide="sun-medium" class="w-3 h-3"></i>
                ${task.timeOfDay || 'Anytime'}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <!-- Focus Pomodoro Button -->
          <button class="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors" data-action="focus" data-tooltip="Focus Timer">
            <i data-lucide="timer" class="w-4 h-4"></i>
          </button>
          <!-- Edit Button -->
          <button class="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors" data-action="edit" data-tooltip="Edit Habit">
            <i data-lucide="pencil" class="w-4 h-4"></i>
          </button>
          <!-- Delete Button -->
          <button class="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors" data-action="delete" data-tooltip="Delete">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    // Click handler for task actions
    card.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      const action = actionBtn.getAttribute('data-action');
      if (action === 'toggle') {
        handleTaskToggle(task.id, card);
      } else if (action === 'focus') {
        openFocusCompanion(task);
      } else if (action === 'edit') {
        openEditTaskModal(task);
      } else if (action === 'delete') {
        handleTaskDelete(task.id, card);
      }
    });

    return card;
  }

  function handleTaskToggle(taskId, cardEl) {
    const updated = window.storageManager.toggleTaskCompletion(taskId);
    if (!updated) return;

    if (updated.completed) {
      window.soundEngine.playSuccess();
      // Check if all tasks completed!
      const allTasks = window.storageManager.getTasks();
      const allDone = allTasks.length > 0 && allTasks.every(t => t.completed);

      if (allDone) {
        window.soundEngine.playFanfare();
        triggerSuperCelebration();
      } else {
        triggerCardConfetti(cardEl);
      }
    } else {
      window.soundEngine.playClick();
    }

    renderTasks();
    renderCategoryTabs();
    updateProgressGauge();
    updateAnalytics();
  }

  function handleTaskDelete(taskId, cardEl) {
    window.soundEngine.playClick();
    cardEl.style.transition = 'all 0.3s ease';
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'scale(0.9)';

    setTimeout(() => {
      window.storageManager.deleteTask(taskId);
      renderTasks();
      renderCategoryTabs();
      updateProgressGauge();
      updateAnalytics();
    }, 280);
  }

  /* ==========================================================================
     Progress Gauge & Milestones
     ========================================================================== */
  function updateProgressGauge() {
    const tasks = window.storageManager.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (progressPercentEl) {
      progressPercentEl.textContent = `${percent}%`;
    }
    if (progressCountEl) {
      progressCountEl.textContent = total === 0 ? '0 finished' : `${completed} of ${total} finished`;
    }

    const circumference = 2 * Math.PI * 42;
    if (progressRingCircle) {
      progressRingCircle.style.strokeDasharray = `${circumference}`;
      const offset = circumference - (percent / 100) * circumference;
      progressRingCircle.style.strokeDashoffset = offset;
    }

    // Update global streak badge
    const streak = window.storageManager.getOverallStreak();
    if (streakCountBadgeEl) {
      streakCountBadgeEl.innerHTML = `
        <i data-lucide="flame" class="w-4 h-4 text-amber-400 fill-amber-400/80 animate-pulse"></i>
        <span>${streak} Day Streak</span>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function updateAnalytics() {
    if (!window.analyticsEngine) return;
    const tasks = window.storageManager.getTasks();
    const history = window.storageManager.getHistory();
    window.analyticsEngine.updateAllAnalytics(tasks, history);
  }

  /* ==========================================================================
     Confetti Celebrations
     ========================================================================== */
  function triggerCardConfetti(cardEl) {
    if (typeof confetti !== 'function') return;
    const rect = cardEl.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 32,
      spread: 60,
      origin: { x, y },
      colors: ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'],
      disableForReducedMotion: true
    });
  }

  function triggerSuperCelebration() {
    if (typeof confetti !== 'function') return;

    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 40 * (timeLeft / duration);
      confetti({
        particleCount,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors: ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#fbbf24']
      });
    }, 250);
  }

  /* ==========================================================================
     Task Modal (Add / Edit)
     ========================================================================== */
  function openAddTaskModal() {
    window.soundEngine.playClick();
    editingTaskId = null;
    taskModalTitle.textContent = 'Add Daily Habit or Task';
    taskForm.reset();
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskCategory').value = currentCategory !== 'all' ? currentCategory : 'work';
    document.getElementById('taskTime').value = 'morning';
    document.getElementById('taskMinutes').value = '30';
    taskModal.classList.remove('hidden');
    document.getElementById('taskTitle').focus();
  }

  function openEditTaskModal(task) {
    window.soundEngine.playClick();
    editingTaskId = task.id;
    taskModalTitle.textContent = 'Edit Daily Habit or Task';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskTime').value = task.timeOfDay || 'anytime';
    document.getElementById('taskMinutes').value = task.targetMinutes || 30;
    taskModal.classList.remove('hidden');
    document.getElementById('taskTitle').focus();
  }

  function closeTaskModal() {
    window.soundEngine.playClick();
    taskModal.classList.add('hidden');
    editingTaskId = null;
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return;

    const taskData = {
      title,
      description: document.getElementById('taskDescription').value.trim(),
      category: document.getElementById('taskCategory').value,
      priority: document.getElementById('taskPriority').value,
      timeOfDay: document.getElementById('taskTime').value,
      targetMinutes: parseInt(document.getElementById('taskMinutes').value, 10) || 30
    };

    if (editingTaskId) {
      window.storageManager.updateTask(editingTaskId, taskData);
    } else {
      window.storageManager.addTask(taskData);
    }

    window.soundEngine.playSuccess();
    closeTaskModal();
    renderTasks();
    renderCategoryTabs();
    updateProgressGauge();
    updateAnalytics();
  }

  /* ==========================================================================
     Focus / Pomodoro Companion Engine
     ========================================================================== */
  function openFocusCompanion(task) {
    window.soundEngine.playClick();
    activeFocusTaskId = task ? task.id : null;
    focusTaskTitleEl.textContent = task ? task.title : 'Zenith Deep Focus';

    const minutes = task && task.targetMinutes ? task.targetMinutes : 25;
    setTimerDuration(minutes * 60);

    focusModal.classList.remove('hidden');
  }

  function closeFocusCompanion() {
    window.soundEngine.playClick();
    pauseTimer();
    focusModal.classList.add('hidden');
  }

  function setTimerDuration(seconds) {
    pauseTimer();
    timerDuration = seconds;
    timerRemaining = seconds;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const mins = Math.floor(timerRemaining / 60);
    const secs = timerRemaining % 60;
    timerDisplayEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function startTimer() {
    if (timerIsRunning) return;
    window.soundEngine.playClick();
    timerIsRunning = true;
    timerDisplayEl.classList.add('timer-pulsing');
    timerStartPauseBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4"></i> Pause';
    if (window.lucide) window.lucide.createIcons();

    timerInterval = setInterval(() => {
      timerRemaining--;
      updateTimerDisplay();

      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerIsRunning = false;
        timerDisplayEl.classList.remove('timer-pulsing');
        window.soundEngine.playTimerComplete();

        if (activeFocusTaskId) {
          window.storageManager.toggleTaskCompletion(activeFocusTaskId);
          renderTasks();
          renderCategoryTabs();
          updateProgressGauge();
          updateAnalytics();
          triggerSuperCelebration();
        }

        alert('Focus session complete! Outstanding work.');
        timerStartPauseBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4"></i> Start';
        if (window.lucide) window.lucide.createIcons();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!timerIsRunning) return;
    window.soundEngine.playClick();
    clearInterval(timerInterval);
    timerIsRunning = false;
    timerDisplayEl.classList.remove('timer-pulsing');
    timerStartPauseBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4"></i> Start';
    if (window.lucide) window.lucide.createIcons();
  }

  function resetTimer() {
    window.soundEngine.playClick();
    pauseTimer();
    timerRemaining = timerDuration;
    updateTimerDisplay();
  }

  /* ==========================================================================
     Event Listeners Attachment
     ========================================================================== */
  function attachEventListeners() {
    // Theme & Sound
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        updateSoundIcon(isMuted);
      });
    }

    // Search Input
    if (searchInputEl) {
      searchInputEl.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTasks();
      });
    }

    // Status Filter Tabs
    const statusTabs = document.querySelectorAll('.status-filter-btn');
    statusTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        statusTabs.forEach(b => b.classList.remove('active', 'text-indigo-400', 'border-indigo-500/40'));
        btn.classList.add('active', 'text-indigo-400', 'border-indigo-500/40');
        currentStatus = btn.getAttribute('data-status');
        renderTasks();
      });
    });

    // Task Modal triggers
    if (openAddTaskBtn) openAddTaskBtn.addEventListener('click', openAddTaskModal);
    if (emptyStateAddBtn) emptyStateAddBtn.addEventListener('click', openAddTaskModal);
    if (closeTaskModalBtn) closeTaskModalBtn.addEventListener('click', closeTaskModal);
    if (cancelTaskModalBtn) cancelTaskModalBtn.addEventListener('click', closeTaskModal);
    if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);

    // Day 1 Blueprint Loaders
    const loadBlueprintAction = () => {
      if (confirm("Load the 5-Pillar 'Balanced Person' Blueprint? This sets up high-impact works, hobbies, and health habits starting with 0 streaks for Day 1.")) {
        window.soundEngine.playSuccess();
        window.storageManager.loadDayOneBlueprint();
        renderTasks();
        renderCategoryTabs();
        updateProgressGauge();
        updateAnalytics();
      }
    };

    if (emptyStateBlueprintBtn) emptyStateBlueprintBtn.addEventListener('click', loadBlueprintAction);
    if (loadBlueprintBtn) loadBlueprintBtn.addEventListener('click', loadBlueprintAction);

    // Focus Timer triggers
    if (closeFocusModalBtn) closeFocusModalBtn.addEventListener('click', closeFocusCompanion);
    if (timerStartPauseBtn) {
      timerStartPauseBtn.addEventListener('click', () => {
        if (timerIsRunning) pauseTimer();
        else startTimer();
      });
    }
    if (timerResetBtn) timerResetBtn.addEventListener('click', resetTimer);

    timerModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        timerModeBtns.forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
        btn.classList.add('bg-indigo-600', 'text-white');
        const minutes = parseInt(btn.getAttribute('data-time'), 10);
        setTimerDuration(minutes * 60);
      });
    });

    // Data Management Buttons
    if (resetTodayBtn) {
      resetTodayBtn.addEventListener('click', () => {
        if (confirm("Reset today's checks to uncompleted? (Streaks are preserved)")) {
          window.soundEngine.playClick();
          window.storageManager.resetToday();
          renderTasks();
          renderCategoryTabs();
          updateProgressGauge();
          updateAnalytics();
        }
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm("Clear all habits and history? This resets to a completely empty, pristine canvas.")) {
          window.soundEngine.playClick();
          window.storageManager.clearAllData();
          renderTasks();
          renderCategoryTabs();
          updateProgressGauge();
          updateAnalytics();
        }
      });
    }

    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        const json = window.storageManager.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith-tasks-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    if (importDataBtn && importFileInput) {
      importDataBtn.addEventListener('click', () => {
        importFileInput.click();
      });

      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const success = window.storageManager.importData(event.target.result);
          if (success) {
            window.soundEngine.playSuccess();
            alert('Data restored successfully!');
            renderTasks();
            renderCategoryTabs();
            updateProgressGauge();
            updateAnalytics();
          } else {
            alert('Invalid backup file. Please ensure it is a valid Zenith JSON backup.');
          }
        };
        reader.readAsText(file);
      });
    }

    // Keyboard Shortcuts (Esc closes modals)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!taskModal.classList.contains('hidden')) closeTaskModal();
        if (!focusModal.classList.contains('hidden')) closeFocusCompanion();
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
