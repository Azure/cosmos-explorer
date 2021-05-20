import { jest } from "@jest/globals";
import "expect-playwright";
import { safeClick } from "../utils/safeClick";
import { generateDatabaseNameWithTimestamp, generateUniqueName } from "../utils/shared";
jest.setTimeout(240000);

test("Graph CRUD", async () => {
  const databaseId = generateDatabaseNameWithTimestamp();
  const containerId = generateUniqueName("container");

  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-gremlin-runner");
  await page.waitForSelector("iframe");
  const explorer = page.frame({
    name: "explorer",
  });

  // Create new database and graph
  await explorer.click('[data-test="New Graph"]');
  await explorer.fill('[aria-label="New database id"]', databaseId);
  await explorer.fill('[aria-label="Graph id"]', containerId);
  await explorer.fill('[aria-label="Partition key"]', "/pk");
  await explorer.click("#sidePanelOkButton");
  await safeClick(explorer, `.nodeItem >> text=${databaseId}`);
  await safeClick(explorer, `.nodeItem >> text=${containerId}`);
  // Delete database and graph
  await safeClick(explorer, `[data-test="${containerId}"] [aria-label="More"]`);
  await safeClick(explorer, 'button[role="menuitem"]:has-text("Delete Graph")');
  await explorer.fill('text=* Confirm by typing the graph id >> input[type="text"]', containerId);
  await explorer.click('[aria-label="OK"]');
  await explorer.click(`[data-test="${databaseId}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Database")');
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', databaseId);
  await explorer.click("#sidePanelOkButton");
  await expect(explorer).not.toHaveText(".dataResourceTree", databaseId);
  await expect(explorer).not.toHaveText(".dataResourceTree", containerId);
});
