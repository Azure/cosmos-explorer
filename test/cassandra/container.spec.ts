import { expect, test } from "@playwright/test";

import { DataExplorer, TEST_AUTOSCALE_THROUGHPUT_RU, TestAccount, generateUniqueName } from "../fx";
import {
  deleteContainer,
  deleteKeyspace,
  openAndFillCreateCassandraTablePanel,
} from "../helpers/containerCreationHelpers";

test("Cassandra: Keyspace and table CRUD", async ({ page }) => {
  const keyspaceId = generateUniqueName("keyspace");
  const tableId = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

  // Create
  await openAndFillCreateCassandraTablePanel(explorer, {
    keyspaceId,
    tableId,
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  const keyspaceNode = await explorer.waitForNode(keyspaceId);
  const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);
  await expect(tableNode.element).toBeAttached();

  // Delete table
  await deleteContainer(explorer, keyspaceId, tableId, "Delete Table");
  await expect(tableNode.element).not.toBeAttached();

  // Delete keyspace
  await deleteKeyspace(explorer, keyspaceId);
  await expect(keyspaceNode.element).not.toBeAttached();
});

test("Cassandra: New keyspace shared throughput", async ({ page }) => {
  const keyspaceId = generateUniqueName("keyspace");
  const tableId = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

  await openAndFillCreateCassandraTablePanel(explorer, {
    keyspaceId,
    tableId,
    useSharedThroughput: true,
  });

  const keyspaceNode = await explorer.waitForNode(keyspaceId);
  const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);

  await expect(tableNode.element).toBeAttached();

  // Cleanup
  await deleteKeyspace(explorer, keyspaceId);
  await expect(keyspaceNode.element).not.toBeAttached();
});

test("Cassandra: Manual throughput", async ({ page }) => {
  const keyspaceId = generateUniqueName("keyspace");
  const tableId = generateUniqueName("table");
  const manualThroughput = 400;

  const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

  await openAndFillCreateCassandraTablePanel(explorer, {
    keyspaceId,
    tableId,
    isAutoscale: false,
    throughputValue: manualThroughput,
  });

  const keyspaceNode = await explorer.waitForNode(keyspaceId);
  const tableNode = await explorer.waitForContainerNode(keyspaceId, tableId);

  await expect(tableNode.element).toBeAttached();

  // Cleanup
  await deleteKeyspace(explorer, keyspaceId);
  await expect(keyspaceNode.element).not.toBeAttached();
});

test("Cassandra: Multiple tables in keyspace", async ({ page }) => {
  const keyspaceId = generateUniqueName("keyspace");
  const table1Id = generateUniqueName("table");
  const table2Id = generateUniqueName("table");

  const explorer = await DataExplorer.open(page, TestAccount.Cassandra);

  // Create first table
  await openAndFillCreateCassandraTablePanel(explorer, {
    keyspaceId,
    tableId: table1Id,
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  const keyspaceNode = await explorer.waitForNode(keyspaceId);
  await explorer.waitForContainerNode(keyspaceId, table1Id);

  // Create second table in same keyspace
  await openAndFillCreateCassandraTablePanel(explorer, {
    keyspaceId,
    tableId: table2Id,
    isAutoscale: true,
    throughputValue: TEST_AUTOSCALE_THROUGHPUT_RU,
  });

  await explorer.waitForContainerNode(keyspaceId, table2Id);

  // Cleanup
  await deleteKeyspace(explorer, keyspaceId);
  await expect(keyspaceNode.element).not.toBeAttached();
});
