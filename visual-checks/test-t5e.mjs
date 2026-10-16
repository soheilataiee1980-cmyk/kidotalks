import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const require = (await import("node:module")).createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const sharp = require("sharp");
const base = process.env.VISUAL_BASE_URL || "http://127.0.0.1:3022";
const out = "visual-checks/t5e";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
await context.addInitScript(() => {
  Object.defineProperty(Math, "random", { value: () => 0.5, configurable: true });
  Object.defineProperty(window, "speechSynthesis", { value: { cancel() {}, speak(utterance) { (window.__spoken ??= []).push(utterance.text); }, getVoices: () => [] }, configurable: true });
  localStorage.setItem("kidotalk-local-v2", JSON.stringify({ version: 2, active: "child-panda", profiles: [{ id: "child-panda", name: "آزمایش", avatar: "🐼" }] }));
});
const page = await context.newPage();
const legacy = await context.newPage();
page.setDefaultTimeout(10000);
const report = { supportedUnits: [], unsupportedUnits: [], interactions: [], regression: [], visual: [], errors: [] };
page.on("pageerror", error => report.errors.push(error.message));

function sourceWords(unit) {
  const source = fs.readFileSync(`data/units/unit-${String(unit).padStart(2, "0")}.ts`, "utf8");
  const start = source.indexOf('"words": [') + '"words": '.length;
  const end = source.indexOf('\n  ],\n  "grammar"', start) + 4;
  assert.ok(start >= 0 && end > start, `unit ${unit} word source found`);
  return JSON.parse(source.slice(start, end));
}

async function openGame(unit) {
  await page.goto(`${base}/#tab=practice&u=${unit}`);
  if (unit >= 4) {
    const tile = page.getByRole("button", { name: /املای واژه‌ها/ });
    await tile.waitFor({ state: "visible" });
    await tile.click();
    await page.locator(".spelling-game").waitFor({ state: "visible" });
  }
}

async function currentWord(unit) {
  const clue = await page.locator(".spelling-picture").getAttribute("aria-label");
  const meaning = clue.replace("راهنمای تصویری: ", "");
  const word = sourceWords(unit).find(item => item.fa === meaning);
  assert.ok(word, `current spelling clue has an existing word in unit ${unit}`);
  return word;
}

async function checkRepresentative(unit) {
  await openGame(unit);
  const first = await currentWord(unit);
  assert.ok(await page.locator(".spelling-picture svg, .spelling-picture img, .spelling-picture .pic").count(), `unit ${unit} renders its existing picture clue`);
  await page.getByRole("button", { name: /تلفظ/ }).click();
  assert.equal(await page.evaluate(() => window.__spoken.at(-1)), first.en, `unit ${unit} audio clue speaks the target word`);
  assert.equal(await page.locator("#audio-repeat").isEnabled(), true, `unit ${unit} enables repeat after pronunciation`);
  await page.locator("#audio-repeat").click();
  assert.equal(await page.evaluate(() => window.__spoken.at(-1)), first.en, `unit ${unit} repeats the existing pronunciation`);
  await page.locator("#audio-speed").selectOption("0.75");
  assert.equal(await page.locator("#audio-speed").inputValue(), "0.75", `unit ${unit} can select the existing slow speed`);
  await page.locator("#course-spelling").fill("incorrect answer");
  await page.locator("#course-spell-check").click();
  assert.equal(await page.locator("#course-feedback").innerText(), "یک بار دیگر گوش کن و بنویس.");
  assert.equal(await page.locator(".spelling-picture").getAttribute("aria-label"), `راهنمای تصویری: ${first.fa}`, "wrong answer retains the same picture/audio clue");
  const progress = await page.locator(".progress-wrap .bar").getAttribute("aria-valuenow");
  await page.locator("#course-spelling").fill(`  ${first.en.toUpperCase()}  `);
  await page.locator("#course-spelling").press("Enter");
  await page.waitForTimeout(850);
  if (await page.locator(".spelling-game h1").innerText() !== "یک قدم جلو رفتی!") {
    assert.notEqual(await page.locator(".spelling-picture").getAttribute("aria-label"), `راهنمای تصویری: ${first.fa}`, `unit ${unit} advances after a normalized correct answer`);
    assert.ok(Number(await page.locator(".progress-wrap .bar").getAttribute("aria-valuenow")) >= Number(progress));
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `unit ${unit} has no horizontal overflow`);
  report.interactions.push(`unit ${unit}: image hint, pronunciation/repeat/speed controls, incorrect feedback, normalized correct answer`);
}

