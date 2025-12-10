import { Locator } from "@playwright/test";
import { DataExplorer, TestAccount } from "../fx";

/**
 * Container creation test API configuration
 * Defines labels and selectors specific to each Cosmos DB API
 */
export interface ApiConfig {
  account: TestAccount;
  commandLabel: string; // "New Container", "New Collection", "New Graph", "New Table"
  containerIdLabel: string; // "Container id", "Collection id", "Graph id", "Table id"
  panelTitle: string; // "New Container", "New Collection", "New Graph", "Add Table"
  databaseIdPlaceholder: string; // "Type a new keyspace id" for Cassandra, etc.
  containerIdPlaceholder: string;
  partitionKeyLabel?: string; // "Partition key", "Shard key", or undefined for Tables
  partitionKeyPlaceholder?: string;
  confirmDeleteLabel: string; // "Confirm by typing the [container/collection/table/graph] id"
  databaseName?: string; // "TablesDB" for Tables, undefined for others
  supportsUniqueKeys: boolean;
}

export const SQL_CONFIG: ApiConfig = {
  account: TestAccount.SQL,
  commandLabel: "New Container",
  containerIdLabel: "Container id, Example Container1",
  panelTitle: "New Container",
  databaseIdPlaceholder: "Type a new database id",
  containerIdPlaceholder: "e.g., Container1",
  partitionKeyLabel: "Partition key",
  partitionKeyPlaceholder: "/pk",
  confirmDeleteLabel: "Confirm by typing the container id",
  supportsUniqueKeys: true,
};

export const MONGO_CONFIG: ApiConfig = {
  account: TestAccount.Mongo,
  commandLabel: "New Collection",
  containerIdLabel: "Collection id, Example Collection1",
  panelTitle: "New Collection",
  databaseIdPlaceholder: "Type a new database id",
  containerIdPlaceholder: "e.g., Collection1",
  partitionKeyLabel: "Shard key",
  partitionKeyPlaceholder: "pk",
  confirmDeleteLabel: "Confirm by typing the collection id",
  supportsUniqueKeys: true,
};

export const MONGO32_CONFIG: ApiConfig = {
  ...MONGO_CONFIG,
  account: TestAccount.Mongo32,
};

export const GREMLIN_CONFIG: ApiConfig = {
  account: TestAccount.Gremlin,
  commandLabel: "New Graph",
  containerIdLabel: "Graph id, Example Graph1",
  panelTitle: "New Graph",
  databaseIdPlaceholder: "Type a new database id",
  containerIdPlaceholder: "e.g., Graph1",
  partitionKeyLabel: "Partition key",
  partitionKeyPlaceholder: "/pk",
  confirmDeleteLabel: "Confirm by typing the graph id",
  supportsUniqueKeys: false,
};

export const TABLES_CONFIG: ApiConfig = {
  account: TestAccount.Tables,
  commandLabel: "New Table",
  containerIdLabel: "Table id, Example Table1",
  panelTitle: "New Table",
  databaseIdPlaceholder: "", // Not used
  containerIdPlaceholder: "e.g., Table1",
  confirmDeleteLabel: "Confirm by typing the table id",
  databaseName: "TablesDB",
  supportsUniqueKeys: false,
};

export const CASSANDRA_CONFIG: ApiConfig = {
  account: TestAccount.Cassandra,
  commandLabel: "New Table",
  containerIdLabel: "Enter table Id",
  panelTitle: "Add Table",
  databaseIdPlaceholder: "Type a new keyspace id",
  containerIdPlaceholder: "Enter table Id",
  confirmDeleteLabel: "Confirm by typing the table id",
  supportsUniqueKeys: false,
};

/**
 * Fills database selection in the panel
 * Automatically selects "Create new" and fills the database ID
 */
