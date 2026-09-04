export type Point = Readonly<{ x: number; y: number }>;
export const MARBLE_RADIUS = 0.16;
export const INTRO_DURATION = 7;
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const phase = (p: number, start: number, end: number) =>
  clamp((p - start) / (end - start));
export const ease = (p: number) => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const rotatePoint = (
  pivot: Point,
  point: Point,
  angle: number,
): Point => ({
  x: pivot.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
  y: pivot.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
});

/** Distance sampling keeps rotation and rail travel in agreement. */
export function travel(points: readonly Point[], progress: number) {
  const lengths = points
    .slice(1)
    .map((point, i) =>
      Math.hypot(point.x - points[i].x, point.y - points[i].y),
    );
  const length = lengths.reduce((sum, distance) => sum + distance, 0);
  const distance = clamp(progress) * length;
  let remaining = distance;
  let signedDistance = 0;
  let direction = 1;
  for (let i = 0; i < lengths.length; i++) {
    direction = Math.sign(points[i + 1].x - points[i].x) || direction;
    if (remaining <= lengths[i]) {
      const t = lengths[i] === 0 ? 0 : remaining / lengths[i];
      return {
        x: mix(points[i].x, points[i + 1].x, t),
        y: mix(points[i].y, points[i + 1].y, t),
        rotation: -(signedDistance + remaining * direction) / MARBLE_RADIUS,
      };
    }
    remaining -= lengths[i];
    signedDistance += lengths[i] * direction;
  }
  const end = points.at(-1) ?? { x: 0, y: 0 };
  return { ...end, rotation: -signedDistance / MARBLE_RADIUS };
}

export const chapterActions = [
  "tipping-cup",
  "counterweight-gate",
  "balance-transfer",
  "bell",
] as const;
export type ChapterAction = (typeof chapterActions)[number];
export type MachineKind = "intro" | ChapterAction;

export const chapterSpan = (compact: boolean) => (compact ? 1.55 : 2.65);
export const chapterDirection = (kind: MachineKind) =>
  kind === "counterweight-gate" || kind === "bell" ? -1 : 1;
export const HANDOFF_TOP = 1.95;
export const HANDOFF_BOTTOM = -1.65;

export function cupLayout(compact: boolean) {
  const span = chapterSpan(compact);
  const pivot = { x: 0, y: 0.15 };
  const localBall = { x: 0, y: 0.3 };
  const release = rotatePoint(pivot, localBall, -1.05);
  return {
    span,
    pivot,
    localBall,
    release,
    incoming: [
      { x: -span, y: HANDOFF_TOP },
      { x: -span, y: 1.45 },
      { x: -0.7, y: 0.7 },
      { x: 0, y: 0.45 },
    ],
    outgoing: [
      release,
      { x: span * 0.62, y: -0.15 },
      { x: span, y: -0.6 },
      { x: span, y: HANDOFF_BOTTOM },
    ],
  };
}
export function sampleCup(progress: number, compact: boolean) {
  const p = clamp(progress);
  const layout = cupLayout(compact);
  const angle = -1.05 * ease(phase(p, 0.32, 0.55));
  const held = rotatePoint(layout.pivot, layout.localBall, angle);
  const ball =
    p < 0.32
      ? travel(layout.incoming, phase(p, 0.04, 0.32) ** 1.5)
      : p < 0.55
        ? { ...held, rotation: angle }
        : travel(layout.outgoing, phase(p, 0.55, 0.92) ** 1.4);
  return { angle, ball };
}

export function gateLayout(compact: boolean) {
  const span = chapterSpan(compact);
  const pivot = { x: -0.4, y: 0.55 };
  const localBall = { x: -0.45, y: 0.21 };
  const landing = rotatePoint(pivot, localBall, 0);
  const release = rotatePoint(pivot, localBall, 0.22);
  return {
    span,
    pivot,
    localBall,
    incoming: [{ x: -span, y: HANDOFF_TOP }, { x: -span, y: 1.3 }, landing],
    outgoing: [
      release,
      { x: span, y: 0.25 },
      { x: span, y: -0.08 },
      { x: -span, y: -0.72 },
      { x: -span, y: -1.02 },
      { x: span, y: -1.5 },
      { x: span, y: HANDOFF_BOTTOM },
    ],
  };
}
export function sampleGate(progress: number, compact: boolean) {
  const p = clamp(progress);
  const layout = gateLayout(compact);
  const angle = 0.22 * ease(phase(p, 0.24, 0.34));
  const lift = ease(phase(p, 0.34, 0.51));
  const held = rotatePoint(layout.pivot, layout.localBall, angle);
  const ball =
    p < 0.24
      ? travel(layout.incoming, phase(p, 0.03, 0.24) ** 1.5)
      : p < 0.51
        ? { ...held, rotation: angle }
        : travel(layout.outgoing, phase(p, 0.51, 0.96) ** 1.2);
  return { ball, angle, lift };
}

