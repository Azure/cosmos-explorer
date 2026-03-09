import { HttpHeaders } from "Common/Constants";
import { QueryRequestOptions, QueryResponse } from "Contracts/AzureResourceGraph";
import useSWR from "swr";
import { userContext } from "UserContext";
import { configContext } from "../ConfigContext";
import { Subscription } from "../Contracts/DataModels";
/* eslint-disable  @typescript-eslint/no-explicit-any */

interface SubscriptionListResult {
  nextLink: string;
  value: Subscription[];
}

export async function fetchSubscriptions(accessToken: string = ""): Promise<Subscription[]> {
  if (!accessToken && !userContext.authorizationToken) {
    return [];
  }
  const headers = new Headers();
  const bearer = accessToken ? `Bearer ${accessToken}` : userContext.authorizationToken;

  headers.append("Authorization", bearer);

  let subscriptions: Array<Subscription> = [];
  let nextLink = `${configContext.ARM_ENDPOINT}subscriptions?api-version=2020-01-01`;

  while (nextLink) {
    const response = await fetch(nextLink, { headers });
    const result: SubscriptionListResult =
      response.status === 204 || response.status === 304 ? undefined : await response.json();
    if (!response.ok) {
      throw result;
    }
    nextLink = result.nextLink;
    const validSubscriptions = result.value.filter(
      (sub) => sub.state === "Enabled" || sub.state === "Warned" || sub.state === "PastDue",
    );
    subscriptions = [...subscriptions, ...validSubscriptions];
  }
  return subscriptions.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function fetchSubscriptionsFromGraph(accessToken: string = ""): Promise<Subscription[]> {
  if (!accessToken && !userContext.authorizationToken) {
    return [];
  }
  const headers = new Headers();
  const bearer = accessToken ? `Bearer ${accessToken}` : userContext.authorizationToken;

  headers.append("Authorization", bearer);
  headers.append(HttpHeaders.contentType, "application/json");
  const subscriptionsQuery =
    "resources | where type == 'microsoft.documentdb/databaseaccounts' | join kind=inner ( resourcecontainers | where type == 'microsoft.resources/subscriptions' | project subscriptionId, subscriptionName = name, subscriptionState = tostring(parse_json(properties).state) ) on subscriptionId |  summarize by subscriptionId, subscriptionName, subscriptionState";
  const apiVersion = "2021-03-01";
  const managementResourceGraphAPIURL = `${configContext.ARM_ENDPOINT}providers/Microsoft.ResourceGraph/resources?api-version=${apiVersion}`;

  const subscriptions: Subscription[] = [];
  let skipToken: string;
  do {
    const body = {
      query: subscriptionsQuery,
      options: {
        allowPartialScopes: true,
        $top: 150,
        ...(skipToken && {
          $skipToken: skipToken,
        }),
      } as QueryRequestOptions,
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

    queryResponse.data?.map((subscription: any) => {
      subscriptions.push({
        displayName: subscription.subscriptionName,
        subscriptionId: subscription.subscriptionId,
        state: subscription.subscriptionState,
      } as Subscription);
    });
  } while (skipToken);

  return subscriptions.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function useSubscriptions(armToken: string = ""): Subscription[] | undefined {
  const { data } = useSWR(
    () => ["subscriptions", armToken],
    (_, armToken) => fetchSubscriptionsFromGraph(armToken),
  );
  return data;
}
