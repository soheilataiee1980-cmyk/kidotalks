import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const require = (await import("node:module")).createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const sharp = require("sharp");
const base = process.env.VISUAL_BASE_URL || "http://127.0.0.1:3021";
const directory = "visual-checks/t5c";
const prototypePath = `file:///${path.resolve("legacy/index.html").replaceAll("\\", "/")}`;
fs.mkdirSync(directory, { recursive: true });

function courseUnit(id) {
  const source = fs.readFileSync(`data/units/unit-${String(id).padStart(2, "0")}.ts`, "utf8");
  return JSON.parse(source.slice(source.indexOf("const data = ") + 13, source.indexOf(" satisfies CourseUnit;")));
}
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const report = { sourceContent: [], visual: [], interaction: [], regression: [], errors: [] };
const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
await context.addInitScript(() => {
  let seed = 4321;
  Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  window.resetVisualSeed = () => { seed = 4321; };
  Object.defineProperty(window, "speechSynthesis", { value: { cancel() {}, speak() {}, getVoices: () => [] }, configurable: true });
});
let fontCss = "";
for (const [family, subset, weights] of [["vazirmatn", "arabic", [400, 500, 600, 700, 800, 900]], ["fredoka", "latin", [400, 500, 600, 700]]]) {
  for (const weight of weights) {
    const file = `node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff2`;
    fontCss += `@font-face{font-family:'${family === "fredoka" ? "Fredoka" : "Vazirmatn"}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(file).toString("base64")}) format('woff2');}`;
  }
}
await context.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: fontCss }));
const old = await context.newPage();
const fresh = await context.newPage();
fresh.on("pageerror", error => report.errors.push(error.message));
fresh.on("request", request => { if (/assets\/book|u\d+-(sb|wb)-\d+\.webp/.test(request.url())) report.errors.push(`textbook scan requested: ${request.url()}`); });

async function openLegacyMemory(id) {
  await old.evaluate(() => window.resetVisualSeed());
  await old.evaluate(unit => { selectUnit(unit, "practice"); start("mem"); }, id);
  await old.locator(".teacher-memory button").first().waitFor({ state: "visible" });
}
async function openNewMemory(id, resetSeed = true) {
  await fresh.goto(`${base}/#tab=home`);
  await fresh.locator("main").waitFor({ state: "visible" });
  await fresh.goto(`${base}/#tab=practice&u=${id}`);
  await fresh.getByRole("button", { name: /بازی حافظه/ }).first().waitFor({ state: "visible" });
  await fresh.getByRole("button", { name: /بازی حافظه/ }).first().click();
  await fresh.locator(".activity-tile").waitFor({ state: "visible" });
  if (resetSeed) await fresh.evaluate(() => window.resetVisualSeed());
  await fresh.locator(".activity-tile").click();
  await fresh.locator(".teacher-memory button").first().waitFor({ state: "visible" });
}
async function assertLayout(page) {
  const layout = await page.evaluate(() => {
    const visible = [...document.querySelectorAll("main button:not(:disabled)")].filter(button => button.getBoundingClientRect().width > 0).map(button => button.getBoundingClientRect());
    const overlaps = [];
    for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
      const a = visible[i], b = visible[j];
      if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1) overlaps.push([i, j]);
    }
    return { overlaps, width: document.documentElement.scrollWidth, viewport: innerWidth };
  });
  assert.deepEqual(layout.overlaps, [], "visible controls must not overlap");
  assert.ok(layout.width <= layout.viewport, "page must not overflow horizontally");
  return layout;
}
async function captureComparison(width, theme) {
  await old.setViewportSize({ width, height: 900 });
  await fresh.setViewportSize({ width, height: 900 });
  await openLegacyMemory(1);
  await openNewMemory(1);
  for (const page of [old, fresh]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
    await page.locator(".teacher-memory").screenshot({ path: `${directory}/cards-${width}-${theme}-${page === old ? "prototype" : "new"}.png`, animations: "disabled" });
  }
  // Include the full play area as a second pair of screenshots for reviewers.
  const prefix = `${directory}/game-${width}-${theme}`;
  await old.locator("main").screenshot({ path: `${prefix}-prototype.png`, animations: "disabled" });
  await fresh.locator("main").screenshot({ path: `${prefix}-new.png`, animations: "disabled" });
  const left = `${prefix}-prototype.png`, right = `${prefix}-new.png`;
  const lm = await sharp(left).metadata(), rm = await sharp(right).metadata();
  assert.equal(lm.width, rm.width, `screenshot widths differ at ${width}px ${theme}`);
  assert.equal(lm.height, rm.height, `screenshot heights differ at ${width}px ${theme}`);
  const a = await sharp(left).ensureAlpha().raw().toBuffer(), b = await sharp(right).ensureAlpha().raw().toBuffer();
  let differingPixels = 0, maxChannelDelta = 0;
  for (let i = 0; i < a.length; i += 4) {
    let differs = false;
    for (let c = 0; c < 3; c++) { const delta = Math.abs(a[i + c] - b[i + c]); maxChannelDelta = Math.max(maxChannelDelta, delta); if (delta > 2) differs = true; }
    if (differs) differingPixels++;
  }
  report.visual.push({ width, theme, differingPixels, totalPixels: lm.width * lm.height, maxChannelDelta });
  await assertLayout(fresh);
}

