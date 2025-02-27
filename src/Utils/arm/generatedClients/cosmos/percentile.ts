/* 
  AUTOGENERATED FILE
  Run "npm run generateARMClients" to regenerate
  Edting this file directly should be done with extreme caution as not to diverge from ARM REST specs

  Generated from: https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/preview/2024-12-01-preview/cosmos-db.json
*/

import { configContext } from "../../../../ConfigContext";
import { armRequest } from "../../request";
import * as Types from "./types";
const apiVersion = "2024-12-01-preview";

/* Retrieves the metrics determined by the given filter for the given database account. This url is only for PBS and Replication Latency data */
export async function listMetrics(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
): Promise<Types.PercentileMetricListResult> {
  const path = `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/percentile/metrics`;
  return armRequest({ host: configContext.ARM_ENDPOINT, path, method: "GET", apiVersion });
}
