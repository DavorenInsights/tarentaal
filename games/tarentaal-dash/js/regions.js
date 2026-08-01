const clamp01 = value => Math.max(0, Math.min(1, value));

export const ROUTE_DISTANCE = 18000;
export const ROUTE_TRANSITION_DISTANCE = 2400;

export const REGIONS = Object.freeze([
  Object.freeze({
    id: "pretoria",
    name: "Pretoria",
    short: "Pretoria",
    subtitle: "Jakarandas & koppies",
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
    accent: "#efaa61",
    imageKey: "regionBloemfontein",
    roadTop: "#c57a3f",
    roadBottom: "#784025",
    roadDust: "#e3aa67",
    verge: "#b89443"
  }),
  Object.freeze({
    id: "karoo",
    name: "Die Karoo",
    short: "Karoo",
    subtitle: "Koppies & windpompe",
    accent: "#df7f4d",
    imageKey: "regionKaroo",
    roadTop: "#bb693a",
    roadBottom: "#6f3825",
    roadDust: "#d68c54",
    verge: "#8f8244"
  }),
  Object.freeze({
    id: "lowveld",
    name: "Laeveld",
    short: "Laeveld",
    subtitle: "Aloë, berge & bosveld",
    accent: "#68b873",
    imageKey: "regionLowveld",
    roadTop: "#b66e3c",
    roadBottom: "#693923",
    roadDust: "#d18d55",
    verge: "#678f45"
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

  // Slight overscan creates room for a gentle cinematic pan without showing edges.
  const overscan = 1.08;
  const scale = Math.max(width / iw, height / ih) * overscan;
  const drawW = iw * scale;
  const drawH = ih * scale;
  const spareX = Math.max(0, drawW - width);
  const spareY = Math.max(0, drawH - height);
  const panX = Math.sin(distance * 0.00042 + phaseOffset) * spareX * 0.42;
  const panY = Math.sin(distance * 0.00019 + phaseOffset * 1.7) * spareY * 0.20;
  const x = (width - drawW) / 2 + panX;
  const y = (height - drawH) / 2 + panY;

  context.save();
  context.globalAlpha = alpha;
  context.drawImage(image, x, y, drawW, drawH);
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
