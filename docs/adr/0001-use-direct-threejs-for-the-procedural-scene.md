# Use direct Three.js for the procedural scene

The portfolio uses one persistent procedural scene whose states are coordinated by GSAP across a continuous page. Use direct Three.js instead of React Three Fiber so the scene has one lifecycle and render scheduler without an additional React renderer; reconsider this decision if the design grows into several complex three-dimensional scenes whose composition would benefit from React Three Fiber and Drei.
