import {
  allowedAadEndpoints,
  allowedArcadiaEndpoints,
  allowedArmEndpoints,
  allowedBackendEndpoints,
  allowedEmulatorEndpoints,
  allowedGraphEndpoints,
  allowedHostedExplorerEndpoints,
  allowedJunoOrigins,
  allowedMongoBackendEndpoints,
  allowedMsalRedirectEndpoints,
  validateEndpoint,
} from "Utils/EndpointValidation";

export enum Platform {
  Portal = "Portal",
  Hosted = "Hosted",
  Emulator = "Emulator",
}

export interface ConfigContext {
  platform: Platform;
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
  ARCADIA_ENDPOINT: string;
  ARCADIA_LIVY_ENDPOINT_DNS_ZONE: string;
  BACKEND_ENDPOINT?: string;
  MONGO_BACKEND_ENDPOINT?: string;
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
  allowedParentFrameOrigins: [
    `^https:\\/\\/cosmos\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.microsoftazure\\.de$`,
    `^https:\\/\\/[\\.\\w]*ext\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*\\.ext\\.microsoftazure\\.de$`,
    `^https:\\/\\/cosmos-db-dataexplorer-germanycentral\\.azurewebsites\\.de$`,
  ], // Webpack injects this at build time
  gitSha: process.env.GIT_SHA,
  hostedExplorerURL: "https://cosmos.azure.com/",
  AAD_ENDPOINT: "https://login.microsoftonline.com/",
  ARM_AUTH_AREA: "https://management.azure.com/",
  ARM_ENDPOINT: "https://management.azure.com/",
  ARM_API_VERSION: "2016-06-01",
  GRAPH_ENDPOINT: "https://graph.windows.net",
  GRAPH_API_VERSION: "1.6",
  ARCADIA_ENDPOINT: "https://workspaceartifacts.projectarcadia.net",
  ARCADIA_LIVY_ENDPOINT_DNS_ZONE: "dev.azuresynapse.net",
  GITHUB_CLIENT_ID: "6cb2f63cf6f7b5cbdeca", // Registered OAuth app: https://github.com/organizations/AzureCosmosDBNotebooks/settings/applications/1189306
  GITHUB_TEST_ENV_CLIENT_ID: "b63fc8cbf87fd3c6e2eb", // Registered OAuth app: https://github.com/organizations/AzureCosmosDBNotebooks/settings/applications/1777772
  JUNO_ENDPOINT: "https://tools.cosmos.azure.com",
  BACKEND_ENDPOINT: "https://main.documentdb.ext.azure.com",
  isTerminalEnabled: false,
  isPhoenixEnabled: false,
};

export function resetConfigContext(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetConfigContext can only becalled in a test environment");
  }
  configContext = {} as ConfigContext;
}

export function updateConfigContext(newContext: Partial<ConfigContext>): void {
  if (!newContext) {
    return;
  }

  if (!validateEndpoint(newContext.ARM_ENDPOINT, allowedArmEndpoints)) {
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

  if (!validateEndpoint(newContext.BACKEND_ENDPOINT, allowedBackendEndpoints)) {
    delete newContext.BACKEND_ENDPOINT;
  }

  if (!validateEndpoint(newContext.MONGO_BACKEND_ENDPOINT, allowedMongoBackendEndpoints)) {
    delete newContext.MONGO_BACKEND_ENDPOINT;
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

// Injected for local develpment. These will be removed in the production bundle by webpack
if (process.env.NODE_ENV === "development") {
  const port: string = process.env.PORT || "1234";
  updateConfigContext({
    BACKEND_ENDPOINT: "https://localhost:" + port,
    MONGO_BACKEND_ENDPOINT: "https://localhost:" + port,
    PROXY_PATH: "/proxy",
    EMULATOR_ENDPOINT: "https://localhost:8081",
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
