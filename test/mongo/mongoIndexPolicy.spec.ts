import "expect-puppeteer";
import { getTestExplorerFrame } from "../testExplorer/TestExplorerUtils";
import { createDatabase, onClickSaveButton } from "../utils/shared";
import { generateUniqueName } from "../utils/shared";
import { ApiKind } from "../../src/Contracts/DataModels";

const LOADING_STATE_DELAY = 3000;
jest.setTimeout(300000);

describe("MongoDB Index policy tests", () => {
  it("Open, Create and Save Index", async () => {
    try {
      const singleFieldId = generateUniqueName("key");
      const wildCardId = generateUniqueName("key") + "$**";
      const frame = await getTestExplorerFrame(ApiKind.MongoDB);
      const dropDown = "Index Type ";
      let index = 0;

      //open dataBaseMenu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      const dbId = await createDatabase(frame);
      await frame.waitFor(25000);
      // click on database
      await frame.waitForSelector(`div[data-test="${dbId}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="${dbId}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);

      // click on scale & setting
      const containers = await frame.$$(
        `div[class="nodeChildren"] > div[class="collectionHeader main2 nodeItem "]> div[class="treeNodeHeader "]`
      );
      const selectedContainer = (await frame.evaluate((element) => element.innerText, containers[0]))
        .replace(/[\u{0080}-\u{FFFF}]/gu, "")
        .trim();
      await frame.waitFor(`div[data-test="${selectedContainer}"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="${selectedContainer}"]`);

      await frame.waitFor(`div[data-test="Scale & Settings"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
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
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});
