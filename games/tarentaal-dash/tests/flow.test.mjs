import assert from "node:assert/strict";
import { FlowMeter } from "../js/flow.js";

const flow = new FlowMeter({ max: 100, durationFrames: 10, decayPerFrame: 1, cooldownFrames: 2 });
assert.equal(flow.active, false);
assert.equal(flow.add(40), false);
assert.equal(flow.value, 40);
assert.equal(flow.add(60), true);
assert.equal(flow.active, true);
assert.equal(flow.scoreMultiplier, 2);
flow.update(10);
assert.equal(flow.active, false);
assert.equal(flow.value, 0);
assert.equal(flow.activations, 1);
flow.add(50);
flow.break();
assert.equal(flow.value, 0);
assert.equal(flow.active, false);
console.log(JSON.stringify({ activations: flow.activations }));
