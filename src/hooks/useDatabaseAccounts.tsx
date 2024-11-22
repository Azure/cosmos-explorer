import { HttpHeaders } from "Common/Constants";
import { QueryRequestOptions, QueryResponse } from "Contracts/AzureResourceGraph";
import useSWR from "swr";
import { updateUserContext, userContext } from "UserContext";
import { acquireTokenWithMsal, getMsalInstance } from "Utils/AuthorizationUtils";
import { configContext } from "../ConfigContext";
import { DatabaseAccount } from "../Contracts/DataModels";
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

export async function fetchDatabaseAccountsFromGraph(subscriptionId: string): Promise<DatabaseAccount[]> {
  const headers = new Headers();
  const bearer = `Bearer ${userContext.armToken}`;

  headers.append("Authorization", bearer);
  headers.append(HttpHeaders.contentType, "application/json");
  const databaseAccountsQuery = "resources | where type =~ 'microsoft.documentdb/databaseaccounts'";
  const apiVersion = "2021-03-01";
  const managementResourceGraphAPIURL = `${configContext.ARM_ENDPOINT}providers/Microsoft.ResourceGraph/resources?api-version=${apiVersion}`;

  let databaseAccounts: DatabaseAccount[] = [];
  let skipToken: string;
  console.log("Old ARM Token - fetchDatabaseAccountsFromGraph function", userContext.armToken);
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

export function useDatabaseAccounts(subscriptionId: string): DatabaseAccount[] | undefined {
  const { data } = useSWR(
    () => (subscriptionId ? ["databaseAccounts", subscriptionId] : undefined),
    (_, subscriptionId) => runCommand(fetchDatabaseAccountsFromGraph, subscriptionId),
  );
  return data;
}

// Define the types for your responses
interface DatabaseAccount {
  name: string;
  id: string;
  // Add other relevant fields as per your use case
}

interface QueryRequestOptions {
  $top?: number;
  $skipToken?: string;
  $allowPartialScopes?: boolean;
}

// Define the configuration context and headers if not already defined
const configContext = {
  ARM_ENDPOINT: "https://management.azure.com/",
  AAD_ENDPOINT: "https://login.microsoftonline.com/",
};

interface QueryResponse {
  data?: any[];
  $skipToken?: string;
}

export async function runCommand<T>(fn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  try {
    // Attempt to execute the function passed as an argument
    const result = await fn(...args);
    console.log("Successfully executed function:", fn.name, result);
    return result;
  } catch (error) {
    // Handle any error that is thrown during the execution of the function
    if (error) {
      console.log("Creating new token");
      const msalInstance = await getMsalInstance();

      const cachedAccount = msalInstance.getAllAccounts()?.[0];
      const cachedTenantId = localStorage.getItem("cachedTenantId");

      msalInstance.setActiveAccount(cachedAccount);

      // TODO: Add condition to check if the ARM token needs to be renewed, then we need to run the code below for creating the ARM token

      console.log("Creating new ARM token");
      const newAccessToken = await acquireTokenWithMsal(msalInstance, {
        authority: `${configContext.AAD_ENDPOINT}${cachedTenantId}`,
        scopes: [`${configContext.ARM_ENDPOINT}/.default`],
      });
      updateUserContext({ armToken: newAccessToken });

      // TODO: add condition to check if AAD token needs to be renewed (i.e) Token provider has failed with expired AAD token and create a new AAD Token using the below code

      // const hrefEndpoint = new URL(userContext.databaseAccount.properties.documentEndpoint).href.replace(/\/$/, "/.default");
      // console.log('Creating new AAD token');
      // let aadToken = await acquireTokenWithMsal(msalInstance, {
      //   forceRefresh: true,
      //   authority: `${configContext.AAD_ENDPOINT}${cachedTenantId}`,
      //   scopes: [hrefEndpoint],
      // });
      // updateUserContext({aadToken: aadToken});

      //console.log('Latest AAD Token', fn.name, userContext.aadToken);
      const result = await fn(...args);
      return result;
    } else {
      console.error("An error occurred:", error.message);
      throw new error();
    }
  }
}
