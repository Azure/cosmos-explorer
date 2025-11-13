// Metrics module: health metric emission logic.
import { HealthMetricEvent, HealthMetricScenario } from "Metrics/Constants";
import { createUri } from "../Common/UrlUtility";
import { configContext, Platform } from "../ConfigContext";
import { trackEvent, trackTrace } from "../Shared/appInsights";
import { ApiType } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { fetchWithTimeout } from "../Utils/FetchWithTimeout";

const RELATIVE_PATH = "/api/dataexplorer/metrics/health";

export const reportHealthy = (
  scenario: HealthMetricScenario,
  platform: Platform,
  api: ApiType,
): Promise<Response | undefined> => send({ platform, api, scenario, healthy: true });

export const reportUnhealthy = (
  scenario: HealthMetricScenario,
  platform: Platform,
  api: ApiType,
): Promise<Response | undefined> => send({ platform, api, scenario, healthy: false });

const send = async (event: HealthMetricEvent): Promise<Response | undefined> => {
  const url = createUri(configContext?.PORTAL_BACKEND_ENDPOINT, RELATIVE_PATH);
  const authHeader = getAuthorizationHeader();

  try {
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", [authHeader.header]: authHeader.token },
      body: JSON.stringify(event),
    });

    trackEvent(
      { name: "HealthMetric" },
      {
        status: response.status.toString(),
        healthy: event.healthy.toString(),
        scenario: event.scenario,
        platform: event.platform,
        api: event.api,
      },
    );
    return response;
  } catch (err: unknown) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    const errorMessage = isAbort ? "timeout" : err instanceof Error ? err.message : "unknown";
    trackTrace({ message: `HealthMetric exception: ${errorMessage}` });
    return undefined;
  }
};

export default HealthMetricScenario;
