import { expect, test } from "@playwright/test";
import { CosmosDbArtifactType, FABRIC_RPC_VERSION, FabricMessageV3 } from "../../src/Contracts/FabricMessagesContract";

const origin = "https://127.0.0.1:1234";
const databaseName = "keyboard-test";
const accountEndpoint = "https://home-keyboard-test.documents.azure.com";
const initializeMessage: FabricMessageV3 = {
  type: "initialize",
  version: FABRIC_RPC_VERSION,
  id: "initialize",
  message: {
    connectionId: "keyboard-test",
    isVisible: false,
    isReadOnly: false,
    artifactType: CosmosDbArtifactType.NATIVE,
    artifactConnectionInfo: {
      accessToken: "test-token",
      databaseName,
      accountEndpoint,
    },
  },
};

test.describe("Fabric Home keyboard activation", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${accountEndpoint}/**`, async (route) => {
      await route.fulfill({
        json: { _rid: "test", DocumentCollections: [], _count: 0 },
      });
    });
    await page.route(`${origin}/fabric-home-keyboard-test`, async (route) => {
      await route.fulfill({
        contentType: "text/html",
        body: `<!doctype html>
          <html lang="en">
            <head><title>Fabric Home keyboard test</title></head>
            <body>
              <script>
                window.addEventListener("message", (event) => {
                  const explorer = document.querySelector("iframe");
                  if (event.origin === location.origin &&
                      event.source === explorer.contentWindow &&
                      event.data?.data?.type === "Ready") {
                    explorer.contentWindow.postMessage(
                      { signature: "pcIframe", data: ${JSON.stringify(initializeMessage)} },
                      location.origin
                    );
                  }
                });
              </script>
              <iframe title="Data Explorer" src="/explorer.html?platform=Fabric"
                style="width: 1200px; height: 900px; border: 0"></iframe>
            </body>
          </html>`,
      });
    });
    await page.goto(`${origin}/fabric-home-keyboard-test`);
    await expect(
      page.frameLocator('iframe[title="Data Explorer"]').getByRole("heading", { name: "Build your database" }),
    ).toBeVisible();
  });

  test("hides Cosmos DB Shell for Fabric Native artifacts", async ({ page }) => {
    const explorer = page.frameLocator('iframe[title="Data Explorer"]');
    await expect(explorer.getByRole("button", { name: "Open Cosmos DB Shell", exact: true })).toHaveCount(0);
  });

  const actions = [
    { title: "New container" },
    { title: "Sample Data", container: "SampleData" },
    { title: "Sample Vector Data", container: "SampleVectorData" },
    { title: "App development", url: "https://aka.ms/cosmosdbfabricsdk" },
    { title: "Sample Gallery", url: "https://aka.ms/CosmosFabricSamplesGallery" },
  ];

  for (const key of ["Enter", "Space"]) {
    for (const [index, action] of actions.entries()) {
      test(`${key} activates ${action.title} after Tab navigation`, async ({ page, context }) => {
        const home = page.frameLocator('iframe[title="Data Explorer"]');
        const firstCard = home.getByRole("button", { name: /^New container / });
        await firstCard.focus();
        await page.keyboard.press("Shift+Tab");
        for (let tab = 0; tab <= index; tab++) {
          await page.keyboard.press("Tab");
        }
        const card = home.getByRole("button", { name: new RegExp(`^${action.title} `) });
        await expect(card).toBeFocused();

        if (action.url) {
          await context.route(action.url, (route) => route.fulfill({ body: "<title>Sample destination</title>" }));
          const [popup] = await Promise.all([page.waitForEvent("popup"), card.press(key)]);
          await expect(popup).toHaveURL(action.url);
          await popup.close();
        } else {
          await card.press(key);
          if (action.container) {
            await expect(home.getByRole("dialog")).toContainText(`Create a container "${action.container}"`);
          } else {
            await expect(home.getByRole("textbox", { name: "Container id, Example Container1" })).toBeVisible();
          }
        }
      });
    }
  }
});
