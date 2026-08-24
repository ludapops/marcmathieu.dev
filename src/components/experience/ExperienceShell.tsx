"use client";

import gsap from "gsap";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { MotionDirector } from "@/components/motion/MotionDirector";
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

type ExperienceShellProps = { children: ReactNode };

export function ExperienceShell({ children }: ExperienceShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const [active, setActive] = useState(true);
  const [motionReady, setMotionReady] = useState(false);

  useLayoutEffect(() => {
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
      gsap.set('[data-motion="hero"]', {
        clipPath: "inset(0 0 100% 0)",
        y: 34,
      });
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
    if (!active) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  useLayoutEffect(() => {
    if (active) return;

    const findHashTarget = () => {
      try {
        return window.location.hash
          ? document.getElementById(
              decodeURIComponent(window.location.hash.slice(1)),
            )
          : null;
      } catch {
        // Preserve malformed hashes without allowing them to block entry.
        return null;
      }
    };
    const scrollToHashTarget = () => {
      const target = findHashTarget();
      if (!target) return null;
      const previousScrollBehavior =
        document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      target.scrollIntoView({ block: "start", behavior: "auto" });
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      return target;
    };
    const restoreHashIfOutsideViewport = () => {
      const target = findHashTarget();
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
        scrollToHashTarget();
      }
    };
    const restoreAfterSceneReady = () => {
      window.requestAnimationFrame(restoreHashIfOutsideViewport);
    };
    const requestedHashTarget = findHashTarget();
    let outerFrame = 0;
    let innerFrame = 0;
    let resizeFrame = 0;
    let settleTimer = 0;
    let layoutObserver: ResizeObserver | null = null;

    if (requestedHashTarget) {
      layoutObserver = new ResizeObserver(() => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(
          restoreHashIfOutsideViewport,
        );
      });
      layoutObserver.observe(document.body);
      window.addEventListener(introEvents.ready, restoreAfterSceneReady);
      settleTimer = window.setTimeout(() => {
        layoutObserver?.disconnect();
        restoreHashIfOutsideViewport();
        window.removeEventListener(introEvents.ready, restoreAfterSceneReady);
      }, 3000);
    }

    outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        const hashTarget = scrollToHashTarget();
        if (restoreFocusRef.current) {
          document.querySelector<HTMLElement>("#main-content")?.focus({
            preventScroll: Boolean(hashTarget),
          });
        }
      });
    });

    return () => {
      layoutObserver?.disconnect();
      window.cancelAnimationFrame(outerFrame);
      window.cancelAnimationFrame(innerFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.clearTimeout(settleTimer);
      window.removeEventListener(introEvents.ready, restoreAfterSceneReady);
    };
  }, [active]);

  const complete = (restoreFocus: boolean) => {
    if (!INTRO_EVERY_LOAD) {
      try {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, "seen");
      } catch {
        // The current page can still complete when storage is unavailable.
      }
    }
    document.documentElement.dataset.introState = "seen";
    restoreFocusRef.current = restoreFocus;
    setActive(false);
    setMotionReady(true);
    dispatchIntroComplete();
  };

  return (
    <>
      <SceneClient />
      <div className={styles.backdrop} data-intro-backdrop aria-hidden="true" />
      <SplashGate active={active} onComplete={complete} />
      <div ref={contentRef} data-experience-content>
        {motionReady ? <MotionDirector /> : null}
        <Navigation />
        {children}
      </div>
    </>
  );
}
