import { useEffect, useState } from "react";
import { ApiEndpoints } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import { AccessInputMetadata, EncryptedAccessToken } from "../Contracts/DataModels";

const url = `${configContext.BACKEND_ENDPOINT}${ApiEndpoints.guestRuntimeProxy}/accessinputmetadata?_=1609359229955`;

export async function fetchAccessData(portalToken: EncryptedAccessToken): Promise<AccessInputMetadata> {
  const headers = new Headers();
  // Portal encrypted token API quirk: The token header must be URL encoded
  if (portalToken.version === 1) {
    headers.append("x-ms-encrypted-auth-token", encodeURIComponent(portalToken.primaryToken));
  } else {
    headers.append("x-ms-cosmos-auth-token-primary", portalToken.primaryToken);
    headers.append("x-ms-cosmos-auth-token-secondary", portalToken.secondaryToken);
  }

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

export function useTokenMetadata(token: EncryptedAccessToken): AccessInputMetadata | undefined {
  const [state, setState] = useState<AccessInputMetadata | undefined>();

  useEffect(() => {
    if (token) {
      fetchAccessData(token).then((response) => setState(response));
    }
  }, [token]);
  return state;
}
