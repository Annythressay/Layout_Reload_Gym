const fs=require('fs');const assert=require('node:assert/strict');const {chromium}=require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const {fields,defaults,validateMeasurement,calculateBMI,calculateBodyMorph}=await import('../assets/js/body-visualizer/state.js');
 for(const [key,[label,min,max]] of Object.entries(fields)){
  for(const raw of ['',NaN,Infinity,-1,max+1,min-1])assert.equal(validateMeasurement(key,raw),null);
  for(const value of [min,max])assert(Object.values(calculateBodyMorph({...defaults,[key]:value})).every(Number.isFinite));
 }
 assert.equal(calculateBMI(0,60),null);assert.equal(calculateBMI(165,60),'22.0');
 const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();const errors=[],layouts=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>sessionStorage.setItem('reloadPromoClosed','true'));
 for(const name of ['index','about','facilities','services','membership','locations','class-schedule','blog']){
  const response=await page.goto(`http://127.0.0.1:4173/${name}.html`);assert.equal(response.status(),200);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('header').count(),1);assert.equal(await page.locator('footer').count(),1);
  for(const width of [1440,1280,1024,768,430,390,375]){await page.setViewportSize({width,height:900});await page.waitForTimeout(40);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert(overflow<=1,`${name} ${width}: ${overflow}`);layouts.push({name,width,overflow});}
 }
 await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');await page.locator('.search-toggle').click();await page.locator('#site-search').fill('body');assert.equal(await page.locator('#search-results a').getAttribute('href'),'body-visualizer.html');
 assert.deepEqual(errors,[]);fs.writeFileSync('qa/body-visualizer-regression.json',JSON.stringify({layouts,errors,utilityChecks:'passed'},null,2));console.log(`${layouts.length} regression layouts passed; boundary utilities passed; menu and search passed.`);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
