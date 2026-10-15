import fs from "node:fs";
import assert from "node:assert/strict";

const require = (await import("node:module")).createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = require("playwright");
const base = process.env.VISUAL_BASE_URL || "http://127.0.0.1:3022";
const output = "visual-checks/t5c-avatar";
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const report = { defaultAvatar: "🦊", selectedAvatar: "🐼", updatedAvatar: "🐸", memory: [], t5a: "pending", t5b: "pending", errors: [] };
const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: "reduce" });
await context.addInitScript(() => Object.defineProperty(window, "speechSynthesis", { value: { cancel() {}, speak() {}, getVoices: () => [] }, configurable: true }));
const page = await context.newPage();
page.on("pageerror", error => report.errors.push(error.message));

function profileData(active, avatar) {
  return JSON.stringify({ version: 2, active, profiles: [{ id: active, name: "آزمایش", avatar }] });
}
function avatarLabel(avatar) { return avatar === "🦊" ? "default" : avatar === "🐼" ? "panda" : avatar === "🐸" ? "frog" : "selected"; }

async function completeMemory(unit, avatar, width, theme, screenshot = true) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${base}/#tab=practice&u=${unit}`);
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  await page.getByRole("button", { name: /بازی حافظه/ }).first().click();
  await page.locator(".activity-tile").click();
  await page.locator(".teacher-memory button[data-pair]").first().waitFor({ state: "visible" });
  const groups = await page.locator(".teacher-memory button[data-pair]").evaluateAll(cards => {
    const grouped = new Map();
    for (const card of cards) grouped.set(card.dataset.pair, [...(grouped.get(card.dataset.pair) || []), card]);
    return [...grouped.keys()];
  });
  for (const word of groups) {
    const pair = page.locator(`.teacher-memory button[data-pair="${word}"]`);
    await pair.nth(0).click();
    await pair.nth(1).click();
  }
  const resultAvatar = page.locator(".game-result-avatar");
  await resultAvatar.waitFor({ state: "visible", timeout: 10000 });
  await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  const rootTheme = await page.evaluate(() => ({ selected: document.documentElement.dataset.theme, backgroundToken: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() }));
  assert.equal(rootTheme.selected, theme, `${theme} root theme is applied`);
  assert.equal(rootTheme.backgroundToken.toLowerCase(), theme === "dark" ? "#1e2030" : "#fffaf2", `${theme} root palette is applied`);
  await page.waitForTimeout(50);
  assert.equal(await resultAvatar.textContent(), avatar, `unit ${unit} must show selected avatar`);
  assert.equal(await page.locator(".stars .earned").count(), 5, "memory game still awards five stars");
  assert.equal(await page.locator(".game-result-avatar").evaluate(el => getComputedStyle(el).marginBottom), "12px");
  const resultLayout = await page.locator(".game-result-avatar, main.narrow h1, .stars, .stars + p, main.narrow .row").evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; }));
  assert.ok(resultLayout.every((box, index) => index === 0 || box.top >= resultLayout[index - 1].bottom - 1), "avatar, heading, stars, score, and actions have clear vertical spacing");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "result screen has no horizontal overflow");
  assert.equal(await page.evaluate(() => { const avatar = document.querySelector(".game-result-avatar").getBoundingClientRect(); const nav = document.querySelector("nav").getBoundingClientRect(); return avatar.top >= nav.bottom - 1; }), true, "sticky navigation does not cover the result avatar");
  if (screenshot) await page.locator("main.narrow").screenshot({ path: `${output}/memory-u${unit}-${width}-${theme}-${avatarLabel(avatar)}.png`, animations: "disabled" });
  report.memory.push({ unit, width, theme, avatar, stars: 5, screenshot: screenshot ? `${output}/memory-u${unit}-${width}-${theme}-${avatarLabel(avatar)}.png` : null });
}

