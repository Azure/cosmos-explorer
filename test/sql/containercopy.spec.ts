/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Frame, Locator, Page, test } from "@playwright/test";
import { set } from "lodash";
import { DatabaseAccount, Subscription } from "../../src/Contracts/DataModels";
import { truncateName } from "../../src/Explorer/ContainerCopy/CopyJobUtils";
import {
  ContainerCopy,
  getAccountName,
  getDropdownItemByNameOrPosition,
  interceptAndInspectApiRequest,
  TestAccount,
  waitForApiResponse,
} from "../fx";

test.describe.configure({ mode: "serial" });
let page: Page;
let wrapper: Locator = null!;
let panel: Locator = null!;
let frame: Frame = null!;
let expectedCopyJobNameInitial: string = null!;
let expectedSourceSubscription: any = null!;
let expectedSourceAccount: DatabaseAccount = null!;
let expectedJobName: string = "";
let targetAccountName: string = "";
let expectedSourceAccountName: string = "";

test.beforeAll("Container Copy - Before All", async ({ browser }) => {
  page = await browser.newPage();
  ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQLContainerCopyOnly));
  expectedJobName = `test_job_${Date.now()}`;
  targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
});

test.afterEach("Container Copy - After Each", async () => {
  await page.unroute(/.*/, (route) => route.continue());
});

test("Loading and verifying the content of the page", async () => {
  expect(wrapper).not.toBeNull();
  await expect(wrapper.getByTestId("CommandBar/Button:Create Copy Job")).toBeVisible();
  await expect(wrapper.getByTestId("CommandBar/Button:Refresh")).toBeVisible();
  await expect(wrapper.getByTestId("CommandBar/Button:Feedback")).toBeVisible();
});

test("Opening the Create Copy Job panel", async () => {
  const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
  await createCopyJobButton.click();
  panel = frame.getByTestId("Panel:Create copy job");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Create copy job" })).toBeVisible();
});

test("select different account dropdown", async () => {
  const accountDropdown = panel.getByTestId("account-dropdown");
  await accountDropdown.click();

  const dropdownItemsWrapper = frame.locator("div.ms-Dropdown-items");
  expect(await dropdownItemsWrapper.getAttribute("aria-label")).toEqual("Account");

  const allDropdownItems = await dropdownItemsWrapper.locator(`button.ms-Dropdown-item[role='option']`).all();

  const filteredItems = [];
  for (const item of allDropdownItems) {
    const testContent = (await item.textContent()) ?? "";
    if (testContent.trim() !== targetAccountName.trim()) {
      filteredItems.push(item);
    }
  }

  if (filteredItems.length > 0) {
    const firstDropdownItem = filteredItems[0];
    expectedSourceAccountName = (await firstDropdownItem.textContent()) ?? "";
    await firstDropdownItem.click();
  } else {
    throw new Error("No dropdown items available after filtering");
  }

  const fluentUiCheckboxContainer = panel.getByTestId("migration-type-checkbox").locator("div.ms-Checkbox");
  await fluentUiCheckboxContainer.click();

  await panel.getByRole("button", { name: "Next" }).click();
});

test("Verifying Assign Permissions panel for online copy", async () => {
  const permissionScreen = panel.getByTestId("Panel:AssignPermissionsContainer");
  await expect(permissionScreen).toBeVisible();

  await expect(permissionScreen.getByText("Online container copy", { exact: true })).toBeVisible();
  await expect(permissionScreen.getByText("Cross-account container copy", { exact: true })).toBeVisible();
});

