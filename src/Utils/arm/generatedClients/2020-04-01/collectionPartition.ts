/* 
  AUTOGENERATED FILE
  Do not manually edit
  Run "npm run generateARMClients" to regenerate
*/

import { armRequest } from "../../request";
import * as Types from "./types";
import { configContext } from "../../../../ConfigContext";
const apiVersion = "2020-04-01";

/* Retrieves the metrics determined by the given filter for the given collection, split by partition. */
export async function listMetrics(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseRid: string,
  collectionRid: string
): Promise<Types.PartitionMetricListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/partitions/metrics`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}

/* Retrieves the usages (most recent storage data) for the given collection, split by partition. */
export async function listUsages(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  databaseRid: string,
  collectionRid: string
): Promise<Types.PartitionUsagesResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/partitions/usages`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}
