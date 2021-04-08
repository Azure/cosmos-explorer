import { jest } from "@jest/globals";
import "expect-playwright";
import { generateDatabaseName, generateUniqueName } from "../utils/shared";
jest.setTimeout(120000);

describe("MongoDB Index policy tests", () => {
  it("Open, Create and Save Index", async () => {
    const databaseId = generateDatabaseName();
    const containerId = generateUniqueName("container");

    await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-mongo-runner");
    await page.waitForSelector("iframe");
    const explorer = page.frame({
      name: "explorer",
    });
    await explorer.click('[data-test="New Collection"] [data-test="New Collection"]');
    await explorer.click('[data-test="addCollection-newDatabaseId"]');
    await explorer.fill('[data-test="addCollection-newDatabaseId"]', databaseId);
    await explorer.click('[data-test="addCollection-collectionId"]');
    await explorer.fill('[data-test="addCollection-collectionId"]', containerId);
    await explorer.click('[data-test="addCollection-partitionKeyValue"]');
    await explorer.fill('[data-test="addCollection-partitionKeyValue"]', "partitionKey");
    await explorer.click('[data-test="addCollection-createCollection"]');
    await clickResourceTree(explorer, databaseId);
    await clickResourceTree(explorer, containerId);
    await clickResourceTree(explorer, `Settings`);
    await explorer.click('button[role="tab"]:has-text("Indexing Policy")');
    await page.pause();
  });
});

async function clickResourceTree(page: any, selector: string) {
  // TODO: Remove. The resource tree has stability issues so we need to wait for it to show, wait some time, then click
  await page.waitForSelector(`.nodeItem >> text=${selector}`);
  await page.waitForTimeout(5000);
  await page.click(`.nodeItem >> text=${selector}`);
}
