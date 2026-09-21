# RELOAD — Calibrated Hip production integration (LOCAL)

## A. Current architecture

Đã đọc app.js, state.js, scene.js, model.js, glb-model.js, morph-controller.js, normalization.js, debug.js; production HTML/template và QA calibration/mapping tests.

- app.js quản lý form current/goal, optional empty/invalid fields, reset và read-only QA inspection.
- state.js định nghĩa field `hip` (Vòng hông, cm), validation bounds, form defaults và BMI.
- normalization.js tải/cache calibration, compile profiles, clamp và piecewise interpolation giữa samples. Trước phase này có 6 vùng và hip-scale luôn zero; Hip chưa deform model.
- morph-controller.js bind morphTargetDictionary theo tên, mutual exclusion, apply và reset production weights; phenotype giữ exported weights.
- glb-model.js cache GLB bytes; scene.js dùng một model/renderer, morph animation và scissor current/goal, render-on-demand.
- debug.js chỉ mount với ?morph-debug=1. model.js/calculateBodyMorph là legacy, không import vào GLB pipeline.
- Tái sử dụng architecture và engine geometry cũ; không tạo production architecture song song.

## B. GLB v3 migration

Loader đổi từ male-mpfb-production-morph-v2.glb sang **3D/male-mpfb-production-morph-v3.glb**. Network HTTP 200; Three.js r180. V3 load một lần mỗi document, không refetch/recreate khi input/reset. Hai request trong responsive-console.json thuộc hai navigation riêng: audit route và route thường. GLB v2/v3 không sửa hoặc xóa.

## C. Morph dictionary verification

22 targets = 4 phenotype + 18 production. Production controller thêm key hip → measure-hips-circ; toàn bộ binding tra dictionary, không hard-code index. Unit test đảo thứ tự dictionary PASS.

```json
{
  "$md-$as-$ma-$yn": 0,
  "$md-$ca-$ma-$yn": 1,
  "$md-$af-$ma-$yn": 2,
  "$md-universal-$ma-$yn-$av$mu-$av$wg": 3,
  "hip-scale-horiz-incr": 4,
  "hip-scale-horiz-decr": 5,
  "hip-scale-depth-incr": 6,
  "hip-scale-depth-decr": 7,
  "measure-waist-circ-incr": 8,
  "measure-waist-circ-decr": 9,
  "measure-bust-circ-incr": 10,
  "measure-bust-circ-decr": 11,
  "measure-shoulder-dist-incr": 12,
  "measure-shoulder-dist-decr": 13,
  "measure-upperarm-circ-incr": 14,
  "measure-upperarm-circ-decr": 15,
  "measure-thigh-circ-incr": 16,
  "measure-thigh-circ-decr": 17,
  "measure-calf-circ-incr": 18,
  "measure-calf-circ-decr": 19,
  "measure-hips-circ-incr": 20,
  "measure-hips-circ-decr": 21
}
```

Missing morph = 0; invalid targets ở luồng sử dụng = 0. Negative tests chủ động thử unknown/nonfinite và được reject đúng.

## D. Hip calibration integration

normalization.js giữ nguồn sáu vùng cũ qa/body-measurement-calibration/measurements.json và bổ sung qa/hip-measurement-calibration/measurements.json, đọc song song một lần, merge **hips: hip.hips** rồi compile chung. Không copy số làm tròn, không ghi đè hai JSON nguồn hoặc QA history. Thêm calibratedFields.hip = 'hips', nên existing precision/validation/empty/reset flow tự áp dụng cho Hip.

## E. Hip cm → morph mapping

Base = **97.00190919505901 cm**. Nhỏ hơn base dùng decr; lớn hơn base dùng incr; bằng base cả hai zero. Tái sử dụng measurementCmToMorphWeight với từng segment samples, không fit tuyến tính toàn range. Debug branch dùng nhãn hiện có 'base' cho baseline.

Bảy trường: chest→bust, waist→waist, hip→hips, shoulder→shoulder, arm→upperarm, thigh→thigh, calf→calf. Debug cung cấp input/base/branch/weight/clamped và applied target weights. Ví dụ Hip 120 cm: giữ input 120, effective 116.26040557792201, incr=1, decr=0, clamped=true.

