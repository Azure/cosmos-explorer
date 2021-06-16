import { useEffect, useState } from "react";
import { Tenant } from "../Contracts/DataModels";

interface TenantListResult {
  nextLink: string;
  value: Tenant[];
}

export async function fetchDirectories(accessToken: string): Promise<Tenant[]> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  let tenents: Array<Tenant> = [];
  let nextLink = `${configContext.ARM_ENDPOINT}/tenants?api-version=2020-01-01`;

  while (nextLink) {
    const response = await fetch(nextLink, { headers });
    const result: TenantListResult =
      response.status === 204 || response.status === 304 ? undefined : await response.json();
    if (!response.ok) {
      throw result;
    }
    nextLink = result.nextLink;
    tenents = [...tenents, ...result.value];
  }
  return tenents;
}

export function useDirectories(armToken: string): Tenant[] {
  const [state, setState] = useState<Tenant[]>();

  useEffect(() => {
    if (armToken) {
      fetchDirectories(armToken).then((response) => setState(response));
    }
  }, [armToken]);
  return state || [];
}
