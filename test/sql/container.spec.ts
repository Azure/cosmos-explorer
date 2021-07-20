import { jest } from "@jest/globals";
import "expect-playwright";
import { generateUniqueName } from "../utils/shared";
jest.setTimeout(120000);

test("SQL CRUD", async () => {
  const databaseId = generateUniqueName("db");
  const containerId = generateUniqueName("container");

  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-sql-runner");
  await page.waitForSelector("iframe");
  const explorer = page.frame({
    name: "explorer",
  });

  await explorer.click('[data-test="New Container"]');
  await explorer.fill('[aria-label="New database id"]', databaseId);
  await explorer.fill('[aria-label="Container id"]', containerId);
  await explorer.fill('[aria-label="Partition key"]', "/pk");
  await explorer.click("#sidePanelOkButton");
  await explorer.click(`.nodeItem >> text=${databaseId}`, { timeout: 50000 });
  await explorer.click(`[data-test="${containerId}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Container")');
  await explorer.fill('text=* Confirm by typing the container id >> input[type="text"]', containerId);
  await explorer.click('[aria-label="OK"]');
  await explorer.click(`[data-test="${databaseId}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete Database")');
  await explorer.click('text=* Confirm by typing the database id >> input[type="text"]');
  await explorer.fill('text=* Confirm by typing the database id >> input[type="text"]', databaseId);
  await explorer.click("#sidePanelOkButton");
  await expect(explorer).not.toHaveText(".dataResourceTree", databaseId);
  await expect(explorer).not.toHaveText(".dataResourceTree", containerId);
});
