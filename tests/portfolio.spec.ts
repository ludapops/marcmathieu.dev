import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("presents the positioning and all three case studies", async ({
  page,
}) => {
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
  const results = await new AxeBuilder({ page }).exclude("canvas").analyze();
  expect(results.violations).toEqual([]);
});

test("uses the static scene for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Pause motion" }),
  ).toBeVisible();
});

test("persists the visitor's motion choice", async ({ page }) => {
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
