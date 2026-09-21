const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:4187',report={checks:[],errors:[],warnings:[],httpErrors:[],layouts:[]};
const check=(name,fn)=>{fn();report.checks.push(name);console.log('PASS '+name);};
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.httpErrors.push(r.url());});page.on('requestfailed',r=>report.httpErrors.push(r.url()));
 const snap=()=>page.evaluate(async()=>{const {inspectVisualizer}=await import('/assets/js/body-visualizer/app.js');return inspectVisualizer({includeGeometry:true});});
 const settle=()=>page.waitForFunction(async()=>{const {inspectVisualizer}=await import('/assets/js/body-visualizer/app.js');const v=inspectVisualizer().viewer;return v&&!v.animating&&!v.pendingFrame;});
 const shape=s=>JSON.stringify({geometry:s.geometry,weights:s.viewer.meshes.map(m=>m.influences),camera:s.viewer.camera,ids:[s.viewer.modelId,s.viewer.rendererId,s.viewer.sceneId]});
 const headingInView=()=>page.waitForFunction(()=>{const e=document.querySelector('#bv-panel-title'),r=e.getBoundingClientRect(),h=document.querySelector('.header').getBoundingClientRect();return document.activeElement===e&&r.top>=h.bottom&&r.bottom<=innerHeight;});
 for(const size of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844}])for(const motion of ['reduce','no-preference']){
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:motion});await page.goto(base+'/body-visualizer.html');await page.waitForSelector('[data-viewer="ready"]');await page.waitForTimeout(500);
  check(`popup suppressed ${size.width}/${motion}`,()=>{});assert(await page.locator('[data-reload-promo]').isHidden());assert.equal(await page.evaluate(()=>sessionStorage.getItem('reloadPromoClosed')),null);
  await page.locator('[data-next]').click();await headingInView();check(`Current -> Goal focus/scroll ${size.width}/${motion}`,()=>{});
  assert((await page.locator('.bv-goal-note').innerText()).includes('không tự thay đổi mục tiêu'));
  await page.locator('[data-next]').click();await headingInView();check(`Goal -> Comparison focus/scroll ${size.width}/${motion}`,()=>{});
  assert((await page.locator('[data-bmi-label]').innerText()).includes('hiện tại'));
  await page.locator('[data-mode="goal"]').click();assert((await page.locator('[data-bmi-label]').innerText()).includes('mục tiêu'));
  await page.locator('[data-next]').click();await headingInView();check(`Comparison -> Roadmap focus/scroll ${size.width}/${motion}`,()=>{});
  await page.locator('.bv-goals label').nth(1).click();assert.equal(await page.getByRole('link',{name:'TRAO ĐỔI VỀ LỘ TRÌNH TẬP LUYỆN',exact:true}).getAttribute('href'),'#bv-conversion');assert.equal(await page.locator('[data-contact]').getAttribute('href'),'https://zalo.me/0374432221');
  await page.locator('[data-step="0"]').click();await headingInView();await page.locator('.bv-advanced>summary').click();
  for(const key of ['chest','waist','hip','shoulder','arm','thigh','calf']){
   const field=page.locator('[data-field="'+key+'"]'),summary=field.locator('.bv-measure-help summary');await summary.focus();await summary.press('Enter');assert(await field.locator('.bv-measure-help p').isVisible());
   const fits=await field.evaluate(e=>{const p=e.querySelector('.bv-measure-help p').getBoundingClientRect(),r=e.getBoundingClientRect();return p.left>=r.left&&p.right<=r.right+.1&&document.documentElement.scrollWidth<=innerWidth;});assert(fits);await summary.press('Space');assert(await field.locator('.bv-measure-help p').isHidden());
  }
  check(`seven helpers keyboard + layout ${size.width}/${motion}`,()=>{});
  const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,stage:document.querySelector('.bv-stage').getBoundingClientRect().height,slider:document.querySelector('[data-range]').getBoundingClientRect().height}));assert(dims.scroll<=dims.width);assert.equal(dims.slider,44);assert.equal(dims.stage,size.width===1440?520:size.width===768?400:320);report.layouts.push({...dims,motion});
  if(motion==='reduce'){await page.locator('[data-field="shoulder"] .bv-measure-help summary').click();await page.locator('[data-field="shoulder"]').screenshot({path:path.join(__dirname,'helper-'+size.width+'.png')});await page.screenshot({path:path.join(__dirname,'form-'+size.width+'.png')});}
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/body-visualizer.html');await page.waitForSelector('[data-viewer="ready"]');await settle();
 check('unsupported copy',()=>{});assert((await page.locator('#bv-gender-help').textContent()).includes('chưa thay đổi'));assert((await page.locator('#bv-inseam-help').textContent()).includes('chưa thay đổi'));
 await page.locator('.bv-advanced>summary').click();const before=await snap();
 await page.locator('[data-field="shoulder"] summary').press('Enter');await page.locator('[data-field="shoulder"] summary').press('Space');await settle();assert.equal(shape(await snap()),shape(before));check('guidance leaves geometry/camera/identities unchanged',()=>{});
 await page.locator('#bv-weight').fill('');assert.equal(await page.locator('[data-bmi]').textContent(),'—');assert(await page.locator('[data-bmi-unavailable]').isVisible());await page.locator('#bv-weight').fill('80');assert(await page.locator('[data-bmi-unavailable]').isHidden());
 await page.locator('#bv-height').fill('200');await settle();assert.equal(await page.locator('[data-bmi]').textContent(),'20.0');assert(await page.locator('[data-height-clamp]').isVisible());check('BMI unavailable/recovery and actual Height',()=>{});
 await page.locator('#bv-height').fill('170');await settle();
 for(const key of ['chest','waist','hip','shoulder','arm','thigh','calf']){
  await page.locator('#bv-'+key).fill(await page.locator('#bv-'+key).getAttribute('max'));await settle();assert(await page.locator('#bv-clamp-'+key).isVisible());assert.equal(await page.locator('.bv-clamp:visible').count(),1);
  const current=await snap();const mapped=current.viewer.mappingDebug.current[key];assert(mapped.clamped);assert.equal(await page.locator('#bv-'+key).getAttribute('aria-invalid'),null);
  await page.locator('#bv-weight').focus();assert.equal(await page.locator('.bv-clamp:visible').count(),0);
  await page.locator('#bv-'+key).fill('');assert(await page.locator('#bv-empty-'+key).isVisible());assert.equal((await snap()).state.currentBody[key],null);
  await page.locator('[data-range="'+key+'"]').press('ArrowLeft');await settle();assert(!(await page.locator('#bv-empty-'+key).isVisible()));assert((await snap()).state.currentBody[key]>0);
 }
 check('all seven clamps are contextual; empty sliders recover without injected baseline',()=>{});
 const associations=await page.locator('[data-range]').evaluateAll(els=>els.every(e=>{const n=document.querySelector('[data-number="'+e.dataset.range+'"]');return e.getAttribute('aria-describedby')===n.getAttribute('aria-describedby')&&e.getAttribute('aria-describedby').split(' ').every(id=>document.getElementById(id));}));assert(associations);check('slider unit/helper/error associations',()=>{});
 await page.locator('#bv-weight').fill('70');await page.locator('[data-next]').click();await headingInView();assert.equal((await snap()).state.goalBody.weight,70);await page.locator('#bv-weight').fill('60');await page.locator('[data-step="0"]').click();await page.locator('#bv-weight').fill('80');await page.locator('[data-step="1"]').click();assert.equal((await snap()).state.goalBody.weight,60);check('Goal remains a one-time independent copy',()=>{});
 await page.locator('[data-reset]').click();assert((await page.locator('.bv-reset-dialog').innerText()).includes('hông'));assert((await page.locator('.bv-reset-dialog').innerText()).includes('chiều cao'));await page.locator('button[value="reset"]').click();await headingInView();await settle();const reset=await snap();assert.equal(reset.state.currentBody.height,null);assert.equal(reset.state.currentBody.weight,60);assert(reset.viewer.meshes.every(m=>m.phenotypePreserved&&m.influences.slice(4).every(v=>v===0)));assert(await page.locator('[data-bmi-unavailable]').isVisible());check('reset copy, geometry, phenotype and heading',()=>{});
 const other=await browser.newPage();await other.goto(base+'/about.html');await other.waitForSelector('[data-reload-promo]:not([hidden])');check('About popup still auto-opens in fresh session',()=>{});await other.close();
 check('console/network clean',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);assert.deepEqual(report.httpErrors,[]);});report.pass=true;
}catch(e){report.pass=false;report.error=e.stack;process.exitCode=1;}finally{fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,count:report.checks.length,error:report.error,errors:report.errors,warnings:report.warnings,httpErrors:report.httpErrors}));await browser.close();}})();
