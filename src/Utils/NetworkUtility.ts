import { CassandraProxyEndpoints, MongoProxyEndpoints, PortalBackendEndpoints } from "Common/Constants";
import { configContext } from "ConfigContext";
import { checkFirewallRules } from "Explorer/Tabs/Shared/CheckFirewallRules";
import { userContext } from "UserContext";
import {
  CassandraProxyOutboundIPs,
  MongoProxyOutboundIPs,
  PortalBackendIPs,
  PortalBackendOutboundIPs,
} from "Utils/EndpointUtils";

export const getNetworkSettingsWarningMessage = async (
  setStateFunc: (warningMessage: string) => void,
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
      accessMessage,
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
      accessMessage,
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
      const isProdOrMpacPortalBackendEndpoint: boolean = [
        PortalBackendEndpoints.Mpac,
        PortalBackendEndpoints.Prod,
      ].includes(configContext.PORTAL_BACKEND_ENDPOINT);
      const portalBackendOutboundIPs: string[] = isProdOrMpacPortalBackendEndpoint
        ? [
            ...PortalBackendOutboundIPs[PortalBackendEndpoints.Mpac],
            ...PortalBackendOutboundIPs[PortalBackendEndpoints.Prod],
          ]
        : PortalBackendOutboundIPs[configContext.PORTAL_BACKEND_ENDPOINT];
      let portalIPs: string[] = [...portalBackendOutboundIPs, ...PortalBackendIPs[configContext.BACKEND_ENDPOINT]];

      if (userContext.apiType === "Mongo") {
        const isProdOrMpacMongoProxyEndpoint: boolean = [MongoProxyEndpoints.Mpac, MongoProxyEndpoints.Prod].includes(
          configContext.MONGO_PROXY_ENDPOINT,
        );

        const mongoProxyOutboundIPs: string[] = isProdOrMpacMongoProxyEndpoint
          ? [...MongoProxyOutboundIPs[MongoProxyEndpoints.Mpac], ...MongoProxyOutboundIPs[MongoProxyEndpoints.Prod]]
          : MongoProxyOutboundIPs[configContext.MONGO_PROXY_ENDPOINT];

        portalIPs = [...portalIPs, ...mongoProxyOutboundIPs];
      } else if (userContext.apiType === "Cassandra") {
        const isProdOrMpacCassandraProxyEndpoint: boolean = [
          CassandraProxyEndpoints.Mpac,
          CassandraProxyEndpoints.Prod,
        ].includes(configContext.CASSANDRA_PROXY_ENDPOINT);

        const cassandraProxyOutboundIPs: string[] = isProdOrMpacCassandraProxyEndpoint
          ? [
              ...CassandraProxyOutboundIPs[CassandraProxyEndpoints.Mpac],
              ...CassandraProxyOutboundIPs[CassandraProxyEndpoints.Prod],
            ]
          : CassandraProxyOutboundIPs[configContext.CASSANDRA_PROXY_ENDPOINT];

        portalIPs = [...portalIPs, ...cassandraProxyOutboundIPs];
      }

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
};
