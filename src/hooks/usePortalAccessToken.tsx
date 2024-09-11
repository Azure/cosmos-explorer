import { useEffect, useState } from "react";
import { useNewPortalBackendEndpoint } from "Utils/EndpointUtils";
import { ApiEndpoints, BackendApi, HttpHeaders } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import { AccessInputMetadata } from "../Contracts/DataModels";

const url = `${configContext.BACKEND_ENDPOINT}${ApiEndpoints.guestRuntimeProxy}/accessinputmetadata?_=1609359229955`;

export async function fetchAccessData(portalToken: string): Promise<AccessInputMetadata> {
  if (!useNewPortalBackendEndpoint(BackendApi.RuntimeProxy)) {
    return fetchAccessData_ToBeDeprecated(portalToken);
  }

  const headers = new Headers();
  // Portal encrypted token API quirk: The token header must be URL encoded
  headers.append(HttpHeaders.guestAccessToken, encodeURIComponent(portalToken));
  const url: string = `${configContext.PORTAL_BACKEND_ENDPOINT}/api/connectionstring/runtimeproxy/accessinputmetadata`;
  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch(url, options)
    .then((response) => response.json())
    .catch((error) => console.error(error));
}

export async function fetchAccessData_ToBeDeprecated(portalToken: string): Promise<AccessInputMetadata> {
  const headers = new Headers();
  // Portal encrypted token API quirk: The token header must be URL encoded
  headers.append(HttpHeaders.guestAccessToken, encodeURIComponent(portalToken));

  const options = {
    method: "GET",
    headers: headers,
  };

  return (
    fetch(url, options)
      .then((response) => response.json())
      // Portal encrypted token API quirk: The response is double JSON encoded
      .then((json) => JSON.parse(json))
      .catch((error) => console.error(error))
  );
}

export function useTokenMetadata(token: string): AccessInputMetadata | undefined {
  const [state, setState] = useState<AccessInputMetadata | undefined>();

  useEffect(() => {
    if (token) {
      fetchAccessData(token).then((response) => setState(response));
    }
  }, [token]);
  return state;
}
