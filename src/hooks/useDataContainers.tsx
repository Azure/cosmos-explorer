import { DatabaseModel } from "Contracts/DataModels";
import useSWR from "swr";
import { getCollectionEndpoint, getDatabaseEndpoint } from "../Common/DatabaseAccountUtility";
import { configContext } from "../ConfigContext";
import { ApiType } from "../UserContext";
import { getCopyJobAuthorizationHeader } from "../Utils/CopyJobAuthUtils";

const apiVersion = "2023-09-15";
export interface FetchDataContainersListParams {
    subscriptionId: string;
    resourceGroupName: string;
    databaseName: string;
    accountName: string;
    apiType?: ApiType;
}

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
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    apiType: ApiType
): Promise<DatabaseModel[]> => {
    const uri = buildReadDataContainersListUrl({
        subscriptionId,
        resourceGroupName,
        accountName,
        databaseName,
        apiType
    });
    const headers = getCopyJobAuthorizationHeader();

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
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    apiType: ApiType
): DatabaseModel[] | undefined {
    const { data } = useSWR(
        () => (
            subscriptionId && resourceGroupName && accountName && databaseName && apiType ? [
                "fetchContainersLinkedToDatabases",
                subscriptionId, resourceGroupName, accountName, databaseName, apiType
            ] : undefined
        ),
        (_, subscriptionId, resourceGroupName, accountName, databaseName, apiType) => fetchDataContainersList(
            subscriptionId,
            resourceGroupName,
            accountName,
            databaseName,
            apiType
        ),
    );

    return data;
}