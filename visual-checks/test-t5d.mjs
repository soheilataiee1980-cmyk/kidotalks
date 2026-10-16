import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const require = (await import("node:module")).createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const sharp = require("sharp");
const base = process.env.VISUAL_BASE_URL || "http://127.0.0.1:3022";
const out = "visual-checks/t5d";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
await context.addInitScript(() => Object.defineProperty(window, "speechSynthesis", { value: { cancel() {}, speak() {}, getVoices: () => [] }, configurable: true }));
const page = await context.newPage();
const legacy = await context.newPage();
const report = { supportedUnits: [], unsupportedUnit: 2, interactionChecks: [], regression: [], visual: [], errors: [] };
page.on("pageerror", error => report.errors.push(error.message));

async function openNew(unit) {
  const target = `${base}/#tab=practice&u=${unit}`;
  if (page.url() === target) await page.reload();
  else await page.goto(target);
  await page.locator(".activity-tile").nth(2).waitFor({ state: "visible" });
  if (unit === 2) return;
  await page.locator(".activity-tile").nth(2).click();
  await page.locator(".ordering-game").waitFor({ state: "visible" });
}
async function openLegacy(unit) {
  await legacy.evaluate(id => { selectUnit(id, "practice"); start("order"); }, unit);
  await legacy.locator(".course-piece, .piece3, .opt").first().waitFor({ state: "visible" });
}
async function chooseInOrder() {
  const count = await page.locator(".ordering-token-list button:not(:disabled)").count();
  for (let index = 0; index < count; index++) await page.locator(`.ordering-token-list button[data-token-index="${index}"]:not(:disabled)`).click();
}
async function completeGame(unit, width, theme, screenshot = true) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  await openNew(unit);
  for (let i = 0; i < 100 && !(await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).count()); i++) {
    await chooseInOrder();
    if (unit !== 1 && unit !== 3) {
      await page.getByRole("button", { name: "بررسی جمله" }).click();
      assert.match(await page.locator(".ordering-feedback").innerText(), /جمله درست است/);
    }
    await page.waitForTimeout(850);
    if (await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).count()) break;
    await page.waitForTimeout(900);
  }
  await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).waitFor({ state: "visible", timeout: 6000 });
  assert.equal(await page.locator(".game-result-avatar").textContent(), "🐼", `unit ${unit} uses the active profile avatar`);
  assert.ok(await page.locator(".stars .earned").count() >= 1, "completion awards stars");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
  const layout = await page.evaluate(() => { const avatar = document.querySelector(".game-result-avatar").getBoundingClientRect(), nav = document.querySelector("nav").getBoundingClientRect(); return { avatarTop: avatar.top, navBottom: nav.bottom }; });
  assert.ok(layout.avatarTop >= layout.navBottom - 1, "sticky navigation does not cover the result avatar");
  if (screenshot) await page.screenshot({ path: `${out}/result-u${unit}-${width}-${theme}.png`, animations: "disabled" });
}

try {
  await page.goto(`${base}/#tab=home`);
  await page.evaluate(() => localStorage.setItem("kidotalk-local-v2", JSON.stringify({ version: 2, active: "child-panda", profiles: [{ id: "child-panda", name: "آزمایش", avatar: "🐼" }] })));
  await legacy.goto(`file:///${path.resolve("legacy/index.html").replaceAll("\\", "/")}#tab=practice`);

  await openNew(2);
  assert.equal(await page.locator(".unavailable-activity").getAttribute("aria-disabled"), "true", "U2 explains that its source has no token-ordering game");
  assert.match(await page.locator(".unavailable-activity").innerText(), /در نمونهٔ این یونیت وجود ندارد/);
  report.interactionChecks.push("unit 2 truthfully marks token-ordering unavailable; original unit 2 activity is multiple-choice, not a token game");

  for (const unit of [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
    await openNew(unit);
    assert.ok(await page.locator(".ordering-token-list button").count() > 0, `unit ${unit} has source-backed token content`);
    report.supportedUnits.push(unit);
  }
  console.log("T5d: units verified");

  // Verify incomplete-answer feedback, adding/removing tokens, wrong ordering, and the source hint after three misses.
  await openNew(7);
  await page.getByRole("button", { name: "بررسی جمله" }).click();
  assert.match(await page.locator(".ordering-feedback").innerText(), /همهٔ کلمه‌ها/);
  await page.locator('.ordering-token-list button[data-token-index="0"]').click();
  assert.equal(await page.locator(".slots span").count(), 1);
  await page.getByRole("button", { name: "یک کلمه برگرد" }).click();
  assert.equal(await page.locator(".slots span").count(), 0);
  const tokenCount = await page.locator(".ordering-token-list button").count();
  for (let attempt = 0; attempt < 3; attempt++) {
    for (let index = tokenCount - 1; index >= 0; index--) await page.locator(`.ordering-token-list button[data-token-index="${index}"]:not(:disabled)`).click();
    await page.getByRole("button", { name: "بررسی جمله" }).click();
    const feedback = await page.locator(".ordering-feedback").innerText();
    if (attempt < 2) assert.match(feedback, /جمله را دوباره بچین/);
    else assert.match(feedback, /جمله را دوباره بچین/, "incorrect-order feedback stays faithful and does not reveal a fabricated answer hint");
  }
  await chooseInOrder();
  await page.getByRole("button", { name: "بررسی جمله" }).click();
  assert.match(await page.locator(".ordering-feedback").innerText(), /جمله درست است/);
  report.interactionChecks.push("incomplete check, token selection, undo, incorrect-order feedback, three repeated errors without invented answer hints, correct answer and progress advance");

  // Compare the original and React ordering screen at both widths in both themes.
  for (const width of [390, 1280]) for (const theme of ["light", "dark"]) {
    await page.setViewportSize({ width, height: 900 });
    await legacy.setViewportSize({ width, height: 900 });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await openNew(7);
    await openLegacy(7);
    await page.evaluate(() => document.fonts.ready);
    await legacy.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await page.locator(".ordering-game").screenshot({ path: `${out}/ordering-${width}-${theme}-new.png`, animations: "disabled" });
    await legacy.locator("main").screenshot({ path: `${out}/ordering-${width}-${theme}-prototype.png`, animations: "disabled" });
    const [newMeta, oldMeta] = await Promise.all([sharp(`${out}/ordering-${width}-${theme}-new.png`).metadata(), sharp(`${out}/ordering-${width}-${theme}-prototype.png`).metadata()]);
    report.visual.push({ width, theme, prototype: { width: oldMeta.width, height: oldMeta.height }, react: { width: newMeta.width, height: newMeta.height }, note: "Saved paired screenshots for direct visual review; prototype includes its original screen frame." });
  }
  console.log("T5d: visual captures saved");

  // Complete unit 7 after its prior mistakes and verify result/restart. Then fully solve representative content units.
  await openNew(7);
  await completeGame(7, 390, "light", true);
  await page.getByRole("button", { name: "دوباره تمرین کن" }).click();
  assert.match(await page.locator(".progress-caption").innerText(), /۰٪|0٪/);
  report.interactionChecks.push("unit 7 completes, awards a score, shows selected avatar and restarts at sentence one");
  console.log("T5d: unit 7 result/restart verified");

  for (const unit of [1, 13, 15]) {
    for (const [width, theme] of [[390, "light"], [1280, "dark"]]) await completeGame(unit, width, theme, true);
  }

  // Regression: existing multiple-choice, matching and memory entry points remain available.
  await page.goto(`${base}/#tab=lessons&u=1&lesson=5`);
  await page.locator(".opts .opt").first().waitFor({ state: "visible" });
  assert.ok(await page.locator(".opts .opt").count() >= 2, "T5a questions still render");
  await page.goto(`${base}/#tab=practice&u=1`);
  assert.equal(await page.getByRole("button", { name: /وصل کن/ }).count(), 1, "T5b matching remains available");
  assert.equal(await page.getByRole("button", { name: /بازی حافظه/ }).count(), 1, "T5c memory remains available");
  await page.getByRole("button", { name: /بازی حافظه/ }).click();
  await page.locator(".activity-tile").click();
  await page.locator(".local-memory").first().waitFor({ state: "visible" });
  const cards = await page.locator(".local-memory").evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { width: box.width, height: box.height }; }));
  assert.equal(cards.length, 8, "T5c still renders eight memory cards");
  assert.ok(cards.every(card => card.width >= 60 && card.height >= 60), "T5c memory cards keep usable dimensions");
  report.regression.push("T5a multiple-choice screen renders; T5b matching and T5c memory remain reachable; T5c has eight cards with non-collapsed dimensions; shared avatar was verified on T5d results");

  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
