/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 */

import { v4 as uuidv4 } from 'uuid';
import { configContext } from "../../../ConfigContext";
import { armRequest } from "../../../Utils/arm/request";
import { Authorization, ConnectTerminalResponse, NetworkType, OsType, ProvisionConsoleResponse, SessionType, Settings, ShellType } from "./DataModels";

const cloudshellToken = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImltaTBZMnowZFlLeEJ0dEFxS19UdDVoWUJUayIsImtpZCI6ImltaTBZMnowZFlLeEJ0dEFxS19UdDVoWUJUayJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNzQwNDU5Njc2LCJuYmYiOjE3NDA0NTk2NzYsImV4cCI6MTc0MDQ2NDA0NSwiX2NsYWltX25hbWVzIjp7Imdyb3VwcyI6InNyYzEifSwiX2NsYWltX3NvdXJjZXMiOnsic3JjMSI6eyJlbmRwb2ludCI6Imh0dHBzOi8vZ3JhcGgud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3VzZXJzL2U4MGZmZGE4LTlmZDUtNDQ4ZC05M2VhLWY5YzgyM2ZjN2RkOC9nZXRNZW1iZXJPYmplY3RzIn19LCJhY3IiOiIxIiwiYWlvIjoiQVpRQWEvOFpBQUFBRjcvNHplb1lpQWYxcytvR1FMVXVsa2NJbU93dGx1aVJNMVVKeVI3czIrV0Z5VVdPM2MrUlUybmdsTlBRaGtwTFo4SktsYjg0a1dlTVhCZFFXemJGcUJGQ0M1aXU3ZUxyamRYY3NOaVMwc0l5Z1crdTJsT1I3VzBsNC8xT3UzRnRjakJoQlZLSTFFTGpLWHJjbzkrbTM0WUZJbmYrc0VPNkhuNmJFMmdIL3kxamUyQXZvZXNTaDhmZlpQdjZNSUcxIiwiYW1yIjpbInJzYSIsIm1mYSJdLCJhcHBpZCI6ImM0NGI0MDgzLTNiYjAtNDljMS1iNDdkLTk3NGU1M2NiZGYzYyIsImFwcGlkYWNyIjoiMCIsImRldmljZWlkIjoiZTM4YzBiOTgtMzQ5OS00YWQzLTkwN2EtYjc2NzJjNzdkZTQ3IiwiZmFtaWx5X25hbWUiOiJKYWluIiwiZ2l2ZW5fbmFtZSI6IlNvdXJhYmgiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIyNDA1OjIwMTo0MDMzOjIxY2U6OWRkOTpkMGY1OmJjZWE6YjFiMCIsIm5hbWUiOiJTb3VyYWJoIEphaW4iLCJvaWQiOiJlODBmZmRhOC05ZmQ1LTQ0OGQtOTNlYS1mOWM4MjNmYzdkZDgiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMjE0Njc3MzA4NS05MDMzNjMyODUtNzE5MzQ0NzA3LTI3MDcwNjYiLCJwdWlkIjoiMTAwMzIwMDExQTY5NDVGMCIsInJoIjoiMS5BUm9BdjRqNWN2R0dyMEdScXkxODBCSGJSMFpJZjNrQXV0ZFB1a1Bhd2ZqMk1CTWFBT2dhQUEuIiwic2NwIjoidXNlcl9pbXBlcnNvbmF0aW9uIiwic2lkIjoiMDAyMDEzMDktMmE2MC1jYzVjLWI1MzEtM2IwZDA1YWQxZjc1Iiwic3ViIjoiOHhzRHhTS2pyZzJxd1dpM1gzSmYteTFSQ1dSNnZQMERnSkVsS2hNbTltMCIsInRpZCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsInVuaXF1ZV9uYW1lIjoic291cmFiaGphaW5AbWljcm9zb2Z0LmNvbSIsInVwbiI6InNvdXJhYmhqYWluQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJUVDYwRzBpSFJrMmN4Y1AtVVZzbEFBIiwidmVyIjoiMS4wIiwieG1zX2lkcmVsIjoiMSAzMCIsInhtc190Y2R0IjoxMjg5MjQxNTQ3fQ.LBYpLSmj8Cd-ZL3i9yuqVvPB0CirALEq7ldFywDH2U5c9LlnUfLgOf_C_N0Uu0ChthTl9Eu54TXuGCxFXwfVSg_kaPuZhtc-vDqVurjHtyNr-53qKg8fbQYbOnB_JGqC86TzdqPRv1XwhZj9C2bNjjGZ2GrcOWitv8CgM9Fs9Cul1OHiq5j8BTJl8OX_THC-VUB11fB-5qyitH9pTtETC4o7AKg4fOHftXYDkFI0gVF_WCZoquI6kFEnoQtt_qhu4rK71VqVRt5qqBeT8tgH4GwsP2W7pBlzESdjSXWMJ5u7klXJwheYvuytrxioD1f0HCOLHyBFpVf5JTBBeXjPow";

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
  
