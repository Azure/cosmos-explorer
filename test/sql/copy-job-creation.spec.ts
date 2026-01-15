/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Frame, Locator, Page, test } from "@playwright/test";
import {
  ContainerCopy,
  getAccountName,
  getDropdownItemByNameOrPosition,
  TestAccount,
  waitForApiResponse
} from "../fx";
import { createMultipleTestContainers } from "../testData";

let page: Page;
let wrapper: Locator = null!;
let panel: Locator = null!;
let frame: Frame = null!;
let targetAccountName: string = "";
let expectedJobName: string = "";
const VISIBLE_TIMEOUT_MS = 30 * 1000;

test.describe.configure({ mode: "serial" });

test.describe("Copy Job Creation - Happy Path (Scenario 1)", () => {
  test.beforeAll("Copy Job Creation - Before All", async ({ browser }) => {
    await createMultipleTestContainers({ accountType: TestAccount.SQLContainerCopyOnly, containerCount: 3 });

    page = await browser.newPage();
    ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQLContainerCopyOnly));
    expectedJobName = `test_job_${Date.now()}`;
    targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
  });

  test.afterAll("Copy Job Creation - After All", async () => {
    await page.unroute(/.*/, (route) => route.continue());
    await page.close();
  });

  test.afterEach("Copy Job Creation - After Each", async () => {
    await page.unroute(/.*/, (route) => route.continue());
  });

  test("1.1. Create Offline Copy Job Successfully", async () => {
    // Step 1: Wait for the copy job screen to load
    await expect(wrapper.getByTestId("CommandBar/Button:Create Copy Job")).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 2: Click 'Create Copy Job' button
    await wrapper.getByTestId("CommandBar/Button:Create Copy Job").click();

    // Step 3: Verify side panel opens
    panel = frame.getByTestId("Panel:Create copy job");
    await expect(panel).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 4: Verify panel header contains 'Create copy job' text
    await expect(panel.getByText("Create copy job")).toBeVisible();

    // Step 5: Wait for subscription dropdown to populate
    const subscriptionDropdown = panel.getByTestId("subscription-dropdown");
    await expect(subscriptionDropdown).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });
    await subscriptionDropdown.waitFor({ state: "visible" });

    // Step 6: Wait for account dropdown to populate
    const accountDropdown = panel.getByTestId("account-dropdown");
    await expect(accountDropdown).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });
    await accountDropdown.waitFor({ state: "visible" });

    // Step 7: Verify 'Offline mode' radio button is enabled and selected by default
    const offlineModeRadio = panel.getByRole("radio", { name: /offline/i });
    await expect(offlineModeRadio).toBeVisible();
    await expect(offlineModeRadio).toBeEnabled();
    await expect(offlineModeRadio).toBeChecked();

    // Step 8: Verify offline mode description is visible
    const offlineModeDescription = panel.getByTestId("migration-type-description-offline");
    await expect(offlineModeDescription).toBeVisible();

    // Step 9: Click 'Next' button to proceed to container selection
    const nextButton = panel.getByRole("button", { name: /next/i });
    await nextButton.click();

    // Step 10: Verify SelectSourceAndTargetContainers panel is visible
    const containerSelectionPanel = frame.getByTestId("Panel:SelectSourceAndTargetContainers");
    await expect(containerSelectionPanel).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 11: Select first option from source database dropdown
    const sourceDatabaseDropdown = containerSelectionPanel.getByTestId("source-databaseDropdown");
    await expect(sourceDatabaseDropdown).toBeVisible();
    await sourceDatabaseDropdown.click();
    const sourceDatabaseDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 });
    await sourceDatabaseDropdownItem.click();

    // Step 12: Select first option from source container dropdown
    const sourceContainerDropdown = containerSelectionPanel.getByTestId("source-containerDropdown");
    await expect(sourceContainerDropdown).toBeVisible();
    await sourceContainerDropdown.click();
    const sourceContainerDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 });
    await sourceContainerDropdownItem.click();

    // Step 13: Select first option from target database dropdown
    const targetDatabaseDropdown = containerSelectionPanel.getByTestId("target-databaseDropdown");
    await expect(targetDatabaseDropdown).toBeVisible();
    await targetDatabaseDropdown.click();
    const targetDatabaseDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 });
    await targetDatabaseDropdownItem.click();
    
    // Step 14: Select first option from target container dropdown
    const targetContainerDropdown = containerSelectionPanel.getByTestId("target-containerDropdown");
    await expect(targetContainerDropdown).toBeVisible();
    await targetContainerDropdown.click();
    const targetContainerDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 });
    await targetContainerDropdownItem.click();

    // Step 15: Verify error message appears for same source and target selection
    const errorContainer = containerSelectionPanel.getByTestId("Panel:ErrorContainer");
    await expect(errorContainer).toBeVisible({ timeout: 5000 });
    await expect(errorContainer).toContainText(/source.*target.*identical|same/i);

    // Step 16: Select second option from target container dropdown to resolve error
    await targetContainerDropdown.click();
    const targetContainerDropdownItemSecond = await getDropdownItemByNameOrPosition(frame, { position: 1 });
    await targetContainerDropdownItemSecond.click();

    // Verify error message disappears
    await expect(errorContainer).not.toBeVisible({ timeout: 5000 });

    // Step 17: Click 'Next' button to proceed to preview
    const nextButtonContainer = containerSelectionPanel.getByRole("button", { name: /next/i });
    await expect(nextButtonContainer).toBeEnabled();
    await nextButtonContainer.click();

    // Step 18: Verify preview page displays selected details
    const previewPanel = frame.locator("[data-testid*='preview'], [data-testid*='Preview']").first();
    await expect(previewPanel).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Verify preview displays source and target information
    await expect(previewPanel.getByText(/source/i)).toBeVisible();
    await expect(previewPanel.getByText(/target/i)).toBeVisible();
    await expect(previewPanel.getByText(targetAccountName)).toBeVisible();

    // Step 19: Enter valid job name
    const jobNameInput = previewPanel.getByRole("textbox").or(previewPanel.getByTestId("job-name-input"));
    await expect(jobNameInput).toBeVisible();
    await jobNameInput.fill(expectedJobName);

    // Step 20: Click 'Submit' button to create copy job
    const submitButton = previewPanel.getByRole("button", { name: /submit/i });
    await expect(submitButton).toBeEnabled();

    // Set up API response interception
    const apiResponsePromise = waitForApiResponse(
      page,
      `${targetAccountName}/dataTransferJobs/${expectedJobName}`,
      "PUT"
    );
    await submitButton.click();

    // Step 21: Wait for API response indicating successful job creation
    await apiResponsePromise;

    // Step 22: Verify job appears in jobs list
    await expect(panel).not.toBeVisible({ timeout: 10000 }); // Panel should close
    await expect(wrapper.getByText(expectedJobName)).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 23: Verify side panel is closed after successful submission
    await expect(frame.getByTestId("Panel:Create copy job")).not.toBeVisible();
  });

  test("1.2. Create Online Copy Job Successfully", async () => {
    // Generate unique job name for this test
    const onlineJobName = `online_job_${Date.now()}`;

    // Step 1: Wait for the copy job screen to load
    await expect(wrapper.getByTestId("CommandBar/Button:Create Copy Job")).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 2: Click 'Create Copy Job' button
    await wrapper.getByTestId("CommandBar/Button:Create Copy Job").click();

    // Step 3: Verify side panel opens
    panel = frame.getByTestId("Panel:Create copy job");
    await expect(panel).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 4: Select 'Online mode' radio button
    const onlineModeRadio = panel.getByRole("radio", { name: /online/i });
    await expect(onlineModeRadio).toBeVisible();
    await expect(onlineModeRadio).toBeEnabled();
    await onlineModeRadio.click();
    await expect(onlineModeRadio).toBeChecked();

    // Step 5: Verify online mode description is visible
    const onlineModeDescription = panel.getByTestId("migration-type-description-online");
    await expect(onlineModeDescription).toBeVisible();
    await expect(onlineModeDescription).toContainText(/online/i);

    // Step 6: Click 'Next' button
    const nextButton = panel.getByRole("button", { name: /next/i });
    await nextButton.click();

    // Step 7: Verify permissions assignment panel is displayed
    const permissionsPanel = frame.getByTestId("Panel:AssignPermissionsContainer");
    await expect(permissionsPanel).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 8: Complete permissions assignment process
    // This step may involve clicking through permission assignment UI
    const permissionsNextButton = permissionsPanel.getByRole("button", { name: /next|continue|proceed/i });
    if (await permissionsNextButton.isVisible()) {
      await permissionsNextButton.click();
    }

    // Step 9: Navigate to container selection screen
    const containerSelectionPanel = frame.getByTestId("Panel:SelectSourceAndTargetContainers");
    await expect(containerSelectionPanel).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Step 10: Select source database and container
    const sourceDatabaseDropdown = containerSelectionPanel.getByTestId("source-databaseDropdown");
    await sourceDatabaseDropdown.click();
    const sourceDatabaseDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 });
    await sourceDatabaseDropdownItem.click();

    const sourceContainerDropdown = containerSelectionPanel.getByTestId("source-containerDropdown");
    await sourceContainerDropdown.click();
    const sourceContainerDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 });
    await sourceContainerDropdownItem.click();
    // Step 11: Select different target database and container
    const targetDatabaseDropdown = containerSelectionPanel.getByTestId("target-databaseDropdown");
    await targetDatabaseDropdown.click();
    const targetDatabaseDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 0 });
    await targetDatabaseDropdownItem.click();

    const targetContainerDropdown = containerSelectionPanel.getByTestId("target-containerDropdown");
    await targetContainerDropdown.click();
    const targetContainerDropdownItem = await getDropdownItemByNameOrPosition(frame, { position: 1 });
    await targetContainerDropdownItem.click(); // Select different container

    // Step 12: Navigate to preview screen
    const nextButtonContainer = containerSelectionPanel.getByRole("button", { name: /next/i });
    await expect(nextButtonContainer).toBeEnabled();
    await nextButtonContainer.click();

    // Step 13: Verify all selected details are accurate
    const previewPanel = frame.locator("[data-testid*='preview'], [data-testid*='Preview']").first();
    await expect(previewPanel).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Verify online mode is indicated in preview
    await expect(previewPanel.getByText(/online/i)).toBeVisible();
    await expect(previewPanel.getByText(targetAccountName)).toBeVisible();

    // Step 14: Enter valid job name
    const jobNameInput = previewPanel.getByRole("textbox").or(previewPanel.getByTestId("job-name-input"));
    await jobNameInput.fill(onlineJobName);

    // Step 15: Submit copy job creation
    const submitButton = previewPanel.getByRole("button", { name: /submit/i });
    await expect(submitButton).toBeEnabled();

    // Set up API response interception for online job creation
    const apiResponsePromise = waitForApiResponse(
      page,
      `${targetAccountName}/dataTransferJobs/${onlineJobName}`,
      "PUT"
    );
    await submitButton.click();

    // Step 16: Verify successful job creation and list update
    await apiResponsePromise;

    // Verify panel closes and job appears in list
    await expect(panel).not.toBeVisible({ timeout: 10000 });
    await expect(wrapper.getByText(onlineJobName)).toBeVisible({ timeout: VISIBLE_TIMEOUT_MS });

    // Verify online mode indicator in job list (if applicable)
    const jobListItem = wrapper.locator(`[data-testid*="job-item"], tr, .job-row`).filter({ hasText: onlineJobName });
    await expect(jobListItem).toBeVisible();
    
    // Verify side panel is closed
    await expect(frame.getByTestId("Panel:Create copy job")).not.toBeVisible();
  });
});