import "expect-puppeteer";
import { Frame } from "puppeteer";
import { getTestExplorerFrame } from "../testExplorer/TestExplorerUtils";
import { generateUniqueName } from "../utils/shared";

const LOADING_STATE_DELAY = 1000;
const RETRY_DELAY = 5000;
const CREATE_DELAY = 10000;
jest.setTimeout(300000);

describe("MongoDB Index policy tests", () => {
  it("Open, Create and Saved Index", async () => {
    try {
      const singleField_Id = generateUniqueName("key");
      const wild_Id = generateUniqueName("key") + "$" + "**";
      const frame = await getTestExplorerFrame();

      //open dataBaseMenu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      const databases = await frame.$$(`div[class="databaseHeader main1 nodeItem "] > div[class="treeNodeHeader "]`);
      if(databases.length == 0) {
        createDatabase(frame)
      }
      const selectedDbId = await frame.evaluate((element) => {
        return element.attributes["data-test"].textContent;
      }, databases[0]);

      // Click into database
      await frame.waitFor(`div[data-test="${selectedDbId}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`div[data-test="${selectedDbId}"]`);

      //click intp scale& setting
      const containers = await frame.$$(`div[class="nodeChildren"] > div[class="collectionHeader main2 nodeItem "]> div[class="treeNodeHeader "]`);
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

      let index = 0 ;
      let throughput, selecteDropDown;

      //Type to single Field
      throughput = await frame.$$(".ms-TextField-field");
      selecteDropDown = "Index Type" +" "+ index;
      await frame.waitFor(`div[aria-label="${selecteDropDown}"]`), { visible: true };
      await throughput[index].type(singleField_Id);
      await frame.click(`div[aria-label="${selecteDropDown}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[title="Single Field"]`);
      index++;
      
      //Type to wield Field
      throughput = await frame.$$(".ms-TextField-field");
      await throughput[index].type(wild_Id);
      selecteDropDown = "Index Type" +" "+ index;
      await frame.waitFor(`div[aria-label="${selecteDropDown}"]`), { visible: true };
      await frame.click(`div[aria-label="${selecteDropDown}"]`);
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[title="Wildcard"]`);
      index++;

      //Save Button
      await frame.waitFor(`button[data-test="Save"]`), { visible: true };
      await frame.waitFor(LOADING_STATE_DELAY);
      await frame.click(`button[data-test="Save"]`);
      await frame.waitFor(CREATE_DELAY);

      //check the array
      let didWild_Id = false, didSingleField_Id = false;
      await frame.waitFor("div[data-automationid='DetailsRowCell'] > span");

      const elements = await frame.$$("div[data-automationid='DetailsRowCell'] > span");
      for (var i = 0; i < elements.length; i++) {
        const element = elements[i]
        const text = await frame.evaluate(element => element.textContent, element);
          if(text == wild_Id){
            didWild_Id = true
          } else if (text == singleField_Id) {
            didSingleField_Id = true;
          }
      }

      expect(didWild_Id).toBe(true);
      expect(didSingleField_Id).toBe(true);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `Test Failed ${testName}.jpg` });
      throw error;
    }
  });
});


async function createDatabase(frame: Frame) {

  const dbId = generateUniqueName("db");
  const collectionId = generateUniqueName("col");
  const sharedKey = `${generateUniqueName()}`;
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
}