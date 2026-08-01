import { GAME_CONFIG, DIFFICULTY_STAGES } from "./config.js";
import { AssetLoader } from "./assets.js";
import { AudioManager } from "./audio.js";
import { DifficultyDirector, clamp } from "./difficulty.js";
import { InputController } from "./input.js";
import { ObstacleScheduler } from "./obstacles.js";
import { applyUpgrade, createDefaultModifiers, draftUpgradeChoices } from "./upgrades.js";

const $ = selector => document.querySelector(selector);

class TarentaalDashGame {
  constructor() {
    this.canvas = $("#game");
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.canvas.width = GAME_CONFIG.canvas.width;
    this.canvas.height = GAME_CONFIG.canvas.height;

    this.ui = {
      loading: $("#loadingOverlay"),
      loadingBar: $("#loadingBar"),
      loadingText: $("#loadingText"),
      start: $("#startOverlay"),
      gameOver: $("#gameOverOverlay"),
      pause: $("#pauseOverlay"),
      upgrade: $("#upgradeOverlay"),
      upgradeChoices: $("#upgradeChoices"),
      upgradeSubtitle: $("#upgradeSubtitle"),
      startButton: $("#startButton"),
      restartButton: $("#restartButton"),
      pauseButton: $("#pauseButton"),
      musicButton: $("#musicButton"),
      soundButton: $("#soundButton"),
      fullscreenButton: $("#fullscreenButton"),
      jumpButton: $("#jumpButton"),
      duckButton: $("#duckButton"),
      actionWarning: $("#actionWarning"),
      score: $("#score"),
      best: $("#best"),
      speed: $("#speedLabel"),
      stage: $("#stageLabel"),
      combo: $("#comboLabel"),
      comboPill: $("#comboPill"),
      shield: $("#shieldLabel"),
      health: $("#healthLabel"),
      talentCount: $("#talentCount"),
      corn: $("#cornCount"),
      potato: $("#potatoCount"),
      trendFill: $("#trendFill"),
      intensityFill: $("#intensityFill"),
      difficultyCaption: $("#difficultyCaption"),
      finalScore: $("#finalScore"),
      finalRank: $("#finalRank"),
      finalCombo: $("#finalCombo"),
      finalSpeed: $("#finalSpeed"),
      finalNear: $("#finalNear"),
      finalDuck: $("#finalDuck"),
      finalSaves: $("#finalSaves"),
      finalHits: $("#finalHits"),
      finalTalents: $("#finalTalents"),
      finalCorn: $("#finalCorn"),
      finalPotato: $("#finalPotato")
    };

    this.audio = new AudioManager();
    this.assetLoader = new AssetLoader();
    this.images = {};
    this.rng = Math.random;
    this.director = new DifficultyDirector(this.rng);
    this.scheduler = new ObstacleScheduler(this.rng);
    this.lastTimestamp = performance.now();
    this.state = "loading";
    this.best = this.readBestScore();
    this.ui.best.textContent = String(this.best);

    this.input = new InputController({
      canvas: this.canvas,
      jumpButton: this.ui.jumpButton,
      duckButton: this.ui.duckButton,
      pauseButton: this.ui.pauseButton,
      onJump: () => this.handleJump(),
      onDuck: active => this.handleDuck(active),
      onPause: force => this.handlePause(force)
    });

    this.bindUi();
    this.resetWorld();
  }

  async init() {
    try {
      this.images = await this.assetLoader.load(progress => {
        const percentage = Math.round(progress * 100);
        this.ui.loadingBar.style.width = `${percentage}%`;
        this.ui.loadingText.textContent = `Laai plaas-pad kuns… ${percentage}%`;
      });
      this.state = "ready";
      this.ui.loading.classList.add("hidden");
      this.ui.start.classList.remove("hidden");
      this.draw();
      requestAnimationFrame(timestamp => this.loop(timestamp));
      window.__TARENTAAL_V5__ = { ready: true, version: GAME_CONFIG.version, game: this };
    } catch (error) {
      console.error(error);
      this.ui.loadingText.textContent = "Die spel kon nie al sy kuns laai nie. Herlaai asseblief.";
      window.__TARENTAAL_V5__ = { ready: false, error: String(error) };
    }
  }

  bindUi() {
    this.ui.startButton.addEventListener("click", () => this.startRun());
    this.ui.restartButton.addEventListener("click", () => this.startRun());
    this.ui.musicButton.addEventListener("click", () => {
      const enabled = this.audio.toggleMusic();
      this.ui.musicButton.textContent = enabled ? "🎵 Musiek" : "🎵 Af";
    });
    this.ui.soundButton.addEventListener("click", () => {
      const enabled = this.audio.toggleSfx();
      this.ui.soundButton.textContent = enabled ? "🔊 SFX" : "🔇 SFX";
    });
    this.ui.upgradeChoices.addEventListener("click", event => {
      const button = event.target.closest?.("[data-upgrade-id]");
      if (button) this.chooseUpgrade(button.dataset.upgradeId);
    });
    window.addEventListener("keydown", event => {
      if (this.state !== "upgrade") return;
      const index = ["Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"].indexOf(event.code);
      if (index < 0) return;
      event.preventDefault();
      const choiceIndex = index % 3;
      const choice = this.currentUpgradeChoices?.[choiceIndex];
      if (choice) this.chooseUpgrade(choice.id);
    });
    this.ui.fullscreenButton.addEventListener("click", async () => {
      const shell = $(".game-shell");
      try {
        if (!document.fullscreenElement) await shell.requestFullscreen?.();
        else await document.exitFullscreen?.();
      } catch (error) {
        console.warn("Volskerm is nie beskikbaar nie", error);
      }
    });
  }

  readBestScore() {
    try {
      const keys = [GAME_CONFIG.storageKey, ...(GAME_CONFIG.legacyStorageKeys ?? [])];
      return Math.max(0, ...keys.map(key => Number(localStorage.getItem(key) || 0)));
    } catch { return 0; }
  }

  writeBestScore(value) {
    try { localStorage.setItem(GAME_CONFIG.storageKey, String(value)); }
    catch { /* Private browsing can disable storage. */ }
  }

