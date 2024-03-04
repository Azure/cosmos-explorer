import { userContext } from "../UserContext";

export function isRunningOnNationalCloud(): boolean {
  return !isRunningOnPublicCloud();
}

export function isRunningOnPublicCloud(): boolean {
  return userContext?.portalEnv === "prod1" || userContext?.portalEnv === "prod";
}
