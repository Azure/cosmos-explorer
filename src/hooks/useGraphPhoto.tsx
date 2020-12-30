import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/authContext";

export async function fetchPhoto(accessToken: string): Promise<Blob | void> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);
  headers.append("Content-Type", "image/jpg");

  const options = {
    method: "GET",
    headers: headers
  };

  return fetch("https://graph.windows.net/me/thumbnailPhoto?api-version=1.6", options)
    .then(response => response.blob())
    .catch(error => console.log(error));
}

export function useGraphPhoto(): string {
  const [photo, setPhoto] = useState<string>();
  const { graphToken } = useContext(AuthContext);

  useEffect(() => {
    if (graphToken) {
      fetchPhoto(graphToken).then(response => setPhoto(URL.createObjectURL(response)));
    }
  }, [graphToken]);
  return photo;
}
