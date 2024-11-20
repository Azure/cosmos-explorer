import { HttpHeaders } from "Common/Constants";
import useSWR from "swr";
import { acquireTokenWithMsal, getMsalInstance } from "Utils/AuthorizationUtils";
import React from "react";
import { updateUserContext, userContext } from "UserContext";
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
  subscriptionId: string
): Promise<DatabaseAccount[]> {
  const headers = new Headers();
  const bearer = `Bearer ${userContext.armToken}`;

  headers.append("Authorization", bearer);
  headers.append(HttpHeaders.contentType, "application/json");
  const databaseAccountsQuery = "resources | where type =~ 'microsoft.documentdb/databaseaccounts'";
  const apiVersion = "2021-03-01";
  const managementResourceGraphAPIURL = `${configContext.ARM_ENDPOINT}providers/Microsoft.ResourceGraph/resources?api-version=${apiVersion}`;

  let databaseAccounts: DatabaseAccount[] = [];
  let skipToken: string;
  console.log("Old ARM Token", userContext.armToken);
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
  
  //  else {
  //   try{
  //     console.log("Token expired");
  //     databaseAccounts = await acquireNewTokenAndRetry(body);
  //   }
    // catch (error) {
    //  throw new Error(error);
    // }
  
  //}
  } while (skipToken);
  return databaseAccounts.sort((a, b) => a.name.localeCompare(b.name));
}

export function useDatabaseAccounts(subscriptionId: string): DatabaseAccount[] | undefined {
  const { data } = useSWR(
    () => ( subscriptionId ? ["databaseAccounts", subscriptionId] : undefined),
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

interface Subscription {
  displayName: string;
  subscriptionId: string;
  state: string;
}

interface QueryRequestOptions {
  $top?: number;
  $skipToken?: string;
  $allowPartialScopes?: boolean;
}

// Define the configuration context and headers if not already defined
const configContext = {
  ARM_ENDPOINT: 'https://management.azure.com/',
  AAD_ENDPOINT: 'https://login.microsoftonline.com/'
};

interface QueryResponse {
  data?: any[];
  $skipToken?: string;
}

export async function runCommand<T>(
  fn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> {
  try {
      // Attempt to execute the function passed as an argument
      const result = await fn(...args);
      console.log('Successfully executed function:', result);
      return result;

  } catch (error) {
      // Handle any error that is thrown during the execution of the function
      //(error.code === "ExpiredAuthenticationToken") 
      if(error) {
        console.log('Creating new token');
        const msalInstance = await getMsalInstance();
    
        const cachedAccount = msalInstance.getAllAccounts()?.[0];
        const cachedTenantId = localStorage.getItem("cachedTenantId");
        
          
            msalInstance.setActiveAccount(cachedAccount);
        
            const newAccessToken = await acquireTokenWithMsal(msalInstance, {
              authority: `${configContext.AAD_ENDPOINT}${cachedTenantId}`,
              scopes: [`${configContext.ARM_ENDPOINT}/.default`],
            });
            
  console.log("Latest ARM Token", userContext.armToken);
            updateUserContext({armToken: newAccessToken});
            const result = await fn(...args);
            return result;
      }
      else {
          console.error('An error occurred:', error.message);
          throw new error; 
      }
      
  }
}

// Running the functions using runCommand

const accessToken = 'your-access-token';
const subscriptionId = 'your-subscription-id';

//runCommand(fetchDatabaseAccountsFromGraph, subscriptionId, accessToken);
//runCommand(fetchSubscriptionsFromGraph, accessToken);

async function acquireNewTokenAndRetry(body: any) : Promise<DatabaseAccount[]> {
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
    console.log("New ARM Token", newAccessToken);
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
      return databaseAccounts;
    } else {
      throw new Error(`Failed to fetch data after acquiring new token. Status: ${response.status}, ${await response.text()}`);
    }
  } catch (error) {
    console.error("Error acquiring new token and retrying:", error);
    throw error;
  }
}

