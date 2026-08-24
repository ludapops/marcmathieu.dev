import { describe, expect, it } from "vitest";
import { shouldShowIntro } from "./intro-events";

describe("intro visibility", () => {
  it("always shows the intro during development", () => {
    expect(
      shouldShowIntro({
        alwaysShow: true,
        documentState: "seen",
        hasSeen: true,
      }),
    ).toBe(true);
  });

  it("keeps the once-per-session rule in production", () => {
    expect(
      shouldShowIntro({
        alwaysShow: false,
        documentState: "seen",
        hasSeen: true,
      }),
    ).toBe(false);
    expect(
      shouldShowIntro({
        alwaysShow: false,
        documentState: "locked",
        hasSeen: false,
      }),
    ).toBe(true);
  });
});
