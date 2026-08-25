import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const splash = (page: Page) => page.locator("[data-intro-splash]");

async function dismissIntro(page: Page) {
  await expect(
    page.locator('[data-intro-splash][data-machine-ready="true"]'),
  ).toBeVisible({ timeout: 10_000 });
  const enterPortfolio = page.getByRole("button", { name: "Enter portfolio" });
  if (await enterPortfolio.isVisible()) await enterPortfolio.click();
  else await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(splash(page)).toBeHidden({ timeout: 7_000 });
}

async function setTransitionProgress(
  page: Page,
  name: "AG1" | "Battlefield" | "BeautyNexos",
  progress: number,
) {
  const transition = page.getByRole("region", { name, exact: true });
  const bounds = await transition.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: rect.height,
      viewportHeight: window.innerHeight,
    };
  });
  await page.evaluate(
    ({ bounds: section, progress: targetProgress }) =>
      window.scrollTo(
        0,
        section.top -
          section.viewportHeight +
          targetProgress * (section.height + section.viewportHeight),
      ),
    { bounds, progress },
  );
  await page.waitForTimeout(250);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("locks the portfolio behind an accessible first-session entry", async ({
  page,
}, testInfo) => {
  await expect(
    page.getByRole("dialog", { name: "Portfolio introduction" }),
  ).toBeVisible();
  await expect(page.getByText("Portfolio / 2026")).toBeVisible();
  await expect(page.getByText("Marc Mathieu", { exact: true })).toBeVisible();
  const machineLabel = page.locator('[data-machine-copy][aria-hidden="true"]');
  await expect(machineLabel).toBeVisible();
  await expect(machineLabel).toHaveText(/Wind\s*Cascade\s*Enter/);
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeFocused();
  await expect(
    page.getByRole("progressbar", { name: "Machine winding progress" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect
    .poll(() =>
      page
        .locator("[data-experience-content]")
        .evaluate((node) => (node as HTMLElement).inert),
    )
    .toBe(true);
  const touchViewport =
    testInfo.project.name.startsWith("mobile") ||
    testInfo.project.name === "tablet";
  if (touchViewport) {
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.introScrollLocked),
      )
      .toBeUndefined();
  } else {
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.introScrollLocked),
      )
      .toBe("true");
  }

  const results = await new AxeBuilder({ page }).exclude("canvas").analyze();
  expect(results.violations).toEqual([]);
});

test("suppresses the native context menu on the winding control", async ({
  page,
}) => {
  const enter = page.getByRole("button", { name: "Hold to wind" });
  await expect(enter).toBeVisible();

  const contextMenuPrevented = await enter.evaluate((button) => {
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
    });
    button.dispatchEvent(event);
    return event.defaultPrevented;
  });

  expect(contextMenuPrevented).toBe(true);
  await expect(
    page.getByRole("progressbar", { name: "Machine winding progress" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(splash(page)).toBeVisible();
});

test("resets incomplete and cancelled pointer holds", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeVisible();
  const enter = page.locator("[data-machine-control] button").first();
  const box = await enter.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(320);
  await page.mouse.up();
  await page.waitForTimeout(320);
  await expect(enter).toHaveText(/Hold to wind/);
  await expect(splash(page)).toBeVisible();

  await enter.dispatchEvent("pointerdown", {
    pointerId: 17,
    pointerType: "touch",
    button: 0,
  });
  await page.waitForTimeout(180);
  await enter.dispatchEvent("pointercancel", {
    pointerId: 17,
    pointerType: "touch",
  });
  await page.waitForTimeout(320);
  await expect(enter).toHaveText(/Hold to wind/);
});

