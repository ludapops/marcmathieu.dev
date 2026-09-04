import {
  chapterActions,
  chapterDirection,
  chapterSpan,
  clamp,
  HANDOFF_BOTTOM,
  HANDOFF_TOP,
  sampleChapterBall,
  type Point,
} from "./mechanics";

export type ChapterRect = { top: number; height: number };
export type RouteSegment =
  | { kind: "mechanism"; chapter: number; start: number; end: number }
  | {
      kind: "connector";
      chapter: number;
      start: number;
      end: number;
      points: Point[];
    };
export function routeLayout(
  width: number,
  stableHeight: number,
  chapters: ChapterRect[],
  compact: boolean,
) {
  const gutter = width < 600 ? 28 : width < 1024 ? 48 : 64;
  const label = stableHeight < 500 ? 78 : compact ? 100 : 140;
  const scale = Math.min(
    (width - gutter * 2 - 32) / (compact ? 4 : 6.4),
    (Math.min(...chapters.map((c) => c.height)) - label - 64) / 4.8,
  );
  const centers = chapters.map((c) => c.top + (c.height - label) / 2 + 12);
  const world = (chapter: number, point: Point): Point => ({
    x: width / 2 + point.x * scale,
    y: centers[chapter] - point.y * scale,
  });
  const segments: RouteSegment[] = [];
  chapters.forEach((c, chapter) => {
    const start = c.top - stableHeight + 0.18 * (stableHeight + c.height);
    const end = c.top - stableHeight + 0.7 * (stableHeight + c.height);
    if (chapter > 0) {
      const previous = segments[segments.length - 1];
      const direction = chapterDirection(chapterActions[chapter - 1]);
      const x = direction === 1 ? width - gutter / 2 : gutter / 2;
      const from = world(chapter - 1, {
        x: chapterSpan(compact) * direction,
        y: HANDOFF_BOTTOM,
      });
      const to = world(chapter, {
        x: -chapterSpan(compact) * chapterDirection(chapterActions[chapter]),
        y: HANDOFF_TOP,
      });
      const bend = Math.min(28, (to.y - from.y) / 5);
      segments.push({
        kind: "connector",
        chapter: chapter - 1,
        start: previous.end,
        end: start,
        points: [from, { x, y: from.y + bend }, { x, y: to.y - bend }, to],
      });
    }
    segments.push({ kind: "mechanism", chapter, start, end });
  });
  return { scale, gutter, centers, segments, world };
}
export function sampleRoute(
  layout: ReturnType<typeof routeLayout>,
  scroll: number,
  compact: boolean,
) {
  const segment =
    layout.segments.find((s) => scroll <= s.end) ??
    layout.segments[layout.segments.length - 1];
  const progress = clamp(
    (scroll - segment.start) / (segment.end - segment.start),
  );
  if (segment.kind === "mechanism") {
    const ball = sampleChapterBall(
      chapterActions[segment.chapter],
      progress,
      compact,
    );
    return {
      segment,
      progress,
      point: layout.world(segment.chapter, ball),
      rotation: ball.rotation,
    };
  }
  return { segment, progress, point: segment.points[0], rotation: 0 };
}
