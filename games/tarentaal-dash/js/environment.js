const TAU = Math.PI * 2;
const clamp01 = value => Math.max(0, Math.min(1, value));

function hash(value) {
  const x = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const parsed = Number.parseInt(value.length === 3
    ? value.split("").map(char => char + char).join("")
    : value, 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

function mixColor(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const values = ca.map((value, index) => Math.round(value + (cb[index] - value) * t));
  return `rgb(${values[0]},${values[1]},${values[2]})`;
}

function movingX(index, spacing, distance, depth, width, seed = 0) {
  const cycle = spacing * Math.ceil((width + spacing * 2) / spacing);
  const base = index * spacing + hash(index + seed) * spacing * 0.45;
  let x = base - (distance * depth) % cycle;
  while (x < -spacing) x += cycle;
  while (x > width + spacing) x -= cycle;
  return x;
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawJacaranda(context, x, groundY, scale, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.fillStyle = "#533c2d";
  roundedRect(context, -8, -108, 16, 112, 7);
  context.fill();
  context.strokeStyle = "#4c382b";
  context.lineWidth = 8;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, -76);
  context.lineTo(-34, -116);
  context.moveTo(2, -82);
  context.lineTo(39, -122);
  context.stroke();
  const colors = ["#7950a8", "#9365c1", "#ad7cda", "#c391ea"];
  const blobs = [
    [-45,-132,35],[-10,-149,42],[33,-139,38],[-62,-103,29],[-18,-111,41],[50,-104,29]
  ];
  blobs.forEach(([bx, by, radius], index) => {
    context.fillStyle = colors[(index + Math.floor(seed * 10)) % colors.length];
    context.beginPath();
    context.arc(bx, by, radius, 0, TAU);
    context.fill();
  });
  context.restore();
}

function drawWindpump(context, x, groundY, scale, alpha = 1) {
  context.save();
  context.globalAlpha *= alpha;
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.strokeStyle = "#4f5352";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-20, 0);
  context.lineTo(0, -128);
  context.lineTo(22, 0);
  context.moveTo(-13, -40);
  context.lineTo(15, -40);
  context.moveTo(-9, -72);
  context.lineTo(10, -72);
  context.stroke();
  context.beginPath();
  context.arc(0, -145, 34, 0, TAU);
  context.stroke();
  for (let index = 0; index < 10; index += 1) {
    const angle = index / 10 * TAU;
    context.beginPath();
    context.moveTo(0, -145);
    context.lineTo(Math.cos(angle) * 34, -145 + Math.sin(angle) * 34);
    context.stroke();
  }
  context.fillStyle = "#6b6257";
  context.beginPath();
  context.moveTo(34, -151);
  context.lineTo(72, -160);
  context.lineTo(68, -141);
  context.closePath();
  context.fill();
  context.restore();
}

function drawAcacia(context, x, groundY, scale, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.strokeStyle = "#54402d";
  context.lineWidth = 12;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, 2);
  context.lineTo(-3, -72);
  context.lineTo(-35, -110);
  context.moveTo(-3, -72);
  context.lineTo(38, -108);
  context.stroke();
  const green = seed > 0.5 ? "#456f39" : "#557c3d";
  context.fillStyle = green;
  context.beginPath();
  context.ellipse(-38, -122, 62, 24, -0.05, 0, TAU);
  context.ellipse(24, -124, 72, 27, 0.04, 0, TAU);
  context.ellipse(70, -114, 46, 20, 0.05, 0, TAU);
  context.fill();
  context.restore();
}

function drawAloe(context, x, groundY, scale, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.strokeStyle = seed > 0.5 ? "#315f3d" : "#3d7146";
  context.lineWidth = 7;
  context.lineCap = "round";
  [-30,-18,-8,8,18,30].forEach((dx, index) => {
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(dx * 0.5, -23, dx, -48 - (index % 2) * 9);
    context.stroke();
  });
  context.strokeStyle = "#8b4c31";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(0, -35);
  context.lineTo(0, -91);
  context.stroke();
  context.fillStyle = "#df7040";
  for (let y = -92; y > -119; y -= 8) {
    context.beginPath();
    context.ellipse(0, y, 10, 7, 0, 0, TAU);
    context.fill();
  }
  context.restore();
}

