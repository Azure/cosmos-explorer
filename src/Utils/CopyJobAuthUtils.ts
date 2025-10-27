import { userContext } from "UserContext";

export function getCopyJobAuthorizationHeader(token: string = ""): Headers {
    const headers = new Headers();
    const authToken = token ? `Bearer ${token}` : userContext.authorizationToken;
    headers.append("Authorization", authToken);
    headers.append("Content-Type", "application/json");
    return headers;
}