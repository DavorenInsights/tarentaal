export class AudioManager {
  constructor() {
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.context = null;
    this.music = new Audio("./assets/audio/dusty_farm_sprint.mp3");
    this.music.loop = true;
    this.music.preload = "auto";
    this.music.volume = 0.24;
  }

  ensureContext() {
    if (!this.sfxEnabled) return null;
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      this.context = new Context();
    }
    if (this.context.state === "suspended") void this.context.resume();
    return this.context;
  }

  tone(frequency, duration, type = "sine", volume = 0.025, endFrequency = null, delay = 0) {
    const context = this.ensureContext();
    if (!context) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== null) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  playJump() { this.tone(420, 0.12, "triangle", 0.034, 680); }
  playCrash() { this.tone(185, 0.20, "sawtooth", 0.050, 65); }
  playDamage() { this.tone(240, 0.13, "sawtooth", 0.040, 110); this.tone(115, 0.16, "triangle", 0.028, 75, 0.05); }
  playUpgrade() { this.tone(460, 0.12, "triangle", 0.030, 720); this.tone(720, 0.16, "triangle", 0.026, 1080, 0.08); }
  playNearMiss() { this.tone(840, 0.10, "triangle", 0.022, 1080); }
  playDuckBonus() { this.tone(510, 0.10, "triangle", 0.025, 760); }
  playShield() { this.tone(760, 0.18, "triangle", 0.044, 390); }
  playStage(stageIndex) { this.tone(500 + stageIndex * 65, 0.20, "triangle", 0.032, 760 + stageIndex * 50); }

  playCollect(type) {
    if (type === "corn") {
      this.tone(700, 0.075, "square", 0.024, 900);
      this.tone(920, 0.065, "triangle", 0.018, 1180, 0.035);
    } else if (type === "potato") {
      this.tone(320, 0.09, "triangle", 0.028, 520);
      this.tone(520, 0.11, "triangle", 0.022, 790, 0.045);
    } else {
      this.tone(520, 0.22, "sine", 0.035, 980);
      this.tone(780, 0.16, "triangle", 0.022, 1220, 0.08);
    }
  }

  async playMusic() {
    if (!this.musicEnabled) return;
    try { await this.music.play(); } catch { /* Autoplay waits for the next user gesture. */ }
  }

  pauseMusic() { this.music.pause(); }

  setCrashed(crashed) {
    this.music.volume = crashed ? 0.10 : 0.24;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) void this.playMusic();
    else this.pauseMusic();
    return this.musicEnabled;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}
