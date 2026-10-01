import fetch from "node-fetch";
import { AuthType } from "../../AuthType";
import { updateUserContext } from "../../UserContext";
import { ARMError, armRequest } from "./request";

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

  describe("operation status throttling", () => {
    const operationUrl = "https://foo.com/operations/123?api-version=2001-01-01";
    const requestOptions = { apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "PUT" } as const;
    const response = (status: number, body: unknown = {}, headers: Record<string, string> = {}) => ({
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(headers),
      json: jest.fn().mockResolvedValue(body),
    });

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-10-01T00:00:00Z"));
      updateUserContext({ authType: AuthType.AAD, authorizationToken: "some-token" });
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it("retries a throttled status GET without resubmitting the accepted write", async () => {
      const result = { status: "Succeeded" };
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockResolvedValueOnce(
          response(
            429,
            { error: { code: "SubscriptionRequestsThrottled", message: "Please retry" } },
            { "Retry-After": "3" },
          ),
        )
        .mockResolvedValueOnce(response(200, result));
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(2999);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1);
      await expect(outcome).resolves.toEqual(result);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
      expect(fetchMock.mock.calls.slice(1).map(([url, options]) => ({ url, method: options.method }))).toEqual([
        { url: operationUrl, method: "GET" },
        { url: operationUrl, method: "GET" },
      ]);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("continues polling after a throttled read recovers to an in-progress response", async () => {
      const result = { status: "Succeeded" };
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockResolvedValueOnce(response(429, { code: "429", message: "Throttled" }, { "Retry-After": "1" }))
        .mockResolvedValueOnce(response(202, { status: "InProgress" }))
        .mockResolvedValueOnce(response(200, result));
      window.fetch = fetchMock;
      const outcome = armRequest({ ...requestOptions, method: "POST" }).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(1999);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      await jest.advanceTimersByTimeAsync(1);
      await expect(outcome).resolves.toEqual(result);
      expect(fetchMock.mock.calls.map(([, options]) => options.method)).toEqual(["POST", "GET", "GET", "GET"]);
    });

    it.each([true, false])(
      "stops exhausted 429 retries and preserves the final error (wrapped=%s)",
      async (wrapped) => {
        const details = { code: "SubscriptionRequestsThrottled", message: "Status reads throttled" };
        const throttled = response(429, wrapped ? { error: details } : details, { "Retry-After": "1" });
        const fetchMock = jest
          .fn()
          .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
          .mockResolvedValue(throttled);
        window.fetch = fetchMock;
        const outcome = armRequest(requestOptions).catch((error: unknown) => error);

        await jest.runAllTimersAsync();
        await expect(outcome).resolves.toBeInstanceOf(ARMError);
        await expect(outcome).resolves.toMatchObject(details);
        expect(fetchMock.mock.calls.map(([, options]) => options.method)).toEqual(["PUT", "GET", "GET", "GET"]);
        expect(throttled.json).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
      },
    );

    it.each([
      { retryAfter: "31", reads: 1, elapsed: 0 },
      { retryAfter: "20", reads: 2, elapsed: 20000 },
      { retryAfter: "15", reads: 3, elapsed: 30000 },
    ])(
      "does not restart the polling backoff budget for Retry-After $retryAfter",
      async ({ retryAfter, reads, elapsed }) => {
        const started = Date.now();
        const fetchMock = jest
          .fn()
          .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
          .mockResolvedValue(response(429, { code: "429", message: "Throttled" }, { "Retry-After": retryAfter }));
        window.fetch = fetchMock;
        const outcome = armRequest(requestOptions).catch((error: unknown) => error);

        await jest.runAllTimersAsync();
        await expect(outcome).resolves.toMatchObject({ code: "429", message: "Throttled" });
        expect(fetchMock).toHaveBeenCalledTimes(1 + reads);
        expect(Date.now() - started).toBe(elapsed);
      },
    );

    it.each([429, 202])("cancels the wait after polling HTTP %s without another request", async (status) => {
      const controller = new AbortController();
      const reason = new Error("Polling cancelled");
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockResolvedValue(response(status, { status: "InProgress", code: "429" }, { "Retry-After": "10" }));
      window.fetch = fetchMock;
      const outcome = armRequest({ ...requestOptions, signal: controller.signal }).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(50);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      controller.abort(reason);
      await expect(outcome).resolves.toBe(reason);
      await jest.advanceTimersByTimeAsync(30000);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("does not start polling when cancellation arrives with the accepted response", async () => {
      const controller = new AbortController();
      const reason = new Error("Cancelled after acceptance");
      const started = Date.now();
      const fetchMock = jest.fn().mockImplementationOnce(async () => {
        controller.abort(reason);
        return response(202, {}, { location: operationUrl });
      });
      window.fetch = fetchMock;
      const outcome = armRequest({ ...requestOptions, signal: controller.signal }).catch((error: unknown) => error);

      await jest.runAllTimersAsync();
      await expect(outcome).resolves.toBe(reason);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(Date.now() - started).toBe(0);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("cancels an in-flight status request", async () => {
      const controller = new AbortController();
      const reason = new Error("Polling cancelled");
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockImplementation(
          (_url: string, init: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
              init.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
            }),
        );
      window.fetch = fetchMock;
      const outcome = armRequest({ ...requestOptions, signal: controller.signal }).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(50);
      controller.abort(reason);
      await expect(outcome).resolves.toBe(reason);
      await jest.advanceTimersByTimeAsync(30000);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("does not restart exhausted status-request timeout retries", async () => {
      const failure = Object.assign(new Error("Status request timed out"), { name: "AbortError" });
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockRejectedValue(failure);
      window.fetch = fetchMock;
      const outcome = armRequest({ ...requestOptions, timeoutMs: 250 }).catch((error: unknown) => error);

      await jest.runAllTimersAsync();
      await expect(outcome).resolves.toBe(failure);
      expect(fetchMock).toHaveBeenCalledTimes(4);
      expect(setTimeoutSpy.mock.calls.map((call) => call[1])).toEqual(expect.arrayContaining([250, 500, 1000]));
      expect(jest.getTimerCount()).toBe(0);
    });

    it("finishes on HTTP 204 without reading a response body", async () => {
      const complete = response(204);
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockResolvedValueOnce(complete);
      window.fetch = fetchMock;

      await expect(armRequest(requestOptions)).resolves.toBeUndefined();
      expect(complete.json).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each(["Failed", "Canceled"])("does not retry terminal operation state %s", async (status) => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockResolvedValue(response(200, { status, error: { code: "OperationFailed", message: "Operation stopped" } }));
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.runAllTimersAsync();
      await expect(outcome).resolves.toMatchObject({ message: expect.stringContaining("Operation stopped") });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([400, 401, 403, 404, 500, 503])("does not retry non-throttling polling error HTTP %s", async (status) => {
      const details = { code: "PollingFailed", message: "Status unavailable" };
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(response(202, {}, { location: operationUrl }))
        .mockResolvedValue(response(status, { error: details }));
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.runAllTimersAsync();
      await expect(outcome).resolves.toMatchObject(details);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("HTTP 429 retries", () => {
    const requestOptions = { apiVersion: "2001-01-01", host: "https://foo.com", path: "foo", method: "GET" } as const;
    const throttledResponse = (retryAfter?: string, code = "429", message = "Throttled") => ({
      ok: false,
      status: 429,
      headers: new Headers(retryAfter === undefined ? {} : { "Retry-After": retryAfter }),
      json: jest.fn().mockResolvedValue({ error: { code, message } }),
    });
    const recoveredResponse = () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({ recovered: true }),
    });

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-10-01T00:00:00Z"));
      jest.spyOn(Math, "random").mockReturnValue(0.5);
      updateUserContext({ authType: AuthType.AAD, authorizationToken: "some-token" });
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it("honors Retry-After seconds before retrying a throttled GET", async () => {
      const throttled = throttledResponse("1");
      const fetchMock = jest.fn().mockResolvedValueOnce(throttled).mockResolvedValueOnce(recoveredResponse());
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await expect(outcome).resolves.toEqual({ recovered: true });
      expect(throttled.json).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it("honors an HTTP-date Retry-After value", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(throttledResponse("Thu, 01 Oct 2026 00:00:02 GMT"))
        .mockResolvedValueOnce(recoveredResponse());
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(1999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      await expect(outcome).resolves.toEqual({ recovered: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each(["0", "Wed, 30 Sep 2026 23:59:59 GMT"])(
      "allows an immediate retry for Retry-After %s",
      async (retryAfter) => {
        const fetchMock = jest
          .fn()
          .mockResolvedValueOnce(throttledResponse(retryAfter))
          .mockResolvedValueOnce(recoveredResponse());
        window.fetch = fetchMock;
        const outcome = armRequest(requestOptions).catch((error: unknown) => error);

        await jest.advanceTimersByTimeAsync(1);
        await expect(outcome).resolves.toEqual({ recovered: true });
        expect(fetchMock).toHaveBeenCalledTimes(2);
      },
    );

    it.each([undefined, "", "invalid", "-1", "1.5", "Infinity", "1e3"])(
      "uses jittered exponential backoff for an absent or invalid Retry-After (%s)",
      async (retryAfter) => {
        const fetchMock = jest
          .fn()
          .mockResolvedValueOnce(throttledResponse(retryAfter, "TooManyRequests"))
          .mockResolvedValueOnce(throttledResponse(retryAfter, "429"))
          .mockResolvedValueOnce(recoveredResponse());
        window.fetch = fetchMock;
        const outcome = armRequest(requestOptions).catch((error: unknown) => error);

        await jest.advanceTimersByTimeAsync(1499);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await jest.advanceTimersByTimeAsync(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        await jest.advanceTimersByTimeAsync(2999);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        await jest.advanceTimersByTimeAsync(1);
        await expect(outcome).resolves.toEqual({ recovered: true });
        expect(fetchMock).toHaveBeenCalledTimes(3);
      },
    );

    it("preserves the final service error after three throttled attempts", async () => {
      const first = throttledResponse("1", "429", "First failure");
      const last = throttledResponse("1", "TooManyRequests", "Final failure");
      const fetchMock = jest.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(first).mockResolvedValueOnce(last);
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(2000);
      await expect(outcome).resolves.toBeInstanceOf(ARMError);
      await expect(outcome).resolves.toMatchObject({ code: "TooManyRequests", message: "Final failure" });
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(first.json).not.toHaveBeenCalled();
      expect(last.json).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });

    it.each([
      { retryAfter: "31", calls: 1, elapsed: 0 },
      { retryAfter: "20", calls: 2, elapsed: 20000 },
      { retryAfter: "30", calls: 2, elapsed: 30000 },
      { retryAfter: "15", calls: 3, elapsed: 30000 },
      { retryAfter: "999999999999999999999", calls: 1, elapsed: 0 },
    ])(
      "bounds cumulative backoff without shortening Retry-After $retryAfter",
      async ({ retryAfter, calls, elapsed }) => {
        const started = Date.now();
        const response = throttledResponse(retryAfter);
        const fetchMock = jest.fn().mockResolvedValue(response);
        window.fetch = fetchMock;
        const outcome = armRequest(requestOptions).catch((error: unknown) => error);

        await jest.runAllTimersAsync();
        await expect(outcome).resolves.toMatchObject({ code: "429", message: "Throttled" });
        expect(fetchMock).toHaveBeenCalledTimes(calls);
        expect(Date.now() - started).toBe(elapsed);
        expect(response.json).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
      },
    );

    it("shares the attempt budget between timeouts and throttling", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const last = throttledResponse("1", "429", "Last attempt throttled");
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(throttledResponse("1"))
        .mockRejectedValueOnce(Object.assign(new Error("Timed out"), { name: "AbortError" }))
        .mockResolvedValueOnce(last);
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(1100);
      await expect(outcome).resolves.toMatchObject({ code: "429", message: "Last attempt throttled" });
      expect(fetchMock).toHaveBeenCalledTimes(3);
      const timeouts = setTimeoutSpy.mock.calls.map((call) => call[1]);
      expect(timeouts).toEqual(expect.arrayContaining([5000, 10000, 20000]));
      expect(jest.getTimerCount()).toBe(0);
    });

    it("includes timeout backoff in the cumulative delay budget", async () => {
      const started = Date.now();
      const fetchMock = jest
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error("Timed out"), { name: "AbortError" }))
        .mockResolvedValueOnce(throttledResponse("30"));
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.runAllTimersAsync();
      await expect(outcome).resolves.toMatchObject({ code: "429" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(Date.now() - started).toBe(100);
    });

    it.each(["throttling", "timeout"])("cancels %s backoff without another request or leaked timers", async (cause) => {
      const controller = new AbortController();
      const reason = new Error("Cancelled by caller");
      const addListener = jest.spyOn(controller.signal, "addEventListener");
      const removeListener = jest.spyOn(controller.signal, "removeEventListener");
      const fetchMock = jest
        .fn()
        .mockImplementation(() =>
          cause === "throttling"
            ? Promise.resolve(throttledResponse("1"))
            : Promise.reject(Object.assign(new Error("Timed out"), { name: "AbortError" })),
        );
      window.fetch = fetchMock;
      const outcome = armRequest({ ...requestOptions, signal: controller.signal }).catch((error: unknown) => error);

      await jest.advanceTimersByTimeAsync(50);
      controller.abort(reason);
      await expect(outcome).resolves.toBe(reason);
      await jest.advanceTimersByTimeAsync(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(removeListener).toHaveBeenCalledTimes(addListener.mock.calls.length);
      expect(jest.getTimerCount()).toBe(0);
    });

    it.each(["POST", "PUT", "PATCH", "DELETE", "HEAD"] as const)("does not retry HTTP 429 for %s", async (method) => {
      const fetchMock = jest.fn().mockResolvedValue(throttledResponse("1"));
      window.fetch = fetchMock;
      const outcome = armRequest({ ...requestOptions, method }).catch((error: unknown) => error);

      await jest.runAllTimersAsync();
      await expect(outcome).resolves.toMatchObject({ code: "429" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([400, 401, 403, 404, 408, 409, 500, 502, 503])("does not retry HTTP %s", async (status) => {
      const fetchMock = jest.fn().mockResolvedValue({ ...throttledResponse("1", "OtherError"), status });
      window.fetch = fetchMock;
      const outcome = armRequest(requestOptions).catch((error: unknown) => error);

      await jest.runAllTimersAsync();
      await expect(outcome).resolves.toMatchObject({ code: "OtherError" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
