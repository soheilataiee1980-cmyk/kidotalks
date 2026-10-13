import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const runtime=createRequire('C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=runtime('playwright'), sharp=runtime('sharp');
const base=process.env.VISUAL_BASE_URL||'http://localhost:3014';
const directory='visual-checks/t4a';fs.mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const report=[];
try {
for(const width of [390,1280])for(const theme of ['light','dark']) {
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
 let css='';
 for(const [family,subset,weights] of [['vazirmatn','arabic',[400,500,600,700,800,900]],['fredoka','latin',[400,500,600,700]]])for(const weight of weights){
  const font=fs.readFileSync(`node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff2`).toString('base64');
  css+=`@font-face{font-family:'${family==='fredoka'?'Fredoka':'Vazirmatn'}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${font}) format('woff2');}`;
 }
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));
 const old=await context.newPage(),fresh=await context.newPage();const errors=[],scans=[];
 fresh.on('pageerror',e=>errors.push(e.message));fresh.on('request',r=>{if(/assets\/book|u\d+-(sb|wb)-\d+\.webp/.test(r.url()))scans.push(r.url())});
 await old.goto('file:///'+path.resolve('legacy/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});
 await fresh.goto(base);
 for(const page of [old,fresh]){
  await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'*{animation:none!important;transition:none!important}'});
 }
 for(const tab of ['home','books','book']) {
  await old.evaluate(t=>window.go(t),tab);
  await fresh.evaluate(t=>{location.hash='tab='+t},tab);
  await fresh.waitForFunction(t=>document.body.dataset.theme===(t==='book'?'books':t),tab);
  if(tab==='book')await fresh.locator('main .cards .act').nth(14).waitFor();
  await fresh.evaluate(()=>new Promise(requestAnimationFrame));
  const prefix=`${directory}/${tab}-${width}-${theme}`;
  const bounds=[];
  for(const page of [old,fresh]) {
   await page.evaluate(()=>scrollTo(0,0));
   bounds.push(await page.evaluate(()=>({height:Math.ceil(document.querySelector('main').lastElementChild.getBoundingClientRect().bottom),width:innerWidth})));
  }
  const height=Math.max(...bounds.map(b=>b.height));
  for(const [name,page] of [['prototype',old],['new',fresh]]) {
   await page.screenshot({path:prefix+'-'+name+'-content.png',clip:{x:0,y:0,width,height},captureBeyondViewport:true});
   await page.screenshot({path:prefix+'-'+name+'-full.png',fullPage:true});
  }
  const a=await sharp(prefix+'-prototype-content.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(prefix+'-new-content.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let pixels=0,maxDelta=0;assert.equal(a.data.length,b.data.length);
  for(let i=0;i<a.data.length;i+=4){let differs=false;for(let j=0;j<3;j++){const delta=Math.abs(a.data[i+j]-b.data[i+j]);maxDelta=Math.max(maxDelta,delta);if(delta)differs=true;}if(differs)pixels++;}
  report.push({tab,width,theme,prototypeContentHeight:bounds[0].height,newContentHeight:bounds[1].height,differentPixels:pixels,maxDelta});
  assert.equal(bounds[0].height,bounds[1].height,'Content geometry must match the prototype');
  // The owner-requested footer affects mobile background/blur compositing.
  // Keep it visible in these screenshots; the isolation experiment is documented in README.md.
  if(width===390 && tab==='books') { assert.ok(pixels<=51000); assert.ok(maxDelta<=3); }
  else if(width===390 && tab==='book') { assert.ok(pixels<=120); assert.ok(maxDelta<=26); }
  else assert.equal(pixels,0,'Unexpected visual difference');
 }
 // Verify selection, reload, local progress, browser history, and the units alias.
 await fresh.getByRole('button',{name:/Unit 15 ·/}).click();
 await fresh.getByRole('status').waitFor();
 await fresh.getByRole('button',{name:'🏠 خانه',exact:true}).click();
 await fresh.getByText('Unit 15',{exact:true}).waitFor();
 await fresh.reload();await fresh.getByText('Unit 15',{exact:true}).waitFor();
 await fresh.getByRole('button',{name:'ادامهٔ یادگیری',exact:true}).click();
 await fresh.waitForURL(/tab=lessons&u=15/);
 await fresh.evaluate(()=>{location.hash='tab=units'});await fresh.locator('main .cards .act').nth(14).waitFor();
 assert.equal(await fresh.locator('main .cards .act').count(),15);
 await fresh.goBack();await fresh.getByRole('status').waitFor();
 assert.equal(await fresh.locator('img[src*="assets/book"]').count(),0);assert.deepEqual(scans,[]);assert.deepEqual(errors,[]);
 await context.close();
}
fs.writeFileSync(directory+'/report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
console.log('Navigation, reload, local unit persistence, history, and no-scan checks passed.');
} finally {await browser.close()}
