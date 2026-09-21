# RELOAD Body Visualizer — UX Phase 2 Concept A

Local implementation only. Base/HEAD: `1f44b2bff47ec0631f138bc937112d1791fcf12f`.

## A. Architecture implementation

Concept A only. `createModelAccess()` in app.js manages navigation, focus, visibility and one semantic return anchor. The existing viewer stays in place. No mini preview, compact viewer, canvas reparenting or second render pipeline.

Mobile/tablet Current/Goal reserve a 44px utility slot in the panel and a 44px return slot near the viewer. These slots stay allocated while controls show/hide, keeping document geometry stable. Desktop and Comparison/Roadmap do not allocate these slots.

## B. Utility visibility logic

Scope: `(max-width:991.98px)` and step 0/1. IntersectionObservers watch the main viewer and form. The utility waits until the entire viewer, including camera buttons, clears the header; this deliberately avoids covering the remaining camera controls after the canvas alone disappears. It hides when the viewer returns, the form leaves view, a competing menu/dialog opens, or a return journey is active.

Header height and utility width/left are measured on initialization, step/breakpoint changes and debounced resize. The button is fixed directly below the header, with z-index 10. The header remains 20 and contact 90. Threshold tolerance prevents rapid reversal near the boundary. No new scroll listener or RAF loop.

A separate narrow-band observer suppresses the utility when the last active field crosses the header/utility band, giving that field and its helper/error priority. Ordinary scrolled content can pass behind the fixed toolbar, as with the existing fixed header; active field navigation reserves clearance below it.

## C. Current/Goal context

Visible labels are exactly `Xem mô hình · HIỆN TẠI` and `Xem mô hình · MỤC TIÊU`. Return accessible names also include the current context. Each renderStep clears the old anchor; comparison and roadmap remove access state. The existing Goal one-time copy logic is unchanged.

## D. Xem mô hình behavior

The explicit click saves the semantic field anchor, leaves editable focus if needed, moves focus to the existing stage without scrolling, waits for a bounded visual-viewport quiet period, then scrolls the full viewer below the measured header with an 8px gap. Reduced motion uses instant movement; normal motion uses smooth scroll. There are no data writes or invalid-input repairs.

## E. Return anchor architecture

Stored values: step, measurement key, source control type, advanced disclosure state, helper disclosure states, field viewport offset, and keyboard/pointer navigation modality. Prefer the last active visible field, then a visible/nearest rendered field. Closed advanced fields are excluded from fallback selection. Raw document scrollY is not the return identity.

The anchor is validated against the current step and current DOM. Async operations carry an operation token, so step/breakpoint changes invalidate pending navigation. Modal competition is rechecked after waiting.

## F. Quay lại số đo behavior

The native button reads `Quay lại số đo · <Tên field>`. It occupies its own slot above the viewer title, away from canvas/camera controls and with right-side clearance. Return reopens advanced measurements if needed and restores helper disclosure states, resolves the field afresh, then scrolls to its saved relative position within safe bounds. It clears the anchor after return.

Automated waist/thigh journeys verify less than 2px return-position drift with real pointer coordinates. Playwright locator auto-scroll can itself change the page before a click; the navigation-position tests therefore click the visible fixed button at its actual screen coordinates.

## G. Mobile keyboard behavior

Detection combines editable focus, visualViewport/window resize delta from a baseline, and conservative coarse-pointer treatment. It does not use a fixed window-height cutoff. With touch number entry or a keyboard-like height reduction, the fixed utility hides and a single inline action is placed after the active field's feedback. No second fixed control is introduced.

Pointerdown preserves the inline action until click instead of allowing blur to remove it prematurely. Explicit view navigation then blurs the number input. Touch/pointer return focuses the field container, not its number input. Keyboard activation can restore the previous input/range. Resize is debounced; it does not repeatedly scroll or focus.

## H. Floating contact interaction

No new bottom-right controls. Opening the existing contact menu suppresses quick/return actions; closing it restores eligible controls. Navigation, native dialogs and the existing modal/promo state also suppress them. Shared main.js and contact styling are unchanged.

## I. Accessibility

Native buttons, 44px minimum targets, inherited visible focus outline, context-specific accessible names, no live scroll announcements and no focus trap. Hidden controls use hidden, removing them from tab order. Automatic hiding transfers focus to a meaningful field/heading if necessary. Return focus is non-editable for pointer use. Both reduced and normal motion are tested.

## J. Three.js protection

