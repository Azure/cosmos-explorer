import { configContext } from "ConfigContext";
import * as DataModels from "Contracts/DataModels";
import { userContext } from "UserContext";
import { armRequest } from "Utils/arm/request";

export async function checkFirewallRules(
  apiVersion: string,
  firewallRulesPredicate: (rule: DataModels.FirewallRule) => unknown,
  isAllPublicIPAddressesEnabled?: ko.Observable<boolean> | React.Dispatch<React.SetStateAction<boolean>>,
  setMessageFunc?: (message: string) => void,
  message?: string,
): Promise<void> {
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