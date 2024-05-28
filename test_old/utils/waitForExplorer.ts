import { Frame } from "playwright";

export const waitForExplorer = async (): Promise<Frame> => {
  await page.waitForSelector("iframe");
  await page.waitForTimeout(5000);
  return page.frame({
    name: "explorer",
  });
};
