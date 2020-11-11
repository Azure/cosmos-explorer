import { Frame } from "puppeteer";

let testExplorerFrame: Frame;
export async function getTestExplorerFrame(): Promise<Frame> {
  if (testExplorerFrame) {
    return testExplorerFrame;
  }

  const prodUrl = "https://localhost:1234/testExplorer.html";
  await page.goto(prodUrl);
  const buttonHandle = await page.waitForSelector("button");
  buttonHandle.click();

  const handle = await page.waitForSelector("iframe");
  testExplorerFrame = await handle.contentFrame();
  await testExplorerFrame.waitForSelector(".galleryHeader");
  return testExplorerFrame;
}
