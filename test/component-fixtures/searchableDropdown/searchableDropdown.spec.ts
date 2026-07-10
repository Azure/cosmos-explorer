import { expect, test } from "@playwright/test";

const FIXTURE_URL = "https://127.0.0.1:1234/searchableDropdownFixture.html";

test.describe("SearchableDropdown Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_URL);
    await page.waitForSelector("[data-test='subscription-dropdown']");
  });

  test("renders subscription dropdown with label and placeholder", async ({ page }) => {
    await expect(page.getByText("Subscription", { exact: true })).toBeVisible();
    await expect(page.getByText("Select a Subscription")).toBeVisible();
  });

  test("renders account dropdown as disabled when no subscription is selected", async ({ page }) => {
    const accountButton = page.locator("[data-test='account-dropdown'] button");
    await expect(accountButton).toBeDisabled();
  });

  test("opens subscription dropdown and shows all mock items", async ({ page }) => {
    await page.getByText("Select a Subscription").click();

    await expect(page.getByText("Development Subscription")).toBeVisible();
    await expect(page.getByText("Production Subscription")).toBeVisible();
    await expect(page.getByText("Testing Subscription")).toBeVisible();
    await expect(page.getByText("Staging Subscription")).toBeVisible();
    await expect(page.getByText("QA Subscription")).toBeVisible();
  });

  test("filters subscription items by search text", async ({ page }) => {
    await page.getByText("Select a Subscription").click();

    const searchBox = page.getByPlaceholder("Search by Subscription name");
    await searchBox.fill("Dev");

    await expect(page.getByText("Development Subscription")).toBeVisible();
    await expect(page.getByText("Production Subscription")).not.toBeVisible();
    await expect(page.getByText("Testing Subscription")).not.toBeVisible();
  });

  test("performs case-insensitive filtering", async ({ page }) => {
    await page.getByText("Select a Subscription").click();

    const searchBox = page.getByPlaceholder("Search by Subscription name");
    await searchBox.fill("production");

    await expect(page.getByText("Production Subscription")).toBeVisible();
    await expect(page.getByText("Development Subscription")).not.toBeVisible();
  });

  test("shows 'No items found' when search yields no results", async ({ page }) => {
    await page.getByText("Select a Subscription").click();

    const searchBox = page.getByPlaceholder("Search by Subscription name");
    await searchBox.fill("NonexistentSubscription");

    await expect(page.getByText("No items found")).toBeVisible();
  });

  test("selects a subscription and updates button text", async ({ page }) => {
    await page.getByText("Select a Subscription").click();
    await page.getByText("Development Subscription").click();

    // Dropdown should close and show selected item
    await expect(
      page.locator("[data-test='subscription-dropdown']").getByText("Development Subscription"),
    ).toBeVisible();
    // External state should update
    await expect(page.locator("[data-test='selected-subscription']")).toHaveText("Development Subscription");
  });

  test("enables account dropdown after subscription is selected", async ({ page }) => {
    // Select a subscription first
    await page.getByText("Select a Subscription").click();
    await page.getByText("Production Subscription").click();

    // Account dropdown should now be enabled
    const accountButton = page.locator("[data-test='account-dropdown'] button");
    await expect(accountButton).toBeEnabled();
  });

  test("shows account items after subscription selection", async ({ page }) => {
    // Select subscription
    await page.getByText("Select a Subscription").click();
    await page.getByText("Development Subscription").click();

    // Open account dropdown
    await page.getByText("Select an Account").click();

    await expect(page.getByText("cosmos-dev-westus")).toBeVisible();
    await expect(page.getByText("cosmos-prod-eastus")).toBeVisible();
    await expect(page.getByText("cosmos-test-northeurope")).toBeVisible();
    await expect(page.getByText("cosmos-staging-westus2")).toBeVisible();
  });

  test("filters account items by search text", async ({ page }) => {
    // Select subscription
    await page.getByText("Select a Subscription").click();
    await page.getByText("Testing Subscription").click();

    // Open account dropdown and filter
    await page.getByText("Select an Account").click();
    const searchBox = page.getByPlaceholder("Search by Account name");
    await searchBox.fill("prod");

    await expect(page.getByText("cosmos-prod-eastus")).toBeVisible();
    await expect(page.getByText("cosmos-dev-westus")).not.toBeVisible();
  });

  test("selects an account and updates both dropdowns", async ({ page }) => {
    // Select subscription
    await page.getByText("Select a Subscription").click();
    await page.getByText("Staging Subscription").click();

    // Select account
    await page.getByText("Select an Account").click();
    await page.getByText("cosmos-dev-westus").click();

    // Verify both selections
    await expect(page.locator("[data-test='selected-subscription']")).toHaveText("Staging Subscription");
    await expect(page.locator("[data-test='selected-account']")).toHaveText("cosmos-dev-westus");
  });

  test("clears search filter when dropdown is closed and reopened", async ({ page }) => {
    await page.getByText("Select a Subscription").click();

    const searchBox = page.getByPlaceholder("Search by Subscription name");
    await searchBox.fill("Dev");

    // Select an item to close dropdown
    await page.getByText("Development Subscription").click();

    // Reopen dropdown
    await page.locator("[data-test='subscription-dropdown']").getByText("Development Subscription").click();

    // Search box should be cleared
    const reopenedSearchBox = page.getByPlaceholder("Search by Subscription name");
    await expect(reopenedSearchBox).toHaveValue("");

    // All items should be visible again
    await expect(page.getByText("Production Subscription")).toBeVisible();
    await expect(page.getByText("Testing Subscription")).toBeVisible();
  });

  test("renders account dropdown with label and placeholder after subscription selected", async ({ page }) => {
    await page.getByText("Select a Subscription").click();
    await page.getByText("Development Subscription").click();

    await expect(page.getByText("Cosmos DB Account")).toBeVisible();
    await expect(page.getByText("Select an Account")).toBeVisible();
  });

  test("performs case-insensitive filtering on account dropdown", async ({ page }) => {
    await page.getByText("Select a Subscription").click();
    await page.getByText("Development Subscription").click();

    await page.getByText("Select an Account").click();
    const searchBox = page.getByPlaceholder("Search by Account name");
    await searchBox.fill("COSMOS-TEST");

    await expect(page.getByText("cosmos-test-northeurope")).toBeVisible();
    await expect(page.getByText("cosmos-dev-westus")).not.toBeVisible();
    await expect(page.getByText("cosmos-prod-eastus")).not.toBeVisible();
    await expect(page.getByText("cosmos-staging-westus2")).not.toBeVisible();
  });

  test("shows 'No items found' in account dropdown when search yields no results", async ({ page }) => {
    await page.getByText("Select a Subscription").click();
    await page.getByText("Production Subscription").click();

    await page.getByText("Select an Account").click();
    const searchBox = page.getByPlaceholder("Search by Account name");
    await searchBox.fill("nonexistent-account");

    await expect(page.getByText("No items found")).toBeVisible();
  });

  test("clears account search filter when dropdown is closed and reopened", async ({ page }) => {
    await page.getByText("Select a Subscription").click();
    await page.getByText("Testing Subscription").click();

    // Open account dropdown and filter
    await page.getByText("Select an Account").click();
    const searchBox = page.getByPlaceholder("Search by Account name");
    await searchBox.fill("prod");

    // Select an item to close
    await page.getByText("cosmos-prod-eastus").click();

    // Reopen and verify filter is cleared
    await page.locator("[data-test='account-dropdown']").getByText("cosmos-prod-eastus").click();
    const reopenedSearchBox = page.getByPlaceholder("Search by Account name");
    await expect(reopenedSearchBox).toHaveValue("");

    // All items visible again
    await expect(page.getByText("cosmos-dev-westus")).toBeVisible();
    await expect(page.getByText("cosmos-test-northeurope")).toBeVisible();
    await expect(page.getByText("cosmos-staging-westus2")).toBeVisible();
  });

  test("account dropdown updates button text after selection", async ({ page }) => {
    await page.getByText("Select a Subscription").click();
    await page.getByText("QA Subscription").click();

    await page.getByText("Select an Account").click();
    await page.getByText("cosmos-test-northeurope").click();

    // Button should show selected account name
    await expect(page.locator("[data-test='account-dropdown']").getByText("cosmos-test-northeurope")).toBeVisible();
    await expect(page.locator("[data-test='selected-account']")).toHaveText("cosmos-test-northeurope");
  });

  test("account dropdown shows all 4 mock accounts", async ({ page }) => {
    await page.getByText("Select a Subscription").click();
    await page.getByText("Staging Subscription").click();

    await page.getByText("Select an Account").click();

    await expect(page.getByText("cosmos-dev-westus")).toBeVisible();
    await expect(page.getByText("cosmos-prod-eastus")).toBeVisible();
    await expect(page.getByText("cosmos-test-northeurope")).toBeVisible();
    await expect(page.getByText("cosmos-staging-westus2")).toBeVisible();
  });

  test("shows 'No Cosmos DB Accounts Found' when account list is empty (no subscription selected)", async ({
    page,
  }) => {
    // The account dropdown shows "No Cosmos DB Accounts Found" when disabled with no items
    const accountButtonText = page.locator("[data-test='account-dropdown'] button");
    await expect(accountButtonText).toHaveText("No Cosmos DB Accounts Found");
  });

  test("full flow: select subscription, filter accounts, select account", async ({ page }) => {
    // Step 1: Select a subscription
    await page.getByText("Select a Subscription").click();
    const subSearchBox = page.getByPlaceholder("Search by Subscription name");
    await subSearchBox.fill("QA");
    await page.getByText("QA Subscription").click();

    // Step 2: Open account dropdown and filter
    await page.getByText("Select an Account").click();
    const accountSearchBox = page.getByPlaceholder("Search by Account name");
    await accountSearchBox.fill("staging");
    await page.getByText("cosmos-staging-westus2").click();

    // Step 3: Verify final state
    await expect(page.locator("[data-test='selected-subscription']")).toHaveText("QA Subscription");
    await expect(page.locator("[data-test='selected-account']")).toHaveText("cosmos-staging-westus2");
  });
});
