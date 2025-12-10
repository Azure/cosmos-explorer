import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";
import { SQL_CONFIG, deleteDatabase, openAndFillCreateContainerPanel } from "../helpers/containerCreationHelpers";

test("SQL: New database non-shared throughput", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const containerId = generateUniqueName("container");

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  await openAndFillCreateContainerPanel(explorer, SQL_CONFIG, {
    databaseId,
    containerId,
    partitionKey: "/pk",
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);

  await expect(containerNode.element).toBeAttached();

  // Cleanup - delete database which cascades container deletion
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});

test("SQL: New database shared throughput", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const containerId = generateUniqueName("container");

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  await openAndFillCreateContainerPanel(explorer, SQL_CONFIG, {
    databaseId,
    containerId,
    partitionKey: "/pk",
    useSharedThroughput: true,
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);

  await expect(containerNode.element).toBeAttached();

  // Cleanup
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});

test("SQL: Unique keys", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const containerId = generateUniqueName("container");

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  await openAndFillCreateContainerPanel(explorer, SQL_CONFIG, {
    databaseId,
    containerId,
    partitionKey: "/pk",
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
    uniqueKey: "/email,/username",
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);

  await expect(containerNode.element).toBeAttached();

  // Cleanup
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});

test("SQL: Autoscale throughput", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const containerId = generateUniqueName("container");

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  await openAndFillCreateContainerPanel(explorer, SQL_CONFIG, {
    databaseId,
    containerId,
    partitionKey: "/pk",
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);

  await expect(containerNode.element).toBeAttached();

  // Cleanup
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});

test("SQL: Manual throughput", async ({ page }) => {
  const databaseId = generateUniqueName("db");
  const containerId = generateUniqueName("container");
  const manualThroughput = 400;

  const explorer = await DataExplorer.open(page, TestAccount.SQL);

  await openAndFillCreateContainerPanel(explorer, SQL_CONFIG, {
    databaseId,
    containerId,
    partitionKey: "/pk",
    isAutoscale: false,
    throughputValue: manualThroughput,
  });

  const databaseNode = await explorer.waitForNode(databaseId);
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);

  await expect(containerNode.element).toBeAttached();

  // Cleanup
  await deleteDatabase(explorer, databaseId);
  await expect(databaseNode.element).not.toBeAttached();
});
