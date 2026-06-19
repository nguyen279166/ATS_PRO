import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://localhost:5173";
const email = process.env.SCREENSHOT_EMAIL || "admin@ats.com";
const password = process.env.SCREENSHOT_PASSWORD || "Password123";
const outputDir = path.resolve("docs/screenshots");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: "dark",
  reducedMotion: "reduce",
});
const page = await context.newPage();

await page.addInitScript(() => {
  localStorage.setItem("darkMode", "true");
});

async function settle() {
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: ".Toastify { display: none !important; }",
  });
  await page.waitForTimeout(1_000);
}

async function capture(route, fileName, readySelector) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await settle();
  await page.locator(readySelector).first().waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: true,
  });
}

try {
  await capture("/careers", "landing.png", 'button:has-text("Ứng tuyển ngay")');

  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await settle();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`${baseUrl}/`, { timeout: 15_000 });
  await settle();
  await page.locator('text="Tin tuyển dụng"').first().waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await page.screenshot({
    path: path.join(outputDir, "dashboard.png"),
    fullPage: true,
  });

  await capture("/jobs", "jobs.png", 'text="Danh sách tin tuyển dụng"');
  await capture("/candidates", "candidates.png", 'text="Hiển thị"');
} finally {
  await browser.close();
}

console.log(`Dark-mode README screenshots saved to ${outputDir}`);
