import { v4 as uuidv4 } from "uuid";
import { configContext } from "../../../../ConfigContext";
import { userContext } from "../../../../UserContext";
import { armRequest } from "../../../../Utils/arm/request";
import {
  CloudShellProviderInfo,
  CloudShellSettings,
  ConnectTerminalResponse,
  NetworkType,
  OsType,
  ProvisionConsoleResponse,
  SessionType,
  ShellType,
} from "../Models/DataModels";
import { getLocale } from "../Utils/CommonUtils";

// armRequest defaults to a 5s timeout with no retry for PUT/POST. Cloud Shell provisioning
// (registering the provider, applying settings, and provisioning the console itself) can
// legitimately take much longer than that on first use or when the console region differs
// from the user's usual region, so a much more generous timeout is used for these calls to
// avoid a spurious AbortError ("User aborted query.") aborting the whole session start.
const CLOUDSHELL_ARM_TIMEOUT_MS = 30000;

export const getUserSettings = async (): Promise<CloudShellSettings> => {
  return await armRequest<CloudShellSettings>({
    host: configContext.ARM_ENDPOINT,
    path: `/providers/Microsoft.Portal/userSettings/cloudconsole`,
    method: "GET",
    apiVersion: "2025-09-01-preview",
  });
};

export const putEphemeralUserSettings = async (
  userSubscriptionId: string,
  userRegion: string,
  vNetSettings?: object,
) => {
  const ephemeralSettings: CloudShellSettings = {
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
    apiVersion: "2025-09-01-preview",
    body: ephemeralSettings,
    timeoutMs: CLOUDSHELL_ARM_TIMEOUT_MS,
  });
};

export const verifyCloudShellProviderRegistration = async (subscriptionId: string): Promise<CloudShellProviderInfo> => {
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
    timeoutMs: CLOUDSHELL_ARM_TIMEOUT_MS,
  });
};

export const provisionConsole = async (consoleLocation: string): Promise<ProvisionConsoleResponse> => {
  const data = {
    properties: {
      osType: OsType.Linux,
    },
  };

  return await armRequest<ProvisionConsoleResponse>({
    host: configContext.ARM_ENDPOINT,
    path: `providers/Microsoft.Portal/consoles/default`,
    method: "PUT",
    apiVersion: "2025-09-01-preview",
    customHeaders: {
      "x-ms-console-preferred-location": consoleLocation,
    },
    body: data,
    timeoutMs: CLOUDSHELL_ARM_TIMEOUT_MS,
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

export const resizeTerminal = async (
  consoleUri: string,
  terminalId: string,
  size: { rows: number; cols: number },
): Promise<void> => {
  const targetUri = consoleUri + `/terminals/${terminalId}/size?cols=${size.cols}&rows=${size.rows}&version=2019-01-01`;
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
    throw new Error(`Failed to resize terminal: ${resp.status} ${resp.statusText}`);
  }
};
