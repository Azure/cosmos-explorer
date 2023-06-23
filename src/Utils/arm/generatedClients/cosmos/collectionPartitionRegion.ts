/* 
  AUTOGENERATED FILE
  Run "npm run generateARMClients" to regenerate
  Edting this file directly should be done with extreme caution as not to diverge from ARM REST specs

  Generated from: https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/stable/2023-04-15/cosmos-db.json
*/

import { armRequest } from "../../request";
import * as Types from "./types";
import { configContext } from "../../../../ConfigContext";
const apiVersion = "2023-04-15";

/* Retrieves the metrics determined by the given filter for the given collection and region, split by partition. */
export async function listMetrics(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  region: string,
  databaseRid: string,
  collectionRid: string
): Promise<Types.PartitionMetricListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/region/${region}/databases/${databaseRid}/collections/${collectionRid}/partitions/metrics`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}
