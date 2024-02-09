import { userContext } from "../UserContext";

export function isRunningOnNationalCloud(): boolean {
  return (
    userContext?.portalEnv === "blackforest" ||
    userContext?.portalEnv === "fairfax" ||
    userContext?.portalEnv === "mooncake"
  );
}
