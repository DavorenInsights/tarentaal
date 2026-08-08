const clamp01 = value => Math.max(0, Math.min(1, value));

// Game distance is stored at 100 internal units per displayed metre.
export const ROUTE_DISTANCE = 40000; // 400 m per town/region.
export const ROUTE_TRANSITION_DISTANCE = 4500; // Final 45 m cross-fades into the next map.

export const REGIONS = Object.freeze([
  Object.freeze({
    id: "pretoria",
    name: "Pretoria",
    short: "Pretoria",
    subtitle: "Jakarandas & koppies",
    reaction: "Jakaranda-pad!",
    accent: "#a77ad4",
    imageKey: "regionPretoria",
    roadTop: "#bc7543",
    roadBottom: "#754127",
    roadDust: "#d69a61",
    verge: "#7e9b4d"
  }),
  Object.freeze({
    id: "bloemfontein",
    name: "Bloemfontein",
    short: "Bloem",
    subtitle: "Vrystaat-vlaktes",
    reaction: "Vrystaat, hier kom ons!",
    accent: "#efaa61",
    imageKey: "regionBloemfontein",
    roadTop: "#c57a3f",
    roadBottom: "#784025",
    roadDust: "#e3aa67",
    verge: "#b89443"
  }),
  Object.freeze({
    id: "graaff-reinet",
    name: "Graaff-Reinet",
    short: "Graaff-Reinet",
    subtitle: "Karoo-koppies & windpompe",
    reaction: "Karoo! Krrr-krrr!",
    accent: "#df7f4d",
    imageKey: "regionGraaffReinet",
    roadTop: "#bb693a",
    roadBottom: "#6f3825",
    roadDust: "#d68c54",
    verge: "#8f8244"
  }),
  Object.freeze({
    id: "mbombela",
    name: "Mbombela",
    short: "Mbombela",
    subtitle: "Laeveld, aloë & bosveld",
    reaction: "Bosveld-bene!",
    accent: "#68b873",
    imageKey: "regionMbombela",
    roadTop: "#b66e3c",
    roadBottom: "#693923",
    roadDust: "#d18d55",
    verge: "#678f45"
  }),
  Object.freeze({
    id: "cape-town",
    name: "Kaapstad",
    short: "Kaapstad",
    subtitle: "Tafelberg & fynbos",
    reaction: "Berg in sig!",
    accent: "#5fa8c9",
    imageKey: "regionCapeTown",
    roadTop: "#b7784d",
    roadBottom: "#67412d",
    roadDust: "#d29b6c",
    verge: "#63815d"
  }),
  Object.freeze({
    id: "durban",
    name: "Durban",
    short: "Durban",
    subtitle: "Palms & Indiese Oseaan",
    reaction: "See toe!",
    accent: "#48b9aa",
    imageKey: "regionDurban",
    roadTop: "#c48754",
    roadBottom: "#735039",
    roadDust: "#dda978",
    verge: "#60915a"
  }),
  Object.freeze({
    id: "gqeberha",
    name: "Gqeberha",
    short: "Gqeberha",
    subtitle: "Wind, kus & vuurtorings",
    reaction: "Hou vas — wind!",
    accent: "#6ca7bf",
    imageKey: "regionGqeberha",
    roadTop: "#b97a51",
    roadBottom: "#6b4633",
    roadDust: "#d39e73",
    verge: "#708663"
  }),
  Object.freeze({
    id: "clarens",
    name: "Clarens",
    short: "Clarens",
    subtitle: "Sandsteen & Maluti-berge",
    reaction: "Berge!",
    accent: "#d98b57",
    imageKey: "regionClarens",
    roadTop: "#ad6844",
    roadBottom: "#633d2d",
    roadDust: "#cf8e60",
    verge: "#71814d"
  }),
  Object.freeze({
    id: "upington",
    name: "Upington",
    short: "Upington",
    subtitle: "Oranjerivier & wingerde",
    reaction: "Oranje toe!",
    accent: "#e1a54d",
    imageKey: "regionUpington",
    roadTop: "#c87c42",
    roadBottom: "#704126",
    roadDust: "#e0a15d",
    verge: "#8a8f4d"
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
  const easedTransition = transition * transition * (3 - 2 * transition);
  const displayIndex = easedTransition >= 0.55 ? nextIndex : currentIndex;
  const displaySerial = easedTransition >= 0.55 ? routeIndex + 1 : routeIndex;

  return Object.freeze({
    routeIndex,
    localDistance,
    currentIndex,
    nextIndex,
    current: REGIONS[currentIndex],
    next: REGIONS[nextIndex],
    transition: easedTransition,
    display: REGIONS[displayIndex],
    displaySerial,
    progress: localDistance / ROUTE_DISTANCE
  });
}

function drawCoverImage(context, image, distance, width, height, alpha = 1, phaseOffset = 0) {
  if (!image) return false;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (!iw || !ih) return false;

  const overscan = 1.08;
  const scale = Math.max(width / iw, height / ih) * overscan;
  const drawW = iw * scale;
  const drawH = ih * scale;
  const spareX = Math.max(0, drawW - width);
  const spareY = Math.max(0, drawH - height);
  const panX = Math.sin(distance * 0.00042 + phaseOffset) * spareX * 0.42;
  const panY = Math.sin(distance * 0.00019 + phaseOffset * 1.7) * spareY * 0.20;

  context.save();
  context.globalAlpha = alpha;
  context.drawImage(image, (width - drawW) / 2 + panX, (height - drawH) / 2 + panY, drawW, drawH);
  context.restore();
  return true;
}

function drawFallback(context, region, width, height) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#74c7df");
  gradient.addColorStop(0.62, "#ead69a");
  gradient.addColorStop(1, region.verge);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

export function drawRegionalBackground(context, images, distance, width, height) {
  const state = getRegionState(distance);
  const currentImage = images?.[state.current.imageKey];
  const nextImage = images?.[state.next.imageKey];

  if (!drawCoverImage(context, currentImage, distance, width, height, 1, state.currentIndex * 0.9)) {
    drawFallback(context, state.current, width, height);
  }

  if (state.transition > 0.001) {
    if (!drawCoverImage(context, nextImage, distance, width, height, state.transition, state.nextIndex * 0.9)) {
      context.save();
      context.globalAlpha = state.transition;
      drawFallback(context, state.next, width, height);
      context.restore();
    }
  }
  return state;
}
