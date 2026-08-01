const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const ui = Object.fromEntries([
  'waveLabel','timerLabel','killLabel','healthFill','healthLabel','xpFill','levelLabel','coinLabel','weaponBar',
  'bossBar','bossName','bossFill','announcement','startOverlay','pauseOverlay','choiceOverlay','choiceEyebrow',
  'choiceTitle','choiceSubtitle','choiceGrid','shopOverlay','shopCoins','shopGrid','resultOverlay','resultEyebrow',
  'resultTitle','resultScore','resultWave','resultKills','resultLevel','resultBest','resultWeapons','soundButton',
  'dashButton','joystick','joystickKnob'
].map(id => [id, document.querySelector(`#${id}`)]));

const buttons = {
  start: document.querySelector('#startButton'), pause: document.querySelector('#pauseButton'),
  resume: document.querySelector('#resumeButton'), fullscreen: document.querySelector('#fullscreenButton'),
  nextWave: document.querySelector('#nextWaveButton'), restart: document.querySelector('#restartButton')
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const formatTime = seconds => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

class SoundEngine {
  constructor() { this.ctx = null; this.enabled = true; }
  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq = 440, duration = .07, volume = .035, type = 'sine', slide = 0) {
    if (!this.enabled) return;
    this.ensure();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(this.ctx.destination); osc.start(now); osc.stop(now + duration);
  }
  shot() { this.tone(520, .035, .018, 'square', -110); }
  potato() { this.tone(120, .12, .045, 'sawtooth', -60); }
  hit() { this.tone(85, .12, .06, 'square', -25); }
  coin() { this.tone(820, .06, .025, 'sine', 260); }
  level() { this.tone(440, .13, .04, 'triangle', 440); setTimeout(() => this.tone(660,.15,.035,'triangle',420), 90); }
  boss() { this.tone(70, .5, .08, 'sawtooth', -25); }
  dash() { this.tone(260, .1, .025, 'triangle', 520); }
}
const sound = new SoundEngine();

const playerImage = new Image();
playerImage.src = './assets/player/tarentaal.png';

const enemyDefs = {
  chicken: { emoji:'🐔', name:'Kwaai Hoender', hp:25, speed:95, damage:10, radius:21, xp:5, coin:.18, score:10 },
  goat:    { emoji:'🐐', name:'Stampbok', hp:58, speed:73, damage:15, radius:28, xp:8, coin:.24, score:18 },
  boar:    { emoji:'🐗', name:'Bosvark', hp:105, speed:58, damage:22, radius:32, xp:12, coin:.34, score:28 },
  hadeda:  { emoji:'🦅', name:'Hadeda Skreeuer', hp:70, speed:47, damage:12, radius:27, xp:10, coin:.3, score:24 },
  bull:    { emoji:'🐂', name:'Die Groot Bul', hp:700, speed:54, damage:30, radius:54, xp:60, coin:1, score:250, boss:true },
  tractor: { emoji:'🚜', name:'Oom Chaos se Trekker', hp:1550, speed:43, damage:38, radius:64, xp:120, coin:1, score:600, boss:true }
};

function initialPlayer() {
  return {
    x: W / 2, y: H / 2, radius: 24, hp: 100, maxHp: 100, speed: 255, damage: 1,
    attackSpeed: 1, armor: 0, dodge: 0, pickup: 78, crit: .05, regen: 0, multishot: 0,
    level: 1, xp: 0, xpNext: 24, invuln: 0, regenTick: 0, facing: 1,
    dashCooldown: 2.5, dashReady: 0, dashTime: 0, dashX: 0, dashY: 0,
    weapons: { corn: 1, potato: 0, feather: 0, hadeda: 0 },
    weaponTimers: { corn: 0, potato: 0, feather: 0, hadeda: 0 }
  };
}

function initialState() {
  return {
    phase: 'menu', wave: 1, maxWaves: 10, waveTime: 35, spawning: false, waveClearing: false,
    spawnTimer: 0, elapsed: 0, kills: 0, score: 0, coins: 0, best: Number(localStorage.getItem('tarentaalTussleBest') || 0),
    player: initialPlayer(), enemies: [], bullets: [], enemyBullets: [], pickups: [], particles: [], texts: [],
    shake: 0, pendingLevel: false, shopItems: [], boss: null, announced: 0
  };
}
let game = initialState();
let lastTime = performance.now();

const keys = new Set();
const joystick = { x: 0, y: 0, active: false, pointerId: null };

function show(el, visible = true) { el.classList.toggle('hidden', !visible); }
function hideAllOverlays() {
  [ui.startOverlay, ui.pauseOverlay, ui.choiceOverlay, ui.shopOverlay, ui.resultOverlay].forEach(el => show(el, false));
}

function startRun() {
  sound.ensure();
  game = initialState();
  hideAllOverlays();
  startWave(1);
  lastTime = performance.now();
}

