export enum Platform {
  Portal = "Portal",
  Hosted = "Hosted",
  Emulator = "Emulator"
}

interface ConfigContext {
  platform: Platform;
  allowedParentFrameOrigins: RegExp;
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
  GITHUB_CLIENT_SECRET?: string; // No need to inject secret for prod. Juno already knows it.
  hostedExplorerURL: string;
}

// Default configuration
let configContext: Readonly<ConfigContext> = {
  platform: Platform.Portal,
  allowedParentFrameOrigins: /^https:\/\/portal\.azure\.com$|^https:\/\/portal\.azure\.us$|^https:\/\/portal\.azure\.cn$|^https:\/\/portal\.microsoftazure\.de$|^https:\/\/.+\.portal\.azure\.com$|^https:\/\/.+\.portal\.azure\.us$|^https:\/\/.+\.portal\.azure\.cn$|^https:\/\/.+\.portal\.microsoftazure\.de$|^https:\/\/main\.documentdb\.ext\.azure\.com$|^https:\/\/main\.documentdb\.ext\.microsoftazure\.de$|^https:\/\/main\.documentdb\.ext\.azure\.cn$|^https:\/\/main\.documentdb\.ext\.azure\.us$/,
  // Webpack injects this at build time
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
  GITHUB_CLIENT_ID: "6cb2f63cf6f7b5cbdeca", // Registered OAuth app: https://github.com/settings/applications/1189306
  JUNO_ENDPOINT: "https://tools.cosmos.azure.com"
};

export function resetConfigContext(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("resetConfigContext can only becalled in a test environment");
  }
  configContext = {} as ConfigContext;
}

export function updateConfigContext(newContext: Partial<ConfigContext>): void {
  Object.assign(configContext, newContext);
}

// Injected for local develpment. These will be removed in the production bundle by webpack
if (process.env.NODE_ENV === "development") {
  const port: string = process.env.PORT || "1234";
  updateConfigContext({
    BACKEND_ENDPOINT: "https://localhost:" + port,
    MONGO_BACKEND_ENDPOINT: "https://localhost:" + port,
    PROXY_PATH: "/proxy",
    EMULATOR_ENDPOINT: "https://localhost:8081"
  });
}

export async function initializeConfiguration(): Promise<ConfigContext> {
  try {
    const response = await fetch("./config.json");
    if (response.status === 200) {
      try {
        const externalConfig = await response.json();
        Object.assign(configContext, externalConfig);
      } catch (error) {
        console.error("Unable to parse json in config file");
        console.error(error);
      }
    }
    // Allow override of platform value with URL query parameter
    const params = new URLSearchParams(window.location.search);
    if (params.has("platform")) {
      const platform = params.get("platform");
      switch (platform) {
        default:
          console.log("Invalid platform query parameter given, ignoring");
          break;
        case Platform.Portal:
        case Platform.Hosted:
        case Platform.Emulator:
          updateConfigContext({ platform });
      }
    }
  } catch (error) {
    console.log("No configuration file found using defaults");
  }
  return configContext;
}

export { configContext };