async function completeMemory(page) {
  const cards = page.locator(".local-memory");
  const groups = await cards.evaluateAll(nodes => {
    const byWord = new Map();
    nodes.forEach((node, index) => { const word = node.getAttribute("data-pair"); if (!byWord.has(word)) byWord.set(word, []); byWord.get(word).push(index); });
    return [...byWord.values()];
  });
  assert.equal(groups.length, 4, "exactly four content pairs should be present");
  for (let index = 0; index < groups.length; index++) {
    const [first, second] = groups[index];
    await cards.nth(first).click();
    await cards.nth(second).click();
    await page.waitForFunction(expected => document.querySelector("#memory-count")?.textContent?.trim() === `${expected} از 4 جفت`, index + 1);
  }
}

try {
  await old.goto(`${prototypePath}#tab=practice`);
  for (let id = 1; id <= 15; id++) {
    const unit = courseUnit(id);
    const usable = unit.words.filter(word => word.svg || word.emoji || (word.imageFile && fs.existsSync(`public/assets/words/${word.imageFile}`)));
    report.sourceContent.push({ unit: id, words: unit.words.length, cards: Math.min(4, usable.length) * 2, missingArtwork: unit.words.filter(word => !word.svg && !word.emoji && (!word.imageFile || !fs.existsSync(`public/assets/words/${word.imageFile}`))).map(word => word.en) });
    assert.ok(usable.length >= 4, `unit ${id} requires at least four illustrated words`);
  }

  for (const width of [390, 1280]) for (const theme of ["light", "dark"]) await captureComparison(width, theme);

  for (const id of [1, 7, 13, 15]) {
    await openNewMemory(id, false);
    const cards = fresh.locator(".local-memory");
    assert.equal(await cards.count(), 8, `unit ${id} must start with four vocabulary pairs`);
    let mismatchPair = null;
    for (let firstIndex = 0; firstIndex < 8 && !mismatchPair; firstIndex++) {
      if (await cards.nth(firstIndex).isDisabled()) continue;
      await cards.nth(firstIndex).click();
      const firstLabel = await cards.nth(firstIndex).getAttribute("aria-label");
      assert.ok(firstLabel && firstLabel !== `کارت بسته ${firstIndex + 1}`, `unit ${id} should reveal real vocabulary art`);
      for (let secondIndex = firstIndex + 1; secondIndex < 8; secondIndex++) {
        if (await cards.nth(secondIndex).isDisabled()) continue;
        await cards.nth(secondIndex).click();
        const firstWord = await cards.nth(firstIndex).getAttribute("data-pair");
        const secondWord = await cards.nth(secondIndex).getAttribute("data-pair");
        if (secondWord !== firstWord) {
          mismatchPair = [firstIndex, secondIndex];
          break;
        }
        await fresh.waitForTimeout(1050);
        break;
      }
    }
    assert.ok(mismatchPair, `unit ${id} should have two different words for a mismatch test`);
    assert.match(await fresh.locator("#m").innerText(), /جای این دو کارت را به خاطر بسپار/);
    await fresh.waitForTimeout(1550);
    for (const index of mismatchPair) assert.equal(await cards.nth(index).getAttribute("aria-label"), `کارت بسته ${index + 1}`, `unit ${id} should close an incorrect pair`);
    // Reset and use the same picture/name assets for a complete four-pair run.
    await fresh.locator("header .ghost").click();
    await fresh.getByRole("button", { name: /بازی حافظه/ }).first().click();
    await fresh.locator(".activity-tile").click();
    await completeMemory(fresh);
    await fresh.waitForTimeout(1100);
    assert.match(await fresh.locator("main").innerText(), /جفت‌ها را پیدا کردی!/);
    assert.equal(await fresh.getByRole("img", { name: "5 از ۵ ستاره" }).count(), 1);
    await assertLayout(fresh);
    report.interaction.push({ unit: id, pairs: 4, correctPairs: 4, incorrectPairReset: true, stars: 5, completed: true });
    await fresh.getByRole("button", { name: "دوباره تمرین کن" }).click();
    assert.equal(await fresh.locator(".local-memory").count(), 8);
    assert.match(await fresh.locator("#memory-count").innerText(), /۰ از 4 جفت/);
    report.interaction.at(-1).restart = "8 closed cards, counter reset";
    assert.equal(report.sourceContent[id - 1].missingArtwork.length, 0, `unit ${id} has usable custom/emoji artwork`);
  }

  // T5b regression: its entry point, wrong feedback, and correct match still work.
  await fresh.goto(`${base}/#tab=home`);
  await fresh.goto(`${base}/#tab=practice&u=15`);
  await fresh.getByRole("button", { name: /وصل کن/ }).click();
  const chosen = fresh.locator(".pair-picture").first();
  const chosenWord = await chosen.getAttribute("data-word");
  await chosen.click();
  await fresh.locator(".pair-word").filter({ hasNotText: chosenWord }).first().click();
  assert.match(await fresh.locator("#m").innerText(), /کلمهٔ دیگری را امتحان کن/);
  await fresh.locator(".pair-word").filter({ hasText: chosenWord }).first().click();
  assert.equal(await fresh.locator(".pair-picture:disabled").count(), 1);
  report.regression.push("T5b: matching tile, incorrect feedback, and correct locked pair passed at unit 15.");

  // T5a regression: the actual reading question accepts a wrong attempt and then the source answer.
  const reading = courseUnit(15).reading.questions[0];
  await fresh.goto(`${base}/#tab=home`);
  await fresh.goto(`${base}/#tab=lessons&u=15&lesson=5`);
  const choices = fresh.locator(".opts .opt");
  await choices.first().waitFor({ state: "visible" });
  const wrongIndex = reading.options.findIndex(option => option !== reading.answer);
  const rightIndex = reading.options.findIndex(option => option === reading.answer);
  await choices.nth(wrongIndex).click();
  assert.match(await fresh.locator("#m").innerText(), /یک بار دیگر نگاه کن و امتحان کن/);
  await choices.nth(rightIndex).click();
  assert.match(await fresh.locator("#m").innerText(), /آفرین/);
  report.regression.push("T5a: unit 15 reading choice rejects a wrong answer and accepts the source answer.");

  assert.deepEqual(report.errors, [], "no browser errors or textbook scans");
  fs.writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
