"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "./Scene.module.css";

const ProceduralScene = dynamic(
  () => import("./ProceduralScene").then((module) => module.ProceduralScene),
  { ssr: false },
);

export function SceneClient() {
  const [webglEnabled, setWebglEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setWebglEnabled(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div className={styles.shell} data-scene-shell aria-hidden="true">
      <div className={styles.fallback}>
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
      {webglEnabled ? <ProceduralScene /> : null}
    </div>
  );
}
