export type MachinePoint = Readonly<{ x: number; y: number }>;

export const chapterActions = [
  "roll-right",
  "drop-left",
  "basket-shot",
] as const;

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
  "drop-left": {
    start: { x: 3.55, y: 0.18 },
    controlA: { x: 2.45, y: 0.86 },
    controlB: { x: -2.05, y: 0.38 },
    end: { x: -3.17, y: -0.58 },
  },
  "basket-shot": {
    start: { x: -3.17, y: 2.75 },
    controlA: { x: -3.25, y: 1.85 },
    controlB: { x: -3.09, y: 0.28 },
    end: { x: -3.17, y: -0.42 },
  },
} satisfies Record<ChapterAction, CubicPath>;

export const basketLayout = {
  catapultPivot: { x: -2.45, y: -0.7 },
  triggerLanding: { x: -3.17, y: -0.42 },
  loadedBall: { x: -1.73, y: -0.42 },
  shotLaunch: { x: -1.8, y: -0.04 },
  hoop: { x: 2.3, y: 0.55 },
  shotEnd: { x: 2.34, y: -0.22 },
  shotLift: 2.15,
  scoreThreshold: 0.86,
} as const;

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
  shotBall: Readonly<{
    x: number;
    y: number;
    rotation: number;
    visible: boolean;
  }>;
  dropProgress: number;
  catapultProgress: number;
  shotProgress: number;
  scoreProgress: number;
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

const shot = (progress: number): MachinePoint => {
  const t = clamp01(progress);
  const horizontalProgress = 1 - (1 - t) * (1 - t);
  return {
    x:
      basketLayout.shotLaunch.x +
      (basketLayout.shotEnd.x - basketLayout.shotLaunch.x) * horizontalProgress,
    y:
      basketLayout.shotLaunch.y +
      (basketLayout.shotEnd.y - basketLayout.shotLaunch.y) * t +
      Math.sin(t * Math.PI) * basketLayout.shotLift,
  };
};

const hiddenShotBall = {
  ...basketLayout.loadedBall,
  rotation: 0,
  visible: false,
} as const;

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
      shotBall: hiddenShotBall,
      dropProgress: 0,
      catapultProgress: 0,
      shotProgress: 0,
      scoreProgress: 0,
      confettiProgress: 0,
    };
  }

  if (action === "drop-left") {
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
      shotBall: hiddenShotBall,
      dropProgress,
      catapultProgress: 0,
      shotProgress: 0,
      scoreProgress: 0,
      confettiProgress: 0,
    };
  }

  const fallProgress = smooth(progress / 0.22);
  const landingPoint = cubic(chapterPaths[action], fallProgress);
  const catapultProgress = smooth((progress - 0.2) / 0.08);
  const shotProgress = smooth((progress - 0.28) / 0.3);
  const shotPoint = shot(shotProgress);
  const loadedShotBall = {
    x:
      basketLayout.loadedBall.x +
      (basketLayout.shotLaunch.x - basketLayout.loadedBall.x) *
        catapultProgress,
    y:
      basketLayout.loadedBall.y +
      (basketLayout.shotLaunch.y - basketLayout.loadedBall.y) *
        catapultProgress,
  };
  const scoreProgress = smooth(
    (shotProgress - basketLayout.scoreThreshold) / 0.07,
  );
  const confettiProgress = smooth(
    (shotProgress - basketLayout.scoreThreshold) / 0.14,
  );
  return {
    action,
    ball: {
      x: landingPoint.x + catapultProgress * 0.02,
      y: landingPoint.y - catapultProgress * 0.13,
      rotation: progress * Math.PI * 6,
    },
    shotBall: {
      ...(shotProgress > 0 ? shotPoint : loadedShotBall),
      rotation: -shotProgress * Math.PI * 9,
      visible: true,
    },
    dropProgress: 0,
    catapultProgress,
    shotProgress,
    scoreProgress,
    confettiProgress,
  };
}
