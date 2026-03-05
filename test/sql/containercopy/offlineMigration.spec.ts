/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Frame, Locator, Page, test } from "@playwright/test";
import { truncateName } from "../../../src/Explorer/ContainerCopy/CopyJobUtils";
import {
  ContainerCopy,
  getAccountName,
  getDropdownItemByNameOrPosition,
  interceptAndInspectApiRequest,
  TestAccount,
  waitForApiResponse,
} from "../../fx";
import { createMultipleTestContainers, TestContainerContext } from "../../testData";

test.describe("Container Copy - Offline Migration", () => {
  let contexts: TestContainerContext[];
  let page: Page;
  let wrapper: Locator;
  let panel: Locator;
  let frame: Frame;
  let expectedJobName: string;
  let targetAccountName: string;
  let expectedSubscriptionName: string;
  let expectedCopyJobNameInitial: string;

  test.beforeEach("Setup for offline migration test", async ({ browser }) => {
    contexts = await createMultipleTestContainers({ accountType: TestAccount.SQLContainerCopyOnly, containerCount: 2 });

    page = await browser.newPage();
    ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQLContainerCopyOnly));
    expectedJobName = `offline_test_job_${Date.now()}`;
    targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
  });

  test.afterEach("Cleanup after offline migration test", async () => {
    await page.unroute(/.*/, (route) => route.continue());
    await page.close();
    await Promise.all(contexts.map((context) => context?.dispose()));
  });

  test("Successfully create and manage offline migration copy job", async () => {
    expect(wrapper).not.toBeNull();
    await wrapper.locator(".commandBarContainer").waitFor({ state: "visible" });

    // Open Create Copy Job panel
    const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
    await expect(createCopyJobButton).toBeVisible();
    await createCopyJobButton.click();
    panel = frame.getByTestId("Panel:Create copy job");
    await expect(panel).toBeVisible();

    // Reduced wait time for better performance
    await page.waitForTimeout(2000);

    // Setup subscription and account
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

    // Select account
    const accountDropdown = panel.getByTestId("account-dropdown");
    await expect(accountDropdown).toHaveText(new RegExp(expectedAccountName));
    await accountDropdown.click();

    const accountItem = await getDropdownItemByNameOrPosition(
      frame,
      { name: expectedAccountName },
      { ariaLabel: "Account" },
    );
    await accountItem.click();

    // Test offline migration mode toggle functionality
    const migrationTypeContainer = panel.getByTestId("migration-type");

    // First test online mode (should show permissions screen)
    const onlineCopyRadioButton = migrationTypeContainer.getByRole("radio", { name: /Online mode/i });
    await onlineCopyRadioButton.click({ force: true });
    await expect(migrationTypeContainer.getByTestId("migration-type-description-online")).toBeVisible();

    await panel.getByRole("button", { name: "Next" }).click();
    await expect(panel.getByTestId("Panel:AssignPermissionsContainer")).toBeVisible();
    await expect(panel.getByText("Online container copy", { exact: true })).toBeVisible();

    // Go back and switch to offline mode
    await panel.getByRole("button", { name: "Previous" }).click();

    const offlineCopyRadioButton = migrationTypeContainer.getByRole("radio", { name: /Offline mode/i });
    await offlineCopyRadioButton.click({ force: true });
    await expect(migrationTypeContainer.getByTestId("migration-type-description-offline")).toBeVisible();

    await panel.getByRole("button", { name: "Next" }).click();

    // Verify we skip permissions screen in offline mode
    await expect(panel.getByTestId("Panel:SelectSourceAndTargetContainers")).toBeVisible();
    await expect(panel.getByTestId("Panel:AssignPermissionsContainer")).not.toBeVisible();

    // Test source and target container selection with validation
    const sourceContainerDropdown = panel.getByTestId("source-containerDropdown");
    expect(sourceContainerDropdown).toBeVisible();
    await expect(sourceContainerDropdown).toHaveClass(/(^|\s)is-disabled(\s|$)/);

    // Select source database first (containers are disabled until database is selected)
    const sourceDatabaseDropdown = panel.getByTestId("source-databaseDropdown");
    await sourceDatabaseDropdown.click();
    const sourceDbDropdownItem = await getDropdownItemByNameOrPosition(
      frame,
      { position: 0 },
      { ariaLabel: "Database" },
    );
    await sourceDbDropdownItem.click();

    // Now container dropdown should be enabled
    await expect(sourceContainerDropdown).not.toHaveClass(/(^|\s)is-disabled(\s|$)/);
    await sourceContainerDropdown.click();
    const sourceContainerDropdownItem = await getDropdownItemByNameOrPosition(
      frame,
      { position: 0 },
      { ariaLabel: "Container" },
    );
    await sourceContainerDropdownItem.click();

    // Test target container selection
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

    // First try selecting the same container (should show error)
    const targetContainerDropdownItem1 = await getDropdownItemByNameOrPosition(
      frame,
      { position: 0 },
      { ariaLabel: "Container" },
    );
    await targetContainerDropdownItem1.click();

    await panel.getByRole("button", { name: "Next" }).click();

    // Verify validation error for same source and target containers
    const errorContainer = panel.getByTestId("Panel:ErrorContainer");
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toHaveText(/Source and destination containers cannot be the same/i);

    // Select different target container
    await targetContainerDropdown.click();
    const targetContainerDropdownItem2 = await getDropdownItemByNameOrPosition(
      frame,
      { position: 1 },
      { ariaLabel: "Container" },
    );
    await targetContainerDropdownItem2.click();

    // Generate expected job name based on selections
    const selectedSourceDatabase = await sourceDatabaseDropdown.innerText();
    const selectedSourceContainer = await sourceContainerDropdown.innerText();
    const selectedTargetDatabase = await targetDatabaseDropdown.innerText();
    const selectedTargetContainer = await targetContainerDropdown.innerText();
    expectedCopyJobNameInitial = `${truncateName(selectedSourceDatabase)}.${truncateName(
      selectedSourceContainer,
    )}_${truncateName(selectedTargetDatabase)}.${truncateName(selectedTargetContainer)}`;

    await panel.getByRole("button", { name: "Next" }).click();

    // Error should disappear and preview should be visible
    await expect(errorContainer).not.toBeVisible();
    await expect(panel.getByTestId("Panel:PreviewCopyJob")).toBeVisible();

    // Verify job preview details
    const previewContainer = panel.getByTestId("Panel:PreviewCopyJob");
    await expect(previewContainer).toBeVisible();
    await expect(previewContainer.getByTestId("source-subscription-name")).toHaveText(expectedSubscriptionName);
    await expect(previewContainer.getByTestId("source-account-name")).toHaveText(expectedAccountName);

    const jobNameInput = previewContainer.getByTestId("job-name-textfield");
    await expect(jobNameInput).toHaveValue(new RegExp(expectedCopyJobNameInitial));

    const primaryBtn = panel.getByRole("button", { name: "Copy", exact: true });
    await expect(primaryBtn).not.toHaveClass(/(^|\s)is-disabled(\s|$)/);

    // Test invalid job name validation (spaces not allowed)
    await jobNameInput.fill("test job name");
    await expect(primaryBtn).toHaveClass(/(^|\s)is-disabled(\s|$)/);

    // Test duplicate job name error handling
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

    // Test successful job creation with valid job name
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

    // Verify panel closes and job appears in the list
    await expect(panel).not.toBeVisible();

    const filterTextField = wrapper.getByTestId("CopyJobsList/FilterTextField");
    await filterTextField.waitFor({ state: "visible" });
    await filterTextField.fill(validJobName);

    const jobsListContainer = wrapper.locator(".CopyJobListContainer .ms-DetailsList-contentWrapper .ms-List-page");
    await jobsListContainer.waitFor({ state: "visible" });

    const jobItem = jobsListContainer.getByText(validJobName);
    await jobItem.waitFor({ state: "visible" });
    await expect(jobItem).toBeVisible();
  });
});
