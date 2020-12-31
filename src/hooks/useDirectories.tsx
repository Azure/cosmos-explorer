import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/authContext";
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
  let nextLink = `https://management.azure.com/tenants?api-version=2020-01-01`;

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

export function useDirectories(): Tenant[] {
  const { armToken } = useContext(AuthContext);
  const [state, setState] = useState<Tenant[]>();

  useEffect(() => {
    if (armToken) {
      fetchDirectories(armToken).then(response => setState(response));
    }
  }, [armToken]);
  return state || [];
}
