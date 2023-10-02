import { extractFeatures } from "Platform/Hosted/extractFeatures";
import { Platform, configContext, resetConfigContext, updateConfigContext } from "../../../ConfigContext";
import { updateUserContext, userContext } from "../../../UserContext";
import { getExtensionEndpoint, getMongoShellUrl } from "./getMongoShellUrl";

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
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1": "false",
          "feature.enableLegacyMongoShellV2": "false",
          "feature.enableLegacyMongoShellV1Debug": "false",
          "feature.enableLegacyMongoShellV2Debug": "false",
          "feature.loadLegacyMongoShellFromBE": "false",
        }),
      ),
      portalEnv: "prod",
    });

    queryString = `resourceId=${userContext.databaseAccount.id}&accountName=${userContext.databaseAccount.name}&mongoEndpoint=${userContext.databaseAccount.properties.documentEndpoint}`;
  });

  it("should return /mongoshell/indexv2.html by default ", () => {
    expect(getMongoShellUrl()).toBe(`/mongoshell/indexv2.html?${queryString}`);
  });

  it("should return /mongoshell/indexv2.html when portalEnv==localhost ", () => {
    updateUserContext({
      portalEnv: "localhost",
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/indexv2.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV1===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1": "true",
        }),
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/index.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV2===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2": "true",
        }),
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/indexv2.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV1Debug===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1Debug": "true",
        }),
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/debug/index.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV2Debug===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2Debug": "true",
        }),
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/debug/indexv2.html?${queryString}`);
  });

  describe("loadLegacyMongoShellFromBE===true", () => {
    beforeEach(() => {
      resetConfigContext();
      updateConfigContext({
        BACKEND_ENDPOINT: mongoBackendEndpoint,
        platform: Platform.Hosted,
      });

      updateUserContext({
        features: extractFeatures(
          new URLSearchParams({
            "feature.loadLegacyMongoShellFromBE": "true",
          }),
        ),
      });
    });

    it("should return /mongoshell/index.html", () => {
      const endpoint = getExtensionEndpoint(configContext.platform, configContext.BACKEND_ENDPOINT);
      expect(getMongoShellUrl()).toBe(`${endpoint}/content/mongoshell/debug/index.html?${queryString}`);
    });

    it("configContext.platform !== Platform.Hosted, should return /mongoshell/indexv2.html", () => {
      updateConfigContext({
        platform: Platform.Portal,
      });

      const endpoint = getExtensionEndpoint(configContext.platform, configContext.BACKEND_ENDPOINT);
      expect(getMongoShellUrl()).toBe(`${endpoint}/content/mongoshell/debug/index.html?${queryString}`);
    });

    it("configContext.BACKEND_ENDPOINT !== '' and configContext.platform !== Platform.Hosted, should return /mongoshell/indexv2.html", () => {
      resetConfigContext();
      updateConfigContext({
        platform: Platform.Portal,
        BACKEND_ENDPOINT: mongoBackendEndpoint,
      });

      const endpoint = getExtensionEndpoint(configContext.platform, configContext.BACKEND_ENDPOINT);
      expect(getMongoShellUrl()).toBe(`${endpoint}/content/mongoshell/debug/index.html?${queryString}`);
    });

    it("configContext.BACKEND_ENDPOINT === '' and configContext.platform === Platform.Hosted, should return /mongoshell/indexv2.html ", () => {
      resetConfigContext();
      updateConfigContext({
        platform: Platform.Hosted,
      });

      const endpoint = getExtensionEndpoint(configContext.platform, configContext.BACKEND_ENDPOINT);
      expect(getMongoShellUrl()).toBe(`${endpoint}/content/mongoshell/debug/index.html?${queryString}`);
    });

    it("configContext.BACKEND_ENDPOINT === '' and configContext.platform !== Platform.Hosted, should return /mongoshell/indexv2.html", () => {
      resetConfigContext();
      updateConfigContext({
        platform: Platform.Portal,
      });

      const endpoint = getExtensionEndpoint(configContext.platform, configContext.BACKEND_ENDPOINT);
      expect(getMongoShellUrl()).toBe(`${endpoint}/content/mongoshell/debug/index.html?${queryString}`);
    });
  });
});

describe("getExtensionEndpoint", () => {
  it("when platform === Platform.Hosted, backendEndpoint is undefined ", () => {
    expect(getExtensionEndpoint(Platform.Hosted, undefined)).toBe("");
  });

  it("when platform === Platform.Hosted, backendEndpoint === ''", () => {
    expect(getExtensionEndpoint(Platform.Hosted, "")).toBe("");
  });

  it("when platform === Platform.Hosted, backendEndpoint === null", () => {
    expect(getExtensionEndpoint(Platform.Hosted, null)).toBe("");
  });

  it("when platform === Platform.Hosted, backendEndpoint != '' ", () => {
    expect(getExtensionEndpoint(Platform.Hosted, "foo")).toBe("foo");
  });

  it("when platform === Platform.Portal, backendEndpoint is udefined ", () => {
    expect(getExtensionEndpoint(Platform.Portal, undefined)).toBe("");
  });

  it("when platform === Platform.Portal, backendEndpoint === '' ", () => {
    expect(getExtensionEndpoint(Platform.Portal, "")).toBe("");
  });

  it("when platform === Platform.Portal, backendEndpoint === null", () => {
    expect(getExtensionEndpoint(Platform.Portal, null)).toBe("");
  });

  it("when platform !== Platform.Portal, backendEndpoint != '' ", () => {
    expect(getExtensionEndpoint(Platform.Portal, "foo")).toBe("foo");
  });
});