test("auto-launches the machine at full wind and enters after the key impact", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL progress check");
  await page.evaluate(() => {
    const stages: string[] = [];
    (window as Window & { __machineStages?: string[] }).__machineStages =
      stages;
    window.addEventListener("portfolio:machine-stage", (event) => {
      stages.push((event as CustomEvent<{ stage: string }>).detail.stage);
    });
  });
  const enter = page.getByRole("button", { name: "Hold to wind" });
  const canvas = page.locator("canvas");
  await expect(page.locator('[data-motion="hero"]').first()).toHaveCSS(
    "clip-path",
    "inset(0px 0px 100%)",
  );
  await expect(canvas).toHaveCount(1);
  const before = await canvas.screenshot();
  const box = await enter.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(960);
  await expect(
    page.getByRole("button", { name: "Machine running" }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Machine winding progress" }),
  ).toHaveAttribute("aria-valuenow", "100");
  const charged = await canvas.screenshot();
  expect(before.equals(charged)).toBe(false);
  await expect(canvas).toHaveAttribute(
    "data-machine-stage",
    /marble|dominoes|seesaw|key|complete/,
  );
  await expect(canvas).toHaveAttribute("data-machine-stage", "complete", {
    timeout: 4_500,
  });
  await expect(page.locator("[data-intro-handoff]")).toBeVisible();
  await expect(splash(page)).toBeHidden({ timeout: 6_500 });
  await expect(page.locator('[data-motion="hero"]').first()).toHaveCSS(
    "clip-path",
    "none",
    { timeout: 2_500 },
  );
  await expect(page.locator("[data-scene-shell]")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await expect(page.locator("[data-experience-content]")).toHaveCSS(
    "transform",
    "none",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __machineStages?: string[] }).__machineStages,
      ),
    )
    .toEqual(["marble", "dominoes", "seesaw", "key", "complete"]);
  await page.mouse.up();
  await expect(page.locator("[data-experience-content]")).not.toHaveJSProperty(
    "inert",
    true,
  );
});

test("supports a continuous touch hold", async ({ page }, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith("mobile") &&
      testInfo.project.name !== "tablet",
    "Touch-path coverage",
  );
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeVisible();
  const enter = page.locator("[data-machine-control] button").first();
  await enter.dispatchEvent("pointerdown", {
    pointerId: 23,
    pointerType: "touch",
    button: 0,
  });
  await page.waitForTimeout(960);
  await expect(
    page.getByRole("button", { name: "Machine running" }),
  ).toBeVisible();
  await expect(splash(page)).toBeHidden({ timeout: 6_500 });
});

test("uses an upward touch gesture to enter and restores page scrolling", async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith("mobile") &&
      testInfo.project.name !== "tablet",
    "Touch-entry coverage",
  );
  await expect(page.getByText(/Swipe up to enter/i)).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  const intro = splash(page);
  await intro.dispatchEvent("touchstart", {
    touches: [{ identifier: 0, clientX: 190, clientY: 520 }],
  });
  await intro.dispatchEvent("touchmove", {
    touches: [{ identifier: 0, clientX: 250, clientY: 500 }],
  });
  await expect(intro).toBeVisible();
  await intro.dispatchEvent("touchstart", {
    touches: [{ identifier: 1, clientX: 194, clientY: 520 }],
  });
  await page.evaluate(() => window.scrollTo(0, 90));

  await expect(intro).toHaveCount(0);
  await expect(page.locator("[data-intro-backdrop]")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.introScrollLocked),
    )
    .toBeUndefined();
  await expect
    .poll(() =>
      page
        .locator("[data-experience-content]")
        .evaluate((node) => (node as HTMLElement).inert),
    )
    .toBe(false);

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(90);
});

test("accepts a browser-level touch swipe on the mobile splash", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Chromium touch input check",
  );
  await expect(page.getByText(/Swipe up to enter/i)).toBeVisible();
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 420 }],
  });
  for (const y of [390, 360, 330, 300]) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 192, y }],
    });
    await page.waitForTimeout(30);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  await expect(splash(page)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("clears a stale development scroll lock after mobile entry", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Chromium touch input check",
  );
  await expect(
    page.locator('[data-intro-splash][data-machine-ready="true"]'),
  ).toBeVisible();
  await page.evaluate(() => {
    document.body.style.overflow = "hidden";
  });
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(splash(page)).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        inline: document.body.style.overflow,
        locked: document.documentElement.dataset.introScrollLocked,
      })),
    )
    .toEqual({ inline: "", locked: undefined });

  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 620 }],
  });
  for (const y of [580, 530, 480, 430, 380]) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 190, y }],
    });
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("tracks the intro reaction through phone-specific camera frames", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Phone camera progression check",
  );
  const canvas = page.locator("[data-machine-canvas]");
  await expect(canvas).toHaveAttribute("data-machine-frame", "opening");
  await page.evaluate(() => {
    const frames: string[] = [];
    (
      window as Window & { __responsiveMachineFrames?: string[] }
    ).__responsiveMachineFrames = frames;
    window.addEventListener("portfolio:machine-stage", () => {
      window.setTimeout(() => {
        const frame = document.querySelector<HTMLCanvasElement>(
          "[data-machine-canvas]",
        )?.dataset.machineFrame;
        if (frame) frames.push(frame);
      });
    });
  });
  const enter = page.locator("[data-machine-control] button").first();
  await enter.dispatchEvent("pointerdown", {
    pointerId: 43,
    pointerType: "touch",
    button: 0,
  });

  await expect(splash(page)).toHaveCount(0, { timeout: 6_500 });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __responsiveMachineFrames?: string[] })
            .__responsiveMachineFrames,
      ),
    )
    .toEqual(["marble", "dominoes", "seesaw", "key", "complete"]);
});

