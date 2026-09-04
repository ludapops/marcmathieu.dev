# Tabletop machine verification

Verified on September 4, 2026, on branch `astra-attempt-1-new-rube-goldberg-machine`, based on `main` at `adaa9da`.

## Checks

- `pnpm check`: lint, type checks, 24 unit tests, and production build passed.
- Playwright: all 95 applicable functional checks passed across desktop Chromium, mobile WebKit, mobile Chromium, and tablet WebKit. The final comparison of 18 visual baselines passed after reviewing the new machine framing. Device-specific tests skip projects to which they do not apply.
- Production browser review: intro playback and all four chapters at 1440 × 1000, 834 × 1194, 1194 × 834, 390 × 844, and 844 × 390, with no console errors.
- Draw calls, including shadow passes: intro 82; tipping cup 43; counterweight gate 55; balance transfer 47; bell 45.
- Lighthouse CI production assertions passed across three mobile runs. Performance scores were 91, 98, and 99; accessibility was 100 in every run. Median LCP was 2.29 seconds and CLS was zero. One run had a 3.53-second LCP; these are local lab measurements.

## Coverage

The checks cover winding by pointer, touch, and keyboard; incomplete holds; skip during playback; replay; hidden-tab suspension beyond the watchdog timeout; reduced motion; unavailable WebGL; anchor navigation; scroll reversal; Pause Motion; resizing; portrait and landscape framing; and server-rendered content without JavaScript.

The chapter samplers also check continuous handoffs, a held marble before gate release, balance attachment, bell settling, and rotation derived from travel distance and direction.

## Repeat locally

Use `pnpm dev --port 3001` for the development preview. Set `PORTFOLIO_PORT=3001` when running `pnpm test:e2e` or `pnpm test:visual` to target that instance. Use a separate Playwright `--output` directory when another test run is active.

The reviewed images are in `tests/portfolio.spec.ts-snapshots`. Lighthouse reports are generated locally in the ignored `lighthouse-results` directory. Tablet and phone checks use browser device emulation, not physical devices.
