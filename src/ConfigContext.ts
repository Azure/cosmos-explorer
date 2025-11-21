import { CassandraProxyEndpoints, JunoEndpoints, MongoProxyEndpoints, PortalBackendEndpoints } from "Common/Constants";
import {
  allowedArcadiaEndpoints,
  allowedEmulatorEndpoints,
  allowedHostedExplorerEndpoints,
  allowedJunoOrigins,
  allowedMsalRedirectEndpoints,
  defaultAllowedAadEndpoints,
  defaultAllowedArmEndpoints,
  defaultAllowedBackendEndpoints,
  defaultAllowedCassandraProxyEndpoints,
  defaultAllowedGraphEndpoints,
  defaultAllowedMongoProxyEndpoints,
  validateEndpoint,
} from "Utils/EndpointUtils";

export enum Platform {
  Portal = "Portal",
  Hosted = "Hosted",
  Emulator = "Emulator",
  Fabric = "Fabric",
  VNextEmulator = "VNextEmulator",
}

export interface ConfigContext {
  platform: Platform;
  allowedAadEndpoints: ReadonlyArray<string>;
  allowedGraphEndpoints: ReadonlyArray<string>;
  allowedArmEndpoints: ReadonlyArray<string>;
  allowedBackendEndpoints: ReadonlyArray<string>;
  allowedCassandraProxyEndpoints: ReadonlyArray<string>;
  allowedMongoProxyEndpoints: ReadonlyArray<string>;
  allowedParentFrameOrigins: ReadonlyArray<string>;
  gitSha?: string;
  proxyPath?: string;
  AAD_ENDPOINT: string;
  ARM_ENDPOINT: string;
  EMULATOR_ENDPOINT?: string;
  GRAPH_ENDPOINT: string;
  GRAPH_API_VERSION: string;
  // This is the endpoint to get offering Ids to be used to fetch prices. Refer to this doc: https://learn.microsoft.com/en-us/rest/api/marketplacecatalog/dataplane/skus/list?view=rest-marketplacecatalog-dataplane-2023-05-01-preview&tabs=HTTP
  CATALOG_ENDPOINT: string;
  CATALOG_API_VERSION: string;
  CATALOG_API_KEY: string;
  ARCADIA_ENDPOINT: string;
  ARCADIA_LIVY_ENDPOINT_DNS_ZONE: string;
  PORTAL_BACKEND_ENDPOINT: string;
  MONGO_PROXY_ENDPOINT: string;
  CASSANDRA_PROXY_ENDPOINT: string;
  PROXY_PATH?: string;
  JUNO_ENDPOINT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_TEST_ENV_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET?: string; // No need to inject secret for prod. Juno already knows it.
  isPhoenixEnabled: boolean;
  hostedExplorerURL: string;
  armAPIVersion?: string;
  msalRedirectURI?: string;
}

// Default configuration
let configContext: Readonly<ConfigContext> = {
  platform: Platform.Portal,
  allowedAadEndpoints: defaultAllowedAadEndpoints,
  allowedGraphEndpoints: defaultAllowedGraphEndpoints,
  allowedArmEndpoints: defaultAllowedArmEndpoints,
  allowedBackendEndpoints: defaultAllowedBackendEndpoints,
  allowedCassandraProxyEndpoints: defaultAllowedCassandraProxyEndpoints,
  allowedMongoProxyEndpoints: defaultAllowedMongoProxyEndpoints,
  allowedParentFrameOrigins: [
    `^https:\\/\\/cosmos\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/cdb-(ms|ff|mc)-prod-pbe\\.cosmos\\.azure\\.(com|us|cn)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.microsoftazure\\.de$`,
    `^https:\\/\\/[\\.\\w]*ext\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*\\.ext\\.microsoftazure\\.de$`,
    `^https:\\/\\/cosmos-db-dataexplorer-germanycentral\\.azurewebsites\\.de$`,
    `^https:\\/\\/.*\\.fabric\\.microsoft\\.com$`,
    `^https:\\/\\/.*\\.powerbi\\.com$`,
    `^https:\\/\\/dataexplorer-preview\\.azurewebsites\\.net$`,
  ], // Webpack injects this at build time
  gitSha: process.env.GIT_SHA,
  hostedExplorerURL: "https://cosmos.azure.com/",
  AAD_ENDPOINT: "https://login.microsoftonline.com/",
  ARM_ENDPOINT: "https://management.azure.com/",
  GRAPH_ENDPOINT: "https://graph.microsoft.com",
  GRAPH_API_VERSION: "1.6",
  CATALOG_ENDPOINT: "https://catalogapi.azure.com/",
  CATALOG_API_VERSION: "2023-05-01-preview",
  CATALOG_API_KEY: "",
  ARCADIA_ENDPOINT: "https://workspaceartifacts.projectarcadia.net",
  ARCADIA_LIVY_ENDPOINT_DNS_ZONE: "dev.azuresynapse.net",
  GITHUB_CLIENT_ID: "6cb2f63cf6f7b5cbdeca", // Registered OAuth app: https://github.com/organizations/AzureCosmosDBNotebooks/settings/applications/1189306
  GITHUB_TEST_ENV_CLIENT_ID: "b63fc8cbf87fd3c6e2eb", // Registered OAuth app: https://github.com/organizations/AzureCosmosDBNotebooks/settings/applications/1777772
  JUNO_ENDPOINT: JunoEndpoints.Prod,
  PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Prod,
  MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
  CASSANDRA_PROXY_ENDPOINT: CassandraProxyEndpoints.Prod,
  isPhoenixEnabled: false,
};

