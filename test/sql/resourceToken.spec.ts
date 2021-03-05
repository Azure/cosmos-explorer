/* eslint-disable jest/expect-expect */
import "expect-puppeteer";
import { Frame } from "puppeteer";
import { generateDatabaseName, generateUniqueName } from "../utils/shared";
import { CosmosClient, PermissionMode } from "@azure/cosmos";

jest.setTimeout(300000);
const RETRY_DELAY = 5000;
const CREATE_DELAY = 10000;

describe("Collection Add and Delete SQL spec", () => {
  it("creates a collection", async () => {
    const dbId = generateDatabaseName();
    const collectionId = generateUniqueName("col");
    const connectionString = process.env.PORTAL_RUNNER_CONNECTION_STRING;
    const client = new CosmosClient(connectionString);
    const endpoint = /AccountEndpoint=(.*);/.exec(connectionString)[1];
    const { database } = await client.databases.createIfNotExists({ id: dbId });
    const { container } = await database.containers.createIfNotExists({ id: collectionId });
    const { user } = await database.users.upsert({ id: "testUser" });
    const { resource: containerPermission } = await user.permissions.upsert({
      id: "partitionLevelPermission",
      permissionMode: PermissionMode.All,
      resource: container.url,
    });
    const resourceTokenConnectionString = `AccountEndpoint=${endpoint};DatabaseId=${database.id};CollectionId=${container.id};${containerPermission._token}`;
    try {
      await page.goto(process.env.DATA_EXPLORER_ENDPOINT);
      await page.waitFor("div > p.switchConnectTypeText", { visible: true });
      await page.click("div > p.switchConnectTypeText");
      await page.type("input[class='inputToken']", resourceTokenConnectionString);
      await page.click("input[value='Connect']");
      const handle = await page.waitForSelector("iframe");
      const frame = await handle.contentFrame();
      // validate created
      // open database menu
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.waitFor(CREATE_DELAY);
      await frame.waitForSelector('div[class="splashScreen"] > div[class="title"]', { visible: true });
      await frame.$$(`div[class="databaseHeader main1 nodeItem "] > div[class="treeNodeHeader "]`);
      expect(await frame.$(`span[title="${collectionId}"]`)).toBeDefined();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testName = (expect as any).getState().currentTestName;
      await page.screenshot({ path: `failed-${testName}.jpg` });
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
  const classList = await frame.evaluate((button) => {
    return button.parentElement.classList;
  }, button);
  if (!Object.values(classList).includes("selected") && retries < 5) {
    retries = retries + 1;
    await clickDBMenu(dbId, frame, retries);
  }
}
