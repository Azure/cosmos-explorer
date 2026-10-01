import { Locator, Page, expect, test } from "@playwright/test";
import {
  CommandBarButton,
  DataExplorer,
  ONE_MINUTE_MS,
  TEST_AUTOSCALE_MAX_THROUGHPUT_RU_4K,
  TEST_MANUAL_THROUGHPUT_RU,
  TestAccount,
} from "../../fx";
import { TestDatabaseContext, createTestDB } from "../../testData";

test("New Container readiness reports preload errors before invoking form actions", async ({ page }) => {
  await page.setContent(`
    <section data-test="Panel:New Container">
      <div role="alert">Unable to load throughput settings. Try again.</div>
      <button>Retry</button>
    </section>
  `);
  const explorer = new DataExplorer(page.mainFrame());
  let actionCalls = 0;
  const retryButton = page.getByRole("button", { name: "Retry", exact: true });
  await retryButton.evaluate((element) => {
    element.addEventListener("click", () => element.setAttribute("data-clicked", "true"));
  });

  await expect(
    explorer.whilePanelOpen("New Container", async () => {
      actionCalls += 1;
      throw new Error("The form action ran before readiness");
    }),
  ).rejects.toThrow("New Container failed to load: Unable to load throughput settings. Try again.");
  expect(actionCalls).toBe(0);
  await expect(retryButton).not.toHaveAttribute("data-clicked", "true");
});

test("New Container readiness waits for the form, not an enabled submit button", async ({ page }) => {
  await page.setContent(`
    <section data-test="Panel:New Container">
      <div role="progressbar">Loading throughput settings...</div>
      <button hidden>Retry</button>
      <form id="panelContainer" hidden>
        <div role="alert">Free tier information</div>
        <button data-test="Panel/OkButton" disabled>OK</button>
      </form>
    </section>
  `);
  const explorer = new DataExplorer(page.mainFrame());
  let actionCalls = 0;
  const opening = explorer.whilePanelOpen(
    "New Container",
    async (panel, okButton) => {
      actionCalls += 1;
      await expect(okButton).toBeDisabled();
      await panel.evaluate((element) => element.remove());
    },
    { openTimeout: 5000, closeTimeout: 1000 },
  );
  const outcome = opening.catch((error: unknown) => error);
  await expect(page.getByRole("progressbar")).toBeVisible();
  expect(actionCalls).toBe(0);

  await page.locator("form#panelContainer").evaluate((element) => element.removeAttribute("hidden"));
  await expect(outcome).resolves.toBeUndefined();
  expect(actionCalls).toBe(1);
});

test("New Container readiness reports an error appearing after loading starts", async ({ page }) => {
  await page.setContent(`
    <section data-test="Panel:New Container">
      <div role="progressbar">Loading throughput settings...</div>
      <div role="alert" hidden>Unable to load throughput settings. Try again.</div>
      <button hidden>Retry</button>
    </section>
  `);
  const explorer = new DataExplorer(page.mainFrame());
  let settled = false;
  const outcome = explorer.waitForNewContainerForm(5000).then(
    () => {
      settled = true;
      return undefined;
    },
    (error: unknown) => {
      settled = true;
      return error;
    },
  );
  await expect(page.getByRole("progressbar")).toBeVisible();
  expect(settled).toBe(false);
  await explorer.panel("New Container").evaluate((element) => {
    element.querySelector('[role="progressbar"]')?.remove();
    element.querySelectorAll("[hidden]").forEach((child) => child.removeAttribute("hidden"));
  });
  await expect(outcome).resolves.toMatchObject({
    message: "New Container failed to load: Unable to load throughput settings. Try again.",
  });
});

for (const state of ["loading", "absent"] as const) {
  test(`New Container readiness times out explicitly when ${state}`, async ({ page }) => {
    await page.setContent(
      state === "loading"
        ? '<section data-test="Panel:New Container"><div role="progressbar">Loading throughput settings...</div></section>'
        : "<main>No panel</main>",
    );
    const explorer = new DataExplorer(page.mainFrame());
    let actionCalls = 0;

    await expect(
      explorer.whilePanelOpen(
        "New Container",
        async () => {
          actionCalls += 1;
        },
        { openTimeout: 100 },
      ),
    ).rejects.toThrow("New Container did not show its form or preload error within 100ms");
    expect(actionCalls).toBe(0);
  });
}

