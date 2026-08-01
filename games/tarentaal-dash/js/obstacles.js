import { GAME_CONFIG } from "./config.js";
import { clamp, lerp } from "./difficulty.js";

const JUMP = "jump";
const DUCK = "duck";

export const OBSTACLE_DEFINITIONS = Object.freeze({
  potholeSmall: Object.freeze({
    id: "potholeSmall", label: "Slaggat", action: JUMP, asset: "pothole1",
    width: 112, height: 48, groundOffset: 9,
    hitbox: Object.freeze({ x: 0.10, y: 0.38, w: 0.80, h: 0.48 }),
    earliest: 0.00, weight: 1.25, maxScale: 0.10
  }),
  potholeWide: Object.freeze({
    id: "potholeWide", label: "Breë slaggat", action: JUMP, asset: "pothole3",
    width: 154, height: 55, groundOffset: 9,
    hitbox: Object.freeze({ x: 0.08, y: 0.34, w: 0.84, h: 0.54 }),
    earliest: 0.14, weight: 0.92, maxScale: 0.15
  }),
  rockSmall: Object.freeze({
    id: "rockSmall", label: "Klip", action: JUMP, asset: "rock1",
    width: 92, height: 62, groundOffset: 1,
    hitbox: Object.freeze({ x: 0.12, y: 0.15, w: 0.76, h: 0.76 }),
    earliest: 0.00, weight: 1.15, maxScale: 0.10
  }),
  rockLarge: Object.freeze({
    id: "rockLarge", label: "Groot klip", action: JUMP, asset: "rock2",
    width: 124, height: 78, groundOffset: 1,
    hitbox: Object.freeze({ x: 0.10, y: 0.12, w: 0.80, h: 0.80 }),
    earliest: 0.39, weight: 0.72, maxScale: 0.12
  }),
  hayBale: Object.freeze({
    id: "hayBale", label: "Hooibaal", action: JUMP, asset: "hayBale",
    width: 104, height: 76, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.10, y: 0.12, w: 0.80, h: 0.80 }),
    earliest: 0.07, weight: 1.05, maxScale: 0.12
  }),
  fallenLog: Object.freeze({
    id: "fallenLog", label: "Boomstomp", action: JUMP, asset: "fallenLog",
    width: 142, height: 61, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.08, y: 0.18, w: 0.84, h: 0.68 }),
    earliest: 0.12, weight: 0.95, maxScale: 0.14
  }),
  crateStack: Object.freeze({
    id: "crateStack", label: "Kratte", action: JUMP, asset: "crateStack",
    width: 92, height: 98, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.08, y: 0.05, w: 0.84, h: 0.90 }),
    earliest: 0.30, weight: 0.75, maxScale: 0.08
  }),
  smallFence: Object.freeze({
    id: "smallFence", label: "Plaasheining", action: JUMP, asset: "smallFence",
    width: 150, height: 80, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.08, y: 0.12, w: 0.84, h: 0.78 }),
    earliest: 0.21, weight: 0.82, maxScale: 0.10
  }),
  woodGate: Object.freeze({
    id: "woodGate", label: "Plaashek", action: JUMP, asset: "woodGate",
    width: 164, height: 74, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.06, y: 0.10, w: 0.88, h: 0.80 }),
    earliest: 0.27, weight: 0.78, maxScale: 0.10
  }),
  metalGate: Object.freeze({
    id: "metalGate", label: "Metaalhek", action: JUMP, asset: "metalGate",
    width: 168, height: 72, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.06, y: 0.10, w: 0.88, h: 0.80 }),
    earliest: 0.54, weight: 0.64, maxScale: 0.10
  }),
  mudPuddle: Object.freeze({
    id: "mudPuddle", label: "Modderpoel", action: JUMP, asset: "mudPuddle",
    width: 154, height: 46, groundOffset: 10,
    hitbox: Object.freeze({ x: 0.08, y: 0.45, w: 0.84, h: 0.42 }),
    earliest: 0.13, weight: 0.86, maxScale: 0.18
  }),
  wheelbarrow: Object.freeze({
    id: "wheelbarrow", label: "Kruiwa", action: JUMP, asset: "wheelbarrow",
    width: 146, height: 94, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.10, y: 0.12, w: 0.80, h: 0.82 }),
    earliest: 0.52, weight: 0.62, maxScale: 0.08
  }),
  mielieSacks: Object.freeze({
    id: "mielieSacks", label: "Mieliesakke", action: JUMP, asset: "mielieSacks",
    width: 122, height: 88, groundOffset: 0,
    hitbox: Object.freeze({ x: 0.10, y: 0.10, w: 0.80, h: 0.84 }),
    earliest: 0.37, weight: 0.72, maxScale: 0.08
  }),
  lowHadeda: Object.freeze({
    id: "lowHadeda", label: "Lae hadeda", action: DUCK, asset: "lowHadeda",
    width: 146, height: 78, absoluteY: 432,
    hitbox: Object.freeze({ x: 0.08, y: 0.27, w: 0.84, h: 0.45 }),
    earliest: 0.15, weight: 1.20, maxScale: 0.07
  }),
  hadedaPair: Object.freeze({
    id: "hadedaPair", label: "Hadeda-paar", action: DUCK, asset: "hadedaPair",
    width: 192, height: 88, absoluteY: 420,
    hitbox: Object.freeze({ x: 0.06, y: 0.30, w: 0.88, h: 0.42 }),
    earliest: 0.24, weight: 0.94, maxScale: 0.05
  }),
  lowCrow: Object.freeze({
    id: "lowCrow", label: "Lae kraai", action: DUCK, asset: "lowCrow",
    width: 150, height: 75, absoluteY: 438,
    hitbox: Object.freeze({ x: 0.08, y: 0.28, w: 0.84, h: 0.42 }),
    earliest: 0.32, weight: 0.84, maxScale: 0.07
  }),
  lowEagle: Object.freeze({
    id: "lowEagle", label: "Lae arend", action: DUCK, asset: "lowEagle",
    width: 180, height: 88, absoluteY: 421,
    hitbox: Object.freeze({ x: 0.07, y: 0.28, w: 0.86, h: 0.44 }),
    earliest: 0.44, weight: 0.72, maxScale: 0.05
  }),
  lowVulture: Object.freeze({
    id: "lowVulture", label: "Lae aasvoël", action: DUCK, asset: "lowVulture",
    width: 192, height: 90, absoluteY: 416,
    hitbox: Object.freeze({ x: 0.07, y: 0.27, w: 0.86, h: 0.44 }),
    earliest: 0.58, weight: 0.62, maxScale: 0.05
  })
});