  resetWorld() {
    const { groundY } = GAME_CONFIG.canvas;
    const playerConfig = GAME_CONFIG.player;
    this.score = 0;
    this.distance = 0;
    this.speed = GAME_CONFIG.difficulty.baseSpeed;
    this.maxSpeed = this.speed;
    this.cornCount = 0;
    this.potatoCount = 0;
    this.modifiers = createDefaultModifiers();
    this.health = GAME_CONFIG.progression.baseHealth;
    this.damageTaken = 0;
    this.damageFlashFrames = 0;
    this.upgradeLevels = {};
    this.chosenUpgrades = [];
    this.currentUpgradeChoices = [];
    this.pendingUpgrade = null;
    this.upgradeWaitFrames = 0;
    this.lastDifficulty = { trend: 0, intensity: 0.08, event: "normal", stage: DIFFICULTY_STAGES[0], speed: this.speed };
    this.comboCount = 0;
    this.bestCombo = 0;
    this.multiplier = 1;
    this.shieldActive = false;
    this.shieldFrames = 0;
    this.shieldSaves = 0;
    this.invulnerableFrames = 0;
    this.nearMisses = 0;
    this.duckDodges = 0;
    this.duckHeld = false;
    this.jumpBuffer = 0;
    this.coyoteFrames = playerConfig.coyoteFrames;
    this.landingLockFrames = 0;
    this.crashFrames = 0;
    this.shake = 0;
    this.lastStageName = DIFFICULTY_STAGES[0].name;
    this.lastEvent = "normal";
    this.eventAnnouncementCooldown = 0;
    this.nearestObstacle = null;
    this.actionWarning = null;
    this.nextCollectibleWorld = 920;
    this.obstacles = [];
    this.collectibles = [];
    this.dust = [];
    this.popups = [];
    this.director.reset();
    this.scheduler.reset();
    this.player = {
      y: groundY - playerConfig.standHeight,
      vy: 0,
      grounded: true,
      ducking: false,
      frame: 0,
      frameTimer: 0,
      airborneLastFrame: false
    };
    this.backgroundBirds = [
      { x: 1030, y: 104, speed: 0.82, scale: 0.72, flap: 0.2 },
      { x: 760, y: 154, speed: 0.62, scale: 0.55, flap: 1.8 },
      { x: 1180, y: 207, speed: 0.74, scale: 0.64, flap: 3.2 }
    ];
    this.scenery = [
      { asset: "cornCluster", baseX: 170, depth: 0.15, scale: 0.52 },
      { asset: "grass1", baseX: 430, depth: 0.23, scale: 0.62 },
      { asset: "cornTall", baseX: 710, depth: 0.18, scale: 0.47 },
      { asset: "sign2", baseX: 980, depth: 0.16, scale: 0.47 },
      { asset: "grass3", baseX: 1220, depth: 0.24, scale: 0.64 },
      { asset: "cornSmall", baseX: 1480, depth: 0.19, scale: 0.52 },
      { asset: "grass2", baseX: 1780, depth: 0.22, scale: 0.62 }
    ];
    this.updateHud({ trend: 0, intensity: 0.08, stage: DIFFICULTY_STAGES[0] });
  }

  startRun() {
    this.resetWorld();
    this.state = "running";
    this.ui.start.classList.add("hidden");
    this.ui.gameOver.classList.add("hidden");
    this.ui.pause.classList.add("hidden");
    this.ui.upgrade.classList.add("hidden");
    this.ui.pauseButton.textContent = "⏸ Pouse";
    this.audio.setCrashed(false);
    void this.audio.playMusic();
    this.createDust(12, GAME_CONFIG.player.x + 35, GAME_CONFIG.canvas.groundY - 5, 1.3);
  }

  handleJump() {
    if (this.state === "ready" || this.state === "gameover") {
      this.startRun();
      return;
    }
    if (this.state !== "running") return;
    this.jumpBuffer = GAME_CONFIG.player.jumpBufferFrames;
  }

  handleDuck(active) {
    this.duckHeld = active;
    if (!active) this.ui.duckButton.classList.remove("is-held");
  }

  handlePause(forcePause = false) {
    if (forcePause && this.state !== "running") return;
    if (this.state === "running") {
      this.state = "paused";
      this.ui.pause.classList.remove("hidden");
      this.ui.pauseButton.textContent = "▶ Hervat";
      this.audio.pauseMusic();
      this.duckHeld = false;
      this.player.ducking = false;
      this.ui.duckButton.classList.remove("is-held");
    } else if (!forcePause && this.state === "paused") {
      this.state = "running";
      this.ui.pause.classList.add("hidden");
      this.ui.pauseButton.textContent = "⏸ Pouse";
      this.lastTimestamp = performance.now();
      void this.audio.playMusic();
    }
  }

  loop(timestamp) {
    const dt = clamp((timestamp - this.lastTimestamp) / 16.6667, 0.1, 2.15);
    this.lastTimestamp = timestamp;

    if (this.state === "running") this.update(dt);
    else if (this.state === "crashed") this.updateCrash(dt);
    else this.updateAmbient(dt * 0.35);

    this.updateEffects(dt);
    this.draw();
    requestAnimationFrame(next => this.loop(next));
  }

  update(dt) {
    const difficulty = this.director.update(dt);
    this.lastDifficulty = difficulty;
    this.speed = difficulty.speed;
    this.maxSpeed = Math.max(this.maxSpeed, this.speed);
    this.distance += this.speed * dt;
    this.score += this.speed * GAME_CONFIG.scoring.distanceRate * dt;
    this.invulnerableFrames = Math.max(0, this.invulnerableFrames - dt);
    this.damageFlashFrames = Math.max(0, this.damageFlashFrames - dt);
    this.eventAnnouncementCooldown = Math.max(0, this.eventAnnouncementCooldown - dt);
    if (this.pendingUpgrade) this.upgradeWaitFrames += dt;

    this.handleDifficultyFeedback(difficulty);
    this.scheduler.ensureAhead({
      distance: this.distance,
      speed: this.speed,
      difficulty,
      addObstacle: obstacle => this.obstacles.push(obstacle),
      onGroup: group => this.scheduleGroupRewards(group)
    });
    this.scheduleLooseCollectibles();
    this.updatePlayer(dt);
    this.updateAmbient(dt);
    this.updateObstacles();
    if (this.state !== "running") return;
    this.updateCollectibles(dt);
    this.updateShield(dt);
    this.updateWarning();
    this.updateHud(difficulty);
    this.maybeOpenUpgrade();
  }

