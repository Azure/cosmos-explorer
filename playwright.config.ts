import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: 'test',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'blob' : 'html',
  timeout: 10 * 60 * 1000,
  use: {
    actionTimeout: 5 * 60 * 1000,
    trace: 'off',
    video: 'off',
    screenshot: 'on',
    testIdAttribute: 'data-test',
    contextOptions: {
      ignoreHTTPSErrors: true,
    },
  },

  expect: {
    timeout: 5 * 60 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'https://127.0.0.1:1234/_ready',
    timeout: 120 * 1000,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
  },
});
