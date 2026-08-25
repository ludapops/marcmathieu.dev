import { describe, expect, it } from "vitest";
import { fitPerspectiveDistance, getSceneViewport } from "./scene-viewport";

describe("scene viewport", () => {
  it("keeps phones and rotated phones on the phone preset", () => {
    expect(getSceneViewport(390, 844)).toBe("phone");
    expect(getSceneViewport(844, 390)).toBe("phone");
  });

  it("uses the tablet preset in either tablet orientation", () => {
    expect(getSceneViewport(768, 1024)).toBe("tablet");
    expect(getSceneViewport(1024, 768, true)).toBe("tablet");
  });

  it("uses the desktop preset for a wide desktop viewport", () => {
    expect(getSceneViewport(1440, 900)).toBe("desktop");
    expect(getSceneViewport(1280, 720)).toBe("desktop");
  });

  it("moves the camera farther back for a narrow aspect ratio", () => {
    const portrait = fitPerspectiveDistance({
      width: 7,
      height: 2,
      aspect: 390 / 844,
      verticalFov: 36,
    });
    const landscape = fitPerspectiveDistance({
      width: 7,
      height: 2,
      aspect: 1440 / 900,
      verticalFov: 36,
    });

    expect(portrait).toBeGreaterThan(landscape);
  });
});
