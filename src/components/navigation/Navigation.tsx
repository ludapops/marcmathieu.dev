"use client";

import { useEffect, useState } from "react";
import styles from "./Navigation.module.css";

const navigation = [
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

export function Navigation() {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const hydrateFrame = requestAnimationFrame(() => {
      setPaused(
        window.localStorage.getItem("portfolio-motion-paused") === "true",
      );
    });

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const available =
          document.documentElement.scrollHeight - window.innerHeight;
        setProgress(available > 0 ? window.scrollY / available : 0);
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(hydrateFrame);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const toggleMotion = () => {
    const next = !paused;
    setPaused(next);
    window.localStorage.setItem("portfolio-motion-paused", String(next));
    window.dispatchEvent(
      new CustomEvent("portfolio:motion", { detail: { paused: next } }),
    );
  };

  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <nav className={styles.navigation} aria-label="Primary navigation">
        <a
          className={styles.identity}
          href="#top"
          aria-label="Marc Mathieu, top"
        >
          MM
        </a>
        <div className={styles.links}>
          {navigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div className={styles.actions}>
          <a href="/Marc-Mathieu-Resume.pdf" target="_blank">
            Résumé
          </a>
          <button type="button" aria-pressed={paused} onClick={toggleMotion}>
            {paused ? "Resume motion" : "Pause motion"}
          </button>
        </div>
        <span
          className={styles.progress}
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden="true"
        />
      </nav>
    </>
  );
}