test("New Container readiness leaves other panel workflows unchanged", async ({ page }) => {
  await page.setContent(`
    <section data-test="Panel:New Database">
      <button data-test="Panel/OkButton">OK</button>
    </section>
  `);
  const explorer = new DataExplorer(page.mainFrame());
  let actionCalls = 0;
  await explorer.whilePanelOpen(
    "New Database",
    async (panel, okButton) => {
      actionCalls += 1;
      await expect(okButton).toBeVisible();
      await panel.evaluate((element) => element.remove());
    },
    { openTimeout: 1000, closeTimeout: 1000 },
  );
  expect(actionCalls).toBe(1);
});

const verifyMockOfferLoading = async (page: Page, failureStatus: 429 | 503): Promise<DataExplorer> => {
  test.setTimeout(60000);
  const accountId =
    "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/mock-rg/providers/Microsoft.DocumentDB/databaseAccounts/mock-account";
  const databases = Array.from({ length: 100 }, (_, index) => ({
    properties: { resource: { id: `mock-db-${index}`, _rid: `mock-rid-${index}`, _self: `dbs/mock-rid-${index}/` } },
  }));
  let releaseOfferResponse!: () => void;
  const pendingOfferResponse = new Promise<void>((resolve) => {
    releaseOfferResponse = resolve;
  });
  let failOffers = true;
  let activeOfferReads = 0;
  let peakOfferReads = 0;
  let failedOfferReads = 0;
  let successfulOfferReads = 0;
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("https://management.azure.com/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === accountId) {
      await route.fulfill({
        json: {
          id: accountId,
          name: "mock-account",
          type: "Microsoft.DocumentDB/databaseAccounts",
          kind: "GlobalDocumentDB",
          location: "West US 2",
          tags: { "DataExplorer:TestAccountType": "sql" },
          properties: {
            documentEndpoint: "https://mock-account.documents.azure.com/",
            capabilities: [],
            enableMultipleWriteLocations: false,
            readLocations: [{ locationName: "West US 2" }],
            writeLocations: [{ locationName: "West US 2" }],
          },
        },
      });
    } else if (pathname.endsWith("/listKeys")) {
      await route.fulfill({ json: { primaryMasterKey: "mock-key" } });
    } else if (pathname.endsWith("/sqlDatabases")) {
      await route.fulfill({ json: { value: databases } });
    } else if (pathname.endsWith("/throughputSettings/default")) {
      activeOfferReads += 1;
      peakOfferReads = Math.max(peakOfferReads, activeOfferReads);
      try {
        if (failOffers) {
          failedOfferReads += 1;
          await pendingOfferResponse;
          await route.fulfill({
            status: failureStatus,
            headers: { "Retry-After": "1", "Access-Control-Expose-Headers": "Retry-After" },
            json: {
              error: {
                code: failureStatus === 429 ? "429" : "ServiceUnavailable",
                message: "Mock throughput read failed",
              },
            },
          });
        } else {
          successfulOfferReads += 1;
          await route.fulfill({ status: 404, json: { error: { code: "NotFound", message: "No shared throughput" } } });
        }
      } finally {
        activeOfferReads -= 1;
      }
    } else {
      await route.fulfill({ json: { value: [] } });
    }
  });

  const params = new URLSearchParams({
    accountName: "mock-account",
    resourceGroup: "mock-rg",
    subscriptionId: "00000000-0000-0000-0000-000000000000",
    token: "mock-token",
    nosqlRbacToken: "mock-token",
    "feature.enableCopilot": "false",
  });
  await page.goto(`https://localhost:1234/testExplorer.html?${params}`);
  const explorer = await DataExplorer.waitForExplorer(page);
  await explorer.waitForNode("mock-db-0");
  await (await explorer.globalCommandButton("New Container")).click();
  const panel = explorer.panel("New Container");
  try {
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("progressbar", { name: "Loading throughput settings..." })).toBeVisible();
    await expect(panel.getByRole("radio", { name: /Create new/i })).toHaveCount(0);
    await expect(panel.getByRole("button", { name: "OK", exact: true })).toHaveCount(0);
    await expect.poll(() => activeOfferReads).toBe(4);
  } finally {
    if (failureStatus === 429) {
      failOffers = false;
    }
    releaseOfferResponse();
  }

  if (failureStatus === 503) {
    await expect(panel.getByRole("alert")).toContainText("Unable to load throughput settings. Try again.");
    await expect(explorer.waitForNewContainerForm()).rejects.toThrow(
      "New Container failed to load: Unable to load throughput settings. Try again.",
    );
    await expect(panel.getByRole("radio", { name: /Create new/i })).toHaveCount(0);
    await panel.getByRole("button", { name: "More details", exact: true }).click();
    const consoleContents = explorer.frame.getByTestId("NotificationConsole/Contents");
    await expect(consoleContents).toBeVisible();
    await expect(consoleContents).toContainText("Mock throughput read failed");
    await expect
      .poll(async () => {
        const panelBounds = await panel.boundingBox();
        const consoleBounds = await explorer.frame.locator("#explorerNotificationConsole").boundingBox();
        return !!panelBounds && !!consoleBounds && panelBounds.y + panelBounds.height <= consoleBounds.y + 1;
      })
      .toBe(true);
    await expect.poll(() => activeOfferReads).toBe(0);
    expect(failedOfferReads).toBe(4);
    failOffers = false;
    await panel.getByRole("button", { name: "Retry", exact: true }).click();
  }
  await explorer.waitForNewContainerForm();
  await expect(panel.getByRole("radio", { name: /Create new/i })).toBeChecked();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
  expect(failedOfferReads).toBe(4);
  expect(successfulOfferReads).toBe(databases.length);
  expect(peakOfferReads).toBe(4);
  expect(pageErrors).toEqual([]);
  return explorer;
};

