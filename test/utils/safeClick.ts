import { Frame } from "playwright";

export async function safeClick(page: Frame, selector: string): Promise<void> {
  // TODO: Remove. Playwright does this for you... mostly.
  // But our knockout+react setup sometimes leaves dom nodes detached and even playwright can't recover.
  // Resource tree is particually bad.
  // Ideally this should only be added as a last resort
  await page.waitForSelector(selector);
  await page.waitForTimeout(5000);
  await page.click(selector);
}
