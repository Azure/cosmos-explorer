/**
 * Data Explorer -> Fabric communication.
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * WARNING: !!!!!!! YOU CAN ONLY ADD NEW TYPES TO THE END OF THIS ENUM !!!!!!!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Enum are integers, so inserting or deleting a type will break the communication.
 */
export enum FabricMessageTypes {
  GetAuthorizationToken = "GetAuthorizationToken",
  GetAllResourceTokens = "GetAllResourceTokens",
  Ready = "Ready",
}

export interface AuthorizationToken {
  XDate: string;
  PrimaryReadWriteToken: string;
}
