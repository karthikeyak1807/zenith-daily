# 🌟 Zenith Daily — Premium Daily Task & Hobby Tracker

> An astonishing, aesthetic daily task and habit tracker website engineered for creative balance between **Professional Works** and **Passionate Hobbies**.

---

## ✨ Key Features

1. **🎨 Astonishing Glassmorphic & Aurora Design**:
   - Dynamic animated aurora mesh background with luminous orbs.
   - Smooth glassmorphism cards (`backdrop-filter: blur(20px)`), frosted borders, and vibrant neon accents.
   - Dark Mode / Light Mode with seamless theme transition.
   - Typography powered by Google Fonts (*Outfit*, *Plus Jakarta Sans*, *JetBrains Mono*).

2. **💼 Works & 🎨 Hobbies Separation**:
   - Real-time category filtering: **All**, **Works**, **Hobbies**, **Health & Habits**, and **Learning**.
   - Custom priority badges (High, Medium, Low) and preferred time slots (Morning, Afternoon, Evening).
   - Target duration badges for each task.

3. **🔥 Daily Streak & Automatic Rollover Engine**:
   - Flame streak tracking (`🔥 X days`) per habit and overall.
   - Smart daily rollover: automatically archives yesterday's completion stats into your history log, preserves streaks, and resets checkboxes for a fresh new day.

4. **🎉 Audio Synthesizer & Celebrations**:
   - Zero-dependency procedural Web Audio API sounds: pleasant tactile clicks, harmonic chord chimes on completion, and victory fanfares.
   - Full Canvas Confetti particle explosions on milestone completions.
   - Built-in audio mute toggle.

5. **⏱️ Built-in Focus / Pomodoro Companion**:
   - Launch focus sessions (25m Pomodoro, 45m Deep Work, 15m Quick Flow) directly linked to any task card.
   - Automatically checks off the task and celebrates when the timer reaches zero!

6. **📊 Analytics & Activity Heatmap**:
   - **Work vs. Hobby Balance**: Interactive Chart.js doughnut chart.
   - **7-Day Consistency Trend**: Daily completion percentage bar chart.
   - **GitHub-Style 35-Day Heatmap**: Visual contribution grid tracking habit consistency over time.

7. **💾 100% Local, Private & Portable**:
   - Zero servers required; all data stays safely in your browser's `localStorage`.
   - Export full JSON backups anytime and restore them with 1 click.
   - "Reset Today" button to quickly start fresh or test.

---

## 🚀 How to Run

### Option 1: One-Click Python Launcher (Recommended)
Open a terminal in this folder and run:
```bash
python serve.py
```
This starts the local web server and **automatically opens your default browser** to `http://localhost:8000`.

### Option 2: Direct Browser Launch
Simply double-click `index.html` in your file explorer to open it in Chrome, Edge, Firefox, or Safari!

---

## 📁 Project Structure

```
daily-task-checker/
│
├── index.html          # Main HTML5 application shell & UI modals
├── css/
│   └── styles.css      # Aurora mesh, glassmorphic tokens, animations
├── js/
│   ├── app.js          # Core app controller, UI events, search & filters
│   ├── audio.js        # Web Audio API sound synthesizer
│   ├── storage.js      # LocalStorage manager, daily rollover & streaks
│   └── charts.js       # Chart.js analytics & GitHub-style heatmap
├── serve.py            # Local development server with auto-browser launch
└── README.md           # Documentation and guide
```