try {
  await page.goto(`${base}/#tab=home`);
  assert.equal(await page.evaluate(() => localStorage.getItem("kidotalk-local-v2")), null, "default test starts without saved profile data");
  await page.locator(".profile-badge-avatar").waitFor({ state: "visible" });
  assert.equal(await page.locator(".profile-badge-avatar").textContent(), "🦊");
  assert.equal(await page.locator(".inline-profile-avatar").textContent(), "🦊");
  await completeMemory(1, "🦊", 390, "light");

  // Read the same active-profile shape and avatar IDs that the legacy picker persists.
  await page.evaluate(value => localStorage.setItem("kidotalk-local-v2", value), profileData("child-panda", "🐼"));
  await page.reload();
  await page.goto(`${base}/#tab=home`);
  await page.locator(".profile-badge-avatar").waitFor({ state: "visible" });
  assert.equal(await page.locator(".profile-badge-avatar").textContent(), "🐼", "selected avatar persists after refresh");
  assert.equal(await page.locator(".inline-profile-avatar").textContent(), "🐼", "home uses the selected avatar");
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("kidotalk-local-v2")).profiles[0].avatar), "🐼", "app does not overwrite stored avatar preference");
  await completeMemory(1, "🐼", 390, "light");

  const updater = await context.newPage();
  await page.goto(`${base}/#tab=home`);
  await updater.goto(`${base}/#tab=home`);
  await updater.evaluate(value => localStorage.setItem("kidotalk-local-v2", value), profileData("child-frog", "🐸"));
  await page.locator(".profile-badge-avatar").getByText("🐸").waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await page.locator(".inline-profile-avatar").textContent(), "🐸", "profile changes propagate through storage event");
  await updater.close();

  for (const width of [390, 1280]) for (const theme of ["light", "dark"]) for (const unit of [1, 7, 15]) {
    await completeMemory(unit, "🐸", width, theme);
  }

  // Restore the saved avatar across a full reload and check it remains the result avatar.
  await page.reload();
  await completeMemory(1, "🐸", 390, "light", false);

  // T5a multiple choice result uses the shared avatar after all existing questions are answered.
  await page.goto(`${base}/#tab=lessons&u=1&lesson=5`);
  await page.locator(".opts .opt").first().waitFor({ state: "visible" });
  for (let attempts = 0; attempts < 100 && !(await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).count()); attempts++) {
    const status = (await page.locator("#m").textContent())?.trim();
    if (status === "آفرین!") { await page.waitForTimeout(950); continue; }
    const choice = page.locator(".opts .opt:not(:disabled)").first();
    await choice.click();
    await page.waitForTimeout(50);
  }
  await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await page.locator(".game-result-avatar").textContent(), "🐸");
  await page.locator("main").screenshot({ path: `${output}/t5a-u1-390-light-selected.png`, animations: "disabled" });
  report.t5a = "completed all reading questions; shared frog avatar shown with earned stars";

  // T5b connect every available picture-word pair and verify its shared result avatar.
  await page.goto(`${base}/#tab=practice&u=1`);
  await page.getByRole("button", { name: /وصل کن/ }).click();
  for (let round = 0; round < 10 && !(await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).count()); round++) {
    const words = await page.locator(".pair-picture:not(:disabled)").evaluateAll(items => items.map(item => item.dataset.word));
    if (!words.length) { await page.waitForTimeout(700); continue; }
    for (const word of words) {
      const picture = page.locator(`.pair-picture[data-word="${word}"]`);
      const text = page.locator(`.pair-word[data-word="${word}"]`);
      if (await picture.count() && !(await picture.isDisabled())) { await picture.click(); await text.click(); }
    }
    await page.waitForTimeout(650);
  }
  await page.getByRole("heading", { name: "یک قدم جلو رفتی!" }).waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await page.locator(".game-result-avatar").textContent(), "🐸");
  await page.locator("main").screenshot({ path: `${output}/t5b-u1-390-light-selected.png`, animations: "disabled" });
  report.t5b = "all unit 1 matching rounds completed; shared frog avatar shown with earned stars";
  assert.deepEqual(report.errors, [], "no client runtime errors");
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.errors.push(String(error?.stack || error));
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2), "utf8");
  throw error;
} finally {
  await browser.close();
}
