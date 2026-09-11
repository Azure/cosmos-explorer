/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Frame, Locator, Page, test } from "@playwright/test";
import { ContainerCopy, getAccountName, resourceGroupName, subscriptionId, TestAccount } from "../../fx";

const VISIBLE_TIMEOUT_MS = 30 * 1000;

test.describe("Container Copy - Permission Screen Verification", () => {
  let page: Page;
  let wrapper: Locator;
  let panel: Locator;
  let frame: Frame;
  let sourceAccountName: string;
  let targetAccountName: string;

  test.beforeEach("Setup for each test", async ({ browser }) => {
    page = await browser.newPage();
    ({ wrapper, frame } = await ContainerCopy.open(page, TestAccount.SQL));
    targetAccountName = getAccountName(TestAccount.SQLContainerCopyOnly);
    sourceAccountName = getAccountName(TestAccount.SQL);
  });

  test.afterEach("Cleanup after each test", async () => {
    await page.unrouteAll({ behavior: "ignoreErrors" });
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

    // Mock Resource Graph API — fires on auto-subscription selection to populate account dropdown
    await page.route(
      "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01",
      async (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          (request.postDataJSON()?.query as string) ===
            "resources | where type =~ 'microsoft.documentdb/databaseaccounts'"
        ) {
          const response = await route.fetch();
          const responseData = await response.json();
          if (responseData.data && Array.isArray(responseData.data)) {
            responseData.data = responseData.data.map((d: any) => {
              d.properties.backupPolicy.type = "Periodic";
              return d;
            });
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(responseData),
          });
        } else {
          await route.continue();
        }
      },
      { times: 2 },
    );

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

    for (const item of allDropdownItems) {
      const testContent = (await item.textContent()) ?? "";
      if (testContent.trim() === targetAccountName.trim()) {
        await item.click();
        break;
      }
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

    const sourceAccountRoute = `**/Microsoft.DocumentDB/databaseAccounts/${sourceAccountName}**`;

    // Keep PITR polling deterministic without changing the source account state.
    await page.route(sourceAccountRoute, async (route) => {
      if (route.request().method() === "GET" && route.request().url().includes("api-version=2025-05-01-preview")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ properties: { backupPolicy: { type: "Periodic" } } }),
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

    // Verify new page opens with correct URL pattern
    const newPagePromise = page.context().waitForEvent("page");
    await pitrBtn.click({ force: true });
    const newPage = await newPagePromise;
    const expectedUrlEndPattern = new RegExp(
      `/providers/Microsoft.(DocumentDB|DocumentDb)/databaseAccounts/${sourceAccountName}/backupRestore`,
    );
    await expect(newPage).toHaveURL(expectedUrlEndPattern);
    await newPage.close();

    const loadingOverlay = frame.locator("[data-test='loading-overlay']");
    await expect(loadingOverlay).toBeVisible();

    const refreshBtn = accordionPanel.getByTestId("pointInTimeRestore:RefreshBtn");
    await expect(refreshBtn).not.toBeVisible();

    // Fast forward time by 11 minutes
    await page.clock.fastForward(11 * 60 * 1000);

    await expect(refreshBtn).toBeVisible({ timeout: 5000 });
    await expect(pitrBtn).not.toBeVisible();
    await page.unroute(sourceAccountRoute);

    // Setup additional API mocks for role assignments and permissions.
    const targetAccountScope = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${targetAccountName}`;
    const targetRoleDefinitionId = `${targetAccountScope}/sqlRoleDefinitions/77-88-99`;
    await page.route(
      `**/Microsoft.DocumentDB/databaseAccounts/${targetAccountName}/sqlRoleAssignments*`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            value: [
              {
                id: `${targetAccountScope}/sqlRoleAssignments/mock-role-assignment`,
                name: "mock-role-assignment",
                type: "Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments",
                properties: {
                  principalId: "00-11-22-33",
                  roleDefinitionId: targetRoleDefinitionId,
                  scope: `${targetAccountScope}/`,
                },
              },
            ],
          }),
        });
      },
    );

    await page.route(
      `**/Microsoft.DocumentDB/databaseAccounts/${targetAccountName}/sqlRoleDefinitions/77-88-99*`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: targetRoleDefinitionId,
            name: "00000000-0000-0000-0000-000000000002",
            type: "Microsoft.DocumentDB/databaseAccounts/sqlRoleDefinitions",
            assignableScopes: [targetAccountScope],
            permissions: [],
            resourceGroup: resourceGroupName,
            roleName: "Cosmos DB Built-in Data Contributor",
            typePropertiesType: "BuiltInRole",
          }),
        });
      },
    );

    // Return the completed identity state only for the managed-identity action.
    await page.route(sourceAccountRoute, async (route) => {
      const mockData = {
        id: new URL(route.request().url()).pathname,
        name: sourceAccountName,
        location: "East US",
        type: "Microsoft.DocumentDB/databaseAccounts",
        kind: "GlobalDocumentDB",
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
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockData),
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
    await toggleButton.click({ force: true });

    // Verify popover functionality
    const popover = frame.locator("[data-test='popover-container']");
    await expect(popover).toBeVisible();

    const yesButton = popover.getByRole("button", { name: /Yes/i });
    const noButton = popover.getByRole("button", { name: /No/i });
    await expect(yesButton).toBeVisible();
    await expect(noButton).toBeVisible();

    const identityUpdatePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PATCH" &&
        response.url().includes(`/databaseAccounts/${sourceAccountName}`) &&
        response.url().includes("api-version=2025-04-15"),
    );
    const accountRefreshPromise = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes(`/databaseAccounts/${sourceAccountName}`) &&
        response.url().includes("api-version=2025-05-01-preview"),
    );
    const roleAssignmentsPromise = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes(`/databaseAccounts/${targetAccountName}/sqlRoleAssignments`) &&
        response.url().includes("api-version=2025-04-15"),
    );
    const roleDefinitionPromise = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes(`/databaseAccounts/${targetAccountName}/sqlRoleDefinitions/77-88-99`) &&
        response.url().includes("api-version=2025-04-15"),
    );
    await yesButton.click({ force: true });
    const [identityUpdateResponse, accountRefreshResponse, roleAssignmentsResponse, roleDefinitionResponse] =
      await Promise.all([identityUpdatePromise, accountRefreshPromise, roleAssignmentsPromise, roleDefinitionPromise]);
    expect(identityUpdateResponse.ok()).toBe(true);
    expect(accountRefreshResponse.ok()).toBe(true);
    expect(roleAssignmentsResponse.ok()).toBe(true);
    expect(roleDefinitionResponse.ok()).toBe(true);

    // Verify the refreshed account state completes the permission section.
    await expect(popover).toBeHidden({ timeout: VISIBLE_TIMEOUT_MS });

    // Cancel the panel to clean up
    await panel.getByRole("button", { name: "Cancel" }).click({ force: true });
  });
});
