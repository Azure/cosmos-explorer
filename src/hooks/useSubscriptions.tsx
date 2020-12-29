import { useEffect, useState } from "react";
import { Subscription } from "../Contracts/DataModels";
import { useAADToken } from "./useAADToken";

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
  const token = useAADToken();
  const [state, setState] = useState<Subscription[]>();

  useEffect(() => {
    if (token) {
      fetchSubscriptions(token).then(response => setState(response));
    }
  }, [token]);
  return state || [];
}

// const { accounts } = useMsal();
// const account = useAccount(accounts[0] || {});
// const { isLoading, isError, data, error } = useQuery(
//   ["subscriptions", account.tenantId],
//   async () => {
//     let subscriptions: Array<Subscription> = [];

//     const fetchHeaders = await ArmResourceUtils._getAuthHeader(ArmResourceUtils._armAuthArea, tenantId);
//     let nextLink = `${ArmResourceUtils._armEndpoint}/subscriptions?api-version=${ArmResourceUtils._armApiVersion}`;

//     while (nextLink) {
//       const response: Response = await fetch(nextLink, { headers: fetchHeaders });
//       const result: SubscriptionListResult =
//         response.status === 204 || response.status === 304 ? null : await response.json();
//       if (!response.ok) {
//         throw result;
//       }
//       nextLink = result.nextLink;
//       const validSubscriptions = result.value.filter(
//         sub => sub.state === "Enabled" || sub.state === "Warned" || sub.state === "PastDue"
//       );
//       subscriptions = [...subscriptions, ...validSubscriptions];
//     }
//     return subscriptions;
//   },
//   { enabled: account.tenantId }
// );

// console.log(isLoading, isError, data, error);
