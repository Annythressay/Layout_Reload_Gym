const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const report={errors:[],warnings:[],failures:[],rows:[]};try{
 const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.failures.push(r.url());});page.on('requestfailed',r=>report.failures.push(r.url()));await page.addInitScript(()=>sessionStorage.setItem('reloadPromoClosed','true'));
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:4187')+'/body-visualizer.html');await page.waitForSelector('[data-viewer="ready"]');
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  await page.evaluate(()=>{document.querySelector('[data-step="0"]').click();for(const [key,value] of [['height','200'],['weight','']]){const e=document.querySelector('#bv-'+key);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));}document.activeElement.blur();});
  await page.locator('.bv-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(150);
  await page.locator('.bv-stage').screenshot({path:path.join(__dirname,'stage-'+width+'.png')});
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);await page.screenshot({path:path.join(__dirname,'responsive-'+width+'.png'),fullPage:true});
  await page.locator('[data-field="weight"]').screenshot({path:path.join(__dirname,'weight-field-'+width+'.png')});
  const row=await page.evaluate(async()=>{const {inspectVisualizer}=await import('/assets/js/body-visualizer/app.js');const v=inspectVisualizer().viewer;return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,modelId:v.modelId,sceneId:v.sceneId,rendererId:v.rendererId,webglError:v.webglError,canvasCount:document.querySelectorAll('.bv-stage canvas').length};});assert(row.scrollWidth<=width&&row.webglError===0&&row.canvasCount===1);report.rows.push(row);
 }
 assert(report.rows.every(r=>r.modelId===report.rows[0].modelId&&r.rendererId===report.rows[0].rendererId&&r.sceneId===report.rows[0].sceneId));assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);assert.deepEqual(report.failures,[]);report.pass=true;
}catch(e){report.pass=false;report.error=e.stack;process.exitCode=1;}finally{fs.writeFileSync(path.join(__dirname,'responsive-results.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report));}})();
