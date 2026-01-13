import { Page } from "@playwright/test";

export async function setupCORSBypass(page: Page) {
  await page.route("**/api/mongo/explorer{,/**}", async (route) => {
    const request = route.request();
    const origin = request.headers()["origin"];

    // If there's no origin, it's not a CORS request. Let it proceed without modification.
    if (!origin) {
      await route.continue();
      return;
    }

    //// Handle preflight (OPTIONS) requests separately.
    // These should not be forwarded to the target server.
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204, // No Content
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,HEAD",
          "Access-Control-Request-Headers": "*, x-ms-continuation",
          "Access-Control-Max-Age": "86400", // Cache preflight response for 1 day
          Vary: "Origin",
        },
      });
      return;
    }

    // Handle the actual GET/POST request
    const response = await route.fetch({
      headers: {
        ...request.headers(),
      },
    });

    const responseHeaders = response.headers();
    // Clean up any pre-existing CORS headers from the real response to avoid conflicts.
    delete responseHeaders["access-control-allow-origin"];
    delete responseHeaders["access-control-allow-credentials"];

    await route.fulfill({
      status: response.status(),
      headers: {
        ...responseHeaders,
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,HEAD",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Expose-Headers": "x-ms-continuation,x-ms-request-charge,x-ms-session-token",
        Vary: "Origin",
      },
      body: await response.body(),
    });
  });
}