function drawScrub(context, x, groundY, scale, color, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.lineCap = "round";
  for (let index = 0; index < 7; index += 1) {
    const angle = -Math.PI * 0.86 + index / 6 * Math.PI * 0.72;
    const length = 25 + hash(seed * 17 + index) * 27;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    context.stroke();
  }
  context.restore();
}

function drawFence(context, distance, width, groundY, color, alpha = 0.55) {
  const offset = -((distance * 0.21) % 180);
  context.save();
  context.globalAlpha *= alpha;
  context.strokeStyle = color;
  context.lineWidth = 5;
  context.lineCap = "round";
  for (let x = offset - 180; x < width + 180; x += 180) {
    context.beginPath();
    context.moveTo(x, groundY - 4);
    context.lineTo(x + 7, groundY - 78);
    context.stroke();
  }
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, groundY - 56);
  context.lineTo(width, groundY - 56);
  context.moveTo(0, groundY - 29);
  context.lineTo(width, groundY - 29);
  context.stroke();
  context.restore();
}

function drawPretoriaLayer(context, distance, width, groundY, quality) {
  drawFence(context, distance, width, groundY - 4, "#513b2b", 0.42);
  const count = quality === "mobile" ? 5 : 7;
  for (let index = -1; index < count; index += 1) {
    const x = movingX(index, 330, distance, 0.28, width, 11);
    const seed = hash(index + 11);
    drawJacaranda(context, x, groundY - 5, 0.46 + seed * 0.16, seed);
  }
  // Purple petals drift across the road edge.
  const petals = quality === "mobile" ? 10 : 20;
  const time = performance.now() * 0.001;
  context.save();
  for (let index = 0; index < petals; index += 1) {
    const seed = hash(index + 222);
    const x = (seed * width + time * (18 + seed * 14) - distance * 0.03) % (width + 40) - 20;
    const y = groundY - 165 + ((index * 47 + time * 24) % 155);
    context.globalAlpha = 0.35 + seed * 0.35;
    context.fillStyle = index % 2 ? "#b786dd" : "#8f63bf";
    context.beginPath();
    context.ellipse(x, y, 4, 2, time + index, 0, TAU);
    context.fill();
  }
  context.restore();
}

function drawBloemLayer(context, distance, width, groundY, quality) {
  drawFence(context, distance, width, groundY - 5, "#574631", 0.58);
  const pumpX = movingX(0, 1550, distance, 0.10, width, 34);
  drawWindpump(context, pumpX, groundY - 12, 0.72, 0.62);
  const count = quality === "mobile" ? 12 : 20;
  for (let index = -2; index < count; index += 1) {
    const x = movingX(index, 92, distance, 0.42, width, 43);
    const seed = hash(index + 43);
    drawScrub(context, x, groundY - 6, 0.55 + seed * 0.45, index % 2 ? "#977932" : "#b38e3e", seed);
  }
  // Sandstone marker rocks.
  for (let index = -1; index < 5; index += 1) {
    const x = movingX(index, 480, distance, 0.33, width, 54);
    const seed = hash(index + 54);
    context.fillStyle = seed > 0.5 ? "#a95f3e" : "#8d5038";
    context.beginPath();
    context.ellipse(x, groundY - 12, 26 + seed * 18, 14 + seed * 8, -0.1, 0, TAU);
    context.fill();
  }
}

function drawGraaffReinetLayer(context, distance, width, groundY, quality) {
  drawFence(context, distance, width, groundY - 6, "#493b31", 0.48);
  const pumpX = movingX(0, 1750, distance, 0.12, width, 76);
  drawWindpump(context, pumpX, groundY - 8, 0.82, 0.72);
  const count = quality === "mobile" ? 11 : 18;
  for (let index = -2; index < count; index += 1) {
    const x = movingX(index, 115, distance, 0.45, width, 73);
    const seed = hash(index + 73);
    if (index % 5 === 0) drawAloe(context, x, groundY - 4, 0.46 + seed * 0.18, seed);
    else drawScrub(context, x, groundY - 4, 0.48 + seed * 0.44, seed > 0.5 ? "#6e7040" : "#827442", seed);
  }
  // Heat shimmer strips.
  context.save();
  context.globalAlpha = 0.11;
  context.strokeStyle = "#fff1c4";
  context.lineWidth = 2;
  for (let index = 0; index < 5; index += 1) {
    const y = groundY - 155 + index * 20;
    const offset = Math.sin(performance.now() * 0.0015 + index) * 22;
    context.beginPath();
    context.moveTo(offset, y);
    context.bezierCurveTo(width * 0.35, y - 4, width * 0.65, y + 5, width + offset, y);
    context.stroke();
  }
  context.restore();
}

