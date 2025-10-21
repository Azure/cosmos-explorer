import { DatabaseAccount } from "Contracts/DataModels";
import { userContext } from "UserContext";
import { configContext } from "../../ConfigContext";

const apiVersion = "2025-04-15";
export type FetchAccountDetailsParams = {
    subscriptionId: string;
    resourceGroupName: string;
    accountName: string;
};

const buildUrl = (params: FetchAccountDetailsParams): string => {
    const { subscriptionId, resourceGroupName, accountName } = params;

    let armEndpoint = configContext.ARM_ENDPOINT;
    if (armEndpoint.endsWith("/")) {
        armEndpoint = armEndpoint.slice(0, -1);
    }
    return `${armEndpoint}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}?api-version=${apiVersion}`;
}

export async function fetchDatabaseAccount(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
) {
    const headers = new Headers();
    headers.append("Authorization", userContext.authorizationToken);
    headers.append("Content-Type", "application/json");
    const uri = buildUrl({ subscriptionId, resourceGroupName, accountName });
    const response = await fetch(uri, { method: "GET", headers: headers });

    if (!response.ok) {
        throw new Error(`Error fetching database account: ${response.statusText}`);
    }
    const account: DatabaseAccount = await response.json();
    return account;
}
