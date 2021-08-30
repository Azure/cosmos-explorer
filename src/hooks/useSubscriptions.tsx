import useSWR from "swr";
import { configContext } from "../ConfigContext";
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
      (sub) => sub.state === "Enabled" || sub.state === "Warned" || sub.state === "PastDue"
    );
    subscriptions = [...subscriptions, ...validSubscriptions];
  }
  return subscriptions.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function useSubscriptions(armToken: string): Subscription[] | undefined {
  const { data } = useSWR(
    // eslint-disable-next-line no-null/no-null
    () => (armToken ? ["subscriptions", armToken] : null),
    (_: string, armToken: string) => fetchSubscriptions(armToken)
  );
  return data;
}
