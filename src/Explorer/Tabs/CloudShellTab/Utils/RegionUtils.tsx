/**
 * Copyright (c) Microsoft Corporation.  All rights reserved.
 * Region utilities for CloudShell
 */

const validCloudShellRegions = new Set([
  "westus",
  "southcentralus",
  "eastus",
  "northeurope",
  "westeurope",
  "centralindia",
  "southeastasia",
  "westcentralus",
]);

/**
 * Normalizes a region name to a valid CloudShell region
 * @param region The region to normalize
 * @param defaultCloudshellRegion Default region to use if the provided region is not supported
 */
export const getNormalizedRegion = (region: string, defaultCloudshellRegion: string) => {
  if (!region) {
    return defaultCloudshellRegion;
  }

  const regionMap: Record<string, string> = {
    centralus: "westcentralus",
    eastus2: "eastus",
  };

  const normalizedRegion = regionMap[region.toLowerCase()] || region;
  return validCloudShellRegions.has(normalizedRegion.toLowerCase()) ? normalizedRegion : defaultCloudshellRegion;
};
