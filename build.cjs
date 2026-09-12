const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, 'templates', name + '.html'), 'utf8');
const promoPopup = read('promo-popup');
const floatingContact = read('floating-contact');
// Floating contact is the canonical source; footer links are generated from it.
const socialLinks = [...floatingContact.matchAll(/<a class="floating-contact__item"([^>]+)>\s*<span[^>]+><i class="([^"]+)"/g)].map(([, attributes, icon]) => {
  const label = icon.includes('fa-comment-dots') ? 'Zalo' : null;
  attributes = attributes.replace(/\s+tabindex="-1"/, '');
  if (label) attributes = attributes.replace(/aria-label="[^"]+"/, `aria-label="${label}"`);
  return `<a${attributes}><i class="${icon}" aria-hidden="true"></i></a>`;
}).join('\n');
if (!socialLinks || (socialLinks.match(/<a /g) || []).length !== 4) throw new Error('Expected four floating contacts');
const footer = read('footer').replace(/(<div class="social-links">)[\s\S]*?(<\/div>)/, `$1\n${socialLinks}\n$2`);
const pages = {
  index: ['RELOAD Gym & Wellness', 'Khám phá RELOAD với hai chi nhánh, không gian tập luyện hiện đại và cộng đồng giúp bạn mạnh mẽ hơn mỗi ngày.'],
  about: ['Giới thiệu RELOAD | RELOAD Gym & Wellness', 'Tìm hiểu triết lý, cơ sở vật chất, huấn luyện viên và cộng đồng RELOAD Gym & Wellness.'],
  facilities: ['Cơ sở vật chất | RELOAD Gym & Wellness', 'Khám phá khu sức mạnh, cardio, tạ tự do, functional, boxing, studio và chăm sóc sức khỏe tại RELOAD.'],
  services: ['Dịch vụ | RELOAD Gym & Wellness', 'Khám phá phòng gym, huấn luyện cá nhân, lớp tập nhóm, boxing và chăm sóc sức khỏe tại RELOAD.'],
  'class-schedule': ['Lịch lớp | RELOAD Gym & Wellness', 'Khám phá lịch lớp hằng tuần tại RELOAD gồm yoga, HIIT, boxing, sức mạnh và Zumba.'],
  membership: ['Gói tập | RELOAD Gym & Wellness', 'So sánh các gói tập theo tháng, 6 tháng và 12 tháng cùng quyền lợi đi kèm tại RELOAD.'],
  locations: ['Chi nhánh | RELOAD Gym & Wellness', 'Khám phá RELOAD WOMEN và RELOAD GYM & WELLNESS, đồng thời đặt lịch tham quan chi nhánh.'],
  blog: ['Tin tức | RELOAD Gym & Wellness', 'Theo dõi tin tức tập luyện, khoảnh khắc cộng đồng, sự kiện và câu chuyện sắp ra mắt tại RELOAD.']
};
const selectedPages = process.argv.slice(2);
if (selectedPages.some(name => !pages[name])) throw new Error('Unknown page name');
for (const [name, [title, description]] of Object.entries(pages)) {
  if (selectedPages.length && !selectedPages.includes(name)) continue;
  const header = read('header').replace(`href="${name}.html"`, `href="${name}.html" class="active" aria-current="page"`);
  // The header logo also targets index.html; active state belongs only to navigation.
  const normalizedHeader = header.replace('class="logo" href="index.html" class="active" aria-current="page"', 'class="logo" href="index.html"');
  const activeHeader = name === 'index' ? normalizedHeader.replace('<a href="index.html"', '<a class="active" aria-current="page" href="index.html"') : normalizedHeader;
  const aboutStylesheet = name === 'about' ? '  <link rel="stylesheet" href="assets/css/about.css">\\n' : '';
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080808">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="icon" type="image/png" href="assets/images/logo/reload-logo.png">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.3.1/css/all.min.css">
  <link rel="stylesheet" href="assets/css/style.css">
${aboutStylesheet}  <script src="assets/js/main.js" defer></script>
</head>
<body class="page-${name} ${name === 'index' ? 'home-page' : 'inner-page'}">
<a class="skip-link" href="#main">Đi đến nội dung chính</a>
${activeHeader}
<main id="main">
${read('pages/' + name)}
</main>
${name === 'about' ? '' : promoPopup}
${footer}
${floatingContact}
${read('dialogs')}
</body>
</html>
`;
  fs.writeFileSync(path.join(root, name + '.html'), html);
}
console.log('Built ' + (selectedPages.length ? selectedPages.join(', ') : 'all eight pages') + ' from shared templates.');
