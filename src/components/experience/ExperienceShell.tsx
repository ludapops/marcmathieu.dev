"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Navigation } from "@/components/navigation/Navigation";
import { SceneClient } from "@/components/scene/SceneClient";
import {
  dispatchIntroComplete,
  INTRO_EVERY_LOAD,
  INTRO_STORAGE_KEY,
  introEvents,
  shouldShowIntro,
} from "./intro-events";
import { SplashGate } from "./SplashGate";
import styles from "./SplashGate.module.css";

const MotionDirector = dynamic(
  () =>
    import("@/components/motion/MotionDirector").then(
      (module) => module.MotionDirector,
    ),
  { ssr: false },
);

type ExperienceShellProps = { children: ReactNode };

type ResponsivePointerDrag = {
  dragging: boolean;
  pointerId: number;
  previousScrollBehavior: string;
  startScrollY: number;
  startY: number;
};

const interactiveDragTargets =
  'a, button, input, textarea, select, summary, [contenteditable="true"]';

export function ExperienceShell({ children }: ExperienceShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const preserveScrollRef = useRef(false);
  const resetScrollRef = useRef(false);
  const requestedHashRef = useRef("");
  const [active, setActive] = useState(true);
  const [motionReady, setMotionReady] = useState(false);

  useLayoutEffect(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    if (window.location.hash) {
      document.documentElement.dataset.requestedHash = window.location.hash;
    }
    requestedHashRef.current =
      window.location.hash ||
      document.documentElement.dataset.requestedHash ||
      "";
    resetScrollRef.current =
      navigation?.type === "reload" && !requestedHashRef.current;
    if (resetScrollRef.current) {
      window.history.scrollRestoration = "manual";
      window.scrollTo({ behavior: "auto", left: 0, top: 0 });
    }

    let hasSeenIntro = false;
    if (!INTRO_EVERY_LOAD) {
      try {
        hasSeenIntro =
          window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "seen";
      } catch {
        // Storage can be unavailable in privacy-restricted browsing contexts.
      }
    }
    const shouldShow = shouldShowIntro({
      alwaysShow: INTRO_EVERY_LOAD,
      documentState: document.documentElement.dataset.introState,
      hasSeen: hasSeenIntro,
    });

    document.documentElement.dataset.introState = shouldShow
      ? "locked"
      : "seen";
    if (
      shouldShow &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.querySelectorAll<HTMLElement>('[data-motion="hero"]').forEach(
        (element) => {
          element.style.clipPath = "inset(0 0 100% 0)";
          element.style.transform = "translateY(34px)";
        },
      );
    }
    const frame = window.requestAnimationFrame(() => {
      setActive(shouldShow);
      setMotionReady(!shouldShow);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.inert = active;
    if (!active) {
      delete document.documentElement.dataset.introScrollLocked;
      delete document.documentElement.dataset.introTouchScroll;
      document.body.style.removeProperty("overflow");
      return;
    }

    const allowsTouchScroll =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;

    const syncScrollLock = () => {
      if (window.location.hash) {
        requestedHashRef.current = window.location.hash;
        document.documentElement.dataset.requestedHash = window.location.hash;
      }
      const allowsNativeSwipe = allowsTouchScroll && !window.location.hash;
      if (allowsNativeSwipe) {
        document.documentElement.dataset.introTouchScroll = "true";
        delete document.documentElement.dataset.introScrollLocked;
      } else {
        delete document.documentElement.dataset.introTouchScroll;
        document.documentElement.dataset.introScrollLocked = "true";
      }
      document.body.style.removeProperty("overflow");
    };

    syncScrollLock();
    window.addEventListener("hashchange", syncScrollLock);
    return () => {
      window.removeEventListener("hashchange", syncScrollLock);
      delete document.documentElement.dataset.introTouchScroll;
      delete document.documentElement.dataset.introScrollLocked;
      document.body.style.removeProperty("overflow");
    };
  }, [active]);

  useLayoutEffect(() => {
    if (active) return;

    const findHashTarget = () => {
      try {
        const requestedHash =
          window.location.hash ||
          requestedHashRef.current ||
          document.documentElement.dataset.requestedHash ||
          "";
        return requestedHash
          ? document.getElementById(
              decodeURIComponent(requestedHash.slice(1)),
            )
          : null;
      } catch {
        // Preserve malformed hashes without allowing them to block entry.
        return null;
      }
    };
    let behaviorFrame = 0;
    let behaviorRestoreFrame = 0;
    const previousScrollBehavior =
      document.documentElement.style.scrollBehavior;
    const scrollToHashTarget = () => {
      const target = findHashTarget();
      if (!target) return null;
      window.cancelAnimationFrame(behaviorFrame);
      window.cancelAnimationFrame(behaviorRestoreFrame);
      document.documentElement.style.scrollBehavior = "auto";
      void document.documentElement.offsetHeight;
      target.scrollIntoView({ block: "start", behavior: "auto" });
      behaviorFrame = window.requestAnimationFrame(() => {
        behaviorRestoreFrame = window.requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior =
            previousScrollBehavior;
        });
      });
      return target;
    };
    const restoreHashIfOutsideViewport = () => {
      const target = findHashTarget();
      if (!target) return true;
      const bounds = target.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
        scrollToHashTarget();
        return false;
      }
      return true;
    };
    const restoreAfterSceneReady = () => {
      window.requestAnimationFrame(restoreHashIfOutsideViewport);
    };
    const resetToTop = resetScrollRef.current && !preserveScrollRef.current;
    const requestedHashTarget = resetToTop ? null : findHashTarget();
    let outerFrame = 0;
    let innerFrame = 0;
    let resizeFrame = 0;
    let settleTimer = 0;
    let interactionTimer = 0;
    let hashInterval = 0;
    let layoutObserver: ResizeObserver | null = null;

    const stopHashRestore = () => {
      window.clearInterval(hashInterval);
      hashInterval = 0;
      layoutObserver?.disconnect();
      delete document.documentElement.dataset.hashRestoring;
      window.removeEventListener("wheel", stopHashRestore);
      window.removeEventListener("touchstart", stopHashRestore);
      window.removeEventListener("pointerdown", stopHashRestore);
    };

    if (requestedHashTarget) {
      if (!window.location.hash && requestedHashRef.current) {
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}${requestedHashRef.current}`,
        );
      }
      document.documentElement.dataset.hashRestoring = "true";
      layoutObserver = new ResizeObserver(() => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(
          restoreHashIfOutsideViewport,
        );
      });
      layoutObserver.observe(document.body);
      window.addEventListener(introEvents.ready, restoreAfterSceneReady);
      interactionTimer = window.setTimeout(() => {
        window.addEventListener("wheel", stopHashRestore, { passive: true });
        window.addEventListener("touchstart", stopHashRestore, {
          passive: true,
        });
        window.addEventListener("pointerdown", stopHashRestore, {
          passive: true,
        });
      }, 1_000);
      hashInterval = window.setInterval(restoreHashIfOutsideViewport, 250);
      settleTimer = window.setTimeout(() => {
        stopHashRestore();
        restoreHashIfOutsideViewport();
        window.removeEventListener(introEvents.ready, restoreAfterSceneReady);
      }, 20_000);
    }

    outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        const hashTarget = resetToTop ? null : scrollToHashTarget();
        if (resetToTop) {
          window.scrollTo({ behavior: "auto", left: 0, top: 0 });
        }
        if (restoreFocusRef.current) {
          document.querySelector<HTMLElement>("#main-content")?.focus({
            preventScroll: resetToTop || Boolean(hashTarget),
          });
        }
      });
    });

    return () => {
      layoutObserver?.disconnect();
      window.cancelAnimationFrame(outerFrame);
      window.cancelAnimationFrame(innerFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.cancelAnimationFrame(behaviorFrame);
      window.cancelAnimationFrame(behaviorRestoreFrame);
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      window.clearTimeout(settleTimer);
      window.clearTimeout(interactionTimer);
      window.clearInterval(hashInterval);
      delete document.documentElement.dataset.hashRestoring;
      window.removeEventListener("wheel", stopHashRestore);
      window.removeEventListener("touchstart", stopHashRestore);
      window.removeEventListener("pointerdown", stopHashRestore);
      window.removeEventListener(introEvents.ready, restoreAfterSceneReady);
    };
  }, [active]);

  useLayoutEffect(() => {
    let restoreBehaviorFrame = 0;

    const replayIntro = () => {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;

      restoreFocusRef.current = false;
      preserveScrollRef.current = false;
      resetScrollRef.current = true;
      requestedHashRef.current = "";
      delete root.dataset.requestedHash;
      root.dataset.introState = "locked";

      if (window.location.hash) {
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }

      root.style.scrollBehavior = "auto";
      window.scrollTo({ behavior: "auto", left: 0, top: 0 });
      setActive(true);

      restoreBehaviorFrame = window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    };

    window.addEventListener(introEvents.replay, replayIntro);
    return () => {
      window.cancelAnimationFrame(restoreBehaviorFrame);
      window.removeEventListener(introEvents.replay, replayIntro);
    };
  }, []);

  useLayoutEffect(() => {
    if (active || process.env.NODE_ENV !== "development") return;

    let drag: ResponsivePointerDrag | null = null;
    document.documentElement.dataset.responsiveDragScrollEnabled = "true";

    const finishDrag = () => {
      if (drag?.dragging) {
        document.documentElement.style.scrollBehavior =
          drag.previousScrollBehavior;
      }
      delete document.documentElement.dataset.responsiveDragScroll;
      drag = null;
    };

    const pointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        event.button !== 0 ||
        !event.isPrimary ||
        (event.pointerType !== "mouse" && event.pointerType !== "touch") ||
        window.innerWidth > 1023 ||
        !(target instanceof Element) ||
        (event.pointerType === "mouse" &&
          target.closest(interactiveDragTargets))
      ) {
        return;
      }

      drag = {
        dragging: false,
        pointerId: event.pointerId,
        previousScrollBehavior: document.documentElement.style.scrollBehavior,
        startScrollY: window.scrollY,
        startY: event.clientY,
      };
    };

    const pointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if ((event.buttons & 1) !== 1) {
        finishDrag();
        return;
      }

      const distance = drag.startY - event.clientY;
      if (!drag.dragging && Math.abs(distance) < 6) return;
      if (!drag.dragging) {
        drag.dragging = true;
        document.documentElement.dataset.responsiveDragScroll = "true";
        document.documentElement.style.scrollBehavior = "auto";
      }

      event.preventDefault();
      window.scrollTo({ left: 0, top: drag.startScrollY + distance });
    };

    window.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove, { passive: false });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    window.addEventListener("blur", finishDrag);
    return () => {
      finishDrag();
      delete document.documentElement.dataset.responsiveDragScrollEnabled;
      window.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      window.removeEventListener("blur", finishDrag);
    };
  }, [active]);

  const complete = (restoreFocus: boolean, preserveScroll = false) => {
    if (!INTRO_EVERY_LOAD) {
      try {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, "seen");
      } catch {
        // The current page can still complete when storage is unavailable.
      }
    }
    delete document.documentElement.dataset.introScrollLocked;
    delete document.documentElement.dataset.introTouchScroll;
    document.body.style.removeProperty("overflow");
    document.documentElement.dataset.introState = "seen";
    restoreFocusRef.current = restoreFocus;
    preserveScrollRef.current = preserveScroll;
    setActive(false);
    setMotionReady(true);
    dispatchIntroComplete();
  };

  return (
    <>
      <SceneClient introActive={active} />
      {active ? (
        <>
          <div
            className={styles.backdrop}
            data-intro-backdrop
            aria-hidden="true"
          />
          <SplashGate active={active} onComplete={complete} />
        </>
      ) : null}
      <div ref={contentRef} data-experience-content>
        {motionReady ? <MotionDirector /> : null}
        <Navigation />
        {children}
      </div>
    </>
  );
}