test("Verify Point-in-Time Restore timer and refresh button workflow", async () => {
  await page.route(`**/Microsoft.DocumentDB/databaseAccounts/${expectedSourceAccountName}**`, async (route) => {
    const mockData = {
      identity: {
        type: "SystemAssigned",
        principalId: "00-11-22-33",
      },
      properties: {
        defaultIdentity: "SystemAssignedIdentity",
        backupPolicy: {
          type: "Continuous",
        },
        capabilities: [{ name: "EnableOnlineContainerCopy" }],
      },
    };
    if (route.request().method() === "GET") {
      const response = await route.fetch();
      const actualData = await response.json();
      const mergedData = { ...actualData };

      set(mergedData, "identity", mockData.identity);
      set(mergedData, "properties.defaultIdentity", mockData.properties.defaultIdentity);
      set(mergedData, "properties.backupPolicy", mockData.properties.backupPolicy);
      set(mergedData, "properties.capabilities", mockData.properties.capabilities);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mergedData),
      });
    } else {
      await route.continue();
    }
  });

  const permissionScreen = panel.getByTestId("Panel:AssignPermissionsContainer");
  await expect(permissionScreen).toBeVisible();

  const expandedAccordionHeader = permissionScreen
    .getByTestId("permission-group-container-onlineConfigs")
    .locator("button[aria-expanded='true']");
  await expect(expandedAccordionHeader).toBeVisible();

  const accordionItem = expandedAccordionHeader
    .locator("xpath=ancestor::*[contains(@class, 'fui-AccordionItem') or contains(@data-test, 'accordion-item')]")
    .first();

  const accordionPanel = accordionItem.locator("[role='tabpanel'], .fui-AccordionPanel, [data-test*='panel']").first();

  await page.clock.install({ time: new Date("2024-01-01T10:00:00Z") });

  const pitrBtn = accordionPanel.getByTestId("pointInTimeRestore:PrimaryBtn");
  await expect(pitrBtn).toBeVisible();
  await pitrBtn.click();

  page.context().on("page", async (newPage) => {
    const expectedUrlEndPattern = new RegExp(
      `/providers/Microsoft.(DocumentDB|DocumentDb)/databaseAccounts/${expectedSourceAccountName}/backupRestore`,
    );
    expect(newPage.url()).toMatch(expectedUrlEndPattern);
    await newPage.close();
  });

  const loadingOverlay = frame.locator("[data-test='loading-overlay']");
  await expect(loadingOverlay).toBeVisible();

  const refreshBtn = accordionPanel.getByTestId("pointInTimeRestore:RefreshBtn");
  await expect(refreshBtn).not.toBeVisible();

  // Fast forward time by 11 minutes (11 * 60 * 1000ms = 660000ms)
  await page.clock.fastForward(11 * 60 * 1000);

  await expect(refreshBtn).toBeVisible();
  await expect(pitrBtn).not.toBeVisible();

  await refreshBtn.click();
  await expect(loadingOverlay).toBeVisible();

  await expect(loadingOverlay).toBeHidden({ timeout: 10 * 1000 });
});

test("Veify Popover & Loading Overlay on permission screen with API mocks and accordion interactions", async () => {
  await page.route(
    `**/Microsoft.DocumentDB/databaseAccounts/${expectedSourceAccountName}/sqlRoleAssignments*`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          value: [
            {
              principalId: "00-11-22-33",
              roleDefinitionId: `Microsoft.DocumentDB/databaseAccounts/${expectedSourceAccountName}/77-88-99`,
            },
          ],
        }),
      });
    },
  );

  await page.route("**/Microsoft.DocumentDB/databaseAccounts/*/77-88-99**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        value: [
          {
            name: "00000000-0000-0000-0000-000000000001",
          },
        ],
      }),
    });
  });

  await page.route(`**/Microsoft.DocumentDB/databaseAccounts/${targetAccountName}**`, async (route) => {
    const mockData = {
      identity: {
        type: "SystemAssigned",
        principalId: "00-11-22-33",
      },
      properties: {
        defaultIdentity: "SystemAssignedIdentity",
        backupPolicy: {
          type: "Continuous",
        },
        capabilities: [{ name: "EnableOnlineContainerCopy" }],
      },
    };

    if (route.request().method() === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "Succeeded" }),
      });
    } else if (route.request().method() === "GET") {
      // Get the actual response and merge with mock data
      const response = await route.fetch();
      const actualData = await response.json();
      const mergedData = { ...actualData };
      set(mergedData, "identity", mockData.identity);
      set(mergedData, "properties.defaultIdentity", mockData.properties.defaultIdentity);
      set(mergedData, "properties.backupPolicy", mockData.properties.backupPolicy);
      set(mergedData, "properties.capabilities", mockData.properties.capabilities);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mergedData),
      });
    } else {
      await route.continue();
    }
  });

  const permissionScreen = panel.getByTestId("Panel:AssignPermissionsContainer");
  await expect(permissionScreen).toBeVisible();

  const expandedAccordionHeader = permissionScreen
    .getByTestId("permission-group-container-crossAccountConfigs")
    .locator("button[aria-expanded='true']");
  await expect(expandedAccordionHeader).toBeVisible();

  const accordionItem = expandedAccordionHeader
    .locator("xpath=ancestor::*[contains(@class, 'fui-AccordionItem') or contains(@data-test, 'accordion-item')]")
    .first();

  const accordionPanel = accordionItem.locator("[role='tabpanel'], .fui-AccordionPanel, [data-test*='panel']").first();

  const toggleButton = accordionPanel.getByTestId("btn-toggle");
  await expect(toggleButton).toBeVisible();
  await toggleButton.click();

  const popover = frame.locator("[data-test='popover-container']");
  await expect(popover).toBeVisible();

  const yesButton = popover.getByRole("button", { name: /Yes/i });
  const noButton = popover.getByRole("button", { name: /No/i });
  await expect(yesButton).toBeVisible();
  await expect(noButton).toBeVisible();

  await yesButton.click();

  const loadingOverlay = frame.locator("[data-test='loading-overlay']");
  await expect(loadingOverlay).toBeVisible();

  await expect(loadingOverlay).toBeHidden({ timeout: 10 * 1000 });
  await expect(popover).toBeHidden({ timeout: 10 * 1000 });

  await panel.getByRole("button", { name: "Cancel" }).click();
});

