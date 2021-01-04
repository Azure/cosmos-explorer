import crypto from "crypto";
import { Frame } from "puppeteer";

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
