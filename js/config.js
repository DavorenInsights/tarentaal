export const GAME_CONFIG = Object.freeze({
  version: "5.0.0",
  storageKey: "tarentaalDashV5Best",
  legacyStorageKeys: Object.freeze(["tarentaalDashV4Best"]),
  canvas: Object.freeze({ width: 1280, height: 720, groundY: 598 }),
  player: Object.freeze({
    x: 158,
    standWidth: 112,
    standHeight: 138,
    duckWidth: 132,
    duckHeight: 78,
    gravity: 0.94,
    jumpVelocity: -18.6,
    fastDropGravity: 1.28,
    coyoteFrames: 7,
    jumpBufferFrames: 8,
    landingRecoveryFrames: 9,
    jumpReactionFrames: 24,
    duckReactionFrames: 21,
    duckReleaseFrames: 8,
    standHitbox: Object.freeze({ x: 24, y: 18, w: 70, h: 110 }),
    duckHitbox: Object.freeze({ x: 17, y: 15, w: 98, h: 49 })
  }),
  difficulty: Object.freeze({
    trendSeconds: 210,
    baseSpeed: 9.8,
    maxSpeed: 24.5,
    speedTimeConstant: 112,
    intensityRefreshMinFrames: 145,
    intensityRefreshMaxFrames: 330,
    intensitySmoothing: 0.018,
    validationSpeedBuffer: 2.2,
    spawnLead: 190,
    lookAhead: 1850,
    minimumFirstGap: 920,
    calmChance: 0.18,
    surgeChanceBase: 0.08,
    surgeChanceTrend: 0.18,
    maximumJumpClusterUse: 0.72,
    maximumDuckHoldFrames: 92,
    optionalGapMin: 80,
    optionalGapMax: 470,
    actionChangeExtra: 65
  }),
  progression: Object.freeze({
    baseHealth: 3,
    damageInvulnerabilityFrames: 105,
    damageScorePenalty: 60,
    upgradeSafeAheadBase: 650,
    upgradeSafeAheadFrames: 31,
    upgradeForceAfterFrames: 660
  }),
  scoring: Object.freeze({
    distanceRate: 0.048,
    corn: 10,
    potato: 25,
    shieldSave: 50,
    nearMiss: 20,
    duckUnder: 25,
    shieldFrames: 600
  }),
  rendering: Object.freeze({
    dayCycleDistance: 28000,
    warningDistanceBase: 560,
    warningSpeedFrames: 27,
    cameraShakeDecay: 0.82
  })
});

export const DIFFICULTY_STAGES = Object.freeze([
  Object.freeze({ threshold: 0.00, name: "Opwarming", short: "Warm" }),
  Object.freeze({ threshold: 0.18, name: "Plaaspad-tempo", short: "Tempo" }),
  Object.freeze({ threshold: 0.38, name: "Ritme", short: "Ritme" }),
  Object.freeze({ threshold: 0.61, name: "Stormloop", short: "Storm" }),
  Object.freeze({ threshold: 0.82, name: "Legendaries", short: "Legend" })
]);
