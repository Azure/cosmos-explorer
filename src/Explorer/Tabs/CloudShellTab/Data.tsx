/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { ApiVersionsConfig, ResourceType } from "Explorer/Tabs/CloudShellTab/DataModels";
import { v4 as uuidv4 } from 'uuid';
import { configContext } from "../../../ConfigContext";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { userContext } from '../../../UserContext';
import { armRequest } from "../../../Utils/arm/request";
import { Authorization, ConnectTerminalResponse, NetworkType, OsType, ProvisionConsoleResponse, SessionType, Settings, ShellType } from "./DataModels";

/**
 * API version configuration by terminal type and resource type
 */
const API_VERSIONS : ApiVersionsConfig = {
    // Default version for fallback
    DEFAULT: "2024-07-01",
    
    // Resource type specific defaults
    RESOURCE_DEFAULTS: {
      [ResourceType.NETWORK]: "2023-05-01",
      [ResourceType.DATABASE]: "2024-07-01",
      [ResourceType.VNET]: "2023-05-01",
      [ResourceType.SUBNET]: "2023-05-01",
      [ResourceType.RELAY]: "2024-01-01",
      [ResourceType.ROLE]: "2022-04-01"
    },
    
    // Shell-type specific versions with resource overrides
    SHELL_TYPES: {
      [TerminalKind.Mongo]: {
        [ResourceType.DATABASE]: "2024-11-15"
      },
      [TerminalKind.VCoreMongo]: {
        [ResourceType.DATABASE]: "2024-07-01"
      },
      [TerminalKind.Cassandra]: {
        [ResourceType.DATABASE]: "2024-11-15"
      }
    }
  };

export const validateUserSettings = (userSettings: Settings) => {
    if (userSettings.sessionType !== SessionType.Ephemeral && userSettings.osType !== OsType.Linux) {
        return false;
    } else {
        return true;
    }
}

// Current shell type context
let currentShellType: TerminalKind | null = null;

/**
 * Set the active shell type to determine API version
 */
export const setShellType = (shellType: TerminalKind): void => {
  currentShellType = shellType;
};

/**
 * Get the appropriate API version based on shell type and resource type
 * Uses a cascading fallback approach for maximum flexibility
 */
export const getApiVersion = (resourceType?: ResourceType): string => {
    // If no shell type is set, fallback to resource default or global default
    if (!currentShellType) {
      return resourceType ? 
        (API_VERSIONS.RESOURCE_DEFAULTS[resourceType] || API_VERSIONS.DEFAULT) : 
        API_VERSIONS.DEFAULT;
    }
    
    // Shell type is set, try to get specific version in this priority:
    // 1. Shell-specific + resource-specific
    if (resourceType && 
        API_VERSIONS.SHELL_TYPES[currentShellType]) {
      const shellTypeConfig = API_VERSIONS.SHELL_TYPES[currentShellType];
      if (resourceType in shellTypeConfig) {
        return shellTypeConfig[resourceType] as string;
      }
    }

    // 2. Resource-specific default
    if (resourceType && resourceType in API_VERSIONS.RESOURCE_DEFAULTS) {
      return API_VERSIONS.RESOURCE_DEFAULTS[resourceType];
    }
    
    // 3. Global default
    return API_VERSIONS.DEFAULT;
};

export const getUserRegion = async (subscriptionId: string, resourceGroup: string, accountName: string) => {
    return await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
        method: "GET",
        apiVersion: "2022-12-01"
      });

};

export const deleteUserSettings = async (): Promise<void> => {
    await armRequest<void>({
        host: configContext.ARM_ENDPOINT,
        path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
        method: "DELETE",
        apiVersion: "2023-02-01-preview"
      });
};

export const getUserSettings = async (): Promise<Settings> => {
    const resp = await armRequest<any>({
        host: configContext.ARM_ENDPOINT,
        path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
        method: "GET",
        apiVersion: "2023-02-01-preview"
      });

    return resp;
};

export const putEphemeralUserSettings = async (userSubscriptionId: string, userRegion: string, vNetSettings?: object) => {
    const ephemeralSettings = {
        properties: {
            preferredOsType: OsType.Linux,
            preferredShellType: ShellType.Bash,
            preferredLocation: userRegion,
            networkType: (!vNetSettings || Object.keys(vNetSettings).length === 0) ? NetworkType.Default : (vNetSettings ? NetworkType.Isolated : NetworkType.Default),
            sessionType: SessionType.Ephemeral,
            userSubscription: userSubscriptionId,
            vnetSettings: vNetSettings ?? {}
        }
    };

    return await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
        method: "PUT",
        apiVersion: "2023-02-01-preview",
        body: ephemeralSettings
      });
};

export const verifyCloudShellProviderRegistration = async(subscriptionId: string) => {
    return await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell`,
        method: "GET",
        apiVersion: "2022-12-01"
      });
};

export const registerCloudShellProvider = async (subscriptionId: string) => {
    return await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell/register`,
        method: "POST",
        apiVersion: "2022-12-01"
      });
};

