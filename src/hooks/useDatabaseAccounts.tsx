import { HttpHeaders } from "Common/Constants";
import { QueryRequestOptions, QueryResponse } from "Contracts/AzureResourceGraph";
import useSWR from "swr";
import { configContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
import { acquireTokenWithMsal, getMsalInstance } from "Utils/AuthorizationUtils";
import React from "react";
/* eslint-disable  @typescript-eslint/no-explicit-any */

interface AccountListResult {
  nextLink: string;
  value: DatabaseAccount[];
}

export async function fetchDatabaseAccounts(subscriptionId: string, accessToken: string): Promise<DatabaseAccount[]> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

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
  accessToken: string,
): Promise<DatabaseAccount[]> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

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
     // throw new Error(await response.text());
   // }

    const queryResponse: QueryResponse = (await response.json()) as QueryResponse;
    skipToken = queryResponse.$skipToken;
    queryResponse.data?.map((databaseAccount: any) => {
      databaseAccounts.push(databaseAccount as DatabaseAccount);
    });
  } else {
    try{
      console.log("Token expired");
      await acquireNewTokenAndRetry(body);
    }
    catch (error) {
     throw new Error(error);
    }
  
  }
  } while (skipToken);

  return databaseAccounts.sort((a, b) => a.name.localeCompare(b.name));
}

export function useDatabaseAccounts(subscriptionId: string, armToken: string): DatabaseAccount[] | undefined {
  const { data } = useSWR(
    () => (armToken && subscriptionId ? ["databaseAccounts", subscriptionId, armToken] : undefined),
    (_, subscriptionId, armToken) => fetchDatabaseAccountsFromGraph(subscriptionId, armToken),
  );
  return data;
}

async function acquireNewTokenAndRetry(body: any) {
  try {
    const msalInstance = await getMsalInstance();
    
const cachedAccount = msalInstance.getAllAccounts()?.[0];
const cachedTenantId = localStorage.getItem("cachedTenantId");

   // const [tenantId, setTenantId] = React.useState<string>(cachedTenantId);

  
    msalInstance.setActiveAccount(cachedAccount);

    const newAccessToken = await acquireTokenWithMsal(msalInstance, {
      authority: `${configContext.AAD_ENDPOINT}${cachedTenantId}`,
      scopes: [`${configContext.ARM_ENDPOINT}/.default`],
    });
    const newBearer = `Bearer ${newAccessToken}`;
    const newHeaders = new Headers();
    newHeaders.append("Authorization", newBearer);
    newHeaders.append(HttpHeaders.contentType, "application/json");
    const apiVersion = "2021-03-01";
    const managementResourceGraphAPIURL = `${configContext.ARM_ENDPOINT}providers/Microsoft.ResourceGraph/resources?api-version=${apiVersion}`;
    
  const databaseAccounts: DatabaseAccount[] = [];
  let skipToken: string;
  

    // Retry the request with the new token
    const response = await fetch(managementResourceGraphAPIURL, {
      method: "POST",
      headers: newHeaders,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      // Handle successful response with new token
      const queryResponse: QueryResponse = await response.json();
      skipToken = queryResponse.$skipToken;
      queryResponse.data?.forEach((databaseAccount: any) => {
        databaseAccounts.push(databaseAccount as DatabaseAccount);
      });
    } else {
      throw new Error(`Failed to fetch data after acquiring new token. Status: ${response.status}, ${await response.text()}`);
    }
  } catch (error) {
    console.error("Error acquiring new token and retrying:", error);
    throw error;
  }
}
