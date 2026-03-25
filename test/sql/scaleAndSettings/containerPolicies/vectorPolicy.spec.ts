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

  test("Add new vector embedding policy", async () => {
    // Click Add vector embedding button
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    // Fill in path
    const pathInput = explorer.frame.locator("#vector-policy-path-1");
    await pathInput.fill("/embedding");

    // Fill in dimensions
    const dimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
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
    // First add a vector embedding policy
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    const pathInput = explorer.frame.locator("#vector-policy-path-1");
    await pathInput.fill("/existingEmbedding");

    const dimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await dimensionsInput.fill("700");

    // Save the policy
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Verify the path field is disabled for the existing policy
    const existingPathInput = explorer.frame.locator("#vector-policy-path-1");
    await expect(existingPathInput).toBeDisabled();

    // Verify the dimensions field is disabled for the existing policy
    const existingDimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await expect(existingDimensionsInput).toBeDisabled();
  });

  test("New vector embedding policy fields are enabled while existing are disabled", async () => {
    // First, create an existing policy
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    const firstPathInput = explorer.frame.locator("#vector-policy-path-1");
    await firstPathInput.fill("/existingPolicy");

    const firstDimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await firstDimensionsInput.fill("500");

    // Save the policy to make it "existing"
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Now add a new policy
    await addButton.click();

    // Verify the existing policy fields are disabled
    const existingPathInput = explorer.frame.locator("#vector-policy-path-1");
    const existingDimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await expect(existingPathInput).toBeDisabled();
    await expect(existingDimensionsInput).toBeDisabled();

    // Verify the new policy fields are enabled
    const newPathInput = explorer.frame.locator("#vector-policy-path-2");
    const newDimensionsInput = explorer.frame.locator("#vector-policy-dimension-2");
    await expect(newPathInput).toBeEnabled();
    await expect(newDimensionsInput).toBeEnabled();
  });

  test("Delete existing vector embedding policy", async () => {
    // First add a vector embedding policy
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    const pathInput = explorer.frame.locator("#vector-policy-path-1");
    await pathInput.fill("/toBeDeleted");

    const dimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await dimensionsInput.fill("256");

    // Save the policy
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Verify the policy exists
    await expect(pathInput).toBeVisible();

    // Click the delete (trash) button for the vector embedding
    const deleteButton = explorer.frame.locator("#delete-Vector-embedding-1");
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // Verify the policy fields are removed
    await expect(explorer.frame.locator("#vector-policy-path-1")).not.toBeVisible();
    await expect(explorer.frame.locator("#vector-policy-dimension-1")).not.toBeVisible();

    // Save the deletion
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(explorer.getConsoleHeaderStatus()).toContainText(
      `Successfully updated container ${context.container.id}`,
      {
        timeout: 2 * ONE_MINUTE_MS,
      },
    );

    // Verify the policy is still gone after save
    await expect(explorer.frame.locator("#vector-policy-path-1")).not.toBeVisible();
  });

  test("Validation error for empty path", async () => {
    const addButton = explorer.frame.locator("#add-vector-policy");
    await addButton.click();

    // Leave path empty, just fill dimensions
    const dimensionsInput = explorer.frame.locator("#vector-policy-dimension-1");
    await dimensionsInput.fill("512");

    // Check for validation error on path
    const pathError = explorer.frame.locator("text=Path should not be empty");
    await expect(pathError).toBeVisible();

    // Verify save button is disabled due to validation error
    const saveButton = explorer.commandBarButton(CommandBarButton.Save);
    await expect(saveButton).toBeDisabled();
  });
});
