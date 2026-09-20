# Three.js (local runtime)

Pinned version: **0.180.0**. MIT license included in `LICENSE`.

Source package: https://www.npmjs.com/package/three/v/0.180.0

Files copied from the published package through jsDelivr:

- `build/three.module.min.js`
- `build/three.core.min.js`
- `examples/jsm/controls/OrbitControls.js`
- `LICENSE`

Only modification: OrbitControls imports `./three.module.min.js` instead of the bare `three` specifier. This supports native browser modules without adding a bundler or an import map. No CDN request is made by the visualizer at runtime.

Update all three JavaScript files together and rerun the Body Visualizer tests. The homepage does not load these files.
