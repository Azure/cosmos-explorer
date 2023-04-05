import { extractFeatures } from "Platform/Hosted/extractFeatures";
import { Platform, resetConfigContext, updateConfigContext } from "../../../ConfigContext";
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
          "feature.enableLegacyMongoShellV1Dist": "false",
          "feature.enableLegacyMongoShellV2Dist": "false",
        })
      ),
      portalEnv: "prod",
    });

    queryString = `resourceId=${userContext.databaseAccount.id}&accountName=${userContext.databaseAccount.name}&mongoEndpoint=${userContext.databaseAccount.properties.documentEndpoint}`;
  });

  it("should return {mongoBackendEndpoint}/content/mongoshell/dist/index.html by default ", () => {
    expect(getMongoShellUrl()).toBe(`${mongoBackendEndpoint}/content/mongoshell/dist/index.html?${queryString}`);
  });

  it("should return {mongoBackendEndpoint}/content/mongoshell/index.html when portalEnv==localhost ", () => {
    updateUserContext({
      portalEnv: "localhost",
    });

    expect(getMongoShellUrl()).toBe(`${mongoBackendEndpoint}/content/mongoshell/index.html?${queryString}`);
  });

  it("should return {mongoBackendEndpoint}/content/mongoshell/dist/index.html when configContext.platform !== Platform.Hosted", () => {
    updateConfigContext({
      platform: Platform.Portal,
    });

    expect(getMongoShellUrl()).toBe(`${mongoBackendEndpoint}/content/mongoshell/dist/index.html?${queryString}`);
  });

  it("should return /content/mongoshell/index.html when configContext.BACKEND_ENDPOINT === '' and configContext.platform === Platform.Hosted", () => {
    resetConfigContext();
    updateConfigContext({
      platform: Platform.Hosted,
    });

    expect(getMongoShellUrl()).toBe(`/content/mongoshell/dist/index.html?${queryString}`);
  });

  it("should return /content/mongoshell/index.html when configContext.BACKEND_ENDPOINT === '' and configContext.platform !== Platform.Hosted", () => {
    resetConfigContext();

    updateConfigContext({
      platform: Platform.Portal,
    });

    expect(getMongoShellUrl()).toBe(`/content/mongoshell/dist/index.html?${queryString}`);
  });

  it("should return /content/mongoshell/index.html when configContext.BACKEND_ENDPOINT !== '' and configContext.platform !== Platform.Hosted", () => {
    resetConfigContext();
    updateConfigContext({
      platform: Platform.Portal,
      BACKEND_ENDPOINT: mongoBackendEndpoint,
    });

    expect(getMongoShellUrl()).toBe(`${mongoBackendEndpoint}/content/mongoshell/dist/index.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV1===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1": "true",
        })
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/index.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV2===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2": "true",
        })
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/indexv2.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV1Dist===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV1Dist": "true",
        })
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/dist/index.html?${queryString}`);
  });

  it("should return /mongoshell/index.html when enableLegacyMongoShellV2Dist===true", () => {
    updateUserContext({
      features: extractFeatures(
        new URLSearchParams({
          "feature.enableLegacyMongoShellV2Dist": "true",
        })
      ),
    });

    expect(getMongoShellUrl()).toBe(`/mongoshell/dist/indexv2.html?${queryString}`);
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
