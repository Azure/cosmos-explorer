/**
 * Data Explorer -> Fabric communication.
 */
export enum FabricMessageTypes {
  GetAuthorizationToken = "GetAuthorizationToken",
  GetAllResourceTokens = "GetAllResourceTokens",
  GetAccessToken = "GetAccessToken",
  Ready = "Ready",
}

export interface AuthorizationToken {
  XDate: string;
  PrimaryReadWriteToken: string;
}
