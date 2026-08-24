import { describe, expect, it } from "vitest";
import { chapterPaths, confettiPieces, sampleChapter } from "./chapter-machine";

describe("chapter machine", () => {
  it("aligns each marble exit with the next entrance", () => {
    expect(chapterPaths["roll-right"].end).toEqual(
      chapterPaths["drop-center"].start,
    );
    expect(chapterPaths["drop-center"].end.x).toBe(chapterPaths.finish.start.x);
  });

  it("moves through the three chapter actions", () => {
    const rollStart = sampleChapter("roll-right", 0);
    const rollEnd = sampleChapter("roll-right", 1);
    expect(rollEnd.ball.x).toBeGreaterThan(rollStart.ball.x);

    const dropRail = sampleChapter("drop-center", 0.55);
    const dropEnd = sampleChapter("drop-center", 1);
    expect(dropEnd.ball.x).toBeCloseTo(0);
    expect(dropEnd.ball.y).toBeLessThan(dropRail.ball.y - 2);

    const finishStart = sampleChapter("finish", 0);
    const finishEnd = sampleChapter("finish", 1);
    expect(finishEnd.ball.y).toBeLessThan(finishStart.ball.y);
    expect(finishEnd.buttonProgress).toBe(1);
    expect(finishEnd.flagProgress).toBe(1);
    expect(finishEnd.confettiProgress).toBe(1);
  });

  it("uses a fixed confetti pattern", () => {
    expect(confettiPieces).toHaveLength(24);
    expect(confettiPieces[0].angle).toBeCloseTo(Math.PI * 0.08);
    expect(confettiPieces[0].distance).toBe(1.15);
    expect(confettiPieces[23].colorIndex).toBe(2);
  });
});
