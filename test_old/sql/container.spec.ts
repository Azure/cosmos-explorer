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

test("SQL CRUD", async () => {
  const databaseId = generateUniqueName("db");
  const containerId = generateUniqueName("container");

  page.setDefaultTimeout(50000);

  const url = await getTestExplorerUrl(AccountType.SQL);
  await page.goto(url);
  const explorer = await waitForExplorer();

  await explorer.click('[data-test="New Container"]');

  await explorer.waitForSelector(getPanelSelector("New Container"));
  await explorer.fill('[aria-label="New database id, Type a new database id"]', databaseId);
  await explorer.fill('[aria-label="Container id, Example Container1"]', containerId);
  await explorer.fill('[aria-label="Partition key"]', "/pk");
  await explorer.click("#sidePanelOkButton");
  await explorer.waitForSelector(getPanelSelector("New Container"), { state: "detached" });

  await explorer.click(getTreeNodeSelector(`DATA/${databaseId}`));
  await explorer.hover(getTreeNodeSelector(`DATA/${databaseId}/${containerId}`));
  await openContextMenu(explorer, `DATA/${databaseId}/${containerId}`);
  await explorer.click(getTreeMenuItemSelector(`DATA/${databaseId}/${containerId}`, "Delete Container"));

  await explorer.waitForSelector(getPanelSelector("Delete Container"));
  await explorer.fill('text=* Confirm by typing the container id >> input[type="text"]', containerId);
  await explorer.click('[aria-label="OK"]');
  await explorer.waitForSelector(getPanelSelector("Delete Container"), { state: "detached" });

  await openContextMenu(explorer, `DATA/${databaseId}`);
  await explorer.click(getTreeMenuItemSelector(`DATA/${databaseId}`, "Delete Database"));

  await explorer.waitForSelector(getPanelSelector("Delete Database"));
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', databaseId);
  await explorer.click("#sidePanelOkButton");
  await explorer.waitForSelector(getPanelSelector("Delete Database"), { state: "detached" });

  await expect(explorer).not.toHaveText(".dataResourceTree", databaseId);
  await expect(explorer).not.toHaveText(".dataResourceTree", containerId);
});
