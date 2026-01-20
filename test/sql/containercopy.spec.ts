/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Frame, Locator, Page, test } from "@playwright/test";
import { set } from "lodash";
import { truncateName } from "../../src/Explorer/ContainerCopy/CopyJobUtils";
import {
  ContainerCopy,
  getAccountName,
  getDropdownItemByNameOrPosition,
  interceptAndInspectApiRequest,
  TestAccount,
  waitForApiResponse,
} from "../fx";
import { createMultipleTestContainers } from "../testData";

let page: Page;
let wrapper: Locator = null!;
let panel: Locator = null!;
let frame: Frame = null!;
let expectedCopyJobNameInitial: string = null!;
let expectedJobName: string = "";
let targetAccountName: string = "";
let expectedSourceAccountName: string = "";
let expectedSubscriptionName: string = "";
const VISIBLE_TIMEOUT_MS = 30 * 1000;

test.describe.configure({ mode: "serial" });

test.describe("Container Copy", () => {
  test.beforeAll("Container Copy - Before All", async ({ browser }) => {
    await createMultipleTestContainers({ accountType: TestAccount.SQLContainerCopyOnly, containerCount: 3 });

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
    await expect(wrapper.getByTestId("CommandBar/Button:Create Copy Job")).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });
    await expect(wrapper.getByTestId("CommandBar/Button:Refresh")).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });
    await expect(wrapper.getByTestId("CommandBar/Button:Feedback")).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });
  });

  test("Successfully create a copy job for offline migration", async () => {
    expect(wrapper).not.toBeNull();
    // Loading and verifying subscription & account dropdown

    const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
    await createCopyJobButton.click();
    panel = frame.getByTestId("Panel:Create copy job");
    await expect(panel).toBeVisible();

    await page.waitForTimeout(10 * 1000);

    const subscriptionDropdown = panel.getByTestId("subscription-dropdown");

    const expectedAccountName = targetAccountName;
    expectedSubscriptionName = await subscriptionDropdown.locator("span.ms-Dropdown-title").innerText();

    await subscriptionDropdown.click();
    const subscriptionItem = await getDropdownItemByNameOrPosition(
      frame,
      { name: expectedSubscriptionName },
      { ariaLabel: "Subscription" },
    );
    await subscriptionItem.click();

    // Load account dropdown based on selected subscription

    const accountDropdown = panel.getByTestId("account-dropdown");
    await expect(accountDropdown).toHaveText(new RegExp(expectedAccountName));
    await accountDropdown.click();

    const accountItem = await getDropdownItemByNameOrPosition(
      frame,
      { name: expectedAccountName },
      { ariaLabel: "Account" },
    );
    await accountItem.click();

    // Verifying online or offline migration functionality
    /**
     * This test verifies the functionality of the migration type radio that toggles between
     * online and offline container copy modes. It ensures that:
     * 1. When online mode is selected, the user is directed to a permissions screen
     * 2. When offline mode is selected, the user bypasses the permissions screen
     * 3. The UI correctly reflects the selected migration type throughout the workflow
     */
    const migrationTypeContainer = panel.getByTestId("migration-type");
    const onlineCopyRadioButton = migrationTypeContainer.getByRole("radio", { name: /Online mode/i });
    await onlineCopyRadioButton.click({ force: true });

    await expect(migrationTypeContainer.getByTestId("migration-type-description-online")).toBeVisible();

    await panel.getByRole("button", { name: "Next" }).click();

    await expect(panel.getByTestId("Panel:AssignPermissionsContainer")).toBeVisible();
    await expect(panel.getByText("Online container copy", { exact: true })).toBeVisible();
    await panel.getByRole("button", { name: "Previous" }).click();

    const offlineCopyRadioButton = migrationTypeContainer.getByRole("radio", { name: /Offline mode/i });
    await offlineCopyRadioButton.click({ force: true });

    await expect(migrationTypeContainer.getByTestId("migration-type-description-offline")).toBeVisible();

    await panel.getByRole("button", { name: "Next" }).click();

    await expect(panel.getByTestId("Panel:SelectSourceAndTargetContainers")).toBeVisible();
    await expect(panel.getByTestId("Panel:AssignPermissionsContainer")).not.toBeVisible();

    // Verifying source and target container selection

    const sourceContainerDropdown = panel.getByTestId("source-containerDropdown");
    expect(sourceContainerDropdown).toBeVisible();
    await expect(sourceContainerDropdown).toHaveClass(/(^|\s)is-disabled(\s|$)/);

    const sourceDatabaseDropdown = panel.getByTestId("source-databaseDropdown");
    await sourceDatabaseDropdown.click();

    const sourceDbDropdownItem = await getDropdownItemByNameOrPosition(
      frame,
      { position: 0 },
      { ariaLabel: "Database" },
    );
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
    const targetDbDropdownItem = await getDropdownItemByNameOrPosition(
      frame,
      { position: 0 },
      { ariaLabel: "Database" },
    );
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

    // Verifying the preview of the copy job
    const previewContainer = panel.getByTestId("Panel:PreviewCopyJob");
    await expect(previewContainer).toBeVisible();
    await expect(previewContainer.getByTestId("source-subscription-name")).toHaveText(expectedSubscriptionName);
    await expect(previewContainer.getByTestId("source-account-name")).toHaveText(expectedAccountName);
    const jobNameInput = previewContainer.getByTestId("job-name-textfield");
    await expect(jobNameInput).toHaveValue(new RegExp(expectedCopyJobNameInitial));
    const primaryBtn = panel.getByRole("button", { name: "Copy", exact: true });
    await expect(primaryBtn).not.toHaveClass(/(^|\s)is-disabled(\s|$)/);

    await jobNameInput.fill("test job name");
    await expect(primaryBtn).toHaveClass(/(^|\s)is-disabled(\s|$)/);

    // Testing API request interception with duplicate job name
    const duplicateJobName = "test-job-name-1";
    await jobNameInput.fill(duplicateJobName);

    const copyButton = panel.getByRole("button", { name: "Copy", exact: true });
    const expectedErrorMessage = `Duplicate job name '${duplicateJobName}'`;
    await interceptAndInspectApiRequest(
      page,
      `${expectedAccountName}/dataTransferJobs/${duplicateJobName}`,
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

    // Testing API request success with valid job name and verifying copy job creation

    const validJobName = expectedJobName;

    const copyJobCreationPromise = waitForApiResponse(
      page,
      `${expectedAccountName}/dataTransferJobs/${validJobName}`,
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

  test("Verify Online or Offline Container Copy Permissions Panel", async () => {
    expect(wrapper).not.toBeNull();

    // Opening the Create Copy Job panel again to verify initial state
    const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
    await createCopyJobButton.click();
    panel = frame.getByTestId("Panel:Create copy job");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Create copy job" })).toBeVisible();

    // select different account dropdown

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

    const migrationTypeContainer = panel.getByTestId("migration-type");
    const onlineCopyRadioButton = migrationTypeContainer.getByRole("radio", { name: /Online mode/i });
    await onlineCopyRadioButton.click({ force: true });

    await panel.getByRole("button", { name: "Next" }).click();

    // Verifying Assign Permissions panel for online copy

    const permissionScreen = panel.getByTestId("Panel:AssignPermissionsContainer");
    await expect(permissionScreen).toBeVisible();

    await expect(permissionScreen.getByText("Online container copy", { exact: true })).toBeVisible();
    await expect(permissionScreen.getByText("Cross-account container copy", { exact: true })).toBeVisible();

    // Verify Point-in-Time Restore timer and refresh button workflow

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

    await expect(permissionScreen).toBeVisible();

    const expandedOnlineAccordionHeader = permissionScreen
      .getByTestId("permission-group-container-onlineConfigs")
      .locator("button[aria-expanded='true']");
    await expect(expandedOnlineAccordionHeader).toBeVisible();

    const accordionItem = expandedOnlineAccordionHeader
      .locator("xpath=ancestor::*[contains(@class, 'fui-AccordionItem') or contains(@data-test, 'accordion-item')]")
      .first();

    const accordionPanel = accordionItem
      .locator("[role='tabpanel'], .fui-AccordionPanel, [data-test*='panel']")
      .first();

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

    // Veify Popover & Loading Overlay on permission screen with API mocks and accordion interactions

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

    await expect(permissionScreen).toBeVisible();

    const expandedCrossAccordionHeader = permissionScreen
      .getByTestId("permission-group-container-crossAccountConfigs")
      .locator("button[aria-expanded='true']");
    await expect(expandedCrossAccordionHeader).toBeVisible();

    const crossAccordionItem = expandedCrossAccordionHeader
      .locator("xpath=ancestor::*[contains(@class, 'fui-AccordionItem') or contains(@data-test, 'accordion-item')]")
      .first();

    const crossAccordionPanel = crossAccordionItem
      .locator("[role='tabpanel'], .fui-AccordionPanel, [data-test*='panel']")
      .first();

    const toggleButton = crossAccordionPanel.getByTestId("btn-toggle");
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    const popover = frame.locator("[data-test='popover-container']");
    await expect(popover).toBeVisible();

    const yesButton = popover.getByRole("button", { name: /Yes/i });
    const noButton = popover.getByRole("button", { name: /No/i });
    await expect(yesButton).toBeVisible();
    await expect(noButton).toBeVisible();

    await yesButton.click();

    await expect(loadingOverlay).toBeVisible();

    await expect(loadingOverlay).toBeHidden({ timeout: 10 * 1000 });
    await expect(popover).toBeHidden({ timeout: 10 * 1000 });

    await panel.getByRole("button", { name: "Cancel" }).click();
  });

  test.afterAll("Container Copy - After All", async () => {
    await page.unroute(/.*/, (route) => route.continue());
    await page.close();
  });
});