export async function fillDatabaseSelection(panel: Locator, databaseId: string): Promise<void> {
  // Wait for the radio button to be visible and click it (more reliable than check for custom styled radios)
  await panel.getByTestId("AddCollectionPanel/DatabaseRadio:CreateNew").waitFor({ state: "visible" });
  await panel.getByTestId("AddCollectionPanel/DatabaseRadio:CreateNew").click();
  await panel.getByTestId("AddCollectionPanel/DatabaseId").fill(databaseId);
}

/**
 * Fills existing database selection
 * Selects "Use existing" and clicks the dropdown to select the database
 */
export async function fillExistingDatabaseSelection(panel: Locator, databaseId: string): Promise<void> {
  await panel.getByTestId("AddCollectionPanel/DatabaseRadio:UseExisting").waitFor({ state: "visible" });
  await panel.getByTestId("AddCollectionPanel/DatabaseRadio:UseExisting").click();
  await panel.getByTestId("AddCollectionPanel/ExistingDatabaseDropdown").click();
  await panel.locator(`text=${databaseId}`).click();
}

/**
 * Fills container/collection/graph/table details
 */
export async function fillContainerDetails(
  panel: Locator,
  containerId: string,
  partitionKey: string | undefined,
): Promise<void> {
  await panel.getByTestId("AddCollectionPanel/CollectionId").fill(containerId);

  if (partitionKey) {
    await panel.getByTestId("AddCollectionPanel/PartitionKey").first().fill(partitionKey);
  }
}

/**
 * Fills Cassandra-specific table details
 * (keyspace and table IDs are separate for Cassandra)
 */
export async function fillCassandraTableDetails(panel: Locator, keyspaceId: string, tableId: string): Promise<void> {
  await panel.getByTestId("AddCollectionPanel/DatabaseId").fill(keyspaceId);
  await panel.getByTestId("AddCollectionPanel/CollectionId").fill(tableId);
}

/**
 * Sets throughput mode and value
 * @param isAutoscale - if true, sets autoscale mode; if false, sets manual mode
 */
export async function setThroughput(panel: Locator, isAutoscale: boolean, throughputValue: number): Promise<void> {
  const testId = isAutoscale ? "ThroughputInput/ThroughputMode:Autoscale" : "ThroughputInput/ThroughputMode:Manual";
  await panel.getByTestId(testId).check();

  if (isAutoscale) {
    await panel.getByTestId("ThroughputInput/AutoscaleRUInput").fill(throughputValue.toString());
  } else {
    await panel.getByTestId("ThroughputInput/ManualThroughputInput").fill(throughputValue.toString());
  }
}

/**
 * Adds a unique key to the container (SQL/Mongo only)
 */
export async function addUniqueKey(panel: Locator, uniqueKeyValue: string): Promise<void> {
  // Scroll to find the unique key section
  await panel.getByTestId("AddCollectionPanel/UniqueKeysSection").scrollIntoViewIfNeeded();

  // Click the "Add unique key" button
  await panel.getByTestId("AddCollectionPanel/AddUniqueKeyButton").click();

  // Fill in the unique key value
  const uniqueKeyInput = panel.getByTestId("AddCollectionPanel/UniqueKey").first();
  await uniqueKeyInput.fill(uniqueKeyValue);
}

/**
 * Deletes a database and waits for it to disappear from the tree
 */
