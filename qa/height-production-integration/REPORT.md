# Calibrated Height production integration: PASS

Local integration — 2026-09-21. Không commit, push hoặc deploy. Không Weight deformation, không redesign UI.

## A. Architecture before/after

| Component | Before | After |
| --- | --- | --- |
| GLB | v3 / 22 targets | v4 / 19 targets |
| Controller | morph-controller.js; seven measurement + legacy hip scale pairs | Cùng controller; seven pairs + signed Height channel; legacy hip-scale bindings removed |
| Calibration | normalization.js; measured nine-point piecewise curves | Giữ nguyên compileCalibration và measurementCmToMorphWeight; thêm baseline-relative conversion |
| Height input | Height/BMI only; invalid retained old state | Cùng field; full-precision numeric input; invalid clears state/morph |
| Weight/BMI | calculateBMI in state.js | Giữ nguyên; Weight không tham gia mapping |
| Reset | Clear measurement fields, restore default Height 165 | Clear Height + measurement fields; signed Height and 14 targets = 0 |
| Debug | ?morph-debug=1, actual/target weights | Thêm Height mapping, current baselines và equivalent measurements |
| Render lifecycle | Cached GLB bytes; one scene/model/renderer; scheduled on-demand RAF | Giữ lifecycle, animation, scissor compare, resize và visibility handling; camera fits safe Height envelope |

Default initial form Height vẫn là 165 cm, giờ tạo deformation đúng Height đó. Sau Reset, Height field để trống để biểu diễn neutral max$hg=0; BMI để trống đến khi có Height hợp lệ. Current/goal vẫn dùng cùng một model với hai scissor passes.

## B. GLB v4 migration

Production-local URL: `3D/male-mpfb-production-morph-v4.glb`. Loader kiểm tra dictionary gồm đúng 19 tên: bốn phenotype, 14 measurement và Height. Lookup bằng tên từ morphTargetDictionary, không hard-code index. Unit test dùng dictionary đảo thứ tự. Không còn binding hip-scale, leg-height hoặc min$hg. Cả v3/v4 GLB giữ nguyên hash.

## C. Signed Height controller

`setMorph(HEIGHT_TARGET, value)` clamp signed [-0.30,+0.30]; 14 measurement targets vẫn clamp [0,1], giữ incr/decr mutual exclusion. `apply()` ghi Height trước, rồi bảy measurement pairs. Không model.scale/scale.y hoặc ghi position buffer.

## D. Height cm mapping

`HEIGHT_BASE_CM = 172.91078380973204`; `HEIGHT_SLOPE_CM_PER_INFLUENCE = 72.31000617612153`. Influence = (clamped cm − base cm) / slope. Geometry được đo trực tiếp bằng getVertexPosition + matrixWorld; Height = 100 × (maxY − minY), không đo bằng Box3. Box3 precise chỉ dùng để fit camera lúc khởi tạo.

## E. Height clamp / invalid

Safe cm range [151.21778195689558,194.6037856625685], signed influence [-0.30,+0.30]. Raw 140/200 cm vẫn ở form/BMI, geometry clamp ở endpoints. Empty/invalid/NaN Height → influence 0, phenotype không đổi; invalid UI vẫn báo lỗi và chặn Next theo form validation. Không extrapolate.

## F. Height baseline dataset integration

`height-baselines.js` chứa chính xác 13 full-precision samples từ `qa/height-full-range/baseline-dataset.json`. `height-calibration.js` nội suy piecewise theo influence đã clamp. Unit test deep-equality kiểm tra mọi sample production với nguồn; không copy số làm tròn từ report. Source R&D, calibration JSON và reports cũ không thay đổi.

## G. Height-adjusted measurement algorithm

Một setState trung tâm tính Height → clamp/map → B_M(H) → equivalent = B_M(0) + requested − B_M(H) → engine piecewise hiện có → controller.apply → render. Không nhân measurement với Height/baseHeight. Empty/invalid measurements = zero; equivalent luôn dựa trên Height đã clamp. Form limits mở rộng đủ các calibration endpoints sau Height drift, không thay shape-response curve.

