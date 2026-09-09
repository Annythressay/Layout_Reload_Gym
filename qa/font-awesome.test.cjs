const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = 'http://127.0.0.1:4173';
const cdnUrl = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.3.1/css/all.min.css';
const pages = ['index.html', 'about.html', 'facilities.html', 'services.html', 'class-schedule.html', 'membership.html', 'locations.html', 'blog.html'];
const viewports = [[1920, 1080], [1440, 900], [1366, 768], [1024, 768], [768, 1024], [390, 844]];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  const errors = [];
  const failedResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const path of pages) {
      await page.goto(`${baseUrl}/${path}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      const headState = await page.evaluate(expected => {
        const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')];
        const exact = links.filter(link => link.href === expected);
        return {
          count: exact.length,
          externalIndex: links.indexOf(exact[0]),
          localIndex: links.findIndex(link => link.getAttribute('href') === 'assets/css/style.css')
        };
      }, cdnUrl);
      assert.equal(headState.count, 1, `${path} ${width}: Font Awesome CDN must occur once`);
      assert.ok(headState.externalIndex < headState.localIndex, `${path} ${width}: project CSS must follow Font Awesome`);
      assert.equal(await page.locator('svg, use, symbol').count(), 0, `${path} ${width}: legacy SVG icon found`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${path} ${width}: horizontal overflow`);

      const iconAudit = await page.locator('i[class*="fa-"]').evaluateAll(icons => icons.map(icon => {
        const box = icon.getBoundingClientRect();
        const style = getComputedStyle(icon, '::before');
        return {
          className: icon.className,
          width: box.width,
          height: box.height,
          display: getComputedStyle(icon).display,
          hasRect: icon.getClientRects().length > 0,
          content: style.content,
          family: style.fontFamily
        };
      }));
      assert.ok(iconAudit.length > 0, `${path} ${width}: no Font Awesome icons`);
      for (const icon of iconAudit) {
        if (icon.display === 'none' || !icon.hasRect) continue;
        assert.ok(icon.width > 0 && icon.height > 0, `${path} ${width}: zero-size ${icon.className}`);
        assert.notEqual(icon.content, 'none', `${path} ${width}: missing glyph ${icon.className}`);
        assert.match(icon.family, /Font Awesome/i, `${path} ${width}: wrong font for ${icon.className}`);
      }

      if (path !== 'index.html') continue;
      const promoClose = page.locator('[data-reload-promo-close]').first();
      if (await promoClose.isVisible()) await promoClose.click();

      await page.locator('.search-toggle').click();
      assert.equal(await page.locator('#search-dialog').evaluate(dialog => dialog.open), true, `${width}: search did not open`);
      assert.equal(await page.locator('#search-results .fa-arrow-right').count() > 0, true, `${width}: dynamic search arrows missing`);
      await page.locator('#search-dialog .dialog-close').click();

      if (width <= 991) {
        const menu = page.locator('.menu-toggle');
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true', `${width}: menu did not open`);
        assert.equal(await menu.locator('.menu-toggle__open').evaluate(el => getComputedStyle(el).display), 'none', `${width}: bars remained visible`);
        assert.notEqual(await menu.locator('.menu-toggle__close').evaluate(el => getComputedStyle(el).display), 'none', `${width}: xmark missing`);
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false', `${width}: menu did not close`);
      }

      const contactToggle = page.locator('[data-floating-contact-toggle]');
      await contactToggle.click();
      assert.equal(await contactToggle.getAttribute('aria-expanded'), 'true', `${width}: contact menu did not open`);
      assert.equal(await page.locator('.floating-contact__item i').count(), 4, `${width}: contact icons incomplete`);
      await page.keyboard.press('Escape');

      const galleryNext = page.locator('[data-news-image-next]').first();
      const beforeCounter = await page.locator('[data-news-image-counter]').first().textContent();
      await galleryNext.click();
      const afterCounter = await page.locator('[data-news-image-counter]').first().textContent();
      assert.notEqual(afterCounter, beforeCounter, `${width}: gallery chevron did not work`);
    }
  }

  assert.deepEqual(errors, [], `JavaScript errors: ${errors.join(' | ')}`);
  assert.deepEqual([...new Set(failedResponses)], [], `Failed responses: ${[...new Set(failedResponses)].join(' | ')}`);
  await browser.close();
  console.log('Font Awesome migration passed on 8 pages at 1920/1440/1366/1024/768/390 widths.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
