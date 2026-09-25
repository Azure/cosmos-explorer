import { expect, Frame, Locator, Page, test } from "@playwright/test";
import { ContainerCopy, getAccountName, TestAccount } from "../../fx";

const VISIBLE_TIMEOUT_MS = 30 * 1000;

test.describe("Container Copy - Permission Screen Verification", () => {
  let page: Page;
  let wrapper: Locator;
  let panel: Locator;
  let frame: Frame;
  let sourceAccountName: string;
  let targetAccountName: string;
  let backupPolicyType: "Periodic" | "Continuous";
  let roleAssigned: boolean;
  let completeRoleAssignment: () => void;

  test.beforeEach("Setup for each test", async ({ browser }) => {
    page = await browser.newPage();
    targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
    sourceAccountName = getAccountName(TestAccount.SQL);
    backupPolicyType = "Periodic";
    roleAssigned = false;

    // Keep prerequisites independent of the shared accounts' current configuration.
    await page.route(`**/Microsoft.DocumentDB/databaseAccounts/${sourceAccountName}?*`, async (route) => {
      expect(route.request().method()).toBe("GET");
      const response = await route.fetch();
      expect(response.ok()).toBeTruthy();
      const account = await response.json();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...account,
          identity: { type: "SystemAssigned", principalId: "00-11-22-33" },
          properties: {
            ...account.properties,
            defaultIdentity: "SystemAssignedIdentity",
            backupPolicy: { type: backupPolicyType },
            capabilities: [{ name: "EnableOnlineContainerCopy" }],
          },
        }),
      });
    });

    const roleAssignmentCompleted = new Promise<void>((resolve) => {
      completeRoleAssignment = resolve;
    });
    await page.route(
      `**/Microsoft.DocumentDB/databaseAccounts/${targetAccountName}/sqlRoleAssignments**`,
      async (route) => {
        const accountScope = new URL(route.request().url()).pathname.split("/sqlRoleAssignments")[0];
        const roleDefinitionId = `${accountScope}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002`;
        const assignment = {
          id: `${accountScope}/sqlRoleAssignments/test-assignment`,
          name: "test-assignment",
          type: "Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments",
          properties: { principalId: "00-11-22-33", roleDefinitionId, scope: `${accountScope}/` },
        };
        if (route.request().method() === "PUT") {
          expect(route.request().postDataJSON().properties).toEqual(assignment.properties);
          await roleAssignmentCompleted;
          roleAssigned = true;
          await route.fulfill({ json: assignment });
        } else {
          expect(route.request().method()).toBe("GET");
          await route.fulfill({ json: { value: roleAssigned ? [assignment] : [] } });
        }
      },
    );
    await page.route(
      `**/Microsoft.DocumentDB/databaseAccounts/${targetAccountName}/sqlRoleDefinitions/*`,
      async (route) => {
        await route.fulfill({ json: { name: "00000000-0000-0000-0000-000000000002" } });
      },
    );
    ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQL));
  });

  test.afterEach("Cleanup after each test", async () => {
    completeRoleAssignment?.();
    await page.unrouteAll({ behavior: "wait" });
    await page.close();
  });

  test("Verify online container copy permissions panel functionality", async () => {
    expect(wrapper).not.toBeNull();

    // Verify all command bar buttons are visible
    await wrapper.locator(".commandBarContainer").waitFor({ state: "visible", timeout: VISIBLE_TIMEOUT_MS });

    const createCopyJobButton = wrapper.getByTestId("CommandBar/Button:Create Copy Job");
    await expect(createCopyJobButton).toBeVisible();
    await expect(wrapper.getByTestId("CommandBar/Button:Refresh")).toBeVisible();
    await expect(wrapper.getByTestId("CommandBar/Button:Feedback")).toBeVisible();

    // Open the Create Copy Job panel
    await createCopyJobButton.click();
    panel = frame.getByTestId("Panel:Create copy job");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Create copy job" })).toBeVisible();

    // Select a different account for cross-account testing
    const accountDropdown = panel.getByTestId("account-dropdown");
    await accountDropdown.click();

    const dropdownItemsWrapper = frame.locator("div.ms-Dropdown-items");
    expect(await dropdownItemsWrapper.getAttribute("aria-label")).toEqual("Account");

    await dropdownItemsWrapper.getByRole("option", { name: targetAccountName, exact: true }).click();

    // Enable online migration mode
    const migrationTypeContainer = panel.getByTestId("migration-type");
    const onlineCopyRadioButton = migrationTypeContainer.getByRole("radio", { name: /Online mode/i });
    await onlineCopyRadioButton.click({ force: true });
    await expect(migrationTypeContainer.getByTestId("migration-type-description-online")).toBeVisible();

    await panel.getByRole("button", { name: "Next" }).click();

    // Verify Assign Permissions panel for online copy
    const permissionScreen = panel.getByTestId("Panel:AssignPermissionsContainer");
    await expect(permissionScreen).toBeVisible();
    await expect(permissionScreen.getByText("Online container copy", { exact: true })).toBeVisible();
    await expect(permissionScreen.getByText("Cross-account container copy", { exact: true })).toBeVisible();

    // Verify Point-in-Time Restore functionality
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

    // Install clock mock and test PITR functionality
    await page.clock.install({ time: new Date("2024-01-01T10:00:00Z") });

    const pitrBtn = accordionPanel.getByTestId("pointInTimeRestore:PrimaryBtn");
    await expect(pitrBtn).toBeVisible();
    const popupPromise = page.waitForEvent("popup");
    await pitrBtn.click({ force: true });
    const popup = await popupPromise;
    await expect(popup).toHaveURL(
      new RegExp(`/providers/Microsoft\\.(DocumentDB|DocumentDb)/databaseAccounts/${sourceAccountName}/backupRestore`),
    );
    await popup.close();

    const loadingOverlay = frame.locator("[data-test='loading-overlay']");
    await expect(loadingOverlay).toBeVisible();

    const refreshBtn = accordionPanel.getByTestId("pointInTimeRestore:RefreshBtn");
    await expect(refreshBtn).not.toBeVisible();

    // Fast forward time by 11 minutes
    await page.clock.fastForward(11 * 60 * 1000);

    await expect(refreshBtn).toBeVisible({ timeout: 5000 });
    await expect(pitrBtn).not.toBeVisible();

    // Complete PITR explicitly, instead of racing its polling response against the next section.
    backupPolicyType = "Continuous";
    await refreshBtn.click({ force: true });
    await expect(
      permissionScreen.getByTestId("permission-group-container-onlineConfigs").getByAltText("Warning icon"),
    ).toHaveCount(0);

    // Verify cross-account permissions functionality
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

    const toggleButton = crossAccordionPanel.getByRole("switch");
    await expect(toggleButton).toBeVisible();
    await toggleButton.scrollIntoViewIfNeeded();
    await toggleButton.click({ force: true });
    await expect(toggleButton).toBeChecked();

    // Verify popover functionality
    const popover = frame.locator("[data-test='popover-container']");
    await expect(popover).toBeVisible();

    const yesButton = popover.getByRole("button", { name: /Yes/i });
    const noButton = popover.getByRole("button", { name: /No/i });
    await expect(yesButton).toBeVisible();
    await expect(noButton).toBeVisible();

    await yesButton.scrollIntoViewIfNeeded();
    await yesButton.click({ force: true });

    // Verify loading states
    await expect(loadingOverlay).toBeVisible();
    completeRoleAssignment();
    await expect(loadingOverlay).toBeHidden({ timeout: 10 * 1000 });
    await expect(popover).toBeHidden({ timeout: 10 * 1000 });
    await expect(
      permissionScreen.getByTestId("permission-group-container-crossAccountConfigs").getByAltText("Warning icon"),
    ).toHaveCount(0);

    // Cancel the panel to clean up
    await panel.getByRole("button", { name: "Cancel" }).click({ force: true });
  });
});
