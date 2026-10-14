import fs from 'node:fs';
import path from 'node:path';
const runtime=(await import('node:module')).createRequire('C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=runtime('playwright'),sharp=runtime('sharp');
const base=process.env.VISUAL_BASE_URL||'http://localhost:3017';
const directory=process.env.VISUAL_OUTPUT_DIR||'visual-checks/t4b-7';fs.mkdirSync(directory,{recursive:true});
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
   const a=await sharp(prefix+'-prototype.png').extract(crop).ensureAlpha().raw().toBuffer(),b=await sharp(prefix+'-new.png').extract(crop).ensureAlpha().raw().toBuffer();assertEqual(a.length,b.length,`${name} image geometry`);
   let differentPixels=0,maxDelta=0;for(let i=0;i<a.length;i+=4){let different=false;for(let j=0;j<3;j++){const d=Math.abs(a[i+j]-b[i+j]);if(d)different=true;maxDelta=Math.max(maxDelta,d)}if(different)differentPixels++}
   const row={name,width,theme,differentPixels,maxDelta};report.push(row);console.log(JSON.stringify(row));
   if(differentPixels>120||maxDelta>2){console.error('DIFF',name,width,theme,differentPixels,maxDelta)}
  }
  function assertEqual(a,b,msg){ if(a!==b) throw new Error(msg) }
  const units=[2,4,5,6,7,8,9,10,11,12,13,14,15];
  for(const u of units){
   const data=unitData(u);
   await old.evaluate(n=>{openMenuUnit(n);jumpLesson(7)},u);
   await fresh.goto(`${base}/#tab=lessons&u=${u}&lesson=7`);
   await old.locator('.single-lesson[data-lesson="7"]').waitFor();
   await fresh.locator('.single-lesson[data-lesson="7"]').waitFor();
   {
     const text=await fresh.locator('.teacher-box h2').textContent();
     const expected = u===2 ? 'جمع کنیم' : data.extra.title;
     if(text!==expected) throw new Error('unit '+u+' extra heading '+text+' != '+expected);
   }
   await compare(`unit-${u}-extra`);
  }
  if(width===390&&theme==='light'){
   await fresh.goto(`${base}/#tab=lessons&u=4&lesson=7`);
   await fresh.locator('.single-lesson[data-lesson="7"]').waitFor();
   await fresh.goto(`${base}/#tab=lessons&u=2&lesson=7`);
   await fresh.locator('.single-lesson[data-lesson="7"]').waitFor();
  }
  if(errors.length) throw new Error(JSON.stringify(errors));
  if(scans.length) throw new Error(JSON.stringify(scans));
  await context.close();
 }
 fs.writeFileSync(`${directory}/report.json`,JSON.stringify(report,null,2));
 console.log('PASS visual loop');
}finally{await browser.close()}