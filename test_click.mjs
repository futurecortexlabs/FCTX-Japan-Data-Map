import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.error('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  try {
    console.log("Navigating to localhost:5173...");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    console.log("Waiting for map to render...");
    await page.waitForSelector('.leaflet-container');

    console.log("Waiting a bit for worker data to load...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try clicking Tokyo area relative to the window
    console.log("Clicking the map...");
    // Just click a few points
    await page.mouse.click(400, 300);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.mouse.click(500, 400);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.mouse.click(600, 500);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("Done.");
  } catch (err) {
    console.error("SCRIPT ERROR:", err);
  } finally {
    await browser.close();
  }
})();