test("switches responsive scene presets without treating landscape phones as tablets", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phone viewport coverage");
  const canvas = page.locator("[data-machine-canvas]");
  await expect(canvas).toHaveAttribute("data-machine-viewport", "phone");
  await expect(canvas).toHaveAttribute("data-machine-frame", "opening");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(canvas).toHaveAttribute("data-machine-viewport", "phone");
});

test("uses the tablet scene preset", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Tablet viewport coverage");
  await expect(page.locator("[data-machine-canvas]")).toHaveAttribute(
    "data-machine-viewport",
    "tablet",
  );
});

test("uses the compact tablet header and hero layout", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Tablet layout coverage");
  await dismissIntro(page);

  const layout = await page.evaluate(() => {
    const navigation = document.querySelector("nav");
    const hero = document.querySelector("#top");
    return {
      heroHeight: hero?.getBoundingClientRect().height ?? 0,
      viewportHeight: window.innerHeight,
      navigationOverflow: navigation
        ? navigation.scrollWidth - navigation.clientWidth
        : 1,
    };
  });
  expect(layout.navigationOverflow).toBe(0);
  expect(layout.heroHeight).toBeLessThan(layout.viewportHeight);
});

test("keeps touch viewports horizontally clipped and vertically scrollable", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium" &&
      testInfo.project.name !== "tablet",
    "Touch viewport coverage",
  );
  await dismissIntro(page);

  const viewport = await page.evaluate(() => ({
    bodyOverflowY: getComputedStyle(document.body).overflowY,
    clientWidth: document.documentElement.clientWidth,
    htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.innerWidth).toBe(viewport.clientWidth);
  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  expect(viewport.htmlOverflowY).not.toBe("hidden");
  expect(viewport.bodyOverflowY).not.toBe("hidden");

  if (testInfo.project.name === "mobile-chromium") {
    const session = await context.newCDPSession(page);
    const centerX = Math.round(viewport.clientWidth / 2);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: centerX, y: 700 }],
    });
    for (const y of [640, 580, 520, 460, 400, 340]) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: centerX, y }],
      });
    }
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await page.evaluate(() => window.scrollTo(0, 360));
  }

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("supports mouse dragging in narrow development previews", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Chromium mouse coverage");
  await dismissIntro(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.mouse.move(195, 700);
  await page.mouse.down();
  for (const y of [660, 620, 580, 540, 500, 460, 420, 380]) {
    await page.mouse.move(195, y);
  }
  await page.mouse.up();

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("supports Chrome device-mode mouse-to-touch dragging", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Chrome touch emulation coverage",
  );
  await dismissIntro(page);
  await page.evaluate(() => window.scrollTo(0, 0));

  const session = await context.newCDPSession(page);
  await session.send("Input.emulateTouchFromMouseEvent", {
    button: "left",
    type: "mousePressed",
    x: 195,
    y: 700,
  });
  for (const y of [660, 620, 580, 540, 500, 460, 420, 380]) {
    await session.send("Input.emulateTouchFromMouseEvent", {
      button: "left",
      type: "mouseMoved",
      x: 195,
      y,
    });
  }
  await session.send("Input.emulateTouchFromMouseEvent", {
    button: "left",
    type: "mouseReleased",
    x: 195,
    y: 380,
  });

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("supports keyboard holds, Escape, and development reloads", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeFocused();
  await page.keyboard.down("Enter");
  await page.waitForTimeout(960);
  await expect(
    page.getByRole("button", { name: "Machine running" }),
  ).toBeVisible();
  await page.keyboard.up("Enter");
  await expect(splash(page)).toBeHidden({ timeout: 6_500 });
  await expect(page.locator("#main-content")).toBeFocused();

  await page.reload();
  await expect(splash(page)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(splash(page)).toBeHidden();
  await expect(page.locator("#main-content")).toBeFocused();
});

test("keeps the intro machine active when reloading from a restored scroll position", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL reload check");
  await dismissIntro(page);

  const transition = page.getByRole("region", {
    name: "Battlefield",
    exact: true,
  });
  await transition.scrollIntoViewIfNeeded();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-machine-mode",
    "chapter",
  );

  await page.reload();
  await expect(splash(page)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-machine-mode",
    "intro",
  );
  await expect(page.locator("[data-scene-fallback]")).toHaveCSS(
    "visibility",
    "hidden",
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await dismissIntro(page);
  await expect(page.locator("#top")).toBeInViewport();
});

test("preserves a requested hash after dismissal", async ({ page }) => {
  await page.goto("/#contact");
  await dismissIntro(page);
  await expect(page.locator("#contact")).toBeInViewport({ timeout: 20_000 });
});

test("presents the positioning and all three case studies", async ({
  page,
}) => {
  await dismissIntro(page);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Senior frontend engineer leading product work from early decisions through production, with a focus on AI-assisted development and product interfaces.",
  );
  await expect(
    page.getByRole("heading", { name: /Complex products/i, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "I lead frontend work from early product decisions through production, shaping both the experience and the system behind it.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selected frontend work.", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Need help building something?",
      level: 2,
    }),
  ).toBeAttached();

  const beautyHeading = page.getByRole("heading", {
    name: "BeautyNexos",
    level: 2,
  });
  expect(
    await beautyHeading.evaluate(
      (heading) =>
        heading.getBoundingClientRect().right <= window.innerWidth + 1,
    ),
  ).toBe(true);

  for (const heading of [/AG1/i, /Battlefield/i, /BeautyNexos/i]) {
    await expect(
      page.getByRole("heading", { name: heading, level: 2 }),
    ).toBeAttached();
  }

  await expect(
    page.getByRole("link", { name: "Résumé", exact: true }).first(),
  ).toHaveAttribute("href", "/Marc-Mathieu-Resume.pdf");
});

