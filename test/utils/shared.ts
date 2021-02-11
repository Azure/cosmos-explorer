import crypto from "crypto";
import { Frame } from "puppeteer";

const LOADING_STATE_DELAY = 3000;
const CREATE_DELAY = 10000;

export async function login(connectionString: string): Promise<Frame> {
  const prodUrl = process.env.DATA_EXPLORER_ENDPOINT;
  await page.goto(prodUrl);

  if (process.env.PLATFORM === "Emulator") {
    return page.mainFrame();
  }
  // log in with connection string
  await page.waitFor("div > p.switchConnectTypeText", { visible: true });
  await page.click("div > p.switchConnectTypeText");
  const connStr = connectionString;
  await page.type("input[class='inputToken']", connStr);
  await page.click("input[value='Connect']");
  const handle = await page.waitForSelector("iframe");
  const frame = await handle.contentFrame();
  return frame;
}

export function generateUniqueName(baseName = "", length = 4): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}`;
}

export async function createDatabase(frame: Frame) {
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

export async function savePolicy(frame: Frame) {
  await frame.waitFor(`button[data-test="Save"]`), { visible: true };
  await frame.waitFor(LOADING_STATE_DELAY);
  await frame.click(`button[data-test="Save"]`);
  await frame.waitFor(CREATE_DELAY);
}
