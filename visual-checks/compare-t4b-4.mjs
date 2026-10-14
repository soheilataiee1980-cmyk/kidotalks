import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const runtime=createRequire('C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=runtime('playwright'), sharp=runtime('sharp');
const base=process.env.VISUAL_BASE_URL||'http://localhost:3018';
const directory=process.env.VISUAL_OUTPUT_DIR||'visual-checks/t4b-4';fs.mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const report=[];
try {
 for(const width of [390,1280]) for(const theme of ['light','dark']) {
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
   window.testSpeech=[]; window.testCancels=0;
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>window.testCancels++,speak:u=>window.testSpeech.push({text:u.text,rate:u.rate,lang:u.lang})},configurable:true});
  });
  await old.goto('file:///'+path.resolve('legacy/index.html').replaceAll('\\','/'));
  await fresh.goto(base+'/#tab=lessons&u=1&lesson=4');
  for(const page of [old,fresh]){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   await page.evaluate(()=>document.fonts.ready);
   await page.addStyleTag({content:'*{animation:none!important;transition:none!important}'});
  }
  async function compare(name){
   for(const page of [old,fresh]){
    await page.evaluate(async()=>{scrollTo(0,0);await Promise.all([...document.querySelectorAll('main img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
   }
   const bounds=await Promise.all([old,fresh].map(p=>p.evaluate(()=>Math.ceil(document.querySelector('main').lastElementChild.getBoundingClientRect().bottom))));
   const height=Math.max(...bounds),prefix=`${directory}/${name}-${width}-${theme}`;
   for(const [label,p] of [['prototype',old],['new',fresh]])await p.screenshot({path:prefix+'-'+label+'.png',clip:{x:0,y:0,width,height},captureBeyondViewport:true});
   const a=await sharp(prefix+'-prototype.png').ensureAlpha().raw().toBuffer(),b=await sharp(prefix+'-new.png').ensureAlpha().raw().toBuffer();
   assert.equal(a.length,b.length);let differentPixels=0,maxDelta=0;
   for(let i=0;i<a.length;i+=4){let different=false;for(let j=0;j<3;j++){const d=Math.abs(a[i+j]-b[i+j]);if(d)different=true;maxDelta=Math.max(maxDelta,d);}if(different)differentPixels++;}
   const row={name,width,theme,prototypeHeight:bounds[0],newHeight:bounds[1],differentPixels,maxDelta};report.push(row);console.log(JSON.stringify(row));
   assert.equal(bounds[0],bounds[1],'Prototype and app geometry must match');
   assert.ok(differentPixels<=100 && maxDelta<=2,'Unexpected visual difference');
   const navBottom=await old.locator('nav').evaluate(n=>Math.ceil(n.getBoundingClientRect().bottom));
   assert.ok(a.subarray(navBottom*width*4).equals(b.subarray(navBottom*width*4)),'Lesson content must match exactly');
  }

  for(let u=1;u<=15;u++){
   await old.evaluate(n=>{openMenuUnit(n);jumpLesson(4);},u);
   await fresh.goto(base+`/#tab=lessons&u=${u}&lesson=4`);
   await fresh.getByText(`Unit ${u} ·`,{exact:false}).first().waitFor();
   await fresh.locator('.single-lesson[data-lesson="4"]').waitFor();
   const source=fs.readFileSync(`data/units/unit-${String(u).padStart(2,'0')}.ts`,'utf8');
   const data=JSON.parse(source.slice(source.indexOf('const data = ')+13,source.indexOf(' satisfies CourseUnit;'))).phonics;
   for(const selector of ['.teacher-box','.phonics-word','.phonics-word mark','.alphabet-course button'])assert.deepEqual(await fresh.locator(selector).allTextContents(),await old.locator(selector).allTextContents(),`Unit ${u}: ${selector}`);
   const buttons=fresh.locator('.single-lesson .teacher-examples button, .alphabet-course button');
   const spoken=data.mode==='alphabet'?[...data.alphabet]:data.items.map(i=>i.word);
   assert.equal(await buttons.count(),spoken.length);
   assert.equal(await fresh.locator('#beach-audio').count(),0);
   if(data.mode==='sounds') {
    assert.deepEqual(await fresh.locator('.phonics-word').allTextContents(),spoken);
    assert.deepEqual(await fresh.locator('.phonics-word mark').allTextContents(),data.items.map(i=>i.sound));
    assert.ok(data.items.every(i=>i.word.includes(i.sound)),'Every highlighted sound exists in its word');
   } else assert.deepEqual(await buttons.allTextContents(),spoken.map(c=>`${c} ${c.toLowerCase()}`));
   await compare(`unit-${u}`);
   for(let i=0;i<spoken.length;i++) {
    await buttons.nth(i).click();
    assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).text),spoken[i]);
    assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).lang),'en-US');
   }
   await fresh.locator('.lesson-pagination button').first().click();await fresh.locator('.single-lesson[data-lesson="3"]').waitFor();
   await fresh.locator('.lesson-pagination button').last().click();await fresh.locator('.single-lesson[data-lesson="4"]').waitFor();
  }
  await fresh.reload();await fresh.locator('.single-lesson[data-lesson="4"]').waitFor();
  const buttons=fresh.locator('.teacher-examples button');
  await buttons.first().click();await fresh.getByLabel('سرعت').selectOption('0.75');
  assert.ok(Math.abs(await fresh.evaluate(()=>window.testSpeech.at(-1).rate)-.82*.75)<.000001);
  await fresh.locator('#audio-mute').click();const spoken=await fresh.evaluate(()=>window.testSpeech.length);
  await buttons.nth(1).click();assert.equal(await fresh.evaluate(()=>window.testSpeech.length),spoken);
  await fresh.locator('#audio-mute').click();await fresh.locator('#audio-repeat').click();assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).text),'bug');
  const cancellations=await fresh.evaluate(()=>window.testCancels);
  await fresh.locator('.lesson-pagination button').first().click();await fresh.locator('.single-lesson[data-lesson="3"]').waitFor();
  assert.ok(await fresh.evaluate(()=>window.testCancels)>cancellations);
  await fresh.goBack();await fresh.locator('.single-lesson[data-lesson="4"]').waitFor();
  await fresh.locator('.lesson-tabs button').nth(5).click();await fresh.getByText('این بخش در حال آماده‌سازی است.',{exact:true}).waitFor();assert.equal(await fresh.locator('.single-lesson').getAttribute('data-lesson'),'4');
  for(const name of ['حالا تمرین کنیم','ویدیوی همین درس','همهٔ بازی‌ها']) {
   await fresh.getByRole('button',{name,exact:true}).click();await fresh.getByText('این بخش در حال آماده‌سازی است.',{exact:true}).waitFor();
  }
  await fresh.getByRole('button',{name:'۱. یاد بگیر',exact:true}).click();assert.equal(await fresh.locator('.toast').count(),0);
  await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-lessons button').first().click();await fresh.locator('.single-lesson[data-lesson="1"]').waitFor();
  await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-lessons button').nth(3).click();await fresh.locator('.single-lesson[data-lesson="4"]').waitFor();
  await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-unit').nth(6).click();await fresh.getByText('Unit 7 ·',{exact:false}).first().waitFor();await fresh.locator('.single-lesson[data-lesson="1"]').waitFor();
  await fresh.locator('.lesson-tabs button').nth(3).click();await fresh.locator('.alphabet-course button').nth(25).waitFor();
  await fresh.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true}));await fresh.locator('.alphabet-course button').first().click();await fresh.getByText('پخش صدا در این مرورگر در دسترس نیست.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(scans,[]);await context.close();
 }
 fs.writeFileSync(directory+'/report.json',JSON.stringify(report,null,2));
 console.log('PASS: 15 phonics sections, 50 full words and 26 alphabet buttons, exact content/highlights, audio controls, previous/next/tabs/menu/history/reload, missing speech support, later sections pending, no scans/errors.');
} finally {await browser.close();}
