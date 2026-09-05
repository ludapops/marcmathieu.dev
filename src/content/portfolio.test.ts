import { describe, expect, it } from "vitest";
import { contactLinks, projects } from "./portfolio";

describe("portfolio content", () => {
  it("contains three uniquely addressable anchor case studies", () => {
    expect(projects).toHaveLength(3);
    expect(new Set(projects.map((project) => project.id)).size).toBe(3);
    expect(projects.map((project) => project.index)).toEqual([
      "01",
      "02",
      "03",
    ]);
  });

  it("keeps every public claim attached to evidence and a destination", () => {
    projects.forEach((project) => {
      expect(project.coverImage.src).toBeTruthy();
      expect(project.highlights).toHaveLength(3);
      expect(project.links.length).toBeGreaterThan(0);
      expect(project.contributions.length).toBeGreaterThanOrEqual(3);
      project.links.forEach((link) =>
        expect(() => new URL(link.href)).not.toThrow(),
      );
    });
  });

  it("keeps work-specific evidence separate from the public-site covers", () => {
    expect(projects.map((project) => project.coverImage.src)).toEqual([
      "/images/ag1/homepage-hero-clean-2026.jpg",
      "/images/battlefield/key-art-2021.jpg",
      "/images/beautynexos/trends-2026-09-04.png",
    ]);
    expect(
      projects
        .find((project) => project.id === "battlefield")
        ?.evidenceImages?.map((image) => image.src),
    ).toEqual([
      "/images/battlefield/weapons-selector.jpg",
      "/images/battlefield/equipment-selector.jpg",
    ]);
    expect(
      projects.find((project) => project.id === "beautynexos")?.evidenceImages,
    ).toEqual([
      expect.objectContaining({
        src: "/images/beautynexos/trade-calendar-2026.png",
      }),
    ]);
    expect(
      projects.find((project) => project.id === "beautynexos")?.links,
    ).toEqual([
      {
        label: "Visit BeautyNexos",
        href: "https://www.beautynexos.com/",
      },
    ]);
  });

  it("keeps the approved ownership-first project stories", () => {
    const ag1 = projects.find((project) => project.id === "ag1");
    const battlefield = projects.find(
      (project) => project.id === "battlefield",
    );
    const beautynexos = projects.find(
      (project) => project.id === "beautynexos",
    );

    expect(ag1).toMatchObject({
      headline:
        "Building AG1's subscription service across UI, APIs, and Shopify.",
      outcome:
        "The work powered AG1's subscription shopping journey and supported six international markets.",
    });
    expect(
      ag1?.highlights.find((highlight) => highlight.label === "Ownership")
        ?.value,
    ).toBe("Subscription UI and APIs, Shop AG1, and cart");
    expect(battlefield?.headline).toBe(
      "Making custom Battlefield experiences easier to configure.",
    );
    expect(beautynexos).toMatchObject({
      period: "2025–2026",
      headline: "Building a member product across Flutter, Strapi, and Stripe.",
    });
  });

  it("publishes the agreed contact paths", () => {
    expect(contactLinks.map((link) => link.label)).toEqual([
      "Email",
      "GitHub",
      "LinkedIn",
      "Résumé",
    ]);
  });
});
