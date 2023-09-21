import { configContext } from "ConfigContext";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { userContext } from "UserContext";
import { PortalBackendIPs } from "Utils/EndpointValidation";

export const getNetworkSettingsWarningMessage = async (
  setStateFunc: (warningMessage: string) => void
): Promise<void> => {
  const accountProperties = userContext.databaseAccount?.properties;
  const accessMessage =
    "The Network settings for this account are preventing access from Data Explorer. Please allow access from Azure Portal to proceed.";
  const publicAccessMessage =
    "The Network settings for this account are preventing access from Data Explorer. Please enable public access to proceed.";

  if (userContext.apiType === "Postgres") {
    checkFirewallRules(
      "2022-11-08",
      (rule) => rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255",
      undefined,
      setStateFunc,
      accessMessage
    );
    return;
  } else if (userContext.apiType === "VCoreMongo") {
    checkFirewallRules(
      "2023-03-01-preview",
      (rule) =>
        rule.name.startsWith("AllowAllAzureServicesAndResourcesWithinAzureIps") ||
        (rule.properties.startIpAddress === "0.0.0.0" && rule.properties.endIpAddress === "255.255.255.255"),
      undefined,
      setStateFunc,
      accessMessage
    );
    return;
  } else if (accountProperties) {
    // public network access is disabled
    if (
      accountProperties.publicNetworkAccess !== "Enabled" &&
      accountProperties.publicNetworkAccess !== "SecuredByPerimeter"
    ) {
      setStateFunc(publicAccessMessage);
      return;
    }

    const ipRules = accountProperties.ipRules;
    // public network access is NOT set to "All networks"
    if (ipRules?.length > 0) {
      if (userContext.apiType === "Cassandra" || userContext.apiType === "Mongo") {
        const portalIPs = PortalBackendIPs[configContext.BACKEND_ENDPOINT];
        let numberOfMatches = 0;
        ipRules.forEach((ipRule) => {
          if (portalIPs.indexOf(ipRule.ipAddressOrRange) !== -1) {
            numberOfMatches++;
          }
        });

        if (numberOfMatches !== portalIPs.length) {
          setStateFunc(accessMessage);
        }
      }
    }
  }
};
