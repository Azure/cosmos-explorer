import { configContext } from "ConfigContext";
import { FeatureRegistration } from "Contracts/DataModels";
import { AuthorizationTokenHeaderMetadata } from "Contracts/ViewModels";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { traceFailure, traceStart, traceSuccess } from "Shared/Telemetry/TelemetryProcessor";
import { getAuthorizationHeader } from "Utils/AuthorizationUtils";

export const featureRegistered = async (subscriptionId: string, feature: string) => {
  const api_version = "2021-07-01";
  const url = `${configContext.ARM_ENDPOINT}/subscriptions/${subscriptionId}/providers/Microsoft.Features/featureProviders/Microsoft.DocumentDB/subscriptionFeatureRegistrations/${feature}?api-version=${api_version}`;
  const authorizationHeader: AuthorizationTokenHeaderMetadata = getAuthorizationHeader();
  const headers = { [authorizationHeader.header]: authorizationHeader.token };

  const startKey = traceStart(Action.CheckFeatureRegistration, {
    feature,
  });
  let response;

  try {
    response = await _fetchWithTimeout(url, headers);
  } catch (error) {
    traceFailure(Action.CheckFeatureRegistration, { feature, error: String(error) }, startKey);
    return false;
  }

  if (!response?.ok) {
    traceFailure(Action.CheckFeatureRegistration, { feature, status: response?.status }, startKey);
    return false;
  }

  const featureRegistration = (await response?.json()) as FeatureRegistration;
  const registered = featureRegistration?.properties?.state === "Registered";
  traceSuccess(Action.CheckFeatureRegistration, { feature, registered }, startKey);
  return registered;
};

async function _fetchWithTimeout(
  url: string,
  headers: {
    [x: string]: string;
  },
) {
  const timeout = 10000;
  const options = { timeout };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await window.fetch(url, {
    headers,
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
}
