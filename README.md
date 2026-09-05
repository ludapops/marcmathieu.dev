# marcmathieu.dev

Marc Mathieu’s senior frontend portfolio: three project worlds with server-rendered evidence, responsive art direction, native disclosures, and brief browser-native transitions. The homepage is `/`; old `/worlds` review links redirect to it.

## Development

```bash
pnpm install
pnpm dev
```

## Verify changes

Install browser dependencies once with `pnpm exec playwright install chromium webkit`.

```bash
pnpm check
pnpm test:e2e
pnpm test:visual
pnpm lhci
```

Visual baselines cover the opening, AG1, Battlefield, BeautyNexos, and contact on desktop and phone. Review intentional changes before updating them with `pnpm test:visual --update-snapshots`.

Project language lives in `CONTEXT.md`. Evidence boundaries and release requirements live in `docs/portfolio-brief.md`. Architecture decisions live in `docs/adr/`. Approved project facts live in `src/content/portfolio.ts`; chapter presentation and contribution notes live in `src/content/worlds.ts`.

The repository has no reuse license. Client names, marks, and public screenshots remain the property of their respective owners.

The Lighthouse gate uses mobile DevTools throttling (network throttling and 4× CPU slowdown applied during the load), with the existing 2.5-second LCP and 90 performance limits. This measures paint timing during the slowed browser run rather than estimating it from a fast localhost trace. Scores are not directly comparable with the previous simulated-throttling runs; see [Lighthouse’s throttling methods](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md). CI preserves the HTML/JSON reports as the `lighthouse-reports` artifact, including on failure.
