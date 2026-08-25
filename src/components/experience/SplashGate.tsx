"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  dispatchMachineStart,
  dispatchMachineWind,
  introEvents,
  INTRO_HOLD_MS,
  INTRO_RESET_MS,
  MACHINE_WATCHDOG_MS,
} from "./intro-events";
import styles from "./SplashGate.module.css";

type SplashGateProps = {
  active: boolean;
  onComplete: (restoreFocus: boolean, preserveScroll?: boolean) => void;
};

type Phase = "idle" | "winding" | "running";

type SwipeState = {
  startX: number;
  startY: number;
  startScrollY: number;
};

export function SplashGate({ active, onComplete }: SplashGateProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const watchdogRef = useRef(0);
  const completionRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const windRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  const keyboardRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const completedRef = useRef(false);
  const swipeRef = useRef<SwipeState | null>(null);
  const resetTweenRef = useRef<gsap.core.Tween | null>(null);
  const introTweenRef = useRef<gsap.core.Tween | null>(null);
  const revealTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [machineFailed, setMachineFailed] = useState(false);
  const [touchEntry, setTouchEntry] = useState(false);
  const staticMode = reduced || machineFailed;

  const writeWind = useCallback((progress: number) => {
    windRef.current = progress;
    scopeRef.current?.style.setProperty("--machine-wind", `${progress}`);
    progressRef.current?.setAttribute(
      "aria-valuenow",
      `${Math.round(progress * 100)}`,
    );
    dispatchMachineWind(progress);
  }, []);

  const reset = useCallback(() => {
    if (phaseRef.current === "running") return;
    cancelAnimationFrame(frameRef.current);
    phaseRef.current = "idle";
    setPhase("idle");
    const state = { value: windRef.current };
    resetTweenRef.current?.kill();
    resetTweenRef.current = gsap.to(state, {
      value: 0,
      duration: INTRO_RESET_MS / 1000,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => writeWind(state.value),
    });
  }, [writeWind]);

  const reveal = useCallback(
    (skipped: boolean, restoreFocus: boolean, preserveScroll = false) => {
      window.clearTimeout(watchdogRef.current);
      cancelAnimationFrame(frameRef.current);
      resetTweenRef.current?.kill();
      introTweenRef.current?.kill();

      if (phaseRef.current !== "running") {
        phaseRef.current = "running";
        setPhase("running");
        dispatchMachineStart({
          skipped,
          reduced: staticMode,
        });
      }

      const root = scopeRef.current;
      const backdrop = document.querySelector<HTMLElement>(
        "[data-intro-backdrop]",
      );
      const canvas = document.querySelector<HTMLElement>(
        "[data-machine-canvas]",
      );
      const sceneShell =
        document.querySelector<HTMLElement>("[data-scene-shell]");
      const content = document.querySelector<HTMLElement>(
        "[data-experience-content]",
      );
      const handoff = root?.querySelector<HTMLElement>("[data-intro-handoff]");
      const handoffOrb = root?.querySelector<HTMLElement>(
        "[data-intro-handoff-orb]",
      );
      const complete = () => {
        if (completedRef.current) return;
        completedRef.current = true;
        window.clearTimeout(completionRef.current);
        onComplete(restoreFocus, preserveScroll);
      };
      const timeline = gsap.timeline({ onComplete: complete });
      revealTimelineRef.current = timeline;
      completionRef.current = window.setTimeout(
        complete,
        staticMode || skipped ? 500 : 1650,
      );

      if (staticMode || skipped) {
        timeline.to([root, backdrop], {
          autoAlpha: 0,
          duration: 0.34,
          ease: "power2.out",
        });
        return;
      }

      if (!handoff || !handoffOrb || !content) {
        timeline.to([root, backdrop], {
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.out",
        });
        return;
      }

      gsap.set(content, { opacity: 0, y: 18 });
      gsap.set(handoff, { autoAlpha: 1 });
      gsap.set(handoffOrb, {
        opacity: 1,
        scale: 0.002,
        xPercent: -50,
        yPercent: -50,
      });

      timeline
        .to(
          "[data-machine-copy]",
          { opacity: 0, y: -10, duration: 0.22, ease: "power2.in" },
          0,
        )
        .to(
          handoffOrb,
          {
            scale: 1,
            duration: 0.74,
            ease: "power4.inOut",
          },
          0,
        )
        .set([backdrop, canvas], { opacity: 0 }, 0.7)
        .set(sceneShell, { visibility: "hidden" }, 0.7)
        .to(
          handoffOrb,
          { opacity: 0, duration: 0.48, ease: "power2.out" },
          0.72,
        )
        .to(
          content,
          {
            clearProps: "opacity,transform",
            opacity: 1,
            y: 0,
            duration: 0.56,
            ease: "power3.out",
          },
          0.72,
        );
    },
    [onComplete, staticMode],
  );

  const startMachine = useCallback(
    (restoreFocus: boolean) => {
      if (phaseRef.current === "running") return;
      phaseRef.current = "running";
      setPhase("running");
      restoreFocusRef.current = restoreFocus;
      cancelAnimationFrame(frameRef.current);
      resetTweenRef.current?.kill();
      writeWind(1);

      if (pointerIdRef.current !== null) {
        try {
          buttonRef.current?.releasePointerCapture(pointerIdRef.current);
        } catch {
          // The browser may already have released capture.
        }
        pointerIdRef.current = null;
      }

      dispatchMachineStart({ skipped: false, reduced: false });
      introTweenRef.current = gsap.to("[data-machine-control]", {
        opacity: 0,
        y: 14,
        duration: 0.32,
        ease: "power2.in",
        pointerEvents: "none",
      });
      gsap.to("[data-machine-copy]", {
        opacity: 0.42,
        duration: 0.45,
        ease: "power2.out",
      });

      watchdogRef.current = window.setTimeout(
        () => reveal(false, restoreFocusRef.current),
        MACHINE_WATCHDOG_MS - 700,
      );
    },
    [reveal, writeWind],
  );

  const wind = useCallback(
    (restoreFocus: boolean) => {
      if (!active || !ready || staticMode || phaseRef.current === "running")
        return;
      cancelAnimationFrame(frameRef.current);
      resetTweenRef.current?.kill();
      startRef.current = performance.now() - windRef.current * INTRO_HOLD_MS;
      phaseRef.current = "winding";
      setPhase("winding");

      const tick = (now: number) => {
        const progress = Math.min((now - startRef.current) / INTRO_HOLD_MS, 1);
        writeWind(progress);
        if (progress >= 1) {
          startMachine(restoreFocus);
          return;
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [active, ready, startMachine, staticMode, writeWind],
  );

  const release = useCallback(() => {
    if (phaseRef.current === "winding") reset();
  }, [reset]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const updateMotion = () => setReduced(query.matches);
    const updatePointer = () =>
      setTouchEntry(pointerQuery.matches || navigator.maxTouchPoints > 0);
    const machineReady = () => setReady(true);
    const machineFailure = () => setMachineFailed(true);
    const machineComplete = () => reveal(false, restoreFocusRef.current);

    updateMotion();
    updatePointer();
    query.addEventListener("change", updateMotion);
    pointerQuery.addEventListener("change", updatePointer);
    window.addEventListener(introEvents.ready, machineReady);
    window.addEventListener(introEvents.complete, machineComplete);
    window.addEventListener(introEvents.failed, machineFailure);
    window.addEventListener(introEvents.webglFailed, machineFailure);
    return () => {
      query.removeEventListener("change", updateMotion);
      pointerQuery.removeEventListener("change", updatePointer);
      window.removeEventListener(introEvents.ready, machineReady);
      window.removeEventListener(introEvents.complete, machineComplete);
      window.removeEventListener(introEvents.failed, machineFailure);
      window.removeEventListener(introEvents.webglFailed, machineFailure);
    };
  }, [reveal]);

  useEffect(() => {
    if (!active || !touchEntry) return;

    const enterFromScroll = () => {
      const swipe = swipeRef.current;
      if (!swipe || window.scrollY - swipe.startScrollY < 40) return;
      swipeRef.current = null;
      reveal(true, false, true);
    };

    window.addEventListener("scroll", enterFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", enterFromScroll);
  }, [active, reveal, touchEntry]);

  useEffect(() => {
    if (!active) return;
    buttonRef.current?.focus({ preventScroll: true });

    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        reveal(true, true);
        return;
      }
      if (staticMode || (event.key !== " " && event.key !== "Enter")) return;
      event.preventDefault();
      if (!event.repeat) {
        keyboardRef.current = true;
        wind(true);
      }
    };
    const keyUp = (event: KeyboardEvent) => {
      if (staticMode || (event.key !== " " && event.key !== "Enter")) return;
      event.preventDefault();
      keyboardRef.current = false;
      release();
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
  }, [active, release, reset, reveal, staticMode, wind]);

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
      window.clearTimeout(watchdogRef.current);
      window.clearTimeout(completionRef.current);
      resetTweenRef.current?.kill();
      introTweenRef.current?.kill();
      revealTimelineRef.current?.kill();
    },
    [],
  );

  const label =
    phase === "winding"
      ? "Keep winding"
      : phase === "running"
        ? "Machine running"
        : staticMode
          ? "Enter portfolio"
          : ready
            ? "Hold to wind"
            : "Preparing machine";

  return (
    <div
      className={styles.splash}
      data-intro-splash
      data-phase={phase}
      data-machine-ready={ready || staticMode ? "true" : "false"}
      ref={scopeRef}
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio introduction"
      onTouchStart={(event) => {
        if (
          !touchEntry ||
          (event.target as HTMLElement).closest("button, a, input, textarea")
        ) {
          return;
        }
        const touch = event.touches[0];
        if (!touch) return;
        swipeRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startScrollY: window.scrollY,
        };
      }}
      onTouchMove={(event) => {
        const swipe = swipeRef.current;
        const touch = event.touches[0];
        if (!swipe || !touch) return;
        const horizontalDistance = touch.clientX - swipe.startX;
        const verticalDistance = touch.clientY - swipe.startY;
        if (
          Math.abs(horizontalDistance) > 24 &&
          Math.abs(horizontalDistance) >= Math.abs(verticalDistance)
        ) {
          swipeRef.current = null;
          return;
        }
        if (
          verticalDistance <= -64 &&
          document.documentElement.dataset.introTouchScroll !== "true"
        ) {
          swipeRef.current = null;
          reveal(true, false);
        }
      }}
      onTouchEnd={() => {
        const swipe = swipeRef.current;
        if (swipe && window.scrollY - swipe.startScrollY >= 40) {
          reveal(true, false, true);
        }
        swipeRef.current = null;
      }}
      onTouchCancel={() => {
        swipeRef.current = null;
      }}
    >
      <div className={styles.meta} data-machine-copy>
        <span>Portfolio / 2026</span>
        <span>Senior frontend engineer</span>
      </div>

      <div className={styles.identity} data-machine-copy>
        <p>Marc Mathieu</p>
        <span>Product decisions to production code</span>
      </div>

      <div className={styles.machineLabel} data-machine-copy aria-hidden="true">
        <span>Wind</span>
        <i />
        <span>Cascade</span>
        <i />
        <span>Enter</span>
      </div>

      <div className={styles.handoff} data-intro-handoff aria-hidden="true">
        <span className={styles.handoffOrb} data-intro-handoff-orb />
      </div>

      <div className={styles.controls} data-machine-control>
        <button
          className={styles.enter}
          type="button"
          ref={buttonRef}
          aria-disabled={!ready && !staticMode}
          onClick={() => staticMode && reveal(false, true)}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (staticMode || event.button !== 0) return;
            pointerIdRef.current = event.pointerId;
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // Synthetic pointer events may not own capture.
            }
            wind(false);
          }}
          onPointerUp={release}
          onPointerCancel={reset}
          aria-describedby="machine-status"
        >
          <span
            className={styles.progress}
            ref={progressRef}
            role="progressbar"
            aria-label="Machine winding progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          >
            <i />
          </span>
          <span>{label}</span>
        </button>
        <span className={styles.counter} id="machine-status" aria-live="polite">
          {phase === "running"
            ? "Chain reaction in progress"
            : staticMode
              ? "Static entrance"
              : ready
                ? touchEntry
                  ? "Swipe up to enter or hold for 0.9 seconds"
                  : "Wind for 0.9 seconds"
                : "Setting the machine"}
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
