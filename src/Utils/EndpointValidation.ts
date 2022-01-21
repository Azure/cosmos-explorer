export function validateEndpoint(endpointToValidate: string, allowedEndpoints: ReadonlyArray<string>): boolean {
    if (!endpointToValidate) {
        return true;
    }
    const originToValidate: string = new URL(endpointToValidate).origin;
    const allowedOrigins: string[] = allowedEndpoints.map(allowedEndpoint => new URL(allowedEndpoint).origin) || [];
    return allowedOrigins.indexOf(originToValidate) >= 0;
}

export const allowedArmEndpoints: ReadonlyArray<string> = [
    "https://​management.azure.com",
    "https://​management.usgovcloudapi.net",
    "https://management.chinacloudapi.cn"
];

export const allowedAadEndpoints: ReadonlyArray<string> = [
    "https://login.microsoftonline.com/"
];

export const allowedParentFrameOrigins: ReadonlyArray<string> = [
    `^https:\\/\\/cosmos\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*portal\\.microsoftazure.de$`,
    `^https:\\/\\/[\\.\\w]*ext\\.azure\\.(com|cn|us)$`,
    `^https:\\/\\/[\\.\\w]*\\.ext\\.microsoftazure\\.de$`,
    `^https://cosmos-db-dataexplorer-germanycentral.azurewebsites.de$`,
];

export const allowedJunoOrigins: ReadonlyArray<string> = [
    "https://juno-test.documents-dev.windows-int.net",
    "https://juno-test2.documents-dev.windows-int.net",
    "https://tools.cosmos.azure.com",
    "https://tools-staging.cosmos.azure.com",
    "https://localhost",
];

export const allowedEmulatorEndpoints: ReadonlyArray<string> = [
];

export const allowedGraphEndpoints: ReadonlyArray<string> = [

];

export const allowedArcadiaEndpoints: ReadonlyArray<string> = [

];

export const allowedArcadiaLivyDnsZones: ReadonlyArray<string> = [

];

export const allowedBackendEndpoints: ReadonlyArray<string> = [

];

export const allowedMongoBackendEndpoints: ReadonlyArray<string> = [

];

export const allowedJunoEndpoints: ReadonlyArray<string> = [

];

export const allowedHostedExplorerEndpoints: ReadonlyArray<string> = [

];

export const allowedMsalRedirectEndpoints: ReadonlyArray<string> = [

];

export const allowedMongoProxyEndpoints: ReadonlyArray<string> = [

];

export const allowedPhoenixEndpoints: ReadonlyArray<string> = [

];

export const allowedNotebookServerUrls: ReadonlyArray<string> = [

];