function startWave(number) {
  game.wave = number;
  game.phase = 'playing';
  game.waveTime = (number === 5 || number === 10) ? 45 : 35;
  game.spawning = true;
  game.waveClearing = false;
  game.spawnTimer = .35;
  game.enemyBullets.length = 0;
  show(ui.shopOverlay, false);
  announce(`GOLF ${number}`);
  if (number === 5) setTimeout(() => game.wave === number && !game.boss && !['gameover','victory'].includes(game.phase) && spawnBoss('bull'), 900);
  if (number === 10) setTimeout(() => game.wave === number && !game.boss && !['gameover','victory'].includes(game.phase) && spawnBoss('tractor'), 900);
}

function announce(text) {
  ui.announcement.textContent = text;
  ui.announcement.classList.remove('hidden');
  ui.announcement.style.animation = 'none';
  void ui.announcement.offsetWidth;
  ui.announcement.style.animation = '';
  clearTimeout(game.announced);
  game.announced = setTimeout(() => ui.announcement.classList.add('hidden'), 1650);
}

function endWave() {
  game.spawning = false;
  game.enemyBullets.length = 0;
  if (game.wave >= game.maxWaves) return finishRun(true);
  game.phase = 'shop';
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + Math.round(game.player.maxHp * .18));
  openShop();
}

function finishRun(victory) {
  game.phase = victory ? 'victory' : 'gameover';
  game.score = Math.round(game.score + (game.wave - 1) * 150 + game.player.level * 35 + game.coins * 2);
  if (game.score > game.best) {
    game.best = game.score;
    localStorage.setItem('tarentaalTussleBest', String(game.best));
  }
  ui.resultEyebrow.textContent = victory ? 'JY HET DIE PLAAS OORLEEF' : 'DIE PLAAS HET GEWEN';
  ui.resultTitle.textContent = victory ? 'Arena-kampioen!' : 'Krrr-krrr!';
  ui.resultScore.textContent = game.score.toLocaleString('af-ZA');
  ui.resultWave.textContent = victory ? '10 / 10' : `${game.wave} / 10`;
  ui.resultKills.textContent = game.kills;
  ui.resultLevel.textContent = game.player.level;
  ui.resultBest.textContent = game.best.toLocaleString('af-ZA');
  ui.resultWeapons.innerHTML = Object.entries(game.player.weapons).filter(([,level]) => level > 0).map(([id,level]) => `<span>${weaponInfo[id].icon} ${weaponInfo[id].name} L${level}</span>`).join('');
  show(ui.resultOverlay, true);
}

function togglePause(forceResume = false) {
  if (forceResume && game.phase === 'paused') {
    game.phase = 'playing'; show(ui.pauseOverlay, false); lastTime = performance.now(); return;
  }
  if (game.phase === 'playing') { game.phase = 'paused'; show(ui.pauseOverlay, true); }
  else if (game.phase === 'paused') { game.phase = 'playing'; show(ui.pauseOverlay, false); lastTime = performance.now(); }
}

function spawnPoint(margin = 70) {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: rand(-margin, W + margin), y: -margin };
  if (side === 1) return { x: W + margin, y: rand(-margin, H + margin) };
  if (side === 2) return { x: rand(-margin, W + margin), y: H + margin };
  return { x: -margin, y: rand(-margin, H + margin) };
}

function enemyTypeForWave(wave) {
  const roll = Math.random();
  if (wave >= 7 && roll < .2) return 'hadeda';
  if (wave >= 4 && roll < .42) return 'boar';
  if (wave >= 2 && roll < .72) return 'goat';
  return 'chicken';
}

function spawnEnemy(type = enemyTypeForWave(game.wave), position = spawnPoint()) {
  const d = enemyDefs[type];
  const scale = 1 + Math.max(0, game.wave - 1) * .095;
  const hp = Math.round(d.hp * scale);
  game.enemies.push({
    type, x: position.x, y: position.y, radius: d.radius, hp, maxHp: hp,
    speed: d.speed * (1 + game.wave * .012), damage: d.damage * (1 + game.wave * .045),
    flash: 0, dead: false, special: rand(.5, 2.5), contact: 0, angle: Math.random() * Math.PI * 2,
    boss: !!d.boss, charge: 0, vx: 0, vy: 0
  });
}

function spawnBoss(type) {
  const p = spawnPoint(100);
  spawnEnemy(type, p);
  game.boss = game.enemies.at(-1);
  sound.boss();
  announce(type === 'bull' ? 'DIE GROOT BUL!' : 'DIE TREKKER KOM!');
}

function spawnRate() {
  return Math.max(.22, 1.02 - game.wave * .075);
}

function nearestEnemy(x, y) {
  let best = null, bestD = Infinity;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    const d = (enemy.x - x) ** 2 + (enemy.y - y) ** 2;
    if (d < bestD) { bestD = d; best = enemy; }
  }
  return best;
}

function fireBullet(type, angle, damage, speed, radius, extra = {}) {
  const p = game.player;
  const crit = Math.random() < p.crit;
  const actual = damage * p.damage * (crit ? 1.8 : 1);
  game.bullets.push({
    type, x: p.x + Math.cos(angle) * 28, y: p.y + Math.sin(angle) * 28,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius, damage: actual,
    life: extra.life ?? 1.5, pierce: extra.pierce ?? 0, explosion: extra.explosion ?? 0,
    crit, hit: new Set(), spin: 0
  });
}

