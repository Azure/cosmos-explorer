/**
 * Data Explorer -> Fabric communication.
 */
export enum FabricMessageTypes {
  GetAuthorizationToken = "GetAuthorizationToken",
  GetAllResourceTokens = "GetAllResourceTokens",
  GetAccessToken = "GetAccessToken",
  Ready = "Ready",
  OpenSettings = "OpenSettings",
  RestoreContainer = "RestoreContainer",
  ContainerUpdated = "ContainerUpdated",
}

export interface AuthorizationToken {
  XDate: string;
  PrimaryReadWriteToken: string;
}
