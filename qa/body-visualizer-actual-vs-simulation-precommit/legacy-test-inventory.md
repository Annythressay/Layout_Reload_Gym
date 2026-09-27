# Legacy test inventory

Full recursive inventory of QA JavaScript sources. A/B/C are the23 relevant legacy entrypoints; D contains other files and new architecture evidence. Counts are source files, not assertions. Original modified sources are preserved in `legacy-originals/`. Historical C suites are explicitly superseded; their old assertions are not silently marked passing.

A: 2 · B: 7 · C: 14 · D: 73

A = STILL VALID UNCHANGED (assertions; local/output plumbing may change). B = EXPECTATION MUST CHANGE. C = OBSOLETE / REPLACED. D = UNRELATED to this migration.

## A — qa/body-visualizer-regression.cjs

State utility, eight-site-page layout, header/footer, menu/search assertions remain valid.

Action: Only local port and report destination changed; all56 layout assertions executed.

Coverage: legacy-site-results.json

## A — qa/body-visualizer-measurement-guidance-bmi/run-qa.cjs

Guidance/BMI/icon semantics and responsive checks remain valid.

Action: Output folder and explicit allowed candidate+QA paths updated; functional assertions unchanged and PASS.

Coverage: legacy-guidance/functional-regression.json

## B — qa/body-visualizer.test.cjs

Old 82.0 display string is now actual82; gender section is inside the already-existing disclosure.

Action: Updated presentation selector/value plus port/output only; all viewer, touch, context, fallback and navigation assertions retained and PASS.

Coverage: legacy-body-visualizer-results.json

## B — qa/measurement-constraints-phase1.cjs

Old rejection of calibrated-range overflow, exact endpoints in actual state, million-step model sliders, Height girth rewriting, rounded actual precision, Weight200 rejection conflict with approved product contract.

Action: Migrated entrypoint to comprehensive replacement suite; exact original preserved in legacy-originals. No passing assertion removed without replacement category below.

Coverage: contract.cjs; regression-results.json; legacy-parity.json

## B — qa/measurement-constraints-phase1-ux-fix/run-browser.cjs

Actual108.2 must stay108.2, explicit invalid150 correction uses product140, Height confirmation preserves75.9/62.9/84.4 instead of new model minima.

Action: Updated only these expectations and local/output wiring; BMI pending, null slider, model count and responsive assertions retained; PASS.

Coverage: legacy-ux-fix/browser-results.json

## B — qa/weight-ux/tests.mjs

180.1 is valid now; maximum product Weight is200.

Action: Invalid fixture changed to200.1; valid200 added;20 assertions PASS.

Coverage: legacy-weight-unit.json

## B — qa/body-calibrated-mapping/tests.mjs

Raw calibration support does not imply product acceptance. Calibration sample weights/interpolation/clamps must remain unchanged.

Action: Preserved calibration assertions; validateMeasurement expectation explicitly uses product bands. Older pre-Height/Hip nongeometry exclusions replaced by Weight/Inseam/Gender invariance plus positive Height/Hip geometry checks. Original files preserved. Body calibration loader now merges the existing separate hip dataset. PASS.

Coverage: body-calibrated-mapping-unit.json

## B — qa/hip-production-integration/tests.mjs

Raw calibration support does not imply product acceptance. Calibration sample weights/interpolation/clamps must remain unchanged.

Action: Preserved calibration assertions; validateMeasurement expectation explicitly uses product bands. Older pre-Height/Hip nongeometry exclusions replaced by Weight/Inseam/Gender invariance plus positive Height/Hip geometry checks. Original files preserved. Body calibration loader now merges the existing separate hip dataset. PASS.

Coverage: hip-production-integration-unit.json

## B — qa/height-production-integration/tests.mjs

Raw calibration support does not imply product acceptance. Calibration sample weights/interpolation/clamps must remain unchanged.

Action: Preserved calibration assertions; validateMeasurement expectation explicitly uses product bands. Older pre-Height/Hip nongeometry exclusions replaced by Weight/Inseam/Gender invariance plus positive Height/Hip geometry checks. Original files preserved. Body calibration loader now merges the existing separate hip dataset. PASS.

Coverage: height-production-integration-unit.json

## C — qa/measurement-constraints-phase1-ui-review/run-ui-review.cjs

Historical UI capture expects near-limit badge, invalid just-outside model draft, endpoint writeback, Height girth adjustment and rejected Weight200.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: contract.cjs aliases/invalid/Height/nongeometry/reset/Goal; legacy-ux-fix; guidance

## C — qa/weight-ux/run.cjs

Pre-sample-default contract expects invalid drafts to blank BMI/Height, reset nulls, Height140 accepted and data-height-clamp.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: contract.cjs BMI/state/null/reset; parity.mjs; lifecycle.cjs

## C — qa/weight-ux/responsive.cjs

Historical presentation uses retired clamp/helper containers.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: responsive-regression.json; legacy-guidance

## C — qa/ux-phase1/run.cjs