function drawMbombelaLayer(context, distance, width, groundY, quality) {
  const treeCount = quality === "mobile" ? 4 : 6;
  for (let index = -1; index < treeCount; index += 1) {
    const x = movingX(index, 430, distance, 0.25, width, 91);
    const seed = hash(index + 91);
    drawAcacia(context, x, groundY - 6, 0.48 + seed * 0.17, seed);
  }
  const count = quality === "mobile" ? 9 : 15;
  for (let index = -2; index < count; index += 1) {
    const x = movingX(index, 145, distance, 0.48, width, 105);
    const seed = hash(index + 105);
    if (index % 3 === 0) drawAloe(context, x, groundY - 4, 0.45 + seed * 0.2, seed);
    else drawScrub(context, x, groundY - 4, 0.5 + seed * 0.38, seed > 0.5 ? "#416b3e" : "#557944", seed);
  }
  // Occasional termite mound.
  for (let index = -1; index < 4; index += 1) {
    const x = movingX(index, 620, distance, 0.34, width, 118);
    const seed = hash(index + 118);
    context.fillStyle = "#9a603b";
    context.beginPath();
    context.moveTo(x - 23, groundY - 3);
    context.quadraticCurveTo(x - 10, groundY - 55 - seed * 20, x, groundY - 78 - seed * 25);
    context.quadraticCurveTo(x + 18, groundY - 44, x + 29, groundY - 3);
    context.closePath();
    context.fill();
  }
}


function drawPalm(context, x, groundY, scale, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.strokeStyle = "#66513a";
  context.lineWidth = 11;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(8 + seed * 8, -76, 2, -146);
  context.stroke();
  context.strokeStyle = seed > 0.5 ? "#3e794f" : "#4c8754";
  context.lineWidth = 8;
  for (let index = 0; index < 7; index += 1) {
    const angle = -Math.PI * 0.92 + index * Math.PI * 0.31;
    context.beginPath();
    context.moveTo(2, -144);
    context.quadraticCurveTo(Math.cos(angle) * 42, -144 + Math.sin(angle) * 18, Math.cos(angle) * 78, -144 + Math.sin(angle) * 48);
    context.stroke();
  }
  context.restore();
}

function drawFynbos(context, x, groundY, scale, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.strokeStyle = seed > 0.5 ? "#496b52" : "#5d7752";
  context.lineWidth = 4;
  for (let index = 0; index < 9; index += 1) {
    const dx = -30 + index * 8;
    const height = 25 + hash(seed * 31 + index) * 32;
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(dx * 0.5, -height * 0.55, dx, -height);
    context.stroke();
  }
  context.fillStyle = seed > 0.55 ? "#d39aaa" : "#d4c37c";
  context.beginPath();
  context.arc(-18, -42, 6, 0, TAU);
  context.fill();
  context.restore();
}

function drawCoastalGrass(context, x, groundY, scale, seed) {
  drawScrub(context, x, groundY, scale, seed > 0.5 ? "#67814e" : "#7b8c56", seed);
}

function drawSandstone(context, x, groundY, scale, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.fillStyle = seed > 0.5 ? "#a85f42" : "#c27850";
  context.beginPath();
  context.moveTo(-48, 0);
  context.lineTo(-38, -31);
  context.lineTo(-14, -42 - seed * 22);
  context.lineTo(14, -38);
  context.lineTo(38, -60 - seed * 12);
  context.lineTo(52, 0);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(92,54,42,.35)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-31, -20);
  context.lineTo(35, -28);
  context.stroke();
  context.restore();
}

function drawVineRow(context, x, groundY, scale, seed) {
  context.save();
  context.translate(x, groundY);
  context.scale(scale, scale);
  context.strokeStyle = "#66513a";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-38, 0);
  context.lineTo(-34, -50);
  context.moveTo(38, 0);
  context.lineTo(34, -50);
  context.moveTo(-42, -38);
  context.lineTo(42, -38);
  context.stroke();
  context.fillStyle = seed > 0.5 ? "#4f7b3f" : "#628846";
  for (let index = -3; index <= 3; index += 1) {
    context.beginPath();
    context.ellipse(index * 12, -42 + (index % 2) * 4, 14, 8, index * 0.12, 0, TAU);
    context.fill();
  }
  context.restore();
}

