import { jest } from "@jest/globals";
import "expect-playwright";
import fs from "fs";
import path from "path";
jest.setTimeout(240000);

const filename = "GettingStarted.ipynb";
const fileToUpload = `GettingStarted-ignore${Math.floor(Math.random() * 100000)}.ipynb`;

fs.copyFileSync(path.join(__dirname, filename), path.join(__dirname, fileToUpload));

test("Notebooks", async () => {
  await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-sql-runner");
  await page.waitForSelector("iframe");
  const explorer = page.frame({
    name: "explorer",
  });
  // Upload and Delete Notebook
  await explorer.click('[data-test="My Notebooks"] [aria-label="More"]');
  await explorer.click('button[role="menuitem"]:has-text("Upload File")');
  await explorer.setInputFiles("#importFileInput", path.join(__dirname, fileToUpload));
  await explorer.click('[aria-label="Upload"]');
  await explorer.click(`[data-test="${fileToUpload}"] [aria-label="More"]`);
  await explorer.click('button[role="menuitem"]:has-text("Delete")');
  await explorer.click('button:has-text("Delete")');
  await expect(explorer).not.toHaveText(".notebookResourceTree", fileToUpload);
});
