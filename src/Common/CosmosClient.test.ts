import { CosmosClient, tokenProvider, endpoint, requestPlugin, getTokenFromAuthService } from "./CosmosClient";
import { ResourceType } from "@azure/cosmos/dist-esm/common/constants";
import { config, Platform } from "../Config";

describe("tokenProvider", () => {
  const options = {
    verb: "GET" as any,
    path: "/",
    resourceId: "",
    resourceType: "dbs" as ResourceType,
    headers: {},
    getAuthorizationTokenUsingMasterKey: () => "",
  };

  beforeEach(() => {
    window.dataExplorer = { extensionEndpoint: () => "https://main.documentdb.ext.azure.com" } as any;
    window.fetch = jest.fn().mockImplementation(() => {
      return {
        json: () => "{}",
        headers: new Map(),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls the auth token service if no master key is set", async () => {
    await tokenProvider(options);
    expect((window.fetch as any).mock.calls.length).toBe(1);
  });

  it("does not call the auth service if a master key is set", async () => {
    CosmosClient.masterKey("foo");
    await tokenProvider(options);
    expect((window.fetch as any).mock.calls.length).toBe(0);
  });
});

describe("getTokenFromAuthService", () => {
  beforeEach(() => {
    delete window.dataExplorer;
    delete config.BACKEND_ENDPOINT;
    window.fetch = jest.fn().mockImplementation(() => {
      return {
        json: () => "{}",
        headers: new Map(),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds the correct URL in production", () => {
    window.dataExplorer = { extensionEndpoint: () => "https://main.documentdb.ext.azure.com" } as any;
    getTokenFromAuthService("GET", "dbs", "foo");
    expect(window.fetch).toHaveBeenCalledWith(
      "https://main.documentdb.ext.azure.com/api/guest/runtimeproxy/authorizationTokens",
      expect.any(Object)
    );
  });

  it("builds the correct URL in dev", () => {
    config.BACKEND_ENDPOINT = "https://localhost:1234";
    getTokenFromAuthService("GET", "dbs", "foo");
    expect(window.fetch).toHaveBeenCalledWith(
      "https://localhost:1234/api/guest/runtimeproxy/authorizationTokens",
      expect.any(Object)
    );
  });
});

describe("endpoint", () => {
  it("falls back to _databaseAccount", () => {
    CosmosClient.databaseAccount({
      id: "foo",
      name: "foo",
      location: "foo",
      type: "foo",
      kind: "foo",
      tags: [],
      properties: {
        documentEndpoint: "bar",
        gremlinEndpoint: "foo",
        tableEndpoint: "foo",
        cassandraEndpoint: "foo",
      },
    });
    expect(endpoint()).toEqual("bar");
  });
  it("uses _endpoint if set", () => {
    CosmosClient.endpoint("baz");
    expect(endpoint()).toEqual("baz");
  });
});

describe("requestPlugin", () => {
  beforeEach(() => {
    delete window.dataExplorerPlatform;
    delete config.PROXY_PATH;
    delete config.BACKEND_ENDPOINT;
    delete config.PROXY_PATH;
  });

  describe("Hosted", () => {
    it("builds a proxy URL in development", () => {
      const next = jest.fn();
      config.platform = Platform.Hosted;
      config.BACKEND_ENDPOINT = "https://localhost:1234";
      config.PROXY_PATH = "/proxy";
      const headers = {};
      const endpoint = "https://docs.azure.com";
      const path = "/dbs/foo";
      requestPlugin({ endpoint, headers, path } as any, next as any);
      expect(next.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe("Emulator", () => {
    it("builds a url for emulator proxy via webpack", () => {
      const next = jest.fn();
      config.platform = Platform.Emulator;
      config.PROXY_PATH = "/proxy";
      const headers = {};
      const endpoint = "";
      const path = "/dbs/foo";
      requestPlugin({ endpoint, headers, path } as any, next as any);
      expect(next.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
