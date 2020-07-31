/* 
  AUTOGENERATED FILE
  Do not manually edit
  Run "npm run generateARMClients" to regenerate
*/

import { armRequest } from "../../request"
import * as Types from "./types"
import { config } from "../../../../Config";
const apiVersion = "2020-04-01"


          /* Retrieves the metrics determined by the given filter for the given database account and collection. */
          export async function listMetrics (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseRid: string,
collectionRid: string
            
          ) : Promise<Types.MetricListResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/metrics`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Retrieves the usages (most recent storage data) for the given collection. */
          export async function listUsages (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseRid: string,
collectionRid: string
            
          ) : Promise<Types.UsagesResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/usages`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          
          /* Retrieves metric definitions for the given collection. */
          export async function listMetricDefinitions (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
databaseRid: string,
collectionRid: string
            
          ) : Promise<Types.MetricDefinitionsListResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/metricDefinitions`
            return armRequest({ host: config.ARM_ENDPOINT, path, method: "GET", apiVersion,  })
          }
          