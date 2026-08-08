import assert from "node:assert/strict";
import fs from "node:fs";
import { OBSTACLE_DEFINITIONS } from "../js/obstacles.js";

const duckObstacles = Object.values(OBSTACLE_DEFINITIONS).filter(item => item.action === "duck");
assert.ok(duckObstacles.length >= 4, "Dash should provide varied bird duck obstacles");
assert.ok(duckObstacles.every(item => /hadeda|crow|eagle|vulture/i.test(item.asset)), "Every duck obstacle must use a bird asset");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../css/game.css", import.meta.url), "utf8");
const rushTrack = new URL("../assets/audio/krrr_rush.mp3", import.meta.url);
const worldPolish = fs.readFileSync(new URL("../js/world-polish.js", import.meta.url), "utf8");
assert.match(html, /class="top-hud"/, "The game should use the top HUD");
assert.match(html, /V6\.5/, "Presentation should identify the V6.5 build");
assert.ok(fs.existsSync(rushTrack), "The dedicated Krrr-Rush soundtrack should ship with the game");
assert.match(worldPolish, /drawSignatureLandmark/, "The living-road layer should include signature landmark reveals");
assert.match(html, /id="distanceLabel"/, "The top HUD should show distance");
assert.match(css, /html\[data-device="phone"\] \.game-shell[\s\S]*aspect-ratio: 3 \/ 4/, "Phone mode should use a portrait frame");
assert.match(css, /html\[data-device="laptop"\] \.game-shell[\s\S]*aspect-ratio: 16 \/ 9/, "Laptop mode should use a landscape frame");
console.log(JSON.stringify({ duckObstacles: duckObstacles.map(item => item.label), topHud: true }));
