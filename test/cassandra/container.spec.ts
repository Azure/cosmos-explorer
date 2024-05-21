import { jest } from "@jest/globals";
import "expect-playwright";
import {
  AccountType,
  generateUniqueName,
  getPanelSelector,
  getTestExplorerUrl,
  getTreeMenuItemSelector,
  getTreeNodeSelector,
  openContextMenu,
} from "../utils/shared";
import { waitForExplorer } from "../utils/waitForExplorer";
jest.setTimeout(120000);

test("Cassandra keyspace and table CRUD", async () => {
  const keyspaceId = generateUniqueName("keyspace");
  const tableId = generateUniqueName("table");

  page.setDefaultTimeout(50000);

  const url = await getTestExplorerUrl(AccountType.Cassandra);
  await page.goto(url);
  await page.waitForSelector("iframe");
  const explorer = await waitForExplorer();

  await explorer.click('[data-test="New Table"]');

  await explorer.waitForSelector(getPanelSelector("Add Table"));
  await explorer.click('[aria-label="Keyspace id"]');
  await explorer.fill('[aria-label="Keyspace id"]', keyspaceId);
  await explorer.click('[aria-label="addCollection-table Id Create table"]');
  await explorer.fill('[aria-label="addCollection-table Id Create table"]', tableId);
  await explorer.fill('[aria-label="Table max RU/s"]', "1000");
  await explorer.click("#sidePanelOkButton");
  await explorer.waitForSelector(getPanelSelector("Add Table"), { state: "detached" });

  await explorer.click(getTreeNodeSelector(`DATA/${keyspaceId}`));
  await openContextMenu(explorer, `DATA/${keyspaceId}/${tableId}`);
  await explorer.click(getTreeMenuItemSelector(`DATA/${keyspaceId}/${tableId}`, "Delete Table"));

  await explorer.waitForSelector(getPanelSelector("Delete Table"));
  await explorer.fill('text=* Confirm by typing the table id >> input[type="text"]', tableId);
  await explorer.click('[aria-label="OK"]');
  await explorer.waitForSelector(getPanelSelector("Delete Table"), { state: "detached" });

  await openContextMenu(explorer, `DATA/${keyspaceId}`);
  await explorer.click(getTreeMenuItemSelector(`DATA/${keyspaceId}`, "Delete Keyspace"));

  await explorer.waitForSelector(getPanelSelector("Delete Keyspace"));
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', keyspaceId);
  await explorer.click("#sidePanelOkButton");
  await explorer.waitForSelector(getPanelSelector("Delete Keyspace"), { state: "detached" });

  await expect(explorer).not.toHaveText(".dataResourceTree", keyspaceId);
  await expect(explorer).not.toHaveText(".dataResourceTree", tableId);
});