function drawCapeTownLayer(context, distance, width, groundY, quality) {
  drawFence(context, distance, width, groundY - 4, "#4b4937", 0.30);
  const count = quality === "mobile" ? 9 : 16;
  for (let index = -2; index < count; index += 1) {
    const x = movingX(index, 145, distance, 0.43, width, 141);
    const seed = hash(index + 141);
    drawFynbos(context, x, groundY - 5, 0.58 + seed * 0.34, seed);
  }
}

function drawDurbanLayer(context, distance, width, groundY, quality) {
  const palms = quality === "mobile" ? 3 : 5;
  for (let index = -1; index < palms; index += 1) {
    const x = movingX(index, 520, distance, 0.24, width, 173);
    const seed = hash(index + 173);
    drawPalm(context, x, groundY - 8, 0.55 + seed * 0.14, seed);
  }
  const grass = quality === "mobile" ? 8 : 14;
  for (let index = -2; index < grass; index += 1) {
    const x = movingX(index, 135, distance, 0.48, width, 181);
    const seed = hash(index + 181);
    drawCoastalGrass(context, x, groundY - 4, 0.45 + seed * 0.32, seed);
  }
}

function drawGqeberhaLayer(context, distance, width, groundY, quality) {
  drawFence(context, distance, width, groundY - 4, "#505646", 0.38);
  const count = quality === "mobile" ? 8 : 14;
  for (let index = -2; index < count; index += 1) {
    const x = movingX(index, 138, distance, 0.49, width, 203);
    const seed = hash(index + 203);
    drawCoastalGrass(context, x, groundY - 4, 0.48 + seed * 0.35, seed);
  }
  // Wind streaks make the coast feel visibly different without adding collision noise.
  context.save();
  context.globalAlpha = 0.13;
  context.strokeStyle = "#f3fbff";
  context.lineWidth = 3;
  for (let index = 0; index < (quality === "mobile" ? 3 : 5); index += 1) {
    const y = groundY - 170 + index * 34;
    const shift = (performance.now() * 0.08 + index * 160) % (width + 260) - 130;
    context.beginPath();
    context.moveTo(shift, y);
    context.quadraticCurveTo(shift + 90, y - 12, shift + 190, y + 2);
    context.stroke();
  }
  context.restore();
}

function drawClarensLayer(context, distance, width, groundY, quality) {
  const rocks = quality === "mobile" ? 5 : 8;
  for (let index = -1; index < rocks; index += 1) {
    const x = movingX(index, 300, distance, 0.34, width, 229);
    const seed = hash(index + 229);
    drawSandstone(context, x, groundY - 6, 0.52 + seed * 0.28, seed);
  }
  const scrub = quality === "mobile" ? 8 : 13;
  for (let index = -2; index < scrub; index += 1) {
    const x = movingX(index, 148, distance, 0.48, width, 241);
    const seed = hash(index + 241);
    drawScrub(context, x, groundY - 4, 0.45 + seed * 0.34, seed > 0.5 ? "#657143" : "#78804b", seed);
  }
}

function drawUpingtonLayer(context, distance, width, groundY, quality) {
  drawFence(context, distance, width, groundY - 4, "#5a4931", 0.46);
  const vines = quality === "mobile" ? 5 : 8;
  for (let index = -1; index < vines; index += 1) {
    const x = movingX(index, 285, distance, 0.37, width, 263);
    const seed = hash(index + 263);
    drawVineRow(context, x, groundY - 5, 0.72 + seed * 0.18, seed);
  }
  const scrub = quality === "mobile" ? 7 : 11;
  for (let index = -2; index < scrub; index += 1) {
    const x = movingX(index, 165, distance, 0.5, width, 277);
    const seed = hash(index + 277);
    drawScrub(context, x, groundY - 4, 0.42 + seed * 0.28, seed > 0.5 ? "#77713f" : "#8a7741", seed);
  }
}

const REGION_LAYER_DRAWERS = Object.freeze({
  pretoria: drawPretoriaLayer,
  bloemfontein: drawBloemLayer,
  "graaff-reinet": drawGraaffReinetLayer,
  mbombela: drawMbombelaLayer,
  "cape-town": drawCapeTownLayer,
  durban: drawDurbanLayer,
  gqeberha: drawGqeberhaLayer,
  clarens: drawClarensLayer,
  upington: drawUpingtonLayer
});

