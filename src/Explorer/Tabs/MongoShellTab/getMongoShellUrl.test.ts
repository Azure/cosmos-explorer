import { Platform, resetConfigContext, updateConfigContext } from "../../../ConfigContext";
import { updateUserContext, userContext } from "../../../UserContext";
import { getMongoShellUrl } from "./getMongoShellUrl";

describe("getMongoShellUrl", () => {
  let queryString = "";

  beforeEach(() => {
    resetConfigContext();

    updateConfigContext({
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

  it("should return /index.html by default", () => {
    expect(getMongoShellUrl().toString()).toContain(`/index.html?${queryString}`);
  });
});