test("New Container bounds offer loading and recovers from an error on retry", async ({ page }) => {
  await verifyMockOfferLoading(page, 503);
});

test("New Container automatically retries throttled offer reads", async ({ page }) => {
  await verifyMockOfferLoading(page, 429);
});

test("New Container completes an accepted create after status polling is throttled", async ({ page }) => {
  const explorer = await verifyMockOfferLoading(page, 429);
  const containerPath = "/sqlDatabases/mock-db-0/containers/polling-container";
  const operationPath = `${containerPath}/operationResults/mock-operation`;
  const container = {
    properties: {
      resource: {
        id: "polling-container",
        _rid: "mock-collection",
        _self: "dbs/mock-rid-0/colls/mock-collection/",
        partitionKey: { paths: ["/pk"], kind: "Hash" },
      },
    },
  };
  let createRequests = 0;
  let created = false;
  const pollMethods: string[] = [];

  await page.route(
    (url) => url.hostname === "management.azure.com" && url.pathname.endsWith(containerPath),
    async (route) => {
      if (route.request().method() === "PUT") {
        createRequests += 1;
        const operationUrl = new URL(route.request().url());
        operationUrl.pathname += "/operationResults/mock-operation";
        await route.fulfill({
          status: 202,
          headers: { location: operationUrl.href, "Access-Control-Expose-Headers": "Location" },
          json: {},
        });
      } else {
        await route.fulfill({ json: container });
      }
    },
  );
  await page.route(
    (url) => url.hostname === "management.azure.com" && url.pathname.endsWith(operationPath),
    async (route) => {
      pollMethods.push(route.request().method());
      if (pollMethods.length === 1) {
        await route.fulfill({
          status: 429,
          headers: { "Retry-After": "1", "Access-Control-Expose-Headers": "Retry-After" },
          json: { error: { code: "SubscriptionRequestsThrottled", message: "Status polling throttled" } },
        });
      } else {
        created = true;
        await route.fulfill({ json: container });
      }
    },
  );
  await page.route(
    (url) => url.hostname === "management.azure.com" && url.pathname.endsWith("/sqlDatabases/mock-db-0/containers"),
    (route) => route.fulfill({ json: { value: created ? [container] : [] } }),
  );

  const panel = explorer.panel("New Container");
  await panel.getByRole("radio", { name: /Use existing/i }).click();
  await panel.getByRole("combobox", { name: "Choose an existing database" }).click();
  await explorer.frame.getByRole("option", { name: "mock-db-0", exact: true }).click();
  await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill("polling-container");
  await panel.getByRole("textbox", { name: "Partition key", exact: true }).fill("/pk");
  await panel.getByTestId("Panel/OkButton").click();
  await expect(panel).toBeHidden();
  expect(createRequests).toBe(1);
  expect(pollMethods).toEqual(["GET", "GET"]);
});

