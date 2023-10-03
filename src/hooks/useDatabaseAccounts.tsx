import useSWR from "swr";
import { configContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
import { userContext } from "../UserContext";

interface AccountListResult {
  nextLink: string;
  value: DatabaseAccount[];
}

export async function fetchDatabaseAccounts(subscriptionId: string, accessToken: string): Promise<DatabaseAccount[]> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  let accounts: Array<DatabaseAccount> = [];
  const apiVersion = userContext.features.enableThroughputCap ? "2021-10-15-preview" : "2021-06-15";
  let nextLink = `${configContext.ARM_ENDPOINT}/subscriptions/${subscriptionId}/providers/Microsoft.DocumentDB/databaseAccounts?api-version=${apiVersion}`;

  while (nextLink) {
    const response: Response = await fetch(nextLink, { headers });
    const result: AccountListResult =
      response.status === 204 || response.status === 304 ? undefined : await response.json();
    if (!response.ok) {
      throw result;
    }
    nextLink = result.nextLink;
    accounts = [...accounts, ...result.value];
  }
  return accounts.sort((a, b) => a.name.localeCompare(b.name));
}

export function useDatabaseAccounts(subscriptionId: string, armToken: string): DatabaseAccount[] | undefined {
  const { data } = useSWR(
    () => (armToken && subscriptionId ? ["databaseAccounts", subscriptionId, armToken] : undefined),
    (_, subscriptionId, armToken) => fetchDatabaseAccounts(subscriptionId, armToken),
  );
  return data;
}
