import "expect-puppeteer";
import { Frame } from "puppeteer";
import { generateUniqueName, login } from "../utils/shared";

jest.setTimeout(300000);
const RETRY_DELAY = 5000;
const LOADING_STATE_DELAY = 2500;
const RENDER_DELAY = 1000;

describe("Collection Add and Delete Tables spec", () => {
  it("creates a collection", async () => {
    try {
      const tableId = generateUniqueName("tab");
      const frame = await login(process.env.TABLES_CONNECTION_STRING);

      // create new collection
      await frame.waitFor('button[data-test="New Table"]', { visible: true });
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.click('button[data-test="New Table"]');

      // type database id
      await frame.waitFor('input[data-test="addCollection-newDatabaseId"]');
      const dbInput = await frame.$('input[data-test="addCollection-newDatabaseId"]');
      await frame.waitFor(1000);
      await dbInput.type(tableId);

      // click submit
      await frame.waitFor("#submitBtnAddCollection");
      await frame.click("#submitBtnAddCollection");

      // validate created
      // open database menu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await frame.waitFor(`div[data-test="TablesDB"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);

      const didCreateContainer = await frame.$$eval("div[class='rowData'] > span[class='message']", (elements) => {
        return elements.some((el) => el.textContent.includes("Successfully created"));
      });

      expect(didCreateContainer).toBe(true);

      await frame.waitFor(`div[data-test="TablesDB"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);

      await clickTablesMenu(frame);

      const collections = await frame.$$(
        `div[class="collectionHeader main2 nodeItem "] > div[class="treeNodeHeader "]`
      );
      const textId = await frame.evaluate((element) => {
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
      await frame.waitFor('input[id="confirmCollectionId"]', { visible: true });
      await frame.type('input[id="confirmCollectionId"]', textId);

      // click delete
      await frame.waitFor('button[id="sidePanelOkButton"]', { visible: true });
      await frame.click('button[id="sidePanelOkButton"]');
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await expect(page).not.toMatchElement(`div[data-test="${textId}"]`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `failed-${testName}.jpg` });
      throw error;
    }
  });
});

async function clickTablesMenu(frame: Frame, retries = 0) {
  const button = await frame.$(`div[data-test="TablesDB"]`);
  await button.focus();
  const handler = await button.asElement();
  await handler.click();
  await ensureMenuIsOpen(frame, retries);
  return button;
}

async function ensureMenuIsOpen(frame: Frame, retries: number) {
  await frame.waitFor(RETRY_DELAY);
  const button = await frame.$(`div[data-test="TablesDB"]`);
  const classList = await frame.evaluate((button) => {
    return button.parentElement.classList;
  }, button);
  if (!Object.values(classList).includes("selected") && retries < 5) {
    retries = retries + 1;
    await clickTablesMenu(frame, retries);
  }
}