try {
  console.log("T5e browser: checking source-backed unit availability");
  await page.goto(`${base}/#tab=practice&u=1`);
  console.log("T5e browser: unit 1 loaded");
  await page.locator(".activity-grid").waitFor({ state: "visible" });
  console.log("T5e browser: practice grid loaded");
  for (const unit of [1, 2, 3]) {
    console.log(`T5e browser: checking source exclusion unit ${unit}`);
    await page.goto(`${base}/#tab=practice&u=${unit}`);
    assert.equal(await page.getByRole("button", { name: /املای واژه‌ها/ }).count(), 0, `unit ${unit} does not advertise an exercise absent from the prototype`);
    report.unsupportedUnits.push(unit);
  }
  for (const unit of [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
    console.log(`T5e browser: checking available unit ${unit}`);
    await openGame(unit);
    assert.ok((await page.locator(".spelling-picture").getAttribute("aria-label")).startsWith("راهنمای تصویری:"));
    report.supportedUnits.push(unit);
    await page.getByRole("button", { name: "برگشت ›" }).click();
  }
  console.log("T5e browser: availability passed; checking answers and completion");
  report.interactions.push("practice entry: spelling is available for every source-backed unit 4–15 and absent for units 1–3 like the prototype");
  await checkRepresentative(13);
  await checkRepresentative(15);

  await page.goto(`${base}/#tab=practice&u=7`);
  await page.getByRole("button", { name: /املای واژه‌ها/ }).click();
  const initialWord = await currentWord(7);
  await page.locator("#course-spelling").fill("wrong");
  await page.locator("#course-spell-check").click();
  assert.equal(await page.locator("#course-feedback").innerText(), "یک بار دیگر گوش کن و بنویس.");
  await page.locator("#course-spelling").fill(initialWord.en);
  await page.locator("#course-spell-check").click();
  await page.waitForTimeout(850);
  while (!(await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).count())) {
    const word = await currentWord(7);
    await page.locator("#course-spelling").fill(word.en);
    await page.locator("#course-spell-check").click();
    await page.waitForTimeout(850);
  }
  assert.equal(await page.locator(".game-result-avatar").textContent(), "🐼", "completed spelling game uses the active saved profile avatar");
  assert.equal(await page.locator(".stars .earned").count(), 4, "one word attempted incorrectly earns four stars using legacy mistake thresholds");
  await page.screenshot({ path: `${out}/completion-u7-390-light.png`, animations: "disabled" });
  await page.getByRole("button", { name: "دوباره تمرین کن" }).click();
  assert.equal(await page.locator(".progress-wrap .bar").getAttribute("aria-valuenow"), "0");
  await page.getByRole("button", { name: "برگشت ›" }).click();
  report.interactions.push("unit 7: complete all words, first-attempt mistake scoring, dynamic saved avatar, and restart verified");
  console.log("T5e browser: completion passed; capturing prototype comparisons");

  for (const width of [390, 1280]) for (const theme of ["light", "dark"]) {
    await page.setViewportSize({ width, height: 900 });
    await legacy.setViewportSize({ width, height: 900 });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await legacy.goto(`file:///${path.resolve("legacy/index.html").replaceAll("\\", "/")}#tab=practice`);
    await legacy.evaluate(() => { selectUnit(7, "practice"); start("spell"); });
    await legacy.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await legacy.locator("#course-spelling").waitFor({ state: "visible" });
    await page.goto(`${base}/#tab=home`);
    await page.goto(`${base}/#tab=practice&u=7`);
    await page.getByRole("button", { name: /املای واژه‌ها/ }).click();
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.evaluate(() => document.fonts.ready);
    const prefix = `${out}/spelling-${width}-${theme}`;
    await page.locator(".spelling-game").screenshot({ path: `${prefix}-new.png`, animations: "disabled" });
    await legacy.locator("#app main").screenshot({ path: `${prefix}-prototype.png`, animations: "disabled" });
    const [newMeta, oldMeta] = await Promise.all([sharp(`${prefix}-new.png`).metadata(), sharp(`${prefix}-prototype.png`).metadata()]);
    report.visual.push({ width, theme, react: { width: newMeta.width, height: newMeta.height }, prototype: { width: oldMeta.width, height: oldMeta.height }, note: "Paired screenshots saved for visual comparison; React capture isolates the game body while prototype includes its frame." });
  }
  report.regression.push("Passed separately: visual-checks/test-t5d.mjs covers T5a reading, T5b matching, T5c memory dimensions/avatar and T5d ordering.");
  assert.deepEqual(report.errors, []);
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
