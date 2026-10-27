import fs from "node:fs";
import { createRequire } from "node:module";
const runtime = createRequire("C:/Users/MSI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = runtime("playwright");

const out = "visual-checks/home-audit";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--disable-gpu"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const results = {};

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
results.aria = await page.evaluate(() => ({
  nav: document.querySelector("nav")?.getAttribute("aria-label"),
  current: [...document.querySelectorAll("nav .tab[aria-current]")].map((b) => b.textContent?.trim()),
  badgeHeight: Math.round(document.querySelector(".profile-badge").getBoundingClientRect().height),
  navHeight: Math.round(document.querySelector("nav").getBoundingClientRect().height),
}));

// The "همراه یادگیری" plan must go to the parent login, like the nav.
await page.locator(".plans .plan").nth(2).click();
await page.waitForURL("**/login");
results.parentPlanNavigated = page.url();
results.loginHomeLink = await page.locator(".auth-home").getAttribute("href");
await page.screenshot({ path: `${out}/login-390.png`, fullPage: true });

// Navigation must leave auth pages instead of rendering the login form as a tab.
await page.getByRole("button", { name: "📚 کتاب‌ها" }).click();
await page.waitForURL("http://localhost:3000/#tab=books");
await page.getByRole("heading", { name: "کتاب‌ها 📚" }).waitFor();
results.navFromLogin = page.url();
results.booksHeading = await page.locator("h1").innerText();
await page.getByRole("button", { name: "🏠 خانه" }).click();
await page.waitForTimeout(250);
results.homeHeading = await page.locator("h1").first().innerText();

// The parent tab itself must open the login page.
await page.getByRole("button", { name: "👨‍👩‍👧 والدین" }).click();
await page.waitForURL("**/login");
results.parentTabNavigated = page.url();

// Logout status messages.
await page.goto("http://localhost:3000/login?status=signed-out", { waitUntil: "networkidle" });
results.signedOutNotice = await page.locator(".auth-notice.success").innerText();
await page.goto("http://localhost:3000/login?status=callback-error", { waitUntil: "networkidle" });
results.callbackNotice = await page.locator(".auth-notice.error").innerText();

// Footer logo returns to the home tab and scrolls to the top from anywhere.
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.locator(".footer-logo").click();
await page.waitForTimeout(300);
results.footerScrollY = await page.evaluate(() => window.scrollY);
results.footerHash = await page.evaluate(() => location.hash);
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.locator(".footer-logo").click();
await page.waitForTimeout(500);
results.footerFromLogin = page.url();

results.errors = errors;
console.log(JSON.stringify(results, null, 2));
await browser.close();
