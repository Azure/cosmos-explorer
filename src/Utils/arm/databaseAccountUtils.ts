import { DatabaseAccount } from "Contracts/DataModels";
import { userContext } from "UserContext";
import { buildArmUrl } from "Utils/arm/armUtils";

const apiVersion = "2025-04-15";
export type FetchAccountDetailsParams = {
  subscriptionId: string;
  resourceGroupName: string;
  accountName: string;
};

const buildUrl = (params: FetchAccountDetailsParams): string => {
  const { subscriptionId, resourceGroupName, accountName } = params;

  return buildArmUrl(
    `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
    apiVersion,
  );
};

export async function fetchDatabaseAccount(subscriptionId: string, resourceGroupName: string, accountName: string) {
  if (!userContext.authorizationToken) {
    return Promise.reject("Authorization token is missing");
  }
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
