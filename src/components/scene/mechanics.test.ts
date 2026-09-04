import { describe, expect, it } from "vitest";
import {
  balanceLayout,
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
        expect(sampleGate(1, compact).ball.y).toBe(-1.5);
      });
      it("holds the balance payload until the incoming marble lands", () => {
        const layout = balanceLayout(compact);
        expect(sampleBalance(0.32, compact).angle).toBe(0);
        expect(sampleBalance(0.57, compact).secondary).toMatchObject(
          layout.release,
        );
        expect(sampleBalance(0.329999, compact).ball.y).toBeCloseTo(
          sampleBalance(0.33, compact).ball.y,
          4,
        );
        expect(sampleBalance(1, compact).secondary).toMatchObject(
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
