import { HttpHeaders } from "Common/Constants";
import { QueryRequestOptions, QueryResponse } from "Contracts/AzureResourceGraph";
import useSWR from "swr";
import { userContext } from "UserContext";
import { configContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
/* eslint-disable  @typescript-eslint/no-explicit-any */

interface AccountListResult {
  nextLink: string;
  value: DatabaseAccount[];
}

export async function fetchDatabaseAccounts(
  subscriptionId: string,
  accessToken: string = "",
): Promise<DatabaseAccount[]> {
  if (!accessToken && !userContext.authorizationToken) {
    return [];
  }
  const headers = new Headers();
  const bearer = accessToken ? `Bearer ${accessToken}` : userContext.authorizationToken;

  headers.append("Authorization", bearer);

  let accounts: Array<DatabaseAccount> = [];
  const apiVersion = "2023-09-15-preview";
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

export async function fetchDatabaseAccountsFromGraph(
  subscriptionId: string,
  accessToken: string = "",
): Promise<DatabaseAccount[]> {
  if (!accessToken && !userContext.authorizationToken) {
    return [];
  }
  const headers = new Headers();
  const bearer = accessToken ? `Bearer ${accessToken}` : userContext.authorizationToken;

  headers.append("Authorization", bearer);
  headers.append(HttpHeaders.contentType, "application/json");
  const databaseAccountsQuery = "resources | where type =~ 'microsoft.documentdb/databaseaccounts'";
  const apiVersion = "2021-03-01";
  const managementResourceGraphAPIURL = `${configContext.ARM_ENDPOINT}providers/Microsoft.ResourceGraph/resources?api-version=${apiVersion}`;

  const databaseAccounts: DatabaseAccount[] = [];
  let skipToken: string;
  do {
    const body = {
      query: databaseAccountsQuery,
      subscriptions: [subscriptionId],
      ...(skipToken
        ? {
            options: {
              $skipToken: skipToken,
            } as QueryRequestOptions,
          }
        : {
            options: {
              $top: 150,
            } as QueryRequestOptions,
          }),
    };

    const response = await fetch(managementResourceGraphAPIURL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const queryResponse: QueryResponse = (await response.json()) as QueryResponse;
    skipToken = queryResponse.$skipToken;
    queryResponse.data?.map((databaseAccount: any) => {
      databaseAccounts.push(databaseAccount as DatabaseAccount);
    });
  } while (skipToken);

  return databaseAccounts.sort((a, b) => a.name.localeCompare(b.name));
}

export function useDatabaseAccounts(subscriptionId: string, armToken: string = ""): DatabaseAccount[] | undefined {
  const { data } = useSWR(
    () => (subscriptionId ? ["databaseAccounts", subscriptionId, armToken] : undefined),
    (_, subscriptionId, armToken) => fetchDatabaseAccountsFromGraph(subscriptionId, armToken),
  );
  return data;
}
