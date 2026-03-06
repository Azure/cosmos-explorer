import { test as base, expect, Page, TestInfo } from "@playwright/test";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const NYC_OUTPUT_DIR = path.resolve(__dirname, "../.nyc_output");

/**
 * Extended Playwright test that automatically collects Istanbul code coverage
 * from all frames after each test. Coverage is only collected when the
 * COVERAGE environment variable is set to "true".
 *
 * Istanbul instrumentation must be enabled in the webpack build (see webpack.config.js).
 * The instrumented code exposes `window.__coverage__` which this fixture collects.
 */
export const test = base.extend<{ coverageAutoCollect: void }>({
  coverageAutoCollect: [
    async ({ page }: { page: Page }, use: () => Promise<void>, testInfo: TestInfo) => {
      // Run the test
      await use();

      // After the test, collect coverage if enabled
      if (process.env.COVERAGE !== "true") {
        return;
      }

      // Ensure the output directory exists
      if (!fs.existsSync(NYC_OUTPUT_DIR)) {
        fs.mkdirSync(NYC_OUTPUT_DIR, { recursive: true });
      }

      // Collect coverage from all frames (the app runs inside an iframe)
      for (const frame of page.frames()) {
        try {
          const coverage = await frame.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (window as any).__coverage__ || null;
          });

          if (coverage) {
            const uniqueId = crypto.randomBytes(8).toString("hex");
            const safeName = testInfo.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 60);
            const filename = `coverage-${safeName}-${uniqueId}.json`;
            fs.writeFileSync(path.join(NYC_OUTPUT_DIR, filename), JSON.stringify(coverage));
          }
        } catch {
          // Frame may have been detached or navigated away. That's fine, skip it.
        }
      }
    },
    { auto: true },
  ],
});

export { expect };
