import "expect-puppeteer";
import { createDatabase, generateUniqueName, onClickSaveButton } from "../utils/shared";

const LOADING_STATE_DELAY = 5000;
jest.setTimeout(300000);

describe("MongoDB Index policy tests", () => {
  it("Open, Create and Save Index", async () => {
    try {
      const singleFieldId = generateUniqueName("key");
      const wildCardId = generateUniqueName("key") + "$**";
      await page.goto("https://localhost:1234/testExplorer.html?accountName=portal-mongo-runner");
      const handle = await page.waitForSelector("iframe");
      const frame = await handle.contentFrame();
      const dropDown = "Index Type ";
      let index = 0;

      //open dataBaseMenu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      const { databaseId, collectionId } = await createDatabase(frame);
      await frame.waitFor(25000);
      // click on database
      await frame.waitForSelector(`div[data-test="${databaseId}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="${databaseId}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);

      // click on scale & setting
      await frame.waitFor(`div[data-test="${collectionId}"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="${collectionId}"]`);

      await frame.waitFor(`div[data-test="Scale & Settings"]`), { visible: true };
      await frame.waitFor(10000);
      await frame.click(`div[data-test="Scale & Settings"]`);

      await frame.waitFor(`button[data-content="Indexing Policy"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[data-content="Indexing Policy"]`);

      // Type to single Field
      let throughput = await frame.$$(".ms-TextField-field");
      const selectedDropDownSingleField = dropDown + index;
      await frame.waitFor(`div[aria-label="${selectedDropDownSingleField}"]`), { visible: true };
      await throughput[index].type(singleFieldId);
      await frame.click(`div[aria-label="${selectedDropDownSingleField}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[title="Single Field"]`);
      index++;

      // Type to wild card
      throughput = await frame.$$(".ms-TextField-field");
      await throughput[index].type(wildCardId);
      const selectedDropDownWildCard = dropDown + index;
      await frame.waitFor(`div[aria-label="${selectedDropDownWildCard}"]`), { visible: true };
      await frame.click(`div[aria-label="${selectedDropDownWildCard}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[title="Wildcard"]`);
      index++;

      // click save Button
      await onClickSaveButton(frame);

      // check the array
      let singleFieldIndexInserted = false,
        wildCardIndexInserted = false;
      await frame.waitFor("div[data-automationid='DetailsRowCell'] > span"), { visible: true };
      await frame.waitFor(20000);

      const elements = await frame.$$("div[data-automationid='DetailsRowCell'] > span");
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const text = await frame.evaluate((element) => element.textContent, element);
        if (text.includes(wildCardId)) {
          wildCardIndexInserted = true;
        } else if (text.includes(singleFieldId)) {
          singleFieldIndexInserted = true;
        }
      }
      await frame.waitFor(20000);
      expect(wildCardIndexInserted).toBe(true);
      expect(singleFieldIndexInserted).toBe(true);

      //delete all index policy
      await frame.waitFor("button[aria-label='Delete index Button']"), { visible: true };
      const deleteButton = await frame.$$("button[aria-label='Delete index Button']");
      for (let i = 0; i < deleteButton.length; i++) {
        await frame.click(`button[aria-label="Delete index Button"]`);
      }
      await onClickSaveButton(frame);

      //check for cleaning
      await frame.waitFor(20000);
      await frame.waitFor("div[data-automationid='DetailsRowCell'] > span"), { visible: true };
      const isDeletionComplete = await frame.$$("div[data-automationid='DetailsRowCell'] > span");
      expect(isDeletionComplete).toHaveLength(2);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `failed-${testName}.jpg` });
      throw error;
    }
  });
});
