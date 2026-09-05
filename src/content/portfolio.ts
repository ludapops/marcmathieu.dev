import { z } from "zod";

const imageSchema = z.object({
  src: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1),
  caption: z.string().min(1),
});

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

const highlightSchema = z.object({
  label: z.enum(["Focus", "Ownership", "Stack"]),
  value: z.string().min(1),
});

const projectSchema = z.object({
  id: z.enum(["ag1", "battlefield", "beautynexos"]),
  index: z.string().regex(/^0[1-3]$/),
  name: z.string().min(1),
  shortName: z.string().min(1),
  period: z.string().min(1),
  role: z.string().min(1),
  kicker: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  coverImage: imageSchema,
  highlights: z.array(highlightSchema).length(3),
  problem: z.string().min(1),
  ownership: z.string().min(1),
  contributions: z.array(z.string().min(1)).min(3),
  outcome: z.string().min(1),
  technologies: z.array(z.string().min(1)).min(3),
  links: z.array(linkSchema).min(1),
  evidenceImages: z.array(imageSchema).optional(),
  mapSteps: z.array(z.string().min(1)).min(3),
});

export const projects = z.array(projectSchema).parse([
  {
    id: "ag1",
    index: "01",
    name: "AG1 subscription commerce",
    shortName: "AG1",
    period: "2023–2025",
    role: "Frontend lead through Code Particle",
    kicker: "Subscription commerce · Six international markets",
    headline:
      "Building AG1's subscription service across UI, APIs, and Shopify.",
    summary:
      "I built the UI and APIs for AG1's subscription service, using Shopify selling plans to power Shop AG1 and the cart. I also helped lead frontend decoupling.",
    coverImage: {
      src: "/images/ag1/homepage-hero-clean-2026.jpg",
      width: 2240,
      height: 1263,
      alt: "AG1 homepage hero introducing AG1 Pro beside a green travel pack and shaker",
      caption:
        "Public AG1 homepage, captured August 2026. The live site has continued to change since my 2023–2025 work.",
    },
    highlights: [
      { label: "Focus", value: "Global subscription commerce" },
      {
        label: "Ownership",
        value: "Subscription UI and APIs, Shop AG1, and cart",
      },
      { label: "Stack", value: "React, Next.js, Shopify" },
    ],
    problem:
      "Shopify provided subscription primitives, but not the complete product AG1 needed. The service had to handle product and cadence selection, carry those choices through the cart, and translate them into Shopify selling plans.",
    ownership:
      "I worked across product, design, and engineering to deliver the subscription UI and APIs, Shop AG1, the cart, and the supporting Shopify integration.",
    contributions: [
      "Built the subscription UI and APIs connecting product and cadence choices to Shopify selling plans.",
      "Implemented Shop AG1 and the full cart experience for subscription and one-time purchases.",
      "Helped lead frontend decoupling and worked with design on shared interface decisions.",
      "Shipped product-change flows, Monta pickup-point support, and localized experiences across six international markets.",
    ],
    outcome:
      "The work powered AG1's subscription shopping journey and supported six international markets.",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Shopify",
      "Statsig",
      "RudderStack",
      "LaunchDarkly",
    ],
    links: [
      {
        label: "Visit the current AG1 Pro flow",
        href: "https://drinkag1.com/products/ag1-pro-travel-packs",
      },
    ],
    evidenceImages: [
      {
        src: "/images/ag1/storefront-2026.png",
        width: 1713,
        height: 954,
        alt: "Current AG1 Pro product page with monthly and three-month delivery options",
        caption:
          "Public AG1 Pro purchase flow, captured August 2026. The live storefront has changed since my 2023–2025 work.",
      },
    ],
    mapSteps: [
      "Choose product",
      "Choose cadence",
      "Resolve market rules",
      "Review subscription cart",
    ],
  },
  {
    id: "battlefield",
    index: "02",
    name: "Battlefield Portal Builder",
    shortName: "Battlefield",
    period: "2020–2021",
    role: "Frontend engineer through Code Particle",
    kicker: "Experience creation · Eighteen-month engagement",
    headline: "Making custom Battlefield experiences easier to configure.",
    summary:
      "I helped build Battlefield 2042's web-based Portal Builder, turning dense game configuration into tools players could use.",
    coverImage: {
      src: "/images/battlefield/key-art-2021.jpg",
      width: 4000,
      height: 2250,
      alt: "Official Battlefield 2042 key art with a soldier against teal and orange battlefield imagery",
      caption:
        "Official Electronic Arts Battlefield 2042 key art, published June 2021. My work focused on the web-based Portal Builder.",
    },
    highlights: [
      { label: "Focus", value: "Battlefield Portal Builder" },
      {
        label: "Ownership",
        value: "Weapons, equipment, and Experience configuration",
      },
      { label: "Stack", value: "Vue, Observables, CSS Modules" },
    ],
    problem:
      "The Builder had to make a dense set of game options understandable while showing players how each choice affected the others.",
    ownership:
      "I owned key Portal Builder configuration tools and contributed to its design system.",
    contributions: [
      "Built the weapon and equipment selectors, including the states used to include, exclude, and review available content.",
      "Implemented the custom Experience configuration interface.",
      "Contributed reusable UI patterns to the Portal Builder design system.",
    ],
    outcome:
      "The configuration tools shipped with Battlefield 2042's Portal Builder and remain documented in EA's public launch material.",
    technologies: ["Vue", "Observables", "CSS Modules", "Design systems"],
    links: [
      {
        label: "Open the Battlefield 2042 Builder",
        href: "https://portal.battlefield.com/bf2042/en-us",
      },
      {
        label: "Read EA's Portal briefing",
        href: "https://www.ea.com/en-gb/games/battlefield/battlefield-2042/news/battlefield-briefing-welcome-to-battlefield-portal",
      },
    ],
    evidenceImages: [
      {
        src: "/images/battlefield/weapons-selector.jpg",
        width: 975,
        height: 548,
        alt: "Official Battlefield Portal Builder interface for choosing available weapons",
        caption:
          "Weapon selection in the public EA Portal briefing. Official Electronic Arts image, published 2021.",
      },
      {
        src: "/images/battlefield/equipment-selector.jpg",
        width: 975,
        height: 548,
        alt: "Official Battlefield Portal Builder interface for choosing available equipment",
        caption:
          "Equipment selection in the public EA Portal briefing. Official Electronic Arts image, published 2021.",
      },
    ],
    mapSteps: [
      "Define mode",
      "Select weapons",
      "Select equipment",
      "Review Experience",
    ],
  },
  {
    id: "beautynexos",
    index: "03",
    name: "BeautyNexos platform",
    shortName: "BeautyNexos",
    period: "2025–2026",
    role: "Senior engineer through Code Particle",
    kicker: "Cross-platform product · Flutter and TypeScript",
    headline: "Building a member product across Flutter, Strapi, and Stripe.",
    summary:
      "I led cross-platform work on Trade Calendar, payments, and member tools across BeautyNexos's Flutter app and Strapi platform.",
    coverImage: {
      src: "/images/beautynexos/trends-2026-09-04.png",
      width: 3456,
      height: 1776,
      alt: "BeautyNexos Trends page featuring lip care and sensory beauty stories",
      caption:
        "Public BeautyNexos Trends page, captured September 4, 2026. My work also includes member and platform areas beyond this public view.",
    },
    highlights: [
      { label: "Focus", value: "Cross-platform member platform" },
      {
        label: "Ownership",
        value: "Calendar, payments, products, and galleries",
      },
      { label: "Stack", value: "Flutter, Strapi, Stripe" },
    ],
    problem:
      "BeautyNexos needed one member experience across events, content, and payments.",
    ownership:
      "I led Trade Calendar, payments, and member tools from interface through cross-platform integration.",
    contributions: [
      "Built Trade Calendar browsing and filtering across dates, locations, categories, regions, and topics.",
      "Built product and gallery tools and implemented Stripe payment flows across Flutter and Strapi.",
      "Delivered responsive homepage and member-dashboard experiences in Flutter.",
    ],
    outcome:
      "Members gained clearer ways to discover events and manage their content and payments.",
    technologies: ["Flutter", "Strapi", "TypeScript", "Stripe", "Testing"],
    links: [
      {
        label: "Visit BeautyNexos",
        href: "https://www.beautynexos.com/",
      },
    ],
    evidenceImages: [
      {
        src: "/images/beautynexos/trade-calendar-2026.png",
        width: 1728,
        height: 906,
        alt: "BeautyNexos Trade Calendar with event filters and a featured event",
        caption:
          "Public BeautyNexos Trade Calendar, captured August 2026. Private member-management screens are intentionally excluded.",
      },
    ],
    mapSteps: [
      "Ingest event data",
      "Normalize dates",
      "Apply filters",
      "Present across platforms",
    ],
  },
]);

