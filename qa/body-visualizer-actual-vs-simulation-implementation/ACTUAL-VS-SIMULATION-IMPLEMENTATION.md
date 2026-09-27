# ACTUAL vs SIMULATION — Implementation review

2026-09-27 · Local implementation only. No commit, push or deployment.

**ACTUAL/SIMULATION IMPLEMENTATION PASS — READY FOR REVIEW**

## Scope and preservation

Changed: `assets/js/body-visualizer/{app,state,measurement-constraints}.js`, `assets/css/body-visualizer.css`, `body-visualizer.html`.
Added: `input-policy.js`, `simulation-values.js`, this QA directory.
Existing local measurement icons, helper disclosure presentation and BMI UI are preserved. Approved product measurement wording replaces the former guidance; it does not claim equivalence with calibration contours.

Scene, loader, controller, calibration, normalization, Height curves and production V5 GLB are unchanged. Protected hash checks pass (18 entries). Initial hashes are byte hashes for captured files; HEAD comparisons for additional tracked text normalize CRLF/LF. The V5 asset comparison is binary SHA-256. Pre-existing untracked QA/R&D remains untouched.

## Architecture

Raw draft → product validation → committed actual body → pure simulation derivation → canonical renderer mapping → unchanged scene.

Current and Goal contain actual values only. Both scene entry points use `deriveSceneState`. Derivation is transient, deterministic and DOM/Three.js independent. Missing profiles produce SIMULATION_UNAVAILABLE without rejecting product-valid input. Weight and Inseam are NOT_APPLICABLE, with no displayed simulation range. Nulls remain null in state and renderer input.

`inputPolicyRange` defines acceptance separately from `supportedRange` calibration support:

| Field | Product band |
|---|---|
| Height | 145–205 cm |
| Weight | 35–200 kg |
| Chest | 70–140 cm |
| Waist | 55–150 cm |
| Hips | 75–145 cm |
| Shoulder | 32–48 cm |
| Upper arm | 18–50 cm |
| Thigh | 40–75 cm |
| Calf | 25–50 cm |
| Inseam | 50–110 cm |

These are product acceptance bands, not human maxima, medical ranges or calibration ranges. Existing optional semantics are retained for all seven calibrated measurements; Height/Weight/Inseam remain required.

Statuses: SUPPORTED, BELOW_SIMULATION_RANGE, ABOVE_SIMULATION_RANGE, UNSET, SIMULATION_UNAVAILABLE; nongeometry fields use NOT_APPLICABLE. Invalid input belongs only to the draft validation layer.

For ordinary supported values, simulationValue equals actualValue; mappingValue carries legacy one-decimal rounding and exact displayed endpoint aliases. Exact out-of-range bounds bypass decimal rounding. Example actual Thigh61.5 remains61.5 and maps to the exact calibrated +1 endpoint. This precision alias is considered SUPPORTED. No renderer-derived number is written back to actual state.

## UI and transactions

Number inputs and a single native slider edit actual values. Slider min/max are product limits; step is0.1, including meaningful keyboard increments. Text supplies the current simulation interval instead of decorative secondary markers. Neutral limitation text is attached by aria-describedby; outside-model values do not set aria-invalid or show the product-limit correction action. Product-invalid drafts still retain committed values and receive validation errors.

Pending Height keeps committed BMI/geometry unchanged. Confirmation changes Height only; cancel restores the committed display. Navigation asks the user to apply/cancel a pending Height. Editing another field updates the affected list without implicitly committing Height. Goal creation copies actual values and nulls exactly; subsequent Current changes remain independent. Reset clears Goal, drafts, pending Height and compare state.

BMI uses actual committed Height/Weight and the original formula. Actual205 derives simulation194.6037856625685, with girth ranges computed at that simulation Height; BMI at Weight60 is14.3.

Compare shows actual numeric differences, including +3.0 for Thigh72→75, with context explaining representation limits when relevant.

## Representative H165 results

| Field | Actual | Simulation | Status | Signed influence |
|---|---:|---:|---|---:|
| Thigh | 72 | 61.49953870737355 | ABOVE_SIMULATION_RANGE | +1 |
| Arm | 48 | 37.97387142119731 | ABOVE_SIMULATION_RANGE | +1 |
| Waist | 120 | 83.15910863687272 | ABOVE_SIMULATION_RANGE | +1 |

## Verification

- Pure regressions: seven fields × Heights160/165/170/180/190, six legacy fixtures per combination; below/above derivation and exact endpoint influences.
- Legacy mapping maximum absolute difference: **0**, tolerance1e-10. Same mapping with unchanged scene and asset preserves supported geometry; this is a mapping parity test, not a separate vertex-by-vertex capture.
- Actual precision, canonical endpoint, null, invalid drafts, missing calibration, reset defaults, actual BMI, future profile support and nongeometry parity checked.
- Height190→160→205→190 preserves Thigh65 and restores support when possible.
- All requested Thigh/Arm/Waist/Chest/Height product examples tested both through the adapter and browser input.
- Browser: viewer ready, one canvas, one V5 request,19 targets, zero V16/ITER03/corrective requests; no page JavaScript errors.
- Browser: all ten fields, invalid draft protection, Height confirm/cancel, actual BMI, Goal copy/null, Compare+3, split30%, camera preset buttons, reset and keyboard slider checked.
- Responsive widths1440,1280,1024,768,430,390,375: no horizontal overflow. Full-page screenshots included;375 and390 screenshots visually inspected, plus the desktop Thigh72 case. Viewport resizing and status wrapping are exercised at every width.

Screenshots include fully supported defaults, Thigh72/H165, Arm48/H165, Waist120/H165, Height205 and Current72/Goal75 compare. The first three edits are cumulative; later screenshots retain earlier actual inputs.

Run from repository root:

```powershell
node qa/body-visualizer-actual-vs-simulation-implementation/regression.mjs
node qa/body-morph-integration-server.cjs
# Separate terminal:
node qa/body-visualizer-actual-vs-simulation-implementation/runtime.cjs
node qa/body-visualizer-actual-vs-simulation-implementation/protected.cjs
```

Runtime script uses the existing local Playwright installation and Edge. Existing legacy UI tests that expect simulation-range input rejection are superseded for that behavior by this focused suite; they were not represented as passing unchanged. Camera presets are tested; this suite does not repeat old touch-gesture, context-loss or homepage integration suites. No model/combination-safety expansion is claimed. Session data remains session-only.

## Evidence

- architecture-regression.json
- legacy-parity.json
- product-range-tests.json
- height-transition-tests.json
- compare-tests.json
- runtime-smoke.json
- responsive-qa.json
- protected-file-hashes.json
- screenshots/

Commit: NONE. Push: NONE. Deployment: NONE. Axilla R&D reopened: NO.
