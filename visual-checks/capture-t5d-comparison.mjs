import fs from "node:fs";
import path from "node:path";

const require = (await import("node:module")).createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const base = process.env.VISUAL_BASE_URL || "http://127.0.0.1:3022";
const output = "visual-checks/t5d";
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
const app = await context.newPage();
const prototype = await context.newPage();
try {
  await prototype.goto(`file:///${path.resolve("legacy/index.html").replaceAll("\\", "/")}#tab=practice`);
  for (const width of [390, 1280]) for (const theme of ["light", "dark"]) {
    await app.setViewportSize({ width, height: 900 });
    await prototype.setViewportSize({ width, height: 900 });
    await app.goto(`${base}/#tab=practice&u=7`);
    await app.reload();
    await app.locator(".activity-tile").nth(2).click();
    await prototype.evaluate(() => { selectUnit(7, "practice"); start("order"); });
    await app.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await prototype.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await app.addStyleTag({ content: "nav,.course-switch{display:none!important}" });
    await app.evaluate(() => document.fonts.ready);
    const prefix = `${output}/core-ordering-${width}-${theme}`;
    await app.locator(".ordering-game").screenshot({ path: `${prefix}-new.png`, animations: "disabled" });
    await prototype.locator("main").screenshot({ path: `${prefix}-prototype.png`, animations: "disabled" });
  }
} finally { await browser.close(); }
