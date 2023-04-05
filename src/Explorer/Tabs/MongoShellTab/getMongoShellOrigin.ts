import { configContext } from "../../../ConfigContext";
import { userContext } from "../../../UserContext";

export function getMongoShellOrigin(): string {
  if (
    userContext.features.enableLegacyMongoShellV1 === true ||
    userContext.features.enableLegacyMongoShellV2 === true ||
    userContext.features.enableLegacyMongoShellV1Dist === true ||
    userContext.features.enableLegacyMongoShellV2Dist === true
  ) {
    return window.origin;
  }

  return configContext.BACKEND_ENDPOINT;
}