test.describe("Shared Throughput Option Removed from Creation Dialogs", () => {
  let explorer: DataExplorer = null!;

  test.beforeEach(async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL);
  });

  test("New Database panel should not show shared throughput checkbox", async () => {
    // Open the "New Database" panel via the global command menu
    const newDatabaseButton = await explorer.globalCommandButton("New Database");
    await newDatabaseButton.click();

    const panel = explorer.panel("New Database");
    await panel.waitFor();

    // Assert that no "Provision throughput" / "Provision shared throughput" checkbox is visible
    const sharedThroughputCheckbox = panel.getByRole("checkbox", {
      name: /Provision.*throughput|Share.*throughput/i,
    });
    await expect(sharedThroughputCheckbox).not.toBeAttached();

    // Close the panel without submitting
    const closeButton = explorer.frame.getByLabel("Close New Database");
    await closeButton.click();
    await panel.waitFor({ state: "detached" });
  });

  test("New Container panel should not show shared throughput checkbox when creating new database", async () => {
    // Open the "New Container" panel
    const newContainerButton = await explorer.globalCommandButton("New Container");
    await newContainerButton.click();

    const panel = await explorer.waitForNewContainerForm();

    // "Create new" database should be selected by default
    const createNewRadio = panel.getByRole("radio", { name: /Create new/i });
    await expect(createNewRadio).toBeChecked();

    // Assert that no "Share throughput across containers" checkbox is visible
    const shareThroughputCheckbox = panel.getByRole("checkbox", {
      name: /Share throughput/i,
    });
    await expect(shareThroughputCheckbox).not.toBeAttached();

    // Close the panel without submitting
    const closeButton = explorer.frame.getByLabel("Close New Container");
    await closeButton.click();
    await panel.waitFor({ state: "detached" });
  });

  test("Dedicated throughput checkbox still appears for existing shared database", async () => {
    // Create a database with shared throughput via SDK
    const dbContext = await createTestDB({ throughput: 400 });

    try {
      // Wait for the database to appear
      await explorer.waitForNode(dbContext.database.id);

      // Open New Container panel
      const newContainerButton = await explorer.globalCommandButton("New Container");
      await newContainerButton.click();

      const panel = await explorer.waitForNewContainerForm();

      // Select "Use existing" and pick the shared database
      const useExistingRadio = panel.getByRole("radio", { name: /Use existing/i });
      await useExistingRadio.click();

      const databaseDropdown = panel.getByRole("combobox", { name: "Choose an existing database" });
      await databaseDropdown.click();
      await explorer.frame.getByRole("option", { name: dbContext.database.id }).click();

      // Assert that "Provision dedicated throughput" checkbox IS visible for a shared database
      const dedicatedThroughputCheckbox = panel.getByRole("checkbox", {
        name: /Provision dedicated throughput/i,
      });
      await expect(dedicatedThroughputCheckbox).toBeVisible();

      // Close the panel without submitting
      const closeButton = explorer.frame.getByLabel("Close New Container");
      await closeButton.click();
      await panel.waitFor({ state: "detached" });
    } finally {
      await dbContext.dispose();
    }
  });
});

