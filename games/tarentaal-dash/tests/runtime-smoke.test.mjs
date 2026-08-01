import assert from "node:assert/strict";
import { GAME_CONFIG } from "../js/config.js";
import { createSeededRng, getPhysicsEnvelope } from "../js/obstacles.js";

class ClassList {
  constructor(initial = []) { this.values = new Set(initial); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  toggle(name, force) {
    if (force === true) this.values.add(name);
    else if (force === false) this.values.delete(name);
    else if (this.values.has(name)) this.values.delete(name);
    else this.values.add(name);
    return this.values.has(name);
  }
  contains(name) { return this.values.has(name); }
}

class ElementStub {
  constructor(id = "") {
    this.id = id;
    this.style = {};
    this.classList = new ClassList();
    this.textContent = "";
    this.listeners = new Map();
    this.width = 1280;
    this.height = 720;
  }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(callback);
  }
  setPointerCapture() {}
  requestFullscreen() { return Promise.resolve(); }
  getContext() { return contextStub; }
}

const gradientStub = { addColorStop() {} };
const contextStub = new Proxy({
  createLinearGradient() { return gradientStub; },
  measureText(text) { return { width: String(text).length * 10 }; }
}, {
  get(target, property) {
    if (property in target) return target[property];
    if (typeof property === "symbol") return target[property];
    return () => {};
  },
  set(target, property, value) { target[property] = value; return true; }
});

const ids = [
  "game", "loadingOverlay", "loadingBar", "loadingText", "startOverlay", "gameOverOverlay",
  "pauseOverlay", "upgradeOverlay", "upgradeChoices", "upgradeSubtitle", "startButton", "restartButton", "pauseButton", "musicButton", "soundButton",
  "fullscreenButton", "jumpButton", "duckButton", "actionWarning", "score", "best", "speedLabel",
  "stageLabel", "comboLabel", "comboPill", "shieldLabel", "healthLabel", "talentCount", "cornCount", "potatoCount", "trendFill",
  "intensityFill", "difficultyCaption", "finalScore", "finalRank", "finalCombo", "finalSpeed",
  "finalNear", "finalDuck", "finalSaves", "finalHits", "finalTalents", "finalCorn", "finalPotato"
];
const elements = new Map(ids.map(id => [id, new ElementStub(id)]));
const shell = new ElementStub("shell");

const documentStub = {
  hidden: false,
  fullscreenElement: null,
  querySelector(selector) {
    if (selector === ".game-shell") return shell;
    if (selector.startsWith("#")) return elements.get(selector.slice(1));
    return new ElementStub(selector);
  },
  addEventListener() {},
  exitFullscreen() { return Promise.resolve(); }
};

const localStore = new Map();
const localStorageStub = {
  getItem(key) { return localStore.get(key) ?? null; },
  setItem(key, value) { localStore.set(key, String(value)); }
};

class ImageStub {
  constructor() { this.width = 240; this.height = 160; this.onload = null; this.onerror = null; }
  set src(value) { this._src = value; queueMicrotask(() => this.onload?.()); }
  get src() { return this._src; }
}

class AudioStub {
  constructor(src) { this.src = src; this.loop = false; this.preload = ""; this.volume = 1; }
  play() { return Promise.resolve(); }
  pause() {}
}

const windowStub = {
  addEventListener() {},
  AudioContext: null,
  webkitAudioContext: null
};

Math.random = createSeededRng(8102026);

globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.localStorage = localStorageStub;
globalThis.Image = ImageStub;
globalThis.Audio = AudioStub;
globalThis.requestAnimationFrame = () => 1;
globalThis.performance = { now: () => 1000 };

await import("../js/game.js");
await new Promise(resolve => setTimeout(resolve, 10));

assert.equal(window.__TARENTAAL_V5__.ready, true, "Game should finish loading in the smoke harness");
const game = window.__TARENTAAL_V5__.game;
assert.equal(game.state, "ready");
assert.ok(game.images.background, "Background should be loaded");

game.startRun();
assert.equal(game.state, "running");
let crashDebug = null;
const originalEndGame = game.endGame.bind(game);
game.endGame = () => {
  crashDebug = {
    distance: game.distance,
    speed: game.speed,
    player: game.getPlayerHitbox(),
    obstacles: game.obstacles.map(obstacle => ({
      id: obstacle.id, action: obstacle.action, pattern: obstacle.pattern,
      screenX: obstacle.worldX - game.distance,
      hitbox: game.getObstacleHitbox(obstacle, obstacle.worldX - game.distance),
      passed: obstacle.passed, hitSpent: obstacle.hitSpent
    })).filter(item => item.screenX > 0 && item.screenX < 500)
  };
  originalEndGame();
};

