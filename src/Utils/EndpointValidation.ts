export function validateEndpoint(endpointToValidate: string | undefined, allowedEndpoints: string[]): boolean {
  try {
    return validateEndpointInternal(endpointToValidate, allowedEndpoints);
  } catch {
    return false;
  }
}

function validateEndpointInternal(endpointToValidate: string | undefined, allowedEndpoints: string[]): boolean {
  if (endpointToValidate === undefined) {
    return false;
  }

  const originToValidate: string = new URL(endpointToValidate).origin;
  const allowedOrigins: string[] = allowedEndpoints.map((allowedEndpoint) => new URL(allowedEndpoint).origin) || [];
  const valid = allowedOrigins.indexOf(originToValidate) >= 0;

  if (!valid) {
    console.error(`${endpointToValidate} not allowed`);
  }

  return valid;
}

export const allowedArmEndpoints: ReadonlyArray<string> = [
  "https://​management.azure.com",
  "https://​management.usgovcloudapi.net",
  "https://management.chinacloudapi.cn",
];

export const allowedAadEndpoints: ReadonlyArray<string> = ["https://login.microsoftonline.com/"];

export const allowedBackendEndpoints: ReadonlyArray<string> = [
  "https://main.documentdb.ext.azure.com",
  "https://localhost:12901",
  "https://localhost:1234",
];

export const allowedMongoProxyEndpoints: ReadonlyArray<string> = [
  "https://main.documentdb.ext.azure.com",
  "https://localhost:12901",
];

export const allowedEmulatorEndpoints: ReadonlyArray<string> = ["https://localhost:8081"];

export const allowedMongoBackendEndpoints: ReadonlyArray<string> = ["https://localhost:1234"];

export const allowedGraphEndpoints: ReadonlyArray<string> = ["https://graph.windows.net"];

export const allowedArcadiaEndpoints: ReadonlyArray<string> = ["https://workspaceartifacts.projectarcadia.net"];

export const allowedHostedExplorerEndpoints: ReadonlyArray<string> = ["https://cosmos.azure.com/"];

export const allowedMsalRedirectEndpoints: ReadonlyArray<string> = [
  "https://cosmos-explorer-preview.azurewebsites.net/",
];

export const allowedNotebookServerUrls: ReadonlyArray<string> = [];
