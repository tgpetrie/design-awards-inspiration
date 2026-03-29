(function attachPointerCarouselLab(global) {
  "use strict";

  const DEFAULT_OPTIONS = {
    damping: 0.1,
    stageTiltX: 6,
    stageTiltY: 9,
    shiftX: 72,
    shiftY: 48,
    rotateX: 6,
    rotateY: 10,
    minDesktopWidth: 900,
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(from, to, amount) {
    return from + (to - from) * amount;
  }

  class PointerCarouselLab {
    constructor(stage, cards, options = {}) {
      this.stage = stage;
      this.cards = Array.from(cards || []);
      this.options = Object.assign({}, DEFAULT_OPTIONS, options);
      this.layer = stage ? (stage.querySelector(".motion-lab-cards") || stage) : null;

      this.pointerTarget = { x: 0, y: 0 };
      this.pointerCurrent = { x: 0, y: 0 };
      this.viewport = { width: 1, height: 1 };
      this.cardSlots = [];

      this.rafId = 0;
      this.running = false;
      this.staticMode = false;

      this.reduceMotionQuery = typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
      this.coarsePointerQuery = typeof window !== "undefined"
        ? window.matchMedia("(pointer: coarse)")
        : { matches: false, addEventListener: () => {}, removeEventListener: () => {} };

      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onAccessibilityChange = this.onAccessibilityChange.bind(this);
      this.tick = this.tick.bind(this);

      this.init();
    }

    init() {
      if (!this.stage || !this.cards.length) return;

      this.stage.addEventListener("pointermove", this.onPointerMove, { passive: true });
      this.stage.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
      window.addEventListener("resize", this.onResize, { passive: true });
      this.reduceMotionQuery.addEventListener("change", this.onAccessibilityChange);
      this.coarsePointerQuery.addEventListener("change", this.onAccessibilityChange);

      this.onResize();
      this.syncMode();
    }

    shouldUseStaticMode() {
      if (this.reduceMotionQuery.matches) return true;
      if (this.coarsePointerQuery.matches) return true;
      if (window.innerWidth < this.options.minDesktopWidth) return true;
      return false;
    }

    syncMode() {
      const shouldBeStatic = this.shouldUseStaticMode();
      if (shouldBeStatic === this.staticMode && this.running) return;

      this.staticMode = shouldBeStatic;
      if (this.staticMode) {
        this.stop();
        this.stage.classList.add("is-static");
        this.layer.style.transform = "";
        this.cards.forEach((card) => {
          card.style.transform = "";
          card.style.zIndex = "";
          card.style.top = "";
          card.style.left = "";
        });
        return;
      }

      this.stage.classList.remove("is-static");
      this.layoutCards();
      this.start();
    }

    onAccessibilityChange() {
      this.syncMode();
    }

    onResize() {
      if (!this.stage) return;
      const rect = this.stage.getBoundingClientRect();
      this.viewport.width = Math.max(rect.width, 1);
      this.viewport.height = Math.max(rect.height, 1);
      if (!this.staticMode) this.layoutCards();
    }

    onPointerMove(event) {
      if (this.staticMode) return;
      const rect = this.stage.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
      this.pointerTarget.x = clamp(nx, -1, 1);
      this.pointerTarget.y = clamp(ny, -1, 1);
    }

    onPointerLeave() {
      this.pointerTarget.x = 0;
      this.pointerTarget.y = 0;
    }

    layoutCards() {
      const slots = [
        [-0.42, -0.16, 0.08, -5],
        [-0.15, -0.2, 0.22, -2],
        [0.14, -0.16, 0.2, 2],
        [0.41, -0.08, 0.08, 5],
        [-0.34, 0.16, 0.14, -4],
        [-0.05, 0.18, 0.27, -1],
        [0.25, 0.18, 0.18, 3],
        [-0.18, 0.4, 0.1, -3],
        [0.16, 0.38, 0.14, 2],
      ];

      const width = this.viewport.width;
      const height = this.viewport.height;
      const xRange = width * 0.43;
      const yRange = height * 0.42;

      this.cardSlots = this.cards.map((_, index) => {
        const slot = slots[index % slots.length];
        const depth = slot[2] + Math.floor(index / slots.length) * 0.05;
        return {
          x: slot[0] * xRange,
          y: slot[1] * yRange,
          z: Math.round(depth * 190),
          rot: slot[3],
          depth,
          order: 20 + Math.round(depth * 100),
        };
      });

      this.cards.forEach((card) => {
        card.style.left = "50%";
        card.style.top = "50%";
      });
    }

    start() {
      if (this.running || this.staticMode) return;
      this.running = true;
      this.rafId = window.requestAnimationFrame(this.tick);
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    }

    tick() {
      if (!this.running) return;

      this.pointerCurrent.x = lerp(this.pointerCurrent.x, this.pointerTarget.x, this.options.damping);
      this.pointerCurrent.y = lerp(this.pointerCurrent.y, this.pointerTarget.y, this.options.damping);

      const mx = this.pointerCurrent.x;
      const my = this.pointerCurrent.y;

      if (this.layer) {
        const tiltX = -my * this.options.stageTiltX;
        const tiltY = mx * this.options.stageTiltY;
        this.layer.style.transform = `translateZ(0px) rotateX(${tiltX.toFixed(3)}deg) rotateY(${tiltY.toFixed(3)}deg)`;
      }

      this.cards.forEach((card, index) => {
        const slot = this.cardSlots[index];
        if (!slot) return;

        const depthFactor = 1 + slot.depth * 1.25;
        const tx = slot.x + mx * this.options.shiftX * depthFactor;
        const ty = slot.y + my * this.options.shiftY * depthFactor;
        const tz = slot.z + (-Math.abs(mx) * 24 * slot.depth);
        const rx = -my * this.options.rotateX * depthFactor;
        const ry = slot.rot + mx * this.options.rotateY * depthFactor;
        const scale = 1 + slot.depth * 0.06 - Math.abs(my) * 0.03;

        card.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, ${tz.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
        card.style.zIndex = String(slot.order + index);
      });

      this.rafId = window.requestAnimationFrame(this.tick);
    }

    destroy() {
      this.stop();
      if (!this.stage) return;
      this.stage.removeEventListener("pointermove", this.onPointerMove);
      this.stage.removeEventListener("pointerleave", this.onPointerLeave);
      window.removeEventListener("resize", this.onResize);
      this.reduceMotionQuery.removeEventListener("change", this.onAccessibilityChange);
      this.coarsePointerQuery.removeEventListener("change", this.onAccessibilityChange);

      if (this.layer) this.layer.style.transform = "";
      this.stage.classList.remove("is-static");
      this.cards.forEach((card) => {
        card.style.transform = "";
        card.style.zIndex = "";
        card.style.top = "";
        card.style.left = "";
      });
    }
  }

  global.PointerCarouselLab = PointerCarouselLab;
})(window);
