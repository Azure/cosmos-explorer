// Metrics module: scenario metric emission logic.
import { MetricEvent, MetricScenario } from "Metrics/Constants";
import { createUri } from "../Common/UrlUtility";
import { configContext, Platform } from "../ConfigContext";
import { ApiType } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { fetchWithTimeout } from "../Utils/FetchWithTimeout";

const RELATIVE_PATH = "/api/dataexplorer/metrics/health"; // Endpoint retains 'health' for backend compatibility.

export const reportHealthy = (scenario: MetricScenario, platform: Platform, api: ApiType): Promise<Response> =>
  send({ platform, api, scenario, healthy: true });

export const reportUnhealthy = (scenario: MetricScenario, platform: Platform, api: ApiType): Promise<Response> =>
  send({ platform, api, scenario, healthy: false });

const send = async (event: MetricEvent): Promise<Response> => {
  const url = createUri(configContext?.PORTAL_BACKEND_ENDPOINT, RELATIVE_PATH);
  const authHeader = getAuthorizationHeader();

  return await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", [authHeader.header]: authHeader.token },
    body: JSON.stringify(event),
  });
};

export default MetricScenario;