const weaponInfo = {
  corn: { icon:'🌽', name:'Mielieblaster' },
  potato: { icon:'🥔', name:'Aartappelkanon' },
  feather: { icon:'🪶', name:'Veerstorm' },
  hadeda: { icon:'📢', name:'Hadeda-alarm' }
};

function updateWeapons(dt) {
  const p = game.player;
  const target = nearestEnemy(p.x, p.y);
  for (const key of Object.keys(p.weaponTimers)) p.weaponTimers[key] -= dt;

  if (target && p.weaponTimers.corn <= 0) {
    const level = p.weapons.corn;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const shots = 1 + p.multishot + Math.floor((level - 1) / 3);
    for (let i = 0; i < shots; i++) {
      const spread = (i - (shots - 1) / 2) * .11;
      fireBullet('corn', angle + spread, 13 + level * 3, 720, 6, { pierce: level >= 4 ? 1 : 0 });
    }
    p.weaponTimers.corn = Math.max(.15, (.62 - level * .045) / p.attackSpeed);
    sound.shot();
  }

  if (target && p.weapons.potato > 0 && p.weaponTimers.potato <= 0) {
    const level = p.weapons.potato;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    fireBullet('potato', angle, 28 + level * 13, 460, 11, { explosion: 62 + level * 17, life: 2.2 });
    p.weaponTimers.potato = Math.max(.65, (2.4 - level * .18) / p.attackSpeed);
    sound.potato();
  }

  if (p.weapons.feather > 0 && p.weaponTimers.feather <= 0) {
    const level = p.weapons.feather;
    const count = 7 + level * 2;
    for (let i = 0; i < count; i++) fireBullet('feather', i / count * Math.PI * 2, 7 + level * 3, 530, 5, { pierce: level >= 3 ? 1 : 0, life: 1.25 });
    p.weaponTimers.feather = Math.max(.9, (3.15 - level * .22) / p.attackSpeed);
    sound.tone(340,.12,.025,'triangle',220);
  }

  if (p.weapons.hadeda > 0 && p.weaponTimers.hadeda <= 0) {
    const level = p.weapons.hadeda;
    const range = 145 + level * 32;
    for (const enemy of game.enemies) {
      if (enemy.dead || dist2(p, enemy) > range ** 2) continue;
      damageEnemy(enemy, (16 + level * 9) * p.damage, false);
      const dx = enemy.x - p.x, dy = enemy.y - p.y, len = Math.hypot(dx, dy) || 1;
      enemy.x += dx / len * 18; enemy.y += dy / len * 18;
    }
    ringParticle(p.x, p.y, range, '#77e7ff');
    p.weaponTimers.hadeda = Math.max(1.2, (4.7 - level * .3) / p.attackSpeed);
    sound.tone(190,.42,.05,'sawtooth',260);
  }
}

function explode(x, y, radius, damage) {
  ringParticle(x, y, radius, '#ffb34f');
  game.shake = Math.max(game.shake, 9);
  for (const enemy of game.enemies) if (!enemy.dead && (enemy.x - x) ** 2 + (enemy.y - y) ** 2 <= (radius + enemy.radius) ** 2) damageEnemy(enemy, damage, false);
  for (let i = 0; i < 16; i++) particle(x, y, '#ffb34f', rand(50,210), rand(0,Math.PI*2), rand(.25,.55), rand(3,7));
}

function damageEnemy(enemy, amount, crit = false) {
  if (enemy.dead) return;
  enemy.hp -= amount;
  enemy.flash = .09;
  if (crit || amount > 45) floatingText(enemy.x, enemy.y - enemy.radius, `${Math.round(amount)}${crit ? '!' : ''}`, crit ? '#ffe66c' : '#fff2d1');
  if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  const d = enemyDefs[enemy.type];
  game.kills++;
  game.score += d.score;
  const xpCount = enemy.boss ? 8 : 1;
  for (let i = 0; i < xpCount; i++) {
    game.pickups.push({ type:'xp', x:enemy.x + rand(-18,18), y:enemy.y + rand(-18,18), value:Math.ceil(d.xp / xpCount), radius:7, age:0 });
  }
  if (Math.random() < d.coin || enemy.boss) {
    const count = enemy.boss ? 8 : 1;
    for (let i = 0; i < count; i++) game.pickups.push({ type:'coin', x:enemy.x + rand(-24,24), y:enemy.y + rand(-24,24), value:enemy.boss ? 3 : 1, radius:9, age:0 });
  }
  for (let i = 0; i < (enemy.boss ? 26 : 8); i++) particle(enemy.x, enemy.y, enemy.boss ? '#ff7a57' : '#f1d36c', rand(35,180), rand(0,Math.PI*2), rand(.25,.7), rand(2,8));
  if (enemy === game.boss) { game.boss = null; show(ui.bossBar, false); sound.level(); }
}

