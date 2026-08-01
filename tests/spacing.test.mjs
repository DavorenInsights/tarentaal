import assert from "node:assert/strict";
import { GAME_CONFIG } from "../js/config.js";
import {
  OBSTACLE_DEFINITIONS,
  ObstacleScheduler,
  buildObstacleGroup,
  createSeededRng,
  getPhysicsEnvelope,
  requiredTransitionGap,
  validateSequence
} from "../js/obstacles.js";

const rng = createSeededRng(20260801);
let generated = 0;
let doubles = 0;
let triples = 0;
let duckGroups = 0;
let rhythmGroups = 0;

for (let index = 0; index < 30000; index += 1) {
  const trend = rng();
  const intensity = rng();
  const speed = GAME_CONFIG.difficulty.baseSpeed +
    (GAME_CONFIG.difficulty.maxSpeed - GAME_CONFIG.difficulty.baseSpeed) * trend;
  const validationSpeed = Math.min(GAME_CONFIG.difficulty.maxSpeed, speed + GAME_CONFIG.difficulty.validationSpeedBuffer);
  const group = buildObstacleGroup({
    trend,
    intensity,
    speed: validationSpeed,
    groupIndex: Math.floor(trend * 90),
    lastAction: rng() < 0.3 ? "duck" : "jump",
    rng
  });
  const result = validateSequence(group, validationSpeed);
  assert.equal(result.valid, true, `Invalid group: ${result.issues.join(", ")}`);
  assert.ok(group.span > 0, "Every group needs a positive span");
  assert.ok(group.obstacles.every(obstacle => obstacle.width > 0), "Every width must be positive");
  if (group.obstacles.length === 2) doubles += 1;
  if (group.obstacles.length === 3) triples += 1;
  if (group.action === "duck") duckGroups += 1;
  if (group.pattern === "rhythm") rhythmGroups += 1;
  generated += 1;
}

assert.ok(doubles > 1000, "Double patterns should be generated later in runs");
assert.ok(triples > 100, "Triple patterns should exist but remain occasional");
assert.ok(duckGroups > 1000, "Duck hazards should form a meaningful share");
assert.ok(rhythmGroups > 200, "Rhythm patterns should exist after warmup");

const schedulerRng = createSeededRng(44221);
const scheduler = new ObstacleScheduler(schedulerRng);
const obstacles = [];
const groups = [];
let distance = 0;
let lastGroup = null;

for (let tick = 0; tick < 600; tick += 1) {
  const trend = Math.min(1, tick / 500);
  const intensity = 0.15 + 0.80 * schedulerRng();
  const speed = GAME_CONFIG.difficulty.baseSpeed +
    (GAME_CONFIG.difficulty.maxSpeed - GAME_CONFIG.difficulty.baseSpeed) * trend;
  scheduler.ensureAhead({
    distance,
    speed,
    difficulty: { trend, intensity, event: schedulerRng() < 0.1 ? "surge" : "normal" },
    addObstacle: obstacle => obstacles.push(obstacle),
    onGroup: group => groups.push(group)
  });
  distance += speed * 8;
}

for (const group of groups) {
  if (lastGroup) {
    const conservativeSpeed = Math.min(
      GAME_CONFIG.difficulty.maxSpeed,
      GAME_CONFIG.difficulty.baseSpeed +
        (GAME_CONFIG.difficulty.maxSpeed - GAME_CONFIG.difficulty.baseSpeed) * group.trend +
        GAME_CONFIG.difficulty.validationSpeedBuffer
    );
    const actualTrailingGap = group.startWorld - lastGroup.endWorld;
    const required = requiredTransitionGap(lastGroup.action, group.action, conservativeSpeed, group.intensity);
    assert.ok(
      actualTrailingGap + 0.01 >= required,
      `Unsafe action transition: ${lastGroup.action}→${group.action}, actual ${actualTrailingGap}, required ${required}`
    );
  }
  lastGroup = group;
}


const player = GAME_CONFIG.player;
const groundY = GAME_CONFIG.canvas.groundY;
const standingTop = groundY - player.standHeight + player.standHitbox.y;
const standingBottom = standingTop + player.standHitbox.h;
const duckTop = groundY - player.duckHeight + player.duckHitbox.y;
const duckBottom = duckTop + player.duckHitbox.h;

for (const definition of Object.values(OBSTACLE_DEFINITIONS).filter(item => item.action === "duck")) {
  const obstacleTop = definition.absoluteY + definition.height * definition.hitbox.y;
  const obstacleBottom = obstacleTop + definition.height * definition.hitbox.h;
  const standingCollision = standingTop < obstacleBottom && standingBottom > obstacleTop;
  const duckCollision = duckTop < obstacleBottom && duckBottom > obstacleTop;
  assert.equal(standingCollision, true, `${definition.id} must hit a standing player`);
  assert.equal(duckCollision, false, `${definition.id} must clear a ducking player`);
}

for (const speed of [GAME_CONFIG.difficulty.baseSpeed, 15, 20, GAME_CONFIG.difficulty.maxSpeed]) {
  const envelope = getPhysicsEnvelope(speed);
  assert.ok(envelope.airtimeFrames > 38 && envelope.airtimeFrames < 41, "Airtime should remain stable and predictable");
  assert.ok(envelope.jumpHeight > 180, "Jump height must clear the tallest jump obstacle");
  assert.ok(envelope.jumpClusterSpan > 180, "Cluster clearance must be useful at all speeds");
}

console.log(JSON.stringify({
  generated,
  doubles,
  triples,
  duckGroups,
  rhythmGroups,
  scheduledGroups: groups.length,
  scheduledObstacles: obstacles.length
}, null, 2));
