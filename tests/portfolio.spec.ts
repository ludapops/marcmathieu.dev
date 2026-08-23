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
  await expect(
    page.getByRole("heading", { name: "Marc Mathieu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hold to enter" }),
  ).toBeFocused();
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
  const enter = page.locator("[data-intro-controls] button").first();
  const box = await enter.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(320);
  await page.mouse.up();
  await page.waitForTimeout(320);
  await expect(enter).toHaveText(/Hold to enter/);
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
  await expect(enter).toHaveText(/Hold to enter/);
});

test("charges the sculpture and enters on pointer release", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL progress check");
  const enter = page.getByRole("button", { name: "Hold to enter" });
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveCount(1);
  const before = await canvas.screenshot();
  const box = await enter.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(960);
  await expect(
    page.getByRole("button", { name: "Release to enter" }),
  ).toBeVisible();
  const charged = await canvas.screenshot();
  expect(before.equals(charged)).toBe(false);
  await page.mouse.up();
  await expect(splash(page)).toBeHidden({ timeout: 3_000 });
  await expect(page.locator("[data-experience-content]")).not.toHaveJSProperty(
    "inert",
    true,
  );
});

test("supports a continuous touch hold", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Touch-path coverage");
  const enter = page.locator("[data-intro-controls] button").first();
  await enter.dispatchEvent("pointerdown", {
    pointerId: 23,
    pointerType: "touch",
    button: 0,
  });
  await page.waitForTimeout(960);
  await expect(
    page.getByRole("button", { name: "Release to enter" }),
  ).toBeVisible();
  await enter.dispatchEvent("pointerup", {
    pointerId: 23,
    pointerType: "touch",
    button: 0,
  });
  await expect(splash(page)).toBeHidden({ timeout: 3_000 });
});

test("supports keyboard holds, Escape, and session bypass", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Hold to enter" }),
  ).toBeFocused();
  await page.keyboard.down("Enter");
  await page.waitForTimeout(960);
  await expect(
    page.getByRole("button", { name: "Release to enter" }),
  ).toBeVisible();
  await page.keyboard.up("Enter");
  await expect(splash(page)).toBeHidden({ timeout: 3_000 });
  await expect(page.locator("#main-content")).toBeFocused();

  await page.reload();
  await expect(splash(page)).toBeHidden();

  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(splash(page)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hold to enter" }),
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

test("animates only while a project transition is visible", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "WebGL motion check");

  await dismissIntro(page);

  await page
    .getByRole("region", { name: "AG1", exact: true })
    .scrollIntoViewIfNeeded();
  await page.waitForTimeout(1_800);

  const canvas = page.locator("canvas");
  const movingFrameA = await canvas.screenshot();
  await page.waitForTimeout(450);
  const movingFrameB = await canvas.screenshot();
  expect(movingFrameA.equals(movingFrameB)).toBe(false);

  await page.getByRole("button", { name: "Pause motion" }).click();
  await page.waitForTimeout(150);
  const pausedFrameA = await canvas.screenshot();
  await page.waitForTimeout(450);
  const pausedFrameB = await canvas.screenshot();
  expect(pausedFrameA.equals(pausedFrameB)).toBe(true);
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
  await page.addStyleTag({ content: "[data-scene-shell] canvas{opacity:0}" });
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
  await page.addStyleTag({ content: "[data-scene-shell] canvas{opacity:0}" });
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot("splash-mobile.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.001,
  });
});
