const clamp01 = value => Math.max(0, Math.min(1, value));

export const ROUTE_DISTANCE = 18000;
export const ROUTE_TRANSITION_DISTANCE = 2200;

export const REGIONS = Object.freeze([
  Object.freeze({
    id: "pretoria",
    name: "Pretoria",
    short: "Pretoria",
    subtitle: "Jakarandas & koppies",
    accent: "#9d73c8",
    skyTop: "#70cce2",
    skyBottom: "#e9d79a",
    horizon: "#647f6a",
    field: "#9aaf62",
    road: "#b46d3c"
  }),
  Object.freeze({
    id: "bloemfontein",
    name: "Bloemfontein",
    short: "Bloem",
    subtitle: "Vrystaat-vlaktes",
    accent: "#df9d65",
    skyTop: "#77c4df",
    skyBottom: "#f1d49a",
    horizon: "#8f8b61",
    field: "#c3a85a",
    road: "#aa6336"
  }),
  Object.freeze({
    id: "karoo",
    name: "Die Karoo",
    short: "Karoo",
    subtitle: "Koppies & windpompe",
    accent: "#d98154",
    skyTop: "#6eb8d4",
    skyBottom: "#f0bd84",
    horizon: "#8b6550",
    field: "#b68750",
    road: "#99502e"
  }),
  Object.freeze({
    id: "lowveld",
    name: "Laeveld",
    short: "Laeveld",
    subtitle: "Aloë, berge & bosveld",
    accent: "#61a56a",
    skyTop: "#6bc4d1",
    skyBottom: "#dfd98f",
    horizon: "#4f7958",
    field: "#789b52",
    road: "#a65e32"
  })
]);

export function getRegionState(distance = 0) {
  const safeDistance = Math.max(0, Number(distance) || 0);
  const routeIndex = Math.floor(safeDistance / ROUTE_DISTANCE);
  const localDistance = safeDistance - routeIndex * ROUTE_DISTANCE;
  const currentIndex = routeIndex % REGIONS.length;
  const nextIndex = (currentIndex + 1) % REGIONS.length;
  const transitionStart = ROUTE_DISTANCE - ROUTE_TRANSITION_DISTANCE;
  const transition = clamp01((localDistance - transitionStart) / ROUTE_TRANSITION_DISTANCE);
  const displayIndex = transition >= 0.55 ? nextIndex : currentIndex;
  const displaySerial = transition >= 0.55 ? routeIndex + 1 : routeIndex;

  return Object.freeze({
    routeIndex,
    localDistance,
    currentIndex,
    nextIndex,
    current: REGIONS[currentIndex],
    next: REGIONS[nextIndex],
    transition,
    display: REGIONS[displayIndex],
    displaySerial,
    progress: localDistance / ROUTE_DISTANCE
  });
}

function fillGradient(context, region, width, groundY) {
  const gradient = context.createLinearGradient(0, 0, 0, groundY);
  gradient.addColorStop(0, region.skyTop);
  gradient.addColorStop(0.66, region.skyBottom);
  gradient.addColorStop(1, region.field);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, groundY + 2);
}

function polygon(context, points, fillStyle) {
  if (!points.length) return;
  context.fillStyle = fillStyle;
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) context.lineTo(points[index][0], points[index][1]);
  context.closePath();
  context.fill();
}

function repeatOffset(distance, depth, cycle) {
  return -((distance * depth) % cycle);
}

function drawKoppies(context, width, baseline, distance, color, amplitude = 75) {
  const offset = repeatOffset(distance, 0.035, 520);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, baseline + 120);
  for (let x = offset - 520; x <= width + 520; x += 130) {
    const y = baseline - amplitude * (0.35 + 0.65 * Math.abs(Math.sin((x + 170) * 0.009)));
    context.quadraticCurveTo(x + 65, y - 18, x + 130, baseline + 10);
  }
  context.lineTo(width, baseline + 130);
  context.closePath();
  context.fill();
}

