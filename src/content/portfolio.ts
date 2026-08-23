import { z } from "zod";

const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().min(1),
});

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
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
  problem: z.string().min(1),
  ownership: z.string().min(1),
  contributions: z.array(z.string().min(1)).min(3),
  outcome: z.string().min(1),
  technologies: z.array(z.string().min(1)).min(3),
  links: z.array(linkSchema).min(1),
  images: z.array(imageSchema).min(1),
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
      "Separating a custom subscription experience without losing the details that made it work.",
    summary:
      "I led the frontend decoupling of AG1's subscription experience, shared ownership of design and interface updates, and fully implemented the Shop AG1 and cart flows.",
    problem:
      "AG1 needed a Shopify-integrated shopping journey with product, cadence, market, and cart behavior that went beyond a stock storefront. The work began before Shopify's first-party Subscriptions app reached full release, although Shopify subscription APIs already existed.",
    ownership:
      "My responsibility covered frontend technical direction and hands-on delivery. I helped split legacy behavior into independently deployable experiences while preserving the subscription rules customers depended on.",
    contributions: [
      "Built the complete Shop AG1 and cart interactions for subscription and one-time purchase paths.",
      "Led frontend decoupling and shared design-system and interface decisions with product and design partners.",
      "Shipped product-change flows, Monta pickup-point support, and localized experiences across Australia, Hong Kong, Singapore, South Korea, Taiwan, and the UAE.",
      "Integrated experiment identity and rollout data with Statsig, RudderStack, and LaunchDarkly.",
    ],
    outcome:
      "The decoupled frontend gave teams more focused release control while the subscription experience expanded into six markets. Elements of the live journey still reflect the product area I owned, but AG1 has continued to evolve it since 2025.",
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
    images: [
      {
        src: "/images/ag1/storefront-2026.png",
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
    headline:
      "Turning a dense game configuration model into a browser interface players could reason about.",
    summary:
      "For about eighteen months, I helped build the frontend of Battlefield 2042's web-based Portal Builder, including the weapon selector, equipment selector, and custom Experience configuration.",
    problem:
      "The Builder exposed a large configuration space without asking players to think like tool developers. Each choice had to remain understandable while other selections changed what was valid or available.",
    ownership:
      "Electronic Arts was a Code Particle client. I implemented core creation surfaces and contributed to the design system used to keep a large configuration interface consistent.",
    contributions: [
      "Implemented the weapon selector and the states needed to include, exclude, and review available content.",
      "Built the equipment selector and its supporting interaction patterns.",
      "Developed custom Experience configuration outside the separate visual scripting surface EA calls the Rules Editor.",
      "Contributed reusable interface patterns to the Portal Builder design system.",
    ],
    outcome:
      "The work shipped as part of Battlefield 2042's Portal Builder. The original Builder remains available behind EA sign-in, and EA's public launch material still documents the selectors I worked on.",
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
    images: [
      {
        src: "/images/battlefield/weapons-selector.jpg",
        alt: "Official Battlefield Portal Builder interface for choosing available weapons",
        caption:
          "Weapon selection in the public EA Portal briefing. Official Electronic Arts image, published 2021.",
      },
      {
        src: "/images/battlefield/equipment-selector.jpg",
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
    period: "2025–present",
    role: "Senior engineer through Code Particle",
    kicker: "Cross-platform product · Flutter and TypeScript",
    headline: "Bringing events, media, and payments into one member product.",
    summary:
      "I owned product initiatives across the Flutter client and Strapi platform, including Trade Calendar, Stripe payments, product and gallery add-ons, homepage work, and member-dashboard areas.",
    problem:
      "The product joined CMS-managed content, member entitlements, media publishing, and billing state across platforms. Calendar dates, filters, responsive layouts, and payment changes all had to agree instead of becoming separate versions of the truth.",
    ownership:
      "I led Trade Calendar, Stripe payment work, and product and gallery add-ons. The role crossed interface delivery, platform integration, testing, and the stability work needed to ship complete product slices.",
    contributions: [
      "Built Trade Calendar browsing across event dates, locations, categories, event types, regions, countries, and topics.",
      "Connected product and gallery add-ons to media validation, publishing state, member limits, and ordering.",
      "Implemented Stripe payment and subscription-state work across client and platform boundaries.",
      "Delivered responsive Flutter experiences for the homepage and member management areas.",
    ],
    outcome:
      "The work gave members clearer ways to discover events and manage the products and media attached to their presence on the platform. The engagement is scheduled to conclude on September 1, 2026; this page will switch to a fixed end date after that point.",
    technologies: ["Flutter", "Strapi", "TypeScript", "Stripe", "Testing"],
    links: [
      {
        label: "Explore the public Trade Calendar",
        href: "https://www.beautynexos.com/trade-calendar",
      },
      {
        label: "Visit BeautyNexos",
        href: "https://www.beautynexos.com/",
      },
    ],
    images: [
      {
        src: "/images/beautynexos/trade-calendar-2026.png",
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
      "Led frontend delivery for consumer and enterprise products across commerce, subscriptions, creator tools, security, and financial interfaces.",
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
      "Translated design concepts into responsive products, built Node.js services, and led four junior developers.",
    technologies: ["JavaScript", "Node.js", "NoSQL", "Angular"],
  },
  {
    period: "2014–2015",
    role: "Software Engineer",
    company: "Spatially",
    summary:
      "Built the frontend and interface work behind aboutPLACE and other company web experiences while serving as Scrum Master.",
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