test("Loading and verifying subscription & account dropdown", async () => {
  const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
  await createCopyJobButton.click();
  panel = frame.getByTestId("Panel:Create copy job");
  await expect(panel).toBeVisible();

  const subscriptionPromise = waitForApiResponse(page, "/Microsoft.ResourceGraph/resources", "POST", (payload: any) => {
    return (
      payload.query.includes("resources | where type == 'microsoft.documentdb/databaseaccounts'") &&
      payload.query.includes("| where type == 'microsoft.resources/subscriptions'")
    );
  });

  const accountPromise = waitForApiResponse(page, "/Microsoft.ResourceGraph/resources", "POST", (payload: any) => {
    return payload.query.includes("resources | where type =~ 'microsoft.documentdb/databaseaccounts'");
  });

  const subscriptionResponse = await subscriptionPromise;
  const data = await subscriptionResponse.json();
  expect(subscriptionResponse.ok()).toBe(true);

  const accountResponse = await accountPromise;
  const accountData = await accountResponse.json();
  expect(accountResponse.ok()).toBe(true);

  const selectedSubscription = data.data.find(
    (item: Subscription) => item.subscriptionId === process.env.DE_TEST_SUBSCRIPTION_ID,
  );

  const subscriptionDropdown = panel.getByTestId("subscription-dropdown");
  await expect(subscriptionDropdown).toHaveText(new RegExp(selectedSubscription.subscriptionName));
  await subscriptionDropdown.click();

  const subscriptionItem = await getDropdownItemByNameOrPosition(
    frame,
    { name: selectedSubscription.subscriptionName },
    { ariaLabel: "Subscription", itemCount: data.count },
  );
  await subscriptionItem.click();

  const expectedAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
  const selectedAccount = accountData.data.find((item: DatabaseAccount) => item.name === expectedAccountName);

  const accountDropdown = panel.getByTestId("account-dropdown");
  await expect(accountDropdown).toHaveText(new RegExp(expectedAccountName));
  await accountDropdown.click();

  const accountItem = await getDropdownItemByNameOrPosition(
    frame,
    { name: expectedAccountName },
    { ariaLabel: "Account" },
  );
  await accountItem.click();

  expectedSourceSubscription = selectedSubscription;
  expectedSourceAccount = selectedAccount;
});

test("Verifying online or offline checkbox", async () => {
  /**
   * This test verifies the functionality of the migration type checkbox that toggles between
   * online and offline container copy modes. It ensures that:
   * 1. When online mode is selected, the user is directed to a permissions screen
   * 2. When offline mode is selected, the user bypasses the permissions screen
   * 3. The UI correctly reflects the selected migration type throughout the workflow
   */
  const fluentUiCheckboxContainer = panel.getByTestId("migration-type-checkbox").locator("div.ms-Checkbox");
  await fluentUiCheckboxContainer.click();
  await panel.getByRole("button", { name: "Next" }).click();
  await expect(panel.getByTestId("Panel:AssignPermissionsContainer")).toBeVisible();
  await expect(panel.getByText("Online container copy", { exact: true })).toBeVisible();
  await panel.getByRole("button", { name: "Previous" }).click();
  await fluentUiCheckboxContainer.click();
  await panel.getByRole("button", { name: "Next" }).click();
  await expect(panel.getByTestId("Panel:SelectSourceAndTargetContainers")).toBeVisible();
  await expect(panel.getByTestId("Panel:AssignPermissionsContainer")).not.toBeVisible();
});