test("all internal anchors resolve to elements", async ({ page }) => {
  await dismissIntro(page);
  const hrefs = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")).filter(Boolean),
    );

  for (const href of hrefs) {
    await expect(page.locator(href as string)).toHaveCount(1);
  }
});

test("has no automated accessibility violations", async ({ page }) => {
  await dismissIntro(page);
  const results = await new AxeBuilder({ page }).exclude("canvas").analyze();
  expect(results.violations).toEqual([]);
});

test("uses the static scene for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Enter portfolio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter portfolio" }).click();
  await expect(splash(page)).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Pause motion" }),
  ).toBeVisible();
});

test("falls back to a static entrance when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const prototype = HTMLCanvasElement.prototype as unknown as {
      getContext: (...args: unknown[]) => unknown;
    };
    const original = prototype.getContext;
    prototype.getContext = function (
      this: HTMLCanvasElement,
      type: unknown,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type, ...args);
    };
  });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enter portfolio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter portfolio" }).click();
  await expect(splash(page)).toBeHidden();
});

test("falls back to a static entrance when the machine cannot initialize", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("portfolio:machine-failed")),
  );
  await expect(
    page.getByRole("button", { name: "Enter portfolio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter portfolio" }).click();
  await expect(splash(page)).toBeHidden();
});

test("exposes the server-rendered portfolio without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await expect(splash(page)).toBeHidden();
  await expect(
    page.getByRole("heading", { name: /Complex products/i, level: 1 }),
  ).toBeVisible();
  await context.close();
});