function damagePlayer(amount) {
  const p = game.player;
  if (p.invuln > 0 || p.dashTime > 0) return;
  if (Math.random() < p.dodge) { floatingText(p.x,p.y-35,'MIS!','#75ead7'); p.invuln = .25; return; }
  const final = Math.max(1, Math.round(amount - p.armor * 1.7));
  p.hp -= final; p.invuln = .8; game.shake = 13;
  floatingText(p.x,p.y-42,`-${final}`,'#ff7969'); sound.hit();
  for (let i=0;i<10;i++) particle(p.x,p.y,'#ff6c5c',rand(45,180),rand(0,Math.PI*2),rand(.2,.5),rand(2,6));
  if (p.hp <= 0) { p.hp = 0; finishRun(false); }
}

function updatePlayer(dt) {
  const p = game.player;
  p.invuln = Math.max(0, p.invuln - dt);
  p.dashReady = Math.max(0, p.dashReady - dt);
  p.regenTick += dt;
  if (p.regen > 0 && p.regenTick >= 1) { p.regenTick = 0; p.hp = Math.min(p.maxHp, p.hp + p.regen); }

  let dx = 0, dy = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) dx--;
  if (keys.has('ArrowRight') || keys.has('KeyD')) dx++;
  if (keys.has('ArrowUp') || keys.has('KeyW')) dy--;
  if (keys.has('ArrowDown') || keys.has('KeyS')) dy++;
  dx += joystick.x; dy += joystick.y;
  const len = Math.hypot(dx,dy);
  if (len > 0) { dx /= Math.max(1,len); dy /= Math.max(1,len); p.facing = dx < -.05 ? -1 : dx > .05 ? 1 : p.facing; }

  if (p.dashTime > 0) {
    p.dashTime -= dt; p.x += p.dashX * 850 * dt; p.y += p.dashY * 850 * dt;
    if (Math.random() < .7) particle(p.x - p.dashX*25,p.y-p.dashY*25,'#baf8ec',rand(10,35),rand(0,Math.PI*2),.22,rand(2,6));
  } else { p.x += dx * p.speed * dt; p.y += dy * p.speed * dt; }
  p.x = clamp(p.x, 28, W - 28); p.y = clamp(p.y, 32, H - 28);
}

function attemptDash() {
  if (game.phase !== 'playing') return;
  const p = game.player;
  if (p.dashReady > 0 || p.dashTime > 0) return;
  let dx=0,dy=0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) dx--;
  if (keys.has('ArrowRight') || keys.has('KeyD')) dx++;
  if (keys.has('ArrowUp') || keys.has('KeyW')) dy--;
  if (keys.has('ArrowDown') || keys.has('KeyS')) dy++;
  dx += joystick.x; dy += joystick.y;
  let len = Math.hypot(dx,dy);
  if (!len) { dx = p.facing; dy = 0; len = 1; }
  p.dashX = dx/len; p.dashY = dy/len; p.dashTime = .17; p.dashReady = p.dashCooldown;
  sound.dash();
}

function updateEnemies(dt) {
  const p = game.player;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.contact = Math.max(0, enemy.contact - dt);
    enemy.special -= dt;
    let dx = p.x - enemy.x, dy = p.y - enemy.y;
    const len = Math.hypot(dx,dy) || 1; dx /= len; dy /= len;
    let speed = enemy.speed;

    if (enemy.type === 'chicken') {
      enemy.angle += dt * 4.5; dx += Math.cos(enemy.angle) * .24; dy += Math.sin(enemy.angle) * .24;
    }
    if (enemy.type === 'boar' && enemy.special <= 0) {
      enemy.charge = .72; enemy.special = rand(3.1,4.4); enemy.vx = dx; enemy.vy = dy;
    }
    if (enemy.charge > 0) { enemy.charge -= dt; dx = enemy.vx; dy = enemy.vy; speed *= 2.65; }

    if (enemy.type === 'hadeda') {
      if (len < 210) { dx *= -.7; dy *= -.7; }
      if (enemy.special <= 0) { shootAtPlayer(enemy, 255, 9 + game.wave); enemy.special = rand(2.1,3); }
    }
    if (enemy.boss && enemy.special <= 0) {
      if (enemy.type === 'bull') {
        enemy.charge = 1.05; enemy.vx = dx; enemy.vy = dy; enemy.special = 3.2;
      } else {
        for (let i=0;i<10;i++) shootEnemyBullet(enemy.x,enemy.y,i/10*Math.PI*2,185,14,10);
        enemy.special = 2.4;
      }
    }

    enemy.x += dx * speed * dt; enemy.y += dy * speed * dt;
    const hitRange = enemy.radius + p.radius - 5;
    if ((enemy.x-p.x)**2 + (enemy.y-p.y)**2 < hitRange**2 && enemy.contact <= 0) {
      damagePlayer(enemy.damage); enemy.contact = .75;
      const push = enemy.boss ? 42 : 22; enemy.x -= dx * push; enemy.y -= dy * push;
    }
  }
  game.enemies = game.enemies.filter(e => !e.dead);
}

