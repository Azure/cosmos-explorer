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

  if (userContext.features.enableLegacyMongoShellV1Debug === true) {
    return `/mongoshell/debug/index.html?${queryString}`;
  }

  if (userContext.features.enableLegacyMongoShellV2 === true) {
    return `/mongoshell/indexv2.html?${queryString}`;
  }

  if (userContext.features.enableLegacyMongoShellV2Debug === true) {
    return `/mongoshell/debug/indexv2.html?${queryString}`;
  }

  if (userContext.portalEnv === "localhost") {
    return `/mongoshell/indexv2.html?${queryString}`;
  }

  if (userContext.features.loadLegacyMongoShellFromBE === true) {
    const extensionEndpoint: string = getExtensionEndpoint(configContext.platform, configContext.BACKEND_ENDPOINT);
    return `${extensionEndpoint}/content/mongoshell/debug/index.html?${queryString}`;
  }

  return `/mongoshell/indexv2.html?${queryString}`;
}

export function getExtensionEndpoint(platform: string, backendEndpoint: string): string {
  const runtimeEndpoint = platform === Platform.Hosted ? backendEndpoint : "";

  const extensionEndpoint: string = backendEndpoint || runtimeEndpoint || "";

  return extensionEndpoint;
}