function drawLayerForRegion(context, region, distance, width, groundY, quality) {
  (REGION_LAYER_DRAWERS[region.id] ?? drawMbombelaLayer)(context, distance, width, groundY, quality);
}

export function drawRegionalParallax(context, regionState, distance, width, groundY, quality = "desktop") {
  context.save();
  drawLayerForRegion(context, regionState.current, distance, width, groundY, quality);
  if (regionState.transition > 0.001) {
    context.globalAlpha = regionState.transition;
    drawLayerForRegion(context, regionState.next, distance, width, groundY, quality);
  }
  context.restore();
}

export function drawDirtRoad(context, regionState, distance, width, height, groundY, quality = "desktop") {
  const t = regionState.transition;
  const topColor = mixColor(regionState.current.roadTop, regionState.next.roadTop, t);
  const bottomColor = mixColor(regionState.current.roadBottom, regionState.next.roadBottom, t);
  const dustColor = mixColor(regionState.current.roadDust, regionState.next.roadDust, t);
  const vergeColor = mixColor(regionState.current.verge, regionState.next.verge, t);
  const roadY = groundY - 7;

  // A clean verge guarantees the player is always visibly on a dirt road.
  context.fillStyle = vergeColor;
  context.fillRect(0, roadY - 13, width, 17);
  const roadGradient = context.createLinearGradient(0, roadY, 0, height);
  roadGradient.addColorStop(0, topColor);
  roadGradient.addColorStop(0.55, mixColor(regionState.current.roadTop, regionState.current.roadBottom, 0.43));
  roadGradient.addColorStop(1, bottomColor);
  context.fillStyle = roadGradient;
  context.fillRect(0, roadY, width, height - roadY);

  // Fast-moving ruts create speed without distracting from obstacle silhouettes.
  const rutOffset = (distance * 1.06) % 170;
  context.save();
  context.strokeStyle = "rgba(68,38,25,.23)";
  context.lineWidth = 5;
  for (let x = -210 - rutOffset; x < width + 210; x += 170) {
    context.beginPath();
    context.moveTo(x, roadY + 48);
    context.bezierCurveTo(x + 42, roadY + 38, x + 92, roadY + 58, x + 142, roadY + 45);
    context.stroke();
    context.beginPath();
    context.moveTo(x + 25, roadY + 91);
    context.bezierCurveTo(x + 62, roadY + 82, x + 105, roadY + 99, x + 155, roadY + 87);
    context.stroke();
  }
  context.restore();

  // Deterministic stones and compacted patches slide at full ground speed.
  const patchCount = quality === "mobile" ? 18 : 30;
  const cycle = 1500;
  const offset = (distance * 1.02) % cycle;
  context.save();
  for (let index = 0; index < patchCount; index += 1) {
    const seed = hash(index + 501);
    let x = seed * cycle - offset;
    while (x < -40) x += cycle;
    const y = roadY + 18 + hash(index + 771) * (height - roadY - 25);
    const radius = 2 + hash(index + 901) * 5;
    context.globalAlpha = 0.20 + seed * 0.22;
    context.fillStyle = index % 3 === 0 ? "#5f3e2c" : dustColor;
    context.beginPath();
    context.ellipse(x, y, radius * 1.6, radius, seed * 0.8, 0, TAU);
    context.fill();
  }
  context.restore();

  // Crisp contact line at the gameplay ground plane.
  context.fillStyle = "rgba(77,45,28,.32)";
  context.fillRect(0, groundY - 2, width, 3);
}

export function drawRoadsideForeground(context, regionState, distance, width, height, groundY, quality = "desktop") {
  const count = quality === "mobile" ? 8 : 14;
  context.save();
  context.globalAlpha = 0.35;
  for (let index = -2; index < count; index += 1) {
    const x = movingX(index, 120, distance, 0.76, width, 160 + regionState.currentIndex * 13);
    const seed = hash(index + 160 + regionState.currentIndex * 13);
    const y = groundY + 94 + seed * Math.max(10, height - groundY - 105);
    context.strokeStyle = ["graaff-reinet", "clarens", "upington"].includes(regionState.display.id) ? "#5f5d37" : "#405f36";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(x, y + 16);
    context.lineTo(x - 9, y - 7);
    context.moveTo(x, y + 16);
    context.lineTo(x + 8, y - 12);
    context.moveTo(x, y + 16);
    context.lineTo(x + 20, y - 3);
    context.stroke();
  }
  context.restore();
}

