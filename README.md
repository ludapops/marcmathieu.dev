# marcmathieu.dev

Marc Mathieu's senior frontend portfolio. The site combines a server-rendered editorial narrative with a single direct Three.js scene, GSAP transitions, typed project evidence, and an executable design system.

## Development

```bash
pnpm install
pnpm dev
```

Run `pnpm check` and `pnpm test:e2e` before review. The end-to-end suite uses Chromium and WebKit, so install both once with `pnpm exec playwright install chromium webkit`. Run `pnpm test:visual` to compare the desktop narrative against its checked-in baseline.

Project language lives in `CONTEXT.md`. Product and evidence requirements live in `docs/portfolio-brief.md`. Architectural decisions live in `docs/adr/`.

The repository has no reuse license. Client names, marks, and public screenshots remain the property of their respective owners.