export function balanceLayout(compact: boolean) {
  const span = chapterSpan(compact);
  const pivot = { x: 0, y: 0.1 };
  const receiver = { x: -0.9, y: 0.25 };
  const payload = { x: 0.9, y: 0.25 };
  const release = rotatePoint(pivot, payload, -0.28);
  return {
    span,
    pivot,
    receiver,
    payload,
    release,
    incoming: [
      { x: -span, y: HANDOFF_TOP },
      { x: -span, y: 1.45 },
      { x: -0.9, y: 0.95 },
    ],
    outgoing: [release, { x: span, y: -0.3 }, { x: span, y: HANDOFF_BOTTOM }],
  };
}
export function sampleBalance(progress: number, compact: boolean) {
  const p = clamp(progress);
  const layout = balanceLayout(compact);
  const angle = -0.28 * ease(phase(p, 0.33, 0.5));
  const incoming = travel(layout.incoming, phase(p, 0.03, 0.23) ** 1.5);
  const crossing = phase(p, 0.5, 0.7) ** 1.5;
  const localBall = {
    x: mix(layout.receiver.x, layout.payload.x, crossing),
    y: layout.receiver.y,
  };
  const held = rotatePoint(layout.pivot, localBall, angle);
  const ball =
    p < 0.23
      ? incoming
      : p < 0.33
        ? {
            x: -0.9,
            y: mix(0.95, 0.35, phase(p, 0.23, 0.33) ** 2),
            rotation: incoming.rotation,
          }
        : p < 0.7
          ? { ...held, rotation: angle - (crossing * 1.8) / MARBLE_RADIUS }
          : travel(layout.outgoing, phase(p, 0.7, 0.96) ** 1.3);
  return { ball, angle };
}

export function bellLayout(compact: boolean) {
  const span = chapterSpan(compact);
  return {
    span,
    rail: [
      { x: -span, y: HANDOFF_TOP },
      { x: -span, y: 1.15 },
      { x: -0.5, y: 0.5 },
      { x: 0, y: 0.25 },
    ],
    strikerPivot: { x: 0.15, y: 1.3 },
  };
}
export function sampleBell(progress: number, compact: boolean) {
  const p = clamp(progress);
  const railBall = travel(
    bellLayout(compact).rail,
    phase(p, 0.04, 0.43) ** 1.4,
  );
  const ball = { ...railBall, y: railBall.y - 0.6 * phase(p, 0.43, 0.51) ** 2 };
  const strike = ease(phase(p, 0.43, 0.62));
  const settle = phase(p, 0.62, 1);
  const angle =
    p < 0.62
      ? mix(-0.7, 0.75, strike)
      : 0.75 * Math.exp(-6 * settle) * Math.cos(settle * Math.PI * 4);
  const bellAngle =
    p <= 0.62 ? 0 : 0.13 * Math.sin(settle * Math.PI * 7) * (1 - settle) ** 2;
  return { ball, angle, bellAngle, strike };
}

export const introLayout = {
  rail: [
    { x: -3.15, y: 1.15 },
    { x: -2.65, y: 1.05 },
    { x: -1.85, y: 0.5 },
    { x: -1.25, y: 0.28 },
  ],
  leverPivot: { x: -1.1, y: 0 },
  dominoStart: -0.55,
  dominoGap: 0.42,
  dominoCount: 5,
  key: { x: 2.85, y: -0.46 },
};
export function sampleIntro(progress: number) {
  const p = clamp(progress);
  const ball = travel(introLayout.rail, phase(p, 0.035, 0.35) ** 1.4);
  const lever = -0.85 * ease(phase(p, 0.35, 0.43));
  const dominoes = Array.from(
    { length: introLayout.dominoCount },
    (_, i) => -1.22 * ease(phase(p, 0.42 + i * 0.061, 0.5 + i * 0.061)),
  );
  const weight = phase(p, 0.77, 0.93) ** 2;
  const key = ease(phase(p, 0.93, 0.97));
  return {
    ball,
    lever,
    dominoes,
    weight,
    key,
    plunger: ease(phase(p, 0, 0.035)),
  };
}

export function sampleChapterBall(
  kind: ChapterAction,
  progress: number,
  compact: boolean,
) {
  const samplers = {
    "tipping-cup": sampleCup,
    "counterweight-gate": sampleGate,
    "balance-transfer": sampleBalance,
    bell: sampleBell,
  };
  const ball = samplers[kind](progress, compact).ball;
  const direction = chapterDirection(kind);
  return {
    ...ball,
    x: ball.x * direction,
    rotation: ball.rotation * direction,
  };
}
