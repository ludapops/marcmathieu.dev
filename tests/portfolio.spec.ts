import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const splash = (page: Page) => page.locator("[data-intro-splash]");

async function prepareScene(page: Page) {
  if ((await splash(page).getAttribute("data-machine-ready")) !== "true") {
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.dataset.introState),
      )
      .toBe("locked");
    await expect
      .poll(
        async () => {
          await page.evaluate(() =>
            window.dispatchEvent(new CustomEvent("portfolio:scene-prepare")),
          );
          return splash(page).getAttribute("data-machine-ready");
        },
        { timeout: 10_000 },
      )
      .toBe("true");
  }
  await expect(
    page.locator('[data-intro-splash][data-machine-ready="true"]'),
  ).toBeVisible({ timeout: 10_000 });
}

async function dismissIntro(page: Page) {
  await prepareScene(page);
  const enterPortfolio = page.getByRole("button", { name: "Enter portfolio" });
  if (await enterPortfolio.isVisible()) await enterPortfolio.click();
  else await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(splash(page)).toBeHidden({ timeout: 7_000 });
}

async function setTransitionProgress(
  page: Page,
  name: "AG1" | "Battlefield" | "BeautyNexos" | "Finish",
  progress: number,
) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
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
      window.scrollTo({
        top:
          section.top -
          section.viewportHeight +
          targetProgress * (section.height + section.viewportHeight),
        behavior: "instant",
      }),
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
  const touchViewport =
    testInfo.project.name.startsWith("mobile") ||
    testInfo.project.name === "tablet";
  if (touchViewport) {
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Preparing machine" }),
    ).toBeFocused();
  }
  await prepareScene(page);
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
  await prepareScene(page);
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
  await prepareScene(page);
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
  await prepareScene(page);
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
  expect(
    Number(await canvas.getAttribute("data-machine-draw-calls")),
  ).toBeLessThan(100);
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
  await expect(canvas).toHaveAttribute(
    "data-machine-stage",
    /marble|dominoes|launch|key|complete/,
  );
  await expect(canvas).toHaveAttribute("data-machine-stage", "complete", {
    timeout: 9_000,
  });
  await expect(page.locator("[data-intro-handoff]")).toBeVisible();
  await expect(splash(page)).toBeHidden({ timeout: 11_000 });
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
    .toEqual(["marble", "dominoes", "launch", "key", "complete"]);
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
  await prepareScene(page);
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
  await expect(splash(page)).toBeHidden({ timeout: 11_000 });
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
  await expect(splash(page)).toBeVisible();
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
  await prepareScene(page);
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

  await expect(splash(page)).toHaveCount(0, { timeout: 11_000 });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __responsiveMachineFrames?: string[] })
            .__responsiveMachineFrames,
      ),
    )
    .toEqual(["marble", "dominoes", "launch", "key", "complete"]);
});

test("switches responsive scene presets without treating landscape phones as tablets", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phone viewport coverage");
  await prepareScene(page);
  const canvas = page.locator("[data-machine-canvas]");
  await expect(canvas).toHaveAttribute("data-machine-viewport", "phone");
  await expect(canvas).toHaveAttribute("data-machine-frame", "opening");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(canvas).toHaveAttribute("data-machine-viewport", "phone");
});