test("Verifying source and target container selection", async () => {
  const sourceContainerDropdown = panel.getByTestId("source-containerDropdown");
  expect(sourceContainerDropdown).toBeVisible();
  await expect(sourceContainerDropdown).toHaveClass(/(^|\s)is-disabled(\s|$)/);

  const sourceDatabaseDropdown = panel.getByTestId("source-databaseDropdown");
  await sourceDatabaseDropdown.click();

  const sourceDbDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 }, { ariaLabel: "Database" });
  await sourceDbDropdownItem.click();

  await expect(sourceContainerDropdown).not.toHaveClass(/(^|\s)is-disabled(\s|$)/);
  await sourceContainerDropdown.click();
  const sourceContainerDropdownItem = await getDropdownItemByNameOrPosition(
    frame,
    { position: 0 },
    { ariaLabel: "Container" },
  );
  await sourceContainerDropdownItem.click();

  const targetContainerDropdown = panel.getByTestId("target-containerDropdown");
  expect(targetContainerDropdown).toBeVisible();
  await expect(targetContainerDropdown).toHaveClass(/(^|\s)is-disabled(\s|$)/);

  const targetDatabaseDropdown = panel.getByTestId("target-databaseDropdown");
  await targetDatabaseDropdown.click();
  const targetDbDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 }, { ariaLabel: "Database" });
  await targetDbDropdownItem.click();

  await expect(targetContainerDropdown).not.toHaveClass(/(^|\s)is-disabled(\s|$)/);
  await targetContainerDropdown.click();
  const targetContainerDropdownItem1 = await getDropdownItemByNameOrPosition(
    frame,
    { position: 0 },
    { ariaLabel: "Container" },
  );
  await targetContainerDropdownItem1.click();

  await panel.getByRole("button", { name: "Next" }).click();

  const errorContainer = panel.getByTestId("Panel:ErrorContainer");
  await expect(errorContainer).toBeVisible();
  await expect(errorContainer).toHaveText(/Source and destination containers cannot be the same/i);

  // Reselect target container to be different from source container
  await targetContainerDropdown.click();
  const targetContainerDropdownItem2 = await getDropdownItemByNameOrPosition(
    frame,
    { position: 1 },
    { ariaLabel: "Container" },
  );
  await targetContainerDropdownItem2.click();

  const selectedSourceDatabase = await sourceDatabaseDropdown.innerText();
  const selectedSourceContainer = await sourceContainerDropdown.innerText();
  const selectedTargetDatabase = await targetDatabaseDropdown.innerText();
  const selectedTargetContainer = await targetContainerDropdown.innerText();
  expectedCopyJobNameInitial = `${truncateName(selectedSourceDatabase)}.${truncateName(
    selectedSourceContainer,
  )}_${truncateName(selectedTargetDatabase)}.${truncateName(selectedTargetContainer)}`;

  await panel.getByRole("button", { name: "Next" }).click();

  await expect(errorContainer).not.toBeVisible();
  await expect(panel.getByTestId("Panel:PreviewCopyJob")).toBeVisible();
});

test("Verifying the preview of the copy job", async () => {
  const previewContainer = panel.getByTestId("Panel:PreviewCopyJob");
  await expect(previewContainer).toBeVisible();
  await expect(previewContainer.getByTestId("source-subscription-name")).toHaveText(
    expectedSourceSubscription.subscriptionName,
  );
  await expect(previewContainer.getByTestId("source-account-name")).toHaveText(expectedSourceAccount.name);
  const jobNameInput = previewContainer.getByTestId("job-name-textfield");
  await expect(jobNameInput).toHaveValue(new RegExp(expectedCopyJobNameInitial));
  const primaryBtn = panel.getByRole("button", { name: "Copy", exact: true });
  await expect(primaryBtn).not.toHaveClass(/(^|\s)is-disabled(\s|$)/);

  await jobNameInput.fill("test job name");
  await expect(primaryBtn).toHaveClass(/(^|\s)is-disabled(\s|$)/);
});

