# Use Three Worlds with native browser motion

After reviewing the working alternatives, Marc approved the Three Worlds portfolio and removal of the old design on the current branch. The site now uses server-rendered project chapters and short browser-native panel transitions instead of a persistent Three.js/GSAP machine. This puts the visual emphasis on real project evidence and removes the intro gate, continuous renderer, and associated loading lifecycle.

The experimental equipment configurator and Selection Stage were removed because they added activity without explaining Marc’s contribution. Project-specific layouts, responsive panels, native contribution disclosures, and the contact composition supply the interaction. Reduced motion and JavaScript-free reading remain complete experiences.

This decision supersedes ADR 0001. The production route is `/`; `/worlds` redirects to the same experience for existing review links.
