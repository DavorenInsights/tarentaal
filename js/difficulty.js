import { GAME_CONFIG, DIFFICULTY_STAGES } from "./config.js";

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;

export function getStage(trend) {
  let stage = DIFFICULTY_STAGES[0];
  for (const candidate of DIFFICULTY_STAGES) {
    if (trend >= candidate.threshold) stage = candidate;
  }
  return stage;
}

export class DifficultyDirector {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.elapsedFrames = 0;
    this.currentIntensity = 0.08;
    this.targetIntensity = 0.08;
    this.refreshFrames = 1;
    this.event = "normal";
    this.stage = getStage(0);
  }

  update(dt) {
    this.elapsedFrames += dt;
    this.refreshFrames -= dt;

    const trend = this.trend;
    if (this.refreshFrames <= 0) this.#chooseIntensityTarget(trend);

    const smoothing = 1 - Math.pow(1 - GAME_CONFIG.difficulty.intensitySmoothing, dt);
    this.currentIntensity = lerp(this.currentIntensity, this.targetIntensity, smoothing);
    this.stage = getStage(trend);
    return this.snapshot;
  }

  #chooseIntensityTarget(trend) {
    const config = GAME_CONFIG.difficulty;
    const noise = (this.rng() - 0.5) * 0.40;
    const calm = this.rng() < config.calmChance;
    const surge = !calm && this.rng() < config.surgeChanceBase + trend * config.surgeChanceTrend;

    let target = 0.09 + trend * 0.78 + noise;
    this.event = "normal";

    if (calm) {
      target -= 0.22 + this.rng() * 0.15;
      this.event = "calm";
    } else if (surge) {
      target += 0.20 + this.rng() * 0.20;
      this.event = "surge";
    }

    this.targetIntensity = clamp(target, 0.04, 1);
    this.refreshFrames = lerp(
      config.intensityRefreshMinFrames,
      config.intensityRefreshMaxFrames,
      this.rng()
    );
  }

  get elapsedSeconds() {
    return this.elapsedFrames / 60;
  }

  get trend() {
    return clamp(this.elapsedSeconds / GAME_CONFIG.difficulty.trendSeconds);
  }

  get speed() {
    const config = GAME_CONFIG.difficulty;
    const curve = 1 - Math.exp(-this.elapsedSeconds / config.speedTimeConstant);
    return lerp(config.baseSpeed, config.maxSpeed, clamp(curve));
  }

  get snapshot() {
    return Object.freeze({
      elapsedSeconds: this.elapsedSeconds,
      trend: this.trend,
      intensity: clamp(this.currentIntensity),
      targetIntensity: this.targetIntensity,
      speed: this.speed,
      event: this.event,
      stage: this.stage
    });
  }
}
