/**
 * Zenith Daily - Procedural Audio Engine (Web Audio API)
 * Synthesizes delightful UI feedback without external audio asset dependencies.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem('zenith_sound_muted') === 'true';
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('zenith_sound_muted', this.muted);
    return this.muted;
  }

  /**
   * Crisp UI Button Click
   */
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Uplifting harmonic chime on task check
   */
  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord

    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0, now + idx * 0.045);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.045 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.5);
    });
  }

  /**
   * Triumphant fanfare for 100% daily completion
   */
  playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    // Harmonic progression: G4, C5, E5, G5, C6
    const chordSeq = [
      { f: 392.00, t: 0.0 },
      { f: 523.25, t: 0.1 },
      { f: 659.25, t: 0.2 },
      { f: 783.99, t: 0.32 },
      { f: 1046.50, t: 0.48 }
    ];

    chordSeq.forEach(item => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(item.f, now + item.t);

      gain.gain.setValueAtTime(0, now + item.t);
      gain.gain.linearRampToValueAtTime(0.15, now + item.t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + item.t + 0.7);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + item.t);
      osc.stop(now + item.t + 0.75);
    });
  }

  /**
   * Soft timer completion bell
   */
  playTimerComplete() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const freqs = [880, 1320, 1760]; // A5 chime harmonics

    freqs.forEach(freq => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  }
}

// Global Sound Instance
window.soundEngine = new SoundEngine();
