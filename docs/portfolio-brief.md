# Portfolio brief

## Outcome

Build a public portfolio for Marc Mathieu that earns interviews for senior frontend roles at design-conscious and scaled product companies. A recruiter should understand Marc's positioning in seconds; an engineering or design leader should be able to inspect the work, decisions, and implementation quality in depth.

## Positioning

"Senior frontend engineer. Complex products, carefully made."

Marc combines design judgment with production engineering. Commerce and subscriptions supply strong proof, not a permanent niche. The site welcomes remote United States roles, Miami hybrid roles, and New York hybrid roles with relocation or regular travel.

## Page narrative

1. Identity, positioning, availability, and primary actions
2. World Overview for three Anchor Case Studies
3. AG1 Chapter
4. Battlefield Chapter
5. BeautyNexos Chapter
6. Career Timeline
7. Concise professional biography
8. Contact Path

The first release contains no empty project slots, logo wall, blog, CMS, contact form, booking tool, theme toggle, or analytics.

## Evidence model

Each chapter states context and dates, role and team boundary, product problem, owned interfaces and decisions, outcome, current public evidence, and a live link. Current captures receive a date caption and a note when the live product has evolved since Marc's work.

### AG1

- Period: 2023–2025 through Code Particle
- Primary story: built the UI and APIs for AG1's subscription service, translating product and cadence choices into Shopify selling plans
- Ownership: delivered the subscription UI and APIs, Shop AG1, the full cart experience, and the supporting Shopify integration
- Product problem: Shopify supplied subscription primitives, but AG1 still needed a complete product that carried product and cadence choices through the cart and into selling plans
- Supporting work: helped lead frontend decoupling and shared interface decisions, then shipped product-change flows, Monta pickup points, and localized experiences across six international markets
- Public evidence: current AG1 Pro purchase options and cart journey, captured in 2026
- Caveat: current pixels and implementation may have changed since Marc's work

### Battlefield Portal Builder for Battlefield 2042

- Period: mid-2020 through December 2021, about eighteen months
- Client relationship: Electronic Arts through Code Particle
- Stack: Vue, Observables, and CSS Modules
- Ownership: weapon selector, equipment selector, custom Experience configuration, and design-system contributions
- Product problem: translate a dense game-configuration model into a browser interface players could understand
- Public evidence: official EA weapon and equipment selector screenshots
- Caveat: do not claim game development or work on the Rules Editor

### BeautyNexos

- Period: 2025–2026
- Stack: Flutter, Strapi, TypeScript, and Stripe
- Ownership: Trade Calendar, payments, product and gallery add-ons, homepage, and member-dashboard areas
- Product problems: consistent cross-platform data, payment and subscription states, responsive Flutter delivery, event filters and dates, member entitlements, media validation, and publishing state
- Public evidence: Trade Calendar, Product Library, and public company product and gallery pages
- Caveat: private management screens and member data stay out of the site

## Visual system

- Three Worlds: near-black opening, large Geist typography, distinct project compositions
- AG1 uses deep greens and a product-journey spread beside current purchase-flow evidence
- Battlefield uses orange accents and paired official weapon/equipment screenshots; images stack on phones
- BeautyNexos uses lilac editorial layouts around its public Trends page and Trade Calendar
- Project panels expand on hover and keyboard focus; touch uses direct tap targets
- World transitions preserve orientation and return focus to the selected panel
- Reading zones stay still; notes expand on demand using native disclosures
- Career and biography lead into the Next World contact finale with three responsive colored frames
- No intro gate, WebGL machine, custom cursor, forced scrolling, or standalone equipment demos

## Technical shape

- Next.js App Router, React, and TypeScript
- Server-rendered narrative and evidence, with client code limited to navigation motion, active-world tracking, motion preference, and address copying
- CSS tokens in globals.css and CSS Modules; browser animation API for brief project transitions
- Typed local project content and presentation mappings
- Native document scrolling and anchors, with keyboard focus and browser history support
- The main experience lives at `/`; `/worlds` redirects there and keeps fragment links
- Normal Vercel Next.js deployment; no forced static export

## Accessibility and performance

- WCAG 2.2 AA target
- Semantic headings, descriptive image captions, keyboard navigation, visible focus, and contrast checks
- Complete readable content and native disclosures without JavaScript
- Reduced motion uses direct navigation and static compositions
- Visible Pause Motion control with a persistent browser preference
- No continuous rendering loop or WebGL dependency
- Optimized responsive images; Geist is the only loaded font family
- Core Web Vitals in their good ranges and Lighthouse mobile performance target of 90 or better

## Repository and release

- Intended public repository: `ludapops/marcmathieu.dev`
- Small vertical branches with preview deployments and review evidence
- Root `AGENTS.md` is the durable operating contract
- GitHub Actions checks lint, types, unit tests, production build, Playwright, accessibility, links, and performance budgets
- No source license in version one
- Intended domain: `marcmathieu.dev`; register separately and recheck availability at checkout
- Use Vercel Hobby during development; verify eligibility or use Pro before public launch

### Battlefield preview art source

The project preview uses EA’s June 2021 Battlefield 2042 key art from [the official announcement](https://news.ea.com/press-releases/press-releases-details/2021/Battlefield-2042-Marks-the-Return-of-All-Out-Warfare-in-New-Unmatched-Epic-Scale-Experience/). It provides product context; the chapter retains weapon and equipment selector evidence for Marc’s contribution.
