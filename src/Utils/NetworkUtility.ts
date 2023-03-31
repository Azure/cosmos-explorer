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

export const getNetworkSettingsWarningMessage = (): string => {
  const accountProperties = userContext.databaseAccount?.properties;

  if (!accountProperties) {
    return "";
  }

  // public network access is disabled
  if (accountProperties.publicNetworkAccess !== "Enabled") {
    return "The Network settings for this account are preventing access from Data Explorer. Please enable public access to proceed.";
  }

  const ipRules = accountProperties.ipRules;
  // public network access is set to "All networks"
  if (ipRules.length === 0) {
    return "";
  }

  if (userContext.apiType === "Cassandra" || userContext.apiType === "Mongo") {
    const portalIPs = PortalIPs[userContext.portalEnv];
    let numberOfMatches = 0;
    ipRules.forEach((ipRule) => {
      if (portalIPs.indexOf(ipRule.ipAddressOrRange) !== -1) {
        numberOfMatches++;
      }
    });

    if (numberOfMatches !== portalIPs.length) {
      return "The Network settings for this account are preventing access from Data Explorer. Please allow access from Azure Portal to proceed.";
    }
  }

  return "";
};
