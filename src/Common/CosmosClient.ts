import * as Cosmos from "@azure/cosmos";
import { RequestInfo, setAuthorizationTokenHeaderUsingMasterKey } from "@azure/cosmos";
import { configContext, Platform } from "../ConfigContext";
import { getErrorMessage } from "./ErrorHandlingUtils";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import { EmulatorMasterKey, HttpHeaders } from "./Constants";
import { userContext } from "../UserContext";

const _global = typeof self === "undefined" ? window : self;

export const tokenProvider = async (requestInfo: RequestInfo) => {
  const { verb, resourceId, resourceType, headers } = requestInfo;
  if (configContext.platform === Platform.Emulator) {
    // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
    await setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, EmulatorMasterKey);
    return decodeURIComponent(headers.authorization);
  }

  if (userContext.masterKey) {
    // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
    await setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, EmulatorMasterKey);
    return decodeURIComponent(headers.authorization);
  }

  if (userContext.resourceToken) {
    return userContext.resourceToken;
  }

  const result = await getTokenFromAuthService(verb, resourceType, resourceId);
  headers[HttpHeaders.msDate] = result.XDate;
  return decodeURIComponent(result.PrimaryReadWriteToken);
};

export const requestPlugin: Cosmos.Plugin<any> = async (requestContext, next) => {
  requestContext.endpoint = configContext.PROXY_PATH;
  requestContext.headers["x-ms-proxy-target"] = endpoint();
  return next(requestContext);
};

export const endpoint = () => {
  if (configContext.platform === Platform.Emulator) {
    // In worker scope, _global(self).parent does not exist
    const location = _global.parent ? _global.parent.location : _global.location;
    return configContext.EMULATOR_ENDPOINT || location.origin;
  }
  return (
    userContext.endpoint ||
    (userContext.databaseAccount &&
      userContext.databaseAccount.properties &&
      userContext.databaseAccount.properties.documentEndpoint)
  );
};

export async function getTokenFromAuthService(verb: string, resourceType: string, resourceId?: string): Promise<any> {
  try {
    const host = configContext.BACKEND_ENDPOINT;
    const response = await _global.fetch(host + "/api/guest/runtimeproxy/authorizationTokens", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ms-encrypted-auth-token": userContext.accessToken
      },
      body: JSON.stringify({
        verb,
        resourceType,
        resourceId
      })
    });
    //TODO I am not sure why we have to parse the JSON again here. fetch should do it for us when we call .json()
    const result = JSON.parse(await response.json());
    return result;
  } catch (error) {
    logConsoleError(`Failed to get authorization headers for ${resourceType}: ${getErrorMessage(error)}`);
    return Promise.reject(error);
  }
}

export function client(): Cosmos.CosmosClient {
  const options: Cosmos.CosmosClientOptions = {
    endpoint: endpoint() || "https://cosmos.azure.com", // CosmosClient gets upset if we pass a bad URL. This should never actually get called
    key: userContext.masterKey,
    tokenProvider,
    connectionPolicy: {
      enableEndpointDiscovery: false
    },
    userAgentSuffix: "Azure Portal"
  };

  if (configContext.PROXY_PATH !== undefined) {
    (options as any).plugins = [{ on: "request", plugin: requestPlugin }];
  }
  return new Cosmos.CosmosClient(options);
}
