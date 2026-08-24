"use client";

import { useRef } from "react";
import type { Project } from "@/content/portfolio";
import styles from "./ProjectIndex.module.css";

export function ProjectIndex({ projects }: { projects: Project[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const updateFocus = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    cancelAnimationFrame(frameRef.current);
    const { clientX, clientY } = event;

    frameRef.current = requestAnimationFrame(() => {
      const cards = containerRef.current?.querySelectorAll<HTMLElement>(
        "[data-project-card]",
      );
      cards?.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.hypot(
          clientX - (rect.left + rect.width / 2),
          clientY - (rect.top + rect.height / 2),
        );
        const focus = Math.max(
          0.16,
          1 - distance / Math.max(window.innerWidth * 0.55, 560),
        );
        card.style.setProperty("--focus", focus.toFixed(3));
      });
    });
  };

  const resetFocus = () => {
    containerRef.current
      ?.querySelectorAll<HTMLElement>("[data-project-card]")
      .forEach((card) => card.style.setProperty("--focus", "1"));
  };

  return (
    <div
      className={styles.grid}
      data-motion="cards"
      onPointerMove={updateFocus}
      onPointerLeave={resetFocus}
      ref={containerRef}
    >
      {projects.map((project) => (
        <a
          className={styles.card}
          data-project-card
          href={`#${project.id}`}
          key={project.id}
          style={{ "--focus": 1 } as React.CSSProperties}
        >
          <span className={styles.index}>{project.index}</span>
          <span
            className={styles.glyph}
            data-glyph={project.id}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
          </span>
          <span className={styles.name}>{project.shortName}</span>
          <span className={styles.role}>{project.role}</span>
          <span className={styles.period}>{project.period}</span>
        </a>
      ))}
    </div>
  );
}
