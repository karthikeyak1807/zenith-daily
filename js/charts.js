/**
 * Zenith Daily - Analytics & Visualization Engine
 * Renders interactive Chart.js widgets and GitHub-style habit activity heatmap.
 * Gracefully handles pure Day 1 empty states.
 */

let categoryDistributionChart = null;
let weeklyTrendChart = null;

function getChartColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    text: isLight ? '#475569' : '#94a3b8',
    grid: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
    empty: isLight ? '#e2e8f0' : '#1e293b',
    work: '#6366f1',
    hobby: '#ec4899',
    health: '#10b981',
    learning: '#f59e0b',
    custom: '#06b6d4'
  };
}

/**
 * Initialize or update the Category Split Doughnut Chart
 */
function renderCategoryDistribution(tasks) {
  const canvas = document.getElementById('categoryChart');
  const emptyNotice = document.getElementById('categoryChartEmpty');
  if (!canvas || !window.Chart) return;

  const counts = {
    work: 0,
    hobby: 0,
    health: 0,
    learning: 0,
    custom: 0
  };

  tasks.forEach(t => {
    if (counts[t.category] !== undefined) {
      counts[t.category]++;
    } else {
      counts.custom++;
    }
  });

  const total = tasks.length;
  const colors = getChartColors();

  if (total === 0) {
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    canvas.classList.add('opacity-20');
  } else {
    if (emptyNotice) emptyNotice.classList.add('hidden');
    canvas.classList.remove('opacity-20');
  }

  const data = total === 0 
    ? [1] 
    : [counts.work, counts.hobby, counts.health, counts.learning, counts.custom];
  const labels = total === 0 
    ? ['Awaiting Tasks'] 
    : ['Works', 'Hobbies', 'Health', 'Learning', 'Other'];
  const backgroundColors = total === 0 
    ? [colors.empty] 
    : [colors.work, colors.hobby, colors.health, colors.learning, colors.custom];

  if (categoryDistributionChart) {
    categoryDistributionChart.data.labels = labels;
    categoryDistributionChart.data.datasets[0].data = data;
    categoryDistributionChart.data.datasets[0].backgroundColor = backgroundColors;
    categoryDistributionChart.update();
    return;
  }

  const ctx = canvas.getContext('2d');
  categoryDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#0f172a',
        hoverOffset: total > 0 ? 6 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: total > 0,
          position: 'bottom',
          labels: {
            color: colors.text,
            font: { family: 'Plus Jakarta Sans', size: 12 },
            padding: 14,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          enabled: total > 0,
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
          padding: 10,
          cornerRadius: 8,
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      cutout: '72%'
    }
  });
}

/**
 * Initialize or update the Weekly Performance Bar/Line Trend Chart
 */
function renderWeeklyTrend(history) {
  const canvas = document.getElementById('weeklyTrendChart');
  if (!canvas || !window.Chart) return;

  const colors = getChartColors();
  
  // Last 7 days
  const last7Days = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = i === 0 ? 'Today' : daysOfWeek[d.getDay()];

    const record = (history || []).find(h => h.date === dateStr);
    last7Days.push({
      label: dayLabel,
      date: dateStr,
      rate: record ? record.rate : 0
    });
  }

  const labels = last7Days.map(d => d.label);
  const data = last7Days.map(d => d.rate);

  if (weeklyTrendChart) {
    weeklyTrendChart.data.labels = labels;
    weeklyTrendChart.data.datasets[0].data = data;
    weeklyTrendChart.update();
    return;
  }

  const ctx = canvas.getContext('2d');
  weeklyTrendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Completion %',
        data,
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        hoverBackgroundColor: '#8b5cf6',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: colors.text,
            callback: value => value + '%',
            font: { family: 'JetBrains Mono', size: 11 }
          },
          grid: { color: colors.grid, drawBorder: false }
        },
        x: {
          ticks: {
            color: colors.text,
            font: { family: 'Plus Jakarta Sans', size: 11 }
          },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13 },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            label: context => `Achieved: ${context.parsed.y}%`
          }
        }
      }
    }
  });
}

/**
 * Render GitHub-Style 35-Day Activity Heatmap Grid
 */
function renderActivityHeatmap(history) {
  const container = document.getElementById('activityHeatmapGrid');
  if (!container) return;

  container.innerHTML = '';
  const today = new Date();
  
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayRecord = (history || []).find(h => h.date === dateStr);
    const rate = dayRecord ? dayRecord.rate : 0;

    let level = '0';
    if (rate > 75) level = '4';
    else if (rate > 50) level = '3';
    else if (rate > 25) level = '2';
    else if (rate > 0) level = '1';

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.setAttribute('data-level', level);
    cell.setAttribute('data-tooltip', i === 0 ? `Today: ${rate}% done` : `${dateStr}: ${rate}% done`);

    container.appendChild(cell);
  }
}

/**
 * Refresh all charts with the latest state
 */
function updateAllAnalytics(tasks, history) {
  renderCategoryDistribution(tasks);
  renderWeeklyTrend(history);
  renderActivityHeatmap(history);
}

// Expose analytics functions globally
window.analyticsEngine = {
  renderCategoryDistribution,
  renderWeeklyTrend,
  renderActivityHeatmap,
  updateAllAnalytics,
  onThemeChange: () => {
    if (categoryDistributionChart) {
      categoryDistributionChart.destroy();
      categoryDistributionChart = null;
    }
    if (weeklyTrendChart) {
      weeklyTrendChart.destroy();
      weeklyTrendChart = null;
    }
    const tasks = window.storageManager.getTasks();
    const history = window.storageManager.getHistory();
    updateAllAnalytics(tasks, history);
  }
};
