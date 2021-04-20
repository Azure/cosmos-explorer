import { jest } from "@jest/globals";
import "expect-playwright";
import { safeClick } from "../utils/safeClick";
import { generateUniqueName } from "../utils/shared";

jest.setTimeout(120000);

test("Tables CRUD", async () => {
  const tableId = generateUniqueName("table");

  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-tables-runner");
  await page.waitForSelector("iframe");
  const explorer = page.frame({
    name: "explorer",
  });

  await explorer.click('[data-test="New Table"]');
  await explorer.click('[data-test="addCollection-collectionId"]');
  await explorer.fill('[data-test="addCollection-collectionId"]', tableId);
  await explorer.click('[data-test="addCollection-createCollection"]');
  await safeClick(explorer, `[data-test="TablesDB"]`);
  await safeClick(explorer, `[data-test="${tableId}"] [aria-label="More"]`);
  await safeClick(explorer, 'button[role="menuitem"]:has-text("Delete Table")');
  await explorer.fill('text=* Confirm by typing the table id >> input[type="text"]', tableId);
  await explorer.click('[aria-label="Submit"]');
  await expect(explorer).not.toHaveText(".dataResourceTree", tableId);
});
