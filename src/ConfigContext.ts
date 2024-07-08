import {
  BackendApi,
  CassandraProxyEndpoints,
  JunoEndpoints,
  MongoProxyEndpoints,
  PortalBackendEndpoints,
} from "Common/Constants";
import {
  allowedAadEndpoints,
  allowedArcadiaEndpoints,
  allowedCassandraProxyEndpoints,
  allowedEmulatorEndpoints,
  allowedGraphEndpoints,
  allowedHostedExplorerEndpoints,
  allowedJunoOrigins,
  allowedMongoBackendEndpoints,
  allowedMongoProxyEndpoints,
  allowedMsalRedirectEndpoints,
  defaultAllowedArmEndpoints,
  defaultAllowedBackendEndpoints,
  validateEndpoint,
} from "Utils/EndpointUtils";

export enum Platform {
  Portal = "Portal",
  Hosted = "Hosted",
  Emulator = "Emulator",
  Fabric = "Fabric",
}

export interface ConfigContext {
  platform: Platform;
  allowedArmEndpoints: ReadonlyArray<string>;
  allowedBackendEndpoints: ReadonlyArray<string>;
  allowedParentFrameOrigins: ReadonlyArray<string>;
  gitSha?: string;
  proxyPath?: string;
  AAD_ENDPOINT: string;
  ARM_AUTH_AREA: string;
  ARM_ENDPOINT: string;
  EMULATOR_ENDPOINT?: string;
  ARM_API_VERSION: string;
  GRAPH_ENDPOINT: string;
  GRAPH_API_VERSION: string;
  // This is the endpoint to get offering Ids to be used to fetch prices. Refer to this doc: https://learn.microsoft.com/en-us/rest/api/marketplacecatalog/dataplane/skus/list?view=rest-marketplacecatalog-dataplane-2023-05-01-preview&tabs=HTTP
  CATALOG_ENDPOINT: string;
  CATALOG_API_VERSION: string;
  CATALOG_API_KEY: string;
  ARCADIA_ENDPOINT: string;
  ARCADIA_LIVY_ENDPOINT_DNS_ZONE: string;
  BACKEND_ENDPOINT?: string;
  PORTAL_BACKEND_ENDPOINT?: string;
  NEW_BACKEND_APIS?: BackendApi[];
  MONGO_BACKEND_ENDPOINT?: string;
  MONGO_PROXY_ENDPOINT?: string;
  MONGO_PROXY_OUTBOUND_IPS_ALLOWLISTED?: boolean;
  NEW_MONGO_APIS?: string[];
  CASSANDRA_PROXY_ENDPOINT?: string;
  CASSANDRA_PROXY_OUTBOUND_IPS_ALLOWLISTED: boolean;
  NEW_CASSANDRA_APIS?: string[];
  PROXY_PATH?: string;
  JUNO_ENDPOINT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_TEST_ENV_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET?: string; // No need to inject secret for prod. Juno already knows it.
  isTerminalEnabled: boolean;
  isPhoenixEnabled: boolean;
  hostedExplorerURL: string;
  armAPIVersion?: string;
  msalRedirectURI?: string;
}

// Default configuration
let configContext: Readonly<ConfigContext> = {
  platform: Platform.Portal,
  allowedArmEndpoints: defaultAllowedArmEndpoints,
  allowedBackendEndpoints: defaultAllowedBackendEndpoints,
  allowedParentFrameOrigins: [
    `^https:\\/\\/cosmos\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.microsoftazure\\.de$`,
    `^https:\\/\\/[\\.\\w]*ext\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*\\.ext\\.microsoftazure\\.de$`,
    `^https:\\/\\/cosmos-db-dataexplorer-germanycentral\\.azurewebsites\\.de$`,
    `^https:\\/\\/.*\\.fabric\\.microsoft\\.com$`,
    `^https:\\/\\/.*\\.powerbi\\.com$`,
    `^https:\\/\\/.*\\.analysis-df\\.net$`,
    `^https:\\/\\/.*\\.analysis-df\\.windows\\.net$`,
    `^https:\\/\\/.*\\.azure-test\\.net$`,
    `^https:\\/\\/cosmos-explorer-preview\\.azurewebsites\\.net`,
  ], // Webpack injects this at build time
  gitSha: process.env.GIT_SHA,
  hostedExplorerURL: "https://cosmos.azure.com/",
  AAD_ENDPOINT: "https://login.microsoftonline.com/",
  ARM_AUTH_AREA: "https://management.azure.com/",
  ARM_ENDPOINT: "https://management.azure.com/",
  ARM_API_VERSION: "2016-06-01",
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
  BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
  PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Prod,
  MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Prod,
  NEW_MONGO_APIS: [
    // "resourcelist",
    // "queryDocuments",
    // "createDocument",
    // "readDocument",
    // "updateDocument",
    // "deleteDocument",
    // "createCollectionWithProxy",
    // "legacyMongoShell",
  ],
  MONGO_PROXY_OUTBOUND_IPS_ALLOWLISTED: false,
  CASSANDRA_PROXY_ENDPOINT: CassandraProxyEndpoints.Prod,
  NEW_CASSANDRA_APIS: ["postQuery", "createOrDelete", "getKeys", "getSchema"],
  CASSANDRA_PROXY_OUTBOUND_IPS_ALLOWLISTED: false,
  isTerminalEnabled: false,
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

  if (!validateEndpoint(newContext.ARM_ENDPOINT, configContext.allowedArmEndpoints || defaultAllowedArmEndpoints)) {
    delete newContext.ARM_ENDPOINT;
  }

  if (!validateEndpoint(newContext.AAD_ENDPOINT, allowedAadEndpoints)) {
    delete newContext.AAD_ENDPOINT;
  }

  if (!validateEndpoint(newContext.EMULATOR_ENDPOINT, allowedEmulatorEndpoints)) {
    delete newContext.EMULATOR_ENDPOINT;
  }

  if (!validateEndpoint(newContext.GRAPH_ENDPOINT, allowedGraphEndpoints)) {
    delete newContext.GRAPH_ENDPOINT;
  }

  if (!validateEndpoint(newContext.ARCADIA_ENDPOINT, allowedArcadiaEndpoints)) {
    delete newContext.ARCADIA_ENDPOINT;
  }

  if (
    !validateEndpoint(
      newContext.BACKEND_ENDPOINT,
      configContext.allowedBackendEndpoints || defaultAllowedBackendEndpoints,
    )
  ) {
    delete newContext.BACKEND_ENDPOINT;
  }

  if (!validateEndpoint(newContext.MONGO_PROXY_ENDPOINT, allowedMongoProxyEndpoints)) {
    delete newContext.MONGO_PROXY_ENDPOINT;
  }

  if (!validateEndpoint(newContext.MONGO_BACKEND_ENDPOINT, allowedMongoBackendEndpoints)) {
    delete newContext.MONGO_BACKEND_ENDPOINT;
  }

  if (!validateEndpoint(newContext.CASSANDRA_PROXY_ENDPOINT, allowedCassandraProxyEndpoints)) {
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
    if (params.has("platform")) {
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
