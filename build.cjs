const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = name => fs.readFileSync(path.join(root, 'templates', name + '.html'), 'utf8');
const promoPopup = read('promo-popup');
const pages = {
  index: ['RELOAD Gym & Wellness', 'Discover RELOAD: two branches, modern training spaces and a community for a stronger you.'],
  about: ['About RELOAD | RELOAD Gym & Wellness', 'Meet RELOAD Gym & Wellness: our philosophy, facilities, coaches and community.'],
  facilities: ['Facilities | RELOAD Gym & Wellness', 'Explore RELOAD strength, cardio, free weight, functional, boxing, studio and wellness areas.'],
  services: ['Services | RELOAD Gym & Wellness', 'Explore gym access, personal training, group classes, boxing and wellness at RELOAD.'],
  'class-schedule': ['Class Schedule | RELOAD Gym & Wellness', 'Explore the RELOAD weekly class timetable, including yoga, HIIT, boxing, strength and Zumba.'],
  membership: ['Membership | RELOAD Gym & Wellness', 'Compare monthly, six-month and twelve-month RELOAD memberships and included benefits.'],
  locations: ['Locations | RELOAD Gym & Wellness', 'Discover RELOAD Women and the RELOAD Gym & Wellness main club, and plan a branch tour.'],
  blog: ['Life at RELOAD | RELOAD Gym & Wellness', 'Follow RELOAD training, community moments, news, events and upcoming stories.']
};
for (const [name, [title, description]] of Object.entries(pages)) {
  const header = read('header').replace(`href="${name}.html"`, `href="${name}.html" class="active" aria-current="page"`);
  // The header logo also targets index.html; active state belongs only to navigation.
  const normalizedHeader = header.replace('class="logo" href="index.html" class="active" aria-current="page"', 'class="logo" href="index.html"');
  const activeHeader = name === 'index' ? normalizedHeader.replace('<a href="index.html"', '<a class="active" aria-current="page" href="index.html"') : normalizedHeader;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080808">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="stylesheet" href="assets/css/style.css">
  <script src="assets/js/main.js" defer></script>
</head>
<body class="page-${name} ${name === 'index' ? 'home-page' : 'inner-page'}">
<a class="skip-link" href="#main">Skip to content</a>
${read('icons')}
${activeHeader}
<main id="main">
${read('pages/' + name)}
</main>
${promoPopup}
${read('footer')}
${read('dialogs')}
</body>
</html>
`;
  fs.writeFileSync(path.join(root, name + '.html'), html);
}
console.log('Built eight static pages from shared header, footer, icons and dialogs.');
