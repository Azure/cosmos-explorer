/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 * CloudShell API client for various operations
 */

import { v4 as uuidv4 } from "uuid";
import { configContext } from "../../../../ConfigContext";
import { userContext } from "../../../../UserContext";
import { armRequest } from "../../../../Utils/arm/request";
import {
  Authorization,
  ConnectTerminalResponse,
  NetworkType,
  OsType,
  ProvisionConsoleResponse,
  SessionType,
  Settings,
  ShellType,
} from "../Models/DataModels";
import { getLocale } from "../Utils/CommonUtils";

export const getUserRegion = async (subscriptionId: string, resourceGroup: string, accountName: string) => {
  return await armRequest({
    host: configContext.ARM_ENDPOINT,
    path: `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
    method: "GET",
    apiVersion: "2022-12-01",
  });
};

export const deleteUserSettings = async (): Promise<void> => {
  await armRequest<void>({
    host: configContext.ARM_ENDPOINT,
    path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
    method: "DELETE",
    apiVersion: "2023-02-01-preview",
  });
};

export const getUserSettings = async (): Promise<Settings> => {
  const resp = await armRequest<any>({
    host: configContext.ARM_ENDPOINT,
    path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
    method: "GET",
    apiVersion: "2023-02-01-preview",
  });
  return resp;
};

export const putEphemeralUserSettings = async (
  userSubscriptionId: string,
  userRegion: string,
  vNetSettings?: object,
) => {
  const ephemeralSettings = {
    properties: {
      preferredOsType: OsType.Linux,
      preferredShellType: ShellType.Bash,
      preferredLocation: userRegion,
      networkType:
        !vNetSettings || Object.keys(vNetSettings).length === 0
          ? NetworkType.Default
          : vNetSettings
          ? NetworkType.Isolated
          : NetworkType.Default,
      sessionType: SessionType.Ephemeral,
      userSubscription: userSubscriptionId,
      vnetSettings: vNetSettings ?? {},
    },
  };

  return await armRequest({
    host: configContext.ARM_ENDPOINT,
    path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
    method: "PUT",
    apiVersion: "2023-02-01-preview",
    body: ephemeralSettings,
  });
};

export const verifyCloudShellProviderRegistration = async (subscriptionId: string) => {
  return await armRequest({
    host: configContext.ARM_ENDPOINT,
    path: `/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell`,
    method: "GET",
    apiVersion: "2022-12-01",
  });
};

export const registerCloudShellProvider = async (subscriptionId: string) => {
  return await armRequest({
    host: configContext.ARM_ENDPOINT,
    path: `/subscriptions/${subscriptionId}/providers/Microsoft.CloudShell/register`,
    method: "POST",
    apiVersion: "2022-12-01",
  });
};

export const provisionConsole = async (consoleLocation: string): Promise<ProvisionConsoleResponse> => {
  const data = {
    properties: {
      osType: OsType.Linux,
    },
  };

  return await armRequest<any>({
    host: configContext.ARM_ENDPOINT,
    path: `providers/Microsoft.Portal/consoles/default`,
    method: "PUT",
    apiVersion: "2023-02-01-preview",
    customHeaders: {
      "x-ms-console-preferred-location": consoleLocation,
    },
    body: data,
  });
};

export const connectTerminal = async (
  consoleUri: string,
  size: { rows: number; cols: number },
): Promise<ConnectTerminalResponse> => {
  const targetUri = consoleUri + `/terminals?cols=${size.cols}&rows=${size.rows}&version=2019-01-01&shell=bash`;
  const resp = await fetch(targetUri, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Content-Length": "2",
      Authorization: userContext.authorizationToken,
      "x-ms-client-request-id": uuidv4(),
      "Accept-Language": getLocale(),
    },
    body: "{}", // empty body is necessary
  });

  if (!resp.ok) {
    throw new Error(`Failed to connect to terminal: ${resp.status} ${resp.statusText}`);
  }

  return resp.json();
};

export const authorizeSession = async (consoleUri: string): Promise<Authorization> => {
  const targetUri = consoleUri + "/authorize";
  const resp = await fetch(targetUri, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: userContext.authorizationToken,
      "Accept-Language": getLocale(),
      "Content-Type": "application/json",
    },
    body: "{}", // empty body is necessary
  });

  if (!resp.ok) {
    throw new Error(`Failed to authorize session: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
};
