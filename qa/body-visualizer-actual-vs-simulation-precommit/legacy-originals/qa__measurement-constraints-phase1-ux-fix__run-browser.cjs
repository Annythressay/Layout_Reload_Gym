const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const dir = __dirname;
const shots = path.join(dir, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const approx = (actual, expected) => assert(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => sessionStorage.setItem('reloadPromoClosed', 'true'));
  const evidence = { screenshots: [], checks: {}, requests: [], errors: [], gltfErrors: [] };
  page.on('request', request => { if (request.url().endsWith('.glb')) evidence.requests.push(request.url()); });
  page.on('pageerror', error => evidence.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') { evidence.errors.push(message.text()); if (message.text().includes('GLTFLoader')) evidence.gltfErrors.push(message.text()); } });
  const fill = (key, value) => page.locator(`[data-number="${key}"]`).fill(String(value));
  const inspect = () => page.evaluate(async () => (await import('/assets/js/body-visualizer/app.js')).inspectVisualizer());
  const range = key => page.evaluate(async key => {
    const { loadCalibration } = await import('/assets/js/body-visualizer/normalization.js');
    const { supportedRange } = await import('/assets/js/body-visualizer/measurement-constraints.js');
    const app = (await import('/assets/js/body-visualizer/app.js')).inspectVisualizer();
    const body = app.state.step === 1 ? app.state.goalBody : app.state.currentBody;
    return supportedRange(key, body.height, await loadCalibration());
  }, key);
  const shot = async name => { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true, animations: 'disabled' }); evidence.screenshots.push(`screenshots/${name}.png`); };
  const reset = async () => { await page.locator('[data-reset]').click(); await page.locator('.bv-reset-dialog [value="reset"]').click(); };
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  try {
    await page.goto('http://127.0.0.1:4173/body-visualizer.html');
    await page.waitForSelector('[data-viewer="ready"]');
    assert.equal(Object.keys((await inspect()).viewer.meshes[0].dictionary).length, 19);
    assert.equal(evidence.requests.filter(url => url.includes('production-morph-v5-candidate.glb')).length, 1);
    assert.equal(evidence.requests.filter(url => url.includes('production-morph-v4.glb')).length, 0);
    await shot('desktop-normal-fixed');
    evidence.checks.model = 'PASS';

    const chest = await range('chest');
    await fill('chest', 108.2);
    approx((await inspect()).state.currentBody.chest, chest.max);
    approx((await inspect()).viewer.currentWeights.chest, 1);
    assert.equal(await page.locator('#bv-chest').getAttribute('aria-invalid'), 'false');
    assert.equal(await page.locator('[data-range="chest"]').getAttribute('aria-valuenow'), String(chest.max));
    await shot('desktop-rounded-max-accepted');
    evidence.checks.roundedMax = 'PASS';

    await fill('chest', 150);
    await page.locator('[data-use-limit="chest"]').click();
    approx((await inspect()).state.currentBody.chest, chest.max);
    assert.equal(await page.locator('#bv-chest').inputValue(), '108.2');
    await shot('desktop-use-limit-fixed');
    evidence.checks.useLimit = 'PASS';

    await reset();
    for (const key of ['chest', 'waist', 'hip']) await fill(key, Number((await range(key)).min.toFixed(1)));
    const committedBMI = await page.locator('[data-bmi]').textContent();
    await fill('height', 170);
    assert((await inspect()).pendingHeight);
    assert.equal(await page.locator('[data-bmi]').textContent(), committedBMI);
    const transactionText = await page.locator('[data-height-transaction]').innerText();
    assert(!/\d+\.\d{2,}/.test(transactionText));
    await shot('desktop-height-transaction-fixed');
    await shot('desktop-pending-height-bmi-fixed');
    evidence.checks.pendingBMI = 'PASS';
    evidence.checks.transaction = 'PASS';

    await page.locator('[data-apply-height]').click();
    const applied = await inspect();
    assert.equal(applied.state.currentBody.height, 170);
    for (const key of ['chest', 'waist', 'hip']) {
      approx(applied.state.currentBody[key], (await range(key)).min);
      assert.equal(await page.locator(`[data-number="${key}"]`).inputValue(), (await range(key)).min.toFixed(1));
    }
    await shot('desktop-height-transaction-applied-fixed');
    evidence.checks.applied = 'PASS';

    await page.locator('.bv-advanced > summary').click();
    assert.equal(await page.locator('[data-range="calf"]').getAttribute('aria-valuenow'), null);
    assert.equal(await page.locator('[data-range="calf"]').getAttribute('aria-valuetext'), 'Chưa nhập số đo');
    assert.equal(await page.locator('[data-field="calf"]').getAttribute('data-unset'), 'true');
    const sliderVisual = await page.locator('[data-range="calf"]').evaluate(element => ({ background: getComputedStyle(element).backgroundImage, thumb: getComputedStyle(element, '::-webkit-slider-thumb').backgroundColor }));
    assert(!sliderVisual.background.includes('#c92828'));
    await shot('desktop-empty-slider-fixed');
    evidence.checks.unsetSlider = 'PASS';
    evidence.sliderVisual = sliderVisual;

    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow();
    await reset();
    await fill('chest', 108.2);
    await noOverflow();
    await shot('mobile-rounded-max-accepted');
    await reset();
    for (const key of ['chest', 'waist', 'hip']) await fill(key, Number((await range(key)).min.toFixed(1)));
    await fill('height', 170);
    assert((await inspect()).pendingHeight);
    await noOverflow();
    await shot('mobile-height-transaction-fixed');
    await page.locator('[data-cancel-height]').click();
    if (!(await page.locator('.bv-advanced').evaluate(element => element.open))) await page.locator('.bv-advanced > summary').click();
    await noOverflow();
    await shot('mobile-empty-slider-fixed');
    evidence.checks.mobile = 'PASS';
    assert.deepEqual(evidence.errors, []);
    assert.deepEqual(evidence.gltfErrors, []);
    fs.writeFileSync(path.join(dir, 'browser-results.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({ result: 'PASS', ...evidence.checks, errors: evidence.errors, screenshots: evidence.screenshots.length }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
