/* 
  AUTOGENERATED FILE
  Do not manually edit
  Run "npm run generateARMClients" to regenerate
*/

import * as Types from "./types"


          /* Lists the Tables under an existing Azure Cosmos DB database account. */
          export async function listTables (
            subscriptionId: string,
resourceGroupName: string,
accountName: string
            
          ) : Promise<Types.TableListResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables`
            return window.fetch(path, { method: "get",  }).then((response) => response.json())
          }
          
          /* Gets the Tables under an existing Azure Cosmos DB database account with the provided name. */
          export async function getTable (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
tableName: string
            
          ) : Promise<Types.TableGetResults> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}`
            return window.fetch(path, { method: "get",  }).then((response) => response.json())
          }
          
          /* Create or update an Azure Cosmos DB Table */
          export async function createUpdateTable (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
tableName: string
            ,body: Types.TableCreateUpdateParameters
          ) : Promise<Types.TableGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}`
            return window.fetch(path, { method: "put", body: JSON.stringify(body) }).then((response) => response.json())
          }
          
          /* Deletes an existing Azure Cosmos DB Table. */
          export async function deleteTable (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
tableName: string
            
          ) : Promise<void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}`
            return window.fetch(path, { method: "delete",  }).then((response) => response.json())
          }
          
          /* Gets the RUs per second of the Table under an existing Azure Cosmos DB database account with the provided name. */
          export async function getTableThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
tableName: string
            
          ) : Promise<Types.ThroughputSettingsGetResults> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}/throughputSettings/default`
            return window.fetch(path, { method: "get",  }).then((response) => response.json())
          }
          
          /* Update RUs per second of an Azure Cosmos DB Table */
          export async function updateTableThroughput (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
tableName: string
            ,body: Types.ThroughputSettingsUpdateParameters
          ) : Promise<Types.ThroughputSettingsGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}/throughputSettings/default`
            return window.fetch(path, { method: "put", body: JSON.stringify(body) }).then((response) => response.json())
          }
          