test("persists the visitor's motion choice", async ({ page }) => {
  await dismissIntro(page);
  await expect(page.locator("canvas")).toHaveCount(1);

  const button = page.getByRole("button", { name: "Pause motion" });
  await button.click();
  await expect(
    page.getByRole("button", { name: "Resume motion" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume motion" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("scrubs connected machine chapters and Pause Motion freezes them", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL motion check");

  await dismissIntro(page);

  const transition = page.getByRole("region", { name: "AG1", exact: true });
  const bounds = await transition.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  await page.evaluate((top) => window.scrollTo(0, top), bounds.top);
  await page.waitForTimeout(250);

  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-machine-chapter", "1");
  const movingFrameA = await canvas.getAttribute("data-machine-progress");
  await page.evaluate(
    ({ top, height }) => window.scrollTo(0, top + height * 0.45),
    bounds,
  );
  await page.waitForTimeout(250);
  const movingFrameB = await canvas.getAttribute("data-machine-progress");
  expect(movingFrameA).not.toBe(movingFrameB);

  await page.getByRole("button", { name: "Pause motion" }).click();
  await page.waitForTimeout(100);
  const pausedFrameA = await canvas.getAttribute("data-machine-progress");
  await page.evaluate(
    ({ top, height }) => window.scrollTo(0, top + height * 0.7),
    bounds,
  );
  await page.waitForTimeout(250);
  const pausedFrameB = await canvas.getAttribute("data-machine-progress");
  expect(pausedFrameA).toBe(pausedFrameB);
});

test("uses the falling marble to launch a second marble into the hoop", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL story check");

  await dismissIntro(page);
  const canvas = page.locator("[data-machine-canvas]");

  await setTransitionProgress(page, "AG1", 0.05);
  await expect(canvas).toHaveAttribute("data-machine-action", "roll-right");
  const rollStartX = Number(await canvas.getAttribute("data-machine-ball-x"));
  await setTransitionProgress(page, "AG1", 0.95);
  const rollEndX = Number(await canvas.getAttribute("data-machine-ball-x"));
  expect(rollEndX).toBeGreaterThan(rollStartX + 5);

  await setTransitionProgress(page, "Battlefield", 0.05);
  await expect(canvas).toHaveAttribute("data-machine-action", "drop-left");
  const dropStartX = Number(await canvas.getAttribute("data-machine-ball-x"));
  await setTransitionProgress(page, "Battlefield", 0.76);
  const dropEndX = Number(await canvas.getAttribute("data-machine-ball-x"));
  const dropEndY = Number(await canvas.getAttribute("data-machine-ball-y"));
  expect(dropStartX).toBeCloseTo(rollEndX, 0);
  expect(dropEndX).toBeLessThan(-1.8);
  expect(dropEndY).toBeLessThan(-2.5);

  await setTransitionProgress(page, "BeautyNexos", 0.05);
  await expect(canvas).toHaveAttribute("data-machine-action", "basket-shot");
  expect(Number(await canvas.getAttribute("data-machine-ball-x"))).toBeCloseTo(
    dropEndX,
    0,
  );
  await expect(canvas).toHaveAttribute(
    "data-machine-shot-ball-visible",
    "true",
  );
  const loadedShotX = Number(
    await canvas.getAttribute("data-machine-shot-ball-x"),
  );
  expect(loadedShotX).toBeGreaterThan(dropEndX + 1);

  await setTransitionProgress(page, "BeautyNexos", 0.42);
  expect(Number(await canvas.getAttribute("data-machine-catapult"))).toBe(1);
  expect(
    Number(await canvas.getAttribute("data-machine-shot")),
  ).toBeGreaterThan(0);
  expect(Number(await canvas.getAttribute("data-machine-score"))).toBe(0);
  expect(Number(await canvas.getAttribute("data-machine-ball-x"))).toBeLessThan(
    -3,
  );
  expect(
    Number(await canvas.getAttribute("data-machine-shot-ball-x")),
  ).toBeGreaterThan(loadedShotX + 2);

  await setTransitionProgress(page, "BeautyNexos", 0.58);
  expect(Number(await canvas.getAttribute("data-machine-score"))).toBe(1);
  expect(Number(await canvas.getAttribute("data-machine-confetti"))).toBe(1);

  await setTransitionProgress(page, "BeautyNexos", 0.15);
  expect(Number(await canvas.getAttribute("data-machine-catapult"))).toBe(0);
  expect(Number(await canvas.getAttribute("data-machine-shot"))).toBe(0);
  expect(Number(await canvas.getAttribute("data-machine-score"))).toBe(0);
  expect(Number(await canvas.getAttribute("data-machine-confetti"))).toBe(0);
  expect(
    Number(await canvas.getAttribute("data-machine-shot-ball-x")),
  ).toBeCloseTo(loadedShotX, 1);
});

test("clips the chapter machine to its dark transition", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL boundary check");

  await dismissIntro(page);

  const transition = page.getByRole("region", { name: "AG1", exact: true });
  const transitionTop = await transition.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  );
  await page.evaluate(
    (top) => window.scrollTo(0, top - window.innerHeight * 0.58),
    transitionTop,
  );
  await page.waitForTimeout(250);

  const boundary = await page.evaluate(() => {
    const transitionElement = document.querySelector<HTMLElement>(
      '[data-machine-chapter="ag1"]',
    );
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-machine-canvas]",
    );
    const shell = document.querySelector<HTMLElement>("[data-scene-shell]");
    if (!transitionElement || !canvas || !shell) return null;

    return {
      transitionTop: transitionElement.getBoundingClientRect().top,
      clipTop: Number(canvas.dataset.machineClipTop),
      clipPath: getComputedStyle(shell).clipPath,
    };
  });

  expect(boundary).not.toBeNull();
  expect(boundary?.transitionTop).toBeGreaterThan(0);
  expect(
    Math.abs((boundary?.clipTop ?? 0) - (boundary?.transitionTop ?? 0)),
  ).toBeLessThan(1);
  expect(boundary?.clipPath).not.toBe("none");
});

