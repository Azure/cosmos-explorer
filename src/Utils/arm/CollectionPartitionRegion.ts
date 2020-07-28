/* 
  AUTOGENERATED FILE
  Do not manually edit
  Run "npm run generateARMClients" to regenerate
*/

import * as Types from "./types"


          /* Retrieves the metrics determined by the given filter for the given collection and region, split by partition. */
          export async function listMetrics (
            subscriptionId: string,
resourceGroupName: string,
accountName: string,
region: string,
databaseRid: string,
collectionRid: string
            
          ) : Promise<Types.PartitionMetricListResult> {
            const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/region/${region}/databases/${databaseRid}/collections/${collectionRid}/partitions/metrics`
            return window.fetch(path, { method: "get",  }).then((response) => response.json())
          }
          