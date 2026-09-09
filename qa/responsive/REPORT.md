# RELOAD — Responsive audit & refactor

Hoàn tất trên cả 8 trang: Home, About, Facilities, Services, Class Schedule, Membership, Locations và Blog. BMI nằm trên Home; contact nằm trong Locations. Không có Blog Detail, Contact hoặc BMI page riêng. Map hiện là nút mở thông tin, không có iframe map trong source.

## Files

- `assets/css/style.css`: refactor rule gốc, tổ chức base và các tier responsive chung.
- `assets/js/main.js`: mobile navigation và chống floating-contact che nội dung.
- `build.cjs`: dùng logo hiện có làm favicon, loại bỏ request favicon 404.
- Build lại `index.html`, `about.html`, `facilities.html`, `services.html`, `class-schedule.html`, `membership.html`, `locations.html`, `blog.html`.
- `README.md`, test responsive mới và cập nhật test contact/video theo hành vi responsive.
- Không đổi nội dung, font, ảnh, logo hoặc URL contact. Không thêm dependency production.

## Breakpoints

Desktop ≥1200px; laptop ≤1199.98px; tablet ≤991.98px; mobile landscape ≤767.98px; mobile ≤575.98px. Giữ các query chiều cao/orientation riêng cho popup và prefers-reduced-motion.

## Phát hiện và xử lý

- Baseline chưa có page overflow trong matrix đã đo, nhưng CTA/header/footer còn vùng bấm nhỏ (28–38px), hero CTA mobile chỉ 8px, newsletter 10px dễ zoom trên mobile. Tăng vùng bấm liên quan lên 44px; field mobile/tablet lên 16px.
- Hero còn height 480/550px bị override bằng rule phía cuối. Loại bỏ các height này; tablet/mobile chạy theo nội dung. Bỏ nhánh branding/pagination trang trí ở tablet và khoảng margin 104px chỉ dùng để né chúng; video về normal flow với margin 32px.
- Membership, Blog và philosophy vẫn 3 cột ở tablet. Chuyển 2 cột tablet, 1 cột mobile. Services/Facilities/quick cards và footer mobile được stack; testimonials giữ điều hướng để đọc các thành viên còn lại.
- Class schedule mobile co 4 cột quá nhỏ: giữ tab ngày, xếp tên lớp và phòng thành hai dòng; giờ và Book ở hai bên. Tab ngày cuộn cục bộ khi thiếu chiều ngang.
- Branch card có nội dung absolute và height cố định: mobile chuyển copy sang flow trong grid, card height auto/min-height 235px. Ảnh vẫn là layer nền, không cắt content.
- Ảnh detail/service/location trên màn nhỏ dùng aspect-ratio 3:2 và height auto thay các height 190/220/240/270/280/300px khi phù hợp; desktop framing giữ nguyên.
- Video modal mobile có padding 16px hai bên, nút đóng 44px luôn trong viewport.
- Mobile menu có max-height theo 100dvh, cuộn nội bộ, khóa cuộn body, đóng khi chọn link/ESC/click ngoài và khi đổi sang desktop. Tab được giữ trong header lúc menu mở.
- Floating-contact giữ tọa độ desktop, giảm toggle 48px trên tablet/mobile; item 44px. Khi đóng, shortcut tạm ẩn nếu chồng chữ, CTA, video hoặc footer; xuất hiện lại ở vùng trống. Menu được người dùng mở vẫn có thể thao tác; footer luôn giữ đủ 4 contact.
- Không dùng overflow-x:hidden cho html/body. Overflow cục bộ chỉ dành cho ảnh/card, news carousel, tab ngày và decorative element.

## CSS cleanup

37 media blocks còn 12 khối không trùng điều kiện, gồm 4 tier chính. Đưa correction Hero vào rule gốc; bỏ duplicate home hero height/padding, logo transform/margin âm bị vô hiệu hóa và rule :has dùng để đè height cũ. Xóa 2 declaration bị shadow trong cùng selector/media context. Giữ fallback vh/dvh và reduced-motion. Không xóa component có thể còn được dùng.

## Kiểm chứng

- **320 layout cases**: 8 trang × 40 viewport, trong đó 20 size có ảnh toàn trang và 20 width trung gian.
- Width chính: 1920, 1600, 1440, 1366, 1280, 1200, 1024, 991, 834, 768, 767, 575, 430, 414, 390, 375, 360, 320; thêm 844×390 và 667×375.
- Width trung gian: 1300, 1199, 1100, 1050, 1000, 992, 950, 900, 850, 800, 750, 700, 650, 600, 576, 550, 500, 450, 400, 350.
- 14 kích thước kiểm tra tương tác nav/video/BMI/popup/search/footer. 56 lượt trang × width, tổng **753 vị trí cuộn**, không floating-contact che nội dung được kiểm tra.
- Test hồi quy sẵn có: 40 layout cases/8 trang; popup 21 viewports; schedule 7 ngày; carousel/filter/gallery; floating contact; footer links; video source và đóng modal.
- 160 ảnh toàn trang: [Mở gallery](gallery.html). [Layout summary](after/summary.json), [Interactions](interactions.json), [Scrolling](scrolling.json), [Desktop image comparison](desktop-visual.json).

| Width yêu cầu báo cáo | 8 trang | Overflow | JS/console |
|---|---|---|---|
|1440|Đạt|Không|Không|
|1024|Đạt|Không|Không|
|768|Đạt|Không|Không|
|430|Đạt|Không|Không|
|375|Đạt|Không|Không|
|320|Đạt|Không|Không|

Desktop section/header/Hero geometry không đổi ở 1920/1440/1200px; so ảnh desktop không thấy thay đổi layout ngoài hành vi contact tránh che nội dung. Không có page tồn tại nào bỏ sót hoặc còn bị chặn. Kiểm thử tự động bằng Chromium/Edge với viewport emulation; chưa chạy trên thiết bị iOS/Android vật lý. URL fbcdn vẫn phát được (HTTP 206), tiếp tục dùng chung RELOAD_VIDEO_URL và có thể hết hạn theo nguồn.

## Chạy lại

Tại thư mục reload-gym, chạy server bằng `node server.cjs`, sau đó:

- `node qa/responsive-audit.cjs after`
- `node qa/responsive-interactions.cjs`
- `node qa/responsive-scroll.cjs`
- `node qa.cjs`

Baseline source và ảnh trong `qa/responsive/before` chỉ phục vụ đối chiếu, không phải source production.
