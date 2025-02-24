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
    location: string;
    sessionType: SessionType;
    osType: OsType;
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


