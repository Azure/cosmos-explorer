import { configContext, Platform } from "../ConfigContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { fetchWithTimeout } from "../Utils/FetchWithTimeout";
import { MetricScenario } from "./Constants";
import { reportMetric } from "./MetricEvents";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Response } = require("node-fetch");

jest.mock("../Utils/AuthorizationUtils", () => ({
  getAuthorizationHeader: jest.fn().mockReturnValue({ header: "authorization", token: "Bearer test-token" }),
}));

jest.mock("../Utils/FetchWithTimeout", () => ({
  fetchWithTimeout: jest.fn(),
}));

describe("MetricEvents", () => {
  const mockFetchWithTimeout = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("reportMetric success includes auth header", async () => {
    const mockResponse = new Response(null, { status: 200 });
    mockFetchWithTimeout.mockResolvedValue(mockResponse);

    const result = await reportMetric({
      platform: Platform.Portal,
      api: "SQL",
      scenario: MetricScenario.ApplicationLoad,
      healthy: true,
    });

    expect(result).toBeInstanceOf(Response);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);

    const callArgs = mockFetchWithTimeout.mock.calls[0];
    expect(callArgs[0]).toContain("/api/dataexplorer/metrics/health");
    expect(callArgs[1]?.headers).toEqual({
      "Content-Type": "application/json",
      authorization: "Bearer test-token",
    });

    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.scenario).toBe(MetricScenario.ApplicationLoad);
    expect(body.platform).toBe(Platform.Portal);
    expect(body.api).toBe("SQL");
    expect(body.healthy).toBe(true);
    expect(getAuthorizationHeader).toHaveBeenCalled();
  });

  test("reportMetric sends full enriched payload", async () => {
    const mockResponse = new Response(null, { status: 200 });
    mockFetchWithTimeout.mockResolvedValue(mockResponse);

    const event = {
      platform: Platform.Portal,
      api: "SQL" as const,
      scenario: MetricScenario.ApplicationLoad,
      healthy: true,
      durationMs: 2847,
      timedOut: false,
      documentHidden: false,
      hasExpectedFailure: false,
      completedPhases: ["ExplorerInitialized", "Interactive"],
      failedPhases: [] as string[],
      phaseTimings: {
        ExplorerInitialized: { endTimeISO: "2026-03-13T10:00:02.500Z", durationMs: 2500 },
        Interactive: { endTimeISO: "2026-03-13T10:00:02.847Z", durationMs: 2847 },
      },
      startTimeISO: "2026-03-13T10:00:00.000Z",
      endTimeISO: "2026-03-13T10:00:02.847Z",
      vitals: { lcp: 1850, inp: 120, cls: 0.05, fcp: 980, ttfb: 340 },
    };

    const result = await reportMetric(event);
    expect(result.status).toBe(200);

    const callArgs = mockFetchWithTimeout.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.healthy).toBe(true);
    expect(body.durationMs).toBe(2847);
    expect(body.timedOut).toBe(false);
    expect(body.documentHidden).toBe(false);
    expect(body.hasExpectedFailure).toBe(false);
    expect(body.completedPhases).toEqual(["ExplorerInitialized", "Interactive"]);
    expect(body.failedPhases).toEqual([]);
    expect(body.phaseTimings.ExplorerInitialized.durationMs).toBe(2500);
    expect(body.startTimeISO).toBe("2026-03-13T10:00:00.000Z");
    expect(body.endTimeISO).toBe("2026-03-13T10:00:02.847Z");
    expect(body.vitals.lcp).toBe(1850);
    expect(body.vitals.cls).toBe(0.05);
  });

  test("reportMetric omits undefined optional fields", async () => {
    const mockResponse = new Response(null, { status: 200 });
    mockFetchWithTimeout.mockResolvedValue(mockResponse);

    const event = {
      platform: Platform.Portal,
      api: "SQL" as const,
      scenario: MetricScenario.ApplicationLoad,
      healthy: false,
    };

    await reportMetric(event);

    const callArgs = mockFetchWithTimeout.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.healthy).toBe(false);
    expect(body.durationMs).toBeUndefined();
    expect(body.vitals).toBeUndefined();
    expect(body.completedPhases).toBeUndefined();
  });

  test("throws when backend endpoint missing", async () => {
    const original = configContext.PORTAL_BACKEND_ENDPOINT;
    (configContext as { PORTAL_BACKEND_ENDPOINT: string }).PORTAL_BACKEND_ENDPOINT = "";

    await expect(
      reportMetric({ platform: Platform.Portal, api: "SQL", scenario: MetricScenario.ApplicationLoad, healthy: true }),
    ).rejects.toThrow("baseUri is null or empty");

    expect(mockFetchWithTimeout).not.toHaveBeenCalled();
    (configContext as { PORTAL_BACKEND_ENDPOINT: string }).PORTAL_BACKEND_ENDPOINT = original;
  });

  test("propagates fetch errors", async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error("Network error"));

    await expect(
      reportMetric({ platform: Platform.Portal, api: "SQL", scenario: MetricScenario.ApplicationLoad, healthy: true }),
    ).rejects.toThrow("Network error");
  });

  test("propagates timeout errors", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    mockFetchWithTimeout.mockRejectedValue(abortError);

    await expect(
      reportMetric({ platform: Platform.Portal, api: "SQL", scenario: MetricScenario.ApplicationLoad, healthy: false }),
    ).rejects.toThrow("The operation was aborted");
  });
});
