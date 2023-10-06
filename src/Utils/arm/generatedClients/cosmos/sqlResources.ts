/* 
  AUTOGENERATED FILE
  Run "npm run generateARMClients" to regenerate
  Edting this file directly should be done with extreme caution as not to diverge from ARM REST specs

  Generated from: https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/preview/2023-09-15-preview/cosmos-db.json
*/

import { armRequest } from "../../request";
import * as Types from "./types";
import { configContext } from "../../../../ConfigContext";
const apiVersion = "2023-09-15-preview";

/* Lists the SQL databases under an existing Azure Cosmos DB database account. */
export async function listSqlDatabases(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
): Promise<Types.SqlDatabaseListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the SQL database under an existing Azure Cosmos DB database account with the provided name. */
export async function getSqlDatabase(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.SqlDatabaseGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or update an Azure Cosmos DB SQL database */
export async function createUpdateSqlDatabase(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.SqlDatabaseCreateUpdateParameters,
): Promise<Types.SqlDatabaseGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Deletes an existing Azure Cosmos DB SQL database. */
export async function deleteSqlDatabase(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

/* Gets the RUs per second of the SQL database under an existing Azure Cosmos DB database account with the provided name. */
export async function getSqlDatabaseThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.ThroughputSettingsGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Update RUs per second of an Azure Cosmos DB SQL database */
export async function updateSqlDatabaseThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.ThroughputSettingsUpdateParameters,
): Promise<Types.ThroughputSettingsGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Migrate an Azure Cosmos DB SQL database from manual throughput to autoscale */
export async function migrateSqlDatabaseToAutoscale(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default/migrateToAutoscale`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}

/* Migrate an Azure Cosmos DB SQL database from autoscale to manual throughput */
export async function migrateSqlDatabaseToManualThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default/migrateToManualThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}

/* Lists the ClientEncryptionKeys under an existing Azure Cosmos DB SQL database. */
export async function listClientEncryptionKeys(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.ClientEncryptionKeysListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/clientEncryptionKeys`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the ClientEncryptionKey under an existing Azure Cosmos DB SQL database. */
export async function getClientEncryptionKey(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  clientEncryptionKeyName: string,
): Promise<Types.ClientEncryptionKeyGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/clientEncryptionKeys/${clientEncryptionKeyName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or update a ClientEncryptionKey. This API is meant to be invoked via tools such as the Azure Powershell (instead of directly). */
export async function createUpdateClientEncryptionKey(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  clientEncryptionKeyName: string,
  body: Types.ClientEncryptionKeyCreateUpdateParameters,
): Promise<Types.ClientEncryptionKeyGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/clientEncryptionKeys/${clientEncryptionKeyName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Lists the SQL container under an existing Azure Cosmos DB database account. */
export async function listSqlContainers(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
): Promise<Types.SqlContainerListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the SQL container under an existing Azure Cosmos DB database account. */
export async function getSqlContainer(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<Types.SqlContainerGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or update an Azure Cosmos DB SQL container */
export async function createUpdateSqlContainer(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  body: Types.SqlContainerCreateUpdateParameters,
): Promise<Types.SqlContainerGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Deletes an existing Azure Cosmos DB SQL container. */
export async function deleteSqlContainer(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

/* Merges the partitions of a SQL database */
export async function sqlDatabasePartitionMerge(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.MergeParameters,
): Promise<Types.PhysicalPartitionStorageInfoCollection | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/partitionMerge`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Merges the partitions of a SQL Container */
export async function listSqlContainerPartitionMerge(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  body: Types.MergeParameters,
): Promise<Types.PhysicalPartitionStorageInfoCollection | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/partitionMerge`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Gets the RUs per second of the SQL container under an existing Azure Cosmos DB database account. */
export async function getSqlContainerThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<Types.ThroughputSettingsGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Update RUs per second of an Azure Cosmos DB SQL container */
export async function updateSqlContainerThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  body: Types.ThroughputSettingsUpdateParameters,
): Promise<Types.ThroughputSettingsGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Migrate an Azure Cosmos DB SQL container from manual throughput to autoscale */
export async function migrateSqlContainerToAutoscale(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default/migrateToAutoscale`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}

/* Migrate an Azure Cosmos DB SQL container from autoscale to manual throughput */
export async function migrateSqlContainerToManualThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<Types.ThroughputSettingsGetResults | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default/migrateToManualThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion });
}

/* Retrieve throughput distribution for an Azure Cosmos DB SQL database */
export async function sqlDatabaseRetrieveThroughputDistribution(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.RetrieveThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default/retrieveThroughputDistribution`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Redistribute throughput for an Azure Cosmos DB SQL database */
export async function sqlDatabaseRedistributeThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  body: Types.RedistributeThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default/redistributeThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Retrieve throughput distribution for an Azure Cosmos DB SQL container */
export async function sqlContainerRetrieveThroughputDistribution(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  body: Types.RetrieveThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default/retrieveThroughputDistribution`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Redistribute throughput for an Azure Cosmos DB SQL container */
export async function sqlContainerRedistributeThroughput(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  body: Types.RedistributeThroughputParameters,
): Promise<Types.PhysicalPartitionThroughputInfoResult | void | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default/redistributeThroughput`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "POST", apiVersion, body });
}

/* Lists the SQL storedProcedure under an existing Azure Cosmos DB database account. */
export async function listSqlStoredProcedures(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<Types.SqlStoredProcedureListResult | Types.CloudError> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the SQL storedProcedure under an existing Azure Cosmos DB database account. */
export async function getSqlStoredProcedure(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  storedProcedureName: string,
): Promise<Types.SqlStoredProcedureGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures/${storedProcedureName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or update an Azure Cosmos DB SQL storedProcedure */
export async function createUpdateSqlStoredProcedure(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  storedProcedureName: string,
  body: Types.SqlStoredProcedureCreateUpdateParameters,
): Promise<Types.SqlStoredProcedureGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures/${storedProcedureName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Deletes an existing Azure Cosmos DB SQL storedProcedure. */
export async function deleteSqlStoredProcedure(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  storedProcedureName: string,
): Promise<void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures/${storedProcedureName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

/* Lists the SQL userDefinedFunction under an existing Azure Cosmos DB database account. */
export async function listSqlUserDefinedFunctions(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<Types.SqlUserDefinedFunctionListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the SQL userDefinedFunction under an existing Azure Cosmos DB database account. */
export async function getSqlUserDefinedFunction(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  userDefinedFunctionName: string,
): Promise<Types.SqlUserDefinedFunctionGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions/${userDefinedFunctionName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or update an Azure Cosmos DB SQL userDefinedFunction */
export async function createUpdateSqlUserDefinedFunction(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  userDefinedFunctionName: string,
  body: Types.SqlUserDefinedFunctionCreateUpdateParameters,
): Promise<Types.SqlUserDefinedFunctionGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions/${userDefinedFunctionName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Deletes an existing Azure Cosmos DB SQL userDefinedFunction. */
export async function deleteSqlUserDefinedFunction(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  userDefinedFunctionName: string,
): Promise<void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions/${userDefinedFunctionName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}

/* Lists the SQL trigger under an existing Azure Cosmos DB database account. */
export async function listSqlTriggers(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
): Promise<Types.SqlTriggerListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Gets the SQL trigger under an existing Azure Cosmos DB database account. */
export async function getSqlTrigger(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  triggerName: string,
): Promise<Types.SqlTriggerGetResults> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers/${triggerName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Create or update an Azure Cosmos DB SQL trigger */
export async function createUpdateSqlTrigger(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  triggerName: string,
  body: Types.SqlTriggerCreateUpdateParameters,
): Promise<Types.SqlTriggerGetResults | void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers/${triggerName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body });
}

/* Deletes an existing Azure Cosmos DB SQL trigger. */
export async function deleteSqlTrigger(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseName: string,
  containerName: string,
  triggerName: string,
): Promise<void> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers/${triggerName}`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion });
}
