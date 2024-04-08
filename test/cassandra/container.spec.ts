import { jest } from "@jest/globals";
import "expect-playwright";
import { generateUniqueName } from "../utils/shared";
import { waitForExplorer } from "../utils/waitForExplorer";
jest.setTimeout(120000);

test("Cassandra keyspace and table CRUD", async () => {
  const keyspaceId = generateUniqueName("keyspace");
  const tableId = generateUniqueName("table");
  page.setDefaultTimeout(70000);

  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-cassandra-runner");
  await page.waitForSelector("iframe");
  const explorer = await waitForExplorer();

  await explorer.click('[data-test="New Table"]');
  await explorer.click('[aria-label="Keyspace id"]');
  await explorer.fill('[aria-label="Keyspace id"]', keyspaceId);
  await explorer.click('[aria-label="addCollection-table Id Create table"]');
  await explorer.fill('[aria-label="addCollection-table Id Create table"]', tableId);
  await explorer.click("#sidePanelOkButton");
  await explorer.click(`.nodeItem >> text=${keyspaceId}`);
  await explorer.click(`[data-test="${tableId}"] [aria-label="More options"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Table")');
  await explorer.fill('text=* Confirm by typing the table id >> input[type="text"]', tableId);
  await explorer.click('[aria-label="OK"]');
  await explorer.click(`[data-test="${keyspaceId}"] [aria-label="More options"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Keyspace")');
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', keyspaceId);
  await explorer.click("#sidePanelOkButton");
  await expect(explorer).not.toHaveText(".dataResourceTree", keyspaceId);
  await expect(explorer).not.toHaveText(".dataResourceTree", tableId);
});