export const provisionConsole = async (subscriptionId: string, location: string): Promise<ProvisionConsoleResponse> => {
    const data = {
        properties: {
            osType: OsType.Linux
        }
    };

    return await armRequest<any>({
        host: configContext.ARM_ENDPOINT,
        path: `providers/Microsoft.Portal/consoles/default`,
        method: "PUT",
        apiVersion: "2023-02-01-preview",
        customHeaders: {
            'x-ms-console-preferred-location': location
        },
        body: data,
      });
};

export const connectTerminal = async (consoleUri: string, size: { rows: number, cols: number }): Promise<ConnectTerminalResponse> => {
    const targetUri = consoleUri + `/terminals?cols=${size.cols}&rows=${size.rows}&version=2019-01-01&shell=bash`;
    const resp = await fetch(targetUri, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': '2',
            'Authorization': userContext.authorizationToken,
            'x-ms-client-request-id': uuidv4(),
            'Accept-Language': getLocale(),
        },
        body: "{}" // empty body is necessary
    });
    return resp.json();
};

export const authorizeSession = async (consoleUri: string): Promise<Authorization> => {
    const targetUri = consoleUri + "/authorize";
    const resp = await fetch(targetUri, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Authorization': userContext.authorizationToken,
            'Accept-Language': getLocale(),
            "Content-Type": 'application/json'
        },
        body: "{}" // empty body is necessary
    });
    return resp.json();
};

export const getLocale = () => {
    const langLocale = navigator.language;
    return (langLocale && langLocale.length === 2 ? langLocale[1] : 'en-us');
};

const validCloudShellRegions = new Set(["westus", "southcentralus", "eastus", "northeurope", "westeurope", "centralindia", "southeastasia", "westcentralus"]);

export const getNormalizedRegion = (region: string, defaultCloudshellRegion: string) => {
    if (!region) return defaultCloudshellRegion;
    
    const regionMap: Record<string, string> = {
      "centralus": "westcentralus",
      "eastus2": "eastus"
    };
    
    const normalizedRegion = regionMap[region.toLowerCase()] || region;
    return validCloudShellRegions.has(normalizedRegion.toLowerCase()) ? normalizedRegion : defaultCloudshellRegion;
};
  
export async function getNetworkProfileInfo<T>(networkProfileResourceId: string, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.NETWORK);
    return await GetARMCall<T>(networkProfileResourceId, apiVersion);
}

export async function getAccountDetails<T>(databaseAccountId: string, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.DATABASE);
    return await GetARMCall<T>(databaseAccountId, apiVersion);
}

export async function getVnetInformation<T>(vnetId: string, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.VNET);
    return await GetARMCall<T>(vnetId, apiVersion);
}

export async function getSubnetInformation<T>(subnetId: string, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.SUBNET);
    return await GetARMCall<T>(subnetId, apiVersion);
}

export async function updateSubnetInformation<T>(subnetId: string, request: object, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.SUBNET);
    return await PutARMCall(subnetId, request, apiVersion);
}

export async function updateDatabaseAccount<T>(accountId: string, request: object, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.DATABASE);
    return await PutARMCall(accountId, request, apiVersion);
}

export async function getDatabaseOperations<T>(accountId: string, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.DATABASE);
    return await GetARMCall<T>(`${accountId}/operations`, apiVersion);  
}

export async function updateVnet<T>(vnetId: string, request: object, apiVersionOverride?: string) {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.VNET);
    return await PutARMCall<T>(vnetId, request, apiVersion);
}

export async function getVnet<T>(vnetId: string, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.VNET);
    return await GetARMCall<T>(vnetId, apiVersion);  
}

export async function createNetworkProfile<T>(networkProfileId: string, request: object, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.NETWORK);
    return await PutARMCall<T>(networkProfileId, request, apiVersion);
}

export async function createRelay<T>(relayId: string, request: object, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.RELAY);
    return await PutARMCall<T>(relayId, request, apiVersion);
}

export async function getRelay<T>(relayId: string, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.RELAY);
    return await GetARMCall<T>(relayId, apiVersion);
}

export async function createRoleOnNetworkProfile<T>(roleid: string, request: object, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.ROLE);
    return await PutARMCall<T>(roleid, request, apiVersion); 
}

export async function createRoleOnRelay<T>(roleid: string, request: object, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.ROLE);
    return await PutARMCall<T>(roleid, request, apiVersion); 
}

export async function GetARMCall<T>(path: string, apiVersion: string = API_VERSIONS.DEFAULT): Promise<T> {
    return await armRequest<T>({
        host: configContext.ARM_ENDPOINT,
        path: path,
        method: "GET",
        apiVersion: apiVersion
    });
}

export async function PutARMCall<T>(path: string, request: object, apiVersion: string = API_VERSIONS.DEFAULT): Promise<T> {
    return await armRequest<T>({
        host: configContext.ARM_ENDPOINT,
        path: path,
        method: "PUT",
        apiVersion: apiVersion,
        body: request
    });
}