const NOTES = [196, 247, 294, 247, 220, 261, 330, 261];

export default class AudioManager {
  constructor() {
    this.enabled = true;
    this.context = null;
    this.musicTimer = null;
    this.noteIndex = 0;
  }

  getContext() {
    if (!this.enabled) return null;
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  tone(frequency, duration = 0.12, type = 'triangle', volume = 0.06, endFrequency = frequency) {
    const context = this.getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  startMusic() {
    if (!this.enabled || this.musicTimer) return;
    this.getContext();
    this.musicTimer = window.setInterval(() => {
      if (!this.enabled) return;
      const note = NOTES[this.noteIndex % NOTES.length];
      this.noteIndex += 1;
      this.tone(note, 0.32, 'sine', 0.022, note * 1.004);
      if (this.noteIndex % 4 === 0) this.tone(note / 2, 0.4, 'triangle', 0.015, note / 2);
    }, 360);
  }

  play(name) {
    if (!this.enabled) return;
    if (name === 'jump') this.tone(300, 0.18, 'triangle', 0.07, 610);
    else if (name === 'collect') this.tone(540, 0.14, 'sine', 0.08, 950);
    else if (name === 'crash') this.tone(180, 0.35, 'sawtooth', 0.1, 48);
    else if (name === 'click') this.tone(440, 0.07, 'sine', 0.035, 520);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  dispose() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.context?.close();
    this.context = null;
  }
}
