const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const report={checks:[],errors:[],warnings:[],httpErrors:[]},base=process.env.BASE_URL||'http://127.0.0.1:4187',root=path.resolve(__dirname,'../..');
const check=name=>{report.checks.push(name);console.log('PASS '+name);};
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
const page=await browser.newPage({reducedMotion:'reduce'});
await page.addInitScript(()=>{
 window.__resources={listeners:0,intersection:0,resize:0};
 const add=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(...args){window.__resources.listeners++;return add.apply(this,args);};
 for(const [name,key] of [['IntersectionObserver','intersection'],['ResizeObserver','resize']]){
  const Native=window[name];window[name]=class extends Native{constructor(...args){super(...args);this.targets=new Set();}observe(target,...args){if(!this.targets.size)window.__resources[key]++;this.targets.add(target);return super.observe(target,...args);}disconnect(){if(this.targets.size)window.__resources[key]--;this.targets.clear();return super.disconnect();}unobserve(target){this.targets.delete(target);if(!this.targets.size)window.__resources[key]--;return super.unobserve(target);}};
 }
});
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.httpErrors.push(r.url());});page.on('requestfailed',r=>report.httpErrors.push(r.url()));
const load=async(w,h)=>{await page.setViewportSize({width:w,height:h});await page.goto(base+'/body-visualizer.html');await page.waitForSelector('[data-viewer="ready"]');await page.evaluate(()=>document.fonts.ready);};
const snap=()=>page.evaluate(async()=>{const {inspectVisualizer}=await import('/assets/js/body-visualizer/app.js');return inspectVisualizer({includeGeometry:true});});
const settle=()=>page.waitForFunction(async()=>{const {inspectVisualizer}=await import('/assets/js/body-visualizer/app.js');const v=inspectVisualizer().viewer;return v&&!v.pendingFrame&&!v.animating;});
const same=(a,b)=>{assert.deepEqual(a.state,b.state);assert.deepEqual(a.inputs,b.inputs);assert.deepEqual(a.geometry,b.geometry);for(const k of ['modelId','rendererId','sceneId','camera','target','meshes','size'])assert.deepEqual(a.viewer[k],b.viewer[k],k);assert.equal(b.viewer.webglError,0);};
const atField=async(key)=>{await page.locator('[data-field="'+key+'"]').evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top-180));await page.waitForTimeout(100);};
const quick=()=>page.locator('[data-model-quick]');
const clickQuick=async()=>{const r=await quick().boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);};
const trip=async(key,label)=>{
 await atField(key);await quick().waitFor({state:'visible'});await settle();const before=await snap();
 const position=await page.locator('[data-field="'+key+'"]').evaluate(e=>e.getBoundingClientRect().top);
 await clickQuick();await page.locator('[data-model-return]').waitFor({state:'visible'});
 await page.waitForFunction(()=>{const r=document.querySelector('.bv-stage').getBoundingClientRect();return r.top>=65&&r.bottom<=innerHeight;});
 assert((await page.locator('[data-model-return]').textContent()).includes(label));
 await page.screenshot({path:path.join(__dirname,'viewer-'+page.viewportSize().width+'.png')});
 await page.locator('[data-model-return]').click();await page.waitForFunction(k=>document.activeElement?.dataset.field===k,key);
 await page.waitForFunction(({key,position})=>Math.abs(document.querySelector('[data-field='+key+']').getBoundingClientRect().top-position)<2,{key,position});const returned=await page.locator('[data-field="'+key+'"]').evaluate(e=>e.getBoundingClientRect().top);
 assert(Math.abs(position-returned)<2,`anchor drift ${position}/${returned}`);await settle();same(before,await snap());
 assert(await page.locator('[data-model-return]').isHidden());check('trip '+key+' '+page.viewportSize().width);
};
for(const width of [1440,1024]){await load(width,900);await atField('waist');assert(await quick().isHidden());assert.equal(await page.locator('.bv-viewer').evaluate(e=>getComputedStyle(e).position),'sticky');assert.equal(await page.locator('.bv-stage').evaluate(e=>e.clientHeight),width===1440?520:480);check('desktop unchanged '+width);}
for(const width of [390,768]){
 await load(width,width===390?844:1024);assert(await quick().isHidden());
 await page.locator('#bv-waist').fill('75');await page.locator('#bv-waist').fill('82');await atField('waist');await quick().waitFor({state:'visible'});
 assert.equal(await quick().textContent(),'Xem mô hình · HIỆN TẠI');
 await page.locator('[data-field="waist"] summary').click();await trip('waist','Vòng eo');
 assert(await page.locator('[data-field="waist"] details').evaluate(e=>e.open));
 await page.locator('#bv-hip').fill('96');await page.locator('.bv-advanced>summary').click();await page.locator('#bv-thigh').fill('55');await trip('thigh','Vòng đùi');assert(await page.locator('.bv-advanced').evaluate(e=>e.open));
 await page.screenshot({path:path.join(__dirname,'form-'+width+'.png')});
 await page.locator('[data-next]').click();await atField('waist');await quick().waitFor({state:'visible'});assert.equal(await quick().textContent(),'Xem mô hình · MỤC TIÊU');await page.locator('#bv-waist').fill('78');await trip('waist','Vòng eo');
 await clickQuick();await page.locator('[data-model-return]').waitFor({state:'visible'});await page.locator('[data-step="0"]').click();assert(await page.locator('[data-model-return]').isHidden());check('wrong-step invalidation '+width);
 await atField('waist');await quick().waitFor({state:'visible'});
 await page.locator('[data-floating-contact-toggle]').click();await quick().waitFor({state:'hidden'});await page.locator('[data-floating-contact-toggle]').click();await quick().waitFor({state:'visible'});
 await page.locator('.menu-toggle').click();await quick().waitFor({state:'hidden'});await page.locator('.menu-toggle').click();await quick().waitFor({state:'visible'});
 await page.evaluate(()=>document.querySelector('.bv-reset-dialog').showModal());await quick().waitFor({state:'hidden'});await page.locator('button[value="cancel"]').click();await atField('waist');await quick().waitFor({state:'visible'});check('menu/dialog suppression '+width);
 // A real resize with a focused editable control, not a fixed small-height rule.
 await page.locator('#bv-waist').focus();await page.setViewportSize({width,height:width===390?480:600});await page.locator('[data-model-inline]').waitFor({state:'visible'});assert(await quick().isHidden());
 await page.locator('[data-model-inline]').click();await page.locator('[data-model-return]').waitFor({state:'visible'});await page.setViewportSize({width,height:width===390?844:1024});await page.waitForTimeout(300);await page.locator('[data-model-return]').click();await page.waitForFunction(()=>document.activeElement?.dataset.field==='waist');assert.notEqual(await page.evaluate(()=>document.activeElement.type),'number');await quick().waitFor({state:'visible'});check('keyboard shrink/inline/return '+width);
 // Invalid draft survives navigation, including all helper/error associations.
 await page.locator('#bv-waist').fill('999');await trip('waist','Vòng eo');assert.equal(await page.locator('#bv-waist').inputValue(),'999');assert.equal(await page.locator('#bv-waist').getAttribute('aria-invalid'),'true');await page.locator('#bv-waist').fill('82');
 await page.locator('[data-next]').click();await page.locator('[data-next]').click();assert(await quick().isHidden());assert(await page.locator('[data-model-return]').isHidden());await page.locator('[data-next]').click();assert(await quick().isHidden());check('Comparison/Roadmap excluded '+width);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('no overflow '+width);
}
await load(390,844);
// Slow traversal matters: a large scroll jump can hide a broken IO threshold.
const viewerBottom=await page.locator('.bv-viewer').evaluate(e=>scrollY+e.getBoundingClientRect().bottom);
for(let bottom=90;bottom>=54;bottom--){await page.evaluate(y=>scrollTo(0,y),viewerBottom-bottom);await page.waitForTimeout(20);}
await quick().waitFor({state:'visible'});assert.equal(Math.round((await quick().boundingBox()).y),65);
for(let bottom=60;bottom<=66;bottom++){await page.evaluate(y=>scrollTo(0,y),viewerBottom-bottom);await page.waitForTimeout(20);assert(await quick().isVisible());}
await page.evaluate(y=>scrollTo(0,y),viewerBottom-95);await quick().waitFor({state:'hidden'});check('slow threshold/hysteresis and header alignment');
await page.locator('#bv-waist').focus();await atField('waist');await quick().waitFor({state:'visible'});
await page.locator('[data-field="waist"]').evaluate(e=>scrollTo(0,scrollY+e.getBoundingClientRect().top-80));await quick().waitFor({state:'hidden'});
await page.locator('[data-field="waist"]').evaluate(e=>scrollTo(0,scrollY+e.getBoundingClientRect().bottom-50));await quick().waitFor({state:'visible'});check('focused field wins utility band; utility recovers after field exits');
await atField('waist');await settle();const stressBefore=await snap(),resourceBefore=await page.evaluate(()=>({...window.__resources}));
for(let i=0;i<110;i++){await page.evaluate(()=>window.scrollTo(0,0));await quick().waitFor({state:'hidden'});await atField('waist');await quick().waitFor({state:'visible'});}
await settle();same(stressBefore,await snap());assert.equal(await page.locator('.bv-stage canvas').count(),1);assert.equal(await page.locator('[data-model-quick]').count(),1);check('110 visibility cycles, geometry/camera/identity preserved');
assert.deepEqual(await page.evaluate(()=>window.__resources),resourceBefore);const idle=(await snap()).viewer.renderCount;await page.waitForTimeout(250);assert.equal((await snap()).viewer.renderCount,idle);check('no listener/active observer growth; render stays idle');
await quick().focus();await quick().press('Enter');await page.locator('[data-model-return]').waitFor({state:'visible'});await page.locator('[data-model-return]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.id==='bv-waist');check('keyboard restores number control');
await page.emulateMedia({reducedMotion:'no-preference'});await trip('waist','Vòng eo');check('normal and reduced motion');
await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await quick().waitFor({state:'hidden'});check('outside form hidden');
await page.emulateMedia({reducedMotion:'reduce'});
for(let i=0;i<20;i++){await page.locator('[data-step="1"]').click();await page.locator('[data-step="0"]').click();}
assert.equal(await page.locator('.bv-stage canvas').count(),1);assert.equal(await page.locator('[data-model-quick]').count(),1);assert((await page.evaluate(()=>window.__resources.intersection))<=4);check('20 Current/Goal round trips without active observer growth');
const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
await touch.goto(base+'/body-visualizer.html');await touch.waitForSelector('[data-viewer="ready"]');await touch.locator('#bv-waist').tap();await touch.locator('#bv-waist').fill('82');await touch.setViewportSize({width:390,height:480});await touch.locator('[data-model-inline]').waitFor({state:'visible'});assert(await touch.locator('[data-model-quick]').isHidden());
await touch.locator('[data-model-inline]').tap();await touch.locator('[data-model-return]').waitFor({state:'visible'});await touch.setViewportSize({width:390,height:844});await touch.waitForTimeout(300);await touch.locator('[data-model-return]').tap();await touch.waitForFunction(()=>document.activeElement?.dataset.field==='waist');assert.equal(await touch.locator('#bv-waist').inputValue(),'82');assert(await touch.locator('[data-model-inline]').isHidden());await touch.screenshot({path:path.join(__dirname,'touch-return-390.png')});await touch.close();check('touch/coarse pointer inline action and non-editable return focus');
const before=JSON.parse(fs.readFileSync(path.join(__dirname,'protected-before.json'),'utf8').replace(/^\uFEFF/,''));report.protectedFiles=before.map(f=>({...f,unchanged:f.sha256===crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f.path))).digest('hex')}));assert(report.protectedFiles.every(f=>f.unchanged));check('protected hashes unchanged');
assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);assert.deepEqual(report.httpErrors,[]);check('console/network clean');report.pass=true;
}catch(error){report.pass=false;report.error=error.stack;process.exitCode=1;console.error(error);}finally{fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(report,null,2));await browser.close();}})();



