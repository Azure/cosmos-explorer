import { userContext } from "../UserContext";
import { decryptJWTToken } from "./AuthorizationUtils";

export function getFullName(): string {
  const authToken = userContext.authorizationToken;
  const props = decryptJWTToken(authToken);
  return props.name;
}
