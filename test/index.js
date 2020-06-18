import "expect-puppeteer";

jest.setTimeout(300000);

describe("Google", () => {
  it('should display "google" text on page', async () => {
    // Login to Azure Portal
    await page.goto("https://portal.azure.com");
    await page.waitFor("input[name=loginfmt]");
    await page.type("input[name=loginfmt]", process.env.PORTAL_RUNNER_USERNAME);
    await page.click("input[type=submit]");
    await page.waitFor(3000);
    await page.waitFor("input[name=loginfmt]");
    await page.type("input[name=passwd]", process.env.PORTAL_RUNNER_PASSWORD);
    await page.click("input[type=submit]");
    await page.waitForNavigation();
    await page.goto(
      "https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/f398d857-6991-4b24-bae1-ad435c5ff779/resourceGroups/workspace/providers/Microsoft.DocumentDb/databaseAccounts/stfaul/dataExplorer"
    );

    // Wait for page to settle
    await page.waitFor(10000);

    // Find Data Explorer iFrame
    const frames = page.frames();
    const dataExplorer = frames.find(frame => frame.url().includes("cosmos.azure.com"));

    // Click "New Container"
    const newContainerButton = await dataExplorer.$('button[data-test="New Container"]');
    await newContainerButton.click();

    // Wait for side pane to appear
    await dataExplorer.waitFor(".contextual-pane-in");

    // Fill out New Container form
    const databaseIdInput = await dataExplorer.$("#databaseId");
    await databaseIdInput.type("foo");
    const collectionIdInput = await dataExplorer.$("#containerId");
    await collectionIdInput.type("foo");
    const partitionKeyInput = await dataExplorer.$('input[data-test="addCollection-partitionKeyValue"]');
    await partitionKeyInput.type("/partitionKey");

    // TODO: Submit and assert results
    //     cy.wrap($body)
    //       .find("#submitBtnAddCollection")
    //       .click();

    //     cy.wait(10000);

    //     cy.wrap($body)
    //       .find('div[data-test="resourceTreeId"]')
    //       .should("exist")
    //       .find('div[class="treeComponent dataResourceTree"]')
    //       .should("contain", dbId);
  });
});
