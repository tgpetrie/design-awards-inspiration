(function attachPointerCarouselLab(global) {
  "use strict";

  const DEFAULT_OPTIONS = {
    damping: 0.1,
    stageTiltX: 4.4,
    stageTiltY: 7.4,
    cardTiltX: 5.1,
    cardTiltY: 8.6,
    cardLift: 10,
    cardShiftX: 14,
    inactiveScale: 0.93,
    wheelStepCooldownMs: 260,
    autoSpeedPxPerSec: 118,
    autoHoverSlowFactor: 0.09,
    autoVelocityDamping: 0.08,
    minDesktopWidth: 920,
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(from, to, amount) {
    return from + (to - from) * amount;
  }

  function bindMediaQueryListener(query, handler) {
    if (!query) return;
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handler);
      return;
    }
    if (typeof query.addListener === "function") query.addListener(handler);
  }

  function unbindMediaQueryListener(query, handler) {
    if (!query) return;
    if (typeof query.removeEventListener === "function") {
      query.removeEventListener("change", handler);
      return;
    }
    if (typeof query.removeListener === "function") query.removeListener(handler);
  }

  class PointerCarouselLab {
    constructor({ stage, scroller, cards, onActiveChange, options = {} } = {}) {
      this.stage = stage;
      this.scroller = scroller;
      this.track = scroller ? scroller.querySelector(".motion-lab-track") : null;
      this.cards = Array.from(cards || []);
      this.onActiveChange = typeof onActiveChange === "function" ? onActiveChange : null;
      this.options = Object.assign({}, DEFAULT_OPTIONS, options);

      this.pointerTarget = { x: 0, y: 0 };
      this.pointerCurrent = { x: 0, y: 0 };
      this.cardMetrics = [];
      this.activeIndex = 0;
      this.running = false;
      this.staticMode = false;
      this.rafId = 0;
      this.lastTickMs = 0;
      this.wheelLockTimer = 0;
      this.wheelLocked = false;
      this.autoDirection = 1;
      this.autoVelocity = 0;
      this.autoScrollLeft = 0;
      this.pointerInside = false;

      this.reduceMotionQuery = typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
      this.coarsePointerQuery = typeof window !== "undefined"
        ? window.matchMedia("(pointer: coarse)")
        : null;

      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.onWheel = this.onWheel.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
      this.onAccessibilityChange = this.onAccessibilityChange.bind(this);
      this.tick = this.tick.bind(this);

      this.init();
    }

    init() {
      if (!this.stage || !this.scroller || !this.track || !this.cards.length) return;

      this.stage.addEventListener("pointermove", this.onPointerMove, { passive: true });
      this.stage.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
      this.stage.addEventListener("wheel", this.onWheel, { passive: false });
      this.stage.addEventListener("keydown", this.onKeydown);
      this.scroller.addEventListener("scroll", this.onScroll, { passive: true });
      window.addEventListener("resize", this.onResize, { passive: true });

      bindMediaQueryListener(this.reduceMotionQuery, this.onAccessibilityChange);
      bindMediaQueryListener(this.coarsePointerQuery, this.onAccessibilityChange);

      this.layout();
      this.autoScrollLeft = this.scroller.scrollLeft;
      this.syncMode();
      this.updateActive(true);
    }

    shouldUseStaticMode() {
      if (this.reduceMotionQuery && this.reduceMotionQuery.matches) return true;
      if (this.coarsePointerQuery && this.coarsePointerQuery.matches) return true;
      if (window.innerWidth < this.options.minDesktopWidth) return true;
      return false;
    }

    syncMode() {
      const nextStatic = this.shouldUseStaticMode();
      if (nextStatic === this.staticMode && this.running) return;

      this.staticMode = nextStatic;
      if (this.staticMode) {
        this.stop();
        this.stage.classList.add("is-static");
        this.track.style.transform = "";
        this.cards.forEach((card) => {
          card.style.transform = "";
          card.style.opacity = "";
          card.style.zIndex = "";
        });
        this.updateActive(true);
        return;
      }

      this.stage.classList.remove("is-static");
      this.layout();
      this.start();
    }

    onAccessibilityChange() {
      this.syncMode();
    }

    layout() {
      if (!this.cards.length) return;
      this.cardMetrics = this.cards.map((card) => {
        const width = Math.max(card.offsetWidth || 0, 1);
        const center = card.offsetLeft + width / 2;
        return { width, center };
      });
      this.autoScrollLeft = this.scroller.scrollLeft;
      this.updateActive(true);
    }

    getViewportCenter() {
      return this.scroller.scrollLeft + this.scroller.clientWidth / 2;
    }

    updateActive(force = false) {
      if (!this.cardMetrics.length) return;
      const center = this.getViewportCenter();
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      this.cardMetrics.forEach((metric, index) => {
        const distance = Math.abs(metric.center - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      if (force || nearestIndex !== this.activeIndex) {
        this.activeIndex = nearestIndex;
        this.cards.forEach((card, index) => {
          if (index === nearestIndex) card.classList.add("is-active");
          else card.classList.remove("is-active");
        });
        if (this.onActiveChange) this.onActiveChange(this.activeIndex, this.cards.length);
      }
    }

    scrollToIndex(index) {
      if (!this.cardMetrics.length) this.layout();
      const target = clamp(index, 0, this.cards.length - 1);
      const metric = this.cardMetrics[target];
      if (!metric) return;
      const left = metric.center - this.scroller.clientWidth / 2;
      this.scroller.scrollTo({ left, behavior: "smooth" });
      this.activeIndex = target;
      if (this.onActiveChange) this.onActiveChange(this.activeIndex, this.cards.length);
    }

    scrollByStep(step) {
      if (!this.cards.length) return;
      this.scrollToIndex(this.activeIndex + step);
    }

    onResize() {
      this.layout();
    }

    onScroll() {
      this.autoScrollLeft = this.scroller.scrollLeft;
      this.updateActive(false);
    }

    onWheel(event) {
      if (this.staticMode) return;
      const verticalDominant = Math.abs(event.deltaY) > Math.abs(event.deltaX);
      if (!verticalDominant) return;
      event.preventDefault();
      if (this.wheelLocked) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      this.scrollByStep(direction);
      this.wheelLocked = true;
      window.clearTimeout(this.wheelLockTimer);
      this.wheelLockTimer = window.setTimeout(() => {
        this.wheelLocked = false;
      }, this.options.wheelStepCooldownMs);
    }

    onKeydown(event) {
      if (!this.cards.length) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.scrollByStep(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.scrollByStep(-1);
      } else if (event.key === "Home") {
        event.preventDefault();
        this.scrollToIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        this.scrollToIndex(this.cards.length - 1);
      }
    }

    onPointerMove(event) {
      if (this.staticMode) return;
      this.pointerInside = true;
      const rect = this.stage.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const ny = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
      this.pointerTarget.x = clamp(nx, -1, 1);
      this.pointerTarget.y = clamp(ny, -1, 1);
    }

    onPointerLeave() {
      this.pointerInside = false;
      this.pointerTarget.x = 0;
      this.pointerTarget.y = 0;
    }

    start() {
      if (this.running || this.staticMode) return;
      this.running = true;
      this.lastTickMs = 0;
      this.rafId = window.requestAnimationFrame(this.tick);
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        window.cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
      this.lastTickMs = 0;
    }

    tick(nowMs) {
      if (!this.running) return;

      const dt = this.lastTickMs ? Math.min(nowMs - this.lastTickMs, 64) / 1000 : 0;
      this.lastTickMs = nowMs;

      this.pointerCurrent.x = lerp(this.pointerCurrent.x, this.pointerTarget.x, this.options.damping);
      this.pointerCurrent.y = lerp(this.pointerCurrent.y, this.pointerTarget.y, this.options.damping);

      const mx = this.pointerCurrent.x;
      const my = this.pointerCurrent.y;

      if (!this.staticMode && this.cards.length > 1 && dt > 0) {
        const maxLeft = Math.max(this.scroller.scrollWidth - this.scroller.clientWidth, 0);
        if (maxLeft > 0) {
          let targetVelocity = this.options.autoSpeedPxPerSec * this.autoDirection;
          if (this.pointerInside) {
            targetVelocity *= this.options.autoHoverSlowFactor;
          }

          this.autoVelocity = lerp(this.autoVelocity, targetVelocity, this.options.autoVelocityDamping);
          let nextLeft = this.autoScrollLeft + this.autoVelocity * dt;

          if (nextLeft >= maxLeft) {
            nextLeft = maxLeft;
            this.autoDirection = -1;
            this.autoVelocity = 0;
          } else if (nextLeft <= 0) {
            nextLeft = 0;
            this.autoDirection = 1;
            this.autoVelocity = 0;
          }

          this.autoScrollLeft = nextLeft;
          this.scroller.scrollLeft = nextLeft;
        }
      }

      const center = this.getViewportCenter();

      const stageRotateX = -my * this.options.stageTiltX;
      const stageRotateY = mx * this.options.stageTiltY;
      this.track.style.transform = `translateZ(0px) rotateX(${stageRotateX.toFixed(3)}deg) rotateY(${stageRotateY.toFixed(3)}deg)`;

      this.cards.forEach((card, index) => {
        const metric = this.cardMetrics[index];
        if (!metric) return;

        const distanceNorm = (metric.center - center) / Math.max(metric.width, 1);
        const clampedDistance = clamp(distanceNorm, -2.2, 2.2);
        const focus = 1 - Math.min(Math.abs(clampedDistance), 1);

        const hoverFactor = this.pointerInside ? 1 : 0.6;
        const tx = -clampedDistance * 10 + mx * this.options.cardShiftX * hoverFactor * (0.2 + focus * 0.5);
        const ty = Math.abs(clampedDistance) * 9 - focus * this.options.cardLift - my * 6 * hoverFactor * (0.2 + focus * 0.6);
        const rx = -my * this.options.cardTiltX * (0.4 + focus * 0.8);
        const ry = mx * this.options.cardTiltY * (0.4 + focus * 0.9) + clampedDistance * -9;
        const focusBoost = this.pointerInside ? 1.18 : 1;
        const scale = this.options.inactiveScale + focus * (1 - this.options.inactiveScale) * focusBoost - Math.abs(my) * 0.004;
        const opacity = 0.72 + focus * 0.28;

        card.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
        card.style.opacity = String(opacity.toFixed(4));
        card.style.zIndex = String(100 + Math.round(focus * 200) - Math.round(Math.abs(clampedDistance) * 10));
      });

      this.rafId = window.requestAnimationFrame(this.tick);
    }

    destroy() {
      this.stop();
      if (this.wheelLockTimer) {
        window.clearTimeout(this.wheelLockTimer);
        this.wheelLockTimer = 0;
      }
      if (!this.stage || !this.scroller) return;

      this.stage.removeEventListener("pointermove", this.onPointerMove);
      this.stage.removeEventListener("pointerleave", this.onPointerLeave);
      this.stage.removeEventListener("wheel", this.onWheel);
      this.stage.removeEventListener("keydown", this.onKeydown);
      this.scroller.removeEventListener("scroll", this.onScroll);
      window.removeEventListener("resize", this.onResize);
      unbindMediaQueryListener(this.reduceMotionQuery, this.onAccessibilityChange);
      unbindMediaQueryListener(this.coarsePointerQuery, this.onAccessibilityChange);

      this.track.style.transform = "";
      this.cards.forEach((card) => {
        card.style.transform = "";
        card.style.opacity = "";
        card.style.zIndex = "";
        card.classList.remove("is-active");
      });
      this.stage.classList.remove("is-static");
    }
  }

  global.PointerCarouselLab = PointerCarouselLab;
})(window);
