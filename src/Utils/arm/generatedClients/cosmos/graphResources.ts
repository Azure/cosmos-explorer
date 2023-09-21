/* 
  AUTOGENERATED FILE
  Run "npm run generateARMClients" to regenerate
  Edting this file directly should be done with extreme caution as not to diverge from ARM REST specs

  Generated from: https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/preview/2023-09-15-preview/cosmos-db.json
*/

import { armRequest } from "../../request"
import * as Types from "./types"
import { configContext } from "../../../../ConfigContext";
const apiVersion = "2023-09-15-preview"


          /* Lists the graphs under an existing Azure Cosmos DB database account. */
          export async function listGraphs (
            subscriptionId: string,
resourceGroupName: string,
accountName: string
            
          ) : Promise<Types.GraphResourcesListResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/graphs`
            return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Gets the Graph resource under an existing Azure Cosmos DB database account with the provided name. */
          export async function getGraph (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
graphName: string
            
          ) : Promise<Types.GraphResourceGetResults> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/graphs/${graphName}`
            return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Create or update an Azure Cosmos DB Graph. */
          export async function createUpdateGraph (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
graphName: string
            ,body: Types.GraphResourceCreateUpdateParameters
          ) : Promise<Types.GraphResourceGetResults | void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/graphs/${graphName}`
            return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "PUT", apiVersion, body })
          }
          
          /* Deletes an existing Azure Cosmos DB Graph Resource. */
          export async function deleteGraphResource (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
graphName: string
            
          ) : Promise<void> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/graphs/${graphName}`
            return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "DELETE", apiVersion,  })
          }
          