const DEFINITIONS = Object.values(OBSTACLE_DEFINITIONS);

export function createSeededRng(seed = 0x5f3759df) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function getPhysicsEnvelope(speed) {
  const player = GAME_CONFIG.player;
  const airtimeFrames = 2 * Math.abs(player.jumpVelocity) / player.gravity;
  const jumpHeight = (player.jumpVelocity * player.jumpVelocity) / (2 * player.gravity);
  return Object.freeze({
    speed,
    airtimeFrames,
    jumpHeight,
    jumpTravel: speed * airtimeFrames,
    jumpClusterSpan: Math.max(
      180,
      speed * airtimeFrames * GAME_CONFIG.difficulty.maximumJumpClusterUse - 40
    )
  });
}

export function requiredTransitionGap(fromAction, toAction, speed, intensity = 0.5) {
  const player = GAME_CONFIG.player;
  const envelope = getPhysicsEnvelope(speed);
  const breathing = lerp(95, 35, clamp(intensity));

  if (fromAction === JUMP) {
    const reactionFrames = toAction === DUCK
      ? player.duckReactionFrames
      : player.jumpReactionFrames;
    return speed * (
      envelope.airtimeFrames +
      player.landingRecoveryFrames +
      reactionFrames
    ) + breathing + (fromAction !== toAction ? GAME_CONFIG.difficulty.actionChangeExtra : 0);
  }

  const reactionFrames = toAction === JUMP
    ? player.jumpReactionFrames
    : player.duckReactionFrames * 0.58;
  return speed * (player.duckReleaseFrames + reactionFrames) + breathing +
    (fromAction !== toAction ? GAME_CONFIG.difficulty.actionChangeExtra : 0);
}

