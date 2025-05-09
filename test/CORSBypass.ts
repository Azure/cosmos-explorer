import { Page } from "@playwright/test";

export async function setupCORSBypass(page: Page) {
  await page.route("**/api/mongo/explorer{,/**}", async (route) => {
    const response = await route.fetch({
      headers: {
        ...route.request().headers(),
      },
    });

    await route.fulfill({
      status: response.status(),
      headers: {
        ...response.headers(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "*",
      },
      body: await response.body(),
    });
  });
}
