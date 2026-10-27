import fs from "node:fs";
import { createRequire } from "node:module";
const runtime = createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = runtime("playwright");

const base = "http://localhost:3000";
const out = "visual-checks/home-audit";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const report = {};
for (const width of [390, 1280]) {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${out}/home-${width}-${theme}.png`, fullPage: true });
    report[`${width}-${theme}`] = await page.evaluate(() => {
      const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
      const nav = document.querySelector("nav");
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        nav: box(nav),
        navScroll: { scrollWidth: nav.scrollWidth, clientWidth: nav.clientWidth },
        hero: box(document.querySelector(".hero")),
        plans: [...document.querySelectorAll(".plans .plan")].map(box),
        book: box(document.querySelector(".cards")),
        h1: document.querySelector("h1")?.innerText,
        buttons: [...document.querySelectorAll("nav .tab")].map((b) => ({ text: b.innerText.trim(), w: Math.round(b.getBoundingClientRect().width), visible: b.getBoundingClientRect().width > 0 })),
        footer: box(document.querySelector(".site-footer")),
      };
    });
    await context.close();
  }
}
console.log(JSON.stringify(report, null, 2));
await browser.close();
