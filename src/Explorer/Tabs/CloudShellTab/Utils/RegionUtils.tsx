// Check this list for regional availability https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table
const validCloudShellRegions = new Set([
  "westus",
  "southcentralus",
  "eastus",
  "northeurope",
  "westeurope",
  "centralindia",
  "southeastasia",
  "westcentralus",
  "usgovvirginia",
  "usgovarizona",
]);

/**
 * Normalizes a region name to ensure compatibility with Azure CloudShell.
 *
 * Azure CloudShell is only available in specific regions. This function:
 * 1. Maps certain regions to their CloudShell-supported equivalents (e.g., centralus → westcentralus)
 * 2. Validates if the region is supported by CloudShell
 * 3. Falls back to the default region if the provided region is unsupported
 *
 * This ensures users can connect to CloudShell even when their database is in a region
 * where CloudShell isn't directly available, by routing to the nearest supported region.
 *
 * @param region - The source region (typically from the user's database account location)
 * @param defaultCloudshellRegion - Fallback region to use if the provided region is not supported
 * @returns A valid CloudShell region name that's as close as possible to the requested region
 *
 * @example
 * // Returns "westcentralus" (mapped region)
 * getNormalizedRegion("centralus", "westus")
 *
 * @example
 * // Returns "westus" (default region) since "antarctica" isn't supported
 * getNormalizedRegion("antarctica", "westus")
 */
export const getNormalizedRegion = (region: string, defaultCloudshellRegion: string) => {
  if (!region) {
    return defaultCloudshellRegion;
  }

  const regionMap: Record<string, string> = {
    eastus2: "eastus2euap",
    centralus: "centraluseuap"
  };

  const normalizedRegion = regionMap[region.toLowerCase()] || region;
  return validCloudShellRegions.has(normalizedRegion.toLowerCase()) ? normalizedRegion : defaultCloudshellRegion;
};
