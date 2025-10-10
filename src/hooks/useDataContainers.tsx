import { DatabaseModel } from "Contracts/DataModels";
import useSWR from "swr";
import { getCollectionEndpoint, getDatabaseEndpoint } from "../Common/DatabaseAccountUtility";
import { configContext } from "../ConfigContext";
import { FetchDataContainersListParams } from "../Explorer/ContainerCopy/Types";
import { ApiType } from "../UserContext";

const apiVersion = "2023-09-15";

const buildReadDataContainersListUrl = (params: FetchDataContainersListParams): string => {
    const { subscriptionId, resourceGroupName, accountName, databaseName, apiType } = params;
    const databaseEndpoint = getDatabaseEndpoint(apiType);
    const collectionEndpoint = getCollectionEndpoint(apiType);

    let armEndpoint = configContext.ARM_ENDPOINT;
    if (armEndpoint.endsWith("/")) {
        armEndpoint = armEndpoint.slice(0, -1);
    }
    return `${armEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/${databaseEndpoint}/${databaseName}/${collectionEndpoint}?api-version=${apiVersion}`;
}

const fetchDataContainersList = async (
    armToken: string,
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    apiType: ApiType
): Promise<DatabaseModel[]> => {
    const uri = buildReadDataContainersListUrl({
        armToken,
        subscriptionId,
        resourceGroupName,
        accountName,
        databaseName,
        apiType
    });
    const headers = new Headers();
    const bearer = `Bearer ${armToken}`;
    headers.append("Authorization", bearer);
    headers.append("Content-Type", "application/json");

    const response = await fetch(uri, {
        method: "GET",
        headers: headers
    });

    if (!response.ok) {
        throw new Error("Failed to fetch containers");
    }

    const data = await response.json();
    return data.value;
};

export function useDataContainers(
    armToken: string,
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    apiType: ApiType
): DatabaseModel[] | undefined {
    const { data } = useSWR(
        () => (
            armToken && subscriptionId && resourceGroupName && accountName && databaseName && apiType ? [
                "fetchContainersLinkedToDatabases",
                armToken, subscriptionId, resourceGroupName, accountName, databaseName, apiType
            ] : undefined
        ),
        (_, armToken, subscriptionId, resourceGroupName, accountName, databaseName, apiType) => fetchDataContainersList(
            armToken,
            subscriptionId,
            resourceGroupName,
            accountName,
            databaseName,
            apiType
        ),
    );

    return data;
}