function shootAtPlayer(enemy, speed, damage) {
  const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
  shootEnemyBullet(enemy.x,enemy.y,angle,speed,damage,7);
}
function shootEnemyBullet(x,y,angle,speed,damage,radius) {
  game.enemyBullets.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,radius,life:4});
}

function updateBullets(dt) {
  for (const b of game.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.spin += dt*8;
    for (const enemy of game.enemies) {
      if (enemy.dead || b.hit.has(enemy)) continue;
      if ((b.x-enemy.x)**2 + (b.y-enemy.y)**2 <= (b.radius+enemy.radius)**2) {
        b.hit.add(enemy); damageEnemy(enemy,b.damage,b.crit);
        if (b.explosion) { explode(b.x,b.y,b.explosion,b.damage*.72); b.life=0; }
        else if (b.pierce > 0) b.pierce--; else b.life=0;
        if (b.life <= 0) break;
      }
    }
    if (b.life <= 0 && b.explosion && b.hit.size === 0) explode(b.x,b.y,b.explosion,b.damage*.72);
  }
  game.bullets = game.bullets.filter(b => b.life > 0 && b.x > -80 && b.x < W+80 && b.y > -80 && b.y < H+80);

  const p = game.player;
  for (const b of game.enemyBullets) {
    b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
    if ((b.x-p.x)**2+(b.y-p.y)**2 < (b.radius+p.radius-4)**2) { damagePlayer(b.damage); b.life=0; }
  }
  game.enemyBullets = game.enemyBullets.filter(b => b.life>0 && b.x>-50&&b.x<W+50&&b.y>-50&&b.y<H+50);
}

function updatePickups(dt) {
  const p = game.player;
  for (const item of game.pickups) {
    item.age += dt;
    const dx = p.x - item.x, dy = p.y - item.y, d = Math.hypot(dx,dy) || 1;
    if (d < p.pickup * 1.8) { const pull = d < p.pickup ? 620 : 210; item.x += dx/d*pull*dt; item.y += dy/d*pull*dt; }
    if (d < p.radius + item.radius + 5) {
      item.dead = true;
      if (item.type === 'xp') gainXp(item.value);
      else { game.coins += item.value; game.score += item.value*3; sound.coin(); }
    }
  }
  game.pickups = game.pickups.filter(i => !i.dead && i.age < 25);
}

function gainXp(value) { game.player.xp += value; }
function checkLevelUp() {
  const p = game.player;
  if (game.phase !== 'playing' || p.xp < p.xpNext) return;
  p.xp -= p.xpNext; p.level++; p.xpNext = Math.round(22 + p.level * 13 + p.level ** 1.35 * 2.3);
  sound.level(); openLevelChoice();
}

function particle(x,y,color,speed,angle,life,size) { game.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color,life,maxLife:life,size,ring:false}); }
function ringParticle(x,y,radius,color) { game.particles.push({x,y,color,life:.38,maxLife:.38,size:10,ring:true,target:radius}); }
function floatingText(x,y,text,color) { game.texts.push({x,y,text,color,life:.65,maxLife:.65}); }
function updateEffects(dt) {
  for (const p of game.particles) { p.life-=dt; if(!p.ring){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;} }
  game.particles=game.particles.filter(p=>p.life>0);
  for(const t of game.texts){t.life-=dt;t.y-=38*dt;} game.texts=game.texts.filter(t=>t.life>0);
  game.shake=Math.max(0,game.shake-dt*24);
}

