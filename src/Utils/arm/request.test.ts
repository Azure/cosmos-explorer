import { armRequest } from "./request";
import fetch from "node-fetch";
import { userContext, updateUserContext } from "../../UserContext";
import { AuthType } from "../../AuthType";

interface Global {
  Headers: unknown;
}

((global as unknown) as Global).Headers = ((fetch as unknown) as Global).Headers;

describe("ARM request", () => {
  window.authType = AuthType.AAD;
  updateUserContext({
    authorizationToken: "some-token"
  });

  it("should call window.fetch", async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        return {};
      }
    });
    await armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" });
    expect(window.fetch).toHaveBeenCalled();
  });

  it("should poll for async operations", async () => {
    const headers = new Headers();
    headers.set("location", "https://foo.com/operationStatus");
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers,
      status: 200,
      json: async () => ({})
    });
    await armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" });
    expect(window.fetch).toHaveBeenCalledTimes(2);
  });

  it("should throw for failed async operations", async () => {
    const headers = new Headers();
    headers.set("location", "https://foo.com/operationStatus");
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers,
      status: 200,
      json: async () => {
        return { status: "Failed" };
      }
    });
    await expect(() =>
      armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" })
    ).rejects.toThrow();
    expect(window.fetch).toHaveBeenCalledTimes(2);
  });

  it("should throw token error", async () => {
    window.authType = AuthType.AAD;
    updateUserContext({
      authorizationToken: null
    });
    const headers = new Headers();
    headers.set("location", "https://foo.com/operationStatus");
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers,
      status: 200,
      json: async () => {
        return { status: "Failed" };
      }
    });
    await expect(() =>
      armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" })
    ).rejects.toThrow("No authority token provided");
  });
});