## F. Clamp behavior

Min **87.40729083173824**, max **116.26040557792201 cm**. Ngoài calibration range nhưng trong form bounds 60–170: giữ cm input và clamp geometry -1/+1, không extrapolate. Ngoài form bounds: invalid → state null → cả hai morph zero ngay. Empty/NaN/nonfinite/invalid mapping zero; không inject baseline vào field. Initial default Hip 92 cm vẫn giữ UX cũ, nay có tác động calibrated; Reset làm trống Hip cùng sáu vùng khác.

## G. Nine calibration-point tests

| Input cm | Expected signed weight | Actual weight | Measured mesh cm | Error cm |
| --- | --- | --- | --- | --- |
| 87.407290832 | -1 | -1 | 87.407290832 | 0 |
| 89.804488799 | -0.75 | -0.75 | 89.804488799 | 0 |
| 92.202697915 | -0.5 | -0.5 | 92.202697915 | 0 |
| 94.601856557 | -0.25 | -0.25 | 94.601856557 | 0 |
| 97.001909195 | 0 | 0 | 97.001909195 | 0 |
| 101.812476983 | 0.25 | 0.25 | 101.812476983 | 0 |
| 106.625920630 | 0.5 | 0.5 | 106.625920630 | 0 |
| 111.441972689 | 0.75 | 0.75 | 111.441972689 | 0 |
| 116.260405578 | 1 | 1 | 116.260405578 | 0 |

9/9 Hip samples PASS; 8/8 midpoint segments PASS qua unit và UI. Clamp dưới/trên range, empty, invalid, mutual exclusion hai chiều, phenotype và reset PASS. 222 unit assertions dùng regression suite trước được mở rộng trong thư mục QA mới; 16 controller tests bổ sung.

## H. Geometry re-measurement

UI input → state → calibration mapping → animation settles → actual deformed mesh snapshot → triangle-plane closed contour → perimeter cm. Hip dùng đúng fixed plane từ QA calibration (Y = 0.8871762661054914 m). Các vùng khác dùng landmarks/locate/measure từ engine cũ.

Hip max absolute error = **0 cm**, tolerance 1e-6 cm. Không dùng bounding box/ellipse để đo circumference. Phép đo cô lập từng vùng sau Reset: không khẳng định các cm giữ nguyên khi chồng nhiều morph vùng lân cận.

## I. Six existing measurement regression

| Field | Sample count | Max |error| cm |
| --- | --- | --- |
| waist | 9 | 0 |
| chest | 9 | 0 |
| shoulder | 9 | 0 |
| arm | 9 | 0 |
| thigh | 9 | 0 |
| calf | 9 | 0 |

54/54 existing geometry samples PASS trên v3; dữ liệu full precision của sáu profile không đổi. Regression suite gốc được đọc và sao chép/mở rộng vào QA mới; không chạy lại assertion cũ “Hip không deform” vì yêu cầu phase này đã thay đổi.

## J. Reset

Reset UI trả toàn bộ 18 weights về zero, phenotype giữ nguyên, camera/target giữ nguyên; model/geometry IDs không đổi; không reload GLB hoặc reset renderer. Max reset vertex deviation = **0 m**; sau stress animated là **0 m**.

## K. Phenotype preservation

Exported weights: [0.3267660140991211, 0.3267660140991211, 0.3267660140991211, 0.9901999831199646]. Giữ nguyên qua tất cả geometry samples, animation đổi nhánh, current/goal/compare và reset.

## L. Old hip-scale status

Cả bốn targets hip-scale-horiz/depth incr/decr còn trong GLB và controller. mapMeasurements luôn phát hipHorizontal=0, hipDepth=0; input Vòng hông chỉ kích hoạt measure-hips-circ. Kiểm tra zero ở samples và trong 120 frames animation PASS; test controller chứng minh apply cũng clear legacy hip-scale đã active trước đó.

## M. Height/Weight status

Height/Weight/Inseam không đưa vào mapping geometry; thay các input không đổi influences. BMI vẫn hoạt động (180 cm, 80 kg → 24.7). Không sửa model.scale/scale.y hoặc rewrite vertex buffer để giả lập thông số. Không đổi code legacy.

## N. Responsive

