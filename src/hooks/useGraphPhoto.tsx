import { useEffect, useState } from "react";

export async function fetchPhoto(accessToken: string): Promise<Blob | void> {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);
  headers.append("Content-Type", "image/jpg");

  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch("https://graph.windows.net/me/thumbnailPhoto?api-version=1.6", options).then((response) =>
    response.blob()
  );
}

export function useGraphPhoto(graphToken: string): string {
  const [photo, setPhoto] = useState<string>("");

  useEffect(() => {
    if (graphToken) {
      fetchPhoto(graphToken).then((response) => setPhoto(URL.createObjectURL(response)));
    }
  }, [graphToken]);
  return photo;
}
