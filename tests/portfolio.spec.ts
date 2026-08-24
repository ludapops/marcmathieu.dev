import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const splash = (page: Page) => page.locator("[data-intro-splash]");

async function dismissIntro(page: Page) {
  const enterPortfolio = page.getByRole("button", { name: "Enter portfolio" });
  if (await enterPortfolio.isVisible()) await enterPortfolio.click();
  else await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(splash(page)).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("locks the portfolio behind an accessible first-session entry", async ({
  page,
}) => {
  await expect(
    page.getByRole("dialog", { name: "Portfolio introduction" }),
  ).toBeVisible();
  await expect(page.getByText("Portfolio / 2026")).toBeVisible();
  await expect(page.getByText("Marc Mathieu", { exact: true })).toBeVisible();
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
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");

  const results = await new AxeBuilder({ page }).exclude("canvas").analyze();
  expect(results.violations).toEqual([]);
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
  test.skip(testInfo.project.name !== "mobile", "Touch-path coverage");
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

test("preserves a requested hash after dismissal", async ({ page }) => {
  await page.goto("/#contact");
  await dismissIntro(page);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("presents the positioning and all three case studies", async ({
  page,
}) => {
  await dismissIntro(page);
  await expect(
    page.getByRole("heading", { name: /Complex products/i, level: 1 }),
  ).toBeVisible();

  for (const heading of [
    /Separating a custom subscription experience/i,
    /Turning a dense game configuration model/i,
    /Bringing events, media, and payments/i,
  ]) {
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

test("@visual desktop narrative", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "chromium", "Desktop baseline only");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await dismissIntro(page);
  for (const image of await page.locator("img").all()) {
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

test("@visual project machine transition", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Machine chapter baseline");
  await dismissIntro(page);
  const transition = page.getByRole("region", { name: "AG1", exact: true });
  const bounds = await transition.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  await page.evaluate((top) => window.scrollTo(0, top), bounds.top);
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Pause motion" }).click();
  await page.waitForTimeout(150);
  await expect(page).toHaveScreenshot("machine-transition.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});
