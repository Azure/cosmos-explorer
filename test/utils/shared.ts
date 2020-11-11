import crypto from "crypto";
import { Frame } from "puppeteer";

let testExplorerFrame: Frame;

export async function login(connectionString: string): Promise<Frame> {
  const prodUrl = "https://localhost:1234/hostedExplorer.html";
  page.goto(prodUrl);

  // log in with connection string
  const handle = await page.waitForSelector("iframe");
  const frame = await handle.contentFrame();
  await frame.waitFor("div > p.switchConnectTypeText", { visible: true });
  await frame.click("div > p.switchConnectTypeText");
  const connStr = connectionString;
  await frame.type("input[class='inputToken']", connStr);
  await frame.click("input[value='Connect']");
  return frame;
}

export function generateUniqueName(baseName: string, length = 8): string {
  return `${baseName}${crypto.randomBytes(length).toString("hex")}`;
}
