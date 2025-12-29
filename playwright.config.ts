import { defineConfig, devices } from "@playwright/test";
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "test",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "blob" : "html",
  timeout: 10 * 60 * 1000,
  use: {
    trace: "on-all-retries",
    video: "on-first-retry",
    screenshot: "on",
    testIdAttribute: "data-test",
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
  },

  expect: {
    // Many of our expectations take a little longer than the default 5 seconds.
    timeout: 15 * 1000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
        },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: {
          firefoxUserPrefs: {
            "security.fileuri.strict_origin_policy": false,
            "network.http.referer.XOriginPolicy": 0,
            "network.http.referer.trimmingPolicy": 0,
            "privacy.file_unique_origin": false,
            "security.csp.enable": false,
            "network.cors_preflight.allow_client_cert": true,
            "dom.security.https_first": false,
            "network.http.cross-origin-embedder-policy": false,
            "network.http.cross-origin-opener-policy": false,
            "browser.tabs.remote.useCrossOriginPolicy": false,
            "browser.tabs.remote.useCORP": false,
          },
          args: ["--disable-web-security"],
        },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
    {
      name: "Google Chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        launchOptions: {
          args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
        },
      },
    },
    {
      name: "Microsoft Edge",
      use: {
        ...devices["Desktop Edge"],
        channel: "msedge",
        launchOptions: {
          args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
        },
      },
    },
  ],

  webServer: {
    command: "npm run start",
    url: "https://127.0.0.1:1234/_ready",
    timeout: 120 * 1000,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
  },
});
