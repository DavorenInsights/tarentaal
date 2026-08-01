import assert from "node:assert/strict";
import { REGIONS, ROUTE_DISTANCE, ROUTE_TRANSITION_DISTANCE, getRegionState } from "../js/regions.js";

assert.equal(REGIONS.length, 4, "The first route loop should contain four regions");
assert.deepEqual(REGIONS.map(region => region.id), ["pretoria", "bloemfontein", "karoo", "lowveld"]);

const start = getRegionState(0);
assert.equal(start.current.id, "pretoria");
assert.equal(start.display.id, "pretoria");
assert.equal(start.transition, 0);

const bloem = getRegionState(ROUTE_DISTANCE + 100);
assert.equal(bloem.current.id, "bloemfontein");
assert.equal(bloem.display.id, "bloemfontein");

const beforeTransition = getRegionState(ROUTE_DISTANCE - ROUTE_TRANSITION_DISTANCE - 1);
assert.equal(beforeTransition.transition, 0);
assert.equal(beforeTransition.display.id, "pretoria");

const midTransition = getRegionState(ROUTE_DISTANCE - ROUTE_TRANSITION_DISTANCE / 2);
assert.ok(midTransition.transition > 0.45 && midTransition.transition < 0.55);
assert.equal(midTransition.current.id, "pretoria");
assert.equal(midTransition.next.id, "bloemfontein");

const lateTransition = getRegionState(ROUTE_DISTANCE - 100);
assert.equal(lateTransition.display.id, "bloemfontein");
assert.equal(lateTransition.displaySerial, 1);

const loop = getRegionState(ROUTE_DISTANCE * REGIONS.length + 10);
assert.equal(loop.current.id, "pretoria", "The endless route should loop back to Pretoria");
assert.equal(loop.routeIndex, 4);

console.log(JSON.stringify({ regions: REGIONS.map(region => region.name), routeDistance: ROUTE_DISTANCE }));
