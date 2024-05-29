import { jest } from "@jest/globals";
import "expect-playwright";
import {
  AccountType,
  generateUniqueName,
  getPanelSelector,
  getTestExplorerUrl,
  getTreeMenuItemSelector,
  openContextMenu,
} from "../utils/shared";
import { waitForExplorer } from "../utils/waitForExplorer";

jest.setTimeout(120000);

test("Tables CRUD", async () => {
  const tableId = generateUniqueName("table");
  page.setDefaultTimeout(50000);

  const url = await getTestExplorerUrl(AccountType.Tables);
  await page.goto(url);
  const explorer = await waitForExplorer();

  await page.waitForSelector('text="Querying databases"', { state: "detached" });
  await explorer.click('[data-test="New Table"]');

  await explorer.waitForSelector(getPanelSelector("New Table"));
  await explorer.fill('[aria-label="Table id, Example Table1"]', tableId);
  await explorer.click("#sidePanelOkButton");
  await explorer.waitForSelector(getPanelSelector("New Table"), { state: "detached" });

  await openContextMenu(explorer, `DATA/TablesDB/${tableId}`);
  await explorer.click(getTreeMenuItemSelector(`DATA/TablesDB/${tableId}`, "Delete Table"));

  await explorer.waitForSelector(getPanelSelector("Delete Table"));
  await explorer.fill('text=* Confirm by typing the table id >> input[type="text"]', tableId);
  await explorer.click('[aria-label="OK"]');
  await explorer.waitForSelector(getPanelSelector("Delete Table"), { state: "detached" });

  await expect(explorer).not.toHaveText(".dataResourceTree", tableId);
});
