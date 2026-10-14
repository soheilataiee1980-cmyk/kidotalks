import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const runtime=createRequire('C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=runtime('playwright'), sharp=runtime('sharp');
const base=process.env.VISUAL_BASE_URL||'http://localhost:3015';
const directory='visual-checks/t4b-1';fs.mkdirSync(directory,{recursive:true});
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
  await fresh.goto(base+'/#tab=lessons&u=1');
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
   if(name==='unit-13' && width===1280) { assert.ok(differentPixels<=30);assert.ok(maxDelta<=2); }
   else assert.equal(differentPixels,0,'Unexpected visual difference');
  }
  for(let u=1;u<=15;u++){
   await old.evaluate(n=>{openMenuUnit(n);},u);
   await fresh.goto(base+'/#tab=lessons&u='+u);
   await fresh.getByText(`Unit ${u} ·`,{exact:false}).first().waitFor();
   const expected=await old.locator('.single-lesson .wc').allTextContents();
   assert.deepEqual(await fresh.locator('.single-lesson .wc').allTextContents(),expected,`Unit ${u} words`);
   assert.equal(await fresh.locator('.lesson-tabs button').count(),u===1||u===3?6:7);
   assert.ok(await fresh.evaluate(async()=>{const images=[...document.querySelectorAll('.single-lesson img')];await Promise.all(images.map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));return images.every(i=>i.naturalWidth>0);}),`Unit ${u} images load`);
   if([1,2,3,4,13,15].includes(u))await compare('unit-'+u);
  }
  // Native beach audio loads the existing file and has a finite duration.
  await fresh.waitForFunction(()=>document.querySelector('audio')?.readyState>=1);
  assert.ok(await fresh.locator('audio').evaluate(a=>a.duration>0&&Number.isFinite(a.duration)));
  await fresh.goto(base+'/#tab=lessons&u=1');await old.evaluate(()=>openMenuUnit(1));
  await fresh.locator('.learning-menu summary').click();await old.locator('.learning-menu summary').click();
  await compare('menu');
  await fresh.locator('.learning-menu summary').press('Escape');assert.equal(await fresh.locator('.learning-menu').getAttribute('open'),null);
  await old.locator('.learning-menu summary').press('Escape');
  await fresh.locator('.wc').first().click();
  const spokenWord=await fresh.evaluate(()=>window.testSpeech.at(-1));
  assert.equal(spokenWord.text,'pen');assert.equal(spokenWord.lang,'en-US');assert.ok(Math.abs(spokenWord.rate-.82)<.000001);
  await fresh.getByLabel('سرعت').selectOption('0.75');
  assert.ok(Math.abs(await fresh.evaluate(()=>window.testSpeech.at(-1).rate)-.82*.75)<.000001);
  await fresh.locator('#audio-mute').click();const spoken=await fresh.evaluate(()=>window.testSpeech.length);
  await fresh.locator('.wc').nth(1).click();assert.equal(await fresh.evaluate(()=>window.testSpeech.length),spoken);
  await fresh.locator('#audio-mute').click();await fresh.locator('#audio-repeat').click();
  assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).text),'eraser');
  // Fresh remount clears temporary audio state before screenshot comparison.
  await fresh.goto(base+'/#tab=books');await fresh.goto(base+'/#tab=lessons&u=1');
  await fresh.getByRole('button',{name:'🃏 کارت‌ها را یکی‌یکی ببین',exact:true}).click();
  await old.evaluate(()=>launchWordCards());await compare('flashcard');
  assert.equal(await fresh.getByRole('button',{name:'قبلی',exact:true}).isDisabled(),true);
  for(let i=1;i<5;i++)await fresh.getByRole('button',{name:'بعدی',exact:true}).click();
  await fresh.getByText('کارت 5 از 5',{exact:true}).waitFor();
  await fresh.getByRole('button',{name:'حالا تمرین کنیم',exact:true}).click();
  await fresh.getByText('این بخش در حال آماده‌سازی است.',{exact:true}).waitFor();
  await fresh.getByRole('button',{name:'برگشت ›',exact:true}).click();
  await fresh.locator('.lesson-tabs button').nth(1).click();
  assert.equal(await fresh.locator('.single-lesson').getAttribute('data-lesson'),'1');
  await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-unit').nth(14).click();
  await fresh.getByText('Unit 15 · Let\'s play ball!',{exact:true}).waitFor();await fresh.reload();
  await fresh.getByText('Unit 15 · Let\'s play ball!',{exact:true}).waitFor();
  await fresh.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true}));
  await fresh.locator('.wc').first().click();
  await fresh.getByText('پخش صدا در این مرورگر در دسترس نیست.',{exact:true}).waitFor();
  assert.deepEqual(scans,[]);assert.deepEqual(errors,[]);
  await context.close();
 }
 fs.writeFileSync(directory+'/report.json',JSON.stringify(report,null,2));
 console.log('PASS: all 15 word lists, six/seven sections, speech controls, beach audio, cards, menu, reload, no scan requests, no browser errors.');
} finally {await browser.close();}
