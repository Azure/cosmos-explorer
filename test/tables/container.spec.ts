import "expect-puppeteer";
import { generateUniqueName, login } from "../utils/shared";

jest.setTimeout(300000);
const LOADING_STATE_DELAY = 2500;
const RENDER_DELAY = 1000;

describe("Collection Add and Delete Tables spec", () => {
  it("creates a collection", async () => {
    try {
      const tableId = generateUniqueName("TestTable");
      const frame = await login(process.env.TABLES_CONNECTION_STRING);

      // create new collection
      await frame.waitFor('button[data-test="New Table"]', { visible: true });
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.click('button[data-test="New Table"]');

      // type database id
      await frame.waitFor('input[data-test="addCollection-newDatabaseId"]');
      const dbInput = await frame.$('input[data-test="addCollection-newDatabaseId"]');
      await dbInput.press("Backspace");
      await dbInput.type(tableId);

      // click submit
      await frame.waitFor("#submitBtnAddCollection");
      await frame.click("#submitBtnAddCollection");

      // validate created
      // open database menu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await frame.waitFor(`div[data-test="TablesDB"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitFor(`div[data-test="TablesDB"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      const button = await frame.$(`div[data-test="TablesDB"]`);
      await button.focus();
      await button.asElement().click();
      await frame.waitFor(`div[data-test="${tableId}"]`, { visible: true });

      // delete container

      // click context menu for container
      await frame.waitFor(`div[data-test="${tableId}"] > div > button`, { visible: true });
      await frame.click(`div[data-test="${tableId}"] > div > button`);

      // click delete container
      await frame.waitFor(RENDER_DELAY);
      await frame.waitFor('span[class="treeComponentMenuItemLabel deleteCollectionMenuItemLabel"]');
      await frame.click('span[class="treeComponentMenuItemLabel deleteCollectionMenuItemLabel"]');

      // confirm delete container
      await frame.waitFor('input[data-test="confirmCollectionId"]', { visible: true });
      await frame.type('input[data-test="confirmCollectionId"]', tableId);

      // click delete
      await frame.waitFor('input[data-test="deleteCollection"]', { visible: true });
      await frame.click('input[data-test="deleteCollection"]');
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await expect(page).not.toMatchElement(`div[data-test="${tableId}"]`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
