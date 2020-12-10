import AuthHeadersUtil from "../Platform/Hosted/Authorization";
import { decryptJWTToken } from "./AuthorizationUtils";
import { userContext } from "../UserContext";

export function getFullName(): string {
  let fullName: string;
  const user = AuthHeadersUtil.getCachedUser();
  if (user) {
    fullName = user.profile.name;
  } else {
    const authToken = userContext.authorizationToken;
    const props = decryptJWTToken(authToken);
    fullName = props.name;
  }

  return fullName;
}
