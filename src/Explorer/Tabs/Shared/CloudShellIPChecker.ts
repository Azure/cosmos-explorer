import { configContext } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import { userContext } from "UserContext";
import { armRequest } from "Utils/arm/request";
import { CLOUDSHELL_IP_RECOMMENDATIONS } from "../CloudShellTab/Utils/CloudShellIPUtils";
import { getNormalizedRegion } from "../CloudShellTab/Utils/RegionUtils";

export async function checkCloudShellIPsConfigured() {
  const databaseRegion = userContext.databaseAccount?.location;
  console.log("db region", databaseRegion);
  const normalizedRegion = getNormalizedRegion(databaseRegion, "westus");
  const cloudShellIPs = getCloudShellIPsForRegion(normalizedRegion);
  console.log("CloudShell IPs for region", normalizedRegion, cloudShellIPs);
  if (!cloudShellIPs || cloudShellIPs.length === 0) {
    return false;
  }

  const firewallRules = await getFirewallRules();
  console.log("firewall rules", firewallRules);
  return false;
}

function getCloudShellIPsForRegion(region: string): string[] {
  const regionKey = region.toLowerCase();
  const ips = CLOUDSHELL_IP_RECOMMENDATIONS[regionKey as keyof typeof CLOUDSHELL_IP_RECOMMENDATIONS];
  return ips ? [...ips] : [];
}

async function getFirewallRules(): Promise<DataModels.FirewallRule[]> {
  const firewallRulesUri = `${userContext.databaseAccount.id}/firewallRules`;

  const response: any = await armRequest({
    host: configContext.ARM_ENDPOINT,
    path: firewallRulesUri,
    method: "GET",
    apiVersion: "2023-03-01-preview",
  });

  return response?.data?.value || response?.value || [];
}
