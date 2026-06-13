// Headless screenshot helper for the Expo web build (dev server on :8081).
// Usage: node scripts/web-shot.mjs [url] [outPath]
//   node scripts/web-shot.mjs http://localhost:8081 shot.png
// Drives a real Chromium via Playwright so we can click through games and
// capture any state (e.g. the mistake-review overlay), not just the landing.
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8081';
const out = process.argv[3] || 'shot.png';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 414, height: 896 } });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  // RN-web hydrates client-side after the bundle loads — give it a beat.
  await page.waitForTimeout(3000);
  await page.screenshot({ path: out });
  console.log('shot ->', out);
} finally {
  await browser.close();
}
