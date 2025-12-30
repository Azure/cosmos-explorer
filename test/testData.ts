import crypto from "crypto";

import { CosmosDBManagementClient } from "@azure/arm-cosmosdb";
import { BulkOperationType, Container, CosmosClient, CosmosClientOptions, Database, JSONObject } from "@azure/cosmos";
import { AzureIdentityCredentialAdapter } from "@azure/ms-rest-js";

import {
  generateUniqueName,
  getAccountName,
  getAzureCLICredentials,
  resourceGroupName,
  subscriptionId,
  TestAccount
} from "./fx";

export interface TestItem {
  id: string;
  partitionKey: string;
  randomData: string;
}

export interface DocumentTestCase {
  name: string;
  databaseId: string;
  containerId: string;
  documents: TestDocument[];
}

export interface TestDocument {
  documentId: string;
  partitionKeys?: PartitionKey[];
  skipCreateDelete?: boolean;
}

export interface PartitionKey {
  key: string;
  value: string | null;
}

const partitionCount = 4;

// If we increase this number, we need to split bulk creates into multiple batches.
// Bulk operations are limited to 100 items per partition.
const itemsPerPartition = 100;

function createTestItems(): TestItem[] {
  const items: TestItem[] = [];
  for (let i = 0; i < partitionCount; i++) {
    for (let j = 0; j < itemsPerPartition; j++) {
      const id = crypto.randomBytes(32).toString("base64");
      items.push({
        id,
        partitionKey: `partition_${i}`,
        randomData: crypto.randomBytes(32).toString("base64"),
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
    public testData: Map<string, TestItem>,
  ) {}

  async dispose() {
    await this.database.delete();
  }
}

type createTestSqlContainerConfig = {
  includeTestData?: boolean;
  partitionKey?: string;
  databaseName?: string;
};

export async function createTestSQLContainer({
  includeTestData = false,
  partitionKey = "/partitionKey",
  databaseName = "",
}: createTestSqlContainerConfig = {}) {
  const databaseId = databaseName ? databaseName : generateUniqueName("db");
  const containerId = "testcontainer"; // A unique container name isn't needed because the database is unique
  const credentials = getAzureCLICredentials();
  const adaptedCredentials = new AzureIdentityCredentialAdapter(credentials);
  const armClient = new CosmosDBManagementClient(adaptedCredentials, subscriptionId);
  const accountName = getAccountName(TestAccount.SQL);
  const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);

  const clientOptions: CosmosClientOptions = {
    endpoint: account.documentEndpoint!,
  };

  const nosqlAccountRbacToken = process.env.NOSQL_TESTACCOUNT_TOKEN;
  if (nosqlAccountRbacToken) {
    clientOptions.tokenProvider = async (): Promise<string> => {
      const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
      const authorizationToken = `${AUTH_PREFIX}${nosqlAccountRbacToken}`;
      return authorizationToken;
    };
  } else {
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);
    clientOptions.key = keys.primaryMasterKey;
  }

  const client = new CosmosClient(clientOptions);
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  try {
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey,
    });
    if (includeTestData) {
      const batchCount = TestData.length / 100;
      for (let i = 0; i < batchCount; i++) {
        const batchItems = TestData.slice(i * 100, i * 100 + 100);
        await container.items.bulk(
          batchItems.map((item) => ({
            operationType: BulkOperationType.Create,
            resourceBody: item as unknown as JSONObject,
          })),
        );
      }
    }

    const testDataMap = new Map<string, TestItem>();
    TestData.forEach((item) => testDataMap.set(item.id, item));

    return new TestContainerContext(armClient, client, database, container, testDataMap);
  } catch (e) {
    await database.delete();
    throw e;
  }
}

export const setPartitionKeys = (partitionKeys: PartitionKey[]) => {
  const result = {};

  partitionKeys.forEach((partitionKey) => {
    const { key: keyPath, value: keyValue } = partitionKey;
    const cleanPath = keyPath.startsWith("/") ? keyPath.slice(1) : keyPath;
    const keys = cleanPath.split("/");
    let current = result;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = keyValue;
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    });
  });

  return result;
};

export const serializeMongoToJson = (text: string) => {
  const normalized = text.replace(/ObjectId\("([0-9a-fA-F]{24})"\)/g, '"$1"');
  return JSON.parse(normalized);
};

export async function retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Retry ${i + 1}/${retries} failed: ${(error as Error).message}`);
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}
