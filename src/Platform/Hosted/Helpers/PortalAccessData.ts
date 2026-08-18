import { HttpHeaders } from "../../../Common/Constants";
import { configContext } from "../../../ConfigContext";
import { AccessInputMetadata } from "../../../Contracts/DataModels";

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
