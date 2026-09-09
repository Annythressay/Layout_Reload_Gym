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
    [1920, 1080, 4, 2, 2],
    [1440, 900, 4, 2, 2],
    [1366, 768, 4, 2, 2],
    [1024, 768, 3, 3, 2],
    [768, 1024, 2, 4, 3],
    [390, 844, 1, 8, 5]
  ];
  const expectedTitles = [
    'RELOAD 168 TÔN ĐỨC THẮNG – SẮP CHÍNH THỨC KHAI TRƯƠNG!',
    'CẬP NHẬT THI CÔNG RELOAD 2 – 168 TÔN ĐỨC THẮNG',
    'RELOAD GYM FOR WOMEN – CHÍNH THỨC HOÀN THÀNH SETUP TẠI BÀ RỊA!',
    'RELOAD FITNESS BÀ RỊA – SẮP KHAI TRƯƠNG THÁNG 4',
    'Lịch Group Class tháng này tại RELOAD',
    'Tập gym bao lâu thì thấy kết quả?',
    'Top 7 thực phẩm hỗ trợ tăng cơ hiệu quả và lành mạnh',
    'HIIT là gì? Lợi ích và 5 bài tập HIIT dễ áp dụng tại gym'
  ];
  const expectedDates = [
    '2026-09-06', '2026-08-13', '2026-06-13', '2026-03-24',
    '2025-09-05', '2025-08-26', '2025-05-12', '2025-03-02'
  ];

  for (const [width, height, perView, allPages, eventPages] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:4173/index.html');
    await page.waitForTimeout(300);
    const close = page.locator('[data-reload-promo-close]').first();
    if (await close.isVisible()) await close.click();

    assert.equal(await page.locator('.news-card').count(), 8);
    assert.deepEqual(await page.locator('.news-card__title').allTextContents(), expectedTitles);
    assert.deepEqual(await page.locator('.news-card time').evaluateAll(times => times.map(time => time.dateTime)), expectedDates);
    assert.equal(await page.locator('[data-news-dots] button').count(), allPages);
    assert.equal(await page.locator('.news-card.is-page-start').count(), allPages);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);

    const newCard = page.locator('.news-card').filter({ hasText: 'RELOAD 168 TÔN ĐỨC THẮNG – SẮP CHÍNH THỨC KHAI TRƯƠNG!' });
    const newGallery = newCard.locator('[data-news-image-gallery]');
    assert.equal(await newCard.count(), 1);
    assert.equal(await page.locator('.news-card').nth(0).locator('.news-card__title').textContent(), 'RELOAD 168 TÔN ĐỨC THẮNG – SẮP CHÍNH THỨC KHAI TRƯƠNG!');
    assert.equal(await page.locator('.news-card').nth(1).locator('.news-card__title').textContent(), 'CẬP NHẬT THI CÔNG RELOAD 2 – 168 TÔN ĐỨC THẮNG');
    assert.equal(await page.locator('.news-card').nth(4).locator('.news-card__title').textContent(), 'Lịch Group Class tháng này tại RELOAD');
    assert.equal(await newCard.getAttribute('data-category'), 'event');
    assert.equal(await newCard.locator('time').getAttribute('datetime'), '2026-09-06');
    assert.equal(await newGallery.locator('.news-card__image-slide').count(), 5);
    assert.equal(
      await newGallery.locator('.news-card__image-slide.is-active').getAttribute('src'),
      'assets/images/news/reload-168-ton-duc-thang-opening-01.jpg'
    );
    const oldGallery = page.locator('.news-card').filter({ hasText: 'CẬP NHẬT THI CÔNG RELOAD 2' }).locator('[data-news-image-gallery]');
    await newCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const cardHeightBefore = (await newCard.boundingBox()).height;
    const outerScrollBefore = await page.locator('[data-news-viewport]').evaluate(viewport => viewport.scrollLeft);
    for (let index = 0; index < 5; index += 1) {
      await newGallery.locator('[data-news-image-next]').click();
      assert.equal(await newGallery.getAttribute('data-current-image'), String((index + 1) % 5));
    }
    await newGallery.locator('[data-news-image-prev]').click();
    assert.equal(await newGallery.getAttribute('data-current-image'), '4');
    assert.equal(await oldGallery.getAttribute('data-current-image'), '0');
    assert.equal(await page.locator('[data-news-viewport]').evaluate(viewport => viewport.scrollLeft), outerScrollBefore);
    assert.equal((await newCard.boundingBox()).height, cardHeightBefore);
    assert.equal(
      await newCard.locator('.news-card__title').evaluate(title => title.scrollWidth <= title.clientWidth),
      true
    );
    assert.equal(
      await newGallery.evaluate(gallery => [...gallery.querySelectorAll('.news-card__image-arrow')].every(arrow => {
        const galleryBox = gallery.getBoundingClientRect();
        const arrowBox = arrow.getBoundingClientRect();
        return arrowBox.left >= galleryBox.left && arrowBox.right <= galleryBox.right;
      })),
      true
    );

    await page.getByRole('button', { name: 'SỰ KIỆN', exact: true }).click();
    assert.equal(await page.locator('.news-card').count(), 5);
    assert.equal(await page.locator('[data-news-dots] button').count(), eventPages);
    assert.equal(await page.locator('.news-card[data-category="event"]').count(), 5);
    assert.deepEqual(await page.locator('.news-card__title').allTextContents(), [
      expectedTitles[0], expectedTitles[1], expectedTitles[2], expectedTitles[3], expectedTitles[4]
    ]);
    assert.equal(await page.locator('.news-card[data-category="training"]').count(), 0);
    await page.getByRole('button', { name: 'TẬP LUYỆN', exact: true }).click();
    assert.equal(await page.locator('.news-card').count(), 1);
    assert.equal(await page.locator('.news-card').filter({ hasText: 'SẮP CHÍNH THỨC KHAI TRƯƠNG!' }).count(), 0);
    assert.equal(await page.locator('.news-card time').getAttribute('datetime'), '2025-03-02');
    await page.getByRole('button', { name: 'DINH DƯỠNG', exact: true }).click();
    assert.equal(await page.locator('.news-card').count(), 1);
    assert.equal(await page.locator('.news-card').filter({ hasText: 'SẮP CHÍNH THỨC KHAI TRƯƠNG!' }).count(), 0);
    assert.equal(await page.locator('.news-card time').getAttribute('datetime'), '2025-05-12');
    await page.getByRole('button', { name: 'TẤT CẢ', exact: true }).click();
    if (allPages > 1) {
      await page.locator('[data-news-next]').click();
      await page.waitForTimeout(900);
      const expectedStart = page.locator('.news-card').nth(perView);
      const delta = await expectedStart.evaluate(card => {
        const viewport = card.closest('[data-news-viewport]').getBoundingClientRect();
        return Math.abs(card.getBoundingClientRect().left - viewport.left);
      });
      assert.ok(delta < 2, `${width}: page 2 alignment delta ${delta}`);
    }
  }

  assert.deepEqual(errors, []);
  assert.deepEqual(failedResponses, []);
  await browser.close();
  console.log('Eight-card pagination, filters, duplicate guard and independent galleries passed at all breakpoints.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
