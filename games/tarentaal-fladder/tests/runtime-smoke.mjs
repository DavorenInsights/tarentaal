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
    this.id = id;
    this.textContent = '';
    this.style = {};
    this.classList = new FakeClassList();
    this.listeners = {};
    this.offsetWidth = 100;
    this.width = 1280;
    this.height = 720;
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { for (const fn of this.listeners.click || []) fn({ preventDefault(){}, stopPropagation(){} }); }
  pointerDown() { for (const fn of this.listeners.pointerdown || []) fn({ preventDefault(){}, stopPropagation(){} }); }
}

const ids = [
  'game','scoreLabel','cornLabel','bestLabel','staminaLabel','staminaFill','shieldPill','announcement',
  'startOverlay','pauseOverlay','resultOverlay','resultEyebrow','resultTitle','resultScore','resultBest',
  'resultCorn','resultNear','resultDistance','medal','medalText','soundButton','startButton','pauseButton',
  'resumeButton','fullscreenButton','restartButton','flapButton'
];
const elements = new Map(ids.map(id => [id,new FakeElement(id)]));
for (const id of ['pauseOverlay','resultOverlay','shieldPill','announcement']) elements.get(id).classList.add('hidden');

let drawCalls = 0;
const gradient = { addColorStop() {} };
const context = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
    if (prop === 'measureText') return () => ({ width:10 });
    return (..._args) => { drawCalls++; };
  },
  set() { return true; }
});
elements.get('game').getContext = () => context;

const documentListeners = {};
globalThis.document = {
  hidden:false,
  fullscreenElement:null,
  documentElement:{ requestFullscreen:async()=>{} },
  querySelector(selector) { return elements.get(selector.replace(/^#/,'')) || new FakeElement(selector); },
  addEventListener(type,fn) { (documentListeners[type] ||= []).push(fn); },
  exitFullscreen:async()=>{}
};

const windowListeners = {};
class FakeAudioContext {
  constructor() { this.currentTime=0; this.state='running'; this.destination={}; }
  resume() {}
  createOscillator() { return { type:'', frequency:{ setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){return this;}, start(){}, stop(){} }; }
  createGain() { return { gain:{ setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){return this;} }; }
}
globalThis.window = {
  AudioContext:FakeAudioContext,
  webkitAudioContext:FakeAudioContext,
  addEventListener(type,fn) { (windowListeners[type] ||= []).push(fn); }
};
globalThis.localStorage = { getItem(){return '0';}, setItem(){} };
globalThis.Image = class {
  constructor(){ this.complete=true; this.naturalWidth=100; }
  set src(_value) {}
};

const rafQueue = [];
globalThis.requestAnimationFrame = fn => { rafQueue.push(fn); return rafQueue.length; };

await import('../js/game.js');
assert.equal(rafQueue.length,1,'game loop should schedule');
elements.get('startButton').click();
assert.equal(elements.get('startOverlay').classList.contains('hidden'),true,'start overlay should hide');

let now=performance.now();
for(let i=0;i<180;i++){
  if(i>0 && i%20===0) elements.get('game').pointerDown();
  const frame=rafQueue.shift();
  assert.ok(frame,`missing frame ${i}`);
  now+=16.6667;
  frame(now);
}

assert.ok(drawCalls>1000,'canvas should render repeatedly');
assert.match(elements.get('staminaLabel').textContent,/\d+%/);
assert.equal(Number(elements.get('scoreLabel').textContent),0);
console.log(JSON.stringify({ frames:180, drawCalls, stamina:elements.get('staminaLabel').textContent },null,2));
