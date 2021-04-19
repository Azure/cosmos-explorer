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
  await safeClick(explorer, `.nodeItem >> text=${keyspaceId}`);
  await safeClick(explorer, `[data-test="${tableId}"] [aria-label="More"]`);
  await safeClick(explorer, 'button[role="menuitem"]:has-text("Delete Table")');
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

async function safeClick(page: Frame, selector: string) {
  // TODO: Remove. Playwright does this for you... mostly.
  // But our knockout+react setup sometimes leaves dom nodes detached and even playwright can't recover.
  // Resource tree is particually bad.
  // Ideally this should only be added as a last resort
  await page.waitForSelector(selector);
  await page.waitForTimeout(5000);
  await page.click(selector);
}
