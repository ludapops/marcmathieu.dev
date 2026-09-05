<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio contract

Read `CONTEXT.md` before changing portfolio language or project attribution. Read `docs/portfolio-brief.md` before changing page structure, project evidence, motion, or release scope. Read the ADRs before changing a recorded architectural choice.

## Boundaries

- Keep portfolio text, metadata, and evidence server-rendered. Add a client boundary only for browser interaction.
- Keep the Three Worlds presentation in `src/components/worlds`; browser interaction belongs in its client boundary.
- Extend tokens in `src/app/globals.css` before adding one-off visual values.
- Keep public project claims inside the evidence boundaries in the brief. Caption current product imagery with its capture date.
- Treat reduced motion, keyboard operation, visible focus, and a complete static reduced-motion experience as release requirements.

## Completion

Run the relevant scripts from `package.json`. A UI change is complete when lint, types, unit tests, production build, Playwright smoke tests, and the agreed desktop and mobile screenshots pass without console errors.
