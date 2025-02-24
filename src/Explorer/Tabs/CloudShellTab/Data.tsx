/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { v4 as uuidv4 } from 'uuid';
import { configContext } from "../../../ConfigContext";
import { armRequest } from "../../../Utils/arm/request";
import { Authorization, ConnectTerminalResponse, NetworkType, OsType, ProvisionConsoleResponse, SessionType, Settings, ShellType } from "./DataModels";

const cloudshellToken = "";

export const validateUserSettings = (userSettings: Settings) => {
    if (userSettings.sessionType !== SessionType.Ephemeral && userSettings.osType !== OsType.Linux) {
        return false;
    } else {
        return true;
    }
}

// https://stackoverflow.com/q/38598280 (Is it possible to wrap a function and retain its types?)
export const trackedApiCall = <T extends Array<any>, U>(apiCall: (...args: T) => Promise<U>, name: string) => {
    return async (...args: T): Promise<U> => {
        const startTime = Date.now();
        const result = await apiCall(...args);
        const endTime = Date.now();
        return result;
    };
};

export const getUserRegion = trackedApiCall(async (subscriptionId: string, resourceGroup: string, accountName: string) => {
    return await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
        method: "GET",
        apiVersion: "2022-12-01"
      });

}, "getUserRegion");

export const getUserSettings = trackedApiCall(async (): Promise<Settings> => {
    const resp = await armRequest<any>({
        host: configContext.ARM_ENDPOINT,
        path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
        method: "GET",
        apiVersion: "2023-02-01-preview",
        customHeaders: {
            "Authorization": cloudshellToken // Temporily use a hardcoded token
        }
      });

    return {
        location: resp?.properties?.preferredLocation,
        sessionType: resp?.properties?.sessionType,
        osType: resp?.properties?.preferredOsType
    };
}, "getUserSettings");

export const putEphemeralUserSettings = trackedApiCall(async (userSubscriptionId: string, userRegion: string) => {
    const ephemeralSettings = {
        properties: {
            preferredOsType: OsType.Linux,
            preferredShellType: ShellType.Bash,
            preferredLocation: userRegion,
            networkType: NetworkType.Default,
            sessionType: SessionType.Ephemeral,
            userSubscription: userSubscriptionId,
        }
    };

    const resp = await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
        method: "PUT",
        apiVersion: "2023-02-01-preview",
        body: ephemeralSettings,
        customHeaders: {
            "Authorization": cloudshellToken // Temporily use a hardcoded token
        }
      });

    return resp;

}, "putEphemeralUserSettings");

export const verifyCloudshellProviderRegistration = async(subscriptionId: string) => {
    return await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell`,
        method: "GET",
        apiVersion: "2022-12-01",
        customHeaders: {
            "Authorization": cloudshellToken // Temporily use a hardcoded token
        }
      });
};

export const registerCloudShellProvider = async (subscriptionId: string) => {
    return await armRequest({
        host: configContext.ARM_ENDPOINT,
        path: `/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell/register`,
        method: "POST",
        apiVersion: "2022-12-01",
        customHeaders: {
            "Authorization": cloudshellToken // Temporily use a hardcoded token
        }
      });
};

export const provisionConsole = trackedApiCall(async (subscriptionId: string, location: string): Promise<ProvisionConsoleResponse> => {
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
            'x-ms-console-preferred-location': location,
            "Authorization": cloudshellToken  // Temporily use a hardcoded token
        },
        body: data,
      });
}, "provisionConsole");

export const connectTerminal = trackedApiCall(async (consoleUri: string, size: { rows: number, cols: number }): Promise<ConnectTerminalResponse> => {
    const targetUri = consoleUri + `/terminals?cols=${size.cols}&rows=${size.rows}&version=2019-01-01&shell=bash`;
    const resp = await fetch(targetUri, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': '2',
            'Authorization': cloudshellToken,
            'x-ms-client-request-id': uuidv4(),
            'Accept-Language': getLocale(),
        },
        body: "{}" // empty body is necessary
    });
    return resp.json();
}, "connectTerminal");

export const authorizeSession = trackedApiCall(async (consoleUri: string): Promise<Authorization> => {
    const targetUri = consoleUri + "/authorize";
    const resp = await fetch(targetUri, {
        method: "post",
        headers: {
            'Accept': 'application/json',
            'Authorization': cloudshellToken,
            'Accept-Language': getLocale(),
            "Content-Type": 'application/json'
        },
        body: "{}" // empty body is necessary
    });
    return resp.json();
}, "authorizeSession");

export const getLocale = () => {
    const langLocale = navigator.language;
    return (langLocale && langLocale.length === 2 ? langLocale[1] : 'en-us');
};

const validCloudShellRegions = new Set(["westus", "southcentralus", "eastus", "northeurope", "westeurope", "centralindia", "southeastasia", "westcentralus", "eastus2euap", "centraluseuap"]);
const defaultCloudshellRegion = "westus";

export const getNormalizedRegion = (region: string) => {
    if (!region) return defaultCloudshellRegion;
    
    const regionMap: Record<string, string> = {
      "centralus": "centraluseuap",
      "eastus2": "eastus2euap"
    };
    
    const normalizedRegion = regionMap[region.toLowerCase()] || region;
    return validCloudShellRegions.has(normalizedRegion.toLowerCase()) ? normalizedRegion : defaultCloudshellRegion;
  };
  
