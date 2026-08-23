"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  dispatchIntroProgress,
  dispatchIntroReveal,
  INTRO_HOLD_MS,
  INTRO_RESET_MS,
  INTRO_REVEAL_MS,
} from "./intro-events";
import styles from "./SplashGate.module.css";

type SplashGateProps = {
  active: boolean;
  onComplete: (restoreFocus: boolean) => void;
};

type Phase = "idle" | "charging" | "ready" | "revealing";

export function SplashGate({ active, onComplete }: SplashGateProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef(0);
  const startRef = useRef(0);
  const progressRef = useRef(0);
  const chargedRef = useRef(false);
  const keyboardRef = useRef(false);
  const revealingRef = useRef(false);
  const phaseRef = useRef<Phase>("idle");
  const resetTweenRef = useRef<gsap.core.Tween | null>(null);
  const revealTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reduced, setReduced] = useState(false);

  const writeProgress = useCallback((progress: number) => {
    progressRef.current = progress;
    scopeRef.current?.style.setProperty("--intro-progress", `${progress}`);
    dispatchIntroProgress(progress);
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    chargedRef.current = false;
    phaseRef.current = "idle";
    setPhase("idle");
    const state = { value: progressRef.current };
    resetTweenRef.current?.kill();
    resetTweenRef.current = gsap.to(state, {
      value: 0,
      duration: INTRO_RESET_MS / 1000,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => writeProgress(state.value),
    });
  }, [writeProgress]);

  const reveal = useCallback(
    (skipped: boolean, restoreFocus: boolean) => {
      if (revealingRef.current) return;
      revealingRef.current = true;
      phaseRef.current = "revealing";
      cancelAnimationFrame(frameRef.current);
      resetTweenRef.current?.kill();
      setPhase("revealing");

      const duration = reduced || skipped ? 0.34 : INTRO_REVEAL_MS / 1000;
      dispatchIntroReveal({
        duration,
        reduced,
        skipped,
      });

      const root = scopeRef.current;
      const backdrop = document.querySelector<HTMLElement>(
        "[data-intro-backdrop]",
      );
      const timeline = gsap.timeline({
        onComplete: () => onComplete(restoreFocus),
      });
      revealTimelineRef.current = timeline;

      if (reduced || skipped) {
        timeline.to([root, backdrop], {
          autoAlpha: 0,
          duration,
          ease: "power2.out",
        });
        return;
      }

      timeline
        .to(
          "[data-intro-meta]",
          { opacity: 0, y: -18, duration: 0.38, ease: "power2.in" },
          0,
        )
        .to(
          "[data-intro-name='marc']",
          { xPercent: -118, rotate: -3, duration: 0.92, ease: "power4.in" },
          0.16,
        )
        .to(
          "[data-intro-name='mathieu']",
          { xPercent: 118, rotate: 3, duration: 0.92, ease: "power4.in" },
          0.16,
        )
        .to(
          "[data-intro-controls]",
          { opacity: 0, scale: 0.92, duration: 0.46, ease: "power2.in" },
          0.2,
        )
        .to(
          backdrop,
          {
            clipPath: "circle(0% at 50% 50%)",
            duration: 0.72,
            ease: "power4.inOut",
          },
          0.86,
        )
        .to(root, { autoAlpha: 0, duration: 0.18 }, 1.4);
    },
    [onComplete, reduced],
  );

  const charge = useCallback(() => {
    if (!active || reduced || phaseRef.current === "revealing") return;
    cancelAnimationFrame(frameRef.current);
    resetTweenRef.current?.kill();
    startRef.current = performance.now() - progressRef.current * INTRO_HOLD_MS;
    chargedRef.current = false;
    phaseRef.current = "charging";
    setPhase("charging");

    const tick = (now: number) => {
      const progress = Math.min((now - startRef.current) / INTRO_HOLD_MS, 1);
      writeProgress(progress);
      if (progress >= 1) {
        chargedRef.current = true;
        phaseRef.current = "ready";
        setPhase("ready");
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [active, reduced, writeProgress]);

  const release = useCallback(
    (restoreFocus: boolean) => {
      if (phaseRef.current !== "charging" && phaseRef.current !== "ready")
        return;
      if (chargedRef.current) reveal(false, restoreFocus);
      else reset();
    },
    [reset, reveal],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!active) return;
    buttonRef.current?.focus({ preventScroll: true });

    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        reveal(true, true);
        return;
      }
      if (reduced || (event.key !== " " && event.key !== "Enter")) return;
      event.preventDefault();
      if (!event.repeat) {
        keyboardRef.current = true;
        charge();
      }
    };
    const keyUp = (event: KeyboardEvent) => {
      if (reduced || (event.key !== " " && event.key !== "Enter")) return;
      event.preventDefault();
      keyboardRef.current = false;
      release(true);
    };
    const blur = () => {
      if (keyboardRef.current) reset();
      keyboardRef.current = false;
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
    };
  }, [active, charge, reduced, release, reset, reveal]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
      resetTweenRef.current?.kill();
      revealTimelineRef.current?.kill();
    },
    [],
  );

  const label =
    phase === "ready"
      ? "Release to enter"
      : phase === "charging"
        ? "Keep holding"
        : "Hold to enter";

  return (
    <div
      className={styles.splash}
      data-intro-splash
      data-phase={phase}
      ref={scopeRef}
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio introduction"
    >
      <div className={styles.meta} data-intro-meta>
        <span>Portfolio / 2026</span>
        <span>Senior frontend engineer</span>
      </div>

      <h1 className={styles.name} aria-label="Marc Mathieu">
        <span data-intro-name="marc">Marc</span>
        <span data-intro-name="mathieu">Mathieu</span>
      </h1>

      <div className={styles.controls} data-intro-controls>
        <button
          className={styles.enter}
          type="button"
          ref={buttonRef}
          onClick={() => reduced && reveal(false, true)}
          onPointerDown={(event) => {
            if (reduced || event.button !== 0) return;
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // Synthetic and assistive pointer events may not own capture.
            }
            charge();
          }}
          onPointerUp={() => release(false)}
          onPointerCancel={() => reset()}
          aria-describedby="intro-progress-label"
        >
          <span className={styles.progress} aria-hidden="true">
            <i />
          </span>
          <span id="intro-progress-label">
            {reduced ? "Enter portfolio" : label}
          </span>
        </button>
        <span className={styles.counter} aria-live="polite">
          {phase === "ready" ? "Ready" : "Hold for 0.9 seconds"}
        </span>
        <button
          className={styles.skip}
          type="button"
          onClick={() => reveal(true, true)}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
