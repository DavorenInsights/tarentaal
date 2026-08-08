import assert from "node:assert/strict";
import { REGIONS, ROUTE_DISTANCE, ROUTE_TRANSITION_DISTANCE, getRegionState } from "../js/regions.js";

const ids = ["pretoria", "bloemfontein", "graaff-reinet", "mbombela", "cape-town", "durban", "gqeberha", "clarens", "upington"];
assert.equal(REGIONS.length, 9, "The route loop should contain nine locations");
assert.deepEqual(REGIONS.map(region => region.id), ids);
assert.ok(REGIONS.every(region => typeof region.reaction === "string" && region.reaction.length > 0), "Every route location should have a short tarentaal reaction");
assert.equal(ROUTE_DISTANCE, 40000, "Each location should span 400 displayed metres");
assert.ok(ROUTE_TRANSITION_DISTANCE < ROUTE_DISTANCE / 4, "Transitions should occupy only the final part of a location");

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

ids.forEach((id, index) => {
  assert.equal(getRegionState(ROUTE_DISTANCE * index + 10).current.id, id);
});

const loop = getRegionState(ROUTE_DISTANCE * REGIONS.length + 10);
assert.equal(loop.current.id, "pretoria", "The endless route should loop back to Pretoria");
assert.equal(loop.routeIndex, 9);

console.log(JSON.stringify({ regions: REGIONS.map(region => region.name), routeDistance: ROUTE_DISTANCE }));