scene.js, GLB loader, renderer lifecycle, canvas host, OrbitControls, viewer resize/intersection observers and render-on-demand architecture are unchanged. Quick/return journeys compare state, raw inputs, vertex geometry, morphs, camera/target, renderer/scene/model identities and stage dimensions before/after. One canvas remains.

## K. Phase 1 regression

`node qa/ux-phase1/run.cjs`: 39 groups PASS. Includes guidance, seven helper associations, clamp/empty feedback, unsupported controls, BMI unavailable/recovery, reset copy/behavior, Goal independence, all step transitions, promo suppression on Body Visualizer and continued promo behavior on About. Both motion preferences at 1440/768/390.

## L. Geometry regression

- Weight unit suite: 19 PASS.
- Height unit suite: 1,094 PASS.
- Weight browser suite: 22 groups PASS.
- Existing Height/measurement browser regression invoked by Weight suite: 765 checks, 189 samples; max measured error 0.07789596008294097cm.
- Nine protected files have matching SHA-256 before/after: GLB v4, scene.js, normalization.js, height-calibration.js, height-baselines.js, morph-controller.js, glb-model.js and both measurement calibration JSON files.

This retains 19 targets, signed Height, phenotype, Weight non-geometric behavior and reset morph behavior. No calibration or morph calculation was edited.

## M. Performance

110 viewer/form visibility cycles preserve geometry/camera/identities and leave listener and active observer counts unchanged. 20 Current/Goal round trips leave a single canvas/control and bounded active observers. Render count stays unchanged during an idle interval. No new RAF or scroll listener exists in the implementation. This is bounded functional instrumentation, not a physical-device GPU/battery benchmark.

## N. Responsive

1440×900 and 1024×900 retain desktop sticky viewer and existing stage heights (520/480px). 768×1024 and 390×844 pass Quick View/Return journeys, labels, advanced restore, helper/invalid input, menu suppression, overflow and keyboard-like shrink checks. Slow threshold traversal verifies hysteresis and utility alignment at header bottom. Screenshots were visually inspected at mobile/tablet sizes.

## O. Console/WebGL

Phase 2 and existing regression runs report zero console errors, zero warnings, zero failed requests/HTTP errors (including 404). Journey geometry snapshots report WebGL error 0.

## P. Automated tests

`node qa/ux-phase2/run.cjs`: 32 groups PASS, including touch/coarse-pointer emulation, reduced/normal motion, semantic anchor restore, wrong-step invalidation, desktop exclusions, Current/Goal labels, Comparison/Roadmap exclusions, keyboard-like shrink, invalid raw input preservation, menu/dialog suppression, focused-field priority, slow threshold traversal, outside-form hiding, 110 visibility cycles, 20 step round trips, idle rendering and protected hashes.

Additional commands run: `node qa/weight-ux/tests.mjs`, `node qa/height-production-integration/tests.mjs`, `node qa/weight-ux/run.cjs`, `node qa/ux-phase1/run.cjs`, `node --check assets/js/body-visualizer/app.js`, and `git diff --check`.

Evidence: [results.json](results.json), [protected-before.json](protected-before.json), [run.cjs](run.cjs), [mobile form](form-390.png), [tablet form](form-768.png), [mobile viewer](viewer-390.png), [tablet viewer](viewer-768.png), [touch return](touch-return-390.png).

## Q. Exact files modified

Production tracked diff:

1. templates/pages/body-visualizer.html — two button slots.
2. assets/css/body-visualizer.css — scoped utility styles/clearance.
3. assets/js/body-visualizer/app.js — isolated model-access controller and step reset hook.
4. body-visualizer.html — regenerated only this page with `node build.cjs body-visualizer`.

New QA artifacts are limited to qa/ux-phase2: run.cjs, protected-before.json, results.json, REPORT.md and five screenshots (form/viewer 390/768 and touch-return-390). Existing suites regenerated their existing QA result/screenshot outputs; no additional tracked diff remains in those suites. No pre-existing untracked assets were removed.

## R. Local URL

http://127.0.0.1:4187/body-visualizer.html

## S. Remaining physical-device limitations

Tests use desktop Edge, resized viewports and touch/coarse-pointer emulation. They do not certify iOS/Android OS keyboards, dynamic browser bars, safe-area/notch behavior, landscape keyboard layouts, screen-reader interaction on hardware, or device GPU/battery behavior. Physical-device PASS is not claimed.

## T. Final verdict

Body Visualizer UX Phase 2 Concept A: PASS

PASS is for the local implementation and the automated/visual checks above. No commit, push or deploy. HEAD remains at the supplied checkpoint with the four production changes left locally for review.
