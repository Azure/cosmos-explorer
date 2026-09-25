import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { expect, Page, test } from "@playwright/test";
import {
  CommandBarButton,
  DataExplorer,
  generateUniqueName,
  getAccountName,
  getAzureCLICredentials,
  ONE_MINUTE_MS,
  resourceGroupName,
  subscriptionId,
  TestAccount,
} from "../fx";

// The test harness URL contains authentication tokens.
test.use({ trace: "off", video: "off", actionTimeout: 30000 });

test.describe("Full-text stopwords", () => {
  let armClient: CosmosDBManagementClient;
  let accountName: string;
  let databaseId: string | undefined;
  let explorer: DataExplorer;
  const containerId = "stopwords";
  const additionalWords = "cosmos\nCatalog\ncosmos";
  const wordsToKeep = "the\nand";
  const inheritanceLabel = "Inherit the container's language and stopwords";

  const openPolicy = async (page: Page): Promise<DataExplorer> => {
    if (!databaseId) {
      throw new Error("The stopword test database has not been created.");
    }
    const current = await DataExplorer.open(page, TestAccount.SQL);
    const containerNode = await current.waitForContainerNode(databaseId, containerId);
    await containerNode.expand();
    await current.frame.getByTestId(`TreeNodeContainer:${databaseId}/${containerId}/Scale & Settings`).press("Enter");
    await current.frame.getByRole("tab", { name: "Container Policies", exact: true }).press("Enter");
    await current.frame.getByRole("tab", { name: "Full Text Policy", exact: true }).press("Enter");
    return current;
  };

  const savePolicy = async (): Promise<void> => {
    const save = explorer.commandBarButton(CommandBarButton.Save);
    await expect(save).toBeEnabled();
    const [response] = await Promise.all([
      explorer.frame
        .page()
        .waitForResponse(
          (response) =>
            response.request().method() === "PUT" &&
            new URL(response.url()).pathname.endsWith(`/sqlDatabases/${databaseId}/containers/${containerId}`),
          { timeout: 2 * ONE_MINUTE_MS },
        ),
      save.click(),
    ]);
    expect(response.ok(), `Saving the policy returned HTTP ${response.status()}`).toBe(true);
    await expect(explorer.getConsoleHeaderStatus()).toContainText(`Successfully updated container ${containerId}`, {
      timeout: 2 * ONE_MINUTE_MS,
    });
    await expect(save).toBeDisabled({ timeout: 2 * ONE_MINUTE_MS });
  };

  test.beforeEach(async ({ page }) => {
    databaseId = undefined;
    armClient = new CosmosDBManagementClient(getAzureCLICredentials(), subscriptionId);
    accountName = getAccountName(TestAccount.SQL);
    const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
    expect(
      account.capabilities?.map(({ name }) => name),
      "The SQL CI account must enable EnableNoSQLFullTextSearchPreviewFeatures.",
    ).toContain("EnableNoSQLFullTextSearchPreviewFeatures");

    const newDatabaseId = generateUniqueName("stopwords", { length: 8 });
    for await (const database of armClient.sqlResources.listSqlDatabases(resourceGroupName, accountName)) {
      expect(database.name).not.toBe(newDatabaseId);
    }
    databaseId = newDatabaseId;
    await armClient.sqlResources.beginCreateUpdateSqlDatabaseAndWait(resourceGroupName, accountName, databaseId, {
      resource: { id: databaseId },
      options: {},
    });
    await armClient.sqlResources.beginCreateUpdateSqlContainerAndWait(
      resourceGroupName,
      accountName,
      databaseId,
      containerId,
      {
        resource: { id: containerId, partitionKey: { paths: ["/pk"], kind: "Hash" } },
        options: { throughput: 400 },
      },
    );

    explorer = await openPolicy(page);
    await explorer.frame.getByRole("button", { name: "Create new full text search policy" }).click();
    await explorer.frame.getByRole("button", { name: "Add full text path", exact: true }).click();
    await explorer.frame.getByRole("textbox", { name: /^Path/ }).fill("/text");
    await explorer.frame.getByRole("checkbox", { name: inheritanceLabel }).check();
    const defaults = explorer.frame.getByRole("group", { name: "Default stopwords" });
    await defaults.getByRole("combobox", { name: "Stopword list" }).click();
    await explorer.frame.getByRole("option", { name: "None", exact: true }).click();
    await defaults.getByRole("textbox", { name: "Additional stopwords" }).fill(additionalWords);
    await defaults.getByRole("textbox", { name: "Words to keep" }).fill(wordsToKeep);
  });

  test.afterEach(async () => {
    test.setTimeout(2 * ONE_MINUTE_MS);
    if (!databaseId) {
      return;
    }
    await armClient.sqlResources
      .beginDeleteSqlDatabaseAndWait(resourceGroupName, accountName, databaseId)
      .catch((error: unknown) => {
        if (!error || typeof error !== "object" || !("statusCode" in error) || error.statusCode !== 404) {
          throw error;
        }
      });
    databaseId = undefined;
  });

  test("saves multiword defaults and an inherited path across reload", async ({ page }) => {
    await savePolicy();
    explorer = await openPolicy(page);
    const defaults = explorer.frame.getByRole("group", { name: "Default stopwords" });
    await expect(explorer.frame.getByRole("combobox", { name: /^Default language/ })).toContainText("English (US)");
    await expect(defaults.getByRole("combobox", { name: "Stopword list" })).toContainText("None");
    await expect(defaults.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue(additionalWords);
    await expect(defaults.getByRole("textbox", { name: "Words to keep" })).toHaveValue(wordsToKeep);
    await expect(explorer.frame.getByRole("textbox", { name: /^Path/ })).toHaveValue("/text");
    await expect(explorer.frame.getByRole("checkbox", { name: inheritanceLabel })).toBeChecked();
    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
  });

  for (const label of ["Additional stopwords", "Words to keep"]) {
    test(`blocks invalid entries in ${label} until corrected`, async () => {
      const defaults = explorer.frame.getByRole("group", { name: "Default stopwords" });
      const field = defaults.getByRole("textbox", { name: label });
      const original = await field.inputValue();
      await field.fill(`${original}\ninvalid phrase`);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(defaults.getByRole("alert")).toBeVisible();
      await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
      await field.fill(original);
      await expect(field).not.toHaveAttribute("aria-invalid", "true");
      await expect(defaults.getByRole("alert")).toHaveCount(0);
      await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeEnabled();
    });
  }

  test("discards unsaved language, preset, word-list, and path changes", async ({ page }) => {
    await savePolicy();
    const defaults = explorer.frame.getByRole("group", { name: "Default stopwords" });
    await explorer.frame.getByRole("combobox", { name: /^Default language/ }).click();
    await explorer.frame.getByRole("option", { name: "French", exact: true }).click();
    await defaults.getByRole("textbox", { name: "Additional stopwords" }).fill("galaxy\nnebula");
    await defaults.getByRole("textbox", { name: "Words to keep" }).fill("le\nla");
    await defaults.getByRole("combobox", { name: "Stopword list" }).click();
    await explorer.frame.getByRole("option", { name: "Use service default (clear custom words)", exact: true }).click();
    await explorer.frame.getByRole("textbox", { name: /^Path/ }).fill("/changed");
    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeEnabled();
    await explorer.frame.getByRole("menuitem", { name: "Discard", exact: true }).click();
    await expect(defaults.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue(additionalWords);
    await expect(defaults.getByRole("textbox", { name: "Words to keep" })).toHaveValue(wordsToKeep);
    await expect(defaults.getByRole("combobox", { name: "Stopword list" })).toContainText("None");
    await expect(explorer.frame.getByRole("combobox", { name: /^Default language/ })).toContainText("English (US)");
    await expect(explorer.frame.getByRole("textbox", { name: /^Path/ })).toHaveValue("/text");
    await expect(explorer.commandBarButton(CommandBarButton.Save)).toBeDisabled();
    explorer = await openPolicy(page);
    await expect(
      explorer.frame
        .getByRole("group", { name: "Default stopwords" })
        .getByRole("textbox", { name: "Additional stopwords" }),
    ).toHaveValue(additionalWords);
    await expect(explorer.frame.getByRole("textbox", { name: /^Path/ })).toHaveValue("/text");
  });

  test("saves a path override and resets it to inherited defaults", async ({ page }) => {
    await explorer.frame.getByRole("checkbox", { name: inheritanceLabel }).uncheck();
    await explorer.frame.getByRole("combobox", { name: /^Language\b/ }).click();
    await explorer.frame.getByRole("option", { name: "French", exact: true }).click();
    const override = explorer.frame.getByRole("group", { name: "Stopwords for /text" });
    await override.getByRole("combobox", { name: "Stopword list" }).click();
    await explorer.frame.getByRole("option", { name: "None", exact: true }).click();
    await override.getByRole("textbox", { name: "Additional stopwords" }).fill("galaxy\nnebula");
    await override.getByRole("textbox", { name: "Words to keep" }).fill("le\nla");
    await savePolicy();
    explorer = await openPolicy(page);
    const persisted = explorer.frame.getByRole("group", { name: "Stopwords for /text" });
    await expect(explorer.frame.getByRole("combobox", { name: /^Language\b/ })).toContainText("French");
    await expect(persisted.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue("galaxy\nnebula");
    await expect(persisted.getByRole("textbox", { name: "Words to keep" })).toHaveValue("le\nla");
    const defaults = explorer.frame.getByRole("group", { name: "Default stopwords" });
    await expect(defaults.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue(additionalWords);
    await expect(defaults.getByRole("textbox", { name: "Words to keep" })).toHaveValue(wordsToKeep);
    await explorer.frame.getByRole("checkbox", { name: inheritanceLabel }).check();
    await expect(persisted).toHaveCount(0);
    await savePolicy();
    explorer = await openPolicy(page);
    await expect(explorer.frame.getByRole("checkbox", { name: inheritanceLabel })).toBeChecked();
    await expect(explorer.frame.getByRole("group", { name: "Stopwords for /text" })).toHaveCount(0);
    await explorer.frame.getByRole("checkbox", { name: inheritanceLabel }).uncheck();
    const reset = explorer.frame.getByRole("group", { name: "Stopwords for /text" });
    await expect(reset.getByRole("textbox", { name: "Additional stopwords" })).toHaveValue("");
    await expect(reset.getByRole("textbox", { name: "Words to keep" })).toHaveValue("");
  });
});
