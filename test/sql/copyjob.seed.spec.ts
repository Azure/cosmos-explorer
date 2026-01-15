import { Frame, Locator, Page, test } from '@playwright/test';
import { ContainerCopy, getAccountName, TestAccount } from '../fx';
import { createMultipleTestContainers } from '../testData';

test.describe('Copy Job Seed', () => {
    let page: Page;
    let wrapper: Locator = null!;
    let panel: Locator = null!;
    let frame: Frame = null!;
    let targetAccountName: string = "";
    test.beforeAll("Copy Job - Before All", async ({ browser }) => {
        await createMultipleTestContainers({ accountType: TestAccount.SQLContainerCopyOnly, containerCount: 3 });
        page = await browser.newPage();
        ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQLContainerCopyOnly));
        targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
    });
    test.afterAll("Copy Job - After All", async () => {
        await page.unroute(/.*/, (route) => route.continue());
        await page.close();
    });
    test.afterEach("Copy Job - After Each", async () => {
        await page.unroute(/.*/, (route) => route.continue());
    });
    
    test('Successfully create a copy job for offline migration', async ({ page }) => {
    // generate code here.
    });

    test('Successfully create a copy job for online migration', async ({ page }) => {
    // generate code here.
    });
});
