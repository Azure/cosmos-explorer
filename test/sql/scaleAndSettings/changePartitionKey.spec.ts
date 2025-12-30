import { expect, Page, test } from "@playwright/test";
import { DataExplorer, ONE_MINUTE_MS, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Change Partition Key", () => {
  let pageInstance: Page;
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;
  const newPartitionKeyPath = "/newPartitionKey";
  const newContainerId = "testcontainer_1";

  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer();
  });

  test.beforeEach("Open container settings", async ({ page }) => {
    pageInstance = page;
    explorer = await DataExplorer.open(page, TestAccount.SQL);

    // Click Scale & Settings and open Partition Key tab
    await explorer.openScaleAndSettings(context);
    const PartitionKeyTab = explorer.frame.getByTestId("settings-tab-header/PartitionKeyTab");
    await PartitionKeyTab.click();
  });

  test.afterAll("Delete Test Database", async () => {
    await context?.dispose();
  });

  test("Change partition key path", async () => {
    await expect(explorer.frame.getByText("/partitionKey")).toBeVisible();
    await expect(explorer.frame.getByText("Change partition key")).toBeVisible();
    await expect(explorer.frame.getByText(/To safeguard the integrity of/)).toBeVisible();
    await expect(explorer.frame.getByText(/To change the partition key/)).toBeVisible();

    const changePartitionKeyButton = explorer.frame.getByTestId("change-partition-key-button");
    expect(changePartitionKeyButton).toBeVisible();
    await changePartitionKeyButton.click();

    // Fill out new partition key form in the panel
    const changePkPanel = explorer.frame.getByTestId(`Panel:Change partition key`);
    await expect(changePkPanel.getByText(context.database.id)).toBeVisible();
    await expect(explorer.frame.getByRole("heading", { name: "Change partition key" })).toBeVisible();
    await expect(explorer.frame.getByText(/When changing a container/)).toBeVisible();

    // Try to switch to new container
    await expect(changePkPanel.getByText("New container")).toBeVisible();
    await expect(changePkPanel.getByText("Existing container")).toBeVisible();
    await expect(changePkPanel.getByTestId("new-container-id-input")).toBeVisible();

    changePkPanel.getByTestId("new-container-id-input").fill(newContainerId);
    await expect(changePkPanel.getByTestId("new-container-partition-key-input")).toBeVisible();
    changePkPanel.getByTestId("new-container-partition-key-input").fill(newPartitionKeyPath);

    await expect(changePkPanel.getByTestId("add-sub-partition-key-button")).toBeVisible();
    changePkPanel.getByTestId("add-sub-partition-key-button").click();
    await expect(changePkPanel.getByTestId("new-container-sub-partition-key-input-0")).toBeVisible();
    await expect(changePkPanel.getByTestId("remove-sub-partition-key-button-0")).toBeVisible();
    await expect(changePkPanel.getByTestId("hierarchical-partitioning-info-text")).toBeVisible();
    changePkPanel.getByTestId("new-container-sub-partition-key-input-0").fill("/customerId");

    await changePkPanel.getByTestId("Panel/OkButton").click();

    await pageInstance.waitForLoadState("networkidle");
    await expect(changePkPanel).not.toBeVisible({ timeout: 2 * ONE_MINUTE_MS });

    // Verify partition key change job
    const jobText = explorer.frame.getByText(/Partition key change job/);
    await expect(jobText).toBeVisible();
    await expect(explorer.frame.locator(".ms-ProgressIndicator-itemName")).toContainText("Portal_testcontainer_1");

    const jobRow = explorer.frame.locator(".ms-ProgressIndicator-itemDescription");
    await expect(jobRow.getByText("Completed")).toBeVisible({ timeout: 30 * 1000 });

    const newContainerNode = await explorer.waitForContainerNode(context.database.id, newContainerId);
    expect(newContainerNode).not.toBeNull();

    // Now try to switch to existing container
    await changePartitionKeyButton.click();
    await changePkPanel.getByText("Existing container").click();
    await changePkPanel.getByLabel("Use existing container").check();
    await changePkPanel.getByText("Choose an existing container").click();

    const containerDropdownItem = await explorer.getDropdownItemByName(newContainerId, "Existing Containers");
    await containerDropdownItem.click();

    await changePkPanel.getByTestId("Panel/OkButton").click();
    await explorer.frame.getByRole("button", { name: "Cancel" }).click();

    // Dismiss overlay if it appears
    const overlayFrame = explorer.frame.locator("#webpack-dev-server-client-overlay").first();
    if (await overlayFrame.count()) {
      await overlayFrame.contentFrame().getByLabel("Dismiss").click();
    }
    const cancelledJobRow = explorer.frame.getByTestId("Tab:tab0");
    await expect(cancelledJobRow.getByText("Cancelled")).toBeVisible({ timeout: 30 * 1000 });
  });
});
