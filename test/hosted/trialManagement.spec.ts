import { expect, test, BrowserContext, Page } from "@playwright/test";

// Keep CORS and opener isolation enabled instead of inheriting the suite's relaxed launch options.
test.use({ launchOptions: {} });

const origin = "https://localhost:1234";
const backend = "https://localhost:7235";
const resource = {
  accountName: "trial-account",
  resourceGroupName: "trial-group",
  timeLeftInSeconds: 1800,
  signInProvider: "github",
  apiKind: 0,
  documentEndpoint: "https://trial-account.documents.azure.com/",
};
const connectionString = `AccountEndpoint=${resource.documentEndpoint};AccountKey=redacted-test-key;`;

async function fixtures(context: BrowserContext) {
  const mutations: { method: string; target: unknown; authorization?: string }[] = [];
  let timeLeftInSeconds = resource.timeLeftInSeconds;
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin && url.pathname === "/explorer.html") {
      return route.fulfill({ contentType: "text/html", body: "<!doctype html><body>Explorer</body>" });
    }
    if (url.origin === origin && url.pathname === "/config.json") {
      return route.fulfill({
        json: {
          PORTAL_BACKEND_ENDPOINT: backend,
        },
      });
    }
    if (url.origin === origin) {
      return route.continue();
    }
    if (url.origin === backend) {
      const headers = {
        "Access-Control-Allow-Origin": route.request().headers().origin || origin,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "authorization,content-type,x-ms-connection-string,x-ms-encrypted-auth-token",
      };
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({ status: 204, headers });
      }
      if (url.pathname.includes("checkconnectionstringlogin")) {
        return route.fulfill({ body: "false", headers });
      }
      if (url.pathname.includes("metadata")) {
        return route.fulfill({
          json: { isTryCosmosDB: true, trialResource: { ...resource, timeLeftInSeconds } },
          headers,
        });
      }
      mutations.push({
        method: route.request().method(),
        target: route.request().postDataJSON(),
        authorization: route.request().headers().authorization,
      });
      if (route.request().method() === "POST") {
        timeLeftInSeconds = 1728000;
      }
      return route.fulfill({
        json: { timeLeftInSeconds: 1728000 },
        headers,
      });
    }
    if (url.origin === "https://localhost:12900") {
      return route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><h1>Try Portal</h1><button id="confirm">Extend sandbox</button><script>
          document.getElementById("confirm").onclick = async () => {
            const response = await fetch("${backend}/api/trycosmosdb/resource/extend", {
              method:"POST", headers:{"Content-Type":"application/json",Authorization:"Bearer test-portal-owner-token"},
              body:JSON.stringify({resourceGroupName:new URL(location.href).searchParams.get("resourceGroupName")})
            });
            if(response.ok) document.body.append("Your sandbox was successfully extended.");
          };
        </script>`,
      });
    }
    return route.abort();
  });
  return mutations;
}

async function ownerLaunch(context: BrowserContext, portal: Page, provider: string, tokenLifetime = 3600000) {
  const ownerAuth = {
    provider,
    token: `test-${provider}-owner-token`,
    expiresAt: Date.now() + tokenLifetime,
    accountName: resource.accountName,
    resourceGroupName: resource.resourceGroupName,
    backendEndpoint: backend,
  };
  await context.route("https://cosmos.azure.com/fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><button id="launch">Open Explorer</button><script>
      let explorer;
      document.getElementById("launch").onclick = () => explorer = window.open("${origin}/hostedExplorer.html");
      window.addEventListener("message", event => {
        if(event.source === explorer && event.origin === "${origin}" && event.data.type === "tryCosmosDBReady")
          explorer.postMessage(${JSON.stringify({
            type: "tryCosmosDBConnectionString",
            connectionString,
            ownerAuth,
          })}, "${origin}");
      });
    </script>`,
    }),
  );
  await portal.goto("https://cosmos.azure.com/fixture");
  const opened = context.waitForEvent("page");
  await portal.getByRole("button", { name: "Open Explorer" }).click();
  const explorer = await opened;
  await explorer.getByRole("button", { name: "Extend sandbox" }).waitFor();
  return { explorer, ownerAuth };
}

for (const provider of ["microsoft", "github"]) {
  test(`${provider} handoff extends without sign-in or iframe reload and exposes no sandbox deletion`, async ({
    context,
    page,
  }) => {
    const mutations = await fixtures(context);
    const { explorer, ownerAuth } = await ownerLaunch(context, page, provider);
    await expect(explorer.getByText("Time remaining: 30m")).toBeVisible();
    const frame = explorer.locator("#explorerMenu");
    await frame.evaluate((element) => element.setAttribute("data-instance", "original"));
    await explorer.getByRole("button", { name: "Extend sandbox" }).click();
    await expect(explorer.getByText("Time remaining: 20d")).toBeVisible();
    expect(context.pages()).toHaveLength(2);
    expect(mutations).toEqual([
      {
        method: "POST",
        target: {
          resourceGroupName: resource.resourceGroupName,
        },
        authorization: `Bearer ${ownerAuth.token}`,
      },
    ]);
    await expect(frame).toHaveAttribute("data-instance", "original");
    await explorer.setViewportSize({ width: 375, height: 812 });
    await expect(explorer.getByRole("button", { name: "Extend sandbox" })).toBeInViewport({ ratio: 1 });
    await expect(explorer.getByText("Time remaining: 20d")).toBeInViewport({ ratio: 1 });
    await expect(explorer.getByRole("button", { name: "Delete sandbox" })).toHaveCount(0);
    await expect(explorer.getByRole("alertdialog")).toHaveCount(0);
  });
}

