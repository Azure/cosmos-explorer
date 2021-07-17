import { jest } from "@jest/globals";
import "expect-playwright";
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
  await explorer.fill('[aria-label="Table id"]', tableId);
  await explorer.click("#sidePanelOkButton");
  await explorer.click(`[data-test="TablesDB"]`, { timeout: 50000 });
  await explorer.click(`[data-test="${tableId}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Table")');
  await explorer.fill('text=* Confirm by typing the table id >> input[type="text"]', tableId);
  await explorer.click('[aria-label="OK"]');
  await expect(explorer).not.toHaveText(".dataResourceTree", tableId);
});
