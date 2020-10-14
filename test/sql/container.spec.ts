import "expect-puppeteer";
import { generateUniqueName, login } from "../utils/shared";

jest.setTimeout(300000);
const LOADING_STATE_DELAY = 2500;
const RENDER_DELAY = 1000;

describe("Collection Add and Delete SQL spec", () => {
  it("creates a collection", async () => {
    try {
      const dbId = generateUniqueName("TestDatabase");
      const collectionId = generateUniqueName("TestCollection");
      const sharedKey = generateUniqueName("SharedKey");
      const frame = await login(process.env.PORTAL_RUNNER_CONNECTION_STRING);

      // create new collection
      await frame.waitFor('button[data-test="New Container"]', { visible: true });
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.click('button[data-test="New Container"]');

      // check new database
      await frame.waitFor('input[data-test="addCollection-createNewDatabase"]');
      await frame.click('input[data-test="addCollection-createNewDatabase"]');

      // check shared throughput
      await frame.waitFor('input[data-test="addCollectionPane-databaseSharedThroughput"]');
      await frame.click('input[data-test="addCollectionPane-databaseSharedThroughput"]');

      // type database id
      await frame.waitFor('input[data-test="addCollection-newDatabaseId"]');
      const dbInput = await frame.$('input[data-test="addCollection-newDatabaseId"]');
      await dbInput.press("Backspace");
      await dbInput.type(dbId);

      // type collection id
      await frame.waitFor('input[data-test="addCollection-collectionId"]');
      const input = await frame.$('input[data-test="addCollection-collectionId"]');
      await input.press("Backspace");
      await input.type(collectionId);

      // type partition key value
      await frame.waitFor('input[data-test="addCollection-partitionKeyValue"]');
      const keyInput = await frame.$('input[data-test="addCollection-partitionKeyValue"]');
      await keyInput.press("Backspace");
      await keyInput.type(sharedKey);

      // click submit
      await frame.waitFor("#submitBtnAddCollection");
      await frame.click("#submitBtnAddCollection");

      // validate created
      // open database menu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await frame.waitFor(`div[data-test="${dbId}"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitFor(`div[data-test="${dbId}"]`), { visible: true };
      await frame.click(`div[data-test="${dbId}"]`);
      await frame.waitFor(`div[data-test="${collectionId}"]`, { visible: true });

      // delete container

      // click context menu for container
      await frame.waitFor(`div[data-test="${collectionId}"] > div > button`, { visible: true });
      await frame.click(`div[data-test="${collectionId}"] > div > button`);

      // click delete container
      await frame.waitFor(RENDER_DELAY);
      await frame.waitFor('span[class="treeComponentMenuItemLabel deleteCollectionMenuItemLabel"]');
      await frame.click('span[class="treeComponentMenuItemLabel deleteCollectionMenuItemLabel"]');

      // confirm delete container
      await frame.waitFor('input[data-test="confirmCollectionId"]', { visible: true });
      await frame.type('input[data-test="confirmCollectionId"]', collectionId);

      // click delete
      await frame.waitFor('input[data-test="deleteCollection"]', { visible: true });
      await frame.click('input[data-test="deleteCollection"]');
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await expect(page).not.toMatchElement(`div[data-test="${collectionId}"]`);

      // click context menu for database
      await frame.waitFor(`div[data-test="${dbId}"] > div > button`);
      const button = await frame.$(`div[data-test="${dbId}"] > div > button`);
      await button.focus();
      await button.asElement().click();

      // click delete database
      await frame.waitFor(RENDER_DELAY);
      await frame.waitFor('span[class="treeComponentMenuItemLabel deleteDatabaseMenuItemLabel"]');
      await frame.click('span[class="treeComponentMenuItemLabel deleteDatabaseMenuItemLabel"]');

      // confirm delete database
      await frame.waitForSelector('input[data-test="confirmDatabaseId"]', { visible: true });
      await frame.waitFor(RENDER_DELAY);
      await frame.type('input[data-test="confirmDatabaseId"]', dbId.trim());

      // click delete
      await frame.click('input[data-test="deleteDatabase"]');
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await expect(page).not.toMatchElement(`div[data-test="${dbId}"]`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
