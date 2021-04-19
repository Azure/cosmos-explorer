import { jest } from "@jest/globals";
import "expect-playwright";
import { Frame } from "playwright";
import { generateUniqueName } from "../utils/shared";
jest.setTimeout(120000);

test("Cassandra keyspace and table CRUD", async () => {
  const keyspaceId = generateUniqueName("keyspace");
  const tableId = generateUniqueName("table");

  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-cassandra-runner");
  await page.waitForSelector("iframe");
  const explorer = page.frame({
    name: "explorer",
  });

  await explorer.click('[data-test="New Table"]');
  await explorer.click('[data-test="addCollection-keyspaceId"]');
  await explorer.fill('[data-test="addCollection-keyspaceId"]', keyspaceId);
  await explorer.click('[data-test="addCollection-tableId"]');
  await explorer.fill('[data-test="addCollection-tableId"]', tableId);
  await explorer.click('[aria-label="Add Table"] [data-test="addCollection-createCollection"]');
  await clickResourceTree(explorer, keyspaceId);
  await explorer.click(`[data-test="${tableId}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Table")');
  await explorer.fill('text=* Confirm by typing the table id >> input[type="text"]', tableId);
  await explorer.click('[aria-label="Submit"]');
  await explorer.click(`[data-test="${keyspaceId}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Keyspace")');
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', keyspaceId);
  await explorer.click("#sidePanelOkButton");
  await expect(explorer).not.toHaveText(".dataResourceTree", keyspaceId);
  await expect(explorer).not.toHaveText(".dataResourceTree", tableId);
});

async function clickResourceTree(page: Frame, selector: string) {
  // TODO: Remove. The resource tree has stability issues so we need to wait for it to show, wait some time, then click
  await page.waitForSelector(`.nodeItem >> text=${selector}`);
  await page.waitForTimeout(5000);
  await page.click(`.nodeItem >> text=${selector}`);
}