const upgrades = [
  {id:'corn',icon:'🌽',title:'Mielieblaster',max:5,available:p=>p.weapons.corn<5,desc:p=>`Vuur vinniger en harder. Huidige vlak: ${p.weapons.corn}.`,apply:p=>p.weapons.corn++},
  {id:'potato',icon:'🥔',title:'Aartappelkanon',max:4,available:p=>p.weapons.potato<4,desc:p=>p.weapons.potato?`Groter ontploffings. Huidige vlak: ${p.weapons.potato}.`:'Ontsluit stadige, ontploffende aartappels.',apply:p=>p.weapons.potato++},
  {id:'feather',icon:'🪶',title:'Veerstorm',max:4,available:p=>p.weapons.feather<4,desc:p=>p.weapons.feather?`Meer en sterker vere. Huidige vlak: ${p.weapons.feather}.`:'Ontsluit ’n radiale storm van skerp vere.',apply:p=>p.weapons.feather++},
  {id:'hadeda',icon:'📢',title:'Hadeda-alarm',max:4,available:p=>p.weapons.hadeda<4,desc:p=>p.weapons.hadeda?`Groter, harder skreeu. Huidige vlak: ${p.weapons.hadeda}.`:'Ontsluit ’n skreeu wat alles naby beskadig.',apply:p=>p.weapons.hadeda++},
  {id:'damage',icon:'💥',title:'Kwaai Bek',available:()=>true,desc:()=>'+16% skade vir alle wapens.',apply:p=>p.damage*=1.16},
  {id:'attack',icon:'⚡',title:'Vinnige Vlerke',available:()=>true,desc:()=>'+13% aanvalspoed vir alle wapens.',apply:p=>p.attackSpeed*=1.13},
  {id:'speed',icon:'👟',title:'Plaaspad-Pote',available:()=>true,desc:()=>'+10% bewegingspoed.',apply:p=>p.speed*=1.10},
  {id:'health',icon:'❤️',title:'Veerhart',available:()=>true,desc:()=>'+20 maksimum lewe en genees 20.',apply:p=>{p.maxHp+=20;p.hp=Math.min(p.maxHp,p.hp+20)}},
  {id:'armor',icon:'🛡️',title:'Sinkplaat',available:()=>true,desc:()=>'+2 pantser. Verminder elke treffer.',apply:p=>p.armor+=2},
  {id:'pickup',icon:'🧲',title:'Mieliemagneet',available:()=>true,desc:()=>'+28% optelafstand.',apply:p=>p.pickup*=1.28},
  {id:'crit',icon:'🎯',title:'Skerp Oog',available:p=>p.crit<.45,desc:()=>'+8% kritieke kans.',apply:p=>p.crit+=.08},
  {id:'regen',icon:'🌿',title:'Plaasrus',available:p=>p.regen<5,desc:()=>'+1 lewe per sekonde.',apply:p=>p.regen+=1},
  {id:'multi',icon:'🌽🌽',title:'Dubbel Mielie',available:p=>p.multishot<2,desc:()=>'+1 ekstra Mielieblaster-projektiel.',apply:p=>p.multishot++},
  {id:'dash',icon:'💨',title:'Kortpad',available:p=>p.dashCooldown>1.25,desc:()=>'-15% Veersprong-afkoeling.',apply:p=>p.dashCooldown*=.85}
];

function draftUpgrades(count=3) {
  const pool = upgrades.filter(u=>u.available(game.player));
  const result=[];
  while(result.length<count && pool.length){const index=Math.floor(Math.random()*pool.length);result.push(pool.splice(index,1)[0]);}
  return result;
}

function openLevelChoice() {
  game.phase='levelup';
  ui.choiceEyebrow.textContent=`VLAK ${game.player.level}`;
  ui.choiceTitle.textContent='Kies ’n plaastalent';
  ui.choiceSubtitle.textContent='Hierdie opgradering hou vir die res van die rondte.';
  ui.choiceGrid.innerHTML='';
  draftUpgrades().forEach((upgrade,index)=>{
    const btn=document.createElement('button');btn.className='choice-option';btn.type='button';
    btn.innerHTML=`<span class="choice-icon">${upgrade.icon}</span><h3>${upgrade.title}</h3><p>${upgrade.desc(game.player)}</p><div class="choice-meta"><span>KEUSE ${index+1}</span><span>PERMANENT</span></div>`;
    btn.addEventListener('click',()=>chooseUpgrade(upgrade));ui.choiceGrid.append(btn);
  });
  show(ui.choiceOverlay,true);
}
function chooseUpgrade(upgrade){upgrade.apply(game.player);show(ui.choiceOverlay,false);game.phase='playing';renderWeaponBar();lastTime=performance.now();}

const shopPool = [
  {icon:'🍲',title:'Ouma se Pot',desc:'Genees 40 lewe.',cost:10,apply:p=>p.hp=Math.min(p.maxHp,p.hp+40)},
  {icon:'💥',title:'Ekstra Buskruit',desc:'+12% skade.',cost:17,apply:p=>p.damage*=1.12},
  {icon:'⚡',title:'Nuwe Rek',desc:'+10% aanvalspoed.',cost:17,apply:p=>p.attackSpeed*=1.10},
  {icon:'🛡️',title:'Sinkplaatbaadjie',desc:'+2 pantser.',cost:16,apply:p=>p.armor+=2},
  {icon:'❤️',title:'Groot Ontbyt',desc:'+15 maksimum lewe en genees 15.',cost:18,apply:p=>{p.maxHp+=15;p.hp+=15}},
  {icon:'🎯',title:'Bril van Oom Piet',desc:'+6% kritieke kans.',cost:18,apply:p=>p.crit+=.06},
  {icon:'👟',title:'Nuwe Velskoene',desc:'+8% bewegingspoed.',cost:14,apply:p=>p.speed*=1.08},
  {icon:'🧲',title:'Rooi Magneet',desc:'+22% optelafstand.',cost:12,apply:p=>p.pickup*=1.22}
];
function openShop(){
  ui.shopGrid.innerHTML='';ui.shopCoins.textContent=game.coins;
  game.shopItems=[];const pool=[...shopPool].sort(()=>Math.random()-.5).slice(0,3);
  pool.forEach((item,index)=>{
    const cost=item.cost+Math.floor(game.wave*1.8);const btn=document.createElement('button');btn.className='choice-option';btn.type='button';
    btn.innerHTML=`<span class="choice-icon">${item.icon}</span><h3>${item.title}</h3><p>${item.desc}</p><div class="choice-meta"><span>ITEM ${index+1}</span><span class="choice-cost">${cost} 🌽</span></div>`;
    btn.addEventListener('click',()=>{if(game.coins<cost)return;game.coins-=cost;item.apply(game.player);btn.disabled=true;btn.querySelector('.choice-cost').textContent='GEKOOP';ui.shopCoins.textContent=game.coins;updateHud();sound.coin();});
    ui.shopGrid.append(btn);
  });
  show(ui.shopOverlay,true);
}