export async function deleteDatabase(
  explorer: DataExplorer,
  databaseId: string,
  databaseNodeName: string = databaseId,
): Promise<void> {
  const databaseNode = await explorer.waitForNode(databaseNodeName);
  await databaseNode.openContextMenu();
  await databaseNode.contextMenuItem("Delete Database").click();
  await explorer.whilePanelOpen(
    "Delete Database",
    async (panel: Locator, okButton: Locator) => {
      await panel.getByTestId("DeleteDatabaseConfirmationPanel/ConfirmInput").fill(databaseId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );
}

/**
 * Deletes a keyspace (Cassandra only)
 */
export async function deleteKeyspace(explorer: DataExplorer, keyspaceId: string): Promise<void> {
  const keyspaceNode = await explorer.waitForNode(keyspaceId);
  await keyspaceNode.openContextMenu();
  await keyspaceNode.contextMenuItem("Delete Keyspace").click();
  await explorer.whilePanelOpen(
    "Delete Keyspace",
    async (panel: Locator, okButton: Locator) => {
      await panel.getByTestId("DeleteCollectionConfirmationPane/ConfirmInput").fill(keyspaceId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );
}

/**
 * Deletes a container/collection/graph/table
 */
export async function deleteContainer(
  explorer: DataExplorer,
  databaseId: string,
  containerId: string,
  deleteLabel: string, // "Delete Container", "Delete Collection", etc.
): Promise<void> {
  const containerNode = await explorer.waitForContainerNode(databaseId, containerId);
  await containerNode.openContextMenu();
  await containerNode.contextMenuItem(deleteLabel).click();
  await explorer.whilePanelOpen(
    deleteLabel,
    async (panel: Locator, okButton: Locator) => {
      // All container/collection/graph/table deletes use same panel with test ID
      await panel.getByTestId("DeleteCollectionConfirmationPane/ConfirmInput").fill(containerId);
      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );
}

/**
 * Opens the create container dialog and fills in the form based on scenario
 */
export async function openAndFillCreateContainerPanel(
  explorer: DataExplorer,
  config: ApiConfig,
  options: {
    databaseId: string;
    containerId: string;
    partitionKey?: string;
    useExistingDatabase?: boolean;
    isAutoscale?: boolean;
    throughputValue?: number;
    uniqueKey?: string;
    useSharedThroughput?: boolean;
  },
): Promise<void> {
  await explorer.globalCommandButton(config.commandLabel).click();
  await explorer.whilePanelOpen(
    config.panelTitle,
    async (panel, okButton) => {
      // Database selection
      if (options.useExistingDatabase) {
        await fillExistingDatabaseSelection(panel, options.databaseId);
      } else {
        await fillDatabaseSelection(panel, options.databaseId);
      }

      // Shared throughput checkbox (if applicable)
      if (options.useSharedThroughput) {
        await panel
          .getByTestId("AddCollectionPanel/SharedThroughputCheckbox")
          .getByRole("checkbox")
          .check({ force: true });
      }

      // Container details
      await fillContainerDetails(panel, options.containerId, options.partitionKey);

      // Throughput (only if not using shared throughput)
      if (!options.useSharedThroughput) {
        const isAutoscale = options.isAutoscale !== false;
        const throughputValue = options.throughputValue || 1000;
        await setThroughput(panel, isAutoscale, throughputValue);
      }

      // Unique keys (if applicable)
      if (options.uniqueKey && config.supportsUniqueKeys) {
        await addUniqueKey(panel, options.uniqueKey);
      }

      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );
}

/**
 * Opens the create table dialog for Cassandra and fills in the form
 * Cassandra has a different UI pattern than other APIs
 */
export async function openAndFillCreateCassandraTablePanel(
  explorer: DataExplorer,
  options: {
    keyspaceId: string;
    tableId: string;
    isAutoscale?: boolean;
    throughputValue?: number;
    useSharedThroughput?: boolean;
  },
): Promise<void> {
  await explorer.globalCommandButton("New Table").click();
  await explorer.whilePanelOpen(
    "Add Table",
    async (panel, okButton) => {
      // Fill Cassandra-specific table details
      await fillCassandraTableDetails(panel, options.keyspaceId, options.tableId);

      // Shared throughput checkbox (if applicable)
      if (options.useSharedThroughput) {
        await panel
          .getByTestId("AddCollectionPanel/SharedThroughputCheckbox")
          .getByRole("checkbox")
          .check({ force: true });
      }

      // Throughput (only if not using shared throughput)
      if (!options.useSharedThroughput) {
        const isAutoscale = options.isAutoscale !== false;
        const throughputValue = options.throughputValue || 1000;
        await setThroughput(panel, isAutoscale, throughputValue);
      }

      await okButton.click();
    },
    { closeTimeout: 5 * 60 * 1000 },
  );
}
