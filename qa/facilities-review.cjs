const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'facilities');
const sizes = [[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[1024,768],[768,1024],[430,932],[412,915],[390,844],[375,812]];
const baselines = [
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\index.html",
    "Hash": "4EEF998ADD263529466A060CE8A64BA6244918C905A59196C70B002803283AD7"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\about.html",
    "Hash": "D53928FE8810452D190BC018B30B962B3D9FBB7B32F2FCA574788C43576E3AC5"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\templates\\header.html",
    "Hash": "2339E3E5E26EB6D0902722A0B46C77E43A9EEFB73EDA5B507BDAC7FE5C4F7B4C"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\templates\\footer.html",
    "Hash": "45290D2DCA1B65D64264F8DBE1E58A8B2FA92E6CA9573419F576F551C588845D"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\templates\\floating-contact.html",
    "Hash": "0B5AC9A14F5F5AF2DB57646D7E48A97013DF8BFCFC6CFCF56F7022B6F01A8D7E"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\templates\\promo-popup.html",
    "Hash": "89B650A6A7E010C7382A80606175357FEADFE5C93911CCDFABDE4058E26D5C05"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\assets\\css\\style.css",
    "Hash": "6930CCCB8FFD9A17A0683452EC375BA4F494F2AB04E4B765605E7C3245ACFF16"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\assets\\css\\about.css",
    "Hash": "D9EDC03D8D42B0E6015D08B28F70A643602E61238A7953B5F6225CEB7CEBE8B9"
  },
  {
    "Path": "C:\\Users\\cnhan\\Downloads\\Reload Gym\\Website Reload Gym\\reload-gym\\assets\\js\\main.js",
    "Hash": "02156D44F0952BC48C4AEBF47B884BCFBAA7DA700C2EC07778A7A5FDA77AEB6F"
  }
];
(async () => {
  fs.mkdirSync(out, {recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext();
  await context.addInitScript(() => sessionStorage.setItem('reloadPromoClosed','true'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:4173/facilities.html', {waitUntil:'domcontentloaded'});
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.querySelectorAll('main img')) {
        image.loading = 'eager';
        await image.decode().catch(() => {});
      }
    });
    const metrics = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.facilities-experience')];
      const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      return {
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
        heroHeight:document.querySelector('.facilities-hero').clientHeight,
        h1:[...document.querySelectorAll('h1')].map(el=>el.textContent),
        activeNav:document.querySelector('.navigation [aria-current="page"]')?.getAttribute('href'),
        cards:cards.map(rect),
        imageLoaded:[...document.querySelectorAll('main img')].every(el=>el.complete&&el.naturalWidth>0),
        cardLinks:cards.map(el=>el.querySelector('a').getAttribute('href')),
        maps:[...document.querySelectorAll('.footer-location')].map(el=>({href:el.href,target:el.target,rel:el.rel,address:el.textContent})),
        socialCount:document.querySelectorAll('.social-links a').length,
        newsletter:!!document.querySelector('#newsletter-form input[type=email][required]'),
        popupCount:document.querySelectorAll('[data-reload-promo]').length
      };
    });
    await page.screenshot({path:path.join(out, 'facilities-'+width+'.png'),fullPage:true});
    results.push({width,height,...metrics});
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/facilities.html', {waitUntil:'domcontentloaded'});
  await page.locator('.menu-toggle').click();
  const mobileMenu = await page.locator('.menu-toggle').getAttribute('aria-expanded') === 'true';
  await page.locator('.menu-toggle').click();
  await page.locator('[data-floating-contact-toggle]').click();
  const floating = await page.locator('[data-floating-contact-toggle]').getAttribute('aria-expanded') === 'true';
  await page.locator('[data-floating-contact-toggle]').click();
  await page.locator('.search-toggle').click();
  const search = await page.locator('dialog[open]').count() === 1;
  await page.keyboard.press('Escape');
  const navigationChecks = [];
  for (const selector of ['.facilities-experience--women a','.facilities-experience--wellness a','.facilities-cta__actions .button-red']) {
    await page.goto('http://127.0.0.1:4173/facilities.html', {waitUntil:'domcontentloaded'});
    await page.locator(selector).click();
    const target = new URL(page.url()).hash;
    navigationChecks.push({target,exists:await page.locator(target).count()===1});
  }
  const popupPage = await browser.newPage({viewport:{width:390,height:844}});
  await popupPage.goto('http://127.0.0.1:4173/facilities.html', {waitUntil:'domcontentloaded'});
  await popupPage.locator('[data-reload-promo]').waitFor({state:'visible'});
  const popupOpen = await popupPage.locator('[data-reload-promo]').isVisible();
  await popupPage.keyboard.press('Escape');
  const popupClosed = await popupPage.locator('[data-reload-promo]').isHidden();
  const regression = baselines.map(({Path,Hash})=>{
    const bytes=fs.readFileSync(Path);
    const digest=value=>crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
    const unchanged=digest(bytes)===Hash;
    const concurrentAboutImageChange=path.basename(Path)==='about.html' && !unchanged &&
      digest(bytes.toString().replace('about-hero-women-cinematic_3.png','about-hero-women-cinematic.webp'))===Hash;
    return {file:path.relative(root,Path),unchanged,concurrentAboutImageChange};
  });
  const report={results,interactions:{mobileMenu,floating,search,popupOpen,popupClosed,navigationChecks},regression,pageErrors:errors};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({viewports:results.map(r=>({width:r.width,height:r.height,hero:r.heroHeight,overflow:r.horizontalOverflow,loaded:r.imageLoaded,equalCards:Math.abs(r.cards[0].height-r.cards[1].height)<1})),interactions:report.interactions,regression,pageErrors:errors},null,2));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
