# Tabletop machine verification

Verified on September 4, 2026, on branch `astra-attempt-1-new-rube-goldberg-machine`, based on `main` at `adaa9da`.

## Checks

- `pnpm check`: lint, type checks, 26 unit tests, and production build passed.
- Playwright: all 103 applicable functional checks passed across desktop Chromium, mobile WebKit, mobile Chromium, and tablet WebKit. The final comparison of 18 visual baselines passed after reviewing the new machine framing. Device-specific tests skip projects to which they do not apply.
- Production browser review: intro playback and all four chapters at 1440 × 1000, 834 × 1194, 1194 × 834, 390 × 844, and 844 × 390, with no console errors.
- The original implementation was measured at 82 intro draw calls and 43–55 chapter draw calls, including shadow passes. The browser suite enforces the draw-call budget after the framing and handoff changes.
- Before the framing and handoff follow-up, Lighthouse CI production assertions passed across three mobile runs. Performance scores were 91, 98, and 99; accessibility was 100 in every run. Median LCP was 2.29 seconds and CLS was zero. One run had a 3.53-second LCP; these are local lab measurements.

## Coverage

The checks cover winding by pointer, touch, and keyboard; incomplete holds; skip during playback; replay; hidden-tab suspension beyond the watchdog timeout; reduced motion; unavailable WebGL; anchor navigation; scroll reversal; Pause Motion; resizing; portrait and landscape framing; and server-rendered content without JavaScript.

The chapter samplers also check matching exit and entry positions, alternating travel direction, a held marble before gate release, the same marble crossing the balance, bell settling, and rotation derived from travel distance and direction. Browser regression checks compare world-space handoffs and rendered scale at several forward and reverse scroll positions across all four chapters. Intro checks verify that the machine viewport clears the identity and controls.

The follow-up framing was also visually reviewed at 1728 × 925, 834 × 1194, 390 × 844, and 844 × 390. The desktop chapter scale measured 114.327681 pixels per world unit throughout scrolling and across all four chapters; scale adapts when the viewport changes, not when the chapter enters or leaves view.

## Repeat locally

Use `pnpm dev --port 3001` for the development preview. Set `PORTFOLIO_PORT=3001` when running `pnpm test:e2e` or `pnpm test:visual` to target that instance. Use a separate Playwright `--output` directory when another test run is active.

The reviewed images are in `tests/portfolio.spec.ts-snapshots`. Lighthouse reports are generated locally in the ignored `lighthouse-results` directory. Tablet and phone checks use browser device emulation, not physical devices.
