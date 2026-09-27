# RELOAD Body Visualizer — Actual/Simulation Pre-commit QA

2026-09-27 — **READY FOR COMMIT**. No commit, push or deployment performed.

## Candidate review

Read-only diff review completed before test migration. Production implementation remained byte-identical throughout this QA pass. All new edits are tests/evidence. The baseline captures284 candidate/protected files, including the V5 model stack, Three.js, calibration datasets and V16/ITER03 artifacts; final comparison has zero changes.

The candidate diff is within approved scope: product input policy, transient actual→simulation adapter, exact renderer canonicalization, actual Current/Goal state, Height transaction, accessible limitation text and sliders. The icon/helper/BMI presentation differences versus HEAD predate this implementation and were intentionally preserved. Both scene entry points call deriveSceneState; no direct actual→scene bridge remains. No simulation-derived value is written back to actual state. The explicit “Dùng giới hạn” action now applies only to a product-invalid draft and commits the product boundary; it is hidden for valid outside-model inputs.

Nonblocking cleanup observations (left unchanged because this is a locked-candidate review):

- `state.js:11`: configureCalibrationFields is a compatibility no-op still called on load.
- `app.js:92`: unused local pending variable.
- `app.js:85,111`: legacy near-limit markup is retained but always hidden; new support text supplies the information.
- Legacy normalized-slider utilities/technicalStatus exports remain available but are not used by app.js.
- state.validateMeasurement and measurement-constraints.validateDraft are separate convenience/input APIs; both resolve the same product bands. Boundary coverage confirms agreement. Range numbers in fields metadata are reloaded from the authoritative policy, a harmless redundancy.

No conflicting validation, renderer state leak, silent actual clamp or unrelated production mutation found. No implementation refactor or fix was needed.

## Inventory and migration

See `legacy-test-inventory.md` and `legacy-test-migration.json` for the complete96-file QA JavaScript inventory and per-file reasons.

23 relevant legacy source entrypoints:

| Classification | Files | Disposition |
|---|---:|---|
| A — still valid | 2 | Assertions unchanged; local/output wiring adjusted; executed PASS |
| B — expectation updated | 7 | Product/representation expectations migrated; executed PASS |
| C — obsolete/replaced | 14 | Historical sources retained untouched, with explicit coverage replacements |
| D — unrelated/helper/new evidence | 73 | Separately classified, not claimed as executed legacy tests |

Counts are files, not individual assertions. The nine modified legacy sources have exact originals in `legacy-originals/`. The phase1 entrypoint invokes the new comprehensive contract suite rather than deleting its old failures without replacements. Historical C files are not current acceptance tests; they can still fail against modern UI if run directly. The inventory explicitly records why and maps their relevant behavior to current tests. Historical110-cycle UX stress and historical contour reconstruction runs were not represented as rerun.

Changed contracts: model-range overflow now preserves valid actual data; displayed endpoints canonicalize only renderer mapping; sliders use product bands with0.1 increments; Height confirmation preserves girths; precise actual entry remains precise; Weight maximum is200. Older pre-Height/Hip tests also incorrectly excluded those two fields from geometry; these now assert that Height/Hip affect geometry while Weight/Inseam/Gender remain excluded.

Unrelated assertions were retained: calibration sample weights, interpolation, invalid calibration rejection, phenotype/controller behavior, draft retention, one canvas, target count, camera/touch interactions, reset, Goal independence, context recovery, homepage entry and page layout.

## Executed evidence

| Suite | Result |
|---|---|
| Independent immediate-legacy parity (`parity.mjs`) |604 fixtures; all three Current/Goal/Compare modes; maximum mappingValue difference0; maximum influence difference0 |
| Migrated raw Height/controller unit |1094 checks PASS |
| Migrated body mapping unit |223 checks PASS |
| Migrated hip mapping unit |223 checks PASS |
| Weight policy/BMI unit |20 checks PASS |
| Current contract browser suite |11 groups PASS |
| Existing broad Body Visualizer browser suite |8 behavior groups PASS, including touch, context loss, fallback, idle rendering and homepage navigation |
| Existing whole-site regression |56 page×width cases PASS, header/footer/menu/search assertions preserved |
| Existing measurement guidance/BMI suite |PASS; zero failed checks |
| Migrated phase1 UX fixes |8 groups PASS;10 screenshots |
| Touch390/768 |12 checks PASS |
| Viewer lifecycle supplemental regression |3 groups PASS |
| Existing focused architecture matrix |35 field×Height combinations PASS |

Parity imports the actual HEAD version of measurement-constraints.js independently.604 fixtures are in the intersection of old supported values and new product acceptance. The14 fixtures excluded by intentionally narrower approved product bands are listed individually in legacy-parity.json; they are still covered at the unchanged raw calibration mapping level. Calibration itself was not narrowed or changed. Current/Goal/Compare map identically; browser reset returns the same approved sample defaults and preserves viewer identity/camera.

### Actual / simulation contract

At H165:

| Field | Actual | Simulation | Status | Signed influence |
|---|---:|---:|---|---:|
| Thigh |72|61.49953870737355|ABOVE_SIMULATION_RANGE|+1|
| Arm |48|37.97387142119731|ABOVE_SIMULATION_RANGE|+1|
| Waist |120|83.15910863687272|ABOVE_SIMULATION_RANGE|+1|

