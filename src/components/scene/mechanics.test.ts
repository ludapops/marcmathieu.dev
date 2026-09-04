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
  MARBLE_RADIUS,
  rotatePoint,
  sampleBalance,
  sampleBell,
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
      it("rings only after release and settles completely", () => {
        expect(sampleBell(0.42, compact).strike).toBe(0);
        expect(sampleBell(0.62, compact).bellAngle).toBe(0);
        expect(Math.abs(sampleBell(0.67, compact).bellAngle)).toBeGreaterThan(
          0,
        );
        expect(sampleBell(1, compact).bellAngle).toBe(0);
      });
      it("has continuous trajectories and can seek backward without history", () => {
        for (const sample of [
          sampleCup,
          sampleGate,
          sampleBalance,
          sampleBell,
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
  expect(INTRO_DURATION).toBe(7);
  expect(sampleIntro(0.34).lever).toBeCloseTo(0);
  expect(sampleIntro(0.41).dominoes.every((angle) => angle === 0)).toBe(true);
  expect(sampleIntro(0.76).weight).toBe(0);
  expect(sampleIntro(0.92).key).toBe(0);
  expect(sampleIntro(1).key).toBe(1);
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
