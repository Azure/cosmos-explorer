import "expect-puppeteer";
import { Frame } from "puppeteer";
import { generateUniqueName, login } from "../utils/shared";

jest.setTimeout(300000);
const LOADING_STATE_DELAY = 2500;
const RETRY_DELAY = 5000;
const CREATE_DELAY = 10000;
const RENDER_DELAY = 1000;

describe("Collection Add and Delete Mongo spec", () => {
  it("creates a collection", async () => {
    try {
      const dbId = generateUniqueName("db");
      const collectionId = generateUniqueName("col");
      const sharedKey = `${generateUniqueName()}`;
      const frame = await login(process.env.MONGO_CONNECTION_STRING);

      // create new collection
      await frame.waitFor('button[data-test="New Collection"]', { visible: true });
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.click('button[data-test="New Collection"]');

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
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      const databases = await frame.$$(`div[class="databaseHeader main1 nodeItem "] > div[class="treeNodeHeader "]`);
      const selectedDbId = await frame.evaluate(element => {
        return element.attributes["data-test"].textContent;
      }, databases[0]);

      await frame.waitFor(`div[data-test="${selectedDbId}"]`), { visible: true };
      await frame.waitFor(CREATE_DELAY);
      await frame.waitFor("div[class='rowData'] > span[class='message']");

      const didCreateContainer = await frame.$$eval("div[class='rowData'] > span[class='message']", elements => {
        return elements.some(el => el.textContent.includes("Successfully created"));
      });

      expect(didCreateContainer).toBe(true);

      await frame.waitFor(`div[data-test="${selectedDbId}"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);

      await clickDBMenu(selectedDbId, frame);

      const collections = await frame.$$(
        `div[class="collectionHeader main2 nodeItem "] > div[class="treeNodeHeader "]`
      );

      if (collections.length) {
        const textId = await frame.evaluate(element => {
          return element.attributes["data-test"].textContent;
        }, collections[0]);
        await frame.waitFor(`div[data-test="${textId}"]`, { visible: true });
        // delete container

        // click context menu for container
        await frame.waitFor(`div[data-test="${textId}"] > div > button`, { visible: true });
        await frame.click(`div[data-test="${textId}"] > div > button`);

        // click delete container
        await frame.waitFor(RENDER_DELAY);
        await frame.waitFor('span[class="treeComponentMenuItemLabel deleteCollectionMenuItemLabel"]');
        await frame.click('span[class="treeComponentMenuItemLabel deleteCollectionMenuItemLabel"]');

        // confirm delete container
        await frame.waitFor('input[data-test="confirmCollectionId"]', { visible: true });
        await frame.type('input[data-test="confirmCollectionId"]', textId);

        // click delete
        await frame.waitFor('input[data-test="deleteCollection"]', { visible: true });
        await frame.click('input[data-test="deleteCollection"]');
        await frame.waitFor(LOADING_STATE_DELAY);
        await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

        await expect(page).not.toMatchElement(`div[data-test="${textId}"]`);
      }

      // click context menu for database
      await frame.waitFor(`div[data-test="${selectedDbId}"] > div > button`);
      await frame.waitFor(RENDER_DELAY);
      const button = await frame.$(`div[data-test="${selectedDbId}"] > div > button`);
      await button.focus();
      await button.asElement().click();

      // click delete database
      await frame.waitFor(RENDER_DELAY);
      await frame.waitFor('span[class="treeComponentMenuItemLabel deleteDatabaseMenuItemLabel"]');
      await frame.click('span[class="treeComponentMenuItemLabel deleteDatabaseMenuItemLabel"]');

      // confirm delete database
      await frame.waitForSelector('input[data-test="confirmDatabaseId"]', { visible: true });
      await frame.waitFor(RENDER_DELAY);
      await frame.type('input[data-test="confirmDatabaseId"]', selectedDbId);

      // click delete
      await frame.click('input[data-test="deleteDatabase"]');
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await expect(page).not.toMatchElement(`div[data-test="${selectedDbId}"]`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `./failed-${testName}.jpg` });
      throw error;
    }
  });
});

async function clickDBMenu(dbId: string, frame: Frame, retries = 0) {
  const button = await frame.$(`div[data-test="${dbId}"]`);
  await button.focus();
  const handler = await button.asElement();
  await handler.click();
  await ensureMenuIsOpen(dbId, frame, retries);
  return button;
}

async function ensureMenuIsOpen(dbId: string, frame: Frame, retries: number) {
  await frame.waitFor(RETRY_DELAY);
  const button = await frame.$(`div[data-test="${dbId}"]`);
  const classList = await frame.evaluate(button => {
    return button.parentElement.classList;
  }, button);
  if (!Object.values(classList).includes("selected") && retries < 5) {
    retries = retries + 1;
    await clickDBMenu(dbId, frame, retries);
  }
}
