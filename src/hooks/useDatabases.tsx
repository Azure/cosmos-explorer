import { DatabaseModel } from "Contracts/DataModels";
import useSWR from "swr";
import { getDatabaseEndpoint } from "../Common/DatabaseAccountUtility";
import { configContext } from "../ConfigContext";
import { FetchDatabasesListParams } from "../Explorer/ContainerCopy/Types";
import { ApiType } from "../UserContext";

const apiVersion = "2023-09-15";
const buildReadDatabasesListUrl = (params: FetchDatabasesListParams): string => {
    const { subscriptionId, resourceGroupName, accountName, apiType } = params;
    const databaseEndpoint = getDatabaseEndpoint(apiType);

    let armEndpoint = configContext.ARM_ENDPOINT;
    if (armEndpoint.endsWith("/")) {
        armEndpoint = armEndpoint.slice(0, -1);
    }
    return `${armEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/${databaseEndpoint}?api-version=${apiVersion}`;
}

const fetchDatabasesList = async (armToken: string, subscriptionId: string, resourceGroupName: string, accountName: string, apiType: ApiType): Promise<DatabaseModel[]> => {
    const uri = buildReadDatabasesListUrl({ armToken, subscriptionId, resourceGroupName, accountName, apiType });
    const headers = new Headers();
    const bearer = `Bearer ${armToken}`;
    headers.append("Authorization", bearer);
    headers.append("Content-Type", "application/json");

    const response = await fetch(uri, {
        method: "GET",
        headers: headers
    });

    if (!response.ok) {
        throw new Error("Failed to fetch databases");
    }

    const data = await response.json();
    return data.value;
};

export function useDatabases(
    armToken: string,
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    apiType: ApiType
): DatabaseModel[] | undefined {
    const { data } = useSWR(
        () => (
            armToken && subscriptionId && resourceGroupName && accountName && apiType ? [
                "fetchDatabasesLinkedToResource",
                armToken, subscriptionId, resourceGroupName, accountName, apiType
            ] : undefined
        ),
        (_, armToken, subscriptionId, resourceGroupName, accountName, apiType) => fetchDatabasesList(
            armToken,
            subscriptionId,
            resourceGroupName,
            accountName,
            apiType
        ),
    );

    return data;
}