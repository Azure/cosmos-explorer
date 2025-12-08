import { configContext, Platform } from "../ConfigContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { fetchWithTimeout } from "../Utils/FetchWithTimeout";
import MetricScenario, { reportHealthy, reportUnhealthy } from "./MetricEvents";

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

  test("reportHealthy success includes auth header", async () => {
    const mockResponse = new Response(null, { status: 200 });
    mockFetchWithTimeout.mockResolvedValue(mockResponse);

    const result = await reportHealthy(MetricScenario.ApplicationLoad, Platform.Portal, "SQL");

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

  test("reportUnhealthy failure status", async () => {
    const mockResponse = new Response("Failure", { status: 500 });
    mockFetchWithTimeout.mockResolvedValue(mockResponse);

    const result = await reportUnhealthy(MetricScenario.ApplicationLoad, Platform.Portal, "SQL");

    expect(result).toBeInstanceOf(Response);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);

    const callArgs = mockFetchWithTimeout.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.healthy).toBe(false);
  });

  test("helpers healthy/unhealthy", async () => {
    mockFetchWithTimeout.mockResolvedValue(new Response(null, { status: 201 }));

    const healthyResult = await reportHealthy(MetricScenario.ApplicationLoad, Platform.Portal, "SQL");
    const unhealthyResult = await reportUnhealthy(MetricScenario.ApplicationLoad, Platform.Portal, "SQL");

    expect(healthyResult.status).toBe(201);
    expect(unhealthyResult.status).toBe(201);
    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(2);
  });

  test("throws when backend endpoint missing", async () => {
    const original = configContext.PORTAL_BACKEND_ENDPOINT;
    (configContext as { PORTAL_BACKEND_ENDPOINT: string }).PORTAL_BACKEND_ENDPOINT = "";

    await expect(reportHealthy(MetricScenario.ApplicationLoad, Platform.Portal, "SQL")).rejects.toThrow(
      "baseUri is null or empty",
    );

    expect(mockFetchWithTimeout).not.toHaveBeenCalled();
    (configContext as { PORTAL_BACKEND_ENDPOINT: string }).PORTAL_BACKEND_ENDPOINT = original;
  });

  test("propagates fetch errors", async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error("Network error"));

    await expect(reportHealthy(MetricScenario.ApplicationLoad, Platform.Portal, "SQL")).rejects.toThrow(
      "Network error",
    );
  });

  test("propagates timeout errors", async () => {
    const abortError = new DOMException("The operation was aborted", "AbortError");
    mockFetchWithTimeout.mockRejectedValue(abortError);

    await expect(reportUnhealthy(MetricScenario.ApplicationLoad, Platform.Portal, "SQL")).rejects.toThrow(
      "The operation was aborted",
    );
  });
});
