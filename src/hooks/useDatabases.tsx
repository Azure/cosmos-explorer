import { DatabaseModel } from "Contracts/DataModels";
import useSWR from "swr";
import { getDatabaseEndpoint } from "../Common/DatabaseAccountUtility";
import { configContext } from "../ConfigContext";
import { ApiType } from "../UserContext";
import { getCopyJobAuthorizationHeader } from "../Utils/CopyJobAuthUtils";

const apiVersion = "2023-09-15";
export interface FetchDatabasesListParams {
  subscriptionId: string;
  resourceGroupName: string;
  accountName: string;
  apiType?: ApiType;
}

const buildReadDatabasesListUrl = (params: FetchDatabasesListParams): string => {
  const { subscriptionId, resourceGroupName, accountName, apiType } = params;
  const databaseEndpoint = getDatabaseEndpoint(apiType);

  let armEndpoint = configContext.ARM_ENDPOINT;
  if (armEndpoint.endsWith("/")) {
    armEndpoint = armEndpoint.slice(0, -1);
  }
  return `${armEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/${databaseEndpoint}?api-version=${apiVersion}`;
};

const fetchDatabasesList = async (
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  apiType: ApiType,
): Promise<DatabaseModel[]> => {
  const uri = buildReadDatabasesListUrl({ subscriptionId, resourceGroupName, accountName, apiType });
  const headers = getCopyJobAuthorizationHeader();

  const response = await fetch(uri, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch databases");
  }

  const data = await response.json();
  return data.value;
};

export function useDatabases(
  subscriptionId: string,
  resourceGroupName: string,
  accountName: string,
  apiType: ApiType,
): DatabaseModel[] | undefined {
  const { data } = useSWR(
    () =>
      subscriptionId && resourceGroupName && accountName && apiType
        ? ["fetchDatabasesLinkedToResource", subscriptionId, resourceGroupName, accountName, apiType]
        : undefined,
    (_, subscriptionId, resourceGroupName, accountName, apiType) =>
      fetchDatabasesList(subscriptionId, resourceGroupName, accountName, apiType),
  );

  return data;
}
