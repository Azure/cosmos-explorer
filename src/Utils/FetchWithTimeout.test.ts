import { fetchWithTimeout, tryFetchWithTimeout } from "./FetchWithTimeout";

describe("fetchWithTimeout", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("forwards init and resolves with the fetch response", async () => {
    const fakeResponse = { ok: true } as Response;
    const fetchMock = jest.fn().mockResolvedValue(fakeResponse);
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const result = await fetchWithTimeout("https://example.com", { method: "GET" }, 1000);

    expect(result).toBe(fakeResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.com");
    expect((init as RequestInit).method).toBe("GET");
    expect((init as RequestInit).signal).toBeDefined();
  });

  it("aborts the fetch when the internal timeout fires", async () => {
    jest.useFakeTimers();
    let receivedSignal: AbortSignal | undefined;
    global.fetch = jest.fn().mockImplementation((_url: string, init: RequestInit) => {
      receivedSignal = init.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    }) as unknown as typeof global.fetch;

    const pending = fetchWithTimeout("https://example.com", {}, 50);
    jest.advanceTimersByTime(50);
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(receivedSignal?.aborted).toBe(true);
  });

  it("throws immediately when the external signal is already aborted", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const controller = new AbortController();
    const reason = new Error("user-cancelled");
    controller.abort(reason);

    await expect(fetchWithTimeout("https://example.com", { signal: controller.signal }, 1000)).rejects.toBe(reason);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts mid-fetch when the external signal aborts and propagates the reason", async () => {
    const reason = new Error("user-cancelled");
    let internalSignal: AbortSignal | undefined;
    global.fetch = jest.fn().mockImplementation((_url: string, init: RequestInit) => {
      internalSignal = init.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(init.signal?.reason ?? new Error("aborted")));
      });
    }) as unknown as typeof global.fetch;

    const controller = new AbortController();
    const pending = fetchWithTimeout("https://example.com", { signal: controller.signal }, 60000);
    // Let the fetch wire up its abort listener before triggering.
    await Promise.resolve();
    controller.abort(reason);

    await expect(pending).rejects.toBe(reason);
    expect(internalSignal?.aborted).toBe(true);
  });

  it("skips the timer when timeoutMs is Infinity", async () => {
    const setTimeoutSpy = jest.spyOn(global, "setTimeout");
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response) as unknown as typeof global.fetch;

    await fetchWithTimeout("https://example.com", {}, Infinity);

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it("cleans up the timer and external listener after a successful fetch", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response) as unknown as typeof global.fetch;

    const controller = new AbortController();
    const removeListenerSpy = jest.spyOn(controller.signal, "removeEventListener");

    await fetchWithTimeout("https://example.com", { signal: controller.signal }, 1000);

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledWith("abort", expect.any(Function));
    clearTimeoutSpy.mockRestore();
  });

  it("cleans up the timer and listener when the fetch rejects", async () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const networkError = new Error("network down");
    global.fetch = jest.fn().mockRejectedValue(networkError) as unknown as typeof global.fetch;

    const controller = new AbortController();
    const removeListenerSpy = jest.spyOn(controller.signal, "removeEventListener");

    await expect(fetchWithTimeout("https://example.com", { signal: controller.signal }, 1000)).rejects.toBe(
      networkError,
    );

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(removeListenerSpy).toHaveBeenCalledWith("abort", expect.any(Function));
    clearTimeoutSpy.mockRestore();
  });
});

describe("tryFetchWithTimeout", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns null on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("boom")) as unknown as typeof global.fetch;
    await expect(tryFetchWithTimeout("https://example.com")).resolves.toBeNull();
  });

  it("returns the response on success", async () => {
    const response = { ok: true } as Response;
    global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof global.fetch;
    await expect(tryFetchWithTimeout("https://example.com")).resolves.toBe(response);
  });
});
