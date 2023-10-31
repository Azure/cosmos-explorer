import { userContext } from "../../../../UserContext";

export function areScriptsSupported(): boolean {
  return userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
}
