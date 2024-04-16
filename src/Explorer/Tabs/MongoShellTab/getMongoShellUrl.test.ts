import { Platform, resetConfigContext, updateConfigContext } from "../../../ConfigContext";
import { updateUserContext, userContext } from "../../../UserContext";
import { getMongoShellUrl } from "./getMongoShellUrl";

const mongoBackendEndpoint = "https://localhost:1234";

describe("getMongoShellUrl", () => {
  let queryString = "";

  beforeEach(() => {
    resetConfigContext();

    updateConfigContext({
      BACKEND_ENDPOINT: mongoBackendEndpoint,
      platform: Platform.Hosted,
    });

    updateUserContext({
      subscriptionId: "fakeSubscriptionId",
      resourceGroup: "fakeResourceGroup",
      databaseAccount: {
        id: "fakeId",
        name: "fakeName",
        location: "fakeLocation",
        type: "fakeType",
        kind: "fakeKind",
        properties: {
          documentEndpoint: "fakeDocumentEndpoint",
          tableEndpoint: "fakeTableEndpoint",
          gremlinEndpoint: "fakeGremlinEndpoint",
          cassandraEndpoint: "fakeCassandraEndpoint",
        },
      },
      portalEnv: "prod",
    });

    queryString = `resourceId=${userContext.databaseAccount.id}&accountName=${userContext.databaseAccount.name}&mongoEndpoint=${userContext.databaseAccount.properties.documentEndpoint}`;
  });

  it("should return /indexv2.html by default", () => {
    expect(getMongoShellUrl().toString()).toContain(`/indexv2.html?${queryString}`);
  });

  it("should return /index.html when useMongoProxyEndpoint is true", () => {
    const useMongoProxyEndpoint: boolean = true;
    expect(getMongoShellUrl(useMongoProxyEndpoint).toString()).toContain(`/index.html?${queryString}`);
  });
});
