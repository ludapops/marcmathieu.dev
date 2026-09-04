# Connected machine verification

Verified September 4, 2026, on `astra-attempt-1-new-rube-goldberg-machine`, based on `main` at `adaa9da`. The committed intro mechanics remain unchanged by the connected-chapter work.

## Results

- `pnpm check`: lint, types, 35 unit tests, and production build passed.
- Browser coverage: 133 applicable checks passed across the full run and targeted rechecks. The full run passed 129 checks; three failures identified diagnostic coordinate units and idle-state reporting, which were corrected and passed targeted rechecks. An additional runtime WebGL-loss check passed afterward. Device-specific skips are intentional.
- All 18 screenshot comparisons passed. Intro baselines remained unchanged; chapter, reading-layout, and finale baselines were reviewed and updated.
- Visual browser review covered 320 × 700, 390 × 844, 834 × 1194, 844 × 390, 1194 × 834, 1440 × 1000, and 1728 × 925. No horizontal overflow, page errors, or console errors appeared in these sessions.
- The rendered mechanism checks enforce fewer than 100 draw calls. Observed chapter scenes used approximately 20–35 calls; confetti uses one instanced draw.
- Production Lighthouse CI passed all assertions across three mobile runs: performance 99, 98, 98; accessibility 100 each; LCP 2.232, 2.324, 2.321 seconds; CLS zero each. These are local lab measurements.

## Route and finale coverage

Unit checks cover shared handoff coordinates, alternating direction, deterministic reverse seeking, gutter placement, and connector changes after content-height changes without changing machine scale. Existing checks retain marble contact, domino separation, uninterrupted domino motion, and catapult release/landing continuity.

Browser checks cover one shared chapter marble, reading gutters, fixed scale through forward/reverse scrolling, the finale's single-trigger behavior, timed settling, Pause Motion, replay, and offscreen suspension. Reduced motion and unavailable WebGL retain a static entrance; the finale also supplies server-rendered completed artwork. A runtime context-loss check confirms the static finale appears and replay controls disappear after the renderer loses WebGL.

The intro still runs for eight seconds. Its launch occurs at 5.5 seconds and impact at 6.8 seconds. Pointer, touch, keyboard, incomplete holds, Skip during playback, replay, hidden-tab suspension, and the active-time watchdog remain covered.

## Repeat locally

Use `pnpm dev --port 3001` for the preview. Set `PORTFOLIO_PORT=3001` when running Playwright. Reviewed baselines are in `tests/portfolio.spec.ts-snapshots`.

The performance run used the existing Lighthouse assertions with a separate production server on port 3010. Reports are in the ignored `lighthouse-results` directory. Phone and tablet verification uses browser emulation, not physical devices.
