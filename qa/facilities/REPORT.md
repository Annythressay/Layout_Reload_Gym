# RELOAD – Facilities rebuild review

Ngày kiểm tra: 12/09/2026. Phạm vi: body trang Cơ sở vật chất hiện tại; không tạo route mới, không commit/push.

## Audit và section map

- Route và navigation: `facilities.html`; active state “Cơ sở vật chất”.
- Source: `templates/pages/facilities.html`, render bằng `build.cjs` vào `facilities.html`.
- CSS chung: `assets/css/style.css`; CSS mới chỉ tải trên Facilities: `assets/css/facilities.css`.
- JavaScript hiện có: `assets/js/main.js`; không thêm hoặc sửa JS trong lượt Facilities này.
- Shared shell: `templates/header.html`, `templates/footer.html`, `templates/floating-contact.html`, `templates/promo-popup.html`.
- Container chung max-width 1328px; typography Inter/Barlow Condensed; reuse `.button`, `.button-red` và Font Awesome 7.3.1 sẵn có. Không thêm CDN hoặc language switcher.
- Breakpoints riêng theo desktop-first: 1199.98, 991.98, 767.98 và 575.98px. Skill pug-teacher-patterns định hướng cấu trúc component và responsive; giữ nguyên hệ HTML template thực tế, không chuyển project sang Pug.
- Reference được dùng cho composition, hierarchy và palette: Hero chữ trái / athlete giữa / reception phải → intro centered → hai card ngang → CTA đỏ/đen → Footer hiện tại. Không lấy business data từ screenshot.

## Files

- Facilities HTML/template: `facilities.html`, `templates/pages/facilities.html`.
- CSS mới: `assets/css/facilities.css`, selector riêng `facilities-*`, `page-facilities`; không đụng CSS Home/About.
- Build: `build.cjs` thêm stylesheet có điều kiện cho Facilities. Chỉ chạy `node build.cjs facilities`.
- JS: không thay đổi trong lượt này.
- New files: CSS trên; 4 ảnh WebP trong bảng dưới; asset provenance `assets/images/facilities/FACILITIES-CAMPAIGN.md`; `qa/facilities-review.cjs`; báo cáo JSON, Markdown và screenshots trong `qa/facilities/`.
- Worktree đã có sửa đổi About/main.js từ trước; không coi các diff đó là thay đổi của Facilities.

## Hero

- Height: desktop clamp(500px, 37.5vw, 650px); tablet 510px; mobile 650px.
- Background: ảnh gym đen/charcoal mới, red signage, reception.
- Subject: nữ athlete góc sau/three-quarter, đồ tập đen, túi gym.
- Overlay: trái tối để đọc chữ, giữa/phải giữ chi tiết. Logo wall reuse official logo; ẩn logo phụ trên tablet/mobile.
- H1 duy nhất: “CƠ SỞ VẬT CHẤT”.
- Responsive: desktop text/subject tách nhau; tablet đổi crop; mobile text trên/visual dưới, không stretch.
- Tất cả UI text bằng HTML. English chỉ là decorative copy/signage được brief cho phép.

## Facility cards

- Women: border đỏ 2px, badge DÀNH CHO NỮ, 3 features, nút tròn đỏ.
- Gym & Wellness: border xám, 3 features, nút tròn xám chuyển đỏ khi hover.
- Feature icons: user, heart, dumbbell, people-group, star; arrows là fa-arrow-right.
- Links: Women → `locations.html#reload-women`; Gym → `locations.html#reload-main`. Đã click và xác nhận target tồn tại.
- Desktop hai card bằng chiều cao, image/content 47/53%; laptop 43/57%; tablet stack card với image/content 45/55%.
- Mobile ảnh trên, content dưới, giữ đầu/mặt trong crop; chiều cao card tự nhiên theo nội dung.
- Hover 200–250ms: border đỏ, ảnh scale 1.025, arrow translate 3px; reduced-motion tắt transition.
- Focus-visible rõ; icon-only link có aria-label.

## Assets

Skill imagegen tạo bộ ảnh đồng nhất riêng cho Facilities; không lấy stock hoặc ảnh cũ không liên quan. Sau đó xuất WebP tối ưu.

| New asset | Kích thước | Dung lượng |
| --- | --- | ---: |
| facilities-hero.webp | 1942 × 809 | 114,580 bytes |
| facilities-women.webp | 1086 × 1448 | 102,250 bytes |
| facilities-gym-wellness.webp | 1086 × 1448 | 99,788 bytes |
| facilities-cta.webp | 2172 × 724 | 52,610 bytes |

