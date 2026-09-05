"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Worlds.module.css";

type World = "overview" | "ag1" | "battlefield" | "beautynexos" | "next";
const worldLinks: { id: World; label: string }[] = [
  { id: "overview", label: "All" },
  { id: "ag1", label: "AG1" },
  { id: "battlefield", label: "Battlefield" },
  { id: "beautynexos", label: "BeautyNexos" },
  { id: "next", label: "Next ↗" },
];
const motionKey = "marc-motion-paused";

export function WorldsInteraction({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<World>("overview");
  const [paused, setPaused] = useState(false);
  const flight = useRef<Animation | null>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initial = requestAnimationFrame(() => {
      try {
        setPaused(localStorage.getItem(motionKey) === "true");
      } catch {
        /* Browser privacy settings can block storage. */
      }
    });
    let scrollFrame = 0;
    const updateActive = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        let current: World = "overview";
        for (const world of worldLinks) {
          const section = document.getElementById(world.id);
          if (
            section &&
            section.getBoundingClientRect().top <= innerHeight * 0.4
          )
            current = world.id;
        }
        setActive(current);
      });
    };
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    let overlay: HTMLElement | null = null;
    let busy = false;
    const returns = new Map<string, number>();
    const go = (target: HTMLElement, hash: string, top?: number) => {
      if (location.hash !== hash) history.pushState(null, "", hash);
      if (top !== undefined) window.scrollTo({ top, behavior: "instant" });
      else target.scrollIntoView({ behavior: "instant" });
      if (
        !target.hasAttribute("tabindex") &&
        !(target instanceof HTMLAnchorElement)
      )
        target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      updateActive();
    };
    const onClick = async (event: MouseEvent) => {
      if (
        !(event.target instanceof Element) ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const link = event.target.closest('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;
      const destination = document.getElementById(link.hash.slice(1));
      if (!destination) return;
      event.preventDefault();
      if (busy) return;
      const source = link.dataset.worldLink || link.dataset.returnWorld;
      const panel = source
        ? element.querySelector(`[data-world-link="${source}"]`)
        : null;
      const returning = Boolean(link.dataset.returnWorld);
      if (source && !returning) returns.set(source, window.scrollY);
      const returnTop = source ? returns.get(source) : undefined;
      const finish = () => {
        if (returning && panel instanceof HTMLElement) {
          go(
            destination,
            link.hash,
            returnTop ?? document.getElementById("work")?.offsetTop,
          );
          panel.focus({ preventScroll: true });
        } else go(destination, link.hash);
      };
      if (
        !(panel instanceof HTMLElement) ||
        media.matches ||
        element.dataset.paused === "true"
      ) {
        finish();
        return;
      }
      busy = true;
      const rect = panel.getBoundingClientRect();
      const copy = panel.cloneNode(true);
      if (!(copy instanceof HTMLElement)) {
        finish();
        busy = false;
        return;
      }
      overlay = copy;
      copy.removeAttribute("href");
      copy.removeAttribute("data-world-link");
      copy.dataset.transitionOverlay = "true";
      copy.setAttribute("aria-hidden", "true");
      copy.inert = true;
      const full = {
        left: "0px",
        top: "0px",
        width: "100vw",
        height: "100dvh",
      };
      Object.assign(copy.style, {
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        zIndex: "1000",
        margin: "0",
        pointerEvents: "none",
      });
      element.append(copy);
      try {
        if (returning) {
          Object.assign(copy.style, full);
          finish();
          const target = panel.getBoundingClientRect();
          flight.current = copy.animate(
            [
              full,
              {
                left: `${target.left}px`,
                top: `${target.top}px`,
                width: `${target.width}px`,
                height: `${target.height}px`,
              },
            ],
            {
              duration: 460,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "forwards",
            },
          );
          await flight.current.finished;
        } else {
          flight.current = copy.animate(
            [{ opacity: 1 }, { ...full, opacity: 1 }],
            {
              duration: 460,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "forwards",
            },
          );
          await flight.current.finished;
          finish();
          flight.current = copy.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 220,
            fill: "forwards",
          });
          await flight.current.finished;
        }
      } catch {
        if (element.isConnected) finish();
      } finally {
        copy.remove();
        overlay = null;
        flight.current = null;
        busy = false;
      }
    };
    const onHistory = () => {
      flight.current?.cancel();
      requestAnimationFrame(() => {
        const destination = document.getElementById(
          location.hash.slice(1) || "overview",
        );
        if (destination) {
          if (!destination.hasAttribute("tabindex"))
            destination.setAttribute("tabindex", "-1");
          destination.focus({ preventScroll: true });
        }
        updateActive();
      });
    };
    const reduceChanged = () => {
      if (media.matches) flight.current?.cancel();
    };
    element.addEventListener("click", onClick);
    window.addEventListener("popstate", onHistory);
    media.addEventListener("change", reduceChanged);
    return () => {
      cancelAnimationFrame(initial);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
      element.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onHistory);
      media.removeEventListener("change", reduceChanged);
      flight.current?.cancel();
      overlay?.remove();
    };
  }, []);
  return (
    <div
      ref={root}
      className={styles.worlds}
      data-paused={paused}
      onPointerMove={(event) => {
        if (
          paused ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          !(event.target instanceof Element)
        )
          return;
        const contact = event.target.closest("[data-contact]");
        if (!(contact instanceof HTMLElement)) return;
        const bounds = contact.getBoundingClientRect();
        contact.style.setProperty(
          "--pointer-x",
          `${((event.clientX - bounds.left) / bounds.width - 0.5) * 12}deg`,
        );
      }}
    >
      {children}
      <div className={styles.dock}>
        <nav aria-label="Project navigation">
          {worldLinks.map((world) => (
            <a
              key={world.id}
              href={`#${world.id}`}
              aria-current={active === world.id ? "location" : undefined}
            >
              <i data-color={world.id} aria-hidden="true" />
              {world.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => {
            const next = !paused;
            setPaused(next);
            if (next) flight.current?.cancel();
            try {
              localStorage.setItem(motionKey, String(next));
            } catch {
              /* Motion controls work without storage. */
            }
          }}
        >
          {paused ? "Resume motion" : "Pause motion"}
        </button>
      </div>
    </div>
  );
}

export function ContactAction() {
  const [message, setMessage] = useState("Copy address");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className={styles.contactActions}>
      <a href="mailto:avianmathieu@gmail.com">
        Email Marc <span aria-hidden="true">↗</span>
      </a>
      <div>
        <span>avianmathieu@gmail.com</span>
        <button
          type="button"
          aria-live="polite"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText("avianmathieu@gmail.com");
              setMessage("Copied ✓");
            } catch {
              setMessage("Select the address to copy");
            }
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setMessage("Copy address"), 2500);
          }}
        >
          {message}
        </button>
      </div>
    </div>
  );
}
