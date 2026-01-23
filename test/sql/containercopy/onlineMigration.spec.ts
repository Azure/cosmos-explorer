// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { expect, Frame, Locator, Page, test } from "@playwright/test";
// import {
//   ContainerCopy,
//   getAccountName,
//   getDropdownItemByNameOrPosition,
//   TestAccount,
//   waitForApiResponse,
// } from "../../fx";
// import { createMultipleTestContainers } from "../../testData";

// test.describe("Container Copy - Online Migration", () => {
//   let page: Page;
//   let wrapper: Locator;
//   let panel: Locator;
//   let frame: Frame;
//   let targetAccountName: string;

//   test.beforeEach("Setup for online migration test", async ({ browser }) => {
//     await createMultipleTestContainers({ accountType: TestAccount.SQLContainerCopyOnly, containerCount: 2 });

//     page = await browser.newPage();
//     ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQLContainerCopyOnly));
//     targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
//   });

//   test.afterEach("Cleanup after online migration test", async () => {
//     await page.unroute(/.*/, (route) => route.continue());
//     await page.close();
//   });

//   test("Successfully create and manage online migration copy job", async () => {
//     expect(wrapper).not.toBeNull();
//     await wrapper.locator(".commandBarContainer").waitFor({ state: "visible" });

//     // Open Create Copy Job panel
//     const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
//     await expect(createCopyJobButton).toBeVisible();
//     await createCopyJobButton.click();
//     panel = frame.getByTestId("Panel:Create copy job");
//     await expect(panel).toBeVisible();

//     // Reduced wait time for better performance
//     await page.waitForTimeout(1000);

//     // Enable online migration mode
//     const migrationTypeContainer = panel.getByTestId("migration-type");
//     const onlineCopyRadioButton = migrationTypeContainer.getByRole("radio", { name: /Online mode/i });
//     await onlineCopyRadioButton.click({ force: true });

//     await expect(migrationTypeContainer.getByTestId("migration-type-description-online")).toBeVisible();

//     await panel.getByRole("button", { name: "Next" }).click();

//     // Verify permissions screen is shown for online migration
//     const permissionScreen = panel.getByTestId("Panel:AssignPermissionsContainer");
//     await expect(permissionScreen).toBeVisible();
//     await expect(permissionScreen.getByText("Online container copy", { exact: true })).toBeVisible();

//     // Skip permissions setup and proceed to container selection
//     await panel.getByRole("button", { name: "Next" }).click();

//     // Configure source and target containers for online migration
//     const sourceDatabaseDropdown = panel.getByTestId("source-databaseDropdown");
//     await sourceDatabaseDropdown.click();
//     const sourceDbDropdownItem = await getDropdownItemByNameOrPosition(
//       frame,
//       { position: 0 },
//       { ariaLabel: "Database" },
//     );
//     await sourceDbDropdownItem.click();

//     const sourceContainerDropdown = panel.getByTestId("source-containerDropdown");
//     await sourceContainerDropdown.click();
//     const sourceContainerDropdownItem = await getDropdownItemByNameOrPosition(
//       frame,
//       { position: 0 },
//       { ariaLabel: "Container" },
//     );
//     await sourceContainerDropdownItem.click();

//     const targetDatabaseDropdown = panel.getByTestId("target-databaseDropdown");
//     await targetDatabaseDropdown.click();
//     const targetDbDropdownItem = await getDropdownItemByNameOrPosition(
//       frame,
//       { position: 0 },
//       { ariaLabel: "Database" },
//     );
//     await targetDbDropdownItem.click();

//     const targetContainerDropdown = panel.getByTestId("target-containerDropdown");
//     await targetContainerDropdown.click();
//     const targetContainerDropdownItem = await getDropdownItemByNameOrPosition(
//       frame,
//       { position: 1 },
//       { ariaLabel: "Container" },
//     );
//     await targetContainerDropdownItem.click();

//     await panel.getByRole("button", { name: "Next" }).click();

//     // Verify job preview and create the online migration job
//     const previewContainer = panel.getByTestId("Panel:PreviewCopyJob");
//     await expect(previewContainer.getByTestId("source-account-name")).toHaveText(targetAccountName);

//     const jobNameInput = previewContainer.getByTestId("job-name-textfield");
//     const onlineMigrationJobName = await jobNameInput.inputValue();