function update(dt) {
  if (game.phase !== 'playing') return;
  game.elapsed += dt;
  updatePlayer(dt);
  game.waveTime -= dt;
  if (game.waveTime <= 0) { game.waveTime=0; game.spawning=false; game.waveClearing=true; }
  if (game.spawning) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      const count = game.wave >= 8 && Math.random()<.25 ? 2 : 1;
      for(let i=0;i<count;i++) spawnEnemy();
      game.spawnTimer = spawnRate() * rand(.72,1.18);
    }
  }
  updateWeapons(dt); updateBullets(dt); updateEnemies(dt); updatePickups(dt); updateEffects(dt); checkLevelUp();
  if (game.phase === 'playing' && game.waveClearing && game.enemies.length === 0) endWave();
}

function drawArena() {
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#78a95c');grad.addColorStop(1,'#3f754b');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.17;ctx.fillStyle='#e2ca69';
  for(let y=30;y<H;y+=90){for(let x=((y/90)%2)*30-20;x<W;x+=72){ctx.fillRect(x,y,42,5);ctx.fillRect(x+9,y-8,3,20);ctx.fillRect(x+25,y-7,3,18)}}
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(73,54,33,.22)';ctx.beginPath();ctx.ellipse(W*.5,H*.52,W*.33,H*.28,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(250,227,153,.42)';ctx.lineWidth=4;ctx.setLineDash([18,16]);ctx.beginPath();ctx.ellipse(W*.5,H*.52,W*.31,H*.26,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(18,54,42,.48)';ctx.fillRect(0,0,W,18);ctx.fillRect(0,H-18,W,18);ctx.fillRect(0,0,18,H);ctx.fillRect(W-18,0,18,H);
  ctx.fillStyle='rgba(255,255,255,.08)';
  for(let x=35;x<W;x+=115){ctx.fillRect(x,4,8,35);ctx.fillRect(x,H-39,8,35)}
  for(let y=35;y<H;y+=105){ctx.fillRect(4,y,35,8);ctx.fillRect(W-39,y,35,8)}
  for(let i=0;i<10;i++){const x=(i*173+95)%W,y=(i*101+72)%H;ctx.fillStyle='rgba(42,94,55,.35)';ctx.beginPath();ctx.arc(x,y,14+(i%3)*5,0,Math.PI*2);ctx.fill()}
}

function render() {
  ctx.save();
  const shakeX=game.shake?rand(-game.shake,game.shake):0,shakeY=game.shake?rand(-game.shake,game.shake):0;ctx.translate(shakeX,shakeY);
  drawArena();

  for(const item of game.pickups){const bob=Math.sin(item.age*6+item.x)*3;ctx.save();ctx.translate(item.x,item.y+bob);ctx.shadowColor=item.type==='coin'?'#ffd65d':'#69f1de';ctx.shadowBlur=14;ctx.fillStyle=item.type==='coin'?'#f6c64e':'#42d9c0';ctx.beginPath();ctx.arc(0,0,item.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.font=`${item.type==='coin'?14:12}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.type==='coin'?'🌽':'✦',0,1);ctx.restore()}

  for(const b of game.bullets){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.spin);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${b.type==='potato'?23:b.type==='corn'?15:14}px sans-serif`;ctx.shadowBlur=10;ctx.shadowColor=b.type==='feather'?'#eafcff':'#ffdc64';ctx.fillText(b.type==='corn'?'🌽':b.type==='potato'?'🥔':'🪶',0,0);ctx.restore()}
  for(const b of game.enemyBullets){ctx.fillStyle='#c84bdf';ctx.shadowColor='#f08cff';ctx.shadowBlur=13;ctx.beginPath();ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}

  for(const enemy of game.enemies){
    ctx.save();ctx.translate(enemy.x,enemy.y);const scale=enemy.boss?1.35:1;ctx.scale(scale,scale);if(enemy.flash)ctx.globalAlpha=.35;
    ctx.font=`${enemy.radius*1.65}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=10;ctx.fillText(enemyDefs[enemy.type].emoji,0,0);ctx.shadowBlur=0;
    if(enemy.hp<enemy.maxHp || enemy.boss){const w=enemy.radius*2.1;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(-w/2,-enemy.radius-13,w,6);ctx.fillStyle=enemy.boss?'#f05c50':'#f1c45d';ctx.fillRect(-w/2,-enemy.radius-13,w*clamp(enemy.hp/enemy.maxHp,0,1),6)}ctx.restore();
  }

  const p=game.player;ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.facing,1);if(p.invuln>0&&Math.floor(p.invuln*14)%2===0)ctx.globalAlpha=.35;ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=14;
  if(playerImage.complete&&playerImage.naturalWidth){ctx.drawImage(playerImage,-39,-43,78,78)}else{ctx.fillStyle='#263a49';ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  if(p.dashReady<=0){ctx.strokeStyle='rgba(117,239,221,.38)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,33,0,Math.PI*2);ctx.stroke()}

  for(const effect of game.particles){ctx.save();const alpha=effect.life/effect.maxLife;ctx.globalAlpha=alpha;if(effect.ring){const progress=1-alpha;ctx.strokeStyle=effect.color;ctx.lineWidth=5*(1-progress)+1;ctx.beginPath();ctx.arc(effect.x,effect.y,effect.target*progress,0,Math.PI*2);ctx.stroke()}else{ctx.fillStyle=effect.color;ctx.beginPath();ctx.arc(effect.x,effect.y,effect.size*alpha,0,Math.PI*2);ctx.fill()}ctx.restore()}
  for(const t of game.texts){ctx.save();ctx.globalAlpha=t.life/t.maxLife;ctx.fillStyle=t.color;ctx.font='900 20px system-ui';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(t.text,t.x,t.y);ctx.restore()}
  ctx.restore();
}

function renderWeaponBar(){ui.weaponBar.innerHTML=Object.entries(game.player.weapons).filter(([,l])=>l>0).map(([id,l])=>`<div class="weapon-chip"><span>${weaponInfo[id].icon}</span>${weaponInfo[id].name}<small>L${l}</small></div>`).join('')}
function updateHud(){
  const p=game.player;ui.waveLabel.textContent=`${game.wave} / ${game.maxWaves}`;ui.timerLabel.textContent=game.waveClearing?'MAAK SKOON':formatTime(game.waveTime);ui.killLabel.textContent=game.kills;ui.coinLabel.textContent=game.coins;
  ui.healthFill.style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`;ui.healthLabel.textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;ui.xpFill.style.width=`${clamp(p.xp/p.xpNext*100,0,100)}%`;ui.levelLabel.textContent=`Vlak ${p.level}`;
  if(game.boss&&!game.boss.dead){show(ui.bossBar,true);ui.bossName.textContent=enemyDefs[game.boss.type].name.toUpperCase();ui.bossFill.style.width=`${clamp(game.boss.hp/game.boss.maxHp*100,0,100)}%`}else show(ui.bossBar,false);
  ui.dashButton.classList.toggle('cooldown',p.dashReady>0);ui.dashButton.querySelector('span').textContent=p.dashReady>0?`${p.dashReady.toFixed(1)}s`:'SPRONG';
}

function loop(now){const dt=Math.min(.033,(now-lastTime)/1000||0);lastTime=now;update(dt);render();updateHud();requestAnimationFrame(loop)}

window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='Space'&&!e.repeat)attemptDash();
  if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat)togglePause();
  if(game.phase==='levelup'&&['Digit1','Digit2','Digit3'].includes(e.code)){const index=Number(e.code.at(-1))-1;ui.choiceGrid.children[index]?.click()}
  if(game.phase==='shop'&&['Digit1','Digit2','Digit3'].includes(e.code)){const index=Number(e.code.at(-1))-1;ui.shopGrid.children[index]?.click()}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(game.phase==='playing')togglePause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='playing')togglePause()});

