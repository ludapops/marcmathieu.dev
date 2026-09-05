import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ids = ["ag1", "battlefield", "beautynexos"];

test("complete portfolio exposes all three worlds, evidence, career, and contact", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Marc Mathieu", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator("canvas,[data-intro-splash],[data-transition-overlay]"),
  ).toHaveCount(0);
  for (const id of ids) {
    const section = page.locator(`article#${id}`);
    await expect(section).toBeVisible();
    await expect(section.locator("details")).toHaveCount(3);
    await section.scrollIntoViewIfNeeded();
    for (const img of await section.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          img.evaluate(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    await expect(
      section.getByText("WHAT SHIPPED", { exact: true }),
    ).toBeVisible();
  }
  await expect(page.locator("#battlefield-evidence img")).toHaveCount(2);
  await expect(
    page.locator("#experience").getByRole("heading", { name: "Code Particle" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Email Marc" })).toHaveAttribute(
    "href",
    "mailto:avianmathieu@gmail.com",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

for (const id of ids) {
  test(`${id} entrance, disclosure, return focus, and browser history`, async ({
    page,
  }) => {
    await page.goto("/");
    const panel = page.locator(`[data-world-link="${id}"]`);
    await panel.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    await panel.click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator("[data-transition-overlay]")).toHaveCount(0);
    const section = page.locator(`article#${id}`);
    await expect(section).toBeFocused();
    await expect(section.getByRole("heading", { level: 2 })).toBeInViewport();
    const note = section.locator("details").first();
    await note.locator("summary").click();
    await expect(note).toHaveAttribute("open", "");
    await section
      .getByRole("link", { name: "↖ All projects", exact: true })
      .click();
    await expect(page.locator("[data-transition-overlay]")).toHaveCount(0);
    await expect(panel).toBeFocused();
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - before),
    ).toBeLessThan(5);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(section).toBeFocused();
    await page.goForward();
    await expect(page).toHaveURL(/#overview$/);
  });
}

test("world switcher tracks reading position and all destinations resolve", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Project navigation" });
  for (const id of [...ids, "next"]) {
    await nav.locator(`a[href="#${id}"]`).click();
    await expect(nav.locator(`a[href="#${id}"]`)).toHaveAttribute(
      "aria-current",
      "location",
    );
  }
  const broken = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links.flatMap((link) => {
      const hash = link.getAttribute("href")?.slice(1);
      return hash && !document.getElementById(hash) ? [hash] : [];
    }),
  );
  expect(broken).toEqual([]);
});

test("keyboard, reduced motion, and persistent motion preference", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  if (testInfo.project.name === "chromium") await page.keyboard.press("Tab");
  else await page.getByRole("link", { name: "Skip to content" }).focus();
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.locator('[data-world-link="battlefield"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#battlefield")).toBeFocused();
  await expect(page.locator("[data-transition-overlay]")).toHaveCount(0);
  await page.getByRole("button", { name: "Pause motion" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume motion" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("all chapter themes pass automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/");
  for (const id of ids)
    await page
      .locator(`#${id} details`)
      .first()
      .evaluate((element) => {
        element.setAttribute("open", "");
      });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("portfolio and disclosures remain usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Marc Mathieu", exact: true }),
  ).toBeVisible();
  for (const id of ids) {
    await page.locator(`[data-world-link="${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const note = page.locator(`#${id} details`).first();
    await note.locator("summary").click();
    await expect(note.locator("p")).toBeVisible();
  }
  await context.close();
});

test("prototype URL redirects with project fragment and production metadata", async ({
  page,
}) => {
  await page.goto("/worlds#battlefield");
  await expect(page).toHaveURL(/\/#battlefield$/);
  await expect(page.locator("#battlefield h2")).toBeInViewport();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://marcmathieu.dev",
  );
  await expect(
    page.locator('meta[name="robots"][content*="noindex"]'),
  ).toHaveCount(0);
  await expect(page).toHaveTitle("Marc Mathieu | Senior Frontend Engineer");
});

test("@visual approved desktop and mobile compositions", async ({
  page,
}, testInfo) => {
  test.skip(!["chromium", "mobile"].includes(testInfo.project.name));
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "chromium")
    await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#overview")).toHaveScreenshot("opening.png", {
    animations: "disabled",
  });
  for (const id of ids) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id}`)).toHaveScreenshot(`${id}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.005,
    });
  }
  await expect(page.locator("#next")).toHaveScreenshot("contact.png", {
    animations: "disabled",
  });
});