function weightedChoice(items, rng) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items.at(-1);
}

function availableDefinitions(action, trend, previousId = "") {
  return DEFINITIONS
    .filter(definition => definition.action === action && definition.earliest <= trend)
    .map(definition => ({
      ...definition,
      weight: definition.weight * (definition.id === previousId ? 0.22 : 1)
    }));
}

function chooseAction({ trend, intensity, groupIndex, lastAction, rng }) {
  if (groupIndex < 5 || trend < 0.15) return JUMP;
  let duckChance = 0.10 + trend * 0.22 + intensity * 0.20;
  if (lastAction === DUCK) duckChance *= 0.54;
  return rng() < clamp(duckChance, 0.08, 0.42) ? DUCK : JUMP;
}

function chooseCount({ trend, intensity, action, groupIndex, rng }) {
  if (groupIndex < 4 || trend < 0.12) return 1;

  const doubleChance = clamp((trend - 0.10) * 0.72 + intensity * 0.17, 0, 0.66);
  const tripleChance = trend > 0.50
    ? clamp((trend - 0.50) * 0.34 + intensity * 0.065, 0, 0.20)
    : 0;

  const roll = rng();
  let count = roll < tripleChance ? 3 : roll < tripleChance + doubleChance ? 2 : 1;
  if (action === DUCK) count = Math.min(2, count);
  return count;
}

function makeInstance(definition, scale, localX) {
  const width = definition.width * scale;
  const height = definition.height * scale;
  return {
    definitionId: definition.id,
    label: definition.label,
    action: definition.action,
    asset: definition.asset,
    localX,
    width,
    height,
    groundOffset: (definition.groundOffset ?? 0) * scale,
    absoluteY: definition.absoluteY,
    hitbox: definition.hitbox,
    scale
  };
}

export function validateSequence(group, speed) {
  const issues = [];
  const envelope = getPhysicsEnvelope(speed);
  const { obstacles, action, pattern, trend, intensity } = group;

  if (!obstacles.length) issues.push("empty-group");
  if (obstacles.some(obstacle => obstacle.action !== action)) issues.push("mixed-actions");
  if (action === DUCK && obstacles.length > 2) issues.push("duck-triple");
  if (trend < 0.12 && obstacles.length > 1) issues.push("too-early-multiple");
  if (trend < 0.50 && obstacles.length > 2) issues.push("too-early-triple");

  for (let index = 1; index < obstacles.length; index += 1) {
    const previous = obstacles[index - 1];
    const current = obstacles[index];
    const trailingGap = current.localX - (previous.localX + previous.width);
    if (trailingGap < 0) issues.push("overlap");

    if (pattern === "rhythm") {
      const required = requiredTransitionGap(action, action, speed, intensity);
      if (trailingGap + 0.01 < required) issues.push("rhythm-gap-too-small");
    }
  }

  const span = obstacles.length
    ? obstacles.at(-1).localX + obstacles.at(-1).width
    : 0;

  if (pattern === "cluster" && action === JUMP && span > envelope.jumpClusterSpan) {
    issues.push("jump-cluster-too-wide");
  }

  if (pattern === "cluster" && action === DUCK) {
    const maximumSpan = speed * GAME_CONFIG.difficulty.maximumDuckHoldFrames;
    if (span > maximumSpan) issues.push("duck-cluster-too-wide");
  }

  const maximumJumpObstacle = envelope.jumpHeight * 0.73;
  if (action === JUMP && obstacles.some(obstacle => obstacle.height > maximumJumpObstacle)) {
    issues.push("obstacle-too-tall");
  }

  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues), span });
}