test("uses varied content motion without scroll blur", async ({ page }) => {
  await dismissIntro(page);
  const filters = await page
    .locator("[data-motion]")
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).filter),
    );
  expect(filters.every((filter) => filter === "none")).toBe(true);
  await expect(page.locator('[data-motion="heading"]')).not.toHaveCount(0);
  await expect(page.locator('[data-motion="copy"]')).not.toHaveCount(0);
  await expect(page.locator('[data-motion="rows"]')).not.toHaveCount(0);
  await expect(page.locator('[data-motion="media"]')).not.toHaveCount(0);
});

test("keeps project covers concise and opens one case study at a time", async ({
  page,
}) => {
  await dismissIntro(page);

  const disclosures = page.locator("[data-case-study-disclosure]");
  await expect(disclosures).toHaveCount(3);
  await expect(page.locator("[data-case-study-disclosure][open]")).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("img", {
      name: "AG1 homepage hero introducing AG1 Pro beside a green travel pack and shaker",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Battlefield 2042 homepage hero showing a squad moving through an urban battle",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "BeautyNexos homepage with two editorial stories about beauty innovation",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Built the subscription UI and APIs connecting product and cadence choices to Shopify selling plans.",
    ),
  ).toBeHidden();

  const ag1Links = page.getByRole("navigation", {
    name: "AG1 project links",
  });
  const ag1ExternalLink = ag1Links.getByRole("link", {
    name: "Visit the current AG1 Pro flow",
  });
  await expect(ag1Links).toBeVisible();
  await expect(ag1ExternalLink).toBeVisible();
  await expect(ag1ExternalLink).toHaveAttribute("target", "_blank");
  await expect(ag1ExternalLink).toHaveAttribute("rel", "noreferrer");
  await ag1ExternalLink.focus();
  await expect(ag1ExternalLink).toBeFocused();

  const beautyLinks = page.getByRole("navigation", {
    name: "BeautyNexos project links",
  });
  await expect(beautyLinks.getByRole("link")).toHaveCount(1);
  await expect(
    beautyLinks.getByRole("link", { name: "Visit BeautyNexos" }),
  ).toBeVisible();
  await expect(
    beautyLinks.getByRole("link", { name: /Trade Calendar/i }),
  ).toHaveCount(0);

  const ag1 = page.locator('[data-case-study-disclosure="ag1"]');
  const battlefield = page.locator(
    '[data-case-study-disclosure="battlefield"]',
  );
  await ag1.getByText("View full case study").click();
  await expect(ag1).toHaveAttribute("open", "");
  await expect(ag1.getByText("Close case study")).toBeVisible();
  await expect(
    ag1.getByText(
      "Built the subscription UI and APIs connecting product and cadence choices to Shopify selling plans.",
    ),
  ).toBeVisible();
  await expect(ag1.getByText("My role", { exact: true })).toBeVisible();
  await expect(
    ag1.getByRole("heading", { name: "The product in public.", level: 3 }),
  ).toBeVisible();
  await expect(ag1Links).toBeVisible();

  const battlefieldToggle = battlefield.locator("summary");
  await battlefieldToggle.focus();
  await battlefieldToggle.press("Enter");
  await expect(battlefield).toHaveAttribute("open", "");
  await expect(ag1).not.toHaveAttribute("open", "");
  await expect(page.locator("[data-case-study-disclosure][open]")).toHaveCount(
    1,
  );
  expect(await page.locator("details [data-motion]").count()).toBe(0);

  const results = await new AxeBuilder({ page }).exclude("canvas").analyze();
  expect(results.violations).toEqual([]);
});

