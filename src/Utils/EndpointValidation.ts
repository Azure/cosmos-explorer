export function validateEndpoint(endpointToValidate: string, allowedEndpoints: string[]): boolean {
  if (!endpointToValidate) {
    return true;
  }
  const originToValidate: string = new URL(endpointToValidate).origin;
  const allowedOrigins: string[] = allowedEndpoints.map((allowedEndpoint) => new URL(allowedEndpoint).origin) || [];
  return allowedOrigins.indexOf(originToValidate) >= 0;
}

export const allowedArmEndpoints: ReadonlyArray<string> = [
  "https://​management.azure.com",
  "https://​management.usgovcloudapi.net",
  "https://management.chinacloudapi.cn",
];

export const allowedAadEndpoints: ReadonlyArray<string> = ["https://login.microsoftonline.com/"];

export const allowedEmulatorEndpoints: ReadonlyArray<string> = [];

export const allowedGraphEndpoints: ReadonlyArray<string> = [];

export const allowedArcadiaEndpoints: ReadonlyArray<string> = [];

export const allowedArcadiaLivyDnsZones: ReadonlyArray<string> = [];

export const allowedBackendEndpoints: ReadonlyArray<string> = [];

export const allowedMongoBackendEndpoints: ReadonlyArray<string> = [];

export const allowedJunoEndpoints: ReadonlyArray<string> = [];

export const allowedHostedExplorerEndpoints: ReadonlyArray<string> = [];

export const allowedMsalRedirectEndpoints: ReadonlyArray<string> = [];

export const allowedMongoProxyEndpoints: ReadonlyArray<string> = [];

export const allowedPhoenixEndpoints: ReadonlyArray<string> = [];

export const allowedNotebookServerUrls: ReadonlyArray<string> = [];