Debug hiển thị requestedCm, clampedCm, influence, target, cả bảy baselines, requested measurement, heightAdjustedBaseline, equivalentBaseHeightMeasurement, branch, signedWeight/weight và clamped. `debug.json` là snapshot panel.

## H. Height round-trip tests

| Requested cm | Clamped cm | Influence | Measured cm | Abs error cm |
| --- | --- | --- | --- | --- |
| 151.21778195689558 | 151.21778195689558 | -0.3 | 151.21778195689558 | 0 |
| 155 | 155 | -0.24769440298632694 | 155 | 0 |
| 160 | 160 | -0.1785476795325663 | 160 | 0 |
| 165 | 165 | -0.10940095607880566 | 165 | 0 |
| 170 | 170 | -0.04025423262504502 | 170 | 0 |
| 172.91078380973204 | 172.91078380973204 | 0 | 172.91078380973204 | 0 |
| 175 | 175 | 0.028892490828715627 | 175 | 0 |
| 180 | 180 | 0.09803921428247628 | 180 | 0 |
| 185 | 185 | 0.1671859377362369 | 185 | 0 |
| 190 | 190 | 0.23633266118999757 | 190 | 0 |
| 194.6037856625685 | 194.6037856625685 | 0.3 | 194.6037856625685 | 0 |
| 140 | 151.21778195689558 | -0.3 | 151.21778195689558 | 0 |
| 200 | 194.6037856625685 | 0.3 | 194.6037856625685 | 0 |

## I. Seven measurement geometry validation

49 baseline measurements: 7 Height states × 7 regions, với inputs empty và sau đó neutral B_M(H). Max error = 0 cm.

189 end-to-end samples: 3 Height states (-0.30,0,+0.30) × 7 regions × 9 calibration samples (−1,−0.75,−0.5,−0.25,0,+0.25,+0.5,+0.75,+1). Mỗi phép thử đi qua input event thật → form validation → state → mapping → renderer → measured geometry.

Protocol giữ đúng R&D: anatomical planes lấy từ Height-only baseline, freeze trong khi thay measurement; circumference từ triangle-plane closed contours; shoulder từ endpoint X distance. PASS threshold 0.10 cm cho measurement, 1e-6 cm cho baseline, 1e-9 cm cho Height. Baseline và Height đạt sai số 0; measurement còn độ lệch hình học do tương tác Height như R&D.

| Region | Samples | Max absolute error cm |
| --- | --- | --- |
| waist | 27 | 0.03832579448230433 |
| chest | 27 | 0.04555412711177098 |
| shoulder | 27 | 3.552713678800501e-15 |
| arm | 27 | 0.05968804360215074 |
| thigh | 27 | 0.016243188433236355 |
| calf | 27 | 0.07789596008294097 |
| hip | 27 | 0.03523589818405526 |

Full precision của từng sample, expected/actual weight, equivalent cm và measured cm nằm trong `browser-results.json`.

## J. Edge envelope smoke tests

| Case | Height | Measurements | Degenerate faces | Rotated normals >90° |
| --- | --- | --- | --- | --- |
| A | -0.3 | waist:-1, chest:-1, shoulder:-1, arm:-1, thigh:-1, calf:-1, hip:-1 | 0 | 0 |
| B | -0.3 | waist:1, chest:1, shoulder:1, arm:1, thigh:1, calf:1, hip:1 | 0 | 12 |
| C | 0.3 | waist:-1, chest:-1, shoulder:-1, arm:-1, thigh:-1, calf:-1, hip:-1 | 0 | 0 |
| D | 0.3 | waist:1, chest:1, shoulder:1, arm:1, thigh:1, calf:1, hip:1 | 0 | 6 |
| E | -0.3 | waist:-1, chest:1, shoulder:0, arm:0, thigh:0, calf:0, hip:1 | 0 | 8 |
| F | 0.3 | waist:1, chest:-1, shoulder:0, arm:0, thigh:0, calf:0, hip:-1 | 0 | 0 |

No obvious surface collapse, detached helpers or new penetrating surfaces. Height maximum head is now fully framed in all four views. All-decrease and all-increase show exaggerated proportions inherited from the calibrated R&D extrema.