- Tổng: 369,228 bytes, khoảng 361 KiB.
- Reused asset: `assets/images/logo/reload-logo.png`; giữ nguyên assets trong shared Header/Footer/Promotion Popup.
- External images used: không dùng stock bên ngoài; ảnh mới là AI-generated campaign visuals, không phải ảnh xác thực địa điểm.
- Broken assets: NO trong các ảnh main đã kiểm tra ở 11 viewport.
- Đã xem ảnh và crop render: không thấy lỗi anatomy, mặt, tay hoặc thiết bị rõ ràng. Đây là kiểm tra trực quan, không phải chứng thực ảnh chụp thực tế.
- Hero fetchpriority high, không lazy. Card/CTA loading lazy. Tất cả có intrinsic dimensions; ảnh nội dung có alt, ảnh CTA trang trí alt rỗng.
- Exact prompts và provenance nằm trong `FACILITIES-CAMPAIGN.md`.

## CTA

- Primary: ĐẶT LỊCH THAM QUAN → `locations.html#contact`, dùng luồng contact hiện có.
- Promotion Popup hiện tại là popup tự mở; không có public booking-trigger riêng để gọi. Không tạo form/modal duplicate.
- Secondary: LIÊN HỆ TƯ VẤN → `https://zalo.me/0374432221`, đúng contact hiện tại.
- Mobile: hai nút full-width xếp dọc; nền tối giữ chữ rõ.

## Footer

- Reused current Footer: YES.
- Addresses preserved: YES.
  - RELOAD WOMEN: 933 Phạm Hùng, Bà Rịa, Hồ Chí Minh, Việt Nam.
  - RELOAD GYM & WELLNESS: 168 Tôn Đức Thắng, Bà Rịa, Hồ Chí Minh, Việt Nam.
- Google Maps links preserved: YES.
  - `https://maps.app.goo.gl/tBJgHBijSkqsCqBx8`
  - `https://maps.app.goo.gl/osGeqMGhhYJRpyCe7`
- Social links preserved: YES; 4 links từ Footer gốc.
- Newsletter: giữ form/email required hiện tại, không thay JS.
- Phạm vi test: xác nhận href, target/rel và markup được giữ; không xác minh dịch vụ Maps/social bên ngoài còn hoạt động, không gửi thử newsletter hay thông tin đăng ký.

## Responsive

| Viewport | Layout / overflow / assets |
| --- | --- |
| 1920 × 1080 | PASS |
| 1600 × 900 | PASS |
| 1440 × 900 | PASS |
| 1366 × 768 | PASS |
| 1280 × 720 | PASS |
| 1024 × 768 | PASS |
| 768 × 1024 | PASS |
| 430 × 932 | PASS |
| 412 × 915 | PASS |
| 390 × 844 | PASS |
| 375 × 812 | PASS |

Browser: local Chrome qua Playwright. Không horizontal overflow ở 11 viewport; một H1; đúng active nav; ảnh main load đủ; card desktop/laptop/tablet bằng chiều cao. Screenshots từng size: `facilities-{width}.png`. Xem `results.json` để có số đo và kết quả từng kiểm tra.

## Regression

- Homepage unchanged: YES, hash `index.html` và global CSS/JS giữ nguyên so với đầu lượt Facilities.
- About unchanged bởi Facilities: YES. Tuy nhiên `about.html` không byte-identical so với baseline: một chỉnh sửa riêng phát sinh đồng thời đổi `about-hero-women-cinematic.webp` sang `about-hero-women-cinematic_3.png`. Đã xác nhận chỉ substitution đó làm hash khác; giữ nguyên, không ghi đè hoặc rebuild About. About CSS không đổi trong lượt này.
- Shared Header/Footer/Floating Contact/Popup templates: hash không đổi.
- Header working: YES; mobile menu mở/đóng, search dialog mở; nav active đúng.
- Floating Contact working: YES; toggle hoạt động, fixed UI giữ nguyên.
- Popup working: YES; tự mở trong session mới, Escape đóng; chỉ có một popup.
- Internal card/contact navigation: PASS.
- Browser page errors: 0 trên trang kiểm tra.
- `git diff --check`: PASS; Git chỉ cảnh báo chuẩn hóa line endings.

## Git

- NOT STAGED bởi task này.
- NOT COMMITTED.
- NOT PUSHED.
- Giữ nguyên thay đổi có sẵn của người dùng để review.

