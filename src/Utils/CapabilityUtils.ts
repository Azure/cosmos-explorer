import { userContext } from "../UserContext";

export const isCapabilityEnabled = (capabilityName: string): boolean =>
  userContext.databaseAccount?.properties?.capabilities?.some((capability) => capability.name === capabilityName);
