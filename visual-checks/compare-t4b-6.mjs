import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const runtime=createRequire('C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=runtime('playwright'),sharp=runtime('sharp');
const base=process.env.VISUAL_BASE_URL||'http://localhost:3020';
const directory=process.env.VISUAL_OUTPUT_DIR||'visual-checks/t4b-6';fs.mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
const report=[];
function unitData(u){const source=fs.readFileSync(`data/units/unit-${String(u).padStart(2,'0')}.ts`,'utf8');return JSON.parse(source.slice(source.indexOf('const data = ')+13,source.indexOf(' satisfies CourseUnit;')))}
try{
 for(const width of [390,1280])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});let css='';
  for(const [family,subset,weights] of [['vazirmatn','arabic',[400,500,600,700,800,900]],['fredoka','latin',[400,500,600,700]]])for(const weight of weights){const font=fs.readFileSync(`node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff2`).toString('base64');css+=`@font-face{font-family:'${family==='fredoka'?'Fredoka':'Vazirmatn'}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${font}) format('woff2');}`}
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));
  const old=await context.newPage(),fresh=await context.newPage(),errors=[],scans=[];
  fresh.on('pageerror',e=>errors.push(e.message));fresh.on('request',r=>{if(/assets\/book|u\d+-(sb|wb)-\d+\.webp/.test(r.url()))scans.push(r.url())});
  for(const page of [old,fresh])await page.addInitScript(()=>{window.testSpeech=[];window.testCancels=0;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>window.testCancels++,speak:u=>window.testSpeech.push({text:u.text,rate:u.rate,lang:u.lang})},configurable:true})});
  await old.goto('file:///'+path.resolve('legacy/index.html').replaceAll('\\','/'));
  async function compare(name){
   const prefix=`${directory}/${name}-${width}-${theme}`;
   for(const page of [old,fresh]){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'*{animation:none!important;transition:none!important}'});await page.evaluate(()=>window.scrollTo(0,0))}
   for(const [label,page] of [['prototype',old],['new',fresh]])await page.locator('main').screenshot({path:prefix+'-'+label+'.png',animations:'disabled'});
   const overlap=await old.evaluate(()=>Math.max(0,Math.ceil(document.querySelector('nav').getBoundingClientRect().bottom-document.querySelector('main').getBoundingClientRect().top)));
   const meta=await sharp(prefix+'-prototype.png').metadata();const crop={left:0,top:Math.min(overlap,meta.height-1),width:meta.width,height:meta.height-Math.min(overlap,meta.height-1)};
   const a=await sharp(prefix+'-prototype.png').extract(crop).ensureAlpha().raw().toBuffer(),b=await sharp(prefix+'-new.png').extract(crop).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length,`${name} image geometry`);
   let differentPixels=0,maxDelta=0;for(let i=0;i<a.length;i+=4){let different=false;for(let j=0;j<3;j++){const d=Math.abs(a[i+j]-b[i+j]);if(d)different=true;maxDelta=Math.max(maxDelta,d)}if(different)differentPixels++}
   const row={name,width,theme,differentPixels,maxDelta};report.push(row);console.log(JSON.stringify(row));assert.ok(differentPixels<=120&&maxDelta<=2,`${name} unexpected visual difference`)
  }
  for(let u=1;u<=15;u++){
   const data=unitData(u);await old.evaluate(n=>{openMenuUnit(n);jumpLesson(6)},u);await fresh.goto(`${base}/#tab=lessons&u=${u}&lesson=6`);
   await old.locator('.single-lesson[data-lesson="6"]').waitFor();await fresh.locator('.single-lesson[data-lesson="6"]').waitFor();
   assert.equal(await fresh.locator('.teacher-box h2').textContent(),'اول بگو، بعد بنویس');
   assert.deepEqual(await fresh.locator('.teacher-box ol li').allTextContents(),['یکی از جمله‌های نمونه را گوش کن و بلند تکرار کن.',data.writing.prompt,data.writing.mechanics]);
   assert.equal(await fresh.locator('.teacher-examples p.en').textContent(),data.writing.sample.replace(/[’‘]/g,"'"));
   await compare(`unit-${u}-guide`);
   await fresh.getByRole('button',{name:'🔊 بشنو و تکرار کن',exact:true}).click();assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).text),data.writing.sample.replace(/[’‘]/g,"'"));
   await fresh.getByRole('button',{name:'دفتر نوشتن من',exact:true}).click();await fresh.getByRole('heading',{name:'دفتر نوشتن من ✏️'}).waitFor();
   assert.equal(await fresh.locator('#course-writing').getAttribute('maxlength'),'2000');assert.equal(await fresh.locator('#course-writing').getAttribute('placeholder'),'Write your sentences here...');
   await old.evaluate(()=>courseWriting());await old.locator('#course-writing').waitFor();
   await compare(`unit-${u}-notebook`);
   await fresh.getByRole('button',{name:'🔊 نوشته‌ام را بخوان',exact:true}).click();await fresh.getByText('اول جمله‌ات را بنویس.',{exact:true}).waitFor();
   const note=`Unit ${u} notebook test`;await fresh.locator('#course-writing').fill(note);await fresh.getByRole('button',{name:'ذخیرهٔ نوشته',exact:true}).click();await fresh.getByText('نوشته‌ات ذخیره شد.',{exact:true}).waitFor();
   assert.equal(await fresh.evaluate(n=>localStorage.getItem(`kidotalk-writing-${n}`),u),note);
   await fresh.getByRole('button',{name:'🔊 نوشته‌ام را بخوان',exact:true}).click();assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).text),note);assert.equal(await fresh.evaluate(()=>window.testSpeech.at(-1).lang),'en-US');
   const sample= fresh.locator('details.plan');await sample.locator('summary').click();assert.equal(await sample.locator('.reading').textContent(),data.writing.sample.replace(/[’‘]/g,"'"));
   await fresh.reload();await fresh.locator('.single-lesson[data-lesson="6"]').waitFor();await fresh.getByRole('button',{name:'دفتر نوشتن من',exact:true}).click();await fresh.getByRole('heading',{name:'دفتر نوشتن من ✏️'}).waitFor();await fresh.waitForFunction(()=>document.querySelector('#course-writing').value!=='');assert.equal(await fresh.locator('#course-writing').inputValue(),note);
   await fresh.getByRole('button',{name:'برگشت ›',exact:true}).click();await fresh.locator('.single-lesson[data-lesson="6"]').waitFor();
   if(u===1||u===3){assert.equal(await fresh.locator('.lesson-tabs button').count(),6)}else assert.equal(await fresh.locator('.lesson-tabs button').count(),7);
   if(u===15)await fresh.getByRole('button',{name:'درس بعدی',exact:true}).click().then(async()=>{await fresh.getByText('این بخش در حال آماده‌سازی است.',{exact:true}).waitFor();assert.equal(await fresh.locator('.single-lesson').getAttribute('data-lesson'),'6')});
  }
  if(width===390&&theme==='light'){
   await fresh.goto(`${base}/#tab=lessons&u=15&lesson=6`);await fresh.locator('.single-lesson[data-lesson="6"]').waitFor();
   await fresh.getByRole('button',{name:'قبلش جمله‌سازی کنیم',exact:true}).click();await fresh.getByText('این بخش در حال آماده‌سازی است.',{exact:true}).waitFor();
   await fresh.getByRole('button',{name:'۱. یاد بگیر',exact:true}).click();assert.equal(await fresh.locator('.toast').count(),0);
   for(const name of ['حالا تمرین کنیم','ویدیوی همین درس','همهٔ بازی‌ها']){await fresh.getByRole('button',{name,exact:true}).click();await fresh.getByText('این بخش در حال آماده‌سازی است.',{exact:true}).waitFor();assert.equal(await fresh.locator('.single-lesson').getAttribute('data-lesson'),'6')}
   await fresh.getByRole('button',{name:'۱. یاد بگیر',exact:true}).click();assert.equal(await fresh.locator('.toast').count(),0);
   await fresh.locator('.learning-menu summary').click();await fresh.locator('.menu-unit').nth(0).click();await fresh.locator('.single-lesson[data-lesson="1"]').waitFor();await fresh.locator('.lesson-tabs button').nth(5).click();await fresh.locator('.single-lesson[data-lesson="6"]').waitFor();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(scans,[]);await context.close();
 }
 fs.writeFileSync(`${directory}/report.json`,JSON.stringify(report,null,2));
 console.log('PASS: all 15 guide prompts/examples, sample audio, local notebook save/reload/read/empty-read/sample, section and unit navigation, later section pending, no scan requests or page errors.');
}finally{await browser.close()}
