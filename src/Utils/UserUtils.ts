import { userContext } from "../UserContext";
import { decryptJWTToken } from "./AuthorizationUtils";

export const getFullName = (): string => {
  const { authorizationToken } = userContext;
  const { name } = decryptJWTToken(authorizationToken);
  return name;
};
