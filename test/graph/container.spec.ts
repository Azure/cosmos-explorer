import { jest } from "@jest/globals";
import "expect-playwright";
import {
  generateDatabaseNameWithTimestamp,
  generateUniqueName,
  getAzureCLICredentialsToken,
  getPanelSelector,
  getTreeMenuItemSelector,
  getTreeNodeSelector,
  openContextMenu,
} from "../utils/shared";
import { waitForExplorer } from "../utils/waitForExplorer";
jest.setTimeout(240000);

test("Graph CRUD", async () => {
  const databaseId = generateDatabaseNameWithTimestamp();
  const containerId = generateUniqueName("container");

  // We can't retrieve AZ CLI credentials from the browser so we get them here.
  const token = await getAzureCLICredentialsToken();
  page.setDefaultTimeout(50000);

  await page.goto(`https://localhost:1234/testExplorer.html?accountName=portal-gremlin-runner&token=${token}`);
  const explorer = await waitForExplorer();

  // Create new database and graph
  await explorer.click('[data-test="New Graph"]');

  await explorer.waitForSelector(getPanelSelector("New Graph"));
  await explorer.fill('[aria-label="New database id, Type a new database id"]', databaseId);
  await explorer.fill('[aria-label="Graph id, Example Graph1"]', containerId);
  await explorer.fill('[aria-label="Partition key"]', "/pk");
  await explorer.click("#sidePanelOkButton");
  await explorer.waitForSelector(getPanelSelector("New Graph"), { state: "detached" });

  // Delete database and graph

  await explorer.click(getTreeNodeSelector(`DATA/${databaseId}`));
  await openContextMenu(explorer, `DATA/${databaseId}/${containerId}`);
  await explorer.click(getTreeMenuItemSelector(`DATA/${databaseId}/${containerId}`, "Delete Graph"));

  await explorer.waitForSelector(getPanelSelector("Delete Graph"));
  await explorer.fill('text=* Confirm by typing the graph id >> input[type="text"]', containerId);
  await explorer.click('[aria-label="OK"]');
  await explorer.waitForSelector(getPanelSelector("Delete Graph"), { state: "detached" });

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
