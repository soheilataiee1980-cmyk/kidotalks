import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const runtime = createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = runtime("playwright");
const sharp = runtime("sharp");

const out = "visual-checks/home-audit";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const report = [];

for (const width of [390, 1280]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  let css = "";
  for (const [family, subset, weights] of [["vazirmatn", "arabic", [400, 500, 600, 700, 800, 900]], ["fredoka", "latin", [400, 500, 600, 700]]]) for (const weight of weights) {
    const font = fs.readFileSync(`node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff2`).toString("base64");
    css += `@font-face{font-family:'${family === "fredoka" ? "Fredoka" : "Vazirmatn"}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${font}) format('woff2');}\n`;
  }
  await context.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ contentType: "text/css", body: css }));
  const oldPage = await context.newPage();
  await oldPage.goto("file:///" + path.resolve("legacy/index.html").replaceAll("\\", "/"), { waitUntil: "networkidle" });
  const newPage = await context.newPage();
  await newPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  for (const page of [oldPage, newPage]) {
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "*{animation:none!important;transition:none!important} nextjs-portal,#__next-build-watcher{display:none!important}" });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  const oldFull = `${out}/full-${width}-prototype.png`;
  const newFull = `${out}/full-${width}-new.png`;
  await oldPage.screenshot({ path: oldFull, fullPage: true });
  await newPage.screenshot({ path: newFull, fullPage: true });

  const regions = width === 390
    ? { nav: [0, 0, 390, 240], hero: [0, 250, 390, 580], plans: [0, 580, 390, 895], book: [0, 955, 390, 1105] }
    : { nav: [0, 0, 1280, 170], hero: [0, 200, 1280, 610], plans: [0, 610, 1280, 745], book: [0, 805, 1280, 965] };

  for (const [name, [left, top, right, bottom]] of Object.entries(regions)) {
    const clip = { left, top, width: right - left, height: bottom - top };
    const oldFile = `${out}/${name}-${width}-prototype.png`;
    const newFile = `${out}/${name}-${width}-new.png`;
    await sharp(oldFull).extract(clip).toFile(oldFile);
    await sharp(newFull).extract(clip).toFile(newFile);
    const a = await sharp(oldFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const b = await sharp(newFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let different = null;
    let maxDelta = 0;
    if (a.info.width === b.info.width && a.info.height === b.info.height) {
      different = 0;
      for (let i = 0; i < a.data.length; i += 4) {
        if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) different++;
        maxDelta = Math.max(maxDelta, Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
      }
    }
    report.push({ width, region: name, prototypeSize: a.info, newSize: b.info, differentPixels: different, totalPixels: a.info.width * a.info.height, maxDelta });
  }
  await context.close();
}

console.log(JSON.stringify(report, null, 2));
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
