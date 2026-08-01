export class InputController {
  constructor({ canvas, jumpButton, duckButton, pauseButton, onJump, onDuck, onPause }) {
    this.canvas = canvas;
    this.jumpButton = jumpButton;
    this.duckButton = duckButton;
    this.pauseButton = pauseButton;
    this.onJump = onJump;
    this.onDuck = onDuck;
    this.onPause = onPause;
    this.duckPointers = new Set();
    this.boundVisibility = () => {
      if (document.hidden) this.onPause(true);
    };
    this.bind();
  }

  bind() {
    window.addEventListener("keydown", event => {
      if (["Space", "ArrowUp", "ArrowDown"].includes(event.code)) event.preventDefault();
      if (["Space", "ArrowUp", "KeyW"].includes(event.code) && !event.repeat) this.onJump();
      if (["ArrowDown", "KeyD"].includes(event.code)) this.onDuck(true);
      if (["KeyP", "Escape"].includes(event.code) && !event.repeat) this.onPause(false);
    }, { passive: false });

    window.addEventListener("keyup", event => {
      if (["ArrowDown", "KeyD"].includes(event.code)) this.onDuck(false);
    });

    this.canvas.addEventListener("pointerdown", event => {
      if (event.pointerType !== "mouse" || event.button === 0) this.onJump();
    });

    this.jumpButton.addEventListener("pointerdown", event => {
      event.preventDefault();
      this.jumpButton.setPointerCapture?.(event.pointerId);
      this.onJump();
    });

    this.duckButton.addEventListener("pointerdown", event => {
      event.preventDefault();
      this.duckPointers.add(event.pointerId);
      this.duckButton.setPointerCapture?.(event.pointerId);
      this.duckButton.classList.add("is-held");
      this.onDuck(true);
    });

    const releaseDuck = event => {
      this.duckPointers.delete(event.pointerId);
      if (this.duckPointers.size === 0) {
        this.duckButton.classList.remove("is-held");
        this.onDuck(false);
      }
    };

    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
      this.duckButton.addEventListener(name, releaseDuck);
    }

    this.pauseButton.addEventListener("click", () => this.onPause(false));
    document.addEventListener("visibilitychange", this.boundVisibility);
    window.addEventListener("blur", () => this.onPause(true));
  }
}
