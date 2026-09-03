"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { introEvents } from "@/components/experience/intro-events";
import styles from "./Scene.module.css";

const ProceduralScene = dynamic(
  () => import("./ProceduralScene").then((module) => module.ProceduralScene),
  { ssr: false },
);

export function SceneClient({ introActive }: { introActive: boolean }) {
  // Assume motion is allowed and the scene will load so the first paint shows
  // the loading veil — never the un-posed fallback — and effects correct the
  // guess once matchMedia resolves.
  const [reducedMotion, setReducedMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(true);
  const [sceneRequested, setSceneRequested] = useState(false);
  const [machineReady, setMachineReady] = useState(false);
  const [machineFailed, setMachineFailed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const requestScene = () => setSceneRequested(true);
    const finePointerMedia = window.matchMedia("(pointer: fine)").matches;
    let firstPaintFrame = 0;
    let secondPaintFrame = 0;
    let observer: IntersectionObserver | null = null;

    window.addEventListener("portfolio:scene-prepare", requestScene);

    if (finePointerMedia) {
      firstPaintFrame = window.requestAnimationFrame(() => {
        secondPaintFrame = window.requestAnimationFrame(requestScene);
      });
    } else if (!introActive) {
      const transitions = document.querySelectorAll<HTMLElement>(
        "[data-machine-chapter]",
      );
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          requestScene();
          observer?.disconnect();
        },
        { rootMargin: "140% 0px" },
      );
      transitions.forEach((transition) => observer?.observe(transition));
    }

    return () => {
      window.cancelAnimationFrame(firstPaintFrame);
      window.cancelAnimationFrame(secondPaintFrame);
      observer?.disconnect();
      window.removeEventListener("portfolio:scene-prepare", requestScene);
    };
  }, [introActive, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || sceneRequested) return;
    let idleId = 0;
    let timeoutId = 0;
    const preload = () => {
      void import("./ProceduralScene");
    };
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(preload, { timeout: 2_000 });
    } else {
      timeoutId = window.setTimeout(preload, 1_000);
    }
    return () => {
      if (typeof window.cancelIdleCallback === "function" && idleId) {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
    };
  }, [reducedMotion, sceneRequested]);

  useEffect(() => {
    if (!sceneRequested || reducedMotion) return;
    const ready = () => setMachineReady(true);
    const failed = () => setMachineFailed(true);
    const frame = window.requestAnimationFrame(() => {
      if (document.documentElement.dataset.machineReady === "true") ready();
      if (document.documentElement.dataset.machineFailed === "true") failed();
    });
    window.addEventListener(introEvents.ready, ready);
    window.addEventListener(introEvents.failed, failed);
    window.addEventListener(introEvents.webglFailed, failed);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(introEvents.ready, ready);
      window.removeEventListener(introEvents.failed, failed);
      window.removeEventListener(introEvents.webglFailed, failed);
    };
  }, [sceneRequested, reducedMotion]);

  // Touch intros never auto-request the scene — the fallback poster stays until
  // the visitor interacts — so only expect a scene there on demand.
  const sceneLoading =
    introActive &&
    !reducedMotion &&
    !machineReady &&
    !machineFailed &&
    (sceneRequested || finePointer);

  return (
    <div
      className={styles.shell}
      data-scene-shell
      data-machine-loading={sceneLoading ? "true" : "false"}
      aria-hidden="true"
    >
      <div className={styles.fallback} data-scene-fallback>
        <span className={styles.fallbackBase} />
        <span className={styles.fallbackRail} />
        <span className={styles.fallbackBall} />
        <span className={styles.fallbackDominoes}>
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className={styles.fallbackSeesaw} />
        <span className={styles.fallbackKey} />
      </div>
      {sceneRequested && !reducedMotion ? <ProceduralScene /> : null}
      <div className={styles.veil} data-scene-veil aria-hidden="true">
        <span className={styles.veilPulse} />
      </div>
    </div>
  );
}
