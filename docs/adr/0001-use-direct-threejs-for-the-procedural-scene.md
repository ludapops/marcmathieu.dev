# Use direct Three.js for the procedural scene

The portfolio uses one procedural tabletop Rube Goldberg machine. The seven-second intro connects a spring, marble, trigger lever, dominoes, counterweight, and Enter key. Three chapter modules show a tipping cup, counterweight gate, and balance transfer. A fourth module rings a bell before Contact.

Three.js owns geometry and rendering. GSAP advances one intro progress value and ScrollTrigger supplies reversible chapter progress. Pure samplers in `mechanics.ts` define positions and contact points; `tabletop-machine.ts` uses the same definitions to build and pose the mechanisms. Rail travel uses distance to derive marble rotation. Replays and scroll jumps evaluate the same state without running a simulation forward from its start.

Direct Three.js remains a good fit because one mounted scene owns resources and lifecycle. React Three Fiber would add another composition layer without solving a current problem. A physics engine would require recording and replaying state to support reverse scrolling, while authored motion provides repeatable contacts and completion timing. Library changes remain an option when a representative mechanism demonstrates better contact accuracy, mobile performance, or maintainability without sacrificing deterministic seeking.

Portrait phones use shorter chapter tracks. The intro camera follows overlapping working areas on phones. Each chapter renders into a viewport that follows its section and reserves space for its label, including in landscape. Resizing rebuilds geometry only when crossing the compact-layout breakpoint and reapplies the current progress. Shared materials survive the rebuild; replaced geometry is disposed.

The renderer draws on demand and pauses the intro when the document is hidden or motion is paused. The intro watchdog measures active time so a background tab does not bypass an unfinished sequence. Skip remains available during playback. Reduced motion and unavailable WebGL use the static entrance.
