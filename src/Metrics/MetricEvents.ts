// Metrics module: scenario metric emission logic.
import { MetricEvent, MetricScenario } from "Metrics/Constants";
import { HttpHeaders } from "../Common/Constants";
import { createUri } from "../Common/UrlUtility";
import { configContext } from "../ConfigContext";
import { userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { fetchWithTimeout } from "../Utils/FetchWithTimeout";

const RELATIVE_PATH = "/api/dataexplorer/metrics/health"; // Endpoint retains 'health' for backend compatibility.

/** Send a full enriched MetricEvent to the backend. */
export const reportMetric = (event: MetricEvent): Promise<Response> => send(event);

const send = async (event: MetricEvent): Promise<Response> => {
  // Skip metrics emission during local development
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve(new Response(null, { status: 200 }));
  }

  const url = createUri(configContext?.PORTAL_BACKEND_ENDPOINT, RELATIVE_PATH);
  const authHeader = getAuthorizationHeader();

  return await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [authHeader.header]: authHeader.token,
      [HttpHeaders.sessionId]: userContext.sessionId,
    },
    body: JSON.stringify(event),
  });
};

export default MetricScenario;