buttons.start.addEventListener('click',startRun);buttons.restart.addEventListener('click',startRun);buttons.pause.addEventListener('click',()=>togglePause());buttons.resume.addEventListener('click',()=>togglePause(true));
buttons.nextWave.addEventListener('click',()=>startWave(game.wave+1));ui.dashButton.addEventListener('pointerdown',e=>{e.preventDefault();attemptDash()});
ui.soundButton.addEventListener('click',()=>{sound.enabled=!sound.enabled;ui.soundButton.textContent=sound.enabled?'🔊':'🔇';if(sound.enabled)sound.tone(520,.08,.03)});
buttons.fullscreen.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{}});

function updateJoystickFromEvent(e){const r=ui.joystick.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const max=r.width*.34;const len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max}joystick.x=dx/max;joystick.y=dy/max;ui.joystickKnob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`}
ui.joystick.addEventListener('pointerdown',e=>{joystick.active=true;joystick.pointerId=e.pointerId;ui.joystick.setPointerCapture(e.pointerId);updateJoystickFromEvent(e)});
ui.joystick.addEventListener('pointermove',e=>{if(joystick.active&&e.pointerId===joystick.pointerId)updateJoystickFromEvent(e)});
function releaseJoystick(e){if(e.pointerId!==joystick.pointerId)return;joystick.active=false;joystick.pointerId=null;joystick.x=joystick.y=0;ui.joystickKnob.style.transform='translate(-50%,-50%)'}
ui.joystick.addEventListener('pointerup',releaseJoystick);ui.joystick.addEventListener('pointercancel',releaseJoystick);

renderWeaponBar();updateHud();requestAnimationFrame(loop);
