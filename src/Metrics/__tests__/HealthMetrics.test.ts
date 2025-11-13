import { configContext, Platform } from "../../ConfigContext";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import HealthMetricScenario, { reportHealthy, reportUnhealthy } from "../HealthMetrics";

jest.mock("../../Utils/AuthorizationUtils", () => ({
  getAuthorizationHeader: jest.fn().mockReturnValue({ header: "authorization", token: "Bearer test-token" }),
}));

describe("HealthMetrics", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch as typeof global.fetch;
    jest.restoreAllMocks();
  });

  test("reportHealthy success includes auth header", async () => {
    const mockResponse = new Response(null, { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    const result = await reportHealthy(HealthMetricScenario.ApplicationLoad, Platform.Portal, "SQL");
    expect(result).toBeInstanceOf(Response);
    expect(result?.ok).toBe(true);
    expect(result?.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].headers.authorization).toBe("Bearer test-token");
    const body = JSON.parse(callArgs[1].body);
    expect(body.browserProfile).toBeUndefined();
    expect(getAuthorizationHeader).toHaveBeenCalled();
  });

  test("reportUnhealthy failure status", async () => {
    const mockResponse = new Response("Failure", { status: 500 });
    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    const result = await reportUnhealthy(HealthMetricScenario.ApplicationLoad, Platform.Portal, "SQL");
    expect(result).toBeInstanceOf(Response);
    expect(result?.ok).toBe(false);
    expect(result?.status).toBe(500);
  });

  test("helpers healthy/unhealthy", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 201 }));
    const healthyResult = await reportHealthy(HealthMetricScenario.ApplicationLoad, Platform.Portal, "SQL");
    const unhealthyResult = await reportUnhealthy(HealthMetricScenario.ApplicationLoad, Platform.Portal, "SQL");
    expect(healthyResult?.status).toBe(201);
    expect(unhealthyResult?.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("skips when backend endpoint missing", async () => {
    const original = configContext.PORTAL_BACKEND_ENDPOINT;
    (configContext as { PORTAL_BACKEND_ENDPOINT: string }).PORTAL_BACKEND_ENDPOINT = ""; // simulate missing
    global.fetch = jest.fn();
    const result = await reportHealthy(HealthMetricScenario.ApplicationLoad, Platform.Portal, "SQL");
    expect(result).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
    (configContext as { PORTAL_BACKEND_ENDPOINT: string }).PORTAL_BACKEND_ENDPOINT = original; // restore
  });
});
