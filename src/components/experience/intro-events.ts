export const INTRO_STORAGE_KEY = "marc-portfolio-intro-v1";
export const INTRO_HOLD_MS = 900;
export const INTRO_RESET_MS = 250;
export const INTRO_REVEAL_MS = 1600;

export const introEvents = {
  progress: "portfolio:intro-progress",
  reveal: "portfolio:intro-reveal",
  complete: "portfolio:intro-complete",
} as const;

export type IntroProgressDetail = { progress: number };
export type IntroRevealDetail = {
  duration: number;
  reduced: boolean;
  skipped: boolean;
};

export function dispatchIntroProgress(progress: number) {
  window.dispatchEvent(
    new CustomEvent<IntroProgressDetail>(introEvents.progress, {
      detail: { progress },
    }),
  );
}

export function dispatchIntroReveal(detail: IntroRevealDetail) {
  window.dispatchEvent(
    new CustomEvent<IntroRevealDetail>(introEvents.reveal, { detail }),
  );
}

export function dispatchIntroComplete() {
  window.dispatchEvent(new CustomEvent(introEvents.complete));
}