let upgradesChosen = 0;
for (let frame = 0; frame < 8000 && !["crashed", "gameover"].includes(game.state); frame += 1) {
  if (game.state === "upgrade") {
    const choice = game.currentUpgradeChoices[0];
    assert.ok(choice, "Upgrade screens need at least one choice");
    game.chooseUpgrade(choice.id);
    upgradesChosen += 1;
  }
  const upcoming = game.obstacles
    .filter(obstacle => !obstacle.passed && !obstacle.hitSpent && obstacle.worldX + obstacle.width - game.distance > GAME_CONFIG.player.x - 20)
    .sort((a, b) => a.worldX - b.worldX)[0];

  let shouldDuck = false;
  if (upcoming) {
    const screenX = upcoming.worldX - game.distance;
    const leadDistance = screenX - GAME_CONFIG.player.x;

    if (upcoming.action === "jump" && game.player.grounded) {
      let clearSpan = upcoming.width;
      if (upcoming.pattern === "cluster") {
        const cluster = game.obstacles.filter(obstacle =>
          obstacle.groupIndex === upcoming.groupIndex && !obstacle.passed
        );
        if (cluster.length) {
          const first = Math.min(...cluster.map(obstacle => obstacle.worldX));
          const last = Math.max(...cluster.map(obstacle => obstacle.worldX + obstacle.width));
          clearSpan = last - first;
        }
      }
      const envelope = getPhysicsEnvelope(game.speed);
      const triggerFrames = Math.max(7, envelope.airtimeFrames - clearSpan / game.speed - 6);
      const triggerDistance = game.speed * triggerFrames;
      if (leadDistance <= triggerDistance) game.handleJump();
    }

    if (upcoming.action === "duck") {
      let trailingWorld = upcoming.worldX + upcoming.width;
      if (upcoming.pattern === "cluster") {
        const cluster = game.obstacles.filter(obstacle =>
          obstacle.groupIndex === upcoming.groupIndex && !obstacle.passed
        );
        trailingWorld = Math.max(...cluster.map(obstacle => obstacle.worldX + obstacle.width));
      }
      shouldDuck = leadDistance < game.speed * 20 + 120 && trailingWorld - game.distance > GAME_CONFIG.player.x;
    }
  }

  game.handleDuck(shouldDuck);
  if (game.state === "running") game.update(1);
  if (frame % 10 === 0) game.draw();
}

if (game.state !== "running") console.error("AUTOPLAY_CRASH", JSON.stringify(crashDebug, null, 2));
assert.equal(game.state, "running", "A physics-aware autoplay run should survive the generated patterns");
assert.ok(game.distance > 100000, "The autoplay run should cover a long distance");
assert.ok(game.score > 1000, "The score should increase over a long run");
assert.ok(game.scheduler.groupIndex > 35, "Obstacle scheduling should produce many groups");
assert.ok(upgradesChosen >= 3, "A long run should present several talent choices");
assert.equal(game.chosenUpgrades.length, upgradesChosen, "Chosen talents should be recorded");
assert.ok(Number.isFinite(game.speed), "Speed should remain finite");

// Damage should consume Veerharte before ending the run.
const healthBefore = game.health;
game.takeDamage({ groupIndex: -100 });
assert.equal(game.health, healthBefore - 1, "A collision should consume one Veerhart");
assert.equal(game.state, "running", "The first recoverable collision should not end the run");
game.invulnerableFrames = 0;
while (game.health > 0 && game.state === "running") {
  game.takeDamage({ groupIndex: -101 - game.health });
  game.invulnerableFrames = 0;
}
assert.ok(["crashed", "gameover"].includes(game.state), "The last Veerhart should end the run");

console.log(JSON.stringify({
  state: game.state,
  distance: Math.round(game.distance),
  score: Math.round(game.score),
  groups: game.scheduler.groupIndex,
  obstaclesRemaining: game.obstacles.length,
  collectiblesRemaining: game.collectibles.length,
  upgradesChosen,
  damageTaken: game.damageTaken
}, null, 2));
