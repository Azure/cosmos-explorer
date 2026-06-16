import { AccountOverride } from "Contracts/DataModels";
import { isFabricNative } from "Platform/Fabric/FabricUtil";
import * as Constants from "../Common/Constants";
import { userContext } from "../UserContext";

export const isCapabilityEnabled = (capabilityName: string, targetAccountOverride?: AccountOverride): boolean => {
  const { databaseAccount } = userContext;
  const capabilities = targetAccountOverride?.capabilities || databaseAccount?.properties?.capabilities;
  if (capabilities) {
    return capabilities.some((capability) => capability.name === capabilityName);
  }
  return false;
};

export const isServerlessAccount = (targetAccountOverride?: AccountOverride): boolean => {
  const { databaseAccount } = userContext;
  const capacityMode = targetAccountOverride?.capacityMode || databaseAccount?.properties?.capacityMode;
  return (
    capacityMode === Constants.CapacityMode.Serverless ||
    isCapabilityEnabled(Constants.CapabilityNames.EnableServerless, targetAccountOverride)
  );
};

export const isVectorSearchEnabled = (targetAccountOverride?: AccountOverride): boolean => {
  return (
    userContext.apiType === "SQL" &&
    (isCapabilityEnabled(Constants.CapabilityNames.EnableNoSQLVectorSearch, targetAccountOverride) || isFabricNative())
  );
};

export const isFullTextSearchPreviewFeaturesEnabled = (targetAccountOverride?: AccountOverride): boolean => {
  return (
    userContext.apiType === "SQL" &&
    isCapabilityEnabled(Constants.CapabilityNames.EnableNoSQLFullTextSearchPreviewFeatures, targetAccountOverride)
  );
};

// `enableEmbeddingGenerator` is a top-level boolean on the database account
// (e.g. properties.enableEmbeddingGenerator), not an entry in
// properties.capabilities[]. It's the Foundry integrated embedding generator
// flag that gates the `embeddingSource` block inside a Container Vector Policy.
export const isIntegratedEmbeddingEnabled = (targetAccountOverride?: AccountOverride): boolean => {
  const { databaseAccount } = userContext;
  const enableEmbeddingGenerator =
    targetAccountOverride?.enableEmbeddingGenerator ?? databaseAccount?.properties?.enableEmbeddingGenerator;
  return isVectorSearchEnabled(targetAccountOverride) && enableEmbeddingGenerator === true;
};