export function buildObstacleGroup({
  trend,
  intensity,
  speed,
  groupIndex = 0,
  lastAction = JUMP,
  previousDefinitionId = "",
  rng = Math.random
}) {
  const action = chooseAction({ trend, intensity, groupIndex, lastAction, rng });
  const count = chooseCount({ trend, intensity, action, groupIndex, rng });
  const rhythmAllowed = trend >= 0.30 && count > 1;
  const pattern = rhythmAllowed && rng() < 0.32 + intensity * 0.18 ? "rhythm" : "cluster";

  for (let attempt = 0; attempt < 28; attempt += 1) {
    const obstacles = [];
    let localX = 0;
    let priorId = previousDefinitionId;

    for (let index = 0; index < count; index += 1) {
      const pool = availableDefinitions(action, trend, priorId);
      const definition = weightedChoice(pool, rng);
      const scale = 1 + definition.maxScale * intensity * (0.45 + rng() * 0.55);
      const instance = makeInstance(definition, scale, localX);
      obstacles.push(instance);
      priorId = definition.id;

      if (index < count - 1) {
        if (pattern === "cluster") {
          const smallGap = lerp(38, 17, intensity) + rng() * 20;
          localX += instance.width + smallGap;
        } else {
          localX += instance.width + requiredTransitionGap(action, action, speed, intensity) + rng() * 55;
        }
      }
    }

    const candidate = { action, pattern, trend, intensity, obstacles };
    const validation = validateSequence(candidate, speed);
    if (validation.valid) {
      return Object.freeze({
        ...candidate,
        span: validation.span,
        validationSpeed: speed
      });
    }
  }

  const fallbackPool = availableDefinitions(action, trend, previousDefinitionId);
  const fallback = weightedChoice(fallbackPool, rng);
  const obstacle = makeInstance(fallback, 1, 0);
  return Object.freeze({
    action,
    pattern: "cluster",
    trend,
    intensity,
    obstacles: Object.freeze([obstacle]),
    span: obstacle.width,
    validationSpeed: speed
  });
}

export class ObstacleScheduler {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.lastGroupEndWorld = 0;
    this.lastAction = JUMP;
    this.lastDefinitionId = "";
    this.groupIndex = 0;
  }

  ensureAhead({ distance, speed, difficulty, addObstacle, onGroup = () => {} }) {
    const config = GAME_CONFIG;
    const targetWorld = distance + config.canvas.width + config.difficulty.lookAhead;
    let safety = 0;

    while (this.lastGroupEndWorld < targetWorld && safety < 4) {
      safety += 1;
      const validationSpeed = Math.min(
        config.difficulty.maxSpeed,
        speed + config.difficulty.validationSpeedBuffer
      );
      const group = buildObstacleGroup({
        trend: difficulty.trend,
        intensity: difficulty.intensity,
        speed: validationSpeed,
        groupIndex: this.groupIndex,
        lastAction: this.lastAction,
        previousDefinitionId: this.lastDefinitionId,
        rng: this.rng
      });

      const minimumVisibleStart = distance + config.canvas.width + config.difficulty.spawnLead;
      const transition = this.groupIndex === 0
        ? config.difficulty.minimumFirstGap
        : requiredTransitionGap(
          this.lastAction,
          group.action,
          validationSpeed,
          difficulty.intensity
        );

      let optionalGap = lerp(
        config.difficulty.optionalGapMax,
        config.difficulty.optionalGapMin,
        difficulty.intensity
      ) + this.rng() * 150;

      if (difficulty.event === "calm") optionalGap += 230 + this.rng() * 250;
      if (difficulty.event === "surge") optionalGap *= 0.48;

      const startWorld = Math.max(
        minimumVisibleStart,
        this.lastGroupEndWorld + transition + optionalGap
      );

      const scheduled = group.obstacles.map((obstacle, index) => {
        const entity = {
          ...obstacle,
          id: `g${this.groupIndex}-o${index}`,
          worldX: startWorld + obstacle.localX,
          groupIndex: this.groupIndex,
          groupAction: group.action,
          pattern: group.pattern,
          hitSpent: false,
          passed: false,
          minClearance: Number.POSITIVE_INFINITY,
          duckSeen: false,
          warned: false
        };
        addObstacle(entity);
        return entity;
      });

      const endWorld = startWorld + group.span;
      onGroup(Object.freeze({ ...group, startWorld, endWorld, scheduled }));
      this.lastGroupEndWorld = endWorld;
      this.lastAction = group.action;
      this.lastDefinitionId = scheduled.at(-1)?.definitionId ?? this.lastDefinitionId;
      this.groupIndex += 1;
    }
  }
}