B/D/E have 12/6/8 triangle normals rotated >90 degrees relative to baseline, respectively, with zero degenerate faces. These counts match corresponding previously audited R&D states B/F/M1. Visual review is not an exhaustive triangle-pair intersection proof.

Initial camera envelope now covers signed Height endpoints. Input and Reset never reposition camera; changing the view still uses the existing view controls. No CSS or layout redesign.

## K. Reset

Max vertex deviation = 0 m; camera/target preserved = true; model/scene/renderer/geometry IDs preserved = true. Height + 14 measurement weights = 0; four phenotype unchanged. Reset trong animation và empty Height giữa animation cũng PASS. Không reload GLB/page hoặc recreate scene.

## L. BMI / form regression

180 cm / 80 kg → 24.7; Weight 90 kg → 27.8, không đổi morph weights. Invalid Height/Weight vẫn chặn Next; valid Next → goal → compare → fitness hoạt động. Goal measurements độc lập với current; Height copied khi khởi tạo goal và retained trong compare. Chọn fitness goal vẫn hiển thị recommendation. Chỉ sửa câu mô tả cũ để phản ánh Height nay có deformation, ở cả HTML và template.

## M. Performance and lifecycle

| Phase | Updates | Elapsed ms (including batched settle waits) |
| --- | --- | --- |
| height 500 updates | 500 | 413.3999999985099 |
| measurement 500 updates | 500 | 912.5 |
| combined 500 updates | 500 | 1048.1000000014901 |

1,500 iterations tổng cộng (combined iteration đổi cả Height và một measurement). 60 checkpoints: model/scene/renderer/geometry IDs ổn định, một canvas, GPU resource counts ổn định, no idle RAF. GLB load đúng một lần trong phiên kiểm tra chính; runner mở lại trang một lần riêng để kiểm tra ordinary route, nên network report có hai requests cho hai page loads. Responsive-extremes session riêng có một GLB load cho cả 18 states.

Stress render theo batch 25 updates với reduced-motion; thêm test animation mode bình thường cho invalid/reset. Timing không phải GPU FPS benchmark. Không thấy resource growth rõ ràng trong test ngắn; không phải chứng nhận memory leak dài hạn.

## N. Responsive

1440 / 768 / 390 px: không horizontal overflow; canvas nằm đúng stage; một canvas; no debug UI trên ordinary route. Height min/max × front/side/back = 18 checks, cùng một model/renderer/scene xuyên các resize. Screenshots full-page và stage nằm cùng folder QA.

## O. Console / automated tests

1094 unit checks PASS; 765 browser checks PASS; 18 responsive extreme checks PASS. Errors 0; warnings 0; HTTP/404 0; WebGL errors 0; missing morph 0; invalid target 0 trong production load. Các unknown/nonfinite target được unit-test là bị reject.

Existing QA không bị sửa hoặc ghi lại. Các test lịch sử yêu cầu Height không deformation/v3 22 targets được giữ như checkpoint cũ; suite mới thay thế các expectation đó cho v4 integration.

Reproduce from repository root:

```text
node qa/height-production-integration/tests.mjs
node qa/height-production-integration/server.cjs
# separate terminal, while server is running
node qa/height-production-integration/run.cjs
node qa/height-production-integration/responsive.cjs
node qa/height-production-integration/report.cjs
```

## P. Files changed

Modified (9):

- `assets/js/body-visualizer/app.js`
- `assets/js/body-visualizer/debug.js`
- `assets/js/body-visualizer/glb-model.js`
- `assets/js/body-visualizer/morph-controller.js`
- `assets/js/body-visualizer/normalization.js`
- `assets/js/body-visualizer/scene.js`
- `assets/js/body-visualizer/state.js`
- `body-visualizer.html`
- `templates/pages/body-visualizer.html`

Created (67):

