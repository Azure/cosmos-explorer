import { configContext } from "../../../ConfigContext";
import { userContext } from "../../../UserContext";

export function getMongoShellOrigin(): string {
  if (userContext.features.loadLegacyMongoShellFromBE === true) {
    return configContext.BACKEND_ENDPOINT;
  }

  return window.origin;
}
