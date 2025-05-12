import { configContext } from "ConfigContext";
import { FeatureRegistration } from "Contracts/DataModels";
import { AuthorizationTokenHeaderMetadata } from "Contracts/ViewModels";
import { getAuthorizationHeader } from "Utils/AuthorizationUtils";

export const featureRegistered = async (subscriptionId: string, feature: string) => {
  const api_version = "2021-07-01";
  const url = `${configContext.ARM_ENDPOINT}/subscriptions/${subscriptionId}/providers/Microsoft.Features/featureProviders/Microsoft.DocumentDB/subscriptionFeatureRegistrations/${feature}?api-version=${api_version}`;
  const authorizationHeader: AuthorizationTokenHeaderMetadata = getAuthorizationHeader();
  const headers = { [authorizationHeader.header]: authorizationHeader.token };

  let response;

  try {
    response = await _fetchWithTimeout(url, headers);
  } catch (error) {
    return false;
  }

  if (!response?.ok) {
    return false;
  }

  const featureRegistration = (await response?.json()) as FeatureRegistration;
  return featureRegistration?.properties?.state === "Registered";
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
