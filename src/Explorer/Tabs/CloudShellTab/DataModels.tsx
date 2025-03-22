/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */


export const enum OsType {
    Linux = "linux",
    Windows = "windows"
}

export const enum ShellType {
    Bash = "bash",
    PowerShellCore = "pwsh"
}
  
export const enum NetworkType {
    Default = "Default",
    Isolated = "Isolated"
}

export const enum SessionType {
    Mounted = "Mounted",
    Ephemeral = "Ephemeral"
}

export type Settings = {
    properties: UserSettingProperties
};

export type UserSettingProperties = {
    networkType: string;  
    preferredLocation: string;
    preferredOsType: OsType;
    preferredShellType: ShellType;
    userSubscription: string;
    sessionType: SessionType;
    vnetSettings: VnetSettings; 
}

export type VnetSettings = {
    networkProfileResourceId: string;
    relayNamespaceResourceId: string;
    location: string;
}

export type ProvisionConsoleResponse = {
    properties: {
        osType: OsType;
        provisioningState: string;
        uri: string;
    };
};

export type Authorization = {
    token: string;
};

export type ConnectTerminalResponse = {
    id: string;
    idleTimeout: string;
    rootDirectory: string;
    socketUri: string;
    tokenUpdated: boolean;
};

export type VnetModel = {
    name: string;
    id: string;
    etag: string;
    type: string;
    location: string;
    tags: Record<string, string>;
    properties: {
        provisioningState: string;
        resourceGuid: string;
        addressSpace: {
            addressPrefixes: string[];
        };
        encryption: {
            enabled: boolean;
            enforcement: string;
        };
        privateEndpointVNetPolicies: string;
        subnets: Array<{
            name: string;
            id: string;
            etag: string;
            type: string;
            properties: {
                provisioningState: string;
                addressPrefixes?: string[];
                addressPrefix?: string;
                networkSecurityGroup?: { id: string };
                ipConfigurations?: { id: string }[];
                ipConfigurationProfiles?: { id: string }[];
                privateEndpoints?: { id: string }[];
                serviceEndpoints?: Array<{
                    provisioningState: string;
                    service: string;
                    locations: string[];
                }>;
                delegations?: Array<{
                    name: string;
                    id: string;
                    etag: string;
                    type: string;
                    properties: {
                        provisioningState: string;
                        serviceName: string;
                        actions: string[];
                    };
                }>;
                purpose?: string;
                privateEndpointNetworkPolicies?: string;
                privateLinkServiceNetworkPolicies?: string;
            };
        }>;
        virtualNetworkPeerings: any[];
        enableDdosProtection: boolean;
    };
};

export type RelayNamespace = {
    id: string;
    name: string;
    type: string;
    location: string;
    tags: Record<string, string>;
    properties: {
        metricId: string;
        serviceBusEndpoint: string;
        provisioningState: string;
        status: string;
        createdAt: string;
        updatedAt: string;
    };
    sku: {
        name: string;
        tier: string;
    };
};

export type RelayNamespaceResponse = {
    value: RelayNamespace[];
};



