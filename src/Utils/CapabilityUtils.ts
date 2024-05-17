import * as Constants from "../Common/Constants";
import { userContext } from "../UserContext";

export const isCapabilityEnabled = (capabilityName: string): boolean => {
  const { databaseAccount } = userContext;
  if (databaseAccount && databaseAccount.properties && databaseAccount.properties.capabilities) {
    return databaseAccount.properties.capabilities.some((capability) => capability.name === capabilityName);
  }
  return false;
};

export const isServerlessAccount = (): boolean => {
  const { databaseAccount } = userContext;
  return (
    databaseAccount?.properties?.capacityMode === Constants.CapacityMode.Serverless ||
    isCapabilityEnabled(Constants.CapabilityNames.EnableServerless)
  );
};
