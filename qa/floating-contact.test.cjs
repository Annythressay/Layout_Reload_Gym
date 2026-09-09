const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  const errors = [];
  const failedResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  const viewports = [
    [1920, 1080],
    [1440, 900],
    [1366, 768],
    [1024, 768],
    [768, 1024],
    [390, 844]
  ];
  const expectedLinks = [
    ['https://zalo.me/0374432221', 'Liên hệ RELOAD qua Zalo', true],
    ['https://www.facebook.com/profile.php?id=100078970451357&locale=vi_VN', 'Liên hệ RELOAD qua Facebook', true],
    ['https://www.tiktok.com/@reloadgymforwomen?lang=vi-VN', 'Liên hệ RELOAD qua TikTok', true],
    ['tel:0374432221', 'Gọi RELOAD theo số 037 443 2221', false]
  ];

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:4173/index.html');
    await page.waitForTimeout(300);
    const promoClose = page.locator('[data-reload-promo-close]').first();
    if (await promoClose.isVisible()) await promoClose.click();

    const contact = page.locator('[data-floating-contact]');
    const toggle = contact.locator('[data-floating-contact-toggle]');
    const menu = contact.locator('[data-floating-contact-menu]');
    const items = contact.locator('.floating-contact__item');
    assert.equal(await contact.count(), 1);
    assert.equal(await page.locator('.floating-contact__label').count(), 0, `${width}: floating contact labels should be removed`);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await toggle.getAttribute('aria-label'), 'Mở menu liên hệ');
    assert.equal(await menu.getAttribute('aria-hidden'), 'true');
    assert.equal(await items.count(), 4);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);

    for (let y = 0; !(await toggle.isVisible()) && y < 10000; y += 100) {
      await page.evaluate(y => window.scrollTo({top: y, behavior: 'instant'}), y);
      await page.waitForTimeout(50);
    }
    const initialBox = await contact.boundingBox();
    assert.ok(initialBox.x >= 0 && initialBox.x + initialBox.width <= width && initialBox.y >= 0 && initialBox.y + initialBox.height <= height, `${width}: closed menu outside viewport`);
    assert.equal(await contact.evaluate(element => getComputedStyle(element).position), 'fixed');
    assert.equal(await contact.evaluate(element => getComputedStyle(element).zIndex), '90');
    assert.equal(await page.locator('.reload-promo').evaluate(element => getComputedStyle(element).zIndex), '1000');

    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await toggle.getAttribute('aria-label'), 'Đóng menu liên hệ');
    assert.equal(await menu.getAttribute('aria-hidden'), 'false');
    assert.equal(await items.first().getAttribute('tabindex'), '0');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Liên hệ RELOAD qua Zalo');
    const openBox = await contact.boundingBox();
    assert.ok(openBox.x >= 0 && openBox.x + openBox.width <= width && openBox.y >= 0 && openBox.y + openBox.height <= height, `${width}: open menu outside viewport`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const axis = await page.evaluate(() => {
      const toggle = document.querySelector('[data-floating-contact-toggle]').getBoundingClientRect();
      return [...document.querySelectorAll('.floating-contact__item')].map(item => {
        const box = item.querySelector('.floating-contact__icon').getBoundingClientRect();
        return Math.abs((box.left + box.width / 2) - (toggle.left + toggle.width / 2));
      });
    });
    axis.forEach(delta => assert.ok(delta < 1, `${width}: contact icon is off the toggle axis by ${delta}px`));

    for (let index = 0; index < expectedLinks.length; index += 1) {
      const item = items.nth(index);
      const [href, label, opensNewTab] = expectedLinks[index];
      assert.equal(await item.getAttribute('href'), href);
      assert.equal(await item.getAttribute('aria-label'), label);
      assert.equal(await item.getAttribute('target'), opensNewTab ? '_blank' : null);
      assert.equal(await item.getAttribute('rel'), opensNewTab ? 'noopener noreferrer' : null);
      const itemBox = await item.boundingBox();
      assert.ok(itemBox.x >= 0 && itemBox.x + itemBox.width <= width && itemBox.y >= 0 && itemBox.y + itemBox.height <= height, `${width}: item ${index} outside viewport`);
    }

    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.click();
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement?.matches('[data-floating-contact-toggle]')), true);
    await toggle.click();
    await page.locator('.news-section__title').click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');

    const beforeScroll = await contact.evaluate(e => ({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y}));
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(50);
    const afterScroll = await contact.evaluate(e => ({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y}));
    assert.equal(await contact.evaluate(e=>e.hasAttribute('data-obscured')),true,'Footer contacts remain unobscured');
    assert.ok(Math.abs(beforeScroll.x - afterScroll.x) < 1 && Math.abs(beforeScroll.y - afterScroll.y) < 1, `${width}: contact did not stay fixed`);
  }

  for (const path of ['about.html', 'facilities.html', 'services.html', 'class-schedule.html', 'membership.html', 'locations.html', 'blog.html']) {
    await page.goto(`http://127.0.0.1:4173/${path}`);
    assert.equal(await page.locator('[data-floating-contact]').count(), 1, `${path}: missing floating contact`);
  }

  assert.deepEqual(errors, []);
  assert.deepEqual(failedResponses, []);
  await browser.close();
  console.log('Floating contact menu, links, accessibility, z-index and responsive bounds passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