  handleDifficultyFeedback(difficulty) {
    if (difficulty.stage.name !== this.lastStageName) {
      const stageIndex = DIFFICULTY_STAGES.findIndex(stage => stage.name === difficulty.stage.name);
      const bonus = 50 + stageIndex * 35;
      this.score += bonus;
      this.addPopup(`${difficulty.stage.name}! +${bonus}`, GAME_CONFIG.player.x + 140, this.player.y - 28, "#fff1a8");
      this.audio.playStage(stageIndex);
      this.lastStageName = difficulty.stage.name;
      if (stageIndex > 0) {
        this.pendingUpgrade = { stageIndex, stageName: difficulty.stage.name };
        this.upgradeWaitFrames = 0;
      }
    }

    if (
      difficulty.event !== this.lastEvent &&
      difficulty.event !== "normal" &&
      this.eventAnnouncementCooldown <= 0
    ) {
      if (difficulty.event === "surge") {
        this.addPopup("Stormloop!", GAME_CONFIG.canvas.width - 220, 245, "#ffb36c");
      } else {
        this.addPopup("Rustige stuk", GAME_CONFIG.canvas.width - 235, 245, "#d9f3cf");
      }
      this.eventAnnouncementCooldown = 160;
    }
    this.lastEvent = difficulty.event;
  }

  updatePlayer(dt) {
    const config = GAME_CONFIG.player;
    const groundStandingY = GAME_CONFIG.canvas.groundY - config.standHeight;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.landingLockFrames = Math.max(0, this.landingLockFrames - dt);
    this.player.ducking = this.duckHeld && this.player.grounded;

    if (this.jumpBuffer > 0 && (this.player.grounded || this.coyoteFrames > 0) && this.landingLockFrames <= 0) {
      this.player.vy = config.jumpVelocity;
      this.player.grounded = false;
      this.player.airborneLastFrame = true;
      this.player.ducking = false;
      this.jumpBuffer = 0;
      this.coyoteFrames = 0;
      this.createDust(10, GAME_CONFIG.player.x + 28, GAME_CONFIG.canvas.groundY - 5, 1.45);
      this.audio.playJump();
    }

    if (!this.player.grounded) {
      this.player.vy += config.gravity * dt;
      if (this.duckHeld && this.player.vy > -4) this.player.vy += config.fastDropGravity * dt;
      this.player.y += this.player.vy * dt;

      if (this.player.y >= groundStandingY) {
        if (this.player.airborneLastFrame) {
          this.createDust(13, GAME_CONFIG.player.x + 38, GAME_CONFIG.canvas.groundY - 5, 1.55);
        }
        this.player.y = groundStandingY;
        this.player.vy = 0;
        this.player.grounded = true;
        this.player.airborneLastFrame = false;
        this.coyoteFrames = config.coyoteFrames;
        this.landingLockFrames = config.landingRecoveryFrames * 0.45;
      } else {
        this.coyoteFrames = Math.max(0, this.coyoteFrames - dt);
      }
    } else {
      this.player.y = groundStandingY;
      this.coyoteFrames = config.coyoteFrames;
      this.player.frameTimer += dt * (this.speed / 7.8);
      const frameStep = this.player.ducking ? 3.8 : 3.0;
      if (this.player.frameTimer >= frameStep) {
        this.player.frameTimer = 0;
        this.player.frame = (this.player.frame + 1) % (this.player.ducking ? 2 : 5);
      }
      if (Math.random() < 0.10 * dt) {
        this.createDust(1, GAME_CONFIG.player.x + 18, GAME_CONFIG.canvas.groundY - 6, 0.9);
      }
    }
  }

  updateAmbient(dt) {
    for (const bird of this.backgroundBirds) {
      bird.x -= bird.speed * dt * (0.75 + this.speed * 0.025);
      bird.flap += 0.08 * dt;
      if (bird.x < 78) {
        bird.x = GAME_CONFIG.canvas.width + 95 + Math.random() * 260;
        bird.y = 82 + Math.random() * 145;
        bird.scale = 0.48 + Math.random() * 0.34;
        bird.speed = 0.58 + Math.random() * 0.38;
      }
    }
  }

  updateObstacles() {
    const playerHitbox = this.getPlayerHitbox();

    for (const obstacle of this.obstacles) {
      const screenX = obstacle.worldX - this.distance;
      const obstacleHitbox = this.getObstacleHitbox(obstacle, screenX);
      const horizontalOverlap = playerHitbox.x < obstacleHitbox.x + obstacleHitbox.w &&
        playerHitbox.x + playerHitbox.w > obstacleHitbox.x;

      if (obstacle.action === "jump" && horizontalOverlap && !obstacle.hitSpent) {
        const clearance = obstacleHitbox.y - (playerHitbox.y + playerHitbox.h);
        if (clearance >= -2) obstacle.minClearance = Math.min(obstacle.minClearance, clearance);
      }
      if (obstacle.action === "duck" && horizontalOverlap && this.player.ducking) obstacle.duckSeen = true;

      if (
        !obstacle.hitSpent &&
        this.invulnerableFrames <= 0 &&
        this.rectOverlap(playerHitbox, obstacleHitbox)
      ) {
        if (this.shieldActive) this.useShield(obstacle);
        else {
          this.takeDamage(obstacle);
          if (this.state !== "running") return;
        }
      }

      if (!obstacle.passed && screenX + obstacle.width < GAME_CONFIG.player.x) {
        obstacle.passed = true;
        this.awardObstacleBonus(obstacle);
      }
    }

    this.obstacles = this.obstacles.filter(obstacle => obstacle.worldX + obstacle.width > this.distance - 120);
  }

