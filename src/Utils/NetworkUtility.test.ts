import { MongoProxyEndpoints, PortalBackendEndpoints } from "Common/Constants";
import { resetConfigContext, updateConfigContext } from "ConfigContext";
import { DatabaseAccount, IpRule } from "Contracts/DataModels";
import { updateUserContext } from "UserContext";
import { MongoProxyOutboundIPs, PortalBackendOutboundIPs } from "Utils/EndpointUtils";
import { getNetworkSettingsWarningMessage } from "./NetworkUtility";

describe("NetworkUtility tests", () => {
  describe("getNetworkSettingsWarningMessage", () => {
    const publicAccessMessagePart = "Please enable public access to proceed";
    const accessMessagePart = "Please allow access from Azure Portal to proceed";
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
      const portalBackendOutboundIPs: string[] = [
        ...PortalBackendOutboundIPs[PortalBackendEndpoints.Mpac],
        ...PortalBackendOutboundIPs[PortalBackendEndpoints.Prod],
        ...MongoProxyOutboundIPs[MongoProxyEndpoints.Mpac],
        ...MongoProxyOutboundIPs[MongoProxyEndpoints.Prod],
      ];
      updateUserContext({
        databaseAccount: {
          kind: "MongoDB",
          properties: {
            ipRules: portalBackendOutboundIPs.map((ip: string) => ({ ipAddressOrRange: ip }) as IpRule),
            publicNetworkAccess: "Enabled",
          },
        } as DatabaseAccount,
      });

      updateConfigContext({
        PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Mpac,
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Mpac,
      });

      let asyncWarningMessageResult: string;
      const asyncWarningMessageFunc = (msg: string) => (asyncWarningMessageResult = msg);

      await getNetworkSettingsWarningMessage(asyncWarningMessageFunc);
      expect(asyncWarningMessageResult).toBeUndefined();
    });

    it("should return accessMessage when incorrent ip rule is added to mongo/cassandra account per endpoint", async () => {
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
        PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Mpac,
        MONGO_PROXY_ENDPOINT: MongoProxyEndpoints.Mpac,
      });

      let asyncWarningMessageResult: string;
      const asyncWarningMessageFunc = (msg: string) => (asyncWarningMessageResult = msg);

      await getNetworkSettingsWarningMessage(asyncWarningMessageFunc);
      expect(asyncWarningMessageResult).toContain(accessMessagePart);
    });

    // Postgres and vcore mongo account checks basically pass through to CheckFirewallRules so those
    // tests are omitted here and included in CheckFirewallRules.test.ts
  });
});
