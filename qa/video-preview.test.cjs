const assert=require('node:assert/strict');
const fs=require('fs');
const {chromium}=require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();
 await page.addInitScript(()=>sessionStorage.setItem('reloadPromoClosed','true'));
 const errors=[],mediaResponses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('fbcdn'))mediaResponses.push(r.status())});
 const layouts=[];
 for(const [width,height] of [[1440,900],[1200,800],[1024,768],[768,1024],[430,932],[375,812],[844,390],[1440,700]]){
 await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(350);
 const state=await page.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();const a=r('.video-preview'), b=r('.hero-brand'),c=r('.hero-copy'),p=r('.hero-index'),f=r('.floating-contact__toggle');const overlap=b=>b.width>0&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,ratio:a.width/a.height,overlapBrand:overlap(b),overlapCopy:overlap(c),overlapIndex:overlap(p),overlapChat:getComputedStyle(document.querySelector('.floating-contact')).visibility!=='hidden'&&overlap(f)}});
 layouts.push(state);assert.equal(state.overflow,false);for(const key of ['overlapBrand','overlapCopy','overlapIndex','overlapChat'])assert.equal(state[key],false,`${width} ${key}`);assert.ok(Math.abs(state.ratio-16/9)<.01);
 await page.locator('.video-preview__trigger').click();assert.equal(await page.locator('#reload-video-modal').evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
 await page.screenshot({path:`${__dirname}/video-modal-${width}.png`});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#reload-video-modal').evaluate(e=>e.open),false);assert.equal(await page.locator('.video-modal video').evaluate(e=>e.paused),true);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');assert.equal(await page.locator('.video-preview__trigger').evaluate(e=>e===document.activeElement),true);
 await page.locator('.video-preview__trigger').click();await page.locator('.video-modal__close').click();assert.equal(await page.locator('.video-modal video').evaluate(e=>e.paused),true);
 await page.locator('.video-preview__trigger').click();await page.locator('.video-modal').click({position:{x:5,y:5}});assert.equal(await page.locator('#reload-video-modal').evaluate(e=>e.open),false);
 await page.screenshot({path:`${__dirname}/video-${width}.png`});
 }
 const pages=['index','about','facilities','services','class-schedule','membership','locations','blog'];
 for(const name of pages){await page.goto(`http://127.0.0.1:4173/${name}.html`);const contacts=await page.evaluate(()=>({footer:[...document.querySelectorAll('.social-links a')].map(e=>e.href),floating:[...document.querySelectorAll('.floating-contact__item')].map(e=>e.href),sizes:[...document.querySelectorAll('.social-links a')].map(e=>[e.offsetWidth,e.offsetHeight]),labels:[...document.querySelectorAll('.social-links a')].every(e=>e.getAttribute('aria-label')),external:[...document.querySelectorAll('.social-links a[target]')].every(e=>e.target==='_blank'&&e.rel==='noopener noreferrer')}));assert.deepEqual(contacts.footer,contacts.floating);assert.deepEqual(contacts.sizes,Array(4).fill([40,40]));assert.ok(contacts.labels&&contacts.external);}
 await page.goto('http://127.0.0.1:4173');await page.locator('.video-preview__trigger').click();await page.waitForTimeout(5000);const media=await page.locator('.video-modal video').evaluate(e=>({readyState:e.readyState,time:e.currentTime,paused:e.paused,error:e.error?.message}));await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);fs.writeFileSync(__dirname+'/video-results.json',JSON.stringify({layouts,pages,errors,mediaResponses,media},null,2));console.log(JSON.stringify({layouts,errors,mediaResponses,media},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
