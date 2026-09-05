import type { Project } from "./portfolio";

type WorldPresentation = {
  category: string;
  invitation: string;
  heading: [string, string];
  theme: "green" | "orange" | "lilac";
  chapterLabel: string;
  decisions: { title: string; detail: string }[];
};

export const worldPresentation = {
  ag1: {
    category: "COMMERCE / SUBSCRIPTIONS",
    invitation: "Making a daily ritual feel effortless.",
    heading: ["A daily ritual.", "Carefully connected."],
    theme: "green",
    chapterLabel: "AG1 · SUBSCRIPTION COMMERCE",
    decisions: [
      {
        title: "Carry the choice all the way through",
        detail:
          "Product and cadence selection had to become a consistent subscription choice through Shop AG1, the cart, and Shopify selling plans. I built the UI and APIs connecting those parts of the journey.",
      },
      {
        title: "Treat the cart as part of the product",
        detail:
          "I implemented the full cart experience for subscription and one-time purchases, as well as product-change flows. The responsibility extended beyond the purchase page into how people reviewed and changed their choices.",
      },
      {
        title: "Make room for different markets",
        detail:
          "I helped lead frontend decoupling and shared interface decisions, then shipped localized experiences across six international markets, including Monta pickup-point support.",
      },
    ],
  },
  battlefield: {
    category: "PLAY / CONFIGURATION",
    invitation: "Complex choices. Your rules of play.",
    heading: ["Complexity.", "Under control."],
    theme: "orange",
    chapterLabel: "BATTLEFIELD 2042 · PORTAL BUILDER",
    decisions: [
      {
        title: "Make dense choices readable",
        detail:
          "I built the weapon and equipment selectors, including states for including, excluding, and reviewing available content. The work translated a large set of game options into browser interfaces players could understand.",
      },
      {
        title: "Keep configuration coherent",
        detail:
          "My scope also included custom Experience configuration. I contributed reusable interface patterns to the design system connecting these tools.",
      },
      {
        title: "Understand the team boundary",
        detail:
          "This was frontend work for Electronic Arts through Code Particle from mid-2020 through December 2021. It did not include game development or ownership of the Rules Editor.",
      },
    ],
  },
  beautynexos: {
    category: "DISCOVERY / CONNECTION",
    invitation: "A platform for an industry in motion.",
    heading: ["An industry.", "In good company."],
    theme: "lilac",
    chapterLabel: "BEAUTYNEXOS · CROSS-PLATFORM PRODUCT",
    decisions: [
      {
        title: "Help people find the relevant event",
        detail:
          "I built Trade Calendar browsing and filtering across dates, locations, categories, regions, and topics. The work included consistent event data and dates across the platform.",
      },
      {
        title: "Connect payments to the member experience",
        detail:
          "I implemented Stripe payment flows across Flutter and Strapi, working through payment and subscription states and member entitlements alongside the interface.",
      },
      {
        title: "Carry the experience across platforms",
        detail:
          "I delivered responsive homepage and member-dashboard experiences in Flutter, alongside product and gallery tools. The work included media validation and publishing state; private management screens are not included here.",
      },
    ],
  },
} satisfies Record<Project["id"], WorldPresentation>;
