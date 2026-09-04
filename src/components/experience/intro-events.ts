export const INTRO_STORAGE_KEY = "marc-portfolio-machine-intro-v3";
export const INTRO_EVERY_LOAD = process.env.NODE_ENV === "development";
export const INTRO_HOLD_MS = 900;
export const INTRO_RESET_MS = 250;
export const MACHINE_WATCHDOG_MS = 12000;

export const machineStages = [
  "marble",
  "dominoes",
  "launch",
  "key",
  "complete",
] as const;

export type MachineStage = (typeof machineStages)[number];

export function shouldShowIntro({
  alwaysShow,
  documentState,
  hasSeen,
}: {
  alwaysShow: boolean;
  documentState: string | undefined;
  hasSeen: boolean;
}) {
  return alwaysShow || (documentState !== "seen" && !hasSeen);
}

export const introEvents = {
  prepare: "portfolio:scene-prepare",
  replay: "portfolio:intro-replay",
  ready: "portfolio:machine-ready",
  wind: "portfolio:machine-wind",
  start: "portfolio:machine-start",
  stage: "portfolio:machine-stage",
  complete: "portfolio:machine-complete",
  failed: "portfolio:machine-failed",
  introComplete: "portfolio:intro-complete",
  webglFailed: "portfolio:machine-webgl-failed",
} as const;

export type MachineWindDetail = { progress: number };
export type MachineStartDetail = { skipped: boolean; reduced: boolean };
export type MachineStageDetail = { stage: MachineStage };

export function dispatchScenePrepare() {
  window.dispatchEvent(new CustomEvent(introEvents.prepare));
}

export function dispatchMachineReady() {
  delete document.documentElement.dataset.machineFailed;
  document.documentElement.dataset.machineReady = "true";
  window.dispatchEvent(new CustomEvent(introEvents.ready));
}

export function dispatchMachineWind(progress: number) {
  window.dispatchEvent(
    new CustomEvent<MachineWindDetail>(introEvents.wind, {
      detail: { progress },
    }),
  );
}

export function dispatchMachineStart(detail: MachineStartDetail) {
  window.dispatchEvent(
    new CustomEvent<MachineStartDetail>(introEvents.start, { detail }),
  );
}

export function dispatchMachineStage(stage: MachineStage) {
  window.dispatchEvent(
    new CustomEvent<MachineStageDetail>(introEvents.stage, {
      detail: { stage },
    }),
  );
}

export function dispatchMachineComplete() {
  window.dispatchEvent(new CustomEvent(introEvents.complete));
}

export function dispatchMachineFailure() {
  document.documentElement.dataset.machineFailed = "true";
  window.dispatchEvent(new CustomEvent(introEvents.failed));
}

export function dispatchMachineWebglFailure() {
  document.documentElement.dataset.machineFailed = "true";
  window.dispatchEvent(new CustomEvent(introEvents.webglFailed));
}

export function dispatchIntroReplay() {
  window.dispatchEvent(new CustomEvent(introEvents.replay));
}

export function dispatchIntroComplete() {
  window.dispatchEvent(new CustomEvent(introEvents.introComplete));
}
