import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { BulkOperationType, Container, CosmosClient, Database, JSONObject } from "@azure/cosmos";
import { TestAccount, generateDatabaseNameWithTimestamp, generateUniqueName, getAccountName, getAzureCLICredentials, resourceGroupName, subscriptionId } from "./fx";

export interface TestItem {
  id: string;
  partitionKey: string;
  randomData: string;
}

const partitionCount = 4;

// If we increase this number, we need to split bulk creates into multiple batches.
// Bulk operations are limited to 100 items per partition.
const itemsPerPartition = 100;

function createTestItems(): TestItem[] {
  const items: TestItem[] = [];
  for (let i = 0; i < partitionCount; i++) {
    for (let j = 0; j < itemsPerPartition; j++) {
      const id = crypto.randomUUID();
      items.push({
        id,
        partitionKey: `partition_${i}`,
        randomData: crypto.randomUUID(),
      });
    }
  }
  return items;
}

export const TestData: TestItem[] = createTestItems();

export class TestContainerContext {
  constructor(
    public armClient: CosmosDBManagementClient,
    public client: CosmosClient,
    public database: Database,
    public container: Container,
    public testData: Map<string, TestItem>) { }

  async dispose() {
    await this.database.delete();
  }
}

export async function createTestSQLContainer(includeTestData?: boolean) {
  const databaseId = generateDatabaseNameWithTimestamp();
  const containerId = generateUniqueName("container");
  const credentials = await getAzureCLICredentials();
  const armClient = new CosmosDBManagementClient(credentials, subscriptionId);
  const accountName = getAccountName(TestAccount.SQL);
  const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);
  const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);
  const client = new CosmosClient({
    endpoint: account.documentEndpoint!,
    key: keys.primaryMasterKey,
  });
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  try {
    const { container } = await database.containers.createIfNotExists({ id: containerId, partitionKey: "/partitionKey" });
    if (includeTestData) {
      const batchCount = TestData.length / 100;
      for (let i = 0; i < batchCount; i++) {
        const batchItems = TestData.slice(i * 100, i * 100 + 100);
        await container.items.bulk(batchItems.map(item => ({
          operationType: BulkOperationType.Create,
          resourceBody: item as unknown as JSONObject,
        })));
      }
    }

    const testDataMap = new Map<string, TestItem>();
    TestData.forEach(item => testDataMap.set(item.id, item));

    return new TestContainerContext(
      armClient,
      client,
      database,
      container,
      testDataMap,
    );
  } catch (e) {
    await database.delete();
    throw e;
  }
}
