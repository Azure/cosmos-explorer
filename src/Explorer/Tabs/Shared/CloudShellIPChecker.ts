import { configContext } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import { userContext } from "UserContext";
import { armRequest } from "Utils/arm/request";
import {
  CloudShellIPRange,
  getCloudShellIPsForRegion,
  getClusterRegion,
} from "../CloudShellTab/Utils/CloudShellIPUtils";
import { getNormalizedRegion } from "../CloudShellTab/Utils/RegionUtils";

// Constants
const DEFAULT_CLOUDSHELL_REGION = "westus";

/**
 * Check if user has added all CloudShell IPs for their normalized region
 * @param apiVersion - The API version to use for the ARM request
 * @returns Promise<boolean> - true if all CloudShell IPs are configured (don't show screenshot), false if missing (show screenshot)
 */
export async function checkCloudShellIPsConfigured(apiVersion: string): Promise<boolean> {
  const clusterRegion = getClusterRegion();

  if (!clusterRegion) {
    return false;
  }

  const normalizedRegion = getNormalizedRegion(clusterRegion, DEFAULT_CLOUDSHELL_REGION);
  const cloudShellIPs = getCloudShellIPsForRegion(normalizedRegion);

  if (cloudShellIPs.length === 0) {
    return false;
  }

  const firewallRulesUri = `${userContext.databaseAccount.id}/firewallRules`;
  const response: any = await armRequest({
    host: configContext.ARM_ENDPOINT,
    path: firewallRulesUri,
    method: "GET",
    apiVersion: apiVersion,
  });

  const firewallRules: DataModels.FirewallRule[] = response?.data?.value || response?.value || [];

  const missingIPs: Array<{ startIP: string; endIP: string; reason?: string }> = [];
  const foundIPs: Array<{ startIP: string; endIP: string; ruleName?: string }> = [];

  for (const cloudShellIP of cloudShellIPs) {
    const matchingRule = firewallRules.find((rule) => {
      const startMatch = rule.properties.startIpAddress === cloudShellIP.startIP;
      const endMatch = rule.properties.endIpAddress === cloudShellIP.endIP;
      return startMatch && endMatch;
    });

    if (matchingRule) {
      foundIPs.push({ ...cloudShellIP, ruleName: matchingRule.name });
    } else {
      missingIPs.push({ ...cloudShellIP, reason: "No exact IP match in firewall rules" });
    }
  }

  const allConfigured = missingIPs.length === 0;
  return allConfigured;
}

/**
 * Get the normalized region and its CloudShell IPs for display in the guide
 * @returns Object with region and IPs for the guide
 */
export function getCloudShellGuideInfo(): { region: string; cloudShellIPs: readonly CloudShellIPRange[] } {
  const clusterRegion = getClusterRegion();
  const normalizedRegion = getNormalizedRegion(clusterRegion || "", DEFAULT_CLOUDSHELL_REGION);
  const cloudShellIPs = getCloudShellIPsForRegion(normalizedRegion);

  return {
    region: normalizedRegion,
    cloudShellIPs: cloudShellIPs,
  };
}
