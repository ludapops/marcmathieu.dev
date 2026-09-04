"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  dispatchMachineStart,
  dispatchMachineWind,
  dispatchScenePrepare,
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
  const readyRef = useRef(false);
  const keyboardRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const completedRef = useRef(false);
  const swipeRef = useRef<SwipeState | null>(null);
  const animationsRef = useRef(new Set<Animation>());
  const handoffTimerRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [machineFailed, setMachineFailed] = useState(false);
  const [touchEntry, setTouchEntry] = useState(true);
  const staticMode = reduced || machineFailed;

  const stopAnimations = useCallback(() => {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current.clear();
  }, []);

  const animate = useCallback(
    (
      element: Element | null | undefined,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      if (!element) return null;
      const animation = element.animate(keyframes, options);
      animationsRef.current.add(animation);
      void animation.finished
        .catch(() => undefined)
        .finally(() => animationsRef.current.delete(animation));
      return animation;
    },
    [],
  );

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
    const initialWind = windRef.current;
    const resetStartedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - resetStartedAt) / INTRO_RESET_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      writeWind(initialWind * (1 - eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [writeWind]);

  const reveal = useCallback(
    (skipped: boolean, restoreFocus: boolean, preserveScroll = false) => {
      window.clearTimeout(watchdogRef.current);
      window.clearTimeout(handoffTimerRef.current);
      cancelAnimationFrame(frameRef.current);
      stopAnimations();

      if (phaseRef.current !== "running" || skipped) {
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
        window.clearTimeout(handoffTimerRef.current);
        content?.style.removeProperty("opacity");
        content?.style.removeProperty("transform");
        onComplete(restoreFocus, preserveScroll);
      };
      if (!staticMode && !skipped && content) {
        content.style.opacity = "0";
        content.style.transform = "translateY(18px)";
      }
      document.documentElement.dataset.introState = "revealing";
      completionRef.current = window.setTimeout(
        complete,
        staticMode || skipped ? 500 : 1650,
      );

      if (staticMode || skipped) {
        const duration = staticMode ? 140 : 340;
        [root, backdrop].forEach((element) =>
          animate(element, [{ opacity: 1 }, { opacity: 0 }], {
            duration,
            easing: "ease-out",
            fill: "forwards",
          }),
        );
        return;
      }

      if (!handoff || !handoffOrb || !content) {
        [root, backdrop].forEach((element) =>
          animate(element, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 500,
            easing: "ease-out",
            fill: "forwards",
          }),
        );
        return;
      }

      handoff.style.visibility = "visible";
      handoff.style.opacity = "1";
      handoffOrb.style.opacity = "1";
      handoffOrb.style.transform = "translate(-50%, -50%) scale(0.002)";

      document
        .querySelectorAll<HTMLElement>("[data-machine-copy]")
        .forEach((element) =>
          animate(
            element,
            [
              { opacity: 1, transform: "translateY(0)" },
              { opacity: 0, transform: "translateY(-10px)" },
            ],
            {
              duration: 220,
              easing: "cubic-bezier(0.55, 0, 1, 0.45)",
              fill: "forwards",
            },
          ),
        );
      animate(
        handoffOrb,
        [
          { transform: "translate(-50%, -50%) scale(0.002)" },
          { transform: "translate(-50%, -50%) scale(1)" },
        ],
        {
          duration: 740,
          easing: "cubic-bezier(0.76, 0, 0.24, 1)",
          fill: "forwards",
        },
      );
      animate(handoffOrb, [{ opacity: 1 }, { opacity: 0 }], {
        delay: 720,
        duration: 480,
        easing: "ease-out",
        fill: "forwards",
      });
      const contentAnimation = animate(
        content,
        [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          delay: 720,
          duration: 560,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
      void contentAnimation?.finished
        .then(() => {
          contentAnimation.cancel();
          content.style.removeProperty("opacity");
          content.style.removeProperty("transform");
        })
        .catch(() => undefined);

      handoffTimerRef.current = window.setTimeout(() => {
        backdrop?.style.setProperty("opacity", "0");
        canvas?.style.setProperty("opacity", "0");
        sceneShell?.style.setProperty("visibility", "hidden");
      }, 700);
    },
    [animate, onComplete, staticMode, stopAnimations],
  );

  const startMachine = useCallback(
    (restoreFocus: boolean) => {
      if (phaseRef.current === "running") return;
      phaseRef.current = "running";
      setPhase("running");
      restoreFocusRef.current = restoreFocus;
      cancelAnimationFrame(frameRef.current);
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
      const controls = document.querySelector<HTMLElement>(
        "[data-machine-control] button",
      );
      if (controls) controls.style.pointerEvents = "none";
      animate(
        controls,
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(14px)" },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.55, 0, 1, 0.45)",
          fill: "forwards",
        },
      );
      document
        .querySelectorAll<HTMLElement>("[data-machine-copy]")
        .forEach((element) =>
          animate(element, [{ opacity: 1 }, { opacity: 0.42 }], {
            duration: 450,
            easing: "ease-out",
            fill: "forwards",
          }),
        );

      let elapsed = 0;
      let lastTick = performance.now();
      const watch = () => {
        const now = performance.now();
        if (
          !document.hidden &&
          window.localStorage.getItem("portfolio-motion-paused") !== "true"
        ) {
          elapsed += Math.min(now - lastTick, 500);
        }
        lastTick = now;
        if (elapsed >= MACHINE_WATCHDOG_MS - 700)
          reveal(false, restoreFocusRef.current);
        else watchdogRef.current = window.setTimeout(watch, 250);
      };
      watchdogRef.current = window.setTimeout(watch, 250);
    },
    [animate, reveal, writeWind],
  );

  const wind = useCallback(
    (restoreFocus: boolean) => {
      if (
        !active ||
        !readyRef.current ||
        staticMode ||
        phaseRef.current === "running"
      )
        return;
      cancelAnimationFrame(frameRef.current);
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
    [active, startMachine, staticMode, writeWind],
  );

  const release = useCallback(() => {
    pointerIdRef.current = null;
    if (phaseRef.current === "winding") reset();
  }, [reset]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const updateMotion = () => setReduced(query.matches);
    const updatePointer = () =>
      setTouchEntry(pointerQuery.matches || navigator.maxTouchPoints > 0);
    const machineReady = () => {
      readyRef.current = true;
      setReady(true);
      window.requestAnimationFrame(() => {
        if (pointerIdRef.current !== null) wind(false);
        else if (keyboardRef.current) wind(true);
      });
    };
    const machineFailure = () => setMachineFailed(true);
    const machineComplete = () => reveal(false, restoreFocusRef.current);
    const machineStateFrame = window.requestAnimationFrame(() => {
      if (document.documentElement.dataset.machineReady === "true") {
        machineReady();
      }
      if (document.documentElement.dataset.machineFailed === "true") {
        machineFailure();
      }
    });

    updateMotion();
    updatePointer();
    query.addEventListener("change", updateMotion);
    pointerQuery.addEventListener("change", updatePointer);
    window.addEventListener(introEvents.ready, machineReady);
    window.addEventListener(introEvents.complete, machineComplete);
    window.addEventListener(introEvents.failed, machineFailure);
    window.addEventListener(introEvents.webglFailed, machineFailure);
    return () => {
      window.cancelAnimationFrame(machineStateFrame);
      query.removeEventListener("change", updateMotion);
      pointerQuery.removeEventListener("change", updatePointer);
      window.removeEventListener(introEvents.ready, machineReady);
      window.removeEventListener(introEvents.complete, machineComplete);
      window.removeEventListener(introEvents.failed, machineFailure);
      window.removeEventListener(introEvents.webglFailed, machineFailure);
    };
  }, [reveal, wind]);

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
        dispatchScenePrepare();
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
      window.clearTimeout(handoffTimerRef.current);
      stopAnimations();
    },
    [stopAnimations],
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
      <div className={styles.handoff} data-intro-handoff aria-hidden="true">
        <span className={styles.handoffOrb} data-intro-handoff-orb />
      </div>

      <div className={styles.controls} data-machine-control>
        <button
          className={styles.enter}
          type="button"
          ref={buttonRef}
          aria-busy={!ready && !staticMode}
          onClick={() => staticMode && reveal(false, true)}
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (staticMode || event.button !== 0) return;
            dispatchScenePrepare();
            pointerIdRef.current = event.pointerId;
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // Synthetic pointer events may not own capture.
            }
            wind(false);
          }}
          onPointerUp={release}
          onPointerCancel={release}
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
                : touchEntry
                  ? "Swipe up to enter · Setting the machine"
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