function drawPretoria(context, distance, width, height, groundY, region) {
  drawKoppies(context, width, groundY - 215, distance, "#587065", 84);

  const landmarkX = width * 0.64 - (distance * 0.018 % (width + 650));
  context.save();
  context.globalAlpha = 0.46;
  context.fillStyle = "#dfc99b";
  context.fillRect(landmarkX, groundY - 255, 230, 44);
  context.fillRect(landmarkX + 28, groundY - 292, 174, 38);
  context.fillStyle = "#6d6d62";
  context.fillRect(landmarkX + 72, groundY - 336, 86, 45);
  context.beginPath();
  context.arc(landmarkX + 115, groundY - 337, 43, Math.PI, Math.PI * 2);
  context.fill();
  for (let i = 0; i < 8; i += 1) {
    context.fillStyle = i % 2 ? "#8260a4" : "#a278c8";
    context.beginPath();
    context.arc(landmarkX - 25 + i * 48, groundY - 194 - (i % 3) * 8, 30 + (i % 2) * 8, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  context.fillStyle = region.field;
  context.fillRect(0, groundY - 155, width, 157);
  const treeOffset = repeatOffset(distance, 0.17, 380);
  for (let x = treeOffset - 380; x < width + 380; x += 190) {
    context.fillStyle = "#435d43";
    context.fillRect(x + 84, groundY - 160, 11, 74);
    context.fillStyle = (Math.floor(x / 190) % 2 === 0) ? "#8762aa" : "#9f78c3";
    for (const [dx, dy, r] of [[55,-165,30],[90,-184,39],[124,-163,31]]) {
      context.beginPath();
      context.arc(x + dx, groundY + dy, r, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawBloemfontein(context, distance, width, height, groundY, region) {
  context.fillStyle = "#8e8b67";
  context.beginPath();
  context.moveTo(0, groundY - 175);
  context.quadraticCurveTo(width * 0.4, groundY - 245, width * 0.72, groundY - 184);
  context.quadraticCurveTo(width * 0.9, groundY - 145, width, groundY - 178);
  context.lineTo(width, groundY);
  context.lineTo(0, groundY);
  context.fill();

  const skylineX = width * 0.78 - (distance * 0.015 % (width + 520));
  context.save();
  context.globalAlpha = 0.50;
  context.fillStyle = "#ba916b";
  context.fillRect(skylineX, groundY - 238, 185, 76);
  context.fillRect(skylineX + 28, groundY - 300, 34, 64);
  context.fillRect(skylineX + 121, groundY - 286, 31, 51);
  polygon(context, [[skylineX+22,groundY-300],[skylineX+45,groundY-332],[skylineX+68,groundY-300]], "#8d644e");
  polygon(context, [[skylineX+115,groundY-286],[skylineX+136,groundY-316],[skylineX+158,groundY-286]], "#8d644e");
  context.restore();

  context.fillStyle = region.field;
  context.fillRect(0, groundY - 150, width, 152);
  const rows = repeatOffset(distance, 0.22, 230);
  context.strokeStyle = "rgba(255,241,178,.32)";
  context.lineWidth = 5;
  for (let x = rows - 230; x < width + 230; x += 115) {
    context.beginPath();
    context.moveTo(x, groundY - 145);
    context.lineTo(x - 75, groundY);
    context.stroke();
  }

  const windX = width - ((distance * 0.09 + 250) % (width + 420));
  context.strokeStyle = "rgba(64,69,60,.72)";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(windX, groundY - 50);
  context.lineTo(windX + 28, groundY - 165);
  context.lineTo(windX + 55, groundY - 50);
  context.stroke();
  context.beginPath();
  context.arc(windX + 28, groundY - 175, 37, 0, Math.PI * 2);
  context.stroke();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    context.beginPath();
    context.moveTo(windX + 28, groundY - 175);
    context.lineTo(windX + 28 + Math.cos(a) * 37, groundY - 175 + Math.sin(a) * 37);
    context.stroke();
  }
}

function drawKaroo(context, distance, width, height, groundY, region) {
  context.fillStyle = "#86604d";
  const mesaOffset = repeatOffset(distance, 0.025, 760);
  for (let x = mesaOffset - 760; x < width + 760; x += 380) {
    polygon(context, [
      [x, groundY - 150], [x + 55, groundY - 230], [x + 215, groundY - 230],
      [x + 278, groundY - 155], [x + 350, groundY - 135], [x + 380, groundY]
    ], "#805a48");
    polygon(context, [
      [x + 58, groundY - 230], [x + 216, groundY - 230], [x + 235, groundY - 211], [x + 42, groundY - 211]
    ], "#a87959");
  }

  context.fillStyle = region.field;
  context.fillRect(0, groundY - 128, width, 130);
  const scrubOffset = repeatOffset(distance, 0.27, 190);
  for (let x = scrubOffset - 190; x < width + 190; x += 95) {
    context.strokeStyle = "rgba(73,82,48,.75)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(x, groundY - 20);
    context.lineTo(x + 8, groundY - 52);
    context.moveTo(x + 7, groundY - 40);
    context.lineTo(x - 7, groundY - 50);
    context.moveTo(x + 6, groundY - 36);
    context.lineTo(x + 22, groundY - 48);
    context.stroke();
  }

  const pumpX = width - ((distance * 0.12 + 620) % (width + 520));
  context.strokeStyle = "rgba(58,52,46,.78)";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(pumpX, groundY - 28);
  context.lineTo(pumpX + 34, groundY - 177);
  context.lineTo(pumpX + 70, groundY - 28);
  context.stroke();
  context.beginPath();
  context.arc(pumpX + 35, groundY - 192, 41, 0, Math.PI * 2);
  context.stroke();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
    context.beginPath();
    context.moveTo(pumpX + 35, groundY - 192);
    context.lineTo(pumpX + 35 + Math.cos(a) * 41, groundY - 192 + Math.sin(a) * 41);
    context.stroke();
  }
  context.fillStyle = "#4d443c";
  context.fillRect(pumpX + 73, groundY - 210, 34, 12);
}

function drawLowveld(context, distance, width, height, groundY, region) {
  drawKoppies(context, width, groundY - 220, distance, "#3f6852", 110);
  drawKoppies(context, width, groundY - 160, distance * 1.4, "#557a4e", 76);
  context.fillStyle = region.field;
  context.fillRect(0, groundY - 135, width, 137);

  const treeOffset = repeatOffset(distance, 0.18, 440);
  for (let x = treeOffset - 440; x < width + 440; x += 220) {
    context.fillStyle = "#4a3828";
    context.fillRect(x + 99, groundY - 122, 12, 90);
    context.fillStyle = "#42633b";
    context.beginPath();
    context.ellipse(x + 105, groundY - 137, 76, 28, 0, 0, Math.PI * 2);
    context.fill();
  }

  const aloeOffset = repeatOffset(distance, 0.31, 260);
  for (let x = aloeOffset - 260; x < width + 260; x += 130) {
    context.strokeStyle = "rgba(43,83,48,.88)";
    context.lineWidth = 6;
    for (const dx of [-18,-8,8,18]) {
      context.beginPath();
      context.moveTo(x, groundY - 8);
      context.lineTo(x + dx, groundY - 54 - Math.abs(dx));
      context.stroke();
    }
    context.strokeStyle = "#8d4830";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(x, groundY - 44);
    context.lineTo(x, groundY - 86);
    context.stroke();
    context.fillStyle = "#d56f3c";
    context.beginPath();
    context.ellipse(x, groundY - 90, 10, 18, 0, 0, Math.PI * 2);
    context.fill();
  }
}

function drawSingleRegion(context, region, distance, width, height, groundY) {
  fillGradient(context, region, width, groundY);
  if (region.id === "pretoria") drawPretoria(context, distance, width, height, groundY, region);
  else if (region.id === "bloemfontein") drawBloemfontein(context, distance, width, height, groundY, region);
  else if (region.id === "karoo") drawKaroo(context, distance, width, height, groundY, region);
  else drawLowveld(context, distance, width, height, groundY, region);
}

export function drawRegionalBackground(context, distance, width, height, groundY) {
  const state = getRegionState(distance);
  context.save();
  drawSingleRegion(context, state.current, distance, width, height, groundY);
  if (state.transition > 0) {
    context.globalAlpha = state.transition;
    drawSingleRegion(context, state.next, distance, width, height, groundY);
  }
  context.restore();
  return state;
}
