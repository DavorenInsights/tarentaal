import assert from 'node:assert/strict';

class FakeClassList {
  constructor() { this.items = new Set(); }
  add(...names) { names.forEach(n => this.items.add(n)); }
  remove(...names) { names.forEach(n => this.items.delete(n)); }
  toggle(name, force) {
    if (force === undefined) force = !this.items.has(name);
    force ? this.items.add(name) : this.items.delete(name);
    return force;
  }
  contains(name) { return this.items.has(name); }
}

class FakeElement {
  constructor(id = '') {
    this.id = id; this.textContent = ''; this._innerHTML = ''; this.style = {};
    this.classList = new FakeClassList(); this.children = []; this.listeners = {};
    this.disabled = false; this.offsetWidth = 100; this.costNode = { textContent: '' };
  }
  set innerHTML(value) { this._innerHTML = value; this.children = []; }
  get innerHTML() { return this._innerHTML; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { if (!this.disabled) for (const fn of this.listeners.click || []) fn({ preventDefault() {} }); }
  append(child) { this.children.push(child); }
  querySelector(selector) {
    if (selector === '.choice-cost') return this.costNode;
    if (selector === 'span') return this.children.find(c => c.tagName === 'SPAN') || this.spanNode || (this.spanNode = new FakeElement('span'));
    return null;
  }
  getBoundingClientRect() { return { left: 0, top: 0, width: 128, height: 128 }; }
  setPointerCapture() {}
}

const elements = new Map();
const ids = [
  'game','waveLabel','timerLabel','killLabel','healthFill','healthLabel','xpFill','levelLabel','coinLabel','weaponBar',
  'bossBar','bossName','bossFill','announcement','startOverlay','pauseOverlay','choiceOverlay','choiceEyebrow',
  'choiceTitle','choiceSubtitle','choiceGrid','shopOverlay','shopCoins','shopGrid','resultOverlay','resultEyebrow',
  'resultTitle','resultScore','resultWave','resultKills','resultLevel','resultBest','resultWeapons','soundButton',
  'dashButton','joystick','joystickKnob','startButton','pauseButton','resumeButton','fullscreenButton','nextWaveButton','restartButton'
];
for (const id of ids) elements.set(id, new FakeElement(id));
for (const id of ['pauseOverlay','choiceOverlay','shopOverlay','resultOverlay','bossBar']) elements.get(id).classList.add('hidden');

let drawCalls = 0;
const gradient = { addColorStop() {} };
const context = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
    if (prop === 'measureText') return () => ({ width: 10 });
    return (..._args) => { drawCalls++; };
  },
  set() { return true; }
});
elements.get('game').width = 1280;
elements.get('game').height = 720;
elements.get('game').getContext = () => context;

const documentListeners = {};
globalThis.document = {
  hidden: false, fullscreenElement: null,
  documentElement: { requestFullscreen: async () => {} },
  querySelector(selector) { return elements.get(selector.replace(/^#/, '')) || new FakeElement(selector); },
  createElement() { return new FakeElement(); },
  addEventListener(type, fn) { (documentListeners[type] ||= []).push(fn); },
  exitFullscreen: async () => {}
};
const windowListeners = {};
class FakeAudioContext {
  constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
  resume() {}
  createOscillator() { return { type:'', frequency:{ setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){ return this; }, start(){}, stop(){} }; }
  createGain() { return { gain:{ setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){ return this; } }; }
}
globalThis.window = {
  AudioContext: FakeAudioContext, webkitAudioContext: FakeAudioContext,
  addEventListener(type, fn) { (windowListeners[type] ||= []).push(fn); }
};
globalThis.localStorage = { getItem() { return '0'; }, setItem() {} };
globalThis.Image = class { constructor(){ this.complete=true; this.naturalWidth=100; } set src(_v){} };

const rafQueue = [];
globalThis.requestAnimationFrame = fn => { rafQueue.push(fn); return rafQueue.length; };

await import('../js/game.js');
assert.equal(rafQueue.length, 1, 'game loop should schedule');
elements.get('startButton').click();
assert.equal(elements.get('startOverlay').classList.contains('hidden'), true, 'start overlay should hide');

let now = performance.now();
for (let i = 0; i < 1100; i++) {
  const frame = rafQueue.shift();
  assert.ok(frame, `missing frame ${i}`);
  now += 16.6667;
  frame(now);
  if (!elements.get('choiceOverlay').classList.contains('hidden') && elements.get('choiceGrid').children.length) {
    elements.get('choiceGrid').children[0].click();
  }
}

assert.ok(drawCalls > 1000, 'canvas should render repeatedly');
assert.match(elements.get('waveLabel').textContent, /1 \/ 10/);
assert.notEqual(elements.get('timerLabel').textContent, '0:35', 'wave timer should advance');
assert.ok(Number(elements.get('killLabel').textContent) >= 0);
console.log(JSON.stringify({
  frames: 1100,
  drawCalls,
  wave: elements.get('waveLabel').textContent,
  timer: elements.get('timerLabel').textContent,
  kills: elements.get('killLabel').textContent
}, null, 2));