test.describe("Database with Shared Throughput", () => {
  let dbContext: TestDatabaseContext = null!;
  let explorer: DataExplorer = null!;
  const containerId = "sharedcontainer";

  // Helper methods
  const getThroughputInput = (type: "manual" | "autopilot"): Locator => {
    return explorer.frame.getByTestId(`${type}-throughput-input`);
  };

  test.afterEach("Delete Test Database", async () => {
    await dbContext?.dispose();
  });

  test.describe("Manual Throughput Tests", () => {
    test.beforeEach(async ({ page }) => {
      explorer = await DataExplorer.open(page, TestAccount.SQL);
    });

    test("Create database with shared manual throughput and verify Scale node in UI", async () => {
      test.setTimeout(120000); // 2 minutes timeout
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Verify database node appears in the tree
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      expect(databaseNode).toBeDefined();

      // Expand the database node to see child nodes
      await databaseNode.expand();

      // Verify that "Scale" node appears under the database
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      expect(scaleNode).toBeDefined();
      await expect(scaleNode.element).toBeVisible();
    });

    test("Add container to shared database without dedicated throughput", async () => {
      // Create database with shared manual throughput
      dbContext = await createTestDB({ throughput: 400 });

      // Wait for the database to appear in the tree
      await explorer.waitForNode(dbContext.database.id);

      // Add a container to the shared database via UI
      const newContainerButton = await explorer.globalCommandButton("New Container");
      await newContainerButton.click();

      await explorer.whilePanelOpen(
        "New Container",
        async (panel, okButton) => {
          // Select "Use existing" database
          const useExistingRadio = panel.getByRole("radio", { name: /Use existing/i });
          await useExistingRadio.click();

          // Select the database from dropdown using the new data-testid
          const databaseDropdown = panel.getByRole("combobox", { name: "Choose an existing database" });
          await databaseDropdown.click();

          await explorer.frame.getByRole("option", { name: dbContext.database.id }).click();
          // Now you can target the specific database option by its data-testid
          //await panel.getByTestId(`database-option-${dbContext.database.id}`).click();
          // Fill container id
          await panel.getByRole("textbox", { name: "Container id, Example Container1" }).fill(containerId);

          // Fill partition key
          await panel.getByRole("textbox", { name: "Partition key" }).fill("/pk");

          // Ensure "Provision dedicated throughput" is NOT checked
          const dedicatedThroughputCheckbox = panel.getByRole("checkbox", {
            name: /Provision dedicated throughput for this container/i,
          });

          if (await dedicatedThroughputCheckbox.isVisible()) {
            const isChecked = await dedicatedThroughputCheckbox.isChecked();
            if (isChecked) {
              await dedicatedThroughputCheckbox.uncheck();
            }
          }

          await okButton.click();
        },
        { closeTimeout: 5 * ONE_MINUTE_MS },
      );

      // Verify container was created under the database
      const containerNode = await explorer.waitForContainerNode(dbContext.database.id, containerId);
      expect(containerNode).toBeDefined();
    });

    test("Scale shared database manual throughput", async () => {
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Navigate to the scale settings by clicking the "Scale" node in the tree
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Update manual throughput from 400 to 800
      await getThroughputInput("manual").fill(TEST_MANUAL_THROUGHPUT_RU.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        {
          timeout: 2 * ONE_MINUTE_MS,
        },
      );
    });

    test("Scale shared database from manual to autoscale", async () => {
      // Create database with shared manual throughput (400 RU/s)
      dbContext = await createTestDB({ throughput: 400 });

      // Open database settings by clicking the "Scale" node
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Switch to Autoscale
      const autoscaleRadio = explorer.frame.getByText("Autoscale", { exact: true });
      await autoscaleRadio.click();

      // Set autoscale max throughput to 1000
      //await getThroughputInput("autopilot").fill(TEST_AUTOSCALE_THROUGHPUT_RU.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        {
          timeout: 2 * ONE_MINUTE_MS,
        },
      );
    });
  });

  test.describe("Autoscale Throughput Tests", () => {
    test.beforeEach(async ({ page }) => {
      explorer = await DataExplorer.open(page, TestAccount.SQL);
    });

    test("Create database with shared autoscale throughput and verify Scale node in UI", async () => {
      test.setTimeout(120000); // 2 minutes timeout

      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Verify database node appears
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      expect(databaseNode).toBeDefined();

      // Expand the database node to see child nodes
      await databaseNode.expand();

      // Verify that "Scale" node appears under the database
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      expect(scaleNode).toBeDefined();
      await expect(scaleNode.element).toBeVisible();
    });

    test("Scale shared database autoscale throughput", async () => {
      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Open database settings
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Update autoscale max throughput from 1000 to 4000
      await getThroughputInput("autopilot").fill(TEST_AUTOSCALE_MAX_THROUGHPUT_RU_4K.toString());

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        {
          timeout: 2 * ONE_MINUTE_MS,
        },
      );
    });

    test("Scale shared database from autoscale to manual", async () => {
      // Create database with shared autoscale throughput (max 1000 RU/s)
      dbContext = await createTestDB({ maxThroughput: 1000 });

      // Open database settings
      const databaseNode = await explorer.waitForNode(dbContext.database.id);
      await databaseNode.expand();
      const scaleNode = await explorer.waitForNode(`${dbContext.database.id}/Scale`);
      await scaleNode.element.click();

      // Switch to Manual
      const manualRadio = explorer.frame.getByText("Manual", { exact: true });
      await manualRadio.click();

      // Save changes
      await explorer.commandBarButton(CommandBarButton.Save).click();

      // Verify success message
      await expect(explorer.getConsoleHeaderStatus()).toContainText(
        `Successfully updated offer for database ${dbContext.database.id}`,
        { timeout: 2 * ONE_MINUTE_MS },
      );
    });
  });
});
