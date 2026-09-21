const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),baseURL=process.env.BASE_URL||'http://127.0.0.1:4187';
const protectedFiles=['3D/male-mpfb-production-morph-v4.glb',...['state','scene','normalization','height-calibration','height-baselines','morph-controller','glb-model'].map(n=>'assets/js/body-visualizer/'+n+'.js')];
const hashes=()=>Object.fromEntries(protectedFiles.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));
const report={checks:[],errors:[],warnings:[],failures:[],layouts:[],protectedBefore:hashes()};
function check(name,fn){fn();report.checks.push({name,pass:true});console.log('PASS '+name);}
function sameGeometry(a,b){assert.equal(a.length,b.length);let max=0;for(let m=0;m<a.length;m++){assert.deepEqual(a[m].index,b[m].index);assert.equal(a[m].vertices.length,b[m].vertices.length);for(let i=0;i<a[m].vertices.length;i++)for(let j=0;j<3;j++)max=Math.max(max,Math.abs(a[m].vertices[i][j]-b[m].vertices[i][j]));}assert(max<1e-12,'Geometry delta '+max);report.maxModeSwitchDeltaM=Math.max(report.maxModeSwitchDeltaM||0,max);}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)report.failures.push({url:r.url(),status:r.status()});});page.on('requestfailed',r=>report.failures.push({url:r.url(),error:r.failure()}));
  await page.addInitScript(()=>sessionStorage.setItem('reloadPromoClosed','true'));
  await page.goto(baseURL+'/body-visualizer.html');await page.waitForSelector('[data-viewer="ready"]');
  await page.evaluate(async()=>{window.weightQA=await import('/assets/js/body-visualizer/app.js');});
  const settle=()=>page.waitForFunction(()=>{const v=window.weightQA.inspectVisualizer().viewer;return v&&!v.animating&&!v.pendingFrame;});
  const input=async(key,value)=>{await page.evaluate(({key,value})=>{const e=document.querySelector('#bv-'+key);e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));},{key,value});await settle();};
  const snap=()=>page.evaluate(()=>window.weightQA.inspectVisualizer({includeGeometry:true}));
  const bmi=()=>page.locator('[data-bmi]').textContent();
  const click=async(selector)=>{await page.locator(selector).evaluate(e=>e.click());await settle();};
  await settle();
  for(const [k,v] of Object.entries({height:170,weight:65,chest:90,waist:75,hip:92,shoulder:38,arm:28,thigh:52,calf:35}))await input(k,v);
  let before=await snap();
  check('valid Weight BMI',()=>assert.equal(before.state.currentBody.weight,65));assert.equal(await bmi(),'22.5');
  check('19 targets / phenotype',()=>{assert.equal(Object.keys(before.viewer.meshes[0].dictionary).length,19);assert(before.viewer.meshes.every(m=>m.phenotypePreserved));});
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const value of [80,35,180,65]){
   await input('weight',value);const after=await snap();
   check('Weight '+value+' has zero geometry/renderer interference',()=>{assert.deepEqual(after.geometry,before.geometry);assert.deepEqual(after.viewer,before.viewer);assert.equal(after.state.currentBody.height,170);});
   assert.equal(await bmi(),(value/1.7**2).toFixed(1));
  }
  for(const value of ['',34.9,180.1,0,-1]){
   await input('weight',value);const after=await snap();
   check('invalid Weight '+JSON.stringify(value)+' retains state and geometry',()=>{assert.equal(after.state.currentBody.weight,65);assert.deepEqual(after.geometry,before.geometry);assert.deepEqual(after.viewer,before.viewer);});
   assert.equal(await bmi(),'—');assert.equal(await page.locator('#bv-weight').getAttribute('aria-invalid'),'true');assert(await page.locator('#bv-error-weight').textContent());
   await click('[data-next]');assert.equal((await snap()).state.step,0);
  }
  await page.locator('#bv-weight').fill('');await page.locator('#bv-weight').pressSequentially('e');assert.equal(await bmi(),'—');assert.equal(await page.locator('#bv-weight').getAttribute('aria-invalid'),'true');
  await input('waist',77);assert.equal(await bmi(),'—');await input('waist',75);await input('weight',65);assert.equal(await bmi(),'22.5');
  check('valid again restores BMI',()=>assert.equal(true,true));
  for(const value of ['',9999]){await input('height',value);assert.equal(await bmi(),'—');assert.equal((await snap()).state.currentBody.height,null);}
  await input('height',200);await input('weight',80);let s=await snap();assert.equal(await bmi(),'20.0');
  check('200 cm user data separated from visual clamp',()=>{assert.equal(s.state.currentBody.height,200);assert.equal(s.viewer.appliedHeight,.3);assert.equal(s.viewer.mappingDebug.currentHeight.clampedCm,194.6037856625685);});
  assert(await page.locator('[data-height-clamp]').isVisible());assert.notEqual(await page.locator('#bv-height').getAttribute('aria-invalid'),'true');
  await input('height',140);assert.equal(await bmi(),'40.8');assert.equal((await snap()).viewer.appliedHeight,-.3);assert(await page.locator('[data-height-clamp]').isVisible());
  await input('height',170);await input('weight',65);assert(!(await page.locator('[data-height-clamp]').isVisible()));
  before=await snap();await click('[data-next]');await input('weight',80);s=await snap();assert.equal(await bmi(),'27.7');
  check('current 65 vs goal 80: identical geometry, no animation',()=>{sameGeometry(s.geometry,before.geometry);assert.deepEqual(s.viewer.currentWeights,s.viewer.goalWeights);assert.equal(s.viewer.animating,false);assert.equal(s.state.currentBody.weight,65);assert.equal(s.state.goalBody.weight,80);});
  await input('weight','');assert.equal(await bmi(),'—');assert.equal((await snap()).state.goalBody.weight,80);await input('weight',80);assert.equal(await bmi(),'27.7');
  await click('[data-next]');assert((await page.locator('[data-differences]').textContent()).includes('80 kg'));
  await click('[data-mode="current"]');assert.equal(await bmi(),'22.5');const current=await snap();await click('[data-mode="goal"]');assert.equal(await bmi(),'27.7');sameGeometry((await snap()).geometry,current.geometry);
  await click('[data-step="1"]');await input('weight',65);await input('waist',80);s=await snap();assert.equal(await bmi(),'22.5');
  check('same Weight different measurement changes geometry',()=>{assert.notDeepEqual(s.geometry,before.geometry);assert.notEqual(s.viewer.currentWeights.waist,s.viewer.goalWeights.waist);assert(s.viewer.meshes.every(m=>m.phenotypePreserved));});
  await click('[data-view="side"]');before=await snap();await click('[data-reset]');await click('.bv-reset-dialog button[value="reset"]');s=await snap();assert.equal(await bmi(),'—');
  check('reset defaults, morph zero, phenotype/camera/lifecycle preserved',()=>{assert.equal(s.state.currentBody.weight,60);assert.equal(s.state.currentBody.height,null);assert.equal(s.state.goalBody,null);for(const k of ['chest','waist','hip','shoulder','arm','thigh','calf'])assert.equal(s.state.currentBody[k],null);assert.equal(s.viewer.appliedHeight,0);assert(s.viewer.meshes.every(m=>m.phenotypePreserved&&m.influences.slice(4).every(v=>v===0)));for(const k of ['camera','target','modelId','rendererId','sceneId','geometryIds'])assert.deepEqual(s.viewer[k],before.viewer[k]);});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [1440,768,390]){
   await page.setViewportSize({width,height:width===390?844:1000});await input('height',200);await input('weight','');
   await page.locator('[data-field="weight"]').scrollIntoViewIfNeeded();await settle();
   const layout=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};};const field=document.querySelector('[data-field="weight"]');return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,field:rect(field),helper:rect(document.querySelector('#bv-weight-help')),error:rect(document.querySelector('#bv-error-weight')),clamp:rect(document.querySelector('[data-height-clamp]')),canvasCount:document.querySelectorAll('.bv-stage canvas').length,webglError:window.weightQA.inspectVisualizer().viewer.webglError};});
   check('responsive '+width,()=>{assert(layout.scrollWidth<=width);assert(layout.helper.left>=layout.field.left&&layout.helper.right<=layout.field.right+.1);assert(layout.error.height>0&&layout.helper.height>0&&layout.clamp.height>0);assert.equal(layout.canvasCount,1);assert.equal(layout.webglError,0);});report.layouts.push(layout);
   await page.screenshot({path:path.join(__dirname,'responsive-'+width+'.png'),fullPage:true});
   await input('weight',65);await click('[data-next]');assert(await page.locator('#bv-weight-help').isVisible());await page.locator('[data-field="weight"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'goal-'+width+'.png'),fullPage:true});await click('[data-step="0"]');
  }
  // Re-run the existing geometry regression on the updated production UI.
  await page.goto(baseURL+'/body-visualizer.html');await page.waitForSelector('[data-viewer="ready"]');
  await page.evaluate(()=>{import('/qa/height-production-integration/browser.js');});await page.waitForFunction(()=>window.heightAudit,{timeout:240000});
  const regression=await page.evaluate(()=>window.heightAudit.report);fs.writeFileSync(path.join(__dirname,'geometry-regression.json'),JSON.stringify(regression,null,2));
  check('existing full Height / measurement browser regression',()=>assert(regression.pass,regression.error));
  report.regression={pass:regression.pass,checks:regression.checks.length,samples:regression.samples.length,maxErrorCm:Math.max(...regression.samples.map(s=>s.errorCm))};
  report.protectedAfter=hashes();check('protected files unchanged',()=>assert.deepEqual(report.protectedAfter,report.protectedBefore));
  check('console/network clean',()=>{assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);assert.deepEqual(report.failures,[]);});report.pass=true;
 }catch(e){report.pass=false;report.error=e.stack;process.exitCode=1;}
 finally{fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,regression:report.regression,errors:report.errors,warnings:report.warnings,failures:report.failures,error:report.error}));}
})().catch(e=>{console.error(e);process.exitCode=1;});