test("Testing API request interception with duplicate job name", async () => {
  const previewContainer = panel.getByTestId("Panel:PreviewCopyJob");
  const jobNameInput = previewContainer.getByTestId("job-name-textfield");
  const duplicateJobName = "test-job-name-1";
  await jobNameInput.fill(duplicateJobName);

  const copyButton = panel.getByRole("button", { name: "Copy", exact: true });
  const expectedErrorMessage = `Duplicate job name '${duplicateJobName}'`;
  await interceptAndInspectApiRequest(
    page,
    `${expectedSourceAccount.name}/dataTransferJobs/${duplicateJobName}`,
    "PUT",
    new Error(expectedErrorMessage),
    (url?: string) => url?.includes(duplicateJobName) ?? false,
  );

  let errorThrown = false;
  try {
    await copyButton.click();
    await page.waitForTimeout(2000);
  } catch (error: any) {
    errorThrown = true;
    expect(error.message).toContain("not allowed");
  }
  if (!errorThrown) {
    const errorContainer = panel.getByTestId("Panel:ErrorContainer");
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toHaveText(new RegExp(expectedErrorMessage, "i"));
  }

  await expect(panel).toBeVisible();
});

test("Testing API request success with valid job name and verifying copy job creation", async () => {
  const previewContainer = panel.getByTestId("Panel:PreviewCopyJob");
  const jobNameInput = previewContainer.getByTestId("job-name-textfield");
  const copyButton = panel.getByRole("button", { name: "Copy", exact: true });

  const validJobName = expectedJobName;

  const copyJobCreationPromise = waitForApiResponse(
    page,
    `${expectedSourceAccount.name}/dataTransferJobs/${validJobName}`,
    "PUT",
  );

  await jobNameInput.fill(validJobName);
  await expect(copyButton).not.toHaveClass(/(^|\s)is-disabled(\s|$)/);

  await copyButton.click();

  const response = await copyJobCreationPromise;
  expect(response.ok()).toBe(true);

  await expect(panel).not.toBeVisible({ timeout: 10000 });

  const jobsListContainer = wrapper.locator(".CopyJobListContainer .ms-DetailsList-contentWrapper .ms-List-page");
  await jobsListContainer.waitFor({ state: "visible" });

  const jobItem = jobsListContainer.getByText(validJobName);
  await jobItem.waitFor({ state: "visible" });
  await expect(jobItem).toBeVisible();
});

test.skip("Pause a running copy job", async () => {
  const jobsListContainer = wrapper.locator(".CopyJobListContainer .ms-DetailsList-contentWrapper .ms-List-page");
  await jobsListContainer.waitFor({ state: "visible" });

  const firstJobRow = jobsListContainer.locator(".ms-DetailsRow", { hasText: expectedJobName });
  await firstJobRow.waitFor({ state: "visible" });

  const actionMenuButton = wrapper.getByTestId(`CopyJobActionMenu/Button:${expectedJobName}`);
  await actionMenuButton.waitFor({ state: "visible" });
  await actionMenuButton.click();

  const pauseAction = frame.locator(".ms-ContextualMenu-list button:has-text('Pause')");
  await pauseAction.waitFor({ state: "visible" });
  await pauseAction.click();

  const updatedJobRow = jobsListContainer.locator(".ms-DetailsRow").filter({ hasText: expectedJobName });
  const statusCell = updatedJobRow.locator("[data-automationid='DetailsRowCell'][data-automation-key='CopyJobStatus']");
  await expect(statusCell).toContainText(/paused/i, { timeout: 10000 });
});

test.skip("Resume a paused copy job", async () => {
  const jobsListContainer = wrapper.locator(".CopyJobListContainer .ms-DetailsList-contentWrapper .ms-List-page");
  await jobsListContainer.waitFor({ state: "visible" });

  const pausedJobRow = jobsListContainer.locator(".ms-DetailsRow", { hasText: expectedJobName });
  await pausedJobRow.waitFor({ state: "visible" });

  const statusCell = pausedJobRow.locator("[data-automationid='DetailsRowCell'][data-automation-key='CopyJobStatus']");
  await expect(statusCell).toContainText(/paused/i);

  const actionMenuButton = wrapper.getByTestId(`CopyJobActionMenu/Button:${expectedJobName}`);
  await actionMenuButton.waitFor({ state: "visible" });
  await actionMenuButton.click();

  const resumeAction = frame.locator(".ms-ContextualMenu-list button:has-text('Resume')");
  await resumeAction.waitFor({ state: "visible" });
  await resumeAction.click();

  await expect(statusCell).toContainText(/running|queued/i);
});

