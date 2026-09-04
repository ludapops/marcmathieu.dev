import { describe, expect, it } from "vitest";
import {
  balanceLayout,
  chapterActions,
  sampleChapterBall,
  HANDOFF_BOTTOM,
  HANDOFF_TOP,
  cupLayout,
  gateLayout,
  INTRO_DURATION,
  introLayout,
  MARBLE_RADIUS,
  rotatePoint,
  sampleBalance,
  sampleFinale,
  sampleCup,
  sampleGate,
  sampleIntro,
  travel,
} from "./mechanics";

for (const compact of [false, true]) {
  describe(
    compact ? "phone mechanisms" : "desktop and tablet mechanisms",
    () => {
      it("releases the tipping cup exactly onto the exit track", () => {
        const layout = cupLayout(compact);
        const held = rotatePoint(layout.pivot, layout.localBall, -1.05);
        expect(sampleCup(0.55, compact).ball).toMatchObject(held);
        expect(layout.outgoing[0]).toEqual(held);
        expect(sampleCup(0.319999, compact).ball.x).toBeCloseTo(
          sampleCup(0.32, compact).ball.x,
          4,
        );
      });
      it("keeps the marble on the trigger until the gate has lifted", () => {
        const layout = gateLayout(compact);
        const loaded = sampleGate(0.34, compact);
        expect(loaded.lift).toBe(0);
        expect(loaded.ball).toMatchObject(
          rotatePoint(layout.pivot, layout.localBall, loaded.angle),
        );
        expect(sampleGate(0.51, compact).lift).toBe(1);
        expect(sampleGate(0.51, compact).ball).toMatchObject(
          layout.outgoing[0],
        );
        expect(sampleGate(1, compact).ball.y).toBe(HANDOFF_BOTTOM);
      });
      it("carries the same marble across the tipping balance", () => {
        const layout = balanceLayout(compact);
        expect(sampleBalance(0.32, compact).angle).toBeCloseTo(0);
        expect(sampleBalance(0.7, compact).ball).toMatchObject(layout.release);
        expect(sampleBalance(0.329999, compact).ball.y).toBeCloseTo(
          sampleBalance(0.33, compact).ball.y,
          4,
        );
        expect(sampleBalance(1, compact).ball).toMatchObject(
          layout.outgoing.at(-1)!,
        );
      });
      it("opens the hopper only after the marble releases the counterweight", () => {
        expect(sampleFinale(0.5, compact).lift).toBe(0);
        expect(sampleFinale(0.75, compact).doors).toBe(0);
        expect(sampleFinale(1, compact).doors).toBe(1);
      });
      it("has continuous trajectories and can seek backward without history", () => {
        for (const sample of [
          sampleCup,
          sampleGate,
          sampleBalance,
          sampleFinale,
        ]) {
          const saved = sample(0.43, compact);
          let previous = sample(0, compact).ball;
          for (let i = 1; i <= 2000; i++) {
            const next = sample(i / 2000, compact).ball;
            expect(
              Math.hypot(next.x - previous.x, next.y - previous.y),
            ).toBeLessThan(0.08);
            previous = next;
          }
          expect(sample(0.43, compact)).toEqual(saved);
          expect(sample(-10, compact)).toEqual(sample(0, compact));
          expect(sample(10, compact)).toEqual(sample(1, compact));
        }
      });
    },
  );
}

it("rolls by arc length, including through a turn", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: -4 },
  ];
  expect(travel(path, 0.5)).toEqual({
    x: 3,
    y: -0.5,
    rotation: -3.5 / MARBLE_RADIUS,
  });
});
it("finishes the intro after its causal sequence", () => {
  expect(INTRO_DURATION).toBe(8);
  expect(sampleIntro(2.38 / 8).lever).toBeCloseTo(0);
  expect(sampleIntro(2.87 / 8).dominoes.every((angle) => angle === 0)).toBe(
    true,
  );
  expect(sampleIntro(5.1 / 8).launcherAngle).toBeCloseTo(0);
  expect(sampleIntro(6.79 / 8).key).toBe(0);
  expect(sampleIntro(1).key).toBe(1);
  expect(sampleIntro(1).impact).toBe(0);
});

it("reverses spin when the rail reverses direction", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 2, y: -0.2 },
    { x: 0, y: -0.4 },
  ];
  expect(travel(path, 0.5).rotation).toBeLessThan(0);
  expect(travel(path, 1).rotation).toBeCloseTo(0);
});

for (const compact of [false, true]) {
  it(`matches chapter exits to the next entrance (${compact ? "compact" : "wide"})`, () => {
    for (let i = 0; i < chapterActions.length - 1; i++) {
      const exit = sampleChapterBall(chapterActions[i], 1, compact);
      const entrance = sampleChapterBall(chapterActions[i + 1], 0, compact);
      expect(exit.x).toBe(entrance.x);
      expect(exit.y).toBeCloseTo(HANDOFF_BOTTOM);
      expect(entrance.y).toBe(HANDOFF_TOP);
    }
    expect(sampleChapterBall("tipping-cup", 1, compact).x).toBeGreaterThan(0);
    expect(sampleChapterBall("counterweight-gate", 1, compact).x).toBeLessThan(
      0,
    );
    expect(sampleChapterBall("balance-transfer", 1, compact).x).toBeGreaterThan(
      0,
    );
  });
}

