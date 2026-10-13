import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const runtime = createRequire('C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const { chromium } = runtime('playwright');
const sharp = runtime('sharp');
(async () => {
 const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']});
 const report=[];
 for(const width of [390,1280]) for(const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  // Use the same self-hosted font files for the prototype without editing legacy/.
  let css='';
  for(const [family,subset,weights] of [['vazirmatn','arabic',[400,500,600,700,800,900]],['fredoka','latin',[400,500,600,700]]]) for(const weight of weights) {
    const font=fs.readFileSync(`node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff2`).toString('base64');
    css+=`@font-face{font-family:'${family==='fredoka'?'Fredoka':'Vazirmatn'}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${font}) format('woff2');}\n`;
  }
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:css}));
  const old=await context.newPage(), fresh=await context.newPage();
  await old.goto('file:///'+path.resolve('legacy/index.html').replaceAll('\\','/'),{waitUntil:'domcontentloaded'});
  await fresh.goto('http://localhost:3001');
  for(const page of [old,fresh]) {
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   await page.evaluate(()=>document.fonts.ready);
   await page.addStyleTag({content:'*{animation:none!important;transition:none!important}'});
  }
  await fresh.locator('nav .tab').first().waitFor();
  const prefix=`visual-checks/${width}-${theme}`;
  for(const [name,page] of [['prototype',old],['new',fresh]]) { await page.evaluate(()=>window.scrollTo(0,0)); const isolated = await page.addStyleTag({content:'#app > :not(nav) { visibility: hidden !important; }'}); await page.screenshot({path:prefix+'-'+name+'-navigation.png',clip:await page.locator('nav').boundingBox()}); await isolated.evaluate(e=>e.remove()); }
  await old.screenshot({path:prefix+'-prototype.png',fullPage:true});
  await fresh.screenshot({path:prefix+'-new.png',fullPage:true});
  const a=await sharp(prefix+'-prototype-navigation.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const b=await sharp(prefix+'-new-navigation.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let pixels=null;
  if(a.info.width===b.info.width&&a.info.height===b.info.height) {pixels=0;for(let i=0;i<a.data.length;i+=4)if(a.data.subarray(i,i+4).compare(b.data.subarray(i,i+4)))pixels++;}
  await fresh.locator('.site-footer').screenshot({path:prefix+'-footer.png'});
  let maxDelta=0; for(let i=0;i<a.data.length;i++) maxDelta=Math.max(maxDelta,Math.abs(a.data[i]-b.data[i])); report.push({width,theme,prototypeSize:a.info,newSize:b.info,differentPixels:pixels,maxDelta});
  if(theme==='light') {
   for(const label of ['📚 کتاب‌ها','📖 درس‌ها','🎮 تمرین‌ها','🎬 ویدیوها','⭐ پیشرفت','👨‍👩‍👧 والدین']) {
    await fresh.getByRole('button',{name:label,exact:true}).click();
    await fresh.getByRole('status').waitFor();
   }
   await fresh.getByRole('button',{name:'تغییر زبان‌آموز'}).click();
   await fresh.getByRole('button',{name:'🏠 خانه',exact:true}).click();
   await fresh.locator('.site-footer summary').filter({hasText:'دربارهٔ ما'}).click();
   if(!await fresh.getByText('کیدوتاکس برای یادگیری انگلیسی کودکان فارسی‌زبان ۵ تا ۸ سال طراحی شده است.').isVisible())throw Error('Footer disclosure failed');
  }
  await context.close();
 }
 fs.writeFileSync('visual-checks/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
