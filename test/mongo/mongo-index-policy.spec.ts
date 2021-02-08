import "expect-puppeteer";
import { getTestExplorerFrame } from "../testExplorer/TestExplorerUtils";
import { createDatabase } from "../utils/shared";
import { generateUniqueName } from "../utils/shared";
import { ApiKind } from "../../src/Contracts/DataModels";

const LOADING_STATE_DELAY = 1000;
const CREATE_DELAY = 10000;
jest.setTimeout(300000);

describe("MongoDB Index policy tests", () => {
  it("Open, Create and Save Index", async () => {
    try {
      const singleFieldId = generateUniqueName("key");
      const wildCardId = generateUniqueName("key") + "$**";
      const frame = await getTestExplorerFrame(ApiKind.MongoDB);
      const dropDown = "Index Type ";
      let index = 0, throughput;

      //open dataBaseMenu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      const databases = await frame.$$(`div[class="databaseHeader main1 nodeItem "] > div[class="treeNodeHeader "]`);
      if (databases.length === 0) {
        createDatabase(frame);
      }
      const selectedDbId = await frame.evaluate((element) => {
        return element.attributes["data-test"].textContent;
      }, databases[0]);

      // Click into database
      await frame.waitFor(`div[data-test="${selectedDbId}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="${selectedDbId}"]`);

      //click intp scale& setting
      const containers = await frame.$$(
        `div[class="nodeChildren"] > div[class="collectionHeader main2 nodeItem "]> div[class="treeNodeHeader "]`
      );
      const selectedContainer = await frame.evaluate((element) => {
        return element.attributes["data-test"].textContent;
      }, containers[0]);
      await frame.waitFor(`div[data-test="${selectedContainer}"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="${selectedContainer}"]`);

      await frame.waitFor(`div[data-test="Scale & Settings"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="Scale & Settings"]`);

      await frame.waitFor(`button[data-content="Indexing Policy"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[data-content="Indexing Policy"]`);

      //Type to single Field
      throughput = await frame.$$(".ms-TextField-field");
      const selectedDropDownSingleField = dropDown + index;
      await frame.waitFor(`div[aria-label="${selectedDropDownSingleField}"]`), { visible: true };
      await throughput[index].type(singleFieldId);
      await frame.click(`div[aria-label="${selectedDropDownSingleField}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[title="Single Field"]`);
      index++;

      //Type to wild card
      throughput = await frame.$$(".ms-TextField-field");
      await throughput[index].type(wildCardId);
      const selectedDropDownWildCard = dropDown + index;
      await frame.waitFor(`div[aria-label="${selectedDropDownWildCard}"]`), { visible: true };
      await frame.click(`div[aria-label="${selectedDropDownWildCard}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[title="Wildcard"]`);
      index++;

      //Save Button
      await frame.waitFor(`button[data-test="Save"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[data-test="Save"]`);
      await frame.waitFor(CREATE_DELAY);

      //check the array
      let singleFieldIndexInserted = false,
        wildCardIndexInserted = false;
      await frame.waitFor("div[data-automationid='DetailsRowCell'] > span");

      const elements = await frame.$$("div[data-automationid='DetailsRowCell'] > span");
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const text = await frame.evaluate((element) => element.textContent, element);
        if (text === wildCardId) {
          wildCardIndexInserted = true;
        } else if (text === singleFieldId) {
          singleFieldIndexInserted = true;
        }
      }

      expect(wildCardIndexInserted).toBe(true);
      expect(singleFieldIndexInserted).toBe(true);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
