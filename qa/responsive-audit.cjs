const fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/cnhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const phase=process.argv[2]||'after';
const out=path.join(__dirname,'responsive',phase);fs.mkdirSync(out,{recursive:true});
const pages=fs.readdirSync(path.join(root,'templates/pages')).filter(n=>n.endsWith('.html'));
const sizes=[[1920,1080],[1600,900],[1440,900],[1366,768],[1280,800],[1200,800],[1024,768],[991,900],[834,1194],[768,1024],[767,800],[575,800],[430,932],[414,896],[390,844],[375,812],[360,800],[320,568],[844,390],[667,375]];
const intermediate=[1300,1199,1100,1050,1000,992,950,900,850,800,750,700,650,600,576,550,500,450,400,350];
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();await page.addInitScript(()=>sessionStorage.setItem('reloadPromoClosed','true'));const errors=[],consoleErrors=[],results=[],desktop={};page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
for(const file of pages){await page.goto('http://127.0.0.1:4173/'+file,{waitUntil:'domcontentloaded'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
for(const [width,height] of [...sizes,...intermediate.map(w=>[w,850])]){await page.setViewportSize({width,height});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(130);
const state=await page.evaluate(()=>{
 if(document.styleSheets[1].cssRules.length<10)throw new Error('Application stylesheet did not parse');
 const visible=e=>{const s=getComputedStyle(e);return e.getClientRects().length&&s.visibility!=='hidden'&&s.opacity!=='0'&&!e.closest('[aria-hidden="true"],.sr-only')};
 const label=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'.'+String(e.className).trim().replaceAll(' ','.'));
 const intentional=e=>{for(let p=e;p&&p!==document.body;p=p.parentElement){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX))return true;}return false;};
 const outside=[...document.querySelectorAll('body *')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return (r.right>innerWidth+1||r.left< -1)&&!intentional(e)}).map(label);
 const clipped=[];for(const e of document.querySelectorAll('h1,h2:not(.sr-only),h3,p,button,.button')){if(!visible(e)||e.closest('.news-section__track'))continue;const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect(),box=e.getBoundingClientRect();if(r.width&&r.right>box.right+2)clipped.push(label(e));}
 const overlap=(a,b)=>a&&b&&a.width&&b.width&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
 const card=document.querySelector('.video-preview')?.getBoundingClientRect();const heroOverlap=['.hero-copy','.hero-brand','.hero-index'].filter(s=>{const e=document.querySelector(s);return e&&visible(e)&&overlap(card,e.getBoundingClientRect())});
 const head=[...document.querySelector('.header-inner').children].filter(visible).map(e=>({name:label(e),r:e.getBoundingClientRect()}));const headerOverlap=[];for(let i=0;i<head.length;i++)for(let j=i+1;j<head.length;j++)if(overlap(head[i].r,head[j].r))headerOverlap.push([head[i].name,head[j].name]);
 return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,outside,clipped,heroOverlap,headerOverlap};});results.push({file,...state});
if(sizes.some(v=>v[0]===width&&v[1]===height)&&(phase==='after'||[1440,1200,834,375,320].includes(width)))await page.screenshot({path:path.join(out,`${file.slice(0,-5)}-${width}.png`),fullPage:true});
if([1920,1440,1200].includes(width))desktop[file+'-'+width]=await page.evaluate(()=>[...document.querySelectorAll('main>section,.header-inner,.footer-grid,.hero-copy,.hero-brand,.video-preview')].map(e=>{const r=e.getBoundingClientRect();return [e.className,...['x','y','width','height'].map(k=>Math.round(r[k]*100)/100)]}));
}
console.log(file+': '+(sizes.length+intermediate.length)+' viewports');}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors,consoleErrors,desktop},null,2));const issues=results.filter(r=>r.overflow||r.outside.length||r.clipped.length||r.heroOverlap.length||r.headerOverlap.length);
const baselineFile=path.join(__dirname,'responsive/before/results.json');
const desktopChanges=phase==='after'&&fs.existsSync(baselineFile)?Object.keys(desktop).filter(key=>JSON.stringify(desktop[key])!==JSON.stringify(JSON.parse(fs.readFileSync(baselineFile,'utf8')).desktop[key])):[];
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({cases:results.length,issues,errors,consoleErrors,desktopChanges},null,2));
console.log(JSON.stringify({cases:results.length,issues,errors,consoleErrors,desktopChanges},null,2));
if(phase==='after'&&(issues.length||errors.length||consoleErrors.length||desktopChanges.length))process.exitCode=1;await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
