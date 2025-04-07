import { configContext } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import * as ViewModels from "Contracts/ViewModels";
import { userContext } from "UserContext";
import { armRequest } from "Utils/arm/request";

export async function checkFirewallRules(
  apiVersion: string,
  firewallRulesPredicate: (rule: DataModels.FirewallRule) => unknown,
  isAllPublicIPAddressesEnabled?: ko.Observable<boolean> | React.Dispatch<React.SetStateAction<boolean>>,
  setMessageFunc?: (message: string) => void,
  message?: string,
): Promise<void> {

  const isEnabled = await callFirewallAPis(apiVersion, firewallRulesPredicate);

  if (isAllPublicIPAddressesEnabled) {
    isAllPublicIPAddressesEnabled(isEnabled);
  }

  if (setMessageFunc) {
    if (!isEnabled) {
      setMessageFunc(message);
    } else {
      setMessageFunc(undefined);
    }
  }

  // If the firewall rule is not added, check every 30 seconds to see if the user has added the rule
  if (!isEnabled) {
    setTimeout(
      () =>
        checkFirewallRules(apiVersion, firewallRulesPredicate, isAllPublicIPAddressesEnabled, setMessageFunc, message),
      30000,
    );
  }
}

export async function callFirewallAPis(
  apiVersion: string,
  firewallRulesPredicate: (rule: DataModels.FirewallRule) => unknown): 
    Promise<boolean> {  
  const firewallRulesUri = `${userContext.databaseAccount.id}/firewallRules`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await armRequest({
    host: configContext.ARM_ENDPOINT,
    path: firewallRulesUri,
    method: "GET",
    apiVersion: apiVersion,
  });
  const firewallRules: DataModels.FirewallRule[] = response?.data?.value || response?.value || [];
  const isEnabled = firewallRules.some(firewallRulesPredicate);

  return isEnabled;
}

export async function checkNetworkRules(kind: ViewModels.TerminalKind, isPublicAccessEnabledFlag: ko.Observable<boolean> | React.Dispatch<React.SetStateAction<boolean>>): Promise<void> {
  if (kind === ViewModels.TerminalKind.Postgres) {
    await checkFirewallRules(
      "2022-11-08",
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255",
      isPublicAccessEnabledFlag,
    );
  }

  if (kind === ViewModels.TerminalKind.VCoreMongo) {
    await checkFirewallRules(
      "2023-03-01-preview",
      (rule) =>
        rule.name.startsWith("AllowAllAzureServicesAndResourcesWithinAzureIps") ||
        (rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"),
        isPublicAccessEnabledFlag,
    );
  }
}

export async function IsPublicAccessAvailable(kind: ViewModels.TerminalKind): Promise<boolean> {
  if (kind === ViewModels.TerminalKind.Postgres) {
    return await callFirewallAPis(
      "2022-11-08",
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"
    );
  }

  if (kind === ViewModels.TerminalKind.VCoreMongo) {
    return await callFirewallAPis(
      "2023-03-01-preview",
      (rule) =>
        rule.name.startsWith("AllowAllAzureServicesAndResourcesWithinAzureIps") ||
        (rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255")
    );
  }

  return !hasDatabaseNetworkRestrictions();
}

/**
 * Checks if the database account has network restrictions
 */
const hasDatabaseNetworkRestrictions = (): boolean => {
  return hasVNetRestrictions() || hasFirewallRestrictions() || hasPrivateEndpointsRestrictions();
};

/**
 * Checks if the database account has Private Endpoint restrictions
 */
export const hasPrivateEndpointsRestrictions = (): boolean => {
  return userContext.databaseAccount.properties.privateEndpointConnections && userContext.databaseAccount.properties.privateEndpointConnections.length > 0;
};

/**
 * Checks if the database account has Firewall restrictions
 */
export const hasFirewallRestrictions = (): boolean => {
  return userContext.databaseAccount.properties.isVirtualNetworkFilterEnabled;;
};

/**
 * Checks if the database account has VNet restrictions
 */
export const hasVNetRestrictions = (): boolean => {
  return userContext.databaseAccount.properties.virtualNetworkRules && userContext.databaseAccount.properties.virtualNetworkRules.length > 0
};