test("keeps native case-study disclosures usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");

  const ag1 = page.locator('[data-case-study-disclosure="ag1"]');
  await expect(ag1.locator("summary")).toBeVisible();
  await ag1.locator("summary").click();
  await expect(ag1).toHaveAttribute("open", "");
  await expect(
    ag1.getByText(
      "Built the subscription UI and APIs connecting product and cadence choices to Shopify selling plans.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "AG1 project links" }),
  ).toBeVisible();

  await context.close();
});

test("@visual desktop narrative", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "chromium", "Desktop baseline only");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await dismissIntro(page);
  for (const image of await page.locator("img:visible").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0);
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot("portfolio-desktop.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixelRatio: 0.001,
    timeout: 15_000,
  });
});

test("@visual expanded AG1 case study", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "chromium", "Desktop baseline only");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await dismissIntro(page);
  await page.addStyleTag({
    content:
      'a[href="#main-content"], nav[aria-label="Primary navigation"] { visibility: hidden !important; }',
  });
  const ag1 = page.locator("#ag1");
  await ag1.locator("summary").click();
  for (const image of await ag1.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
  }
  await expect(ag1).toHaveScreenshot("case-study-ag1-expanded.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
    timeout: 15_000,
  });
});

test("@visual mobile compact case study", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "mobile", "Mobile baseline only");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await dismissIntro(page);
  await page.addStyleTag({
    content:
      'a[href="#main-content"], nav[aria-label="Primary navigation"] { visibility: hidden !important; }',
  });
  const ag1 = page.locator("#ag1");
  await ag1.scrollIntoViewIfNeeded();
  await expect(ag1).toHaveScreenshot("case-study-ag1-mobile.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
    timeout: 15_000,
  });
});

test("@visual desktop splash", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop splash baseline");
  await expect(page.getByText("Portfolio / 2026")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("splash-desktop.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});

test("@visual mobile splash", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile splash baseline");
  await expect(page.getByText("Portfolio / 2026")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("splash-mobile.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});

for (const chapter of [
  { name: "AG1", progress: 0.5, snapshot: "machine-roll.png" },
  { name: "Battlefield", progress: 0.58, snapshot: "machine-drop.png" },
  { name: "BeautyNexos", progress: 0.58, snapshot: "machine-finish.png" },
] as const) {
  test(`@visual ${chapter.name} machine chapter`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop chapter baseline");
    await dismissIntro(page);
    await setTransitionProgress(page, chapter.name, chapter.progress);
    await page.getByRole("button", { name: "Pause motion" }).click();
    await page.waitForTimeout(150);
    await expect(page).toHaveScreenshot(chapter.snapshot, {
      animations: "disabled",
      maxDiffPixelRatio: 0.001,
    });
  });
}

for (const chapter of [
  { name: "AG1", progress: 0.5, snapshot: "machine-roll-mobile.png" },
  {
    name: "Battlefield",
    progress: 0.58,
    snapshot: "machine-drop-mobile.png",
  },
  {
    name: "BeautyNexos",
    progress: 0.58,
    snapshot: "machine-finish-mobile.png",
  },
] as const) {
  test(`@visual mobile ${chapter.name} machine chapter`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile chapter baseline");
    await dismissIntro(page);
    await setTransitionProgress(page, chapter.name, chapter.progress);
    await page.getByRole("button", { name: "Pause motion" }).click();
    await page.waitForTimeout(150);
    await expect(page).toHaveScreenshot(chapter.snapshot, {
      animations: "disabled",
      maxDiffPixelRatio: 0.001,
    });
  });
}

test("@visual tablet splash", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Tablet splash baseline");
  await expect(page.getByText("Portfolio / 2026")).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-machine-viewport",
    "tablet",
  );
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("splash-tablet.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});

test("@visual tablet hero", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Tablet hero baseline");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await dismissIntro(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page).toHaveScreenshot("portfolio-tablet.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});

test("@visual tablet basket chapter", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Tablet chapter baseline");
  await dismissIntro(page);
  await setTransitionProgress(page, "BeautyNexos", 0.58);
  await page.getByRole("button", { name: "Pause motion" }).click();
  await page.waitForTimeout(150);
  await expect(page).toHaveScreenshot("machine-finish-tablet.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});
