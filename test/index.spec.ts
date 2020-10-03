import "expect-puppeteer";
import { trackEvent, trackException } from "./utils";

jest.setTimeout(300000);

describe.skip("Collection CRUD", () => {
  it("should complete collection crud", async () => {
    try {
      // Login to Azure Portal
      await page.goto("https://portal.azure.com");
      await page.waitFor("input[name=loginfmt]");
      await page.type("input[name=loginfmt]", process.env.PORTAL_RUNNER_USERNAME);
      await page.click("input[type=submit]");
      await page.waitFor(3000);
      await page.waitFor("input[name=loginfmt]");
      await page.type("input[name=passwd]", process.env.PORTAL_RUNNER_PASSWORD);
      await page.click("input[type=submit]");
      await page.waitFor(3000);
      await page.waitForNavigation();
      await page.goto(
        `https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/${process.env.PORTAL_RUNNER_SUBSCRIPTION}/resourceGroups/${process.env.PORTAL_RUNNER_RESOURCE_GROUP}/providers/Microsoft.DocumentDb/databaseAccounts/${process.env.PORTAL_RUNNER_DATABASE_ACCOUNT}/dataExplorer`
      );
      // Wait for page to settle
      await page.waitFor(10000);
      // Find Data Explorer iFrame
      const frames = page.frames();
      const dataExplorer = frames.find(frame => frame.url().includes("cosmos.azure.com"));
      // Click "New Container"
      const newContainerButton = await dataExplorer.$('button[data-test="New Container"]');
      await newContainerButton.click();
      // Wait for side pane to appear
      await dataExplorer.waitFor(".contextual-pane-in");
      // Fill out New Container form
      const databaseIdInput = await dataExplorer.$("#databaseId");
      await databaseIdInput.type("foo");
      const collectionIdInput = await dataExplorer.$("#containerId");
      await collectionIdInput.type("foo");
      const partitionKeyInput = await dataExplorer.$('input[data-test="addCollection-partitionKeyValue"]');
      await partitionKeyInput.type("/partitionKey");
      trackEvent({ name: "ProductionRunnerSuccess" });

      // TODO: Submit form and assert results
      //     cy.wrap($body)
      //       .find("#submitBtnAddCollection")
      //       .click();
      //     cy.wait(10000);
      //     cy.wrap($body)
      //       .find('div[data-test="resourceTreeId"]')
      //       .should("exist")
      //       .find('div[class="treeComponent dataResourceTree"]')
      //       .should("contain", dbId);
    } catch (error) {
      await page.screenshot({ path: "failure.png" });
      trackException(error);
      throw error;
    }
  });
});