test("expired owner credentials open Portal on the first Extend click", async ({ context, page }) => {
  const mutations = await fixtures(context);
  const { explorer, ownerAuth } = await ownerLaunch(context, page, "github", 60000);
  const frame = explorer.locator("#explorerMenu");
  await frame.evaluate((element) => element.setAttribute("data-instance", "original"));
  await explorer.clock.setFixedTime(ownerAuth.expiresAt);
  const opened = context.waitForEvent("page");
  await explorer.getByRole("button", { name: "Extend sandbox" }).click();
  const portal = await opened;
  await portal.waitForURL("https://localhost:12900/**", { waitUntil: "domcontentloaded" });
  const destination = new URL(portal.url());
  expect(destination.searchParams.get("resourceGroupName")).toBe(resource.resourceGroupName);
  expect(destination.hash).toBe("#extend");
  expect(await portal.evaluate(() => window.opener === null)).toBe(true);
  expect(mutations).toHaveLength(0);
  await portal.getByRole("button", { name: "Extend sandbox" }).click();
  await expect(portal.getByText("Your sandbox was successfully extended.")).toBeVisible();
  await explorer.bringToFront();
  await explorer.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(explorer.getByText("Time remaining: 20d")).toBeVisible();
  expect(mutations).toEqual([
    {
      method: "POST",
      target: { resourceGroupName: resource.resourceGroupName },
      authorization: "Bearer test-portal-owner-token",
    },
  ]);
  await expect(frame).toHaveAttribute("data-instance", "original");
});

test("extends across focus changes without reloading trial metadata", async ({ context, page }) => {
  let metadataRequests = 0;
  context.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/connectionstring/trycosmosdb/metadata"
    ) {
      metadataRequests++;
    }
  });
  const mutations = await fixtures(context);
  const { explorer } = await ownerLaunch(context, page, "microsoft");
  await explorer.clock.install();
  await explorer.clock.fastForward(6000);
  await explorer.getByRole("button", { name: "Extend sandbox" }).hover();
  await explorer.mouse.down();
  await explorer.evaluate(() => window.dispatchEvent(new Event("focus")));
  await explorer.mouse.up();
  await expect.poll(() => mutations.filter((mutation) => mutation.method === "POST").length).toBe(1);
  await expect(explorer.getByText("Time remaining: 20d")).toBeVisible();
  await explorer.clock.fastForward(6000);
  await explorer.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(explorer.getByRole("button", { name: "Extend sandbox" })).toBeEnabled();
  expect(metadataRequests).toBe(1);
});

test("manual connection opens normal Portal and refreshes the countdown on return without reloading Explorer", async ({
  context,
  page,
}) => {
  const mutations = await fixtures(context);
  await page.goto(`${origin}/hostedExplorer.html`);
  await page.getByTestId("Link:SwitchConnectionType").click();
  await page.getByPlaceholder("Please enter a connection string").fill(connectionString);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete sandbox" })).toHaveCount(0);
  const frame = page.locator("#explorerMenu");
  await frame.evaluate((element) => element.setAttribute("data-instance", "original"));
  const extend = page.getByRole("button", { name: "Extend sandbox" });
  await expect(extend).toHaveCSS("color", "rgb(255, 255, 255)");
  await extend.hover();
  await expect(extend).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(extend).toHaveCSS("background-color", "rgb(57, 57, 57)");
  const popupEvent = context.waitForEvent("page");
  await extend.click();
  const popup = await popupEvent;
  await popup.waitForURL("https://localhost:12900/**", { waitUntil: "domcontentloaded" });
  const destination = new URL(popup.url());
  expect(destination.searchParams.get("disableMaintenanceMode")).toBe("true");
  expect(destination.searchParams.get("view")).toBe("account");
  expect(destination.searchParams.get("resourceGroupName")).toBe(resource.resourceGroupName);
  expect(destination.hash).toBe("#extend");
  expect(await popup.evaluate(() => window.opener === null)).toBe(true);
  expect(mutations).toHaveLength(0);
  await page.bringToFront();
  // Headless browser windows do not consistently emit native focus events when switching pages.
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Time remaining: 30m")).toBeVisible();
  await expect(page.getByRole("button", { name: "Extend sandbox" })).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await popup.bringToFront();
  await popup.getByRole("button", { name: "Extend sandbox" }).click();
  await expect(popup.getByText("Your sandbox was successfully extended.")).toBeVisible();
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Time remaining: 20d")).toBeVisible();
  expect(mutations).toEqual([
    {
      method: "POST",
      target: { resourceGroupName: resource.resourceGroupName },
      authorization: "Bearer test-portal-owner-token",
    },
  ]);
  await expect(frame).toHaveAttribute("data-instance", "original");
  expect(popup.isClosed()).toBe(false);
});
