const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const resultPath = path.join(process.env.TEMP, 'reload-floating-contact-results.json');

const viewports = [
  [1920, 1080], [1440, 900], [1366, 768], [1024, 768],
  [768, 1024], [430, 932], [390, 844], [375, 812]
];
const expectedLinks = [
  ['https://zalo.me/0374432221', 'Liên hệ RELOAD qua Zalo', true],
  ['https://www.facebook.com/profile.php?id=100078970451357&locale=vi_VN', 'Liên hệ RELOAD qua Facebook', true],
  ['https://www.tiktok.com/@reloadgymforwomen?lang=vi-VN', 'Liên hệ RELOAD qua TikTok', true],
  ['tel:0374432221', 'Gọi RELOAD theo số 037 443 2221', false]
];

async function contactState(page) {
  return page.evaluate(() => {
    const contact = document.querySelector('.floating-contact');
    const toggle = contact.querySelector('.floating-contact__toggle');
    const rect = toggle.getBoundingClientRect();
    const style = getComputedStyle(contact);
    return {
      count: document.querySelectorAll('.floating-contact').length,
      position: style.position,
      visibility: style.visibility,
      display: style.display,
      opacity: style.opacity,
      inert: contact.inert,
      obscured: contact.hasAttribute('data-obscured'),
      inViewport: rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      open: contact.classList.contains('is-open'),
      menuVisibility: getComputedStyle(contact.querySelector('.floating-contact__menu')).visibility
    };
  });
}

function assertVisible(state) {
  assert.equal(state.count, 1);
  assert.equal(state.position, 'fixed');
  assert.equal(state.visibility, 'visible');
  assert.notEqual(state.display, 'none');
  assert.equal(state.opacity, '1');
  assert.equal(state.inert, false);
  assert.equal(state.obscured, false);
  assert.equal(state.inViewport, true);
  assert.equal(state.horizontalOverflow, false);
}

(async () => {
  fs.writeFileSync(resultPath, JSON.stringify({ status: 'running' }));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const results = [];
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(2000);
    page.setDefaultNavigationTimeout(5000);
    await page.route(/^https?:\/\/(?!127\.0\.0\.1:4173)/, route => route.abort());
    await page.addInitScript(() => sessionStorage.setItem('reloadPromoClosed', 'true'));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
      const contact = page.locator('[data-floating-contact]');
      const toggle = contact.locator('[data-floating-contact-toggle]');
      const menu = contact.locator('[data-floating-contact-menu]');
      const items = contact.locator('.floating-contact__item');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await toggle.getAttribute('aria-label'), 'Mở menu liên hệ');
      assert.equal(await menu.getAttribute('aria-hidden'), 'true');
      assert.equal(await items.count(), 4);
      for (let index = 0; index < expectedLinks.length; index += 1) {
        const [href, label, opensNewTab] = expectedLinks[index];
        const item = items.nth(index);
        assert.equal(await item.getAttribute('href'), href);
        assert.equal(await item.getAttribute('aria-label'), label);
        assert.equal(await item.getAttribute('target'), opensNewTab ? '_blank' : null);
        assert.equal(await item.getAttribute('rel'), opensNewTab ? 'noopener noreferrer' : null);
      }
      const positions = await page.evaluate(() => {
        const top = selector => document.querySelector(selector)?.offsetTop || 0;
        const bottom = document.documentElement.scrollHeight - innerHeight;
        return [0, top('#branches'), top('#bmi-calculator'), top('#news'), bottom];
      });

      for (const y of [...positions, ...positions.slice().reverse()]) {
        await page.evaluate(scrollY => scrollTo(0, scrollY), y);
        assertVisible(await contactState(page));
      }

      await page.evaluate(() => {
        scrollTo(0, document.documentElement.scrollHeight * .45);
        document.querySelector('.floating-contact__toggle').click();
        scrollTo(0, document.documentElement.scrollHeight * .75);
      });
      const openState = await contactState(page);
      assertVisible(openState);
      assert.equal(openState.open, true);
      assert.equal(openState.menuVisibility, 'visible');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await menu.getAttribute('aria-hidden'), 'false');
      const axis = await page.evaluate(() => {
        const toggleRect = document.querySelector('[data-floating-contact-toggle]').getBoundingClientRect();
        return [...document.querySelectorAll('.floating-contact__icon')].map(icon => {
          const rect = icon.getBoundingClientRect();
          return Math.abs((rect.left + rect.width / 2) - (toggleRect.left + toggleRect.width / 2));
        });
      });
      axis.forEach(delta => assert.ok(delta < 1));

      await page.evaluate(() => document.querySelector('.floating-contact__toggle').click());
      assertVisible(await contactState(page));
      await page.evaluate(() => document.querySelector('.floating-contact__toggle').click());
      await page.keyboard.press('Escape');
      assert.equal((await contactState(page)).open, false);
      results.push(`${width}x${height}: PASS`);
    }

    for (const [width, height] of [[390, 844], [844, 390], [390, 844]]) {
      await page.setViewportSize({ width, height });
      assertVisible(await contactState(page));
    }

    for (const path of ['about.html', 'facilities.html', 'services.html', 'class-schedule.html', 'membership.html', 'locations.html', 'blog.html']) {
      await page.goto(`http://127.0.0.1:4173/${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      assert.equal(await page.locator('[data-floating-contact]').count(), 1, `${path}: missing floating contact`);
      assertVisible(await contactState(page));
    }

    const popupPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    popupPage.setDefaultTimeout(2000);
    popupPage.setDefaultNavigationTimeout(5000);
    await popupPage.route(/^https?:\/\/(?!127\.0\.0\.1:4173)/, route => route.abort());
    await popupPage.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await popupPage.waitForTimeout(500);
    const layers = await popupPage.evaluate(() => {
      const popup = document.querySelector('[data-reload-promo]');
      const contact = document.querySelector('.floating-contact');
      const toggle = contact.querySelector('.floating-contact__toggle').getBoundingClientRect();
      const topElement = document.elementFromPoint(toggle.left + toggle.width / 2, toggle.top + toggle.height / 2);
      return {
        popupVisible: !popup.hidden && getComputedStyle(popup).display !== 'none',
        popupZ: Number(getComputedStyle(popup).zIndex),
        contactZ: Number(getComputedStyle(contact).zIndex),
        popupAboveContact: Boolean(topElement.closest('[data-reload-promo]'))
      };
    });
    assert.equal(layers.popupVisible, true);
    assert.ok(layers.popupZ > layers.contactZ);
    assert.equal(layers.popupAboveContact, true);
    await popupPage.locator('[data-reload-promo-close]').first().click();
    assertVisible(await contactState(popupPage));
    await popupPage.close();

    assert.deepEqual(errors, []);
    const result = { status: 'PASS', viewports: results, orientation: 'PASS', popupLayering: 'PASS', errors };
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  fs.writeFileSync(resultPath, JSON.stringify({ status: 'FAIL', error: error.stack }, null, 2));
  console.error(error);
  process.exitCode = 1;
});
