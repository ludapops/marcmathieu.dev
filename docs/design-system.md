# Design system

## Foundations

The system uses warm paper and near-black ink as its base. Project colors orient the reader; they do not replace the portfolio identity. Zilla Slab carries identity and chapter scale. Geist carries reading, navigation, labels, and metadata.

All visual constants originate as CSS custom properties in `src/app/globals.css`. Component styles consume those tokens through CSS Modules.

## Layout

Use a twelve-column desktop grid and collapse to one readable column on small screens. Reading text stays narrow even when chapter media spans the viewport. Borders and alignment establish hierarchy before shadows or containers.

## Motion

Navigation and focus respond quickly. Chapter transitions scrub a connected tabletop machine. Reading Zones use short masked, directional, or opacity reveals and never routine blur. The Spatial Index varies opacity and glyph rotation without defocusing text.

The Pause Motion control stops decorative scene changes. Reduced-motion visitors receive a static machine and direct state changes.

## Components

- Portfolio Navigation: identity, section anchors, résumé, motion control, and progress
- Spatial Index: three chapter links with pointer or scroll focus
- Case Study Chapter: shared evidence sequence with a project-specific accent
- Interaction Map: public product behavior, never internal architecture
- Evidence Caption: source, capture date, and historical caveat
- Career Timeline: capabilities attached to the work where they mattered
- Contact Path: email, GitHub, LinkedIn, and résumé
