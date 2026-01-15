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
  TestAccount,
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

export const partitionCount = 4;

// If we increase this number, we need to split bulk creates into multiple batches.
// Bulk operations are limited to 100 items per partition.
export const itemsPerPartition = 100;

function createTestItems(): TestItem[] {
  const items: TestItem[] = [];
  for (let i = 0; i < partitionCount; i++) {
    for (let j = 0; j < itemsPerPartition; j++) {
      const id = createSafeRandomString(32);
      items.push({
        id,
        partitionKey: `partition_${i}`,
        randomData: createSafeRandomString(32),
      });
    }
  }
  return items;
}

// Document IDs cannot contain '/', '\', or '#'
function createSafeRandomString(byteLength: number): string {
  return crypto
    .randomBytes(byteLength)
    .toString("base64")
    .replace(/[/\\#]/g, "_");
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

export class TestDatabaseContext {
  constructor(
    public armClient: CosmosDBManagementClient,
    public client: CosmosClient,
    public database: Database,
  ) {}

  async dispose() {
    await this.database.delete();
  }
}

export interface CreateTestDBOptions {
  throughput?: number;
  maxThroughput?: number; // For autoscale
}

// Helper function to create ARM client and Cosmos client for SQL account
async function createCosmosClientForSQLAccount(
  accountType: TestAccount.SQL | TestAccount.SQLContainerCopyOnly = TestAccount.SQL,
): Promise<{ armClient: CosmosDBManagementClient; client: CosmosClient }> {
  const credentials = getAzureCLICredentials();
  const adaptedCredentials = new AzureIdentityCredentialAdapter(credentials);
  const armClient = new CosmosDBManagementClient(adaptedCredentials, subscriptionId);
  const accountName = getAccountName(accountType);
  const account = await armClient.databaseAccounts.get(resourceGroupName, accountName);

  const clientOptions: CosmosClientOptions = {
    endpoint: account.documentEndpoint!,
  };

  const rbacToken =
    accountType === TestAccount.SQL
      ? process.env.NOSQL_TESTACCOUNT_TOKEN
      : accountType === TestAccount.SQLContainerCopyOnly
      ? process.env.NOSQL_CONTAINERCOPY_TESTACCOUNT_TOKEN
      : "";

  if (rbacToken) {
    clientOptions.tokenProvider = async (): Promise<string> => {
      const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
      const authorizationToken = `${AUTH_PREFIX}${rbacToken}`;
      return authorizationToken;
    };
  } else {
    const keys = await armClient.databaseAccounts.listKeys(resourceGroupName, accountName);
    clientOptions.key = keys.primaryMasterKey;
  }

  const client = new CosmosClient(clientOptions);

  return { armClient, client };
}

export async function createTestDB(options?: CreateTestDBOptions): Promise<TestDatabaseContext> {
  const databaseId = generateUniqueName("db");
  const { armClient, client } = await createCosmosClientForSQLAccount();

  // Create database with provisioned throughput (shared throughput)
  // This checks the "Provision database throughput" option
  const { database } = await client.databases.create({
    id: databaseId,
    throughput: options?.throughput, // Manual throughput (e.g., 400)
    maxThroughput: options?.maxThroughput, // Autoscale max throughput (e.g., 1000)
  });

  return new TestDatabaseContext(armClient, client, database);
}

type createTestSqlContainerConfig = {
  includeTestData?: boolean;
  partitionKey?: string;
  databaseName?: string;
};

type createMultipleTestSqlContainerConfig = {
  containerCount?: number;
  partitionKey?: string;
  databaseName?: string;
  accountType: TestAccount.SQLContainerCopyOnly | TestAccount.SQL;
};

export async function createMultipleTestContainers({
  partitionKey = "/partitionKey",
  databaseName = "",
  containerCount = 1,
  accountType = TestAccount.SQL,
}: createMultipleTestSqlContainerConfig): Promise<TestContainerContext[]> {
  const creationPromises: Promise<TestContainerContext>[] = [];

  const databaseId = databaseName ? databaseName : generateUniqueName("db");
  const { armClient, client } = await createCosmosClientForSQLAccount(accountType);
  const { database } = await client.databases.createIfNotExists({ id: databaseId });

  try {
    for (let i = 0; i < containerCount; i++) {
      const containerId = `testcontainer_${Date.now()}_${Math.random().toString(36).substring(6)}_${i}`;
      creationPromises.push(
        database.containers.createIfNotExists({ id: containerId, partitionKey }).then(({ container }) => {
          return new TestContainerContext(armClient, client, database, container, new Map<string, TestItem>());
        }),
      );
    }
    const contexts = await Promise.all(creationPromises);
    return contexts;
  } catch (e) {
    await database.delete();
    throw e;
  }
}

export async function createTestSQLContainer({
  includeTestData = false,
  partitionKey = "/partitionKey",
  databaseName = "",
}: createTestSqlContainerConfig = {}) {
  const databaseId = databaseName ? databaseName : generateUniqueName("db");
  const containerId = "testcontainer"; // A unique container name isn't needed because the database is unique
  const { armClient, client } = await createCosmosClientForSQLAccount();

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
