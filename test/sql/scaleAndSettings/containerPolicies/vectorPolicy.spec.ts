import { expect, test } from "@playwright/test";
import { CommandBarButton, DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../../testData";

test.describe("Vector Policy under Scale & Settings", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;

  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer();
  });

  test.beforeEach("Open Container Policy tab under Scale & Settings", async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL);
    await explorer.waitForContainerNode(context.database.id, context.container.id);

    // Click Scale & Settings and open Container Policy tab
    await explorer.openScaleAndSettings(context);
    const containerPolicyTab = explorer.frame.getByTestId("settings-tab-header/ContainerVectorPolicyTab");
    await containerPolicyTab.click();

    // Click on Vector Policy tab
    const vectorPolicyTab = explorer.frame.getByRole("tab", { name: "Vector Policy" });
    await vectorPolicyTab.click();
  });

  test.afterAll("Delete Test Database", async () => {
    await context?.dispose();
  });

  /** Count vector policy entries currently in the DOM. */
  async function getPolicyCount(): Promise<number> {
    for (let i = 1; i <= 20; i++) {
      if ((await explorer.frame.locator(`#vector-policy-path-${i}`).count()) === 0) {
        return i - 1;
      }
    }
    return 20;
  }

  /**
   * Ensure at least one saved (existing) vector policy exists on the container.
   * If none exist, add one and save it. Returns the total policy count afterward.
   */
  async function ensureExistingPolicy(): Promise<number> {
    const count = await getPolicyCount();
    if (count > 0) {
      return count;
    }

    // No saved policies — add and save one
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    await explorer.frame.locator("#vector-policy-path-1").fill("/existingPolicy");
    await explorer.frame.locator("#vector-policy-dimension-1").fill("500");

    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      { timeout: 2 * ONE_MINUTE_MS },
    );
    return 1;
  }

  test("Add new vector embedding policy", async () => {
    const existingCount = await getPolicyCount();

    // Click Add vector embedding button
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    const newIndex = existingCount + 1;

    // Fill in path
    const pathInput = explorer.frame.locator(`#vector-policy-path-${newIndex}`);
    await pathInput.fill("/embedding");

    // Fill in dimensions
    const dimensionsInput = explorer.frame.locator(`#vector-policy-dimension-${newIndex}`);
    await dimensionsInput.fill("1500");

    // Save changes
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );
  });

  test("Existing vector embedding policy fields are disabled", async () => {
    // Ensure there is at least one saved policy
    await ensureExistingPolicy();

    // Verify the path field is disabled for the existing policy
    const existingPathInput = explorer.frame.locator("#vector-policy-path-1");
    await expect(existingPathInput).toBeDisabled();

    // Verify the dimensions field is disabled for the existing policy
    const existingDimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await expect(existingDimensionsInput).toBeDisabled();
  });

  test("New vector embedding policy fields are enabled while existing are disabled", async () => {
    // Ensure there is at least one saved policy
    const existingCount = await ensureExistingPolicy();

    // Now add a new policy
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    const newIndex = existingCount + 1;

    // Verify the existing policy fields are disabled
    const existingPathInput = explorer.frame.locator("#vector-policy-path-1");
    const existingDimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await expect(existingPathInput).toBeDisabled();
    await expect(existingDimensionsInput).toBeDisabled();

    // Verify the new policy fields are enabled
    const newPathInput = explorer.frame.locator(`#vector-policy-path-${newIndex}`);
    const newDimensionsInput = explorer.frame.locator(`#vector-policy-dimension-${newIndex}`);
    await expect(newPathInput).toBeEnabled();
    await expect(newDimensionsInput).toBeEnabled();
  });

  test("Delete existing vector embedding policy", async () => {
    // Ensure there is at least one saved policy to delete
    const existingCount = await ensureExistingPolicy();

    // Verify the policy exists
    const pathInput = explorer.frame.locator("#vector-policy-path-1");
    await expect(pathInput).toBeVisible();

    // Click the delete (trash) button for the first vector embedding
    const deleteButton = explorer.frame.locator("#delete-Vector-embedding-1");
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // Verify one fewer policy entry in the UI
    const countAfterDelete = await getPolicyCount();
    expect(countAfterDelete).toBe(existingCount - 1);

    // Save the deletion
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Verify the count is still reduced after save
    const countAfterSave = await getPolicyCount();
    expect(countAfterSave).toBe(existingCount - 1);
  });

  test("Validation error for empty path", async () => {
    const existingCount = await getPolicyCount();

    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    const newIndex = existingCount + 1;

    // Leave path empty, just fill dimensions
    const dimensionsInput = explorer.frame.locator(`#vector-policy-dimension-${newIndex}`);
    await dimensionsInput.fill("512");

    // Check for validation error on path
    const pathError = explorer.frame.locator("text=Path should not be empty");
    await expect(pathError).toBeVisible();

    // Verify save button is disabled due to validation error
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeDisabled();
  });
});
