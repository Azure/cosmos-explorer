import { useAccount, useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";

export async function fetchMe(accessToken: string): Promise<GraphMeResponse> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers
  };

  console.log("EXECUTING REQUEST");
  return fetch("https://graph.microsoft.com/v1.0/me", options)
    .then(response => response.json())
    .catch(error => console.log(error));
}

export async function fetchPhoto(accessToken: string): Promise<Blob | void> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);
  headers.append("Content-Type", "image/jpg");

  const options = {
    method: "GET",
    headers: headers
  };

  console.log("EXECUTING REQUEST");
  return fetch("https://graph.microsoft.com/v1.0/me/photo/$value", options)
    .then(response => response.blob())
    .catch(error => console.log(error));
}

interface GraphMeResponse {
  businessPhones: any[];
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

export function useGraphProfile(): { graphData: GraphMeResponse; photo: string } {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [graphData, setGraphData] = useState<GraphMeResponse>();
  const [photo, setPhoto] = useState<string>();

  useEffect(() => {
    console.log("account", account);
    if (account) {
      instance
        .acquireTokenSilent({
          scopes: ["User.Read"],
          account
        })
        .then(response => {
          fetchMe(response.accessToken).then(response => setGraphData(response));
          fetchPhoto(response.accessToken).then(response => setPhoto(URL.createObjectURL(response)));
        });
    }
  }, [account]);
  return { graphData, photo };
}
