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
      expect(project.images.length).toBeGreaterThan(0);
      expect(project.links.length).toBeGreaterThan(0);
      expect(project.contributions.length).toBeGreaterThanOrEqual(3);
      project.links.forEach((link) =>
        expect(() => new URL(link.href)).not.toThrow(),
      );
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
