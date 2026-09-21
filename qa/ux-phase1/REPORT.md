# Body Visualizer targeted UX phase 1

Verdict: PASS. Local only; no commit, push or deploy.
Base checkpoint: b1647e38dc494eb8f6d90e358affda88991b18a0.

## Production files
- assets/js/body-visualizer/app.js: contextual guidance, field feedback, scroll/focus and BMI context.
- assets/css/body-visualizer.css: local guidance, focus scroll margin, empty-state appearance and mobile hint sizing; viewer layout unchanged.
- assets/js/body-visualizer/state.js: only Bắp tay -> Vòng bắp tay label.
- assets/js/main.js: page-body-visualizer guard around promo auto-open timer only.
- templates/pages/body-visualizer.html and generated body-visualizer.html: BMI unavailable text, reset and CTA copy.

## Behavior
- Step heading receives focus and scrollIntoView with 110px clearance. Smooth normally, instant with prefers-reduced-motion. Checked all three forward transitions at 1440x900, 768x1024 and 390x844 with both motion preferences.
- Body Visualizer promo auto-open disabled without setting sessionStorage. About page in a fresh browser context still auto-opens.
- Gender and inseam retained, with nearby unsupported-3D copy and accessible descriptions.
- Seven native details disclosures next to labels; keyboard Enter/Space; closed disclosure adds no separate guidance row. Mobile camera text is 12px; interaction hint is 11px.
- Goal copy explicitly describes one-time initialization. Existing data synchronization behavior unchanged.
- BMI label says current in current/compare mode and goal in goal mode. Missing BMI has nearby explanation. Formula unchanged.
- CTA still links to #bv-conversion and contact still points to the existing Zalo destination. No transmission added.
- Reset copy includes Height/Hip and precisely names defaults retained for Weight, inseam and model type.
- Seven measurement clamp notices read the existing mapMeasurements result, only in the focused field. No changed bounds, rounding or mapping. Height notice retained.
- Empty/invalid number inputs have a visible explanatory state and muted native range; keyboard range interaction remains available. No baseline written into data.

## Guidance provenance and limits
Read qa/body-measurement-calibration/geometry.js, REPORT.md and landmarks.json; qa/hip-measurement-calibration/REPORT.md and landmarks.json.
- Chest/waist: horizontal sections at mean Y of mapped reference ruler rings.
- Hip: horizontal section through mean Y of 33 mapped landmarks, not reselected at maximum girth.
- Upper arm/thigh/calf: circumference of a section fitted to the corresponding ring, one limb. Source does not prove maximum circumference or a particular real-world tape landmark.
- Shoulder: horizontal X distance between outside endpoint 8274 and its mirror (GLB 8951/1714), not circumference or over-neck path. Source explicitly does not establish clinical acromion equivalence.
Therefore shipped guidance is deliberately limited to region, circumference versus width, one limb and units. It does not claim navel level, largest girth, arm flexion, clinical landmarks or medically precise measurement instructions. Detailed physical measurement guidance still needs anatomical validation.

## Validation
- node qa/weight-ux/tests.mjs: 19 PASS.
- node qa/height-production-integration/tests.mjs: 1094 PASS.
- node qa/weight-ux/run.cjs: 22 Weight UX groups PASS; 765 existing browser regression checks; 189 samples; max error 0.07789596008294097 cm.
- node qa/ux-phase1/run.cjs: 39 groups PASS. Results and three-width helper/form screenshots in this directory.
- All responsive sizes: no horizontal overflow; all seven helpers fit within their fields; camera stage heights unchanged (520/400/320px); sliders 44px high.
- Guidance open/close preserves exact geometry, influences, camera and scene/model/renderer identities.
- Regression preserves signed Height, body measurements, phenotype, reset and Weight non-geometric behavior.
- Existing Weight suite: errors 0, warnings 0, failed requests/HTTP errors 0, WebGL errors 0. New Phase 1 suite: errors 0, warnings 0, HTTP/request errors 0.
- Nine protected files compared byte-for-byte against HEAD, including GLB v4, scene, normalization, Height calibration/baselines, controller, loader and both calibration JSONs. state.js differs only by label. See protected-files.json.
- Source syntax and git diff --check passed.
- Manually inspected browser Goal transition at 390px and helper screenshots at 1440/768/390. No clipping; heading visible below header. Initial disclosure inherited a minus marker from its parent; scoped override fixed it and Phase 1 suite was rerun.
- Browser tests use desktop Edge viewport emulation, not physical-device keyboard/touch certification.

## Remaining Phase 2
Mobile/tablet form/model visibility loop. Viewer layout, sticky behavior and preview mechanisms intentionally unchanged.

Local preview: http://127.0.0.1:4187/body-visualizer.html
Server: node qa/height-production-integration/server.cjs
