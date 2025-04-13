/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 * Data models for CloudShell
 */

export const enum OsType {
  Linux = "linux",
  Windows = "windows",
}

export const enum ShellType {
  Bash = "bash",
  PowerShellCore = "pwsh",
}

export const enum NetworkType {
  Default = "Default",
  Isolated = "Isolated",
}

export const enum SessionType {
  Mounted = "Mounted",
  Ephemeral = "Ephemeral",
}

export type Settings = {
  properties: UserSettingProperties;
};

export type UserSettingProperties = {
  networkType: string;
  preferredLocation: string;
  preferredOsType: OsType;
  preferredShellType: ShellType;
  userSubscription: string;
  sessionType: SessionType;
};

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