test("uses the tablet scene preset", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Tablet viewport coverage");
  await prepareScene(page);
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

test("keeps compact navigation actions visible without horizontal overflow", async ({
  page,
}, testInfo) => {
  await dismissIntro(page);

  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(
    navigation.getByRole("link", { name: "Résumé", exact: true }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: /Pause motion|Resume motion/ }),
  ).toBeVisible();

  if (testInfo.project.name === "mobile") {
    await page.setViewportSize({ width: 844, height: 390 });
  }

  const layout = await page.evaluate(() => ({
    navigationOverflow:
      (document.querySelector("nav")?.scrollWidth ?? 1) -
      (document.querySelector("nav")?.clientWidth ?? 0),
    pageOverflow:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(layout.navigationOverflow).toBe(0);
  expect(layout.pageOverflow).toBe(0);
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
    await expect
      .poll(async () => {
        await page.evaluate(() => window.scrollTo(0, 360));
        return page.evaluate(() => window.scrollY);
      })
      .toBeGreaterThan(0);
    return;
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
  await prepareScene(page);
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeFocused();
  await page.keyboard.down("Enter");
  await page.waitForTimeout(960);
  await expect(
    page.getByRole("button", { name: "Machine running" }),
  ).toBeVisible();
  await page.keyboard.up("Enter");
  await expect(splash(page)).toBeHidden({ timeout: 11_000 });
  await expect(page.locator("#main-content")).toBeFocused();

  await page.reload();
  await expect(splash(page)).toBeVisible();
  await prepareScene(page);
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

test("replays the intro from the footer and returns to the top", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL replay check");
  await dismissIntro(page);

  const canvas = page.locator("[data-machine-canvas]");
  await expect(canvas).toHaveAttribute("data-machine-mode", "idle");
  await page.evaluate(() => {
    window.sessionStorage.setItem("marc-portfolio-machine-intro-v3", "seen");
    window.location.hash = "contact";
  });
  await expect(page.locator("#contact")).toBeInViewport();

  await page.getByRole("button", { name: "Replay intro" }).click();

  await expect(
    page.getByRole("dialog", { name: "Portfolio introduction" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hold to wind" }),
  ).toBeFocused();
  await expect(
    page.getByRole("progressbar", { name: "Machine winding progress" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(canvas).toHaveAttribute("data-machine-mode", "intro");
  await expect(canvas).toHaveAttribute("data-machine-frame", "opening");
  await expect(canvas).not.toHaveAttribute("data-machine-stage");
  await expect(page.locator("[data-scene-shell]")).toHaveCSS(
    "visibility",
    "visible",
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.sessionStorage.getItem("marc-portfolio-machine-intro-v3"),
      ),
    )
    .toBe("seen");

  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(splash(page)).toBeHidden();
  await expect(page.locator("#top")).toBeInViewport();
  await expect(page.locator("#main-content")).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("preserves a requested hash after dismissal", async ({ page }) => {
  await page.goto("/#contact");
  await page.reload();
  await dismissIntro(page);
  await expect(page.locator("#contact")).toBeInViewport({ timeout: 20_000 });
  await expect
    .poll(() => page.evaluate(() => window.location.hash))
    .toBe("#contact");
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

  const resume = await page.request.get("/Marc-Mathieu-Resume.pdf");
  expect(resume.ok()).toBe(true);
  expect(resume.headers()["content-type"]).toContain("application/pdf");
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

  await page
    .getByRole("button", { name: "Replay intro" })
    .scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Replay intro" }).click();
  await expect(
    page.getByRole("button", { name: "Enter portfolio" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Enter portfolio" }).click();
  await expect(splash(page)).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
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
  await expect
    .poll(async () => {
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("portfolio:scene-prepare")),
      );
      return page.getByRole("button", { name: "Enter portfolio" }).isVisible();
    })
    .toBe(true);
  await page.getByRole("button", { name: "Enter portfolio" }).click();
  await expect(splash(page)).toBeHidden();
});

test("falls back to a static entrance when the machine cannot initialize", async ({
  page,
}) => {
  await prepareScene(page);
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
  await dismissIntro(page);
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

test("runs and reverses all four tabletop mechanisms", async ({ page }) => {
  await dismissIntro(page);
  const canvas = page.locator("[data-machine-canvas]");
  for (const [name, action] of [
    ["AG1", "tipping-cup"],
    ["Battlefield", "counterweight-gate"],
    ["BeautyNexos", "balance-transfer"],
    ["Finish", "confetti"],
  ] as const) {
    await setTransitionProgress(page, name, 0.3);
    await expect(canvas).toHaveAttribute("data-machine-action", action);
    const before = [
      await canvas.getAttribute("data-machine-ball-x"),
      await canvas.getAttribute("data-machine-ball-y"),
    ];
    await setTransitionProgress(page, name, 0.7);
    const after = [
      await canvas.getAttribute("data-machine-ball-x"),
      await canvas.getAttribute("data-machine-ball-y"),
    ];
    expect(after).not.toEqual(before);
    expect(
      Number(await canvas.getAttribute("data-machine-draw-calls")),
    ).toBeLessThan(100);
    await setTransitionProgress(page, name, 0.3);
    const restored = [
      await canvas.getAttribute("data-machine-ball-x"),
      await canvas.getAttribute("data-machine-ball-y"),
    ];
    expect(Number(restored[0])).toBeCloseTo(Number(before[0]), 1);
    expect(Number(restored[1])).toBeCloseTo(Number(before[1]), 1);
  }
});

test("keeps connecting chutes outside the reading content", async ({
  page,
}) => {
  await dismissIntro(page);
  const reading = page.locator("article#ag1");
  await reading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const bounds = await reading.boundingBox();
  const gutter = await page.evaluate(() =>
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--machine-gutter",
      ),
    ),
  );
  expect(bounds!.x).toBeGreaterThanOrEqual(gutter);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width - gutter,
  );
  await expect(page.locator("[data-machine-canvas]")).toHaveAttribute(
    "data-machine-marbles",
    "1",
  );
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
  await prepareScene(page);
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
  { name: "Finish", progress: 0.65, snapshot: "machine-finale.png" },
] as const) {
  test(`@visual ${chapter.name} machine chapter`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop chapter baseline");
    await dismissIntro(page);
    await setTransitionProgress(page, chapter.name, chapter.progress);
    if (chapter.name === "Finish")
      await expect(page.locator("[data-machine-canvas]")).toHaveAttribute(
        "data-finale-state",
        "settled",
        { timeout: 6000 },
      );
    else await page.waitForTimeout(1200);
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
  { name: "Finish", progress: 0.65, snapshot: "machine-finale-mobile.png" },
] as const) {
  test(`@visual mobile ${chapter.name} machine chapter`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile chapter baseline");
    await dismissIntro(page);
    await setTransitionProgress(page, chapter.name, chapter.progress);
    if (chapter.name === "Finish")
      await expect(page.locator("[data-machine-canvas]")).toHaveAttribute(
        "data-finale-state",
        "settled",
        { timeout: 6000 },
      );
    else await page.waitForTimeout(1200);
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
  await prepareScene(page);
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

test("@visual tablet balance chapter", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Tablet chapter baseline");
  await dismissIntro(page);
  await setTransitionProgress(page, "BeautyNexos", 0.58);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Pause motion" }).click();
  await page.waitForTimeout(150);
  await expect(page).toHaveScreenshot("machine-finish-tablet.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});

test("can skip a running intro without a second completion", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Intro lifecycle check");
  await prepareScene(page);
  const control = page.getByRole("button", { name: "Hold to wind" });
  await control.focus();
  await page.keyboard.down("Space");
  await expect(
    page.getByRole("button", { name: "Machine running" }),
  ).toBeVisible();
  await page.keyboard.up("Space");
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(splash(page)).toBeHidden();
  await page.waitForTimeout(7100);
  await expect(page.locator("[data-machine-canvas]")).toHaveAttribute(
    "data-machine-mode",
    "idle",
  );
  await expect(page.locator("[data-experience-content]")).not.toHaveJSProperty(
    "inert",
    true,
  );
});

test("a hidden tab suspends the intro and its watchdog", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Visibility lifecycle check");
  test.setTimeout(40000);
  await prepareScene(page);
  await page.getByRole("button", { name: "Hold to wind" }).focus();
  await page.keyboard.down("Space");
  await expect(
    page.getByRole("button", { name: "Machine running" }),
  ).toBeVisible();
  await page.keyboard.up("Space");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const canvas = page.locator("[data-machine-canvas]");
  const progress = await canvas.getAttribute("data-machine-progress");
  await page.waitForTimeout(12000);
  await expect(splash(page)).toBeVisible();
  await expect(canvas).toHaveAttribute("data-machine-progress", progress!);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(splash(page)).toBeHidden({ timeout: 11000 });
});

test("@visual landscape phone machine keeps its label clear", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chromium",
    "Landscape phone review",
  );
  await dismissIntro(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await setTransitionProgress(page, "Battlefield", 0.5);
  await expect(page).toHaveScreenshot("machine-landscape-phone.png", {
    animations: "disabled",
    mask: [page.locator("nextjs-portal")],
  });
});

test("@visual landscape tablet finale", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "Landscape tablet review");
  await dismissIntro(page);
  await page.setViewportSize({ width: 1194, height: 834 });
  await setTransitionProgress(page, "Finish", 0.65);
  await expect(page.locator("[data-machine-canvas]")).toHaveAttribute(
    "data-finale-state",
    "settled",
    { timeout: 6000 },
  );
  await expect(page).toHaveScreenshot("machine-finale-landscape-tablet.png", {
    animations: "disabled",
    mask: [page.locator("nextjs-portal")],
  });
});

test("reserves space for the intro identity", async ({ page }, testInfo) => {
  await prepareScene(page);
  if (testInfo.project.name === "chromium")
    await page.setViewportSize({ width: 1728, height: 925 });
  await page.waitForTimeout(400);
  const layout = await page.evaluate(() => {
    const identity = document
      .querySelector("[data-intro-identity]")
      ?.getBoundingClientRect();
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-machine-canvas]",
    );
    const controls = document
      .querySelector("[data-machine-control]")
      ?.getBoundingClientRect();
    if (!identity || !canvas || !controls)
      throw new Error("Missing intro layout");
    return {
      identityRight: identity.right,
      identityBottom: identity.bottom,
      controlsTop: controls.top,
      left: Number(canvas.dataset.machineViewportLeft),
      top: Number(canvas.dataset.machineViewportTop),
      height: Number(canvas.dataset.machineViewportHeight),
      sideBySide: innerWidth >= 800 && innerWidth / innerHeight > 1.3,
    };
  });
  if (layout.sideBySide)
    expect(layout.left).toBeGreaterThan(layout.identityRight + 16);
  else {
    expect(layout.top).toBeGreaterThan(layout.identityBottom + 16);
    expect(layout.top + layout.height).toBeLessThan(layout.controlsTop - 16);
  }
});

test("keeps a fixed chapter scale and matching handoffs through scroll", async ({
  page,
}) => {
  await dismissIntro(page);
  const canvas = page.locator("[data-machine-canvas]");
  const names = ["AG1", "Battlefield", "BeautyNexos", "Finish"] as const;
  let expectedScale: number | undefined;
  for (const name of names) {
    for (const progress of [0.2, 0.5, 0.8, 0.5]) {
      await setTransitionProgress(page, name, progress);
      const scale = Number(
        await canvas.getAttribute("data-machine-pixels-per-unit"),
      );
      expectedScale ??= scale;
      expect(scale).toBeCloseTo(expectedScale, 5);
    }
  }
});

test("runs, pauses, and replays the timed confetti finale", async ({
  page,
}) => {
  await dismissIntro(page);
  const canvas = page.locator("[data-machine-canvas]");
  await setTransitionProgress(page, "Finish", 0.56);
  await expect(canvas).toHaveAttribute("data-finale-state", "playing");
  await page.waitForTimeout(850);
  await page.getByRole("button", { name: "Pause motion" }).click();
  const frozen = await canvas.getAttribute("data-finale-time");
  await page.waitForTimeout(350);
  expect(await canvas.getAttribute("data-finale-time")).toBe(frozen);
  await page.getByRole("button", { name: "Resume motion" }).click();
  await expect(canvas).toHaveAttribute("data-finale-state", "settled", {
    timeout: 6000,
  });
  await page
    .getByRole("button", { name: "Replay finale", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-finale-state", "playing");
  await expect(canvas).toHaveAttribute("data-finale-state", "settled", {
    timeout: 6000,
  });
  await setTransitionProgress(page, "Finish", 0.2);
  await setTransitionProgress(page, "Finish", 0.56);
  await expect(canvas).toHaveAttribute("data-finale-state", "settled");
});

test("suspends confetti while its section is offscreen", async ({ page }) => {
  await dismissIntro(page);
  await setTransitionProgress(page, "Finish", 0.56);
  const canvas = page.locator("[data-machine-canvas]");
  await expect(canvas).toHaveAttribute("data-finale-state", "playing");
  await page.waitForTimeout(700);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(100);
  const frozen = await canvas.getAttribute("data-finale-time");
  await page.waitForTimeout(500);
  expect(await canvas.getAttribute("data-finale-time")).toBe(frozen);
  await setTransitionProgress(page, "Finish", 0.56);
  await expect(canvas).toHaveAttribute("data-finale-state", "settled", {
    timeout: 6000,
  });
});

test("shows the static finale after losing WebGL", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Runtime WebGL loss");
  await dismissIntro(page);
  await setTransitionProgress(page, "Finish", 0.56);
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-machine-canvas]",
    );
    const context = canvas?.getContext("webgl2");
    const extension = context?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("WebGL loss extension unavailable");
    extension.loseContext();
  });
  await expect(
    page.getByRole("img", {
      name: "An open confetti hopper above a completed machine",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay finale", exact: true }),
  ).toBeHidden();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-connected-machine",
    "ready",
  );
});
