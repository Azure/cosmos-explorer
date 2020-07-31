/* 
  AUTOGENERATED FILE
  Do not manually edit
  Run "npm run generateARMClients" to regenerate
*/

import { armRequest } from "../../request"
import * as Types from "./types"
import { config } from "../../../../Config";
const apiVersion = "2020-04-01"


          /* Lists the Gremlin databases under an existing Azure Cosmos DB database account. */
          export async function listGremlinDatabases (
            subscriptionId: string,
resourceGroupName: string,
accountName: string
            
          ) : Promise<Types.GremlinDatabaseListResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Gets the Gremlin databases under an existing Azure Cosmos DB database account with the provided name. */
          export async function getGremlinDatabase (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            
          ) : Promise<Types.GremlinDatabaseGetResults> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Create or update an Azure Cosmos DB Gremlin database */
          export async function createUpdateGremlinDatabase (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            ,body: Types.GremlinDatabaseCreateUpdateParameters
          ) : Promise<Types.GremlinDatabaseGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "PUT", apiVersion, body: JSON.stringify(body) })
          }
          
          /* Deletes an existing Azure Cosmos DB Gremlin database. */
          export async function deleteGremlinDatabase (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            
          ) : Promise<void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "DELETE", apiVersion,  })
          }
          
          /* Gets the RUs per second of the Gremlin database under an existing Azure Cosmos DB database account with the provided name. */
          export async function getGremlinDatabaseThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            
          ) : Promise<Types.ThroughputSettingsGetResults> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/throughputSettings/default`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Update RUs per second of an Azure Cosmos DB Gremlin database */
          export async function updateGremlinDatabaseThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            ,body: Types.ThroughputSettingsUpdateParameters
          ) : Promise<Types.ThroughputSettingsGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/throughputSettings/default`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "PUT", apiVersion, body: JSON.stringify(body) })
          }
          
          /* Migrate an Azure Cosmos DB Gremlin database from manual throughput to autoscale */
          export async function migrateGremlinDatabaseToAutoscale (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            
          ) : Promise<Types.ThroughputSettingsGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/throughputSettings/default/migrateToAutoscale`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "POST", apiVersion,  })
          }
          
          /* Migrate an Azure Cosmos DB Gremlin database from autoscale to manual throughput */
          export async function migrateGremlinDatabaseToManualThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            
          ) : Promise<Types.ThroughputSettingsGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/throughputSettings/default/migrateToManualThroughput`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "POST", apiVersion,  })
          }
          
          /* Lists the Gremlin graph under an existing Azure Cosmos DB database account. */
          export async function listGremlinGraphs (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string
            
          ) : Promise<Types.GremlinGraphListResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Gets the Gremlin graph under an existing Azure Cosmos DB database account. */
          export async function getGremlinGraph (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string,
graphName: string
            
          ) : Promise<Types.GremlinGraphGetResults> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Create or update an Azure Cosmos DB Gremlin graph */
          export async function createUpdateGremlinGraph (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string,
graphName: string
            ,body: Types.GremlinGraphCreateUpdateParameters
          ) : Promise<Types.GremlinGraphGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "PUT", apiVersion, body: JSON.stringify(body) })
          }
          
          /* Deletes an existing Azure Cosmos DB Gremlin graph. */
          export async function deleteGremlinGraph (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string,
graphName: string
            
          ) : Promise<void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "DELETE", apiVersion,  })
          }
          
          /* Gets the Gremlin graph throughput under an existing Azure Cosmos DB database account with the provided name. */
          export async function getGremlinGraphThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string,
graphName: string
            
          ) : Promise<Types.ThroughputSettingsGetResults> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}/throughputSettings/default`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Update RUs per second of an Azure Cosmos DB Gremlin graph */
          export async function updateGremlinGraphThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string,
graphName: string
            ,body: Types.ThroughputSettingsUpdateParameters
          ) : Promise<Types.ThroughputSettingsGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}/throughputSettings/default`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "PUT", apiVersion, body: JSON.stringify(body) })
          }
          
          /* Migrate an Azure Cosmos DB Gremlin graph from manual throughput to autoscale */
          export async function migrateGremlinGraphToAutoscale (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string,
graphName: string
            
          ) : Promise<Types.ThroughputSettingsGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}/throughputSettings/default/migrateToAutoscale`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "POST", apiVersion,  })
          }
          
          /* Migrate an Azure Cosmos DB Gremlin graph from autoscale to manual throughput */
          export async function migrateGremlinGraphToManualThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseName: string,
graphName: string
            
          ) : Promise<Types.ThroughputSettingsGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}/throughputSettings/default/migrateToManualThroughput`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "POST", apiVersion,  })
          }
          