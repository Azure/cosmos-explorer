import { expect, test } from "@playwright/test";
import { DataExplorer, TestAccount } from "../../fx";
import { createTestSQLContainer, TestContainerContext } from "../../testData";

test.describe("Change Partition Key", () => {
  let context: TestContainerContext = null!;
  let explorer: DataExplorer = null!;
  const newPartitionKeyPath = "newPartitionKey";
  const newContainerId = "testcontainer_1";
  let previousJobName: string | undefined;

  test.beforeAll("Create Test Database", async () => {
    context = await createTestSQLContainer({
      testAccount: TestAccount.SQL2,
    });
  });

  test.beforeEach("Open container settings", async ({ page }) => {
    explorer = await DataExplorer.open(page, TestAccount.SQL2);

    // Click Scale & Settings and open Partition Key tab
    await explorer.openScaleAndSettings(context);
    const PartitionKeyTab = explorer.frame.getByTestId("settings-tab-header/PartitionKeyTab");
    await expect(PartitionKeyTab).toBeVisible();
    await PartitionKeyTab.click();
  });

    test.afterEach("Delete Test Database", async () => {
      await context?.dispose();
    });

  test("Change partition key path", async ({ page }) => {
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
    await changePkPanel.getByTestId("remove-sub-partition-key-button-0").click();

    await changePkPanel.getByTestId("Panel/OkButton").click();

    let jobName: string | undefined;
    await page.waitForRequest(
      (req) => {
        const requestUrl = req.url();
        if (requestUrl.includes("/dataTransferJobs") && req.method() === "PUT") {
          jobName = new URL(requestUrl).pathname.split("/").pop();
          return true;
        }
        return false;
      },
      { timeout: 120000 },
    );

    await expect(changePkPanel).not.toBeVisible({ timeout: 5 * 60 * 1000 });

    // Verify partition key change job
    const jobText = explorer.frame.getByText(/Partition key change job/);
    await expect(jobText).toBeVisible();
    // await expect(explorer.frame.locator(".ms-ProgressIndicator-itemName")).toContainText("Portal_testcontainer_1");
    await expect(explorer.frame.locator(".ms-ProgressIndicator-itemName")).toContainText(jobName!);

    const jobRow = explorer.frame.locator(".ms-ProgressIndicator-itemDescription");
    // await expect(jobRow.getByText("Pending")).toBeVisible({ timeout: 30 * 1000 });
    await expect(jobRow.getByText("Completed")).toBeVisible({ timeout: 5 * 60 * 1000 });

    const newContainerNode = await explorer.waitForContainerNode(context.database.id, newContainerId);
    expect(newContainerNode).not.toBeNull();

    // Now try to switch to existing container
    // Ensure this job name is different from the previously processed job name
    previousJobName = jobName;

    await changePartitionKeyButton.click();
    await changePkPanel.getByText("Existing container").click();
    await changePkPanel.getByLabel("Use existing container").check();
    await changePkPanel.getByText("Choose an existing container").click();

    const containerDropdownItem = await explorer.getDropdownItemByName(newContainerId, "Existing Containers");
    await containerDropdownItem.click();

    let secondJobName: string | undefined;
    await Promise.all([
      page.waitForRequest(
        (req) => {
          const requestUrl = req.url();
          if (requestUrl.includes("/dataTransferJobs") && req.method() === "PUT") {
            secondJobName = new URL(requestUrl).pathname.split("/").pop();
            return true;
          }
          return false;
        },
        { timeout: 120000 },
      ),
      changePkPanel.getByTestId("Panel/OkButton").click(),
    ]);

    const cancelButton = explorer.frame.getByRole("button", { name: "Cancel" });
    const isCancelButtonVisible = await cancelButton.isVisible().catch(() => false);
    if (isCancelButtonVisible) {
      await cancelButton.click();

      // Dismiss overlay if it appears
      const overlayFrame = explorer.frame.locator("#webpack-dev-server-client-overlay").first();
      if (await overlayFrame.count()) {
        await overlayFrame.contentFrame().getByLabel("Dismiss").click();
      }

      const cancelledJobRow = explorer.frame.getByTestId("Tab:tab0");
      await expect(cancelledJobRow.getByText("Cancelled")).toBeVisible({ timeout: 30 * 1000 });
    } else {
      const jobRow = explorer.frame.locator(".ms-ProgressIndicator-itemDescription");
      await expect(jobRow.getByText("Completed")).toBeVisible({ timeout: 5 * 60 * 1000 });
      expect(secondJobName).not.toBe(previousJobName);
    }
  });
});
