import { configContext, Platform } from "../../../ConfigContext";
import { userContext } from "../../../UserContext";

export function getMongoShellUrl(): string {
  const { databaseAccount: account } = userContext;
  const resourceId = account?.id;
  const accountName = account?.name;
  const mongoEndpoint = account?.properties?.mongoEndpoint || account?.properties?.documentEndpoint;
  const queryString = `resourceId=${resourceId}&accountName=${accountName}&mongoEndpoint=${mongoEndpoint}`;

  if (userContext.features.enableLegacyMongoShellV1 === true) {
    return `/mongoshell/index.html?${queryString}`;
  }

  if (userContext.features.enableLegacyMongoShellV1Dist === true) {
    return `/mongoshell/dist/index.html?${queryString}`;
  }

  if (userContext.features.enableLegacyMongoShellV2 === true) {
    return `/mongoshell/indexv2.html?${queryString}`;
  }

  if (userContext.features.enableLegacyMongoShellV2Dist === true) {
    return `/mongoshell/dist/indexv2.html?${queryString}`;
  }

  const runtimeEndpoint = configContext.platform === Platform.Hosted ? configContext.BACKEND_ENDPOINT : "";

  const extensionEndpoint: string = getExtensionEndpoint(configContext.platform, configContext.BACKEND_ENDPOINT);

  if (userContext.portalEnv === "localhost") {
    return `${extensionEndpoint}/content/mongoshell/index.html?${queryString}`;
  }

  return `${extensionEndpoint}/content/mongoshell/dist/index.html?${queryString}`;
}

export function getExtensionEndpoint(platform: string, backendEndpoint: string): string {
  const runtimeEndpoint = platform === Platform.Hosted ? backendEndpoint : "";

  const extensionEndpoint: string = backendEndpoint || runtimeEndpoint || "";

  return extensionEndpoint;
}
