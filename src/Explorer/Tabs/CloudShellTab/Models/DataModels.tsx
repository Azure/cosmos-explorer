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

export type CloudShellSettings = {
  properties: UserSettingProperties;
};

export type UserSettingProperties = {
  networkType: string;
  preferredLocation: string;
  preferredOsType: OsType;
  preferredShellType: ShellType;
  userSubscription: string;
  sessionType: SessionType;
  vnetSettings: object;
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

export type ProviderAuthorization = {
  applicationId: string;
  roleDefinitionId: string;
};

export type ProviderResourceType = {
  resourceType: string;
  locations: string[];
  apiVersions: string[];
  defaultApiVersion?: string;
  capabilities?: string;
};

export type RegistrationState = "Registered" | "NotRegistered" | "Registering" | "Unregistering";
export type RegistrationPolicy = "RegistrationRequired" | "RegistrationOptional";

export type CloudShellProviderInfo = {
  id: string;
  namespace: string;
  authorizations?: ProviderAuthorization[];
  resourceTypes: ProviderResourceType[];
  registrationState: RegistrationState;
  registrationPolicy: RegistrationPolicy;
};