it("releases from the cup, lands on the key, and resets without history", () => {
  const at = (seconds: number) => sampleIntro(seconds / INTRO_DURATION);
  const release = rotatePoint(
    introLayout.launcherPivot,
    introLayout.launcherCup,
    introLayout.releaseAngle,
  );
  expect(at(5.5).projectile).toEqual(release);
  expect(at(6.8).projectile.x).toBe(introLayout.key.x);
  expect(at(6.8).projectile.y).toBeCloseTo(
    introLayout.key.y + 0.24 + MARBLE_RADIUS,
  );
  for (const seconds of [5.2, 5.5, 6.8, 6.92, 7.35]) {
    const before = at(seconds - 0.000001).projectile;
    const after = at(seconds).projectile;
    expect(before.x).toBeCloseTo(after.x, 4);
    expect(before.y).toBeCloseTo(after.y, 4);
  }
  expect(at(6.15).projectile.y).toBeGreaterThan(release.y + 0.5);
  expect(at(7.12).projectile.y).toBeGreaterThan(at(7.35).projectile.y);
  const initial = at(0);
  at(8);
  expect(at(0)).toEqual(initial);
  expect(at(8).projectile.y).toBeCloseTo(
    introLayout.key.y + 0.24 + MARBLE_RADIUS - 0.1,
  );
});

it("keeps falling domino solids separated throughout the cascade", () => {
  const {
    dominoWidth: width,
    dominoHeight: height,
    dominoGap: gap,
  } = introLayout;
  const corners = (index: number, angle: number) =>
    [-width / 2, width / 2].flatMap((x) =>
      [0, height].map((y) =>
        rotatePoint({ x: index * gap, y: 0 }, { x, y }, angle),
      ),
    );
  for (let frame = 0; frame <= 4000; frame++) {
    const angles = sampleIntro(frame / 4000).dominoes;
    for (let i = 0; i < angles.length - 1; i++) {
      const a = corners(i, angles[i]);
      const b = corners(i + 1, angles[i + 1]);
      const axes = [angles[i], angles[i + 1]].flatMap((angle) => [
        { x: Math.cos(angle), y: Math.sin(angle) },
        { x: -Math.sin(angle), y: Math.cos(angle) },
      ]);
      const separated = axes.some((axis) => {
        const pa = a.map((point) => point.x * axis.x + point.y * axis.y);
        const pb = b.map((point) => point.x * axis.x + point.y * axis.y);
        return (
          Math.max(...pa) <= Math.min(...pb) + 1e-9 ||
          Math.max(...pb) <= Math.min(...pa) + 1e-9
        );
      });
      expect(separated, `domino ${i} at progress ${frame / 4000}`).toBe(true);
    }
  }
});

it("transfers motion without waiting at domino contacts", () => {
  const end = sampleIntro(5.15 / INTRO_DURATION).dominoes;
  for (let frame = 1; frame < 2200; frame++) {
    const time = 2.94 + frame / 1000;
    const before = sampleIntro(time / INTRO_DURATION).dominoes;
    const after = sampleIntro((time + 0.001) / INTRO_DURATION).dominoes;
    before.forEach((angle, index) => {
      if (angle < -0.001 && angle > end[index] + 0.001)
        expect(after[index]).toBeLessThan(angle);
    });
  }
});

it("keeps the last domino outside the release lever and loaded catapult", () => {
  const lastX =
    introLayout.dominoStart +
    (introLayout.dominoCount - 1) * introLayout.dominoGap;
  for (let frame = 0; frame <= 2000; frame++) {
    const state = sampleIntro(frame / 2000);
    const angle = state.dominoes[introLayout.dominoCount - 1];
    const corners = [
      -introLayout.dominoWidth / 2,
      introLayout.dominoWidth / 2,
    ].flatMap((x) =>
      [0, introLayout.dominoHeight].map((y) =>
        rotatePoint({ x: lastX, y: -0.35 }, { x, y }, angle),
      ),
    );
    const normal = { x: Math.cos(state.latch), y: -Math.sin(state.latch) };
    for (const point of corners)
      expect(
        (point.x - introLayout.releaseLeverX) * normal.x +
          (point.y + 0.35) * normal.y,
      ).toBeLessThanOrEqual(-0.03 + 1e-9);
    const cupLeft =
      introLayout.launcherPivot.x +
      (introLayout.launcherCup.x - 0.27) * Math.cos(state.launcherAngle) -
      (introLayout.launcherCup.y - MARBLE_RADIUS - 0.1) *
        Math.sin(state.launcherAngle);
    expect(Math.max(...corners.map((point) => point.x))).toBeLessThan(
      cupLeft - 0.05,
    );
  }
});
