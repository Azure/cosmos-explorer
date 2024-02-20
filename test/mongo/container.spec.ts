import { jest } from "@jest/globals";
import "expect-playwright";
import { generateDatabaseNameWithTimestamp, generateUniqueName } from "../utils/shared";
import { waitForExplorer } from "../utils/waitForExplorer";
jest.setTimeout(240000);

test("Mongo CRUD", async () => {
  const databaseId = generateDatabaseNameWithTimestamp();
  const containerId = generateUniqueName("container");
  page.setDefaultTimeout(50000);

  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-mongo-runner");
  const explorer = await waitForExplorer();

  // Create new database and collection
  await explorer.click('[data-test="New Collection"]');
  await explorer.fill('[aria-label="New database id, Type a new database id"]', databaseId);
  await explorer.fill('[aria-label="Collection id, Example Collection1"]', containerId);
  await explorer.fill('[aria-label="Shard key"]', "pk");
  await explorer.click("#sidePanelOkButton");
  await explorer.click(`.nodeItem >> text=${databaseId}`);
  await explorer.click(`.nodeItem >> text=${containerId}`);
  // Create indexing policy
  await explorer.click(".nodeItem >> text=Settings");
  await explorer.click('button[role="tab"]:has-text("Indexing Policy")');
  await explorer.click('[aria-label="Index Field Name 0"]');
  await explorer.fill('[aria-label="Index Field Name 0"]', "foo");
  await explorer.click("text=Select an index type");
  await explorer.click('button[role="option"]:has-text("Single Field")');
  await explorer.click('[data-test="Save"]');
  // Remove indexing policy
  await explorer.click('[aria-label="Delete index Button"]');
  await explorer.click('[data-test="Save"]');
  // Delete database and collection
  await explorer.click(`[data-test="${containerId}"] [aria-label="More options"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Collection")');
  await explorer.fill('text=* Confirm by typing the collection id >> input[type="text"]', containerId);
  await explorer.click('[aria-label="OK"]');
  await explorer.click(`[data-test="${databaseId}"] [aria-label="More options"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Database")');
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', databaseId);
  await explorer.click("#sidePanelOkButton");
  await expect(explorer).not.toHaveText(".dataResourceTree", databaseId);
  await expect(explorer).not.toHaveText(".dataResourceTree", containerId);
});