  awardObstacleBonus(obstacle) {
    if (
      obstacle.action === "jump" &&
      !obstacle.hitSpent &&
      obstacle.minClearance >= 0 &&
      obstacle.minClearance <= 34
    ) {
      this.nearMisses += 1;
      const bonus = Math.round(GAME_CONFIG.scoring.nearMiss * this.modifiers.nearMissMultiplier);
      this.score += bonus;
      this.addPopup(`Naby! +${bonus}`, GAME_CONFIG.player.x + 100, this.player.y - 10, "#fff1a8");
      this.audio.playNearMiss();
    }

    if (obstacle.action === "duck" && !obstacle.hitSpent && obstacle.duckSeen) {
      this.duckDodges += 1;
      const bonus = Math.round(GAME_CONFIG.scoring.duckUnder * this.modifiers.duckBonusMultiplier);
      this.score += bonus;
      this.addPopup(`Onderdeur! +${bonus}`, GAME_CONFIG.player.x + 105, GAME_CONFIG.canvas.groundY - 115, "#bfeeff");
      this.audio.playDuckBonus();
    }
  }

  scheduleGroupRewards(group) {
    if (group.action !== "jump" || Math.random() > 0.43) return;
    const count = Math.random() < 0.55 ? 3 : 1;
    const center = group.startWorld + group.span * 0.5;
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * 56;
      this.addCollectible(
        Math.random() < 0.78 ? "corn" : "potato",
        center + offset,
        GAME_CONFIG.canvas.groundY - 176 - Math.sin((index + 1) / (count + 1) * Math.PI) * 38
      );
    }
  }

  scheduleLooseCollectibles() {
    const target = this.distance + GAME_CONFIG.canvas.width + 1500;
    while (this.nextCollectibleWorld < target) {
      let type = "corn";
      if (!this.shieldActive && this.score > 300 && Math.random() < 0.055 + this.modifiers.featherChanceBonus) type = "feather";
      else if (Math.random() < 0.28) type = "potato";

      const count = type === "corn" && Math.random() < 0.38 ? 3 : type === "potato" && Math.random() < 0.18 ? 2 : 1;
      let baseWorld = this.nextCollectibleWorld;
      const closeObstacle = this.obstacles.find(obstacle => Math.abs(obstacle.worldX - baseWorld) < 130);
      if (closeObstacle) baseWorld = closeObstacle.worldX + closeObstacle.width + 150;

      for (let index = 0; index < count; index += 1) {
        const y = type === "feather"
          ? GAME_CONFIG.canvas.groundY - 220
          : GAME_CONFIG.canvas.groundY - 145 - Math.random() * 70 - (type === "potato" ? 10 : 0);
        this.addCollectible(type, baseWorld + index * 60, y);
      }
      this.nextCollectibleWorld = baseWorld + 760 + Math.random() * 780;
    }
  }

  addCollectible(type, worldX, y) {
    const sizes = {
      corn: { w: 42, h: 44 },
      potato: { w: 42, h: 36 },
      feather: { w: 48, h: 58 }
    };
    this.collectibles.push({
      id: `c-${worldX}-${Math.random()}`,
      type,
      worldX,
      y,
      ...sizes[type],
      bob: Math.random() * Math.PI * 2,
      collected: false,
      missed: false
    });
  }

  updateCollectibles(dt) {
    const playerHitbox = this.getPlayerHitbox();
    for (const collectible of this.collectibles) {
      collectible.bob += 0.07 * dt;
      const screenX = collectible.worldX - this.distance;
      const padding = this.modifiers.collectionPadding;
      const hitbox = {
        x: screenX + 6 - padding,
        y: collectible.y + 6 + Math.sin(collectible.bob) * 5 - padding,
        w: collectible.w - 12 + padding * 2,
        h: collectible.h - 12 + padding * 2
      };

      if (!collectible.collected && this.rectOverlap(playerHitbox, hitbox)) this.collectItem(collectible);
      if (!collectible.collected && !collectible.missed && screenX + collectible.w < GAME_CONFIG.player.x) {
        collectible.missed = true;
        if (collectible.type !== "feather") this.breakCombo(screenX, collectible.y);
      }
    }

    this.collectibles = this.collectibles.filter(collectible =>
      !collectible.collected && collectible.worldX + collectible.w > this.distance - 100
    );
  }

  collectItem(collectible) {
    collectible.collected = true;
    if (collectible.type === "feather") {
      this.shieldActive = true;
      this.shieldFrames = GAME_CONFIG.scoring.shieldFrames * this.modifiers.shieldDurationMultiplier;
      this.addPopup("Veerkrag!", collectible.worldX - this.distance, collectible.y, "#bdefff");
      this.audio.playCollect("feather");
      return;
    }

    this.comboCount += 1;
    this.bestCombo = Math.max(this.bestCombo, this.comboCount);
    const oldMultiplier = this.multiplier;
    this.multiplier = Math.min(this.modifiers.maxMultiplier, 1 + Math.floor(this.comboCount / this.modifiers.comboStep));
    if (this.multiplier !== oldMultiplier) this.ui.comboPill.classList.add("combo-pop");
    setTimeout(() => this.ui.comboPill.classList.remove("combo-pop"), 260);

    const base = collectible.type === "corn" ? GAME_CONFIG.scoring.corn : GAME_CONFIG.scoring.potato;
    const itemMultiplier = collectible.type === "corn" ? this.modifiers.cornMultiplier : this.modifiers.potatoMultiplier;
    const gained = Math.round(base * itemMultiplier * this.multiplier);
    this.score += gained;

    if (collectible.type === "corn") this.cornCount += 1;
    else this.potatoCount += 1;
    this.addPopup(`+${gained}`, collectible.worldX - this.distance, collectible.y, collectible.type === "corn" ? "#ffe36e" : "#e8c69b");
    this.audio.playCollect(collectible.type);
  }

  breakCombo(x, y) {
    if (this.comboCount >= 4) this.addPopup("Combo gebreek", x, y, "#ffd3c8");
    this.comboCount = 0;
    this.multiplier = 1;
  }

  updateShield(dt) {
    if (!this.shieldActive) return;
    this.shieldFrames -= dt;
    if (this.shieldFrames <= 0) {
      this.shieldActive = false;
      this.shieldFrames = 0;
      this.addPopup("Veerkrag verby", GAME_CONFIG.player.x + 90, this.player.y - 10, "#d8f3ff");
    }
  }

  useShield(obstacle) {
    this.shieldActive = false;
    this.shieldFrames = 0;
    this.shieldSaves += 1;
    this.invulnerableFrames = 62;
    this.shake = 8;
    obstacle.hitSpent = true;
    for (const groupObstacle of this.obstacles) {
      if (groupObstacle.groupIndex === obstacle.groupIndex) groupObstacle.hitSpent = true;
    }
    this.score += GAME_CONFIG.scoring.shieldSave;
    this.addPopup("Veerkrag! +50", GAME_CONFIG.player.x + 95, this.player.y - 15, "#bdefff");
    this.audio.playShield();
    this.createDust(18, GAME_CONFIG.player.x + 50, GAME_CONFIG.canvas.groundY - 12, 1.5);
  }

  takeDamage(obstacle) {
    this.health -= 1;
    this.damageTaken += 1;
    this.damageFlashFrames = 28;
    this.invulnerableFrames = GAME_CONFIG.progression.damageInvulnerabilityFrames * this.modifiers.damageInvulnerabilityMultiplier;
    this.shake = 12;
    const penalty = Math.min(Math.floor(this.score), Math.round(GAME_CONFIG.progression.damageScorePenalty * this.modifiers.damagePenaltyMultiplier));
    this.score = Math.max(0, this.score - penalty);
    this.breakCombo(GAME_CONFIG.player.x + 95, this.player.y - 15);
    for (const groupObstacle of this.obstacles) {
      if (groupObstacle.groupIndex === obstacle.groupIndex) groupObstacle.hitSpent = true;
    }
    this.addPopup(`Eina! -❤️ -${penalty}`, GAME_CONFIG.player.x + 105, this.player.y - 18, "#ffd0cb");
    this.audio.playDamage();
    this.createDust(20, GAME_CONFIG.player.x + 50, GAME_CONFIG.canvas.groundY - 10, 1.65);
    if (this.health <= 0) this.endGame();
  }

  maybeOpenUpgrade() {
    if (!this.pendingUpgrade || this.state !== "running" || !this.player.grounded) return;
    const safeAhead = Math.max(
      GAME_CONFIG.progression.upgradeSafeAheadBase,
      this.speed * GAME_CONFIG.progression.upgradeSafeAheadFrames
    );
    const dangerClose = this.obstacles.some(obstacle => {
      if (obstacle.passed || obstacle.hitSpent) return false;
      const screenX = obstacle.worldX - this.distance;
      return screenX + obstacle.width > GAME_CONFIG.player.x - 120 && screenX < GAME_CONFIG.player.x + safeAhead;
    });
    const forced = this.upgradeWaitFrames >= GAME_CONFIG.progression.upgradeForceAfterFrames;
    if (!dangerClose || forced) this.openUpgradeChoice();
  }

  openUpgradeChoice() {
    this.currentUpgradeChoices = draftUpgradeChoices({ levels: this.upgradeLevels, count: 3, rng: this.rng });
    if (this.currentUpgradeChoices.length === 0) {
      this.pendingUpgrade = null;
      return;
    }
    this.state = "upgrade";
    this.duckHeld = false;
    this.player.ducking = false;
    this.ui.duckButton.classList.remove("is-held");
    this.ui.upgradeSubtitle.textContent = `${this.pendingUpgrade.stageName}: kies een verbetering vir hierdie rondte.`;
    this.ui.upgradeChoices.innerHTML = this.currentUpgradeChoices.map((definition, index) => {
      const nextLevel = (this.upgradeLevels[definition.id] ?? 0) + 1;
      return `<button class="upgrade-choice" type="button" data-upgrade-id="${definition.id}">
        <span class="upgrade-number">${index + 1}</span>
        <span class="upgrade-icon">${definition.icon}</span>
        <span class="upgrade-name">${definition.name}</span>
        <span class="upgrade-level">Vlak ${nextLevel}/${definition.maxLevel}</span>
        <span class="upgrade-description">${definition.description(nextLevel)}</span>
      </button>`;
    }).join("");
    this.ui.upgrade.classList.remove("hidden");
    this.audio.pauseMusic();
  }

  chooseUpgrade(id) {
    if (this.state !== "upgrade" || !this.currentUpgradeChoices.some(choice => choice.id === id)) return;
    const selected = applyUpgrade({ modifiers: this.modifiers, levels: this.upgradeLevels, id });
    this.chosenUpgrades.push(selected);
    if (selected.instant?.heal) this.health = Math.min(this.modifiers.maxHealth, this.health + selected.instant.heal);
    if (selected.instant?.grantShield) {
      this.shieldActive = true;
      this.shieldFrames = GAME_CONFIG.scoring.shieldFrames * this.modifiers.shieldDurationMultiplier;
    }
    this.pendingUpgrade = null;
    this.upgradeWaitFrames = 0;
    this.currentUpgradeChoices = [];
    this.ui.upgrade.classList.add("hidden");
    this.state = "running";
    this.lastTimestamp = performance.now();
    this.addPopup(`${selected.definition.name}!`, GAME_CONFIG.player.x + 135, this.player.y - 35, "#efffae");
    this.audio.playUpgrade();
    void this.audio.playMusic();
    this.updateHud(this.lastDifficulty);
  }

  updateWarning() {
    const upcoming = this.obstacles
      .filter(obstacle => !obstacle.passed && !obstacle.hitSpent && obstacle.worldX - this.distance > GAME_CONFIG.player.x)
      .sort((a, b) => a.worldX - b.worldX)[0] ?? null;
    this.nearestObstacle = upcoming;
    this.actionWarning = null;

    if (!upcoming) {
      this.ui.actionWarning.classList.remove("show");
      return;
    }

    const screenX = upcoming.worldX - this.distance;
    const warningDistance = Math.max(
      GAME_CONFIG.rendering.warningDistanceBase,
      this.speed * GAME_CONFIG.rendering.warningSpeedFrames
    );
    if (upcoming.action === "duck" && screenX - GAME_CONFIG.player.x < warningDistance) {
      this.actionWarning = "↓ DUIK";
      this.ui.actionWarning.textContent = "↓ DUIK — hou laag";
      this.ui.actionWarning.classList.add("show", "duck-warning");
      this.ui.actionWarning.classList.remove("jump-warning");
    } else if (upcoming.action === "jump" && screenX - GAME_CONFIG.player.x < warningDistance * 0.72) {
      this.actionWarning = "↑ SPRING";
      this.ui.actionWarning.textContent = "↑ SPRING";
      this.ui.actionWarning.classList.add("show", "jump-warning");
      this.ui.actionWarning.classList.remove("duck-warning");
    } else {
      this.ui.actionWarning.classList.remove("show");
    }
  }

  updateHud(difficulty) {
    this.ui.score.textContent = String(Math.floor(this.score));
    this.ui.best.textContent = String(this.best);
    this.ui.speed.textContent = `${(this.speed / GAME_CONFIG.difficulty.baseSpeed).toFixed(1)}x`;
    this.ui.stage.textContent = difficulty.stage.short ?? difficulty.stage.name;
    this.ui.combo.textContent = `x${this.multiplier}`;
    this.ui.shield.textContent = this.shieldActive ? `${Math.max(1, Math.ceil(this.shieldFrames / 60))}s` : "—";
    this.ui.health.textContent = `${"❤️".repeat(this.health)}${"🖤".repeat(Math.max(0, this.modifiers.maxHealth - this.health))}`;
    this.ui.talentCount.textContent = String(this.chosenUpgrades.length);
    this.ui.corn.textContent = String(this.cornCount);
    this.ui.potato.textContent = String(this.potatoCount);
    this.ui.trendFill.style.width = `${difficulty.trend * 100}%`;
    this.ui.intensityFill.style.width = `${difficulty.intensity * 100}%`;
    this.ui.difficultyCaption.textContent = `${difficulty.stage.name} • ${difficulty.event === "surge" ? "storm" : difficulty.event === "calm" ? "kalm" : "vloei"}`;
  }

  endGame() {
    if (this.state !== "running") return;
    this.state = "crashed";
    this.crashFrames = 0;
    this.shake = 14;
    this.player.vy = 0;
    this.audio.setCrashed(true);
    this.audio.playCrash();
    this.createDust(18, GAME_CONFIG.player.x + 42, GAME_CONFIG.canvas.groundY - 6, 1.85);

    const finalScore = Math.floor(this.score);
    if (finalScore > this.best) {
      this.best = finalScore;
      this.writeBestScore(this.best);
      this.ui.best.textContent = String(this.best);
    }
  }

  updateCrash(dt) {
    this.crashFrames += dt;
    this.updateAmbient(dt * 0.4);
    if (this.crashFrames >= 46) this.showGameOver();
  }

  showGameOver() {
    this.state = "gameover";
    const finalScore = Math.floor(this.score);
    this.ui.finalScore.textContent = String(finalScore);
    this.ui.finalRank.textContent = this.getRank(finalScore);
    this.ui.finalCombo.textContent = String(this.bestCombo);
    this.ui.finalSpeed.textContent = `${(this.maxSpeed / GAME_CONFIG.difficulty.baseSpeed).toFixed(1)}x`;
    this.ui.finalNear.textContent = String(this.nearMisses);
    this.ui.finalDuck.textContent = String(this.duckDodges);
    this.ui.finalSaves.textContent = String(this.shieldSaves);
    this.ui.finalHits.textContent = String(this.damageTaken);
    this.ui.finalTalents.textContent = this.chosenUpgrades.length
      ? this.chosenUpgrades.map(item => `${item.definition.icon} ${item.definition.name} ${item.level}`).join(" • ")
      : "Geen talente gekies nie.";
    this.ui.finalCorn.textContent = String(this.cornCount);
    this.ui.finalPotato.textContent = String(this.potatoCount);
    this.ui.gameOver.classList.remove("hidden");
  }

  getRank(score) {
    if (score < 500) return "Verdwaalde Kuiken";
    if (score < 1300) return "Grondpad Galloper";
    if (score < 2800) return "Mielie Meester";
    if (score < 5000) return "Plaaspad Kampioen";
    return "Legendariese Tarentaal";
  }

  getPlayerHitbox() {
    const config = GAME_CONFIG.player;
    if (this.player.grounded && this.player.ducking) {
      const y = GAME_CONFIG.canvas.groundY - config.duckHeight;
      return {
        x: config.x + config.duckHitbox.x,
        y: y + config.duckHitbox.y,
        w: config.duckHitbox.w,
        h: config.duckHitbox.h
      };
    }
    return {
      x: config.x + config.standHitbox.x,
      y: this.player.y + config.standHitbox.y,
      w: config.standHitbox.w,
      h: config.standHitbox.h
    };
  }

  getObstacleY(obstacle) {
    if (Number.isFinite(obstacle.absoluteY)) return obstacle.absoluteY;
    return GAME_CONFIG.canvas.groundY - obstacle.height + obstacle.groundOffset;
  }

  getObstacleHitbox(obstacle, screenX) {
    const y = this.getObstacleY(obstacle);
    return {
      x: screenX + obstacle.width * obstacle.hitbox.x,
      y: y + obstacle.height * obstacle.hitbox.y,
      w: obstacle.width * obstacle.hitbox.w,
      h: obstacle.height * obstacle.hitbox.h
    };
  }

  rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  createDust(count, x, y, intensity = 1) {
    for (let index = 0; index < count; index += 1) {
      this.dust.push({
        x: x + Math.random() * 28 - 10,
        y: y + Math.random() * 8 - 4,
        vx: (-2 - Math.random() * 3.2) * intensity,
        vy: (-1.4 - Math.random() * 3) * intensity,
        radius: (3 + Math.random() * 8) * intensity,
        life: 24 + Math.random() * 28
      });
    }
  }

  addPopup(text, x, y, color) {
    this.popups.push({ text, x, y, color, vy: -1.15, life: 44 });
  }

  updateEffects(dt) {
    for (const particle of this.dust) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 0.10 * dt;
      particle.life -= dt;
    }
    this.dust = this.dust.filter(particle => particle.life > 0);

    for (const popup of this.popups) {
      popup.y += popup.vy * dt;
      popup.life -= dt;
    }
    this.popups = this.popups.filter(popup => popup.life > 0);
    this.shake *= Math.pow(GAME_CONFIG.rendering.cameraShakeDecay, dt);
  }

  getEnvironment() {
    const phase = (this.distance / GAME_CONFIG.rendering.dayCycleDistance) % 1;
    let darkness = 0;
    let warmth = 0;
    let stars = 0;
    if (phase > 0.38 && phase <= 0.52) {
      const t = (phase - 0.38) / 0.14;
      warmth = Math.sin(t * Math.PI) * 0.28;
      darkness = t * 0.20;
    } else if (phase > 0.52 && phase <= 0.84) {
      const t = (phase - 0.52) / 0.32;
      darkness = 0.20 + Math.sin(t * Math.PI) * 0.50;
      stars = Math.sin(t * Math.PI) * 0.82;
    } else if (phase > 0.84) {
      const t = (phase - 0.84) / 0.16;
      darkness = (1 - t) * 0.20;
      warmth = Math.sin(t * Math.PI) * 0.18;
    }
    return { phase, darkness, warmth, stars };
  }

  draw() {
    const context = this.ctx;
    const { width, height } = GAME_CONFIG.canvas;
    const env = this.getEnvironment();
    const shakeX = this.shake > 0.2 ? (Math.random() - 0.5) * this.shake : 0;
    const shakeY = this.shake > 0.2 ? (Math.random() - 0.5) * this.shake * 0.5 : 0;

    context.save();
    context.translate(shakeX, shakeY);
    context.clearRect(-20, -20, width + 40, height + 40);
    context.drawImage(this.images.background, 0, 0, width, height);
    this.drawSky(env);
    this.drawBackgroundBirds(env);
    this.drawScenery();
    this.drawRoadDetails();
    this.drawCollectibles();
    this.drawObstacles();
    this.drawDust();
    if (this.shieldActive) this.drawShield();
    this.drawPlayer();
    this.drawPopups();
    if (this.director.currentIntensity > 0.78 && this.state === "running") this.drawSpeedLines();
    this.drawNightTint(env);
    context.restore();
  }

  drawSky(env) {
    const context = this.ctx;
    const { width } = GAME_CONFIG.canvas;
    if (env.phase < 0.54) {
      const sunX = width * (env.phase / 0.54);
      const sunY = 155 - Math.sin(env.phase / 0.54 * Math.PI) * 100;
      context.save();
      context.globalAlpha = 0.72;
      context.fillStyle = "#fff3a4";
      context.beginPath();
      context.arc(sunX, sunY, 31, 0, Math.PI * 2);
      context.fill();
      context.restore();
    } else {
      const t = (env.phase - 0.54) / 0.46;
      const moonX = width * t;
      const moonY = 150 - Math.sin(t * Math.PI) * 92;
      context.save();
      context.globalAlpha = Math.max(0, env.stars);
      context.fillStyle = "#eef5e7";
      context.beginPath();
      context.arc(moonX, moonY, 24, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    if (env.stars > 0.05) {
      context.save();
      context.globalAlpha = env.stars;
      context.fillStyle = "#fffde0";
      for (let index = 0; index < 28; index += 1) {
        const x = 45 + (index * 83) % 1180;
        const y = 35 + (index * 47) % 235;
        const radius = 1 + (index % 3) * 0.55;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
  }

  drawBackgroundBirds(env) {
    const context = this.ctx;
    context.save();
    context.globalAlpha = 0.42 * (1 - env.darkness * 0.55);
    context.strokeStyle = "#293b43";
    context.lineCap = "round";
    for (const bird of this.backgroundBirds) {
      if (bird.x < 80 || bird.x > GAME_CONFIG.canvas.width - 80) continue;
      const flap = Math.sin(bird.flap) * 7 * bird.scale;
      context.lineWidth = 5 * bird.scale;
      context.beginPath();
      context.moveTo(bird.x - 28 * bird.scale, bird.y + flap);
      context.quadraticCurveTo(bird.x - 12 * bird.scale, bird.y - 12 * bird.scale, bird.x, bird.y);
      context.quadraticCurveTo(bird.x + 12 * bird.scale, bird.y - 12 * bird.scale, bird.x + 28 * bird.scale, bird.y + flap);
      context.stroke();
    }
    context.restore();
  }

  drawScenery() {
    const context = this.ctx;
    const cycle = 2100;
    for (const item of this.scenery) {
      let x = item.baseX - (this.distance * item.depth) % cycle;
      while (x < -180) x += cycle;
      const image = this.images[item.asset];
      const width = image.width * item.scale;
      const height = image.height * item.scale;
      const y = GAME_CONFIG.canvas.groundY - height + 3;
      context.globalAlpha = 0.72;
      context.drawImage(image, x, y, width, height);
      context.globalAlpha = 1;
    }
  }

  drawRoadDetails() {
    const context = this.ctx;
    const roadTop = GAME_CONFIG.canvas.groundY + 5;
    const { width, height } = GAME_CONFIG.canvas;
    const gradient = context.createLinearGradient(0, roadTop, 0, height);
    gradient.addColorStop(0, "rgba(187,101,39,.08)");
    gradient.addColorStop(1, "rgba(91,44,26,.16)");
    context.fillStyle = gradient;
    context.fillRect(0, roadTop, width, height - roadTop);

    const offset = (this.distance * 0.92) % 92;
    context.strokeStyle = "rgba(108,60,33,.25)";
    context.lineWidth = 4;
    for (let x = -120 - offset; x < width + 120; x += 92) {
      context.beginPath();
      context.moveTo(x, roadTop + 35);
      context.quadraticCurveTo(x + 28, roadTop + 22, x + 58, roadTop + 37);
      context.stroke();
    }
  }

  drawCollectibles() {
    const context = this.ctx;
    for (const collectible of this.collectibles) {
      const x = collectible.worldX - this.distance;
      if (x < -80 || x > GAME_CONFIG.canvas.width + 80) continue;
      const y = collectible.y + Math.sin(collectible.bob) * 5;
      const image = this.images[collectible.type];
      context.save();
      context.shadowColor = collectible.type === "feather" ? "rgba(102,221,255,.9)" : "rgba(255,224,96,.48)";
      context.shadowBlur = collectible.type === "feather" ? 18 : 8;
      context.drawImage(image, x, y, collectible.w, collectible.h);
      context.restore();
    }
  }

  drawObstacles() {
    const context = this.ctx;
    for (const obstacle of this.obstacles) {
      const x = obstacle.worldX - this.distance;
      if (x + obstacle.width < -80 || x > GAME_CONFIG.canvas.width + 160) continue;
      const y = this.getObstacleY(obstacle);
      context.save();
      if (obstacle.hitSpent) context.globalAlpha = 0.42;
      context.drawImage(this.images[obstacle.asset], x, y, obstacle.width, obstacle.height);
      context.restore();
    }

    if (this.nearestObstacle) {
      const obstacle = this.nearestObstacle;
      const x = obstacle.worldX - this.distance;
      if (x < GAME_CONFIG.canvas.width - 40 && x > GAME_CONFIG.player.x + 120) {
        const y = this.getObstacleY(obstacle) - 30;
        const duck = obstacle.action === "duck";
        const pulse = 1 + Math.sin(performance.now() * 0.009) * 0.08;
        context.save();
        context.translate(x + obstacle.width / 2, y);
        context.scale(pulse, pulse);
        context.fillStyle = duck ? "rgba(19,160,181,.94)" : "rgba(241,100,44,.92)";
        context.strokeStyle = "rgba(255,255,255,.95)";
        context.lineWidth = 4;
        context.beginPath();
        context.arc(0, 0, 22, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = "#fff";
        context.font = "900 25px system-ui";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(duck ? "↓" : "↑", 0, -1);
        context.restore();
      }
    }
  }

  drawPlayer() {
    const context = this.ctx;
    const config = GAME_CONFIG.player;
    context.save();
    if (this.invulnerableFrames > 0 && Math.floor(this.invulnerableFrames / 5) % 2 === 0) context.globalAlpha = 0.40;
    if (this.state === "crashed" || this.state === "gameover") {
      context.globalAlpha = 1;
      context.drawImage(this.images.crash, config.x - 16, GAME_CONFIG.canvas.groundY - 86, 184, 85);
      context.restore();
      return;
    }

    if (!this.player.grounded) {
      context.drawImage(this.images.jump, config.x - 3, this.player.y - 5, 126, 148);
      context.restore();
      return;
    }

    if (this.player.ducking) {
      const image = this.images[`duck${this.player.frame % 2 + 1}`];
      context.drawImage(image, config.x - 8, GAME_CONFIG.canvas.groundY - 83, 145, 76);
      context.restore();
      return;
    }

    const image = this.images[`run${this.player.frame % 5 + 1}`];
    const bob = Math.sin(this.player.frame * 1.7) * 1.5;
    context.drawImage(image, config.x, this.player.y + bob - 2, 112, 142);
    context.restore();
  }

  drawShield() {
    const context = this.ctx;
    const config = GAME_CONFIG.player;
    const centerY = this.player.grounded && this.player.ducking
      ? GAME_CONFIG.canvas.groundY - 43
      : this.player.y + 72;
    const centerX = config.x + 58;
    const pulse = 5 + Math.sin(performance.now() * 0.008) * 3;
    context.save();
    context.strokeStyle = "rgba(100,220,255,.92)";
    context.fillStyle = "rgba(110,220,255,.10)";
    context.lineWidth = 5;
    context.shadowColor = "rgba(96,218,255,.95)";
    context.shadowBlur = 18;
    context.beginPath();
    context.ellipse(centerX, centerY, 69 + pulse, 78 + pulse, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  drawDust() {
    const context = this.ctx;
    context.save();
    for (const particle of this.dust) {
      context.globalAlpha = clamp(particle.life / 50, 0, 0.45);
      context.fillStyle = "#c9874b";
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  drawPopups() {
    const context = this.ctx;
    context.save();
    context.textAlign = "center";
    context.font = "900 21px system-ui";
    for (const popup of this.popups) {
      context.globalAlpha = clamp(popup.life / 18, 0, 1);
      context.lineWidth = 5;
      context.strokeStyle = "rgba(20,34,42,.68)";
      context.strokeText(popup.text, popup.x, popup.y);
      context.fillStyle = popup.color;
      context.fillText(popup.text, popup.x, popup.y);
    }
    context.restore();
  }

  drawSpeedLines() {
    const context = this.ctx;
    context.save();
    context.strokeStyle = "rgba(255,255,255,.28)";
    context.lineWidth = 4;
    for (let index = 0; index < 7; index += 1) {
      const y = 215 + index * 54;
      const x = GAME_CONFIG.canvas.width - ((this.distance * (1.1 + index * 0.07)) % 1500);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + 95 + index * 7, y);
      context.stroke();
    }
    context.restore();
  }

  drawNightTint(env) {
    const context = this.ctx;
    const { width, height } = GAME_CONFIG.canvas;
    if (env.warmth > 0) {
      context.fillStyle = `rgba(255,117,52,${env.warmth})`;
      context.fillRect(0, 0, width, height);
    }
    if (env.darkness > 0) {
      context.fillStyle = `rgba(9,30,57,${env.darkness * 0.72})`;
      context.fillRect(0, 0, width, height);
    }
  }
}

const game = new TarentaalDashGame();
void game.init();
