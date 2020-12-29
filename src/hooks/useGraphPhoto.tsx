import { useEffect, useState } from "react";
import { useAADToken } from "./useAADToken";

export async function fetchPhoto(accessToken: string): Promise<Blob | void> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);
  headers.append("Content-Type", "image/jpg");

  const options = {
    method: "GET",
    headers: headers
  };

  return fetch("https://graph.microsoft.com/v1.0/me/photo/$value", options)
    .then(response => response.blob())
    .catch(error => console.log(error));
}

export function useGraphPhoto(): string {
  const token = useAADToken();
  const [photo, setPhoto] = useState<string>();

  useEffect(() => {
    if (token) {
      fetchPhoto(token).then(response => setPhoto(URL.createObjectURL(response)));
    }
  }, [token]);
  return photo;
}
