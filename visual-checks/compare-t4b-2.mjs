import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const runtime=createRequire('C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=runtime('playwright'), sharp=runtime('sharp');
const base=process.env.VISUAL_BASE_URL||'http://localhost:3016';
const directory=process.env.VISUAL_OUTPUT_DIR||'visual-checks/t4b-2';fs.mkdirSync(directory,{recursive:true});
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
  fresh.on('pageerror',e=>errors.push(e.message));fresh.on('request',r=>{if(/assets\/book|u\d+-(sb|wb)-\d+\.webp/.test(r.url()))scans.push(r.url());});
  await fresh.addInitScript(()=>{
   window.testSpeech=[];window.testCancels=0;
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>window.testCancels++,speak:u=>window.testSpeech.push({text:u.text,rate:u.rate,lang:u.lang})},configurable:true});
  });
  await old.goto('file:///'+path.resolve('legacy/index.html').replaceAll('\\','/'));
  await fresh.goto(base+'/#tab=lessons&u=1&lesson=2');
  for(const page of [old,fresh]){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   await page.evaluate(()=>document.fonts.ready);
   await page.addStyleTag({content:'*{animation:none!important;transition:none!important}'});
  }
  for(let unit=1;unit<=15;unit++){
   await old.evaluate(n=>{openMenuUnit(n);jumpLesson(2);},unit);
   await fresh.goto(base+`/#tab=lessons&u=${unit}&lesson=2`);
   await fresh.locator('.single-lesson[data-lesson="2"]').waitFor();
   await fresh.getByText(`Unit ${unit} ·`,{exact:false}).first().waitFor();
   for(const selector of ['.teacher-box','.teacher-examples article','.your-turn'])assert.deepEqual(await fresh.locator(selector).allTextContents(),await old.locator(selector).allTextContents(),`Unit ${unit}: ${selector}`);
   assert.equal(await fresh.locator('.teacher-examples article').count(),unit===1?2:unit===2?9:4);
   assert.equal(await fresh.locator('#beach-audio').count(),0,'Beach recording belongs to vocabulary only');
   const bounds=await Promise.all([old,fresh].map(p=>p.evaluate(()=>{scrollTo(0,0);return Math.ceil(document.querySelector('main').lastElementChild.getBoundingClientRect().bottom);})));const height=Math.max(...bounds);
   const prefix=`${directory}/unit-${unit}-${width}-${theme}`;
   for(const [label,page] of [['prototype',old],['new',fresh]])await page.screenshot({path:prefix+'-'+label+'.png',clip:{x:0,y:0,width,height},captureBeyondViewport:true});
   const a=await sharp(prefix+'-prototype.png').ensureAlpha().raw().toBuffer(),b=await sharp(prefix+'-new.png').ensureAlpha().raw().toBuffer();let differentPixels=0,maxDelta=0;
   assert.equal(a.length,b.length);
   for(let i=0;i<a.length;i+=4){let differs=false;for(let j=0;j<3;j++){let d=Math.abs(a[i+j]-b[i+j]);if(d)differs=true;maxDelta=Math.max(maxDelta,d);}if(differs)differentPixels++;}
   report.push({unit,width,theme,prototypeHeight:bounds[0],newHeight:bounds[1],differentPixels,maxDelta});
   console.log(JSON.stringify(report.at(-1)));
   assert.equal(bounds[0],bounds[1]);
   // Tiny existing glass-navigation rasterization differences are bounded;
   // educational content must remain pixel-identical.
   assert.ok(differentPixels<=100 && maxDelta<=2,'Unexpected visual difference');
   const navBottom=await old.locator('nav').evaluate(n=>Math.ceil(n.getBoundingClientRect().bottom));
   for(let i=navBottom*width*4;i<a.length;i++)assert.equal(a[i],b[i],'Lesson content must match exactly');
   if(width===390 && theme==='light') {
   const examples=await fresh.locator('.teacher-examples p.en').allTextContents();
   for(let i=0;i<examples.length;i++){
    await fresh.getByRole('button',{name:'🔊 بشنو و تکرار کن',exact:true}).nth(i).click();
    assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).text),examples[i]);
   }
   await fresh.locator('.lesson-pagination button').first().click();
   await fresh.locator('.single-lesson[data-lesson="1"]').waitFor();
   assert.ok(await fresh.locator('.wc').count()>0);
   await fresh.locator('.lesson-pagination button').last().click();
   await fresh.locator('.single-lesson[data-lesson="2"]').waitFor();
   }
  }
  await fresh.reload();await fresh.locator('.single-lesson[data-lesson="2"]').waitFor();
  await fresh.getByRole('button',{name:'🔊 بشنو و تکرار کن',exact:true}).first().click();
  await fresh.getByLabel('سرعت').selectOption('0.75');assert.ok(Math.abs(await fresh.evaluate(()=>window.testSpeech.at(-1).rate)-.82*.75)<.000001);
  await fresh.locator('#audio-mute').click();const spoken=await fresh.evaluate(()=>window.testSpeech.length);
  await fresh.getByRole('button',{name:'🔊 بشنو و تکرار کن',exact:true}).nth(1).click();assert.equal(await fresh.evaluate(()=>window.testSpeech.length),spoken);
  await fresh.locator('#audio-mute').click();await fresh.locator('#audio-repeat').click();
  const cancellations=await fresh.evaluate(()=>window.testCancels);
  await fresh.locator('.lesson-tabs button').first().click();await fresh.locator('.single-lesson[data-lesson="1"]').waitFor();
  assert.ok(await fresh.evaluate(()=>window.testCancels)>cancellations);
  await fresh.goBack();await fresh.locator('.single-lesson[data-lesson="2"]').waitFor();
  await fresh.locator('.lesson-tabs button').nth(4).click();await fresh.getByText('این بخش در حال آماده‌سازی است.',{exact:true}).waitFor();assert.equal(await fresh.locator('.single-lesson').getAttribute('data-lesson'),'2');
  await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-lessons button').first().click();await fresh.locator('.single-lesson[data-lesson="1"]').waitFor();
  await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-lessons button').nth(1).click();await fresh.locator('.single-lesson[data-lesson="2"]').waitFor();
  await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-unit').first().click();await fresh.locator('.single-lesson[data-lesson="1"]').waitFor();
  await fresh.getByText("Unit 1 · What's this?",{exact:true}).waitFor();
  await fresh.getByRole('button',{name:'🏠 خانه',exact:true}).click();await fresh.getByRole('button',{name:'ادامهٔ یادگیری',exact:true}).waitFor();
  await fresh.getByRole('button',{name:'📚 کتاب‌ها',exact:true}).click();await fresh.getByRole('button',{name:/Family and Friends 1/}).click();await fresh.locator('main .cards .act').nth(14).waitFor();assert.equal(await fresh.locator('main .cards .act').count(),15);
  assert.deepEqual(errors,[]);assert.deepEqual(scans,[]);await context.close();
 }
 fs.writeFileSync(directory+'/report.json',JSON.stringify(report,null,2));
 console.log('PASS: all 15 sentence sections, exact prototype text/order, each pronunciation button, controls, previous/next/tabs/menu/history/reload, home/books, no later lesson implementation, no scans or browser errors.');
} finally {await browser.close();}
