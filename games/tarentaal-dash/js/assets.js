export const IMAGE_ASSETS = Object.freeze({
  run1: "./assets/player/run1.png",
  run2: "./assets/player/run2.png",
  run3: "./assets/player/run3.png",
  run4: "./assets/player/run4.png",
  run5: "./assets/player/run5.png",
  jump: "./assets/player/jump.png",
  duck1: "./assets/player/duck1.png",
  duck2: "./assets/player/duck2.png",
  crash: "./assets/player/crash.png",
  corn: "./assets/collectibles/corn.png",
  potato: "./assets/collectibles/potato.svg",
  feather: "./assets/collectibles/feather.svg",
  pothole1: "./assets/obstacles/pothole1.png",
  pothole2: "./assets/obstacles/pothole2.png",
  pothole3: "./assets/obstacles/pothole3.png",
  rock1: "./assets/obstacles/rock1.png",
  rock2: "./assets/obstacles/rock2.png",
  woodGate: "./assets/obstacles/wood_gate.png",
  metalGate: "./assets/obstacles/metal_gate.png",
  hayBale: "./assets/obstacles/hay_bale.svg",
  fallenLog: "./assets/obstacles/fallen_log.svg",
  crateStack: "./assets/obstacles/crate_stack.svg",
  smallFence: "./assets/obstacles/small_fence.svg",
  mudPuddle: "./assets/obstacles/mud_puddle.svg",
  wheelbarrow: "./assets/obstacles/wheelbarrow.svg",
  mielieSacks: "./assets/obstacles/mielie_sacks.svg",
  lowHadeda: "./assets/obstacles/low_hadeda.png",
  washingLine: "./assets/obstacles/barn_awning.svg",
  lowBranch: "./assets/obstacles/low_branch.svg",
  suspendedSign: "./assets/obstacles/suspended_sign.svg",
  irrigationPipe: "./assets/obstacles/irrigation_pipe.svg",
  regionPretoria: "./assets/scenery/regions/pretoria.webp",
  regionBloemfontein: "./assets/scenery/regions/bloemfontein.webp",
  regionKaroo: "./assets/scenery/regions/karoo.webp",
  regionLowveld: "./assets/scenery/regions/lowveld.webp"
});

export class AssetLoader {
  constructor(assetMap = IMAGE_ASSETS) {
    this.assetMap = assetMap;
    this.images = {};
  }

  async load(onProgress = () => {}) {
    const entries = Object.entries(this.assetMap);
    let completed = 0;

    await Promise.all(entries.map(([key, src]) => new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        this.images[key] = image;
        completed += 1;
        onProgress(completed / entries.length, key);
        resolve();
      };
      image.onerror = () => reject(new Error(`Kon nie bate laai nie: ${src}`));
      image.src = src;
    })));

    return this.images;
  }
}
