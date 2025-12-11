import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";
import {
  MONGO32_CONFIG,
  MONGO_CONFIG,
  deleteContainer,
  deleteDatabase,
  openAndFillCreateContainerPanel,
} from "../helpers/containerCreationHelpers";

(
  [
    ["latest API version", MONGO_CONFIG],
    ["3.2 API", MONGO32_CONFIG],
  ] as [string, typeof MONGO_CONFIG][]
).forEach(([apiVersionDescription, config]) => {
  test(`Mongo: Database and collection CRUD using ${apiVersionDescription}`, async ({ page }) => {
    const databaseId = generateUniqueName("db");
    const collectionId = generateUniqueName("collection");

    const explorer = await DataExplorer.open(page, config.account);

    // Create
    await openAndFillCreateContainerPanel(explorer, config, {
      databaseId,
      containerId: collectionId,
      partitionKey: "pk",
      isAutoscale: true,
      throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
    });

    const databaseNode = await explorer.waitForNode(databaseId);
    const collectionNode = await explorer.waitForContainerNode(databaseId, collectionId);
    await expect(collectionNode.element).toBeAttached();

    // Delete collection
    await deleteContainer(explorer, databaseId, collectionId, "Delete Collection");
    await expect(collectionNode.element).not.toBeAttached();

    // Delete database
    await deleteDatabase(explorer, databaseId);
    await expect(databaseNode.element).not.toBeAttached();
  });
});

test("Mongo: New database shared throughput", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const collectionId = generateUniqueName("collection");

  const explorer = await DataExplorer.open(page, TestAccount.Mongo);

  await openAndFillCreateContainerPanel(explorer, MONGO_CONFIG, {
    databaseId,
    containerId: collectionId,
    partitionKey: "pk",
    useSharedThroughput: true,
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const collectionNode = await explorer.waitForContainerNode(databaseId, collectionId);

  await expect(collectionNode.element).toBeAttached();

  // Cleanup
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});

test("Mongo: Unique keys", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const collectionId = generateUniqueName("collection");

  const explorer = await DataExplorer.open(page, TestAccount.Mongo);

  await openAndFillCreateContainerPanel(explorer, MONGO_CONFIG, {
    databaseId,
    containerId: collectionId,
    partitionKey: "pk",
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
    uniqueKey: "email",
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const collectionNode = await explorer.waitForContainerNode(databaseId, collectionId);

  await expect(collectionNode.element).toBeAttached();

  // Cleanup
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});

test("Mongo: Manual throughput", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const collectionId = generateUniqueName("collection");
  const manualThroughput = 400;

  const explorer = await DataExplorer.open(page, TestAccount.Mongo);

  await openAndFillCreateContainerPanel(explorer, MONGO_CONFIG, {
    databaseId,
    containerId: collectionId,
    partitionKey: "pk",
    isAutoscale: false,
    throughputValue: manualThroughput,
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const collectionNode = await explorer.waitForContainerNode(databaseId, collectionId);

  await expect(collectionNode.element).toBeAttached();

  // Cleanup
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});
