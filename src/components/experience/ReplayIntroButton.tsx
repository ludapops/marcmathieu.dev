"use client";

import { dispatchIntroReplay } from "./intro-events";

type ReplayIntroButtonProps = {
  className?: string;
};

export function ReplayIntroButton({ className }: ReplayIntroButtonProps) {
  return (
    <button className={className} type="button" onClick={dispatchIntroReplay}>
      Replay intro
    </button>
  );
}
