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
    const animatedElements = new Set<HTMLElement>();

    const track = (animation: gsap.core.Animation) => {
      animations.add(animation);
      if (motionPaused) animation.pause();
      return animation;
    };

    const reveal = (
      elements: HTMLElement[],
      from: gsap.TweenVars,
      to: gsap.TweenVars,
      triggerElement = elements[0],
    ) => {
      if (!elements.length || !triggerElement) return;
      elements.forEach((element) => animatedElements.add(element));
      gsap.set(elements, from);
      const trigger = ScrollTrigger.create({
        trigger: triggerElement,
        start: "top 88%",
        once: true,
        onEnter: () => {
          if (motionPaused) {
            gsap.set(elements, { clearProps: "all" });
            return;
          }
          const animation = gsap.to(elements, {
            ...to,
            onComplete: () => animations.delete(animation),
          });
          track(animation);
        },
      });
      triggers.push(trigger);
    };

    const hero = gsap.utils.toArray<HTMLElement>('[data-motion="hero"]');
    if (!motionPaused && hero.length) {
      hero.forEach((element) => animatedElements.add(element));
      const heroAnimation = gsap.fromTo(
        hero,
        { clipPath: "inset(0 0 100% 0)", y: 34 },
        {
          clearProps: "clipPath,transform",
          clipPath: "inset(0 0 0% 0)",
          delay: 0.08,
          duration: 0.94,
          ease: "power4.out",
          stagger: 0.12,
          y: 0,
          onComplete: () => animations.delete(heroAnimation),
        },
      );
      track(heroAnimation);
    }

    gsap.utils
      .toArray<HTMLElement>('[data-motion="heading"]')
      .forEach((group) => {
        const children = group.matches("h1,h2,h3")
          ? [group]
          : (Array.from(group.children) as HTMLElement[]);
        reveal(
          children,
          { clipPath: "inset(0 0 100% 0)", y: 46 },
          {
            clearProps: "clipPath,transform",
            clipPath: "inset(0 0 0% 0)",
            duration: 0.86,
            ease: "power4.out",
            stagger: 0.1,
            y: 0,
          },
          group,
        );
      });

    gsap.utils.toArray<HTMLElement>('[data-motion="copy"]').forEach((element) =>
      reveal(
        [element],
        { clipPath: "inset(0 0 18% 0)", y: 16 },
        {
          clearProps: "clipPath,transform",
          clipPath: "inset(0 0 0% 0)",
          duration: 0.68,
          ease: "power3.out",
          y: 0,
        },
      ),
    );

    gsap.utils
      .toArray<HTMLElement>('[data-motion="cards"]')
      .forEach((group) => {
        const cards = Array.from(group.children) as HTMLElement[];
        cards.forEach((card, index) => {
          reveal(
            [card],
            { x: index % 2 === 0 ? -42 : 42 },
            {
              clearProps: "transform",
              duration: 0.72,
              ease: "power3.out",
              x: 0,
            },
            group,
          );
        });
      });

    gsap.utils.toArray<HTMLElement>('[data-motion="rows"]').forEach((group) => {
      const rows = Array.from(group.children) as HTMLElement[];
      reveal(
        rows,
        { x: -24 },
        {
          clearProps: "transform",
          duration: 0.56,
          ease: "power3.out",
          stagger: 0.075,
          x: 0,
        },
        group,
      );
    });

    gsap.utils
      .toArray<HTMLElement>('[data-motion="media"]')
      .forEach((element, index) => {
        reveal(
          [element],
          {
            clipPath:
              index % 2 === 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
            scale: 1.035,
          },
          {
            clearProps: "clipPath,transform",
            clipPath: "inset(0 0 0 0)",
            duration: 0.9,
            ease: "power3.out",
            scale: 1,
          },
        );

        const parallax = gsap.fromTo(
          element,
          { yPercent: -2.5 },
          {
            ease: "none",
            yPercent: 2.5,
            scrollTrigger: {
              trigger: element,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
        track(parallax);
      });

    const motion = (event: Event) => {
      motionPaused = Boolean(
        (event as CustomEvent<{ paused: boolean }>).detail.paused,
      );
      animations.forEach((animation) =>
        motionPaused ? animation.pause() : animation.resume(),
      );
      if (motionPaused) {
        gsap.set(Array.from(animatedElements), { clearProps: "all" });
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
