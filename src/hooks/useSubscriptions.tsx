import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/authContext";
import { Subscription } from "../Contracts/DataModels";

interface SubscriptionListResult {
  nextLink: string;
  value: Subscription[];
}

export async function fetchSubscriptions(accessToken: string): Promise<Subscription[]> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  let subscriptions: Array<Subscription> = [];
  let nextLink = `https://management.azure.com/subscriptions?api-version=2020-01-01`;

  while (nextLink) {
    const response = await fetch(nextLink, { headers });
    const result: SubscriptionListResult =
      response.status === 204 || response.status === 304 ? undefined : await response.json();
    if (!response.ok) {
      throw result;
    }
    nextLink = result.nextLink;
    const validSubscriptions = result.value.filter(
      sub => sub.state === "Enabled" || sub.state === "Warned" || sub.state === "PastDue"
    );
    subscriptions = [...subscriptions, ...validSubscriptions];
  }
  return subscriptions;
}

export function useSubscriptions(): Subscription[] {
  const { armToken } = useContext(AuthContext);
  const [state, setState] = useState<Subscription[]>();

  useEffect(() => {
    if (armToken) {
      fetchSubscriptions(armToken).then(response => setState(response));
    }
  }, [armToken]);
  return state || [];
}
