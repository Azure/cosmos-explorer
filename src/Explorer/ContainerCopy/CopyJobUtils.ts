import { DatabaseAccount } from "Contracts/DataModels";

export const buildResourceLink = (resource: DatabaseAccount): string => {
    const resourceId = resource.id;
    // TODO: update "ms.portal.azure.com" based on environment (e.g. for PROD or Fairfax)
    return `https://ms.portal.azure.com/#resource${resourceId}`;
}