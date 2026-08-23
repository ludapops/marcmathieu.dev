"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function MotionDirector() {
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let motionPaused =
      window.localStorage.getItem("portfolio-motion-paused") === "true";
    const animations = new Set<gsap.core.Animation>();
    const triggers: ScrollTrigger[] = [];

    const track = (animation: gsap.core.Animation) => {
      animations.add(animation);
      if (motionPaused) animation.pause();
      return animation;
    };

    const reveal = (
      elements: HTMLElement[],
      options: { stagger?: number; y?: number } = {},
    ) => {
      if (!elements.length) return;
      gsap.set(elements, {
        clipPath: "inset(0 0 14% 0)",
        filter: "blur(5px)",
        y: options.y ?? 42,
      });
      const trigger = ScrollTrigger.create({
        trigger: elements[0],
        start: "top 88%",
        once: true,
        onEnter: () => {
          if (motionPaused) {
            gsap.set(elements, {
              clearProps: "clipPath,filter,transform",
            });
            return;
          }
          const animation = gsap.to(elements, {
            clearProps: "clipPath,filter,transform",
            clipPath: "inset(0 0 0% 0)",
            duration: 0.82,
            ease: "power3.out",
            filter: "blur(0px)",
            stagger: options.stagger ?? 0,
            y: 0,
            onComplete: () => animations.delete(animation),
          });
          track(animation);
        },
      });
      triggers.push(trigger);
    };

    const heroElements = gsap.utils.toArray<HTMLElement>("[data-motion-hero]");
    if (!motionPaused && heroElements.length) {
      const heroAnimation = gsap.fromTo(
        heroElements,
        { clipPath: "inset(0 0 12% 0)", filter: "blur(5px)", y: 28 },
        {
          clearProps: "clipPath,filter,transform",
          clipPath: "inset(0 0 0% 0)",
          delay: 0.08,
          duration: 0.9,
          ease: "power3.out",
          filter: "blur(0px)",
          stagger: 0.11,
          y: 0,
          onComplete: () => animations.delete(heroAnimation),
        },
      );
      track(heroAnimation);
    }

    gsap.utils
      .toArray<HTMLElement>("[data-motion-reveal]")
      .forEach((element) => reveal([element]));

    gsap.utils.toArray<HTMLElement>("[data-motion-stagger]").forEach((group) =>
      reveal(Array.from(group.children) as HTMLElement[], {
        stagger: 0.09,
        y: 34,
      }),
    );

    gsap.utils
      .toArray<HTMLElement>("[data-motion-media]")
      .forEach((element) => {
        const animation = gsap.fromTo(
          element,
          { scale: 1.035, yPercent: -2.5 },
          {
            ease: "none",
            scale: 1,
            yPercent: 2.5,
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
        track(animation);
      });

    const motion = (event: Event) => {
      motionPaused = Boolean(
        (event as CustomEvent<{ paused: boolean }>).detail.paused,
      );
      animations.forEach((animation) =>
        motionPaused ? animation.pause() : animation.resume(),
      );
      if (motionPaused) {
        gsap.set("[data-motion-reveal], [data-motion-stagger] > *", {
          clearProps: "clipPath,filter,transform",
        });
      }
    };

    window.addEventListener("portfolio:motion", motion);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("portfolio:motion", motion);
      triggers.forEach((trigger) => trigger.kill());
      animations.forEach((animation) => animation.kill());
    };
  });

  return null;
}
