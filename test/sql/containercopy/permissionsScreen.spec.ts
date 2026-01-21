/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Frame, Locator, Page, test } from "@playwright/test";
import { set } from "lodash";
import { ContainerCopy, getAccountName, TestAccount } from "../../fx";

const VISIBLE_TIMEOUT_MS = 30 * 1000;

test.describe("Container Copy - Permission Screen Verification", () => {
  let page: Page;
  let wrapper: Locator;
  let panel: Locator;
  let frame: Frame;
  let targetAccountName: string;
  let expectedSourceAccountName: string;

  test.beforeEach("Setup for each test", async ({ browser }) => {
    page = await browser.newPage();
    ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQLContainerCopyOnly));
    targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
  });

  test.afterEach("Cleanup after each test", async () => {
    await page.unroute(/.*/, (route) => route.continue());
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

    // Setup API mocking for the source account
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
    await pitrBtn.click();

    // Verify new page opens with correct URL pattern
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

    // Fast forward time by 11 minutes
    await page.clock.fastForward(11 * 60 * 1000);

    await expect(refreshBtn).toBeVisible({ timeout: 5000 });
    await expect(pitrBtn).not.toBeVisible();

    // Setup additional API mocks for role assignments and permissions
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

    const toggleButton = crossAccordionPanel.getByTestId("btn-toggle");
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Verify popover functionality
    const popover = frame.locator("[data-test='popover-container']");
    await expect(popover).toBeVisible();

    const yesButton = popover.getByRole("button", { name: /Yes/i });
    const noButton = popover.getByRole("button", { name: /No/i });
    await expect(yesButton).toBeVisible();
    await expect(noButton).toBeVisible();

    await yesButton.click();

    // Verify loading states
    await expect(loadingOverlay).toBeVisible();
    await expect(loadingOverlay).toBeHidden({ timeout: 10 * 1000 });
    await expect(popover).toBeHidden({ timeout: 10 * 1000 });

    // Cancel the panel to clean up
    await panel.getByRole("button", { name: "Cancel" }).click();
  });
});
