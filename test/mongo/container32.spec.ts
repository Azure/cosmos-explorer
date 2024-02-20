import { jest } from "@jest/globals";
import "expect-playwright";
import { generateDatabaseNameWithTimestamp, generateUniqueName } from "../utils/shared";
import { waitForExplorer } from "../utils/waitForExplorer";
jest.setTimeout(240000);

test("Mongo CRUD", async () => {
  const databaseId = generateDatabaseNameWithTimestamp();
  const containerId = generateUniqueName("container");
  page.setDefaultTimeout(50000);

  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-mongo32-runner");
  const explorer = await waitForExplorer();

  // Create new database and collection
  await explorer.click('[data-test="New Collection"]');
  await explorer.fill('[aria-label="New database id, Type a new database id"]', databaseId);
  await explorer.fill('[aria-label="Collection id, Example Collection1"]', containerId);
  await explorer.fill('[aria-label="Shard key"]', "pk");
  await explorer.click("#sidePanelOkButton");
  explorer.click(`.nodeItem >> text=${databaseId}`);
  explorer.click(`.nodeItem >> text=${containerId}`);
  // Delete database and collection
  explorer.click(`[data-test="${containerId}"] [aria-label="More options"]`);
  explorer.click('button[role="menuitem"]:has-text("Delete Collection")');
  await explorer.fill('text=* Confirm by typing the collection id >> input[type="text"]', containerId);
  await explorer.click('[aria-label="OK"]');
  await explorer.click(`[data-test="${databaseId}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Database")');
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', databaseId);
  await explorer.click("#sidePanelOkButton");
  await expect(explorer).not.toHaveText(".dataResourceTree", databaseId);
  await expect(explorer).not.toHaveText(".dataResourceTree", containerId);
});
