import { decryptJWTToken } from "./AuthorizationUtils";
import { userContext } from "../UserContext";

export function getFullName(): string {
  const authToken = userContext.authorizationToken;
  const props = decryptJWTToken(authToken);
  return props.name;
}
