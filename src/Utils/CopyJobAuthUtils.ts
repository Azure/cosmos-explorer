import { userContext } from "UserContext";

export function getCopyJobAuthorizationHeader(token: string = ""): Headers {
  if (!token && !userContext.authorizationToken) {
    throw new Error("Authorization token is missing");
  }
  const headers = new Headers();
  const authToken = token ? `Bearer ${token}` : userContext.authorizationToken ?? "";
  headers.append("Authorization", authToken);
  headers.append("Content-Type", "application/json");
  return headers;
}
