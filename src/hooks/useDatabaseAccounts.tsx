import useSWR from "swr";
import { DatabaseAccount } from "../Contracts/DataModels";

interface AccountListResult {
  nextLink: string;
  value: DatabaseAccount[];
}

export async function fetchDatabaseAccounts(
  subscriptionIds: string[],
  accessToken: string
): Promise<DatabaseAccount[]> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  if (!subscriptionIds || !subscriptionIds.length) {
    return Promise.reject("No subscription passed in");
  }

  let accounts: Array<DatabaseAccount> = [];

  const subscriptionFilter = "subscriptionId eq '" + subscriptionIds.join("' or subscriptionId eq '") + "'";
  const urlFilter = `$filter=(${subscriptionFilter}) and (resourceType eq 'microsoft.documentdb/databaseaccounts')`;
  let nextLink = `https://management.azure.com/resources?api-version=2020-01-01&${urlFilter}`;

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
  return accounts;
}

export function useDatabaseAccounts(subscriptionId: string, armToken: string): DatabaseAccount[] | undefined {
  const { data } = useSWR(
    () => (armToken && subscriptionId ? ["databaseAccounts", subscriptionId, armToken] : undefined),
    (_, subscriptionId, armToken) => fetchDatabaseAccounts([subscriptionId], armToken)
  );
  return data;
}
