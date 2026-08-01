export const GAME_CONFIG = Object.freeze({
  version: "6.0.1",
  storageKey: "tarentaalDashV6Best",
  legacyStorageKeys: Object.freeze(["tarentaalDashV5Best", "tarentaalDashV4Best"]),
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
    trendSeconds: 220,
    baseSpeed: 9.6,
    maxSpeed: 24.2,
    speedTimeConstant: 118,
    intensityRefreshMinFrames: 155,
    intensityRefreshMaxFrames: 345,
    intensitySmoothing: 0.017,
    validationSpeedBuffer: 2.2,
    spawnLead: 190,
    lookAhead: 1850,
    minimumFirstGap: 950,
    calmChance: 0.19,
    surgeChanceBase: 0.07,
    surgeChanceTrend: 0.17,
    maximumJumpClusterUse: 0.72,
    maximumDuckHoldFrames: 92,
    optionalGapMin: 85,
    optionalGapMax: 480,
    actionChangeExtra: 68
  }),
  progression: Object.freeze({
    baseHealth: 3,
    damageInvulnerabilityFrames: 108,
    damageScorePenalty: 60
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
  flow: Object.freeze({
    max: 100,
    durationFrames: 390,
    decayPerFrame: 0.045,
    cooldownFrames: 105,
    cornGain: 5,
    potatoGain: 9,
    nearMissGain: 16,
    duckGain: 14,
    shieldGain: 20
  }),
  rendering: Object.freeze({
    dayCycleDistance: 30000,
    warningDistanceBase: 560,
    warningSpeedFrames: 27,
    tutorialWarningGroups: 10,
    cameraShakeDecay: 0.82,
    mobileParticleScale: 0.62
  })
});

export const DIFFICULTY_STAGES = Object.freeze([
  Object.freeze({ threshold: 0.00, name: "Opwarming", short: "Warm" }),
  Object.freeze({ threshold: 0.18, name: "Plaaspad-tempo", short: "Tempo" }),
  Object.freeze({ threshold: 0.38, name: "Ritme", short: "Ritme" }),
  Object.freeze({ threshold: 0.61, name: "Stormloop", short: "Storm" }),
  Object.freeze({ threshold: 0.82, name: "Legendaries", short: "Legend" })
]);
