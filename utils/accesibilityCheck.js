const { AxePuppeteer } = require("axe-puppeteer");
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.goto("https://localhost:1234/hostedExplorer.html");

  const results = await new AxePuppeteer(page).withTags(["wcag2a", "wcag2aa"]).analyze();
  if (results.violations && results.violations.length && results.violations.length > 0) {
    throw results.violations;
  }

  await page.close();
  await browser.close();
  console.log(`Accessibility Check Passed!`);
})().catch(err => {
  console.error(`Accessibility Check Failed: ${err.length} Errors`);
  console.error(err);
  process.exit(1);
});
