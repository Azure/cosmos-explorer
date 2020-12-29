import { useEffect, useState } from "react";
import { useAADToken } from "./useAADToken";

export async function fetchMe(accessToken: string): Promise<ProfileResponse> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers
  };

  return fetch("https://graph.windows.net/me?api-version=1.6", options)
    .then(response => response.json())
    .catch(error => console.log(error));
}

interface ProfileResponse {
  displayName: string;
  givenName: string;
  jobTitle: string;
  mail: string;
  mobilePhone: null;
  officeLocation: string;
  preferredLanguage: null;
  surname: string;
  userPrincipalName: string;
  id: string;
}

export function useGraphProfile(): ProfileResponse {
  const token = useAADToken();
  const [profileResponse, setProfileResponse] = useState<ProfileResponse>();

  useEffect(() => {
    if (token) {
      fetchMe(token).then(response => setProfileResponse(response));
    }
  }, [token]);
  return profileResponse;
}
