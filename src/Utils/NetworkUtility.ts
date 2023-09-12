import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { userContext } from "UserContext";

const PortalIPs: { [key: string]: string[] } = {
  prod1: ["104.42.195.92", "40.76.54.131"],
  prod2: ["104.42.196.69"],
  mooncake: ["139.217.8.252"],
  blackforest: ["51.4.229.218"],
  fairfax: ["52.244.48.71"],
  ussec: ["29.26.26.67", "29.26.26.66"],
  usnat: ["7.28.202.68"],
};

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
  } else if (accountProperties) {
    // public network access is disabled
    if (
      accountProperties.publicNetworkAccess !== "Enabled" &&
      accountProperties.publicNetworkAccess !== "SecuredByPerimeter"
    ) {
      setStateFunc(publicAccessMessage);
    }

    const ipRules = accountProperties.ipRules;
    // public network access is NOT set to "All networks"
    if (ipRules.length > 0) {
      if (userContext.apiType === "Cassandra" || userContext.apiType === "Mongo") {
        const portalIPs = PortalIPs[userContext.portalEnv];
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