Pre-sample-default reset, old field-only clamps and old fixed stage dimensions are superseded; input associations and navigation still required.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: contract.cjs; legacy-guidance; touch.cjs; body-visualizer.test.cjs

## C — qa/ux-phase2/run.cjs

Old fixed520/480 stage and1024 sticky assumptions precede current stacked presentation; recorded historical hashes refer to that earlier version.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: touch.cjs390/768 preserves relevant return-focus/contact/keyboard behaviors; lifecycle.cjs identity. Historical110-cycle stress not claimed rerun.

## C — qa/body-calibrated-mapping/browser.js

Pre-Height/Hip integration browser fixture assumes base-plane mapping and sample-neutral reset.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: parity.mjs; migrated mapping unit; contract.cjs

## C — qa/hip-production-integration/browser.js

Pre-Height browser calibration samples omit Height baseline drift and expect old target set.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: parity.mjs; migrated hip/Height unit; contract.cjs

## C — qa/hip-production-integration/run-browser.cjs

Launcher for historical browser.js above.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: Same replacement as browser.js

## C — qa/hip-production-integration/controller-tests.mjs

Old removed hip-scale targets and reset topology are a historical controller contract, independent of actual/simulation.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: Existing unchanged controller/GLB hashes;1094 Height/controller unit checks; runtime19-target checks

## C — qa/height-production-integration/browser.js

Old raw-full-precision/no-rounding browser contract, null Height neutral reset and Height140 accepted predate model-range validation.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: parity.mjs independently evaluates immediate legacy contract; migrated1094 raw mapping/controller checks; contract.cjs

## C — qa/height-production-integration/run.cjs

Launcher for historical Height browser contract.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: Same replacement as browser.js

## C — qa/height-production-integration/responsive.cjs

Old runner changes Height without applying pending transaction, so endpoint screenshots would be mislabeled.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: contract.cjs transitions/responsive; lifecycle.cjs

## C — qa/body-visualizer-production-v5-audit/_runtime-audit-runner.cjs

Historical V5 audit snapshots direct scene-bound state and model-domain inputs; not the new acceptance oracle.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: contract.cjs network/bounds; protected-hashes.json; legacy-parity.json

## C — qa/body-morph-integration-browser.js

Historical production morph/geometry audit before current Height and input policy.

Action: Historical source retained unchanged; explicitly superseded, not executed as a current acceptance test.

Coverage: Unchanged protected model stack; migrated raw mapping tests; current browser contract

## D — qa/about-interactions.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/about-rebuild.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-calibrated-mapping/server.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-calibrated-mapping/write-report.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-measurement-calibration/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-measurement-calibration/geometry-tests.mjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-measurement-calibration/geometry.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-measurement-calibration/prepare-landmarks.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-measurement-calibration/server.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-measurement-calibration/write-report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-morph-controller-checks.js

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-morph-integration-server.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-visualizer-actual-vs-simulation-implementation/protected.cjs

New architecture evidence, not a legacy test.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-visualizer-actual-vs-simulation-implementation/regression.mjs

New architecture evidence, not a legacy test.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-visualizer-actual-vs-simulation-implementation/runtime.cjs

New architecture evidence, not a legacy test.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/body-visualizer-human-vs-model-range-audit/extract-audit.mjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/facilities-review.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/floating-contact.test.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/font-awesome.test.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/footer-social.test.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-edge-validation/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-edge-validation/check-collision.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-edge-validation/collision.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-edge-validation/contact.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-edge-validation/prepare.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-edge-validation/report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-edge-validation/run.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-full-range/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-full-range/prepare.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-full-range/report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-full-range/run.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-production-integration/report.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-production-integration/server.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-range-interaction/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-range-interaction/report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-range-interaction/run.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-rnd-audit/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-rnd-audit/report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/height-rnd-audit/run.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-measurement-calibration/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-measurement-calibration/browser.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-measurement-calibration/contact.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-measurement-calibration/prepare.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-measurement-calibration/report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-measurement-calibration/server.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-production-integration/hip-flow.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-production-integration/prepare.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-production-integration/report.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/hip-production-integration/server.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/news-new-card.test.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/phase2-combination-safety/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/phase2-combination-safety/focus.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/phase2-combination-safety/regional.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/phase2-combination-safety/run.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/phase2-combination-safety/validate-parser.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v2-server.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v2-static.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v3/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v3/browser.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v3/contact.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v3/prepare.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v3/report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v3/server.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v3/static.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v4/app.js

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v4/report.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v4/run.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/production-morph-v4/static.cjs

R&D/calibration/reporting asset or historical model harness; outside this product-input migration.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/responsive/before/main.js

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/responsive-audit.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/responsive-interactions.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/responsive-scroll.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.

## D — qa/video-preview.test.cjs

Site-specific unrelated test, reporting/extraction helper, fixture or infrastructure; not a model-range input acceptance oracle.

Action: Retained; not claimed executed.

Coverage: Unchanged unless explicitly listed in executed suites.
