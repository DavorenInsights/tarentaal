const canvas = document.querySelector('#game');
const storedDeviceMode = (() => { try { return localStorage.getItem('tarentaalDeviceMode') || 'auto'; } catch { return 'auto'; } })();
if (typeof document !== 'undefined' && document.documentElement?.setAttribute) document.documentElement.setAttribute('data-device', storedDeviceMode);
const portraitMode = storedDeviceMode === 'phone' || (storedDeviceMode !== 'laptop' && typeof window.matchMedia === 'function' && window.matchMedia('(orientation: portrait)').matches && Number(window.innerWidth || 9999) < 700);
if (portraitMode) { canvas.width = 720; canvas.height = 1280; }
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const FLOOR = H - 50;

const ui = Object.fromEntries([
  'scoreLabel','cornLabel','bestLabel','staminaLabel','staminaFill','shieldPill','announcement',
  'startOverlay','pauseOverlay','resultOverlay','resultEyebrow','resultTitle','resultScore','resultBest',
  'resultCorn','resultNear','resultDistance','medal','medalText','soundButton'
].map(id => [id, document.querySelector(`#${id}`)]));

const buttons = {
  start: document.querySelector('#startButton'),
  pause: document.querySelector('#pauseButton'),
  resume: document.querySelector('#resumeButton'),
  fullscreen: document.querySelector('#fullscreenButton'),
  restart: document.querySelector('#restartButton'),
  flap: document.querySelector('#flapButton')
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const lerp = (a, b, t) => a + (b - a) * t;

class SoundEngine {
  constructor() { this.ctx = null; this.enabled = true; }
  ensure() {
    if (!this.enabled) return;
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq = 440, duration = .07, volume = .03, type = 'sine', slide = 0) {
    if (!this.enabled) return;
    this.ensure();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }
  flap() { this.tone(310, .07, .025, 'triangle', 180); }
  point() { this.tone(680, .08, .025, 'sine', 220); }
  corn() { this.tone(880, .06, .025, 'square', 280); }
  shield() { this.tone(460, .16, .035, 'triangle', 520); }
  near() { this.tone(1050, .07, .018, 'sine', 170); }
  crash() { this.tone(95, .35, .07, 'sawtooth', -45); }
}
const sound = new SoundEngine();

const birdFrames = { neutral:new Image(), up:new Image(), down:new Image() };
birdFrames.neutral.src = './assets/player/tarentaal-fly.png';
birdFrames.up.src = './assets/player/tarentaal-flap-up.png';
birdFrames.down.src = './assets/player/tarentaal-flap-down.png';
const cornImage = new Image();
cornImage.src = './assets/collectibles/corn.png';
const featherImage = new Image();
featherImage.src = './assets/collectibles/feather.svg';

const palettes = [
  { name:'Oggend', top:[91,202,224], bottom:[218,238,188], sun:'#ffe38a', hill:'#6d9b55', field:'#c8b75d' },
  { name:'Sonsondergang', top:[239,123,91], bottom:[252,201,122], sun:'#fff0b6', hill:'#5f704a', field:'#a97b45' },
  { name:'Nag', top:[20,45,78], bottom:[52,86,103], sun:'#e8efff', hill:'#263f47', field:'#4b543b' },
  { name:'Dagbreek', top:[91,133,175], bottom:[239,177,139], sun:'#ffe9a6', hill:'#536e54', field:'#9e9451' }
];

function initialBird() {
  return { x:W * .26, y:H * .47, vy:0, radius:26, angle:0, stamina:100, shield:0, invuln:0, flapPose:0 };
}

function makeClouds() {
  return Array.from({ length:7 }, () => ({
    x:rand(0,W), y:rand(55,H * .42), size:rand(.55,1.3), speed:rand(8,20), alpha:rand(.25,.62)
  }));
}

function initialState() {
  const best = Number(localStorage.getItem('tarentaalFladderBest') || 0);
  return {
    phase:'menu', score:0, corn:0, near:0, best, distance:0, elapsed:0, speed:255,
    bird:initialBird(), obstacles:[], collectibles:[], particles:[], clouds:makeClouds(),
    nextSpacing:480, shake:0, announced:0, weatherSeed:Math.random() * 1000
  };
}

let game = initialState();
let lastTime = performance.now();

function show(el, visible = true) { el.classList.toggle('hidden', !visible); }
function hideOverlays() { [ui.startOverlay, ui.pauseOverlay, ui.resultOverlay].forEach(el => show(el, false)); }

function startRun() {
  sound.ensure();
  game = initialState();
  game.phase = 'playing';
  hideOverlays();
  spawnObstacle(W + 40);
  lastTime = performance.now();
  announce('KRRR-KRRR!');
  flap(true);
}

function flap(initial = false) {
  if (game.phase === 'menu' || game.phase === 'gameover') return;
  if (game.phase === 'paused') return togglePause(true);
  const b = game.bird;
  if (!initial && b.stamina < 8) {
    b.vy -= 105;
    b.stamina = Math.max(0, b.stamina - 4);
    announce('MIN VLERKKRAG!');
    return;
  }
  const strength = initial ? 430 : lerp(390, 505, b.stamina / 100);
  b.vy = -strength;
  b.flapPose = 0.18;
  b.stamina = Math.max(0, b.stamina - (initial ? 0 : 14));
  spawnFlapParticles();
  sound.flap();
}

function togglePause(forceResume = false) {
  if (forceResume && game.phase === 'paused') {
    game.phase = 'playing';
    show(ui.pauseOverlay, false);
    lastTime = performance.now();
    return;
  }
  if (game.phase === 'playing') {
    game.phase = 'paused';
    show(ui.pauseOverlay, true);
  } else if (game.phase === 'paused') {
    game.phase = 'playing';
    show(ui.pauseOverlay, false);
    lastTime = performance.now();
  }
}

function announce(text) {
  ui.announcement.textContent = text;
  ui.announcement.classList.remove('hidden');
  ui.announcement.style.animation = 'none';
  void ui.announcement.offsetWidth;
  ui.announcement.style.animation = '';
  clearTimeout(game.announced);
  game.announced = setTimeout(() => ui.announcement.classList.add('hidden'), 1450);
}

const obstacleTypes = ['hay','tank','windmill','gate','silo'];
function spawnObstacle(x) {
  const difficulty = clamp(game.score / 45, 0, 1);
  const gap = lerp(portraitMode ? 282 : 238, portraitMode ? 205 : 168, difficulty) + rand(-10, 12);
  const margin = 120;
  const gapY = rand(margin + gap / 2, FLOOR - margin - gap / 2);
  const width = rand(92, 122);
  const obstacle = {
    x, width, gapY, gap, type:pick(obstacleTypes), passed:false, nearChecked:false,
    detailSeed:Math.floor(rand(0,1000))
  };
  game.obstacles.push(obstacle);

  if (Math.random() < .62) {
    game.collectibles.push({
      type:'corn', x:x + width / 2, y:gapY + rand(-gap * .2,gap * .2), radius:19, spin:0, taken:false
    });
  }
  const shieldOnScreen = game.collectibles.some(c => c.type === 'shield' && !c.taken);
  if (!shieldOnScreen && game.score >= 4 && Math.random() < .075) {
    game.collectibles.push({
      type:'shield', x:x + width / 2 + 75, y:gapY + rand(-gap * .15,gap * .15), radius:21, spin:0, taken:false
    });
  }
}

function update(dt) {
  updateClouds(dt);
  updateParticles(dt);
  game.shake = Math.max(0, game.shake - dt * 20);
  if (game.phase !== 'playing') return;

  const b = game.bird;
  game.elapsed += dt;
  game.speed = Math.min(425, 255 + game.score * 4.1 + game.elapsed * .45);
  game.distance += game.speed * dt / 10;

  b.stamina = Math.min(100, b.stamina + dt * (b.vy > 0 ? 29 : 23));
  b.flapPose = Math.max(0, b.flapPose - dt);
  b.shield = Math.max(0, b.shield - dt);
  b.invuln = Math.max(0, b.invuln - dt);
  b.vy = Math.min(720, b.vy + 1430 * dt);
  b.y += b.vy * dt;
  b.angle = clamp(b.vy / 730, -.55, 1.05);

  const wind = Math.sin(game.elapsed * .72 + game.weatherSeed) * Math.max(0, game.score - 7) * .16;
  b.y += wind * dt;

  for (const obstacle of game.obstacles) {
    obstacle.x -= game.speed * dt;
    if (!obstacle.passed && obstacle.x + obstacle.width < b.x - b.radius) {
      obstacle.passed = true;
      game.score += 1;
      sound.point();
      checkNearMiss(obstacle);
      if ([8,16,24,32].includes(game.score)) announce(`${currentPalette().name.toUpperCase()}!`);
    }
  }
  game.obstacles = game.obstacles.filter(o => o.x + o.width > -140);

  for (const item of game.collectibles) {
    item.x -= game.speed * dt;
    item.spin += dt * 4;
    if (!item.taken && circleHit(b.x,b.y,b.radius,item.x,item.y,item.radius)) collect(item);
  }
  game.collectibles = game.collectibles.filter(c => !c.taken && c.x > -80);

  const last = game.obstacles.at(-1);
  if (!last || last.x < W - game.nextSpacing) {
    game.nextSpacing = clamp(rand(430,510) - game.score * 1.2, 365, 510);
    spawnObstacle(W + rand(80,150));
  }

  if (b.y - b.radius < 0 || b.y + b.radius > FLOOR) return crash();
  for (const obstacle of game.obstacles) {
    if (obstacleCollision(obstacle)) return hitObstacle();
  }

  updateUI();
}

function updateClouds(dt) {
  const speed = game.phase === 'playing' ? game.speed * .035 : 12;
  for (const c of game.clouds) {
    c.x -= (c.speed + speed) * dt;
    if (c.x < -180) {
      c.x = W + rand(40,260);
      c.y = rand(45,H * .4);
      c.size = rand(.55,1.3);
    }
  }
}

function spawnFlapParticles() {
  for (let i = 0; i < 7; i++) {
    game.particles.push({
      x:game.bird.x-25, y:game.bird.y+rand(-12,18), vx:rand(-125,-45), vy:rand(-55,55),
      life:rand(.3,.65), max:.65, size:rand(3,8), type:'feather'
    });
  }
}

function burst(x, y, color = '#fff2bd') {
  for (let i = 0; i < 12; i++) {
    game.particles.push({
      x, y, vx:rand(-150,150), vy:rand(-150,150), life:rand(.35,.8), max:.8,
      size:rand(3,9), type:'spark', color
    });
  }
}

function updateParticles(dt) {
  for (const p of game.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 120 * dt;
    p.life -= dt;
  }
  game.particles = game.particles.filter(p => p.life > 0);
}

function obstacleCollision(o) {
  const b = game.bird;
  const overlapX = b.x + b.radius > o.x + 8 && b.x - b.radius < o.x + o.width - 8;
  if (!overlapX) return false;
  const topEdge = o.gapY - o.gap / 2;
  const bottomEdge = o.gapY + o.gap / 2;
  return b.y - b.radius < topEdge || b.y + b.radius > bottomEdge;
}

function hitObstacle() {
  const b = game.bird;
  if (b.invuln > 0) return;
  if (b.shield > 0) {
    b.shield = 0;
    b.invuln = 1.15;
    b.vy = -330;
    game.shake = 10;
    burst(b.x,b.y,'#75efe1');
    sound.shield();
    announce('SKILD GERED!');
    return;
  }
  crash();
}

function crash() {
  if (game.phase !== 'playing') return;
  game.phase = 'gameover';
  game.shake = 14;
  sound.crash();
  burst(game.bird.x,game.bird.y,'#f6bf51');
  if (game.score > game.best) {
    game.best = game.score;
    localStorage.setItem('tarentaalFladderBest', String(game.best));
  }
  const result = medalFor(game.score);
  ui.resultEyebrow.textContent = game.score >= 35 ? 'DIE LUG HET JOU AANVAAR' : 'DIE GROND HET GEWEN';
  ui.resultTitle.textContent = game.score >= 35 ? 'Vlieënde legende!' : game.score >= 15 ? 'Sterk gefladder!' : 'Krrr... plof.';
  ui.resultScore.textContent = game.score;
  ui.resultBest.textContent = game.best;
  ui.resultCorn.textContent = game.corn;
  ui.resultNear.textContent = game.near;
  ui.resultDistance.textContent = `${Math.round(game.distance)} m`;
  ui.medal.textContent = result.icon;
  ui.medalText.textContent = result.text;
  setTimeout(() => show(ui.resultOverlay, true), 500);
  updateUI();
}

function medalFor(score) {
  if (score >= 50) return { icon:'👑', text:'Tarentaal-lugmag: 50+ hekke oorleef.' };
  if (score >= 35) return { icon:'🥇', text:'Goue Veer: jy behoort amper in die lug.' };
  if (score >= 20) return { icon:'🥈', text:'Silwer Veer: ritme, moed en net genoeg beheer.' };
  if (score >= 10) return { icon:'🥉', text:'Brons Veer: die plaas begin jou respekteer.' };
  return { icon:'🪶', text:'Elke groot vlug begin met een ongemaklike flap.' };
}

function checkNearMiss(o) {
  if (o.nearChecked) return;
  o.nearChecked = true;
  const topDist = Math.abs((game.bird.y - game.bird.radius) - (o.gapY - o.gap / 2));
  const bottomDist = Math.abs((game.bird.y + game.bird.radius) - (o.gapY + o.gap / 2));
  if (Math.min(topDist,bottomDist) < 19) {
    game.near += 1;
    game.score += 1;
    sound.near();
    announce('NABY-MIS +1');
  }
}

function collect(item) {
  item.taken = true;
  if (item.type === 'corn') {
    game.corn += 1;
    game.score += 1;
    game.bird.stamina = Math.min(100, game.bird.stamina + 12);
    sound.corn();
    burst(item.x,item.y,'#ffd85d');
  } else {
    game.bird.shield = 8;
    sound.shield();
    burst(item.x,item.y,'#75efe1');
    announce('VEERKRAG-SKILD!');
  }
}

function circleHit(ax,ay,ar,bx,by,br) {
  return (ax-bx) ** 2 + (ay-by) ** 2 < (ar+br) ** 2;
}

function currentPalette() {
  return palettes[Math.floor(game.score / 8) % palettes.length];
}

function paletteBlend() {
  const idx = Math.floor(game.score / 8) % palettes.length;
  const next = (idx + 1) % palettes.length;
  const t = (game.score % 8) / 8;
  const a = palettes[idx];
  const b = palettes[next];
  return {
    top:a.top.map((v,i)=>Math.round(lerp(v,b.top[i],t))),
    bottom:a.bottom.map((v,i)=>Math.round(lerp(v,b.bottom[i],t))),
    sun:t < .5 ? a.sun : b.sun,
    hill:t < .5 ? a.hill : b.hill,
    field:t < .5 ? a.field : b.field
  };
}

function draw() {
  ctx.save();
  const sx = game.shake ? rand(-game.shake,game.shake) : 0;
  const sy = game.shake ? rand(-game.shake*.5,game.shake*.5) : 0;
  ctx.translate(sx,sy);
  drawSky();
  drawScenery();
  drawCollectibles();
  drawObstacles();
  drawParticles();
  drawBird();
  drawGround();
  if (game.phase === 'menu') drawMenuBirdHint();
  ctx.restore();
}

function drawSky() {
  const p = paletteBlend();
  const gradient = ctx.createLinearGradient(0,0,0,H);
  gradient.addColorStop(0,`rgb(${p.top.join(',')})`);
  gradient.addColorStop(1,`rgb(${p.bottom.join(',')})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(-30,-30,W+60,H+60);

  const night = Math.floor(game.score / 8) % 4 === 2;
  if (night) {
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    for (let i=0;i<45;i++) {
      const x=(i*83+31)%W;
      const y=(i*47+19)%(H * .43);
      ctx.fillRect(x,y,2,2);
    }
  }

  const cycle = (game.score % 32) / 32;
  const sunX = 110 + cycle * (W - 220);
  const sunY = H * .24 - Math.sin(cycle*Math.PI) * H * .15;
  ctx.fillStyle = p.sun;
  ctx.beginPath();
  ctx.arc(sunX,sunY,night?32:46,0,Math.PI*2);
  ctx.fill();
}

function drawScenery() {
  const p = paletteBlend();
  for (const c of game.clouds) drawCloud(c);

  const hillStart = H * .71;
  const hillBase = H * .61;
  const fieldY = H * .73;
  ctx.fillStyle = p.hill;
  ctx.beginPath();
  ctx.moveTo(0,hillStart);
  for (let x=0;x<=W;x+=120) ctx.lineTo(x,hillBase+Math.sin(x*.012+game.elapsed*.08)*H*.047);
  ctx.lineTo(W,FLOOR);
  ctx.lineTo(0,FLOOR);
  ctx.fill();

  ctx.fillStyle = p.field;
  ctx.fillRect(0,fieldY,W,FLOOR-fieldY);
  ctx.strokeStyle = 'rgba(255,244,185,.24)';
  ctx.lineWidth = 3;
  for (let i=-2;i<18;i++) {
    const x=((i*105-game.distance*2.6)%(W+210))-100;
    ctx.beginPath();
    ctx.moveTo(x,fieldY+15);
    ctx.lineTo(x-90,FLOOR);
    ctx.stroke();
  }
  drawFence();
}

function drawCloud(c) {
  ctx.save();
  ctx.globalAlpha = c.alpha;
  ctx.fillStyle = '#fff';
  ctx.translate(c.x,c.y);
  ctx.scale(c.size,c.size);
  ctx.beginPath();
  ctx.arc(0,10,35,0,Math.PI*2);
  ctx.arc(38,0,47,0,Math.PI*2);
  ctx.arc(82,13,31,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawFence() {
  const offset=-(game.distance*3.4)%160;
  const postTop = FLOOR - 95;
  ctx.strokeStyle='rgba(64,55,35,.44)';
  ctx.lineWidth=7;
  for(let x=offset-160;x<W+160;x+=160){
    ctx.beginPath();ctx.moveTo(x,postTop);ctx.lineTo(x,FLOOR-20);ctx.stroke();
  }
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.moveTo(0,FLOOR-68);ctx.lineTo(W,FLOOR-68);
  ctx.moveTo(0,FLOOR-38);ctx.lineTo(W,FLOOR-38);
  ctx.stroke();
}

function drawGround() {
  ctx.fillStyle='#5b472a';
  ctx.fillRect(-20,FLOOR,W+40,H-FLOOR+20);
  ctx.fillStyle='#7ba848';
  ctx.fillRect(-20,FLOOR-8,W+40,12);
  ctx.fillStyle='rgba(255,255,255,.08)';
  for(let x=-(game.distance*6)%90;x<W;x+=90) ctx.fillRect(x,FLOOR+22,42,4);
}

function drawObstacles() {
  for (const o of game.obstacles) {
    const topH=o.gapY-o.gap/2;
    const bottomY=o.gapY+o.gap/2;
    drawObstacleSegment(o,o.x,0,o.width,topH,true);
    drawObstacleSegment(o,o.x,bottomY,o.width,FLOOR-bottomY,false);
  }
}

function drawObstacleSegment(o,x,y,w,h,isTop) {
  if(h<=0) return;
  ctx.save();
  if(o.type==='hay') drawHay(o,x,y,w,h,isTop);
  else if(o.type==='tank') drawTank(x,y,w,h,isTop);
  else if(o.type==='windmill') drawWindmill(x,y,w,h,isTop);
  else if(o.type==='gate') drawGate(x,y,w,h,isTop);
  else drawSilo(x,y,w,h,isTop);
  ctx.restore();
}

function drawHay(o,x,y,w,h,isTop) {
  ctx.fillStyle='#d5aa45';
  ctx.strokeStyle='#765522';
  ctx.lineWidth=6;
  roundedRect(x,y,w,h,12);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(104,68,20,.55)';
  ctx.lineWidth=3;
  for(let yy=y+18,n=0;yy<y+h;yy+=28,n++){
    const wobble=Math.sin(o.detailSeed+n*1.7)*4;
    ctx.beginPath();ctx.moveTo(x+8,yy);ctx.lineTo(x+w-8,yy+wobble);ctx.stroke();
  }
  ctx.fillStyle='#8f6b2e';ctx.fillRect(x+w*.45,y,w*.1,h);
  drawObstacleLip(x,y,w,h,isTop,'#e9c160');
}

function drawTank(x,y,w,h,isTop) {
  const g=ctx.createLinearGradient(x,0,x+w,0);
  g.addColorStop(0,'#6c8790');g.addColorStop(.5,'#b4c5c4');g.addColorStop(1,'#526c75');
  ctx.fillStyle=g;ctx.strokeStyle='#2f454d';ctx.lineWidth=6;
  roundedRect(x,y,w,h,18);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(30,50,58,.45)';ctx.lineWidth=4;
  for(let yy=y+22;yy<y+h;yy+=36){ctx.beginPath();ctx.moveTo(x+4,yy);ctx.lineTo(x+w-4,yy);ctx.stroke();}
  drawObstacleLip(x,y,w,h,isTop,'#a7c1c2');
}

function drawWindmill(x,y,w,h,isTop) {
  ctx.fillStyle='rgba(62,75,73,.88)';ctx.strokeStyle='#263b3b';ctx.lineWidth=5;
  ctx.fillRect(x+w*.32,y,w*.36,h);ctx.strokeRect(x+w*.32,y,w*.36,h);
  ctx.strokeStyle='#b8c6bd';ctx.lineWidth=4;
  for(let yy=y;yy<y+h;yy+=35){
    ctx.beginPath();ctx.moveTo(x+w*.32,yy);ctx.lineTo(x+w*.68,yy+35);
    ctx.moveTo(x+w*.68,yy);ctx.lineTo(x+w*.32,yy+35);ctx.stroke();
  }
  const hubY=isTop?y+h-10:y+10;
  ctx.translate(x+w/2,hubY);
  ctx.rotate(game.elapsed*.45);
  ctx.strokeStyle='#e6dfc1';ctx.lineWidth=7;
  for(let i=0;i<6;i++){
    ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(45,0);ctx.stroke();
  }
  ctx.fillStyle='#ef7046';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();
}

function drawGate(x,y,w,h,isTop) {
  ctx.fillStyle='#8b5b31';ctx.strokeStyle='#4e3018';ctx.lineWidth=7;
  ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);
  ctx.strokeStyle='#d09a58';ctx.lineWidth=8;
  for(let yy=y+24;yy<y+h;yy+=42){ctx.beginPath();ctx.moveTo(x+7,yy);ctx.lineTo(x+w-7,yy);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(x+8,y+8);ctx.lineTo(x+w-8,y+h-8);
  ctx.moveTo(x+w-8,y+8);ctx.lineTo(x+8,y+h-8);ctx.stroke();
  drawObstacleLip(x,y,w,h,isTop,'#bd8144');
}

function drawSilo(x,y,w,h,isTop) {
  const g=ctx.createLinearGradient(x,0,x+w,0);
  g.addColorStop(0,'#8d9998');g.addColorStop(.55,'#e0dfcc');g.addColorStop(1,'#747f80');
  ctx.fillStyle=g;ctx.strokeStyle='#49595b';ctx.lineWidth=6;
  roundedRect(x,y,w,h,Math.min(32,w/3));ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(60,75,76,.42)';ctx.lineWidth=3;
  for(let yy=y+25;yy<y+h;yy+=30){ctx.beginPath();ctx.moveTo(x+5,yy);ctx.lineTo(x+w-5,yy);ctx.stroke();}
  drawObstacleLip(x,y,w,h,isTop,'#d5d7c8');
}

function drawObstacleLip(x,y,w,h,isTop,color) {
  const lipY=isTop?y+h-16:y;
  ctx.fillStyle=color;ctx.strokeStyle='rgba(37,47,43,.5)';ctx.lineWidth=5;
  roundedRect(x-9,lipY,w+18,18,7);ctx.fill();ctx.stroke();
}

function roundedRect(x,y,w,h,r) {
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}

function drawCollectibles() {
  for(const item of game.collectibles){
    ctx.save();ctx.translate(item.x,item.y);ctx.rotate(Math.sin(item.spin)*.15);
    const pulse=1+Math.sin(item.spin*2)*.08;ctx.scale(pulse,pulse);
    ctx.shadowColor=item.type==='corn'?'#ffd85d':'#75efe1';ctx.shadowBlur=18;
    const img=item.type==='corn'?cornImage:featherImage;
    if(img.complete&&img.naturalWidth){
      const size=item.type==='corn'?46:52;ctx.drawImage(img,-size/2,-size/2,size,size);
    }else{
      ctx.font='38px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(item.type==='corn'?'🌽':'🪶',0,0);
    }
    ctx.restore();
  }
}

function drawParticles() {
  for(const p of game.particles){
    ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color||'#f7efcf';
    ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));
    if(p.type==='feather'){
      ctx.beginPath();ctx.ellipse(0,0,p.size*1.5,p.size*.45,0,0,Math.PI*2);ctx.fill();
    }else{
      ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
}

function drawBird() {
  const b=game.bird;
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);
  const bob=game.phase==='menu'?Math.sin(performance.now()/260)*5:0;
  ctx.translate(0,bob);
  if(b.shield>0){
    ctx.strokeStyle=`rgba(117,239,225,${.55+Math.sin(game.elapsed*8)*.25})`;
    ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,43,0,Math.PI*2);ctx.stroke();
  }
  if(b.invuln>0&&Math.floor(b.invuln*14)%2===0)ctx.globalAlpha=.35;
  ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=14;ctx.shadowOffsetY=10;
  const sprite = b.flapPose > .11 ? birdFrames.up : b.flapPose > .03 ? birdFrames.down : b.vy < -80 ? birdFrames.up : birdFrames.neutral;
  if(sprite.complete&&sprite.naturalWidth){
    ctx.drawImage(sprite,-43,-46,86,92);
  }else{
    ctx.font='66px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐦',0,0);
  }
  ctx.restore();
}

function drawMenuBirdHint() {
  ctx.save();ctx.fillStyle='rgba(7,29,37,.6)';ctx.font='800 20px system-ui';
  ctx.textAlign='center';ctx.fillText('Tik of druk Spasie om te flap',W/2,H-80);ctx.restore();
}

function updateUI() {
  const b=game.bird;
  ui.scoreLabel.textContent=game.score;
  ui.cornLabel.textContent=game.corn;
  ui.bestLabel.textContent=Math.max(game.best,game.score);
  ui.staminaLabel.textContent=`${Math.round(b.stamina)}%`;
  ui.staminaFill.style.width=`${b.stamina}%`;
  ui.staminaFill.style.filter=b.stamina<20?'saturate(.5) brightness(.8)':'';
  show(ui.shieldPill,b.shield>0);
  if(b.shield>0)ui.shieldPill.textContent=`🪶 VEERKRAG ${Math.ceil(b.shield)}s`;
}

function gameLoop(now) {
  const dt=Math.min(.035,(now-lastTime)/1000||0);
  lastTime=now;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function handleKey(event,down) {
  const code=event.code;
  if(['Space','ArrowUp','KeyW'].includes(code)){
    event.preventDefault();
    if(down&&!event.repeat)flap();
  }
  if(down&&!event.repeat&&(code==='KeyP'||code==='Escape'))togglePause();
}

document.addEventListener('keydown',e=>handleKey(e,true));
canvas.addEventListener('pointerdown',e=>{e.preventDefault();flap();});
buttons.flap.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();flap();});
buttons.start.addEventListener('click',startRun);
buttons.restart.addEventListener('click',startRun);
buttons.pause.addEventListener('click',()=>togglePause());
buttons.resume.addEventListener('click',()=>togglePause(true));
ui.soundButton.addEventListener('click',()=>{
  sound.enabled=!sound.enabled;
  ui.soundButton.textContent=sound.enabled?'🔊':'🔇';
  if(sound.enabled)sound.ensure();
});
buttons.fullscreen.addEventListener('click',async()=>{
  try{
    if(!document.fullscreenElement)await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }catch{}
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&game.phase==='playing')togglePause();
});
window.addEventListener('blur',()=>{
  if(game.phase==='playing')togglePause();
});

updateUI();
requestAnimationFrame(gameLoop);
