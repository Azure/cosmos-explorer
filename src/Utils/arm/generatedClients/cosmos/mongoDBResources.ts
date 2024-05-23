/* 
  AUTOGENERATED FILE
  Run "npm run generateARMClients" to regenerate
  Edting this file directly should be done with extreme caution as not to diverge from ARM REST specs

  Generated from: https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/preview/2024-02-15-preview/cosmos-db.json
*/

import { configContext } from "../../../../ConfigContext";
import { armRequest } from "../../request";
import * as Types from "./types";
const apiVersion = "2024-02-15-preview";

/* Lists the MongoDB databases under an existing Azure Cosmos DB database account. */
export async function listMongoDBDatabases(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
): Promise<Types.MongoDBDatabaseListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the MongoDB databases under an existing Azure Cosmos DB database account with the provided name. */
export async function getMongoDBDatabase(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.MongoDBDatabaseGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or updates Azure Cosmos DB MongoDB database */
export async function createUpdateMongoDBDatabase(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.MongoDBDatabaseCreateUpdateParameters,
): Promise<Types.MongoDBDatabaseGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Deletes an existing Azure Cosmos DB MongoDB database. */
export async function deleteMongoDBDatabase(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

/* Gets the RUs per second of the MongoDB database under an existing Azure Cosmos DB database account with the provided name. */
export async function getMongoDBDatabaseThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.ThroughputSettingsGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Update RUs per second of the an Azure Cosmos DB MongoDB database */
export async function updateMongoDBDatabaseThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.ThroughputSettingsUpdateParameters,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Migrate an Azure Cosmos DB MongoDB database from manual throughput to autoscale */
export async function migrateMongoDBDatabaseToAutoscale(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default/migrateToAutoscale`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}

/* Migrate an Azure Cosmos DB MongoDB database from autoscale to manual throughput */
export async function migrateMongoDBDatabaseToManualThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default/migrateToManualThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}

/* Retrieve throughput distribution for an Azure Cosmos DB MongoDB database */
export async function mongoDBDatabaseRetrieveThroughputDistribution(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.RetrieveThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default/retrieveThroughputDistribution`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Redistribute throughput for an Azure Cosmos DB MongoDB database */
export async function mongoDBDatabaseRedistributeThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.RedistributeThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default/redistributeThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Retrieve throughput distribution for an Azure Cosmos DB MongoDB container */
export async function mongoDBContainerRetrieveThroughputDistribution(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
  body: Types.RetrieveThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default/retrieveThroughputDistribution`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Redistribute throughput for an Azure Cosmos DB MongoDB container */
export async function mongoDBContainerRedistributeThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
  body: Types.RedistributeThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default/redistributeThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Lists the MongoDB collection under an existing Azure Cosmos DB database account. */
export async function listMongoDBCollections(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.MongoDBCollectionListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the MongoDB collection under an existing Azure Cosmos DB database account. */
export async function getMongoDBCollection(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
): Promise<Types.MongoDBCollectionGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or update an Azure Cosmos DB MongoDB Collection */
export async function createUpdateMongoDBCollection(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
  body: Types.MongoDBCollectionCreateUpdateParameters,
): Promise<Types.MongoDBCollectionGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Deletes an existing Azure Cosmos DB MongoDB Collection. */
export async function deleteMongoDBCollection(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
): Promise<void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

/* Merges the partitions of a MongoDB database */
export async function mongoDBDatabasePartitionMerge(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.MergeParameters,
): Promise<Types.PhysicalPartitionStorageInfoCollection | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/partitionMerge`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Merges the partitions of a MongoDB Collection */
export async function listMongoDBCollectionPartitionMerge(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
  body: Types.MergeParameters,
): Promise<Types.PhysicalPartitionStorageInfoCollection | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/partitionMerge`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Gets the RUs per second of the MongoDB collection under an existing Azure Cosmos DB database account with the provided name. */
export async function getMongoDBCollectionThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
): Promise<Types.ThroughputSettingsGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Update the RUs per second of an Azure Cosmos DB MongoDB collection */
export async function updateMongoDBCollectionThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
  body: Types.ThroughputSettingsUpdateParameters,
): Promise<Types.ThroughputSettingsGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Migrate an Azure Cosmos DB MongoDB collection from manual throughput to autoscale */
export async function migrateMongoDBCollectionToAutoscale(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default/migrateToAutoscale`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}

/* Migrate an Azure Cosmos DB MongoDB collection from autoscale to manual throughput */
export async function migrateMongoDBCollectionToManualThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  collectionName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default/migrateToManualThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}
