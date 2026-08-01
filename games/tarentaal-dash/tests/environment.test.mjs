import assert from "node:assert/strict";
import { REGIONS, getRegionState, ROUTE_DISTANCE } from "../js/regions.js";

assert.deepEqual(REGIONS.map(region => region.id), ["pretoria", "bloemfontein", "karoo", "lowveld"]);
for (const region of REGIONS) {
  assert.ok(region.imageKey);
  assert.ok(region.roadTop);
  assert.ok(region.roadBottom);
}
assert.equal(getRegionState(0).display.id, "pretoria");
assert.equal(getRegionState(ROUTE_DISTANCE + 10).display.id, "bloemfontein");
assert.equal(getRegionState(ROUTE_DISTANCE * 2 + 10).display.id, "karoo");
assert.equal(getRegionState(ROUTE_DISTANCE * 3 + 10).display.id, "lowveld");
console.log(JSON.stringify({ regions: REGIONS.length, routeDistance: ROUTE_DISTANCE }));
