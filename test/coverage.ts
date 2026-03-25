/**
 * Custom Playwright fixture that collects Istanbul code coverage after each test.
 *
 * When the app is built with COVERAGE=1 (which enables babel-plugin-istanbul),
 * the bundled code exposes `window.__coverage__`. This fixture grabs that object
 * after every test and writes it to `.nyc_output/` so `nyc report` can merge and
 * render a coverage report.
 *
 * Usage: In spec files, replace
 *   import { test, expect } from "@playwright/test";
 * with
 *   import { test, expect } from "../coverage";   // adjust relative path
 */
import { test as base, Browser, expect, Frame, Locator, Page } from "@playwright/test";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const nycOutputDir = path.join(__dirname, "..", ".nyc_output");

/**
 * Try to pull `window.__coverage__` from every frame in the page.
 * The app loads inside an iframe in testExplorer.html, so we check
 * both the main page and all child frames.
 */
async function collectCoverage(page: Page): Promise<Record<string, unknown> | null> {
  // Try main frame first
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cov = await page.evaluate(() => (window as Record<string, any>).__coverage__);
    if (cov && Object.keys(cov).length > 0) {
      return cov as Record<string, unknown>;
    }
  } catch {
    // page may have been closed already
  }

  // Try child frames (the explorer often runs inside an iframe)
  for (const frame of page.frames()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cov = await frame.evaluate(() => (window as Record<string, any>).__coverage__);
      if (cov && Object.keys(cov).length > 0) {
        return cov as Record<string, unknown>;
      }
    } catch {
      // frame may be detached
    }
  }

  return null;
}

const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);

    const coverage = await collectCoverage(page);
    if (coverage) {
      fs.mkdirSync(nycOutputDir, { recursive: true });
      const id = crypto.randomBytes(8).toString("hex");
      fs.writeFileSync(path.join(nycOutputDir, `coverage-${id}.json`), JSON.stringify(coverage));
    }
  },
});

export { Browser, expect, Frame, Locator, Page, test };
export type { Page as PageType };
