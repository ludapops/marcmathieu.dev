export type SceneViewport = "phone" | "tablet" | "desktop";

export type SceneViewportPreset = Readonly<{
  cameraPadding: number;
  chapterPadding: number;
  pixelRatio: number;
  shadowMapSize: number;
}>;

export const sceneViewportPresets = {
  phone: {
    cameraPadding: 1.18,
    chapterPadding: 1.12,
    pixelRatio: 1,
    shadowMapSize: 512,
  },
  tablet: {
    cameraPadding: 1.12,
    chapterPadding: 1.08,
    pixelRatio: 1.25,
    shadowMapSize: 768,
  },
  desktop: {
    cameraPadding: 1.06,
    chapterPadding: 1.04,
    pixelRatio: 1.5,
    shadowMapSize: 1024,
  },
} satisfies Record<SceneViewport, SceneViewportPreset>;

export function getSceneViewport(
  width: number,
  height: number,
  coarsePointer = false,
): SceneViewport {
  const shortSide = Math.min(width, height);
  if (shortSide < 600) return "phone";
  if (width < 1024 || (coarsePointer && shortSide < 900)) return "tablet";
  return "desktop";
}

export function fitPerspectiveDistance({
  width,
  height,
  depth = 0,
  aspect,
  verticalFov,
  padding = 1,
}: {
  width: number;
  height: number;
  depth?: number;
  aspect: number;
  verticalFov: number;
  padding?: number;
}) {
  const verticalFovRadians = (verticalFov * Math.PI) / 180;
  const horizontalFovRadians =
    2 * Math.atan(Math.tan(verticalFovRadians / 2) * aspect);
  const horizontalDistance =
    (width * padding * 0.5) / Math.tan(horizontalFovRadians / 2);
  const verticalDistance =
    (height * padding * 0.5) / Math.tan(verticalFovRadians / 2);

  return Math.max(horizontalDistance, verticalDistance) + depth * 0.5;
}