//     const copyButton = panel.getByRole("button", { name: "Copy", exact: true });

//     const copyJobCreationPromise = waitForApiResponse(
//       page,
//       `${targetAccountName}/dataTransferJobs/${onlineMigrationJobName}`,
//       "PUT",
//     );
//     await copyButton.click();
//     await page.waitForTimeout(1000); // Reduced wait time

//     const response = await copyJobCreationPromise;
//     expect(response.ok()).toBe(true);

//     // Verify panel closes and job appears in the list
//     await expect(panel).not.toBeVisible();

//     const filterTextField = wrapper.getByTestId("CopyJobsList/FilterTextField");
//     await filterTextField.waitFor({ state: "visible" });
//     await filterTextField.fill(onlineMigrationJobName);

//     const jobsListContainer = wrapper.locator(".CopyJobListContainer .ms-DetailsList-contentWrapper .ms-List-page");
//     await jobsListContainer.waitFor({ state: "visible" });

//     let jobRow, statusCell, actionMenuButton;
//     jobRow = jobsListContainer.locator(".ms-DetailsRow", { hasText: onlineMigrationJobName });
//     statusCell = jobRow.locator("[data-automationid='DetailsRowCell'][data-automation-key='CopyJobStatus']");
//     await jobRow.waitFor({ state: "visible" });

//     // Verify job status changes to queued state
//     await expect(statusCell).toContainText(/running|queued|pending/i);

//     // Test job lifecycle management through action menu
//     actionMenuButton = wrapper.getByTestId(`CopyJobActionMenu/Button:${onlineMigrationJobName}`);
//     await actionMenuButton.click();

//     // Test pause functionality
//     const pauseAction = frame.locator(".ms-ContextualMenu-list button:has-text('Pause')");
//     await pauseAction.click();

//     const pauseResponse = await waitForApiResponse(
//       page,
//       `${targetAccountName}/dataTransferJobs/${onlineMigrationJobName}/pause`,
//       "POST",
//     );
//     expect(pauseResponse.ok()).toBe(true);

//     // Verify job status changes to paused
//     jobRow = jobsListContainer.locator(".ms-DetailsRow", { hasText: onlineMigrationJobName });
//     await jobRow.waitFor({ state: "visible", timeout: 5000 });
//     statusCell = jobRow.locator("[data-automationid='DetailsRowCell'][data-automation-key='CopyJobStatus']");
//     await expect(statusCell).toContainText(/paused/i, { timeout: 5000 });
//     await page.waitForTimeout(1000);

//     // Test cancel job functionality
//     actionMenuButton = wrapper.getByTestId(`CopyJobActionMenu/Button:${onlineMigrationJobName}`);
//     await actionMenuButton.click();
//     await frame.locator(".ms-ContextualMenu-list button:has-text('Cancel')").click();

//     // Verify cancellation confirmation dialog
//     await expect(frame.locator(".ms-Dialog-main")).toBeVisible({ timeout: 2000 });
//     await expect(frame.locator(".ms-Dialog-main")).toContainText(onlineMigrationJobName);

//     const cancelDialogButton = frame.locator(".ms-Dialog-main").getByTestId("DialogButton:Cancel");
//     await expect(cancelDialogButton).toBeVisible();
//     await cancelDialogButton.click();
//     await expect(frame.locator(".ms-Dialog-main")).not.toBeVisible();

//     actionMenuButton = wrapper.getByTestId(`CopyJobActionMenu/Button:${onlineMigrationJobName}`);
//     await actionMenuButton.click();
//     await frame.locator(".ms-ContextualMenu-list button:has-text('Cancel')").click();

//     const confirmDialogButton = frame.locator(".ms-Dialog-main").getByTestId("DialogButton:Confirm");
//     await expect(confirmDialogButton).toBeVisible();
//     await confirmDialogButton.click();

//     // Verify final job status is cancelled
//     jobRow = jobsListContainer.locator(".ms-DetailsRow", { hasText: onlineMigrationJobName });
//     statusCell = jobRow.locator("[data-automationid='DetailsRowCell'][data-automation-key='CopyJobStatus']");
//     await expect(statusCell).toContainText(/cancelled/i, { timeout: 5000 });
//   });
// });