export type Project = z.infer<typeof projectSchema>;

export const career = [
  {
    period: "2018–2026",
    role: "Senior Software Engineer",
    company: "Code Particle",
    summary:
      "Led frontend delivery for client products across commerce, subscriptions, game tools, security, and financial software.",
    technologies: [
      "React",
      "Next.js",
      "TypeScript",
      "Vue",
      "Flutter",
      "Node.js",
    ],
  },
  {
    period: "2015–2018",
    role: "Lead Software Engineer",
    company: "SonicLoop Networks",
    summary:
      "Built responsive products and Node.js services while leading four junior developers.",
    technologies: ["JavaScript", "Node.js", "NoSQL", "Angular"],
  },
  {
    period: "2014–2015",
    role: "Software Engineer",
    company: "Spatially",
    summary:
      "Built frontend experiences for aboutPLACE and other products while serving as Scrum Master.",
    technologies: ["JavaScript", "Responsive UI", "Product delivery"],
  },
] as const;

export const contactLinks = [
  { label: "Email", href: "mailto:avianmathieu@gmail.com" },
  { label: "GitHub", href: "https://github.com/ludapops" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/marc-mathieu-5982a0a0/",
  },
  { label: "Résumé", href: "/Marc-Mathieu-Resume.pdf" },
] as const;
