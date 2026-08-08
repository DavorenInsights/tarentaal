const clamp01 = value => Math.max(0, Math.min(1, value));

export class AudioManager {
  constructor() {
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.context = null;
    this.mainMusic = new Audio("./assets/audio/dusty_farm_sprint.mp3");
    this.rushMusic = new Audio("./assets/audio/krrr_rush.mp3");
    this.mainMusic.loop = true;
    this.rushMusic.loop = true;
    this.mainMusic.preload = "auto";
    this.rushMusic.preload = "auto";
    this.mainMusic.volume = 0.24;
    this.rushMusic.volume = 0;
    this.rushActive = false;
    this.crashed = false;
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
  playNearMiss() { this.tone(840, 0.10, "triangle", 0.022, 1080); }
  playDuckBonus() { this.tone(510, 0.10, "triangle", 0.025, 760); }
  playShield() { this.tone(760, 0.18, "triangle", 0.044, 390); }
  playStage(stageIndex) { this.tone(500 + stageIndex * 65, 0.20, "triangle", 0.032, 760 + stageIndex * 50); }
  playKrrr() {
    this.tone(265, 0.055, "square", 0.018, 225);
    this.tone(310, 0.055, "square", 0.017, 260, 0.065);
    this.tone(355, 0.075, "triangle", 0.020, 520, 0.13);
  }

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
    try { await this.mainMusic.play(); } catch { /* Autoplay waits for the next user gesture. */ }
    if (this.rushActive) {
      try { await this.rushMusic.play(); } catch { /* Same gesture policy as the main theme. */ }
    }
  }

  pauseMusic() {
    this.mainMusic.pause();
    this.rushMusic.pause();
  }

  setRush(active) {
    const next = Boolean(active);
    if (next === this.rushActive) return;
    this.rushActive = next;
    if (next) {
      try { this.rushMusic.currentTime = 0; } catch { /* Some test/audio stubs omit currentTime. */ }
      if (this.musicEnabled) {
        const attempt = this.rushMusic.play();
        attempt?.catch?.(() => {});
      }
    }
  }

  update(dt = 1) {
    const response = clamp01(0.09 * dt);
    const mainTarget = this.crashed ? 0.10 : this.rushActive ? 0.075 : 0.24;
    const rushTarget = this.crashed ? 0.04 : this.rushActive ? 0.30 : 0;
    this.mainMusic.volume += (mainTarget - this.mainMusic.volume) * response;
    this.rushMusic.volume += (rushTarget - this.rushMusic.volume) * response;
    if (!this.rushActive && this.rushMusic.volume < 0.006) {
      this.rushMusic.volume = 0;
      this.rushMusic.pause();
    }
  }

  setCrashed(crashed) {
    this.crashed = Boolean(crashed);
    if (this.crashed) this.setRush(false);
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