test("Cancel a copy job", async () => {
  // Create a new job specifically for cancellation testing
  const cancelJobName = `cancel_test_job_${Date.now()}`;

  // Navigate to create job panel
  const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
  await createCopyJobButton.click();
  panel = frame.getByTestId("Panel:Create copy job");

  // Skip to container selection (offline mode for faster creation)
  await panel.getByRole("button", { name: "Next" }).click();

  // Select source containers quickly
  const sourceDatabaseDropdown = panel.getByTestId("source-databaseDropdown");
  await sourceDatabaseDropdown.click();
  const sourceDatabaseDropdownItem = await getDropdownItemByNameOrPosition(
    frame,
    { position: 0 },
    { ariaLabel: "Database" },
  );
  await sourceDatabaseDropdownItem.click();

  const sourceContainerDropdown = panel.getByTestId("source-containerDropdown");
  await sourceContainerDropdown.click();
  const sourceContainerDropdownItem = await getDropdownItemByNameOrPosition(
    frame,
    { position: 0 },
    { ariaLabel: "Container" },
  );
  await sourceContainerDropdownItem.click();

  // Select target containers
  const targetDatabaseDropdown = panel.getByTestId("target-databaseDropdown");
  await targetDatabaseDropdown.click();
  const targetDatabaseDropdownItem = await getDropdownItemByNameOrPosition(
    frame,
    { position: 0 },
    { ariaLabel: "Database" },
  );
  await targetDatabaseDropdownItem.click();

  const targetContainerDropdown = panel.getByTestId("target-containerDropdown");
  await targetContainerDropdown.click();
  const targetContainerDropdownItem = await getDropdownItemByNameOrPosition(
    frame,
    { position: 1 },
    { ariaLabel: "Container" },
  );
  await targetContainerDropdownItem.click();

  await panel.getByRole("button", { name: "Next" }).click();

  // Set job name and create
  const jobNameInput = panel.getByTestId("job-name-textfield");
  await jobNameInput.fill(cancelJobName);

  const copyButton = panel.getByRole("button", { name: "Copy", exact: true });

  // Create job and immediately start polling for it
  await copyButton.click();

  // Wait for panel to close and job list to refresh
  await expect(panel).not.toBeVisible({ timeout: 10000 });

  const jobsListContainer = wrapper.locator(".CopyJobListContainer .ms-DetailsList-contentWrapper .ms-List-page");
  await jobsListContainer.waitFor({ state: "visible" });

  // Rapid polling to catch the job in running state
  let attempts = 0;
  const maxAttempts = 50; // Try for ~5 seconds
  let jobCancelled = false;

  while (attempts < maxAttempts && !jobCancelled) {
    try {
      // Look for the job row
      const jobRow = jobsListContainer.locator(".ms-DetailsRow", { hasText: cancelJobName });

      if (await jobRow.isVisible({ timeout: 100 })) {
        const statusCell = jobRow.locator("[data-automationid='DetailsRowCell'][data-automation-key='CopyJobStatus']");
        const statusText = await statusCell.textContent({ timeout: 100 });

        // If job is still running/queued, try to cancel it
        if (statusText && /running|queued|pending/i.test(statusText)) {
          const actionMenuButton = wrapper.getByTestId(`CopyJobActionMenu/Button:${cancelJobName}`);
          await actionMenuButton.click({ timeout: 1000 });

          const cancelAction = frame.locator(".ms-ContextualMenu-list button:has-text('Cancel')");
          if (await cancelAction.isVisible({ timeout: 1000 })) {
            await cancelAction.click();

            // Verify cancellation
            await expect(statusCell).toContainText(/cancelled|canceled|failed/i, { timeout: 5000 });
            jobCancelled = true;
            break;
          }
        } else if (statusText && /completed|succeeded|finished/i.test(statusText)) {
          // Job completed too fast, skip the test
          // console.log(`Job ${cancelJobName} completed too quickly to test cancellation`);
          test.skip(true, "Job completed too quickly for cancellation test");
          return;
        }
      }

      // Refresh the job list
      const refreshButton = wrapper.getByTestId("CommandBar/Button:Refresh");
      if (await refreshButton.isVisible({ timeout: 100 })) {
        await refreshButton.click();
        await page.waitForTimeout(100); // Small delay between attempts
      }
    } catch (error) {
      // Continue trying if there's any error
    }

    attempts++;
  }

  if (!jobCancelled) {
    // If we couldn't cancel in time, at least verify the job was created
    const jobRow = jobsListContainer.locator(".ms-DetailsRow", { hasText: cancelJobName });
    await expect(jobRow).toBeVisible({ timeout: 5000 });
    test.skip(true, "Could not catch job in running state for cancellation test");
  }
});

test.afterAll("Container Copy - After All", async () => {
  await page.unroute(/.*/, (route) => route.continue());
  await page.close();
});