- `assets/js/body-visualizer/height-baselines.js`
- `assets/js/body-visualizer/height-calibration.js`
- `qa/height-production-integration/A-back.png`
- `qa/height-production-integration/A-front.png`
- `qa/height-production-integration/A-quarter.png`
- `qa/height-production-integration/A-side.png`
- `qa/height-production-integration/B-back.png`
- `qa/height-production-integration/B-front.png`
- `qa/height-production-integration/B-quarter.png`
- `qa/height-production-integration/B-side.png`
- `qa/height-production-integration/C-back.png`
- `qa/height-production-integration/C-front.png`
- `qa/height-production-integration/C-quarter.png`
- `qa/height-production-integration/C-side.png`
- `qa/height-production-integration/D-back.png`
- `qa/height-production-integration/D-front.png`
- `qa/height-production-integration/D-quarter.png`
- `qa/height-production-integration/D-side.png`
- `qa/height-production-integration/E-back.png`
- `qa/height-production-integration/E-front.png`
- `qa/height-production-integration/E-quarter.png`
- `qa/height-production-integration/E-side.png`
- `qa/height-production-integration/F-back.png`
- `qa/height-production-integration/F-front.png`
- `qa/height-production-integration/F-quarter.png`
- `qa/height-production-integration/F-side.png`
- `qa/height-production-integration/REPORT.md`
- `qa/height-production-integration/before-hashes.json`
- `qa/height-production-integration/browser-results.json`
- `qa/height-production-integration/browser.js`
- `qa/height-production-integration/checks.json`
- `qa/height-production-integration/debug.json`
- `qa/height-production-integration/edge-back-contact.png`
- `qa/height-production-integration/edge-front-contact.png`
- `qa/height-production-integration/edge-quarter-contact.png`
- `qa/height-production-integration/edge-side-contact.png`
- `qa/height-production-integration/files.json`
- `qa/height-production-integration/report.cjs`
- `qa/height-production-integration/responsive-1440-max-back.png`
- `qa/height-production-integration/responsive-1440-max-front.png`
- `qa/height-production-integration/responsive-1440-max-side.png`
- `qa/height-production-integration/responsive-1440-min-back.png`
- `qa/height-production-integration/responsive-1440-min-front.png`
- `qa/height-production-integration/responsive-1440-min-side.png`
- `qa/height-production-integration/responsive-1440.png`
- `qa/height-production-integration/responsive-390-max-back.png`
- `qa/height-production-integration/responsive-390-max-front.png`
- `qa/height-production-integration/responsive-390-max-side.png`
- `qa/height-production-integration/responsive-390-min-back.png`
- `qa/height-production-integration/responsive-390-min-front.png`
- `qa/height-production-integration/responsive-390-min-side.png`
- `qa/height-production-integration/responsive-390.png`
- `qa/height-production-integration/responsive-768-max-back.png`
- `qa/height-production-integration/responsive-768-max-front.png`
- `qa/height-production-integration/responsive-768-max-side.png`
- `qa/height-production-integration/responsive-768-min-back.png`
- `qa/height-production-integration/responsive-768-min-front.png`
- `qa/height-production-integration/responsive-768-min-side.png`
- `qa/height-production-integration/responsive-768.png`
- `qa/height-production-integration/responsive-console.json`
- `qa/height-production-integration/responsive-extremes.json`
- `qa/height-production-integration/responsive.cjs`
- `qa/height-production-integration/run.cjs`
- `qa/height-production-integration/server.cjs`
- `qa/height-production-integration/tests.mjs`
- `qa/height-production-integration/unit-results.json`
- `qa/height-production-integration/visual-review.json`

Deleted: []. Old QA files changed: []. Asset files changed: []. Git checkpoint/index không bị thay đổi; không commit/push/deploy.

## Q. Local Body Visualizer URL

http://127.0.0.1:4187/body-visualizer.html

## R. Debug URL

http://127.0.0.1:4187/body-visualizer.html?morph-debug=1

## S. Final verdict

| Gate | Result |
| --- | --- |
| unit | PASS |
| browser | PASS |
| roundTrip | PASS |
| baseline | PASS |
| calibration | PASS |
| edges | PASS |
| reset | PASS |
| performance | PASS |
| responsive | PASS |
| console | PASS |
| preservation | PASS |

**Calibrated Height production integration: PASS**

Dừng sau local production integration.