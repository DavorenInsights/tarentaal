import assert from "node:assert/strict";
import fs from "node:fs";
import { REGIONS, getRegionState, ROUTE_DISTANCE } from "../js/regions.js";
import { IMAGE_ASSETS } from "../js/assets.js";

const ids = ["pretoria", "bloemfontein", "graaff-reinet", "mbombela", "cape-town", "durban", "gqeberha", "clarens", "upington"];
assert.deepEqual(REGIONS.map(region => region.id), ids);

for (const [index, region] of REGIONS.entries()) {
  assert.ok(region.imageKey);
  assert.ok(region.roadTop);
  assert.ok(region.roadBottom);
  assert.equal(getRegionState(ROUTE_DISTANCE * index + 10).display.id, region.id);
  const relativePath = IMAGE_ASSETS[region.imageKey];
  assert.ok(relativePath, `${region.name} must have a registered background asset`);
  const fileUrl = new URL(`../${relativePath.replace('./', '')}`, import.meta.url);
  assert.ok(fs.existsSync(fileUrl), `${region.name} background asset must exist`);
}

console.log(JSON.stringify({ regions: REGIONS.length, routeDistance: ROUTE_DISTANCE }));