Lower product endpoints for all seven fields preserve actual values, derive the exact V5 minimum, report BELOW_SIMULATION_RANGE and map to−1. Measurement influences stay within[−1,+1]; Height stays within its existing±0.30 envelope.

All ten product bands tested at min/max and min−0.1/max+0.1:40 browser cases. Invalid drafts preserve the previously committed body. All14 displayed min/max aliases across the seven fields report SUPPORTED and map to exact endpoints, including Thigh61.5. Optional null remains null/UNSET and maps to neutral without inventing an entered circumference.

### Height / Goal / Compare / BMI

Four transitions exercised in-browser: supported→above, above→supported, supported→below, below→supported. Confirm preserves actual girths. Cancel preserves the entire previous body. Pending Height blocks step navigation without aria-invalid. Existing Goal retains its independently copied Height and girths. Goal has no separate Height editor, as before; Goal preservation and derived statuses are checked after Current Height changes.

Compare tested72→75(+3.0),52→75,72→52 and72→72, including saturated endpoints. Numeric text uses actual data and explains simulation limitations. Null Goal copy remains null.

Height205/Weight60 gives BMI14.3 using actual205; simulationHeight is194.6037856625685. Normal165/60 gives22.0. Malformed/invalid drafts preserve committed BMI. Weight and Inseam report NOT_APPLICABLE, show no model-range message and leave morph weights unchanged.

### Pointer / viewer / site

Real CDP touch gestures at390 and768 change camera rotation and pinch zoom. Native touch slider, number entry, helper toggles, camera presets, coarse-pointer inline viewer/form return and floating contact suppression all pass. Mouse drag/wheel and keyboard camera remain covered by the broad existing suite.

Resize preserves renderer/model identity, camera, target and actual state. Context-loss/retry rebuilds exactly one canvas and restores Thigh72 as actual with+1 derived influence. Normal page reload restores sample defaults, preserving session-only behavior. WebGL-unavailable and missing-scene fallback flows pass in the existing suite.

The site suite checks index/about/facilities/services/membership/locations/class-schedule/blog at seven widths. Header/footer/menu/search and homepage Body Visualizer entry pass. One unrelated Facebook video CDN403 occurred on the homepage and is recorded separately in site-integration.json; no local Body Visualizer console error or warning occurred. No third-party failure was hidden or counted as a Body Visualizer implementation failure.

### Responsive / accessibility

1440,1280,1024,768,430,390,375: PASS, no horizontal overflow. At every width the limitation helper fits horizontally, number and slider do not collide, measurement helper opens/closes and CTA remains reachable.390/375 helper crops were visually inspected: text wraps cleanly with no clipping and readable neutral contrast.

aria-invalid is false for accepted outside-simulation values and pending Height; true for invalid product drafts. All description IDs resolve. Both number and range point to explanatory text. Keyboard slider advances by0.1 actual units for all ten fields; number→slider Tab order remains logical. Text and information symbol convey limitation independently of color.

## Protected/network gate

V5 SHA256:

`BCE6B0A5A6804694153FCB13BFA5393EC451A37BF30EBA152F0FD6F33DA872AB`

Initial-page contract run: V5 requests1; V4/V16/ITER03/corrective requests0; canvas1; morph targets19; local console errors0; warnings0. Recovery/reload tests intentionally create additional page/model lifecycles and are recorded separately from this initial-load request budget.

Protected files modified: NO. Candidate production files modified during QA: NO. Unexpected tracked changes: NO. Git diff whitespace check: PASS (Git's CRLF notices are shell notices, not browser warnings).

## Reproduction

Serve the repository with the existing `node qa/body-morph-integration-server.cjs` on127.0.0.1:4175. Then run:

```powershell
node qa/measurement-constraints-phase1.cjs
node qa/body-visualizer-actual-vs-simulation-precommit/parity.mjs
node qa/body-visualizer-actual-vs-simulation-precommit/touch.cjs
node qa/body-visualizer-actual-vs-simulation-precommit/lifecycle.cjs
node qa/body-visualizer.test.cjs
node qa/body-visualizer-regression.cjs
node qa/measurement-constraints-phase1-ux-fix/run-browser.cjs
node qa/body-visualizer-measurement-guidance-bmi/run-qa.cjs
node qa/body-calibrated-mapping/tests.mjs
node qa/hip-production-integration/tests.mjs
node qa/height-production-integration/tests.mjs
node qa/weight-ux/tests.mjs
node qa/body-visualizer-actual-vs-simulation-precommit/finalize.cjs
```

The guidance suite owns its existing separate local4194 server. No live production URL is used. `before-hashes.json` is the immutable start-of-review baseline; do not rerun capture.cjs when validating this review snapshot.

## Decision

**READY FOR COMMIT** — updated/new contract, unaffected relevant legacy behaviors, touch, site integration, responsive, protected hashes and local console/runtime gates pass.

Commit: NONE. Push: NONE. Deployment: NONE. Awaiting separate user instruction before any commit.
