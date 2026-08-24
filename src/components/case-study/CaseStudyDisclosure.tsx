"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import styles from "./CaseStudy.module.css";

const OPEN_EVENT = "portfolio:case-study-open";
const LAYOUT_EVENT = "portfolio:layout";

type OpenDetail = { id: string };

export function CaseStudyDisclosure({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const refreshLayout = () => {
      window.dispatchEvent(new Event(LAYOUT_EVENT));
    };

    const handleToggle = () => {
      details.dataset.state = details.open ? "open" : "closed";
      if (details.open) {
        window.dispatchEvent(
          new CustomEvent<OpenDetail>(OPEN_EVENT, { detail: { id } }),
        );
      }

      window.requestAnimationFrame(refreshLayout);
      window.setTimeout(refreshLayout, 560);
    };

    const handlePeerOpen = (event: Event) => {
      const openId = (event as CustomEvent<OpenDetail>).detail.id;
      if (openId !== id && details.open) details.open = false;
    };

    const handleMotion = (event: Event) => {
      details.dataset.motionPaused = String(
        (event as CustomEvent<{ paused: boolean }>).detail.paused,
      );
    };

    details.dataset.state = details.open ? "open" : "closed";
    details.addEventListener("toggle", handleToggle);
    window.addEventListener(OPEN_EVENT, handlePeerOpen);
    window.addEventListener("portfolio:motion", handleMotion);

    return () => {
      details.removeEventListener("toggle", handleToggle);
      window.removeEventListener(OPEN_EVENT, handlePeerOpen);
      window.removeEventListener("portfolio:motion", handleMotion);
    };
  }, [id]);

  return (
    <details
      className={styles.disclosure}
      data-case-study-disclosure={id}
      data-state="closed"
      name="portfolio-case-studies"
      ref={detailsRef}
    >
      <summary className={styles.disclosureToggle}>
        <span className={styles.disclosurePrompt}>
          <span className={styles.openLabel}>View full case study</span>
          <span className={styles.closeLabel}>Close case study</span>
          <span className={styles.disclosureName}>{label}</span>
        </span>
        <span className={styles.disclosureIcon} aria-hidden="true">
          <span />
          <span />
        </span>
      </summary>
      <div className={styles.detailBody} data-case-study-detail>
        {children}
      </div>
    </details>
  );
}
