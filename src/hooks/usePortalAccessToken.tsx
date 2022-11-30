import { useEffect, useState } from "react";
import { getAccessTokenAuthorizationHeaders } from "Utils/AuthorizationUtils";
import { ApiEndpoints } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import { AccessInputMetadata, EncryptedAccessToken } from "../Contracts/DataModels";

const url = `${configContext.BACKEND_ENDPOINT}${ApiEndpoints.guestRuntimeProxy}/accessinputmetadata?_=1609359229955`;

export async function fetchAccessData(portalToken: EncryptedAccessToken): Promise<AccessInputMetadata> {
  const headers = getAccessTokenAuthorizationHeaders(portalToken);
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
