import { expect, it } from "vitest";
import { routeLayout, sampleRoute } from "./connected-route";
import { chapterActions, sampleChapterBall } from "./mechanics";
for (const width of [320, 390, 834, 1440, 1920]) {
  it(`connects each mechanism to the next at ${width}px`, () => {
    const compact = width < 600;
    const chapters = [1000, 3200, 6000, 10500].map((top) => ({
      top,
      height: 800,
    }));
    const layout = routeLayout(width, 870, chapters, compact);
    for (const segment of layout.segments) {
      if (segment.kind !== "connector") continue;
      expect(segment.points[0]).toEqual(
        layout.world(
          segment.chapter,
          sampleChapterBall(chapterActions[segment.chapter], 1, compact),
        ),
      );
      expect(segment.points[3]).toEqual(
        layout.world(
          segment.chapter + 1,
          sampleChapterBall(chapterActions[segment.chapter + 1], 0, compact),
        ),
      );
      expect(segment.end).toBeGreaterThan(segment.start);
      expect(segment.points[1].x).toBe(segment.points[2].x);
      expect([layout.gutter / 2, width - layout.gutter / 2]).toContain(
        segment.points[1].x,
      );
    }
    const later = routeLayout(
      width,
      870,
      chapters.map((c, i) => ({ ...c, top: c.top + (i > 0 ? 500 : 0) })),
      compact,
    );
    expect(later.scale).toBe(layout.scale);
    expect(later.centers[1] - layout.centers[1]).toBe(500);
    const state = sampleRoute(layout, 4000, compact);
    sampleRoute(layout, 9000, compact);
    expect(sampleRoute(layout, 4000, compact)).toEqual(state);
  });
}
