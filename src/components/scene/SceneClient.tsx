"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "./Scene.module.css";

const ProceduralScene = dynamic(
  () => import("./ProceduralScene").then((module) => module.ProceduralScene),
  { ssr: false },
);

export function SceneClient({ introActive }: { introActive: boolean }) {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [sceneRequested, setSceneRequested] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const requestScene = () => setSceneRequested(true);
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let firstPaintFrame = 0;
    let secondPaintFrame = 0;
    let observer: IntersectionObserver | null = null;

    window.addEventListener("portfolio:scene-prepare", requestScene);

    if (finePointer) {
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

  return (
    <div className={styles.shell} data-scene-shell aria-hidden="true">
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
    </div>
  );
}