export function resetConfigContext(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetConfigContext can only be called in a test environment");
  }
  configContext = {} as ConfigContext;
}

export function updateConfigContext(newContext: Partial<ConfigContext>): void {
  if (!newContext) {
    return;
  }

  if (newContext.allowedAadEndpoints) {
    Object.assign(configContext, { allowedAadEndpoints: newContext.allowedAadEndpoints });
  }
  if (newContext.allowedArmEndpoints) {
    Object.assign(configContext, { allowedArmEndpoints: newContext.allowedArmEndpoints });
  }
  if (newContext.allowedGraphEndpoints) {
    Object.assign(configContext, { allowedGraphEndpoints: newContext.allowedGraphEndpoints });
  }
  if (newContext.allowedBackendEndpoints) {
    Object.assign(configContext, { allowedBackendEndpoints: newContext.allowedBackendEndpoints });
  }
  if (newContext.allowedMongoProxyEndpoints) {
    Object.assign(configContext, { allowedMongoProxyEndpoints: newContext.allowedMongoProxyEndpoints });
  }
  if (newContext.allowedCassandraProxyEndpoints) {
    Object.assign(configContext, { allowedCassandraProxyEndpoints: newContext.allowedCassandraProxyEndpoints });
  }

  if (!validateEndpoint(newContext.AAD_ENDPOINT, configContext.allowedAadEndpoints)) {
    delete newContext.AAD_ENDPOINT;
  }

  if (!validateEndpoint(newContext.ARM_ENDPOINT, configContext.allowedArmEndpoints)) {
    delete newContext.ARM_ENDPOINT;
  }

  if (!validateEndpoint(newContext.EMULATOR_ENDPOINT, allowedEmulatorEndpoints)) {
    delete newContext.EMULATOR_ENDPOINT;
  }

  if (!validateEndpoint(newContext.GRAPH_ENDPOINT, configContext.allowedGraphEndpoints)) {
    delete newContext.GRAPH_ENDPOINT;
  }

  if (!validateEndpoint(newContext.ARCADIA_ENDPOINT, allowedArcadiaEndpoints)) {
    delete newContext.ARCADIA_ENDPOINT;
  }

  if (!validateEndpoint(newContext.PORTAL_BACKEND_ENDPOINT, configContext.allowedBackendEndpoints)) {
    delete newContext.PORTAL_BACKEND_ENDPOINT;
  }

  if (!validateEndpoint(newContext.MONGO_PROXY_ENDPOINT, configContext.allowedMongoProxyEndpoints)) {
    delete newContext.MONGO_PROXY_ENDPOINT;
  }

  if (!validateEndpoint(newContext.CASSANDRA_PROXY_ENDPOINT, configContext.allowedCassandraProxyEndpoints)) {
    delete newContext.CASSANDRA_PROXY_ENDPOINT;
  }

  if (!validateEndpoint(newContext.JUNO_ENDPOINT, allowedJunoOrigins)) {
    delete newContext.JUNO_ENDPOINT;
  }

  if (!validateEndpoint(newContext.hostedExplorerURL, allowedHostedExplorerEndpoints)) {
    delete newContext.hostedExplorerURL;
  }

  if (!validateEndpoint(newContext.msalRedirectURI, allowedMsalRedirectEndpoints)) {
    delete newContext.msalRedirectURI;
  }

  Object.assign(configContext, newContext);
}

// Injected for local development. These will be removed in the production bundle by webpack
if (process.env.NODE_ENV === "development") {
  updateConfigContext({
    PROXY_PATH: "/proxy",
    EMULATOR_ENDPOINT: "https://localhost:8081",
    PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Mpac,
    MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Mpac,
    CASSANDRA_PROXY_ENDPOINT: CassandraProxyEndpoints.Mpac,
  });
}

export async function initializeConfiguration(): Promise<ConfigContext> {
  try {
    const response = await fetch("./config.json", {
      headers: {
        "If-None-Match": "", // disable client side cache
      },
    });
    if (response.status === 200) {
      try {
        const { ...externalConfig } = await response.json();
        updateConfigContext(externalConfig);
      } catch (error) {
        console.error("Unable to parse json in config file");
        console.error(error);
      }
    }
    // Allow override of platform value with URL query parameter
    const params = new URLSearchParams(window.location.search);
    if (params.has("armAPIVersion")) {
      const armAPIVersion = params.get("armAPIVersion") || "";
      updateConfigContext({ armAPIVersion });
    }
    if (params.has("armEndpoint")) {
      const ARM_ENDPOINT = params.get("armEndpoint") || "";
      updateConfigContext({ ARM_ENDPOINT });
    }
    if (params.has("aadEndpoint")) {
      const AAD_ENDPOINT = params.get("aadEndpoint") || "";
      updateConfigContext({ AAD_ENDPOINT });
    }
    if (params.has("platform") && configContext.platform !== Platform.VNextEmulator) {
      const platform = params.get("platform");
      switch (platform) {
        default:
          console.error(`Invalid platform query parameter: ${platform}`);
          break;
        case Platform.Portal:
        case Platform.Fabric:
        case Platform.Hosted:
        case Platform.Emulator:
          updateConfigContext({ platform });
      }
    }
  } catch (error) {
    console.error("No configuration file found using defaults");
  }
  return configContext;
}

export { configContext };
