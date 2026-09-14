const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'about-rebuild');
const sizes=[[1920,1080],[1600,900],[1440,900],[1366,768],[1280,720],[1024,768],[768,1024],[430,932],[412,915],[390,844],[375,812]];
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const stable=['index.html','facilities.html','blog.html','assets/css/style.css','assets/js/main.js','templates/header.html','templates/footer.html','templates/floating-contact.html','templates/promo-popup.html'];
(async()=>{
fs.mkdirSync(out,{recursive:true});
const before=process.argv.includes('--before');
if(before){for(const f of ['templates/pages/about.html','assets/css/about.css','assets/js/about.js'])fs.copyFileSync(path.join(root,f),path.join(out,path.basename(f)+'.before'));fs.writeFileSync(path.join(out,'hashes.json'),JSON.stringify(Object.fromEntries(stable.map(f=>[f,hash(f)])),null,2));}
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext();await context.addInitScript(()=>sessionStorage.setItem('reloadPromoClosed','true'));
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const results=[];
for(const [width,height] of sizes){
await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4173/about.html');await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('main img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
const data=await page.evaluate(()=>{
const story=document.querySelector('.about-story');
const props=['fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','padding','margin','width','height','display','position','clipPath','overflowY'];
return {overflow:document.documentElement.scrollWidth>innerWidth,story:story.outerHTML,styles:[story,...story.querySelectorAll('*')].map(e=>Object.fromEntries(props.map(p=>[p,getComputedStyle(e)[p]]))),broken:[...document.querySelectorAll('main img')].filter(i=>!i.naturalWidth).map(i=>i.src),h1:document.querySelectorAll('h1').length};});
results.push({width,height,...data});
await page.locator('.about-story').screenshot({path:path.join(out,`story-${before?'before':'after'}-${width}.png`)});
if(!before){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});await page.waitForTimeout(100);await page.screenshot({path:path.join(out,`page-${width}.png`),fullPage:true});await page.screenshot({path:path.join(out,`hero-${width}.png`)});if([1440,768,390].includes(width))for(const section of ['purpose','journey','values','register'])await page.locator(`.about-${section}`).screenshot({path:path.join(out,`${section}-${width}.png`)});}
}
fs.writeFileSync(path.join(out,before?'before.json':'after.json'),JSON.stringify({results,errors},null,2));
if(!before){const old=JSON.parse(fs.readFileSync(path.join(out,'before.json')));const hashes=JSON.parse(fs.readFileSync(path.join(out,'hashes.json')));const summary={sizes:results.map((r,i)=>({width:r.width,height:r.height,overflow:r.overflow,broken:r.broken,oneH1:r.h1===1,storyDOM:r.story===old.results[i].story,storyStyles:JSON.stringify(r.styles)===JSON.stringify(old.results[i].styles)})),errors,unchanged:Object.fromEntries(stable.map(f=>[f,hash(f)===hashes[f]]))};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));}
await browser.close();
})();
