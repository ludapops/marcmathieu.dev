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

export function getIntroViewport({
  width,
  height,
  identityRight,
  identityBottom,
  controlsTop,
}: {
  width: number;
  height: number;
  identityRight: number;
  identityBottom: number;
  controlsTop: number;
}) {
  const sideBySide = width >= 800 && width / height > 1.3;
  const left = sideBySide ? Math.max(identityRight + 32, width * 0.32) : 16;
  const top = sideBySide ? Math.max(80, height * 0.12) : identityBottom + 24;
  const right = width - (sideBySide ? 32 : 16);
  const bottom = sideBySide ? height - 32 : controlsTop - 24;
  return {
    left,
    top,
    width: Math.max(120, right - left),
    height: Math.max(120, bottom - top),
  };
}
