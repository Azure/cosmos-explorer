import { armRequest } from "./request";
import fetch from "node-fetch";
import { updateUserContext } from "../../UserContext";
import { AuthType } from "../../AuthType";

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

  describe("timeout and retry behavior", () => {
    beforeEach(() => {
      updateUserContext({
        authType: AuthType.AAD,
        authorizationToken: "some-token",
      });
    });

    const makeAbortError = () => Object.assign(new Error("aborted"), { name: "AbortError" });
    const okResponse = () => ({
      ok: true,
      headers: new Headers(),
      json: async () => ({}),
    });

    it("forwards timeoutMs to the underlying fetch timer", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      window.fetch = jest.fn().mockResolvedValue(okResponse());

      await armRequest({
        apiVersion: "2001-01-01",
        host: "https://foo.com",
        path: "foo",
        method: "POST",
        timeoutMs: 12345,
      });

      const timeoutValues = setTimeoutSpy.mock.calls.map((c) => c[1]);
      expect(timeoutValues).toContain(12345);
      setTimeoutSpy.mockRestore();
    });

    it("uses the default 5000ms timeout when timeoutMs is not provided", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      window.fetch = jest.fn().mockResolvedValue(okResponse());

      await armRequest({ apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "POST" });

      const timeoutValues = setTimeoutSpy.mock.calls.map((c) => c[1]);
      expect(timeoutValues).toContain(5000);
      setTimeoutSpy.mockRestore();
    });

    it("skips the timer when timeoutMs is Infinity", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      window.fetch = jest.fn().mockResolvedValue(okResponse());

      await armRequest({
        apiVersion: "2001-01-01",
        host: "https://foo.com",
        path: "foo",
        method: "POST",
        timeoutMs: Infinity,
      });

      // No timer should be created by fetchWithTimeout.
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      setTimeoutSpy.mockRestore();
    });

    it("retries GET on timeout with escalating timeouts and eventually succeeds", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const fetchMock = jest
        .fn()
        .mockRejectedValueOnce(makeAbortError())
        .mockRejectedValueOnce(makeAbortError())
        .mockResolvedValueOnce(okResponse());
      window.fetch = fetchMock;

      await armRequest({
        apiVersion: "2001-01-01",
        host: "https://foo.com",
        path: "foo",
        method: "GET",
        timeoutMs: 1000,
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);
      const timeoutValues = setTimeoutSpy.mock.calls.map((c) => c[1]);
      // Each attempt creates a setTimeout for its escalating timeout (1x, 2x, 4x).
      expect(timeoutValues).toContain(1000);
      expect(timeoutValues).toContain(2000);
      expect(timeoutValues).toContain(4000);
      setTimeoutSpy.mockRestore();
    });

    it("gives up after exhausting retries and rejects with the last AbortError", async () => {
      const fetchMock = jest.fn().mockRejectedValue(makeAbortError());
      window.fetch = fetchMock;

      await expect(
        armRequest({
          apiVersion: "2001-01-01",
          host: "https://foo.com",
          path: "foo",
          method: "GET",
          timeoutMs: 1000,
        }),
      ).rejects.toMatchObject({ name: "AbortError" });

      // 3 attempts total (initial + 2 retries).
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("does not retry non-GET methods on timeout", async () => {
      const fetchMock = jest.fn().mockRejectedValue(makeAbortError());
      window.fetch = fetchMock;

      for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD"] as const) {
        fetchMock.mockClear();
        await expect(
          armRequest({
            apiVersion: "2001-01-01",
            host: "https://foo.com",
            path: "foo",
            method,
            timeoutMs: 1000,
          }),
        ).rejects.toBeTruthy();
        expect(fetchMock).toHaveBeenCalledTimes(1);
      }
    });

    it("does not retry GET on HTTP 500 (server error)", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ code: "InternalServerError", message: "boom" }),
      });
      window.fetch = fetchMock;

      await expect(
        armRequest({
          apiVersion: "2001-01-01",
          host: "https://foo.com",
          path: "foo",
          method: "GET",
          timeoutMs: 1000,
        }),
      ).rejects.toThrow("boom");

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("stops retrying GET when the caller's signal is already aborted", async () => {
      const controller = new AbortController();
      const reason = new Error("user-cancelled");
      controller.abort(reason);
      const fetchMock = jest.fn().mockRejectedValue(makeAbortError());
      window.fetch = fetchMock;

      await expect(
        armRequest({
          apiVersion: "2001-01-01",
          host: "https://foo.com",
          path: "foo",
          method: "GET",
          timeoutMs: 1000,
          signal: controller.signal,
        }),
      ).rejects.toBeTruthy();

      // fetchWithTimeout throws synchronously on already-aborted signal, so no fetch call.
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("combines caller signal with timeout: aborting the signal cancels in-flight fetch", async () => {
      const controller = new AbortController();
      const reason = new Error("user-cancelled");

      let receivedSignal: AbortSignal | undefined;
      window.fetch = jest.fn().mockImplementation((_url: string, init: RequestInit) => {
        receivedSignal = init.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason ?? new Error("aborted")));
        });
      });

      const pending = armRequest({
        apiVersion: "2001-01-01",
        host: "https://foo.com",
        path: "foo",
        method: "POST",
        timeoutMs: 60000,
        signal: controller.signal,
      });

      // Allow fetch to wire up its abort listener.
      await Promise.resolve();
      controller.abort(reason);

      await expect(pending).rejects.toBe(reason);
      expect(receivedSignal?.aborted).toBe(true);
    });
  });
});