| Viewport width | Scroll width | Canvas width × height | Canvas count | WebGL error |
| --- | --- | --- | --- | --- |
| 1440 | 1440 | 841.859375 × 520 | 1 | 0 |
| 768 | 768 | 664.546875 × 400 | 1 | 0 |
| 390 | 390 | 332 × 320 | 1 | 0 |

Đã xem ảnh responsive-1440.png, responsive-768.png, responsive-390.png: không overflow ngang, model/canvas/form hiển thị hợp lý; layout và CSS không đổi. QA panel không xuất hiện ở route thường. Chỉ sửa câu mô tả để ghi đúng rằng Hip hiện hỗ trợ deformation.

## O. Performance

- 432 browser checks PASS, 63 geometry samples.
- 700 input updates across 7 fields: stable model/geometry/canvas IDs và GPU allocations.
- 120 animated updates đổi tăng/giảm Hip: median 11.10 ms/frame, p95 11.80 ms, max 13.50 ms; frames >50 ms = 0. Đây là đo trong Edge headless trên máy hiện tại, không phải cam kết FPS mọi thiết bị.
- Một renderer theo source createScene; cùng canvas/context, model và geometry được tái sử dụng. Không allocation geometry ở input path. Indices sau stress giống trước; geometry reset đúng baseline. Source input chỉ thay influences, không ghi position buffers.
- GPU memory counters không tăng; idle renderCount không tăng và pendingFrame=false. RAF có guard duy nhất; không duplicate loop. Đây là stress test hữu hạn, không chứng minh không có mọi leak dài hạn.
- Independent Hip current=min/goal=max trong compare PASS.

## P. Console

Errors = 0; warnings = 0; HTTP errors/404 = 0; WebGL errors = 0. Missing morph = 0; invalid target ở production flow = 0.

## Q. Files changed

Modified trong phase này (khác với các thay đổi đã tồn tại trước task):

- `assets/js/body-visualizer/debug.js`
- `assets/js/body-visualizer/glb-model.js`
- `assets/js/body-visualizer/morph-controller.js`
- `assets/js/body-visualizer/normalization.js`
- `body-visualizer.html`
- `templates/pages/body-visualizer.html`

Created:

- `qa/hip-production-integration/before-hashes.json`
- `qa/hip-production-integration/browser-results.json`
- `qa/hip-production-integration/browser.js`
- `qa/hip-production-integration/controller-results.json`
- `qa/hip-production-integration/controller-tests.mjs`
- `qa/hip-production-integration/hip-flow.cjs`
- `qa/hip-production-integration/hip-flow.json`
- `qa/hip-production-integration/prepare.cjs`
- `qa/hip-production-integration/report.cjs`
- `qa/hip-production-integration/responsive-1440.png`
- `qa/hip-production-integration/responsive-390.png`
- `qa/hip-production-integration/responsive-768.png`
- `qa/hip-production-integration/responsive-console.json`
- `qa/hip-production-integration/run-browser.cjs`
- `qa/hip-production-integration/server.cjs`
- `qa/hip-production-integration/tests.mjs`
- `qa/hip-production-integration/unit-results.json`
- `qa/hip-production-integration/files.json`
- `qa/hip-production-integration/REPORT.md`

Hash trước/sau 752 tệp: chỉ đúng 6 tệp cho phép thay đổi, 746 tệp còn lại giữ nguyên, toàn bộ QA history và hai GLB giữ nguyên. Không sửa state/app/scene/CSS ở phase này.

## R. Local URL

[Body Visualizer](http://127.0.0.1:4180/body-visualizer.html) · [QA debug](http://127.0.0.1:4180/body-visualizer.html?morph-debug=1). Server: node qa/hip-production-integration/server.cjs.

Re-run: node qa/hip-production-integration/tests.mjs; node qa/hip-production-integration/controller-tests.mjs; node qa/hip-production-integration/run-browser.cjs; node qa/hip-production-integration/hip-flow.cjs; node qa/hip-production-integration/report.cjs. prepare.cjs chỉ dùng khởi tạo, không cần chạy lại.

## S. Final verdict

**Calibrated Hip production integration: PASS**

Chỉ local integration. Không commit, push hoặc deploy.
