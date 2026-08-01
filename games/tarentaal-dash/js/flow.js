export class FlowMeter {
  constructor(config = {}) {
    this.max = config.max ?? 100;
    this.durationFrames = config.durationFrames ?? 390;
    this.decayPerFrame = config.decayPerFrame ?? 0.045;
    this.cooldownFrames = config.cooldownFrames ?? 105;
    this.reset();
  }

  reset() {
    this.value = 0;
    this.activeFrames = 0;
    this.cooldown = 0;
    this.activations = 0;
    this.justActivated = false;
    this.justEnded = false;
  }

  get active() { return this.activeFrames > 0; }
  get ratio() { return this.active ? 1 : Math.max(0, Math.min(1, this.value / this.max)); }
  get scoreMultiplier() { return this.active ? 2 : 1; }

  add(amount) {
    if (this.active || amount <= 0) return false;
    this.value = Math.min(this.max, this.value + amount);
    this.cooldown = this.cooldownFrames;
    if (this.value >= this.max) {
      this.value = this.max;
      this.activeFrames = this.durationFrames;
      this.activations += 1;
      this.justActivated = true;
      return true;
    }
    return false;
  }

  break() {
    this.value = 0;
    this.activeFrames = 0;
    this.cooldown = 0;
    this.justEnded = false;
  }

  update(dt = 1) {
    this.justActivated = false;
    this.justEnded = false;
    if (this.activeFrames > 0) {
      this.activeFrames = Math.max(0, this.activeFrames - dt);
      if (this.activeFrames === 0) {
        this.value = 0;
        this.cooldown = this.cooldownFrames;
        this.justEnded = true;
      }
      return;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.cooldown <= 0 && this.value > 0) {
      this.value = Math.max(0, this.value - this.decayPerFrame * dt);
    }
  }
}
