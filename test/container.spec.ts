import "expect-puppeteer";
import crypto from 'crypto'

jest.setTimeout(300000);

describe('Collection Add and Delete SQL spec', () => {
  it('creates a collection', async () => {
    try {
      const dbId = `TestDatabase${crypto.randomBytes(8).toString("hex")}`;
      const collectionId = `TestCollection${crypto.randomBytes(8).toString("hex")}`;
      const sharedKey = `SharedKey${crypto.randomBytes(8).toString("hex")}`;
      const prodUrl = "https://localhost:1234/hostedExplorer.html";
      page.goto(prodUrl);

      // log in with connection string
      const handle = await page.waitForSelector('iframe');
      const frame = await handle.contentFrame();
      await frame.waitFor('div > p.switchConnectTypeText', { visible: true });
      await frame.click('div > p.switchConnectTypeText');
      const connStr = process.env.PORTAL_RUNNER_CONNECTION_STRING;
      await frame.type("input[class='inputToken']", connStr);
      await frame.click("input[value='Connect']");

      // create new collection
      await frame.waitFor('button[data-test="New Container"]', { visible: true });
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.click('button[data-test="New Container"]');
      
      // check new database
      await frame.waitFor('input[data-test="addCollection-createNewDatabase"]');
      await frame.click('input[data-test="addCollection-createNewDatabase"]');

      // check shared throughput
      await frame.waitFor('input[data-test="addCollectionPane-databaseSharedThroughput"]');
      await frame.click('input[data-test="addCollectionPane-databaseSharedThroughput"]')   ;   

      // type database id
      await frame.waitFor('input[data-test="addCollection-newDatabaseId"]');
      await frame.type('input[data-test="addCollection-newDatabaseId"]', dbId);      

      // type collection id
      await frame.waitFor('input[data-test="addCollection-collectionId"]');
      await frame.type('input[data-test="addCollection-collectionId"]', collectionId); 

      // type partition key value
      await frame.waitFor('input[data-test="addCollection-partitionKeyValue"]');
      await frame.type('input[data-test="addCollection-partitionKeyValue"]', sharedKey);

      // click submit
      await frame.waitFor('#submitBtnAddCollection');
      await frame.click('#submitBtnAddCollection');

      // validate created
      // open database menu
      await frame.waitFor(`span[title="${dbId}"]`);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await frame.click(`div[data-test="${dbId}"]`);
      await frame.waitFor(`span[title="${collectionId}"]`);
      
      // delete container

      // click context menu for container
      await frame.waitFor(`div[data-test="${collectionId}"] > div > button`);
      await frame.click(`div[data-test="${collectionId}"] > div > button`);

      // click delete container
      await frame.waitForSelector('body > div.ms-Layer.ms-Layer--fixed');
      await frame.waitFor(1000);
      const elements = await frame.$$('span[class="treeComponentMenuItemLabel"]')
      await elements[elements.length - 1].click();

      // confirm delete container
      await frame.type('input[data-test="confirmCollectionId"]', collectionId.trim());

      // click delete
      await frame.waitFor('input[data-test="deleteCollection"]');
      await frame.click('input[data-test="deleteCollection"]');
      await frame.waitFor(5000);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

      await expect(page).not.toMatchElement(`div[data-test="${collectionId}"]`);

      // click context menu for database
      await frame.waitFor(`div[data-test="${dbId}"] > div > button`);
      const button = await frame.$(`div[data-test="${dbId}"] > div > button`);
      await button.focus();
      await button.asElement().click();

      // click delete database
      await frame.waitFor(1000);
      const dbElements = await frame.$$('span[class="treeComponentMenuItemLabel"]')
      await dbElements[1].click();

      // confirm delete database
      await frame.type('input[data-test="confirmDatabaseId"]', dbId.trim());

      // click delete
      await frame.click('input[data-test="deleteDatabase"]');
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await expect(page).not.toMatchElement(`div[data-test="${dbId}"]`);
    } catch (error) {
      await page.screenshot({path: 'failure.png'});
      throw error;
    } 
  }) 
})