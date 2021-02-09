import { useEffect, useState } from "react";
import { ApiEndpoints } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import { AccessInputMetadata } from "../Contracts/DataModels";

const url = `${configContext.BACKEND_ENDPOINT}${ApiEndpoints.guestRuntimeProxy}/accessinputmetadata?_=1609359229955`;

export async function fetchAccessData(portalToken: string): Promise<AccessInputMetadata> {
  const headers = new Headers();
  // Portal encrypted token API quirk: The token header must be URL encoded
  headers.append("x-ms-encrypted-auth-token", encodeURIComponent(portalToken));

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

export function useTokenMetadata(token: string): AccessInputMetadata {
  const [state, setState] = useState<AccessInputMetadata>();

  useEffect(() => {
    if (token) {
      fetchAccessData(token).then((response) => setState(response));
    }
  }, [token]);
  return state;
}
