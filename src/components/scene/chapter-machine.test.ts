import { describe, expect, it } from "vitest";
import {
  basketLayout,
  chapterPaths,
  confettiPieces,
  sampleChapter,
} from "./chapter-machine";

describe("chapter machine", () => {
  it("aligns each marble exit with the next entrance", () => {
    expect(chapterPaths["roll-right"].end).toEqual(
      chapterPaths["drop-left"].start,
    );
    expect(chapterPaths["drop-left"].end.x).toBe(
      chapterPaths["basket-shot"].start.x,
    );
  });

  it("moves through the three chapter actions", () => {
    const rollStart = sampleChapter("roll-right", 0);
    const rollEnd = sampleChapter("roll-right", 1);
    expect(rollEnd.ball.x).toBeGreaterThan(rollStart.ball.x);

    const dropStart = sampleChapter("drop-left", 0);
    const dropRail = sampleChapter("drop-left", 0.55);
    const dropEnd = sampleChapter("drop-left", 1);
    expect(dropRail.ball.x).toBeLessThan(dropStart.ball.x - 5);
    expect(dropEnd.ball.x).toBeCloseTo(basketLayout.triggerLanding.x);
    expect(dropEnd.ball.y).toBeLessThan(dropRail.ball.y - 2);

    const basketStart = sampleChapter("basket-shot", 0);
    const basketLaunch = sampleChapter("basket-shot", 0.4);
    const basketScore = sampleChapter("basket-shot", 0.58);
    const basketEnd = sampleChapter("basket-shot", 1);
    expect(basketStart.ball.x).toBe(dropEnd.ball.x);
    expect(basketStart.shotBall).toMatchObject({
      ...basketLayout.loadedBall,
      visible: true,
    });
    expect(basketLaunch.ball.x).toBeCloseTo(basketLayout.triggerLanding.x, 1);
    expect(basketLaunch.shotBall.y).toBeGreaterThan(
      basketLayout.shotLaunch.y + 1,
    );
    expect(basketScore.shotBall.x).toBeCloseTo(basketLayout.hoop.x, 1);
    expect(basketScore.shotBall.y).toBeLessThan(basketLayout.hoop.y);
    expect(basketEnd.catapultProgress).toBe(1);
    expect(basketEnd.shotProgress).toBe(1);
    expect(basketEnd.scoreProgress).toBe(1);
    expect(basketEnd.confettiProgress).toBe(1);
  });

  it("rewinds the score and celebration before the shot reaches the hoop", () => {
    const preScore = sampleChapter("basket-shot", 0.46);
    expect(preScore.shotProgress).toBeGreaterThan(0);
    expect(preScore.scoreProgress).toBe(0);
    expect(preScore.confettiProgress).toBe(0);
    expect(preScore.ball.x).toBeCloseTo(basketLayout.triggerLanding.x, 1);
    expect(preScore.shotBall.x).toBeGreaterThan(preScore.ball.x + 3);
  });

  it("uses a fixed confetti pattern", () => {
    expect(confettiPieces).toHaveLength(24);
    expect(confettiPieces[0].angle).toBeCloseTo(Math.PI * 0.08);
    expect(confettiPieces[0].distance).toBe(1.15);
    expect(confettiPieces[23].colorIndex).toBe(2);
  });
});
