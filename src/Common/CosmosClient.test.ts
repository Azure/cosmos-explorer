import { PortalBackendEndpoints } from "Common/Constants";
import { configContext, Platform, resetConfigContext, updateConfigContext } from "../ConfigContext";
import { updateUserContext } from "../UserContext";
import { endpoint, getTokenFromAuthService, requestPlugin } from "./CosmosClient";

describe("getTokenFromAuthService", () => {
  beforeEach(() => {
    delete window.dataExplorer;
    resetConfigContext();
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
    updateConfigContext({
      PORTAL_BACKEND_ENDPOINT: PortalBackendEndpoints.Prod,
    });
    getTokenFromAuthService("GET", "dbs", "foo");
    expect(window.fetch).toHaveBeenCalledWith(
      `${configContext.PORTAL_BACKEND_ENDPOINT}/api/connectionstring/runtimeproxy/authorizationtokens`,
      expect.any(Object),
    );
  });

  it("builds the correct URL in dev", () => {
    updateConfigContext({
      PORTAL_BACKEND_ENDPOINT: "https://localhost:1234",
    });
    getTokenFromAuthService("GET", "dbs", "foo");
    expect(window.fetch).toHaveBeenCalledWith(
      `${configContext.PORTAL_BACKEND_ENDPOINT}/api/connectionstring/runtimeproxy/authorizationtokens`,
      expect.any(Object),
    );
  });
});

describe("endpoint", () => {
  it("falls back to _databaseAccount", () => {
    updateUserContext({
      databaseAccount: {
        id: "foo",
        name: "foo",
        location: "foo",
        type: "foo",
        kind: "foo",
        properties: {
          documentEndpoint: "bar",
          gremlinEndpoint: "foo",
          tableEndpoint: "foo",
          cassandraEndpoint: "foo",
        },
      },
    });
    expect(endpoint()).toEqual("bar");
  });
  it("uses _endpoint if set", () => {
    updateUserContext({
      endpoint: "baz",
    });
    expect(endpoint()).toEqual("baz");
  });
});

describe("requestPlugin", () => {
  beforeEach(() => {
    resetConfigContext();
  });

  describe("Hosted", () => {
    it("builds a proxy URL in development", () => {
      const next = jest.fn();
      updateConfigContext({
        platform: Platform.Hosted,
        PORTAL_BACKEND_ENDPOINT: "https://localhost:1234",
        PROXY_PATH: "/proxy",
      });
      const headers = {};
      const endpoint = "https://docs.azure.com";
      const path = "/dbs/foo";
      requestPlugin({ endpoint, headers, path } as any, undefined, next as any);
      expect(next.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe("Emulator", () => {
    it("builds a url for emulator proxy via webpack", () => {
      const next = jest.fn();
      updateConfigContext({ platform: Platform.Emulator, PROXY_PATH: "/proxy" });
      const headers = {};
      const endpoint = "";
      const path = "/dbs/foo";
      requestPlugin({ endpoint, headers, path } as any, undefined, next as any);
      expect(next.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
