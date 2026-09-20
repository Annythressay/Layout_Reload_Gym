# Body Visualizer — implementation and QA

## Audit and integration

The application is static HTML/CSS/vanilla JavaScript. `build.cjs` assembles shared header, footer, popup, dialogs and page templates; there is no framework or bundler. CSS uses Inter and Barlow Condensed, `--red: #e51927`, and responsive tiers at 1199.98 / 991.98 / 767.98 / 575.98px. There are no body GLB/GLTF/FBX/OBJ assets. No analytics architecture was added.

The visualizer is generated at `body-visualizer.html`. `/body-visualizer` is supported by the local server and a Vercel rewrite. Other static hosts can use the HTML URL directly. Homepage entry sits after BMI; site search also finds the feature. Header and footer templates and global stylesheet are unchanged.

## Architecture and behavior

- `assets/js/body-visualizer/state.js`: defaults, finite/range validation, independent body states, BMI and renderer-independent measurement mapping.
- `app.js`: Vietnamese measurement controls, step flow, validation messages, goals, comparison summary, native reset confirmation and loading/fallback handling.
- `model.js`: reusable elliptical torso surface and mannequin limbs. No external model or AI image.
- `scene.js`: local Three.js engine, shared camera and scissor comparison; 400ms interpolation; pointer/touch/keyboard camera controls; resource cleanup.
- `assets/css/body-visualizer.css`: namespaced page and teaser styles, reusing brand variables and button classes.
- `assets/vendor/three/`: Three.js 0.180.0 and OrbitControls with MIT license; approximately 759 KB of uncompressed JavaScript, loaded only on the feature page.

Goal starts as a copy of current measurements once. Revisiting steps preserves each independently. Height, inseam, shoulders, arms and body type remain at their copied values in the goal; goal edits expose weight/chest/waist/hip/thigh. Reset clears both states and goal selection. Refresh starts a fresh session. No measurements are persisted, included in URLs, logged to analytics or sent through CTA links.

The primary consultation link inherits the existing floating-contact Zalo destination. Trial registration opens `about.html#about-register`, reusing the existing form. No backend booking or automated lead submission was added.

## Mapping and limitations

Height sets body length and head/arm proportions. Inseam sets leg length, with a safe height-relative clamp. Chest, waist and hip approximate elliptical torso cross-sections. Weight supplies a bounded thickness factor. Shoulder width, arm and thigh circumference control their corresponding regions. Body type only adjusts a geometric depth ratio; it does not classify health. Smoothstep blending joins torso sections without overshooting. Joint volumes connect simplified limbs.

This is an illustrative mannequin, not an anthropometric reconstruction or a prediction of training results. Cross-sections, lean mass, posture and fat distribution cannot be inferred accurately from these inputs. Extreme combinations are constrained for display and may not match literal measurements. A future GLB with authored morph targets can replace `model.js` while retaining the state/UI mapping boundary.

## Responsive and accessibility

Desktop uses a 2:1 viewer/control grid with a sticky viewer. Below 992px the viewer precedes controls. The mobile 3D stage is 320px; tablet stage is 400px. Touch and number controls have 44px heights. No mobile fixed CTA was added, leaving all controls unobstructed. Native ranges, labeled numbers, radio groups, semantic buttons, visible focus, step state, reduced-motion support and native reset dialog are included. Camera supports keyboard arrows and +/- alongside drag, wheel and pinch.

## Verification

Run the local server first: `node server.cjs`.

- `node qa/body-visualizer.test.cjs`: browser integration, rendered pixel changes, invalid/empty/overflow inputs, range keyboard control, type switch, advanced measurements, independent states, split comparison, drag/zoom/keyboard, touch rotation/pinch emulation, goals, CTA destinations, reset, reload, context-loss retry, unsupported WebGL, missing renderer module, idle render loop, homepage lazy loading and route navigation.
- `node qa/body-visualizer-regression.cjs`: 56 layouts across all eight original pages, one H1, header/footer, navigation/search and utility boundary checks.
- Width matrix: **1440, 1280, 1024, 768, 430, 390, 375px**. No horizontal overflow. Screenshots are `qa/body-visualizer-{width}.png`.
- Results: `body-visualizer-results.json` and `body-visualizer-regression.json`.
- Feature checks use headless Microsoft Edge with a real WebGL canvas; mobile tests emulate touch through Chromium's input protocol, not physical phone hardware.
- No uncaught runtime errors or feature asset errors were observed. The homepage's pre-existing Facebook video URL returns **HTTP 403**; the feature test reports it separately as an external error.
- The legacy `node qa.cjs` stops at its outdated `about: glance retained` assertion. The About page no longer contains that historical selector and was not changed by this task. The independent regression suite verifies the current pages without that obsolete assertion.

Render work is requested only when needed, paused when offscreen/hidden, and uses capped pixel ratios (2 desktop, 1.5 mobile). Idle-loop behavior is verified. Physical-device heat, battery usage and a universal 60fps guarantee have not been measured.

No commit or push was performed.
