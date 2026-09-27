const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root=path.resolve(__dirname,'../..');
const out=__dirname;
const screenshots=path.join(out,'screenshots');
fs.mkdirSync(screenshots,{recursive:true});
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n');
const checks=[];
const check=(name,condition,detail)=>{checks.push({name,pass:!!condition,detail});if(!condition)console.error('FAIL',name,detail);};
const server=http.createServer((request,response)=>{
  let file;
  try{file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://127.0.0.1:4194').pathname));}
  catch{response.writeHead(400);return response.end();}
  if(!file.startsWith(root+path.sep)){response.writeHead(403);return response.end();}
  fs.readFile(file,(error,bytes)=>{
    response.writeHead(error?404:200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    response.end(error?'Not found':bytes);
  });
});

(async()=>{
  await new Promise(resolve=>server.listen(4194,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await context.addInitScript(()=>sessionStorage.setItem('reloadPromoClosed','true'));
  const page=await context.newPage();
  const requests=[],errors=[],warnings=[];
  page.on('request',request=>{if(/\.glb(?:\?|$)/i.test(request.url()))requests.push(request.url());});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());if(message.type()==='warning')warnings.push(message.text());});
  const response=await page.goto('http://127.0.0.1:4194/body-visualizer.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-viewer="ready"]',{timeout:45000});
  const inspect=()=>page.evaluate(async()=>{const app=await import('/assets/js/body-visualizer/app.js');return app.inspectVisualizer();});
  const initial=await inspect();
  check('HTTP 200',response.status()===200,response.status());
  check('viewer ready',await page.locator('[data-viewer="ready"]').count()===1);
  check('one canvas',await page.locator('.bv-stage canvas').count()===1);
  check('19 morph targets',initial.viewer?.meshes?.[0]&&Object.keys(initial.viewer.meshes[0].dictionary).length===19,Object.keys(initial.viewer?.meshes?.[0]?.dictionary||{}).length);
  const keys=['height','weight','chest','waist','hip','inseam','shoulder','arm','thigh','calf'];
  const core=await page.evaluate(()=>[...document.querySelectorAll('[data-field]')].map(field=>({key:field.dataset.field,icon:!!field.querySelector('.bv-field-icon'),help:!!field.querySelector('.bv-measure-help'),helpId:field.querySelector('.bv-measure-help p')?.id,describedBy:field.querySelector('[data-number]')?.getAttribute('aria-describedby')})));
  check('core icons and helpers',keys.slice(0,5).every(key=>core.some(row=>row.key===key&&row.icon&&row.help&&row.describedBy.includes(row.helpId))),core);
  const initiallyClosed=await page.locator('.bv-advanced').evaluate(el=>!el.open)&&await page.locator('.bv-reference').evaluate(el=>!el.open);
  check('advanced remains closed on initial render',initiallyClosed);
  await page.locator('.bv-reference > summary').click();
  await page.locator('.bv-advanced > summary').click();
  const all=await page.evaluate(()=>[...document.querySelectorAll('[data-field]')].map(field=>({key:field.dataset.field,icon:!!field.querySelector('.bv-field-icon'),help:!!field.querySelector('.bv-measure-help'),helpId:field.querySelector('.bv-measure-help p')?.id,describedBy:field.querySelector('[data-number]')?.getAttribute('aria-describedby')})));
  check('ten icon/help relationships',keys.every(key=>all.some(row=>row.key===key&&row.icon&&row.help&&row.describedBy.includes(row.helpId))),all);
  await page.locator('.bv-reference > summary').click();
  await page.locator('.bv-advanced > summary').click();
  const responsive=[];
  for(const [width,height] of [[1440,900],[1280,800],[1024,768],[768,1024],[430,844],[390,844],[375,812]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
    const row=await page.evaluate(()=>{
      const rect=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
      const bmiLabels=[...document.querySelectorAll('.bv-bmi__labels span')].map(rect);
      const contact=document.querySelector('.floating-contact__toggle');
      const camera=[...document.querySelectorAll('.bv-camera button')].map(rect);
      const c=contact?rect(contact):null;
      const overlap=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
      return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,canvasCount:document.querySelectorAll('.bv-stage canvas').length,viewer:rect(document.querySelector('.bv-viewer')),panel:rect(document.querySelector('.bv-panel')),sticky:getComputedStyle(document.querySelector('.bv-viewer')).position,helpTapTargets:[...document.querySelectorAll('.bv-measure-help summary')].map(el=>rect(el).height),bmiLabels,bmiLabelOverlap:bmiLabels.some((r,i)=>i>0&&r.x<bmiLabels[i-1].right),contactCameraOverlap:c&&camera.some(r=>overlap(r,c)),cta:rect(document.querySelector('[data-next]'))};
    });
    responsive.push(row);
    check(`${width} no horizontal overflow`,row.overflow<=1,row.overflow);
    check(`${width} one canvas`,row.canvasCount===1,row.canvasCount);
    check(`${width} BMI labels separate`,!row.bmiLabelOverlap,row.bmiLabels);
    check(`${width} help tap target`,row.helpTapTargets.every(n=>n>=44),row.helpTapTargets);
    check(`${width} contact clear of camera`,!row.contactCameraOverlap);
    check(`${width} CTA in document`,row.cta.height>=44&&row.cta.width>0,row.cta);
    if([1440,1024,390,375].includes(width)){await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);await page.screenshot({path:path.join(screenshots,`${width}.png`),fullPage:true});}
  }
  check('desktop sticky',responsive.find(r=>r.width===1440).sticky==='sticky');
  check('1024 stacked',responsive.find(r=>r.width===1024).panel.y>=responsive.find(r=>r.width===1024).viewer.bottom);
  write('responsive-qa.json',{pass:checks.filter(x=>/^(?:\d+|desktop sticky|1024 stacked)/.test(x.name)).every(x=>x.pass),rows:responsive});

  await page.setViewportSize({width:390,height:844});
  const help=page.locator('[data-field="waist"] .bv-measure-help');
  await help.locator('summary').click();
  await page.locator('#bv-waist').focus();
  const active=await page.evaluate(()=>{const field=document.querySelector('[data-field="waist"]');return {open:field.querySelector('details').open,icon:getComputedStyle(field.querySelector('.bv-field-icon')).color,helperVisible:field.querySelector('.bv-measure-help p').getBoundingClientRect().height>0};});
  check('active field helper and red icon',active.open&&active.helperVisible&&/229, 25, 39/.test(active.icon),active);
  await page.locator('[data-field="waist"]').screenshot({path:path.join(screenshots,'active-waist-helper.png')});
  await help.locator('summary').focus();await page.keyboard.press('Enter');
  check('keyboard toggles helper',!(await help.evaluate(el=>el.open)));
  const focusStyle=await help.locator('summary').evaluate(el=>getComputedStyle(el).outlineStyle);
  check('keyboard help focusable',await help.locator('summary').getAttribute('tabindex')!== '-1',{focusStyle});

  const setNumber=async(key,value)=>{await page.locator(`#bv-${key}`).fill(String(value));await page.waitForTimeout(120);};
  await page.setViewportSize({width:1440,height:900});
  const bmiCases=[];
  for(const target of [17,18.5,22,24.9,25,29.9,30,35.2]){
    await setNumber('weight',(target*1.65*1.65).toFixed(5));
    const row=await page.evaluate(()=>{const bar=document.querySelector('.bv-bmi__bar').getBoundingClientRect(),marker=document.querySelector('[data-bmi-marker]').getBoundingClientRect();return {bmi:document.querySelector('[data-bmi]').textContent,status:document.querySelector('[data-bmi-status]').textContent,markerPercent:(marker.x+marker.width/2-bar.x)/bar.width*100,markerInside:marker.x>=bar.x-2&&marker.right<=bar.right+2,disclaimer:document.querySelector('.bv-bmi__note').textContent};});
    row.target=target;row.expectedStatus=target<18.5?'Thiếu cân':target<25?'Bình thường':target<30?'Thừa cân':'Béo phì';row.expectedPercent=Math.max(2,Math.min(98,(target-15)/25*100));
    bmiCases.push(row);
    check(`BMI ${target} value/status`,Number(row.bmi)===target&&row.status===row.expectedStatus,row);
    check(`BMI ${target} marker`,row.markerInside&&Math.abs(row.markerPercent-row.expectedPercent)<1,row);
    if(target===22||target===35.2)await page.locator('.bv-bmi').screenshot({path:path.join(screenshots,target===22?'bmi-22.png':'bmi-35-plus.png')});
  }
  await setNumber('weight',180);
  const beyond=await page.evaluate(()=>({value:document.querySelector('[data-bmi]').textContent,left:document.querySelector('[data-bmi-marker]').style.left}));
  check('BMI value unclamped, marker clamped',Number(beyond.value)>40&&beyond.left==='98%',beyond);
  write('bmi-qa.json',{pass:checks.filter(x=>x.name.startsWith('BMI ')).every(x=>x.pass),cases:bmiCases,beyond});

  await page.locator('[data-reset]').click();await page.locator('.bv-reset-dialog button[value="reset"]').click();
  await page.waitForTimeout(120);
  check('reset BMI',await page.locator('[data-bmi]').textContent()==='22.0');
  const bmiFunction=await page.evaluate(async()=>{const {calculateBMI}=await import('/assets/js/body-visualizer/state.js');return {missingHeight:calculateBMI(null,60),missingWeight:calculateBMI(165,null),zeroHeight:calculateBMI(0,60),defaultValue:calculateBMI(165,60)};});
  check('BMI formula and missing inputs',bmiFunction.missingHeight===null&&bmiFunction.missingWeight===null&&bmiFunction.zeroHeight===null&&bmiFunction.defaultValue==='22.0',bmiFunction);
  await setNumber('weight',999);
  check('invalid Weight draft preserves committed BMI',await page.locator('#bv-weight').getAttribute('aria-invalid')==='true'&&await page.locator('[data-bmi]').textContent()==='22.0');
  await setNumber('weight',60);
  await setNumber('height',0);
  check('invalid Height draft preserves committed BMI',await page.locator('#bv-height').getAttribute('aria-invalid')==='true'&&await page.locator('[data-bmi]').textContent()==='22.0');
  await setNumber('height',165);
  const beforeWeight=await inspect();
  await setNumber('weight',70);
  const afterWeight=await inspect();
  check('weight BMI only',afterWeight.state.currentBody.weight===70&&JSON.stringify(afterWeight.viewer.applied)===JSON.stringify(beforeWeight.viewer.applied));
  await page.locator('.bv-reference > summary').click();
  const beforeInseam=await inspect();await setNumber('inseam',77);const afterInseam=await inspect();
  check('inseam reference only',afterInseam.state.currentBody.inseam===77&&JSON.stringify(afterInseam.viewer.applied)===JSON.stringify(beforeInseam.viewer.applied));
  const fieldValues={height:166,chest:89,waist:73,hip:93,shoulder:39,arm:29,thigh:53};
  await page.locator('.bv-advanced > summary').click();
  const fieldResults=[];
  for(const [key,value] of Object.entries(fieldValues)){
    await setNumber(key,value);
    const snapshot=await inspect();fieldResults.push({key,requested:value,committed:snapshot.state.currentBody[key],invalid:snapshot.inputs[key].invalid});
  }
  const calfRange=await page.locator('#bv-calf').evaluate(el=>({min:Number(el.min),max:Number(el.max)}));
  const calfValue=Math.round((calfRange.min+calfRange.max)/2);await setNumber('calf',calfValue);
  const calfState=await inspect();fieldResults.push({key:'calf',requested:calfValue,committed:calfState.state.currentBody.calf,invalid:calfState.inputs.calf.invalid});
  check('measurement commits',fieldResults.every(r=>Number.isFinite(r.committed)&&!r.invalid),fieldResults);
  await setNumber('chest',999);
  const invalid=await inspect();
  check('validation marks invalid draft',invalid.inputs.chest.invalid&&invalid.state.currentBody.chest!==999);
  await page.locator('[data-next]').click();
  check('validation blocks progression',(await inspect()).state.step===0);
  await setNumber('chest',89);
  await page.locator('[data-reset]').click();await page.locator('.bv-reset-dialog button[value="reset"]').click();await page.waitForTimeout(120);
  check('reset restores defaults',(await inspect()).state.currentBody.weight===60&&(await inspect()).state.currentBody.calf===null);
  const calfSlider=await page.locator('[data-range="calf"]').getAttribute('aria-valuetext');
  check('null calf slider',calfSlider==='Chưa nhập số đo',calfSlider);
  const chestMax=Number(await page.locator('#bv-chest').getAttribute('max'));
  await setNumber('chest',chestMax);
  await setNumber('height',151.2);
  const pending=await inspect();
  check('pending Height transaction',!!pending.pendingHeight,{pending:pending.pendingHeight,chestMax});
  if(pending.pendingHeight){await page.locator('[data-cancel-height]').click();check('pending Height cancel',(await inspect()).pendingHeight===null);await setNumber('height',151.2);const secondPending=(await inspect()).pendingHeight;if(secondPending){await page.locator('[data-apply-height]').click();check('pending Height apply',Math.abs((await inspect()).state.currentBody.height-secondPending.value)<1e-6);}}
  await page.locator('[data-reset]').click();await page.locator('.bv-reset-dialog button[value="reset"]').click();await page.waitForTimeout(120);
  await page.locator('[data-next]').click();check('Current to Goal',(await inspect()).state.step===1);
  await setNumber('weight',65);check('Goal edit',(await inspect()).state.goalBody.weight===65);
  await page.locator('[data-next]').click();check('Compare',(await inspect()).state.step===2&&(await inspect()).state.mode==='compare');
  await page.locator('[data-mode="goal"]').click();check('Goal mode',(await inspect()).state.mode==='goal');
  await page.locator('[data-mode="compare"]').click();
  await page.locator('#bv-split').fill('60');check('split compare',await page.locator('#bv-split').getAttribute('aria-valuenow')==='60');
  await page.locator('[data-view="side"]').click();check('camera side',await page.locator('[data-view="side"]').getAttribute('aria-pressed')==='true');
  await page.locator('[data-view="reset"]').click();check('camera reset',await page.locator('[data-view="front"]').getAttribute('aria-pressed')==='true');
  const final=await inspect();
  const v5=requests.filter(url=>url.includes('male-mpfb-production-morph-v5-candidate.glb'));
  const v4=requests.filter(url=>/production-morph-v4|v4\./i.test(url));
  const v16=requests.filter(url=>/v16/i.test(url));
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'3D/male-mpfb-production-morph-v5-candidate.glb'))).digest('hex').toUpperCase();
  const changedTrackedFiles=execFileSync('git',['diff','--name-only'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  const presentationFiles=['body-visualizer.html','assets/css/body-visualizer.css','assets/js/body-visualizer/app.js'];
  const protectedPathsModified=changedTrackedFiles.filter(file=>!presentationFiles.includes(file));
  check('protected tracked files untouched',protectedPathsModified.length===0,{changedTrackedFiles,protectedPathsModified});
  check('V5 one request',v5.length===1,v5);
  check('V4/V16 zero requests',v4.length===0&&v16.length===0,{v4,v16});
  check('V5 hash unchanged',hash==='BCE6B0A5A6804694153FCB13BFA5393EC451A37BF30EBA152F0FD6F33DA872AB',hash);
  check('console clean',errors.length===0&&warnings.length===0,{errors,warnings});
  write('functional-regression.json',{pass:checks.every(x=>x.pass),checks:checks.filter(x=>!/^\d+ no horizontal|^\d+ one canvas|^\d+ BMI labels|^\d+ help tap|^\d+ contact|^\d+ CTA|^BMI /.test(x.name)),fieldResults});
  write('runtime-preservation.json',{pass:checks.filter(x=>/viewer ready|one canvas|19 morph|V5 one|V4\/V16|V5 hash|console clean|protected tracked/.test(x.name)).every(x=>x.pass),v5Requests:v5.length,v4Requests:v4.length,v16Requests:v16.length,modelSha256:hash,morphCount:Object.keys(final.viewer.meshes[0].dictionary).length,canvasCount:await page.locator('.bv-stage canvas').count(),consoleErrors:errors,consoleWarnings:warnings,glbRequests:requests,changedTrackedFiles,protectedPathsModified});
  console.log(JSON.stringify({pass:checks.every(x=>x.pass),failures:checks.filter(x=>!x.pass),screenshots:fs.readdirSync(screenshots)},null,2));
  await browser.close();server.close();
  if(checks.some(x=>!x.pass))process.exitCode=1;
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
