import { MongoProxyEndpoints, PortalBackendEndpoints } from "Common/Constants";
import { resetConfigContext, updateConfigContext } from "ConfigContext";
import { DatabaseAccount, IpRule } from "Contracts/DataModels";
import { updateUserContext } from "UserContext";
import { MongoProxyOutboundIPs, PortalBackendIPs, PortalBackendOutboundIPs } from "Utils/EndpointUtils";
import { getNetworkSettingsWarningMessage } from "./NetworkUtility";

describe("NetworkUtility tests", () => {
  describe("getNetworkSettingsWarningMessage", () => {
    const publicAccessMessagePart = "Please enable public access to proceed";
    const accessMessagePart = "Please allow access from Azure Portal to proceed";
    // validEnpoints are a subset of those from Utils/EndpointValidation/PortalBackendIPs
    const portalBackendEndpoints: string[] = [
      PortalBackendEndpoints.Mpac,
      PortalBackendEndpoints.Prod,
      PortalBackendEndpoints.Fairfax,
      PortalBackendEndpoints.Mooncake,
    ];

    let warningMessageResult: string;
    const warningMessageFunc = (msg: string) => (warningMessageResult = msg);

    beforeEach(() => {
      warningMessageResult = undefined;
    });

    afterEach(() => {
      resetConfigContext();
    });

    it("should return no message when publicNetworkAccess is enabled", async () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            publicNetworkAccess: "Enabled",
          },
        } as DatabaseAccount,
      });

      await getNetworkSettingsWarningMessage(warningMessageFunc);
      expect(warningMessageResult).toBeUndefined();
    });

    it("should return publicAccessMessage when publicNetworkAccess is disabled", async () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            publicNetworkAccess: "Disabled",
          },
        } as DatabaseAccount,
      });

      await getNetworkSettingsWarningMessage(warningMessageFunc);
      expect(warningMessageResult).toContain(publicAccessMessagePart);
    });

    it(`should return no message when the appropriate ip rules are added to mongo/cassandra account per endpoint`, async () => {
      const legacyBackendEndpoint: string = "https://main.documentdb.ext.azure.com";
      const portalBackendOutboundIPsWithLegacyIPs: string[] = [
        ...PortalBackendOutboundIPs[PortalBackendEndpoints.Mpac],
        ...PortalBackendOutboundIPs[PortalBackendEndpoints.Prod],
        ...MongoProxyOutboundIPs[MongoProxyEndpoints.Mpac],
        ...MongoProxyOutboundIPs[MongoProxyEndpoints.Prod],
        ...PortalBackendIPs["https://main.documentdb.ext.azure.com"],
      ];
      updateUserContext({
        databaseAccount: {
          kind: "MongoDB",
          properties: {
            ipRules: portalBackendOutboundIPsWithLegacyIPs.map((ip: string) => ({ ipAddressOrRange: ip }) as IpRule),
            publicNetworkAccess: "Enabled",
          },
        } as DatabaseAccount,
      });

      updateConfigContext({
        BACKEND_ENDPOINT: legacyBackendEndpoint,
        PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Mpac,
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Mpac,
      });

      let asyncWarningMessageResult: string;
      const asyncWarningMessageFunc = (msg: string) => (asyncWarningMessageResult = msg);

      await getNetworkSettingsWarningMessage(asyncWarningMessageFunc);
      expect(asyncWarningMessageResult).toBeUndefined();
    });

    it("should return accessMessage when incorrent ip rule is added to mongo/cassandra account per endpoint", () => {
      portalBackendEndpoints.forEach(async (endpoint) => {
        updateUserContext({
          databaseAccount: {
            kind: "MongoDB",
            properties: {
              ipRules: [{ ipAddressOrRange: "1.1.1.1" }],
              publicNetworkAccess: "Enabled",
            },
          } as DatabaseAccount,
        });

        updateConfigContext({
          BACKEND_ENDPOINT: endpoint,
          PORTAL_BACKEND_ENDPOINT: endpoint,
        });

        let asyncWarningMessageResult: string;
        const asyncWarningMessageFunc = (msg: string) => (asyncWarningMessageResult = msg);

        await getNetworkSettingsWarningMessage(asyncWarningMessageFunc);
        expect(asyncWarningMessageResult).toContain(accessMessagePart);
      });
    });

    // Postgres and vcore mongo account checks basically pass through to CheckFirewallRules so those
    // tests are omitted here and included in CheckFirewallRules.test.ts
  });
});
