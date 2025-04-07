/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 * CloudShell API client for various operations
 */

import { v4 as uuidv4 } from 'uuid';
import { configContext } from "../../../../ConfigContext";
import { TerminalKind } from "../../../../Contracts/ViewModels";
import { userContext } from '../../../../UserContext';
import { armRequest } from "../../../../Utils/arm/request";
import { ApiVersionsConfig, DEFAULT_API_VERSIONS } from "../Models/ApiVersions";
import { Authorization, ConnectTerminalResponse, NetworkType, OsType, ProvisionConsoleResponse, ResourceType, SessionType, Settings, ShellType } from "../Models/DataModels";
import { getLocale } from '../Data/LocalizationUtils';

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
 */
export const getApiVersion = (resourceType?: ResourceType, apiVersions?: ApiVersionsConfig): string => {
  if (!apiVersions) {
    apiVersions = DEFAULT_API_VERSIONS; // Default fallback
  }

  // Shell type is set, try to get specific version in this priority:
  // 1. Shell-specific + resource-specific
  if (resourceType && 
      apiVersions.SHELL_TYPES[currentShellType]) {
    const shellTypeConfig = apiVersions.SHELL_TYPES[currentShellType];
    if (resourceType in shellTypeConfig) {
      return shellTypeConfig[resourceType] as string;
    }
  }

  // 2. Resource-specific default
  if (resourceType && resourceType in apiVersions.RESOURCE_DEFAULTS) {
    return apiVersions.RESOURCE_DEFAULTS[resourceType];
  }
  
  // 3. Global default
  return apiVersions.DEFAULT;
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
  return await PutARMCall<T>(subnetId, request, apiVersion);
}

export async function updateDatabaseAccount<T>(accountId: string, request: object, apiVersionOverride?: string): Promise<T> {
  const apiVersion = apiVersionOverride || getApiVersion(ResourceType.DATABASE);
  return await PutARMCall<T>(accountId, request, apiVersion);
}

export async function getDatabaseOperations<T>(accountId: string, apiVersionOverride?: string): Promise<T> {
  const apiVersion = apiVersionOverride || getApiVersion(ResourceType.DATABASE);
  return await GetARMCall<T>(`${accountId}/operations`, apiVersion);  
}

export async function updateVnet<T>(vnetId: string, request: object, apiVersionOverride?: string): Promise<T> {
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

export async function createRoleOnNetworkProfile<T>(roleId: string, request: object, apiVersionOverride?: string): Promise<T> {
const apiVersion = apiVersionOverride || getApiVersion(ResourceType.ROLE);
  return await PutARMCall<T>(roleId, request, apiVersion); 
}

export async function createRoleOnRelay<T>(roleId: string, request: object, apiVersionOverride?: string): Promise<T> {
  const apiVersion = apiVersionOverride || getApiVersion(ResourceType.ROLE);
  return await PutARMCall<T>(roleId, request, apiVersion); 
}

export async function createPrivateEndpoint<T>(privateEndpointId: string, request: object, apiVersionOverride?: string): Promise<T> {
    const apiVersion = apiVersionOverride || getApiVersion(ResourceType.NETWORK);
    return await PutARMCall<T>(privateEndpointId, request, apiVersion);
}

export async function GetARMCall<T>(path: string, apiVersion: string = '2024-07-01'): Promise<T> {
  return await armRequest<T>({
      host: configContext.ARM_ENDPOINT,
      path: path,
      method: "GET",
      apiVersion: apiVersion
  });
}

export async function PutARMCall<T>(path: string, request: object, apiVersion: string = '2024-07-01'): Promise<T> {
  return await armRequest<T>({
      host: configContext.ARM_ENDPOINT,
      path: path,
      method: "PUT",
      apiVersion: apiVersion,
      body: request
  });
}
