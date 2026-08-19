import { configContext } from "../ConfigContext";
import { AccessInputMetadata } from "../Contracts/DataModels";
import { HttpHeaders } from "./Constants";

export async function fetchAccessData(portalToken: string): Promise<AccessInputMetadata> {
  const headers = new Headers();
  // Portal encrypted token API quirk: The token header must be URL encoded
  headers.append(HttpHeaders.guestAccessToken, encodeURIComponent(portalToken));
  headers.append(HttpHeaders.authorization, encodeURIComponent(portalToken));
  const url: string = `${configContext.PORTAL_BACKEND_ENDPOINT}/api/connectionstring/runtimeproxy/accessinputmetadata`;
  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch(url, options)
    .then((response) => response.json())
    .catch((error) => console.error(error));
}

export async function fetchEncryptedToken(connectionString: string): Promise<string> {
  const headers = new Headers();
  headers.append(HttpHeaders.connectionString, connectionString);
  headers.append(HttpHeaders.authorization, connectionString);
  const url = configContext.PORTAL_BACKEND_ENDPOINT + "/api/connectionstring/token/generatetoken";
  const response = await fetch(url, { headers, method: "POST" });
  if (!response.ok) {
    throw response;
  }

  const encryptedTokenResponse: string = await response.json();
  return decodeURIComponent(encryptedTokenResponse);
}

export async function isAccountRestrictedForConnectionStringLogin(connectionString: string): Promise<boolean> {
  const headers = new Headers();
  headers.append(HttpHeaders.connectionString, connectionString);
  const url = configContext.PORTAL_BACKEND_ENDPOINT + "/api/guest/accountrestrictions/checkconnectionstringlogin";
  const response = await fetch(url, { headers, method: "POST" });
  if (!response.ok) {
    throw response;
  }

  return (await response.text()).toLowerCase() === "true";
}
