const { chromium } = require("playwright");
let browser;
let page;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});
beforeEach(async () => {
  page = await browser.newPage();
});
afterEach(async () => {
  await page.close();
});
it("should work", async () => {
  await page.goto("https://www.example.com");
  expect(await page.title()).toBe("Example Domain");
});
