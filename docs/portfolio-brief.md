# Portfolio brief

## Outcome

Build a public portfolio for Marc Mathieu that earns interviews for senior frontend roles at design-conscious and scaled product companies. A recruiter should understand Marc's positioning in seconds; an engineering or design leader should be able to inspect the work, decisions, and implementation quality in depth.

## Positioning

"Senior frontend engineer. Complex products, carefully made."

Marc combines design judgment with production engineering. Commerce and subscriptions supply strong proof, not a permanent niche. The site welcomes remote United States roles, Miami hybrid roles, and New York hybrid roles with relocation or regular travel.

## Page narrative

1. Identity, positioning, availability, and primary actions
2. Spatial Index for three Anchor Case Studies
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

- Light editorial foundation in warm off-white and ink
- Zilla Slab display typography with Geist body typography
- Rigid Spatial Index influenced by the compositional clarity of Jlern without copying its layout or language
- Cursor-proximity Focus Interaction on pointer devices; scroll-position and tap behavior on touch devices
- Project Accents: AG1 green, Battlefield orange-red, BeautyNexos violet-rose
- One persistent tabletop Rube Goldberg machine with wood bases, brass mechanisms, steel rails, and restrained project accents
- Precise quick motion for focus and navigation; slower cinematic motion between chapters
- Stable Reading Zones without continuous movement

## Machine narrative

The intro lasts eight seconds after winding. A spring launches a marble into a trigger lever and domino cascade. The last domino releases a spring-loaded catapult. Its brass ball arcs onto the Enter key, compresses the keycap, bounces once, and settles before revealing the portfolio. A brief green light marks the impact. Skip remains available while the machine runs.

The transitions are levels of one descending machine carrying one green marble. AG1 travels left to right through a tipping cup; a right-edge chute feeds Battlefield right to left through a counterweight gate; a left-edge chute feeds BeautyNexos left to right through a weighted balance. The last right-edge chute continues past Experience and About into the finale. Brass supports and continuous steel rails replace individual tabletops.

The finale receives the marble from the right. Its tipping lever releases a counterweight and cord that open two overhead hopper doors. A three-second timed confetti shower settles on a lower platform. It triggers once per page visit; Replay finale resets only this final mechanism and shower. The clock suspends while the section is offscreen, the document is hidden, or motion is paused. Scrolling backward retraces the marble without automatically repeating the celebration. Playback is silent and confined to the finale.

Reading sections reserve edge gutters of 28px on phones, 48px on tablets, and 64px on desktop. Chapter mechanisms and connectors use one document-coordinate route and an orthographic camera. Scrolling translates the view without changing scale. Content expansion, font loading, resizing, and orientation changes update the route measurements. The intro retains its dedicated perspective camera, identity clearance, and phone camera movement.

Reduced motion and unavailable WebGL retain the accessible static entrance and show a static completed finale. The shared Three.js renderer draws visible route sections only and stops when idle. Confetti uses bounded instancing: 72 pieces on phones, 112 on tablets, and 160 on desktop.

## Technical shape

- Current stable Next.js App Router, React, and TypeScript
- Direct Three.js scene mounted once behind server-rendered HTML
- GSAP and ScrollTrigger for scene states and restrained DOM transitions
- CSS custom-property tokens and CSS Modules
- Typed local portfolio content
- Native browser scrolling and anchor navigation
- Normal Vercel Next.js deployment; no forced static export

## Accessibility and performance

- WCAG 2.2 AA target
- Semantic HTML, keyboard navigation, visible focus, and contrast checks
- Static fallback instead of WebGL for reduced-motion users
- Visible Pause Motion control
- One renderer, fewer than 100 draw calls, DPR capped at 1.5
- Three.js loads after readable HTML and stops rendering while idle or hidden
- Core Web Vitals in their good ranges and Lighthouse mobile performance target of 90 or better

## Repository and release

- Intended public repository: `ludapops/marcmathieu.dev`
- Small vertical branches with preview deployments and review evidence
- Root `AGENTS.md` is the durable operating contract
- GitHub Actions checks lint, types, unit tests, production build, Playwright, accessibility, links, and performance budgets
- No source license in version one
- Intended domain: `marcmathieu.dev`; register separately and recheck availability at checkout
- Use Vercel Hobby during development; verify eligibility or use Pro before public launch
