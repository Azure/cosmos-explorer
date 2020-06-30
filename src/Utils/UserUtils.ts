import AuthHeadersUtil from "../Platform/Hosted/Authorization";
import { decryptJWTToken } from "./AuthorizationUtils";
import { CosmosClient } from "../Common/CosmosClient";

export function getFullName(): string {
  let fullName: string;
  const user = AuthHeadersUtil.getCachedUser();
  if (user) {
    fullName = user.profile.name;
  } else {
    const authToken = CosmosClient.authorizationToken();
    const props = decryptJWTToken(authToken);
    fullName = props.name;
  }

  return fullName;
}
