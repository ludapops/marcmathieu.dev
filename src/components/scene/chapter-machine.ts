export type MachinePoint = Readonly<{ x: number; y: number }>;

export const chapterActions = ["roll-right", "drop-center", "finish"] as const;

export type ChapterAction = (typeof chapterActions)[number];

type CubicPath = Readonly<{
  start: MachinePoint;
  controlA: MachinePoint;
  controlB: MachinePoint;
  end: MachinePoint;
}>;

export const chapterPaths = {
  "roll-right": {
    start: { x: -3.55, y: 0.35 },
    controlA: { x: -2.15, y: 1.2 },
    controlB: { x: 1.75, y: -0.28 },
    end: { x: 3.55, y: 0.18 },
  },
  "drop-center": {
    start: { x: 3.55, y: 0.18 },
    controlA: { x: 2.65, y: 0.82 },
    controlB: { x: 0.7, y: 0.48 },
    end: { x: 0, y: -0.58 },
  },
  finish: {
    start: { x: 0, y: 2.75 },
    controlA: { x: 0.15, y: 1.85 },
    controlB: { x: -0.45, y: 0.3 },
    end: { x: 0.15, y: -0.48 },
  },
} satisfies Record<ChapterAction, CubicPath>;

export const confettiPieces = Array.from({ length: 24 }, (_, index) => {
  const angle = Math.PI * 0.08 + (index / 23) * Math.PI * 0.84;
  const lane = index % 4;
  return {
    angle,
    distance: 1.15 + lane * 0.34,
    lift: 0.65 + (index % 5) * 0.18,
    spin: (index % 2 === 0 ? 1 : -1) * (2.8 + lane * 0.65),
    colorIndex: index % 3,
  } as const;
});

export type ChapterSample = Readonly<{
  action: ChapterAction;
  ball: Readonly<{ x: number; y: number; rotation: number }>;
  dropProgress: number;
  buttonProgress: number;
  flagProgress: number;
  confettiProgress: number;
}>;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smooth = (value: number) => {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
};

const cubic = (path: CubicPath, progress: number): MachinePoint => {
  const t = clamp01(progress);
  const inverse = 1 - t;
  const startWeight = inverse * inverse * inverse;
  const controlAWeight = 3 * inverse * inverse * t;
  const controlBWeight = 3 * inverse * t * t;
  const endWeight = t * t * t;
  return {
    x:
      path.start.x * startWeight +
      path.controlA.x * controlAWeight +
      path.controlB.x * controlBWeight +
      path.end.x * endWeight,
    y:
      path.start.y * startWeight +
      path.controlA.y * controlAWeight +
      path.controlB.y * controlBWeight +
      path.end.y * endWeight,
  };
};

export function sampleChapter(
  action: ChapterAction,
  rawProgress: number,
): ChapterSample {
  const progress = clamp01(rawProgress);

  if (action === "roll-right") {
    const ball = cubic(chapterPaths[action], smooth(progress));
    return {
      action,
      ball: { ...ball, rotation: -progress * Math.PI * 8 },
      dropProgress: 0,
      buttonProgress: 0,
      flagProgress: 0,
      confettiProgress: 0,
    };
  }

  if (action === "drop-center") {
    const rollProgress = smooth(progress / 0.55);
    const dropProgress = smooth((progress - 0.55) / 0.2);
    const railPoint = cubic(chapterPaths[action], rollProgress);
    return {
      action,
      ball: {
        x: railPoint.x,
        y: railPoint.y + (-3.1 - railPoint.y) * dropProgress,
        rotation: progress * Math.PI * 7,
      },
      dropProgress,
      buttonProgress: 0,
      flagProgress: 0,
      confettiProgress: 0,
    };
  }

  const fallProgress = smooth(progress / 0.4);
  const impactPoint = cubic(chapterPaths[action], fallProgress);
  const buttonProgress = smooth((progress - 0.34) / 0.08);
  return {
    action,
    ball: {
      x: impactPoint.x,
      y: impactPoint.y - buttonProgress * 0.12,
      rotation: -progress * Math.PI * 5,
    },
    dropProgress: 0,
    buttonProgress,
    flagProgress: smooth((progress - 0.4) / 0.1),
    confettiProgress: smooth((progress - 0.45) / 0.15),
  };
}
