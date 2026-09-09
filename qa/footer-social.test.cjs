const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const expected = [
  ['https://zalo.me/0374432221', 'Liên hệ RELOAD qua Zalo', 'fa-solid fa-comment-dots', '_blank'],
  ['https://www.facebook.com/profile.php?id=100078970451357&locale=vi_VN', 'Liên hệ RELOAD qua Facebook', 'fa-brands fa-facebook-f', '_blank'],
  ['https://www.tiktok.com/@reloadgymforwomen?lang=vi-VN', 'Liên hệ RELOAD qua TikTok', 'fa-brands fa-tiktok', '_blank'],
  ['tel:0374432221', 'Gọi RELOAD theo số 037 443 2221', 'fa-solid fa-phone', null]
];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  const errors = [];
  const failedResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
    const footerItems = page.locator('.social-links a');
    const floatingItems = page.locator('.floating-contact__item');
    assert.equal(await footerItems.count(), 4, `${viewport.width}: Footer must have exactly four contact links`);
    assert.equal(await floatingItems.count(), 4, `${viewport.width}: Floating Contact must have exactly four contact links`);
    assert.equal(await page.locator('.social-links .fa-instagram, .social-links .fa-youtube').count(), 0, `${viewport.width}: stale Instagram/YouTube icon`);

    for (let index = 0; index < expected.length; index += 1) {
      const [href, label, iconClass, target] = expected[index];
      const footer = footerItems.nth(index);
      const floating = floatingItems.nth(index);
      assert.equal(await footer.getAttribute('href'), href, `${viewport.width}: Footer href ${index}`);
      assert.equal(await floating.getAttribute('href'), href, `${viewport.width}: Floating href ${index}`);
      assert.equal(await footer.getAttribute('aria-label'), index === 0 ? 'Zalo' : label, `${viewport.width}: Footer aria-label ${index}`);
      assert.equal(await floating.getAttribute('aria-label'), label, `${viewport.width}: Floating aria-label ${index}`);
      assert.equal(await footer.getAttribute('target'), target, `${viewport.width}: Footer target ${index}`);
      assert.equal(await footer.getAttribute('rel'), target ? 'noopener noreferrer' : null, `${viewport.width}: Footer rel ${index}`);
      assert.equal(await footer.locator('i').getAttribute('class'), iconClass, `${viewport.width}: Footer icon ${index}`);
      assert.equal(await footer.locator('i').getAttribute('aria-hidden'), 'true');
      const box = await footer.boundingBox();
      assert.ok(box && box.width === box.height, `${viewport.width}: Footer icon ${index} is not circular`);
      assert.ok(['flex', 'inline-flex'].includes(await footer.evaluate(element => getComputedStyle(element).display)), `${viewport.width}: Footer social link is not flex-aligned`);
    }

    const footerBoxes = await footerItems.evaluateAll(items => items.map(item => item.getBoundingClientRect().toJSON()));
    footerBoxes.forEach(box => assert.ok(box.x >= 0 && box.x + box.width <= viewport.width, `${viewport.width}: Footer icon outside viewport`));
    if (viewport.width >= 768) {
      assert.ok(Math.max(...footerBoxes.map(box => box.y)) - Math.min(...footerBoxes.map(box => box.y)) < 1, `${viewport.width}: Footer icons are not on one row`);
    }
  }

  assert.deepEqual(errors, []);
  assert.deepEqual([...new Set(failedResponses)], []);
  await browser.close();
  console.log('Footer social links match Floating Contact at desktop and mobile widths.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
