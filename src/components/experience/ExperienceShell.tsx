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
  shouldShowIntro,
} from "./intro-events";
import { SplashGate } from "./SplashGate";
import styles from "./SplashGate.module.css";

type ExperienceShellProps = { children: ReactNode };

export function ExperienceShell({ children }: ExperienceShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
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

  const complete = (restoreFocus: boolean) => {
    if (!INTRO_EVERY_LOAD) {
      try {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, "seen");
      } catch {
        // The current page can still complete when storage is unavailable.
      }
    }
    document.documentElement.dataset.introState = "seen";
    setActive(false);
    setMotionReady(true);
    dispatchIntroComplete();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        let hashTarget: HTMLElement | null = null;
        try {
          hashTarget = window.location.hash
            ? document.getElementById(
                decodeURIComponent(window.location.hash.slice(1)),
              )
            : null;
        } catch {
          // Preserve malformed hashes without allowing them to block entry.
        }
        hashTarget?.scrollIntoView({ block: "start" });

        if (restoreFocus) {
          document.querySelector<HTMLElement>("#main-content")?.focus({
            preventScroll: Boolean(hashTarget),
          });
        }
      });
    });
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
