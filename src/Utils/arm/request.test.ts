import fetch, { Headers } from "node-fetch";
import { AuthType } from "../../AuthType";
import { updateUserContext } from "../../UserContext";
import { armRequest } from "./request";

interface Global {
  Headers: unknown;
}

(global as unknown as Global).Headers = (fetch as unknown as Global).Headers;

describe("ARM request", () => {
  updateUserContext({
    authType: AuthType.AAD,
    authorizationToken: "some-token",
  });

  it("should call window.fetch", async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        return {};
      },
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
      json: async () => ({}),
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
      },
    });
    await expect(() =>
      armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" }),
    ).rejects.toThrow();
    expect(window.fetch).toHaveBeenCalledTimes(2);
  });

  it("should throw token error", async () => {
    updateUserContext({
      authType: AuthType.AAD,
      authorizationToken: undefined,
    });
    const headers = new Headers();
    headers.set("location", "https://foo.com/operationStatus");
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers,
      status: 200,
      json: async () => {
        return { status: "Failed" };
      },
    });
    await expect(() =>
      armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" }),
    ).rejects.toThrow("No authority token provided");
  });
});
