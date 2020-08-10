import { armRequest } from "./request";

describe("ARM request", () => {
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
    headers.set("azure-asyncoperation", "https://foo.com/operationStatus");
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers,
      json: async () => {
        return { status: "Succeeded" };
      }
    });
    await armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" });
    expect(window.fetch).toHaveBeenCalledTimes(2);
  });

  it("should throw for failed async operations", async () => {
    const headers = new Headers();
    headers.set("azure-asyncoperation", "https://foo.com/operationStatus");
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers,
      json: async () => {
        return { status: "Failed" };
      }
    });
    await expect(() =>
      armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" })
    ).rejects.toThrow();
    expect(window.fetch).toHaveBeenCalledTimes(2);
  });
});
