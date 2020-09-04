import "expect-puppeteer";
import crypto from 'crypto'

jest.setTimeout(300000);

describe.only('Collection Add and Delete Cassandra spec', () => {
  it('creates a collection', async () => {
    try {
      const keyspaceId = `KeyspaceId${crypto.randomBytes(8).toString("hex")}`;
      const tableId = `TableId112`;
      const prodUrl = "https://localhost:1234/hostedExplorer.html";
      page.goto(prodUrl);

      // log in with connection string
      const handle = await page.waitForSelector('iframe');
      const frame = await handle.contentFrame();
      await frame.waitFor('div > p.switchConnectTypeText', { visible: true });
      await frame.click('div > p.switchConnectTypeText');
      const connStr = process.env.CASSANDRA_CONNECTION_STRING;
      await frame.type("input[class='inputToken']", connStr);
      await frame.click("input[value='Connect']");

      // create new table
      await frame.waitFor('button[data-test="New Table"]', { visible: true });
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.click('button[data-test="New Table"]');      

      debugger;
      // type keyspace id
      await frame.waitFor('input[id="keyspace-id"]', { visible: true });
      await frame.type('input[id="keyspace-id"]', keyspaceId);      

      // type table id
      await frame.waitFor('input[class="textfontclr"]');
      await frame.type('input[class="textfontclr"]', tableId); 

    //   // type partition key value
    //   await frame.waitFor('input[data-test="addCollection-partitionKeyValue"]');
    //   await frame.type('input[data-test="addCollection-partitionKeyValue"]', sharedKey);

    //   // click submit
    //   await frame.waitFor('#submitBtnAddCollection');
    //   await frame.click('#submitBtnAddCollection');

    //   // validate created
    //   // open database menu
    //   await frame.waitFor(`span[title="${dbId}"]`);
    //   await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

    //   await frame.click(`div[data-test="${dbId}"]`);
    //   await frame.waitFor(`span[title="${collectionId}"]`);
      
    //   // delete container

    //   // click context menu for container
    //   await frame.waitFor(`div[data-test="${collectionId}"] > div > button`);
    //   await frame.click(`div[data-test="${collectionId}"] > div > button`);

    //   // click delete container
    //   await frame.waitForSelector('body > div.ms-Layer.ms-Layer--fixed');
    //   const elements = await frame.$$('span[class="treeComponentMenuItemLabel"]')
    //   await elements[4].click()

    //   // confirm delete container
    //   await frame.type('input[data-test="confirmCollectionId"]', collectionId.trim());

    //   // click delete
    //   await frame.click('input[data-test="deleteCollection"]');
    //   await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });

    //   await expect(page).not.toMatchElement(`div[data-test="${collectionId}"]`);
    } catch (error) {
      await page.screenshot({path: 'failure.png'});
      throw error;
    } 
  }) 
})