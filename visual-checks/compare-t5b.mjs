import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const require = (await import("node:module")).createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const sharp = require("sharp");
const base = process.env.VISUAL_BASE_URL || "http://localhost:3000";
const directory = "visual-checks/t5b";
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const visualReport = [];
const units = Array.from({ length: 15 }, (_, i) => i + 1);

function unitData(id) {
  const file = `data/units/unit-${String(id).padStart(2, "0")}.ts`;
  const source = fs.readFileSync(file, "utf8");
  return JSON.parse(source.slice(source.indexOf("const data = ") + 13, source.indexOf(" satisfies CourseUnit;")));
}

function fail(message) { throw new Error(message); }

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    let seed = 4321;
    Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    window.resetVisualSeed = () => { seed = 4321; };
    Object.defineProperty(window, "speechSynthesis", { value: { cancel() {}, speak() {}, getVoices: () => [] }, configurable: true });
  });
  const old = await context.newPage();
  const fresh = await context.newPage();
  const errors = [];
  fresh.on("pageerror", error => errors.push(error.message));
  fresh.on("request", request => { if (/assets\/book|u\d+-(sb|wb)-\d+\.webp/.test(request.url())) errors.push(`book scan requested: ${request.url()}`); });

  let fontCss = "";
  for (const [family, subset, weights] of [["vazirmatn", "arabic", [400, 500, 600, 700, 800, 900]], ["fredoka", "latin", [400, 500, 600, 700]]]) {
    for (const weight of weights) {
      const file = `node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff2`;
      fontCss += `@font-face{font-family:'${family === "fredoka" ? "Fredoka" : "Vazirmatn"}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${fs.readFileSync(file).toString("base64")}) format('woff2');}`;
    }
  }
  await context.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: fontCss }));

  await old.goto(`file:///${path.resolve("legacy/index.html").replaceAll("\\", "/")}#tab=practice`);
  async function showLegacyMatch(id) {
    await old.evaluate(() => window.resetVisualSeed());
    await old.evaluate(unit => { selectUnit(unit, "practice"); start("match"); }, id);
    await old.locator("main .course-pairs").waitFor({ state: "visible" });
  }
  async function showNewMatch(id) {
    if (await fresh.locator("main .course-pairs").count()) await fresh.locator("header .ghost").click();
    await fresh.goto(`${base}/#tab=practice&u=${id}`);
    await fresh.locator(".activity-tile").waitFor({ state: "visible" });
    await fresh.evaluate(() => window.resetVisualSeed());
    await fresh.locator(".activity-tile").click();
    await fresh.locator("main .course-pairs").waitFor({ state: "visible" });
  }
  async function assertNoOverlapAndOverflow(page) {
    const result = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("main button:not(:disabled)")].map(button => button.getBoundingClientRect());
      const overlaps = [];
      for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) {
        const a = buttons[i], b = buttons[j];
        if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1) overlaps.push([i, j]);
      }
      return { overlaps, scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth };
    });
    assert.deepEqual(result.overlaps, [], "visible buttons must not overlap");
    assert.ok(result.scrollWidth <= result.viewport, "page must not overflow horizontally");
  }
  for (const width of [390, 1280]) {
    for (const page of [old, fresh]) await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await showLegacyMatch(1);
      await showNewMatch(1);
      for (const page of [old, fresh]) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" });
      }
      console.log("compare content", width, theme, (await old.locator("main").innerText()).slice(0, 70), "|", (await fresh.locator("main").innerText()).slice(0, 70));
      const prefix = `${directory}/match-${width}-${theme}`;
      for (const [label, page] of [["prototype", old], ["new", fresh]]) await page.locator("main").screenshot({ path: `${prefix}-${label}.png`, animations: "disabled" });
      const oldPath = `${prefix}-prototype.png`, newPath = `${prefix}-new.png`;
      const oldMeta = await sharp(oldPath).metadata(), newMeta = await sharp(newPath).metadata();
      assert.equal(oldMeta.width, newMeta.width, `width differs at ${width}px ${theme}`);
      assert.equal(oldMeta.height, newMeta.height, `height differs at ${width}px ${theme}`);
      const oldPixels = await sharp(oldPath).ensureAlpha().raw().toBuffer();
      const newPixels = await sharp(newPath).ensureAlpha().raw().toBuffer();
      let differingPixels = 0, maxChannelDelta = 0;
      for (let i = 0; i < oldPixels.length; i += 4) {
        let differs = false;
        for (let channel = 0; channel < 3; channel++) {
          const delta = Math.abs(oldPixels[i + channel] - newPixels[i + channel]);
          maxChannelDelta = Math.max(maxChannelDelta, delta);
          if (delta > 2) differs = true;
        }
        if (differs) differingPixels++;
      }
      const result = { width, theme, differingPixels, totalPixels: oldMeta.width * oldMeta.height, maxChannelDelta };
      visualReport.push(result);
      console.log(JSON.stringify(result));
    }
  }

  // Wrong answer keeps the selected picture available; matching pairs lock and score.
  await showNewMatch(1);
  const selected = fresh.locator(".pair-picture").first();
  const selectedWord = await selected.getAttribute("data-word");
  await selected.click();
  assert.equal(await fresh.locator("#audio-repeat").isDisabled(), false, "speech repeat should become available after choosing an image");
  await fresh.locator("#audio-speed").selectOption("0.75");
  await fresh.locator("#audio-mute").click();
  assert.match(await fresh.locator("#audio-mute").innerText(), /روشن‌کردن صدا/);
  await fresh.locator("#audio-mute").click();
  await assertNoOverlapAndOverflow(fresh);
  const wrongChoice = fresh.locator(".pair-word").filter({ hasNotText: selectedWord }).first();
  await wrongChoice.click();
  await fresh.getByRole("status").filter({ hasText: "کلمهٔ دیگری را امتحان کن." }).waitFor();
  assert.equal(await selected.isDisabled(), false, "wrong attempt must leave the pair available");
  await fresh.locator(`.pair-word[data-word="${selectedWord}"]`).click();
  await fresh.locator(`.pair-picture[data-word="${selectedWord}"]`).waitFor({ state: "attached" });
  assert.equal(await fresh.locator(`.pair-picture[data-word="${selectedWord}"]`).isDisabled(), true, "correct pair must be disabled");
  assert.equal(await fresh.locator(`.pair-word[data-word="${selectedWord}"]`).isDisabled(), true, "matched word must be disabled");

  async function completeGame(page) {
    while (await page.locator(".pair-picture").count()) {
      const open = page.locator(".pair-picture:not(:disabled)");
      if (await open.count() === 0) { await page.waitForTimeout(700); continue; }
      const key = await open.first().getAttribute("data-word");
      await open.first().click();
      await page.locator(`.pair-word[data-word="${key}"]:not(:disabled)`).click();
    }
    await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).waitFor({ timeout: 5000 });
  }
  await completeGame(fresh);
  await assertNoOverlapAndOverflow(fresh);
  assert.match(await fresh.locator("main > p[role=status]").innerText(), /۹ پاسخ مستقل از ۱۰ سؤال|9 پاسخ مستقل از 10 سؤال/);
  assert.match(await fresh.getByRole("img", { name: /از ۵ ستاره/ }).getAttribute("aria-label"), /۴ از ۵ ستاره|4 از ۵ ستاره/);
  await fresh.getByRole("button", { name: "دوباره تمرین کن" }).click();
  await fresh.locator("main .course-pairs").waitFor({ state: "visible" });
  await completeGame(fresh);
  assert.match(await fresh.getByRole("img", { name: /۵ از ۵ ستاره|5 از ۵ ستاره/ }).getAttribute("aria-label"), /۵ از ۵ ستاره|5 از ۵ ستاره/);
  await fresh.getByRole("button", { name: "تمرین‌ها", exact: true }).click();
  await fresh.locator(".activity-tile").waitFor();

  // All 15 units have usable word art and can be selected without fabricated lesson data.
  for (const id of units) {
    const data = unitData(id);
    assert.ok(data.words.length > 0, `unit ${id} has no word data`);
    for (const word of data.words) assert.ok(word.svg || word.emoji || (word.imageFile && fs.existsSync(`public/assets/words/${word.imageFile}`)), `unit ${id} ${word.en} has no available art`);
    await fresh.setViewportSize({ width: 390, height: 900 });
    await fresh.goto(`${base}/#tab=practice&u=${id}`);
    assert.equal(await fresh.locator("#course-unit").inputValue(), String(id));
    await fresh.locator(".activity-tile").click();
    assert.equal(await fresh.locator(".pair-picture").count(), Math.min(4, data.words.length));
    assert.equal(await fresh.locator(".pair-word").count(), Math.min(4, data.words.length));
    await assertNoOverlapAndOverflow(fresh);
    await fresh.locator("header .ghost").click();
    await fresh.locator(".activity-tile").waitFor();
  }

  // Recheck the seven approved lesson sections and T5a Reading questions.
  for (const lesson of [1, 2, 3, 4, 5, 6, 7]) {
    await fresh.goto(`${base}/#tab=lessons&u=15&lesson=${lesson}`);
    await fresh.locator(`.single-lesson[data-lesson="${lesson}"]`).waitFor();
    assert.ok((await fresh.locator(".single-lesson").innerText()).length > 40, `lesson ${lesson} content missing`);
  }
  await fresh.goto(`${base}/#tab=lessons&u=15&lesson=5`);
  const readingData = unitData(15);
  const firstQuestion = readingData.reading.questions[0];
  assert.ok(firstQuestion, "T5a reading questions should exist for unit 15");
  const options = fresh.locator(".teacher-box .opts .opt");
  await options.nth(firstQuestion.options.findIndex(option => option !== firstQuestion.answer)).click();
  await fresh.getByRole("status").filter({ hasText: "یک بار دیگر نگاه کن و امتحان کن." }).waitFor();
  if (errors.length) fail(errors.join("\n"));
  fs.writeFileSync(`${directory}/report.json`, JSON.stringify({ visuals: visualReport, interactions: "PASS", unitWordBanks: 15, lessonRegression: "T4b-1..7 and T5a route checks passed", pageErrors: errors }, null, 2));
  console.log("PASS: matching wrong/correct/scoring/retry, all 15 word banks, lesson regressions, T5a route, and 4 visual captures.");
  await context.close();
} finally {
  await browser.close();
}
