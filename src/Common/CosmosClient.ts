import * as Cosmos from "@azure/cosmos";
import { sendCachedDataMessage } from "Common/MessageHandler";
import { getAuthorizationTokenUsingResourceTokens } from "Common/getAuthorizationTokenUsingResourceTokens";
import { AuthorizationToken, MessageTypes } from "Contracts/MessageTypes";
import { checkDatabaseResourceTokensValidity } from "Platform/Fabric/FabricUtil";
// import * as dns from 'dns';
import { AuthType } from "../AuthType";
import { PriorityLevel } from "../Common/Constants";
import { Platform, configContext } from "../ConfigContext";
import { userContext } from "../UserContext";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import * as PriorityBasedExecutionUtils from "../Utils/PriorityBasedExecutionUtils";
import { EmulatorMasterKey, HttpHeaders } from "./Constants";
import { getErrorMessage } from "./ErrorHandlingUtils";

const _global = typeof self === "undefined" ? window : self;

export const tokenProvider = async (requestInfo: Cosmos.RequestInfo) => {
  const { verb, resourceId, resourceType, headers } = requestInfo;

  if (userContext.features.enableAadDataPlane && userContext.aadToken) {
    const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
    const authorizationToken = `${AUTH_PREFIX}${userContext.aadToken}`;
    return authorizationToken;
  }

  if (configContext.platform === Platform.Emulator) {
    // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
    await Cosmos.setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, EmulatorMasterKey);
    return decodeURIComponent(headers.authorization);
  }

  if (configContext.platform === Platform.Fabric) {
    switch (requestInfo.resourceType) {
      case Cosmos.ResourceType.conflicts:
      case Cosmos.ResourceType.container:
      case Cosmos.ResourceType.sproc:
      case Cosmos.ResourceType.udf:
      case Cosmos.ResourceType.trigger:
      case Cosmos.ResourceType.item:
      case Cosmos.ResourceType.pkranges:
        // User resource tokens
        headers[HttpHeaders.msDate] = new Date().toUTCString();
        const resourceTokens = userContext.fabricDatabaseConnectionInfo.resourceTokens;
        checkDatabaseResourceTokensValidity(userContext.fabricDatabaseConnectionInfo.resourceTokensTimestamp);
        return getAuthorizationTokenUsingResourceTokens(resourceTokens, requestInfo.path, requestInfo.resourceId);

      case Cosmos.ResourceType.none:
      case Cosmos.ResourceType.database:
      case Cosmos.ResourceType.offer:
      case Cosmos.ResourceType.user:
      case Cosmos.ResourceType.permission:
        // User master tokens
        const authorizationToken = await sendCachedDataMessage<AuthorizationToken>(MessageTypes.GetAuthorizationToken, [
          requestInfo,
        ]);
        console.log("Response from Fabric: ", authorizationToken);
        headers[HttpHeaders.msDate] = authorizationToken.XDate;
        return decodeURIComponent(authorizationToken.PrimaryReadWriteToken);
    }
  }

  if (userContext.masterKey) {
    // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
    await Cosmos.setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, EmulatorMasterKey);
    return decodeURIComponent(headers.authorization);
  }

  if (userContext.resourceToken) {
    return userContext.resourceToken;
  }

  const result = await getTokenFromAuthService(verb, resourceType, resourceId);
  headers[HttpHeaders.msDate] = result.XDate;
  return decodeURIComponent(result.PrimaryReadWriteToken);
};

export const requestPlugin: Cosmos.Plugin<any> = async (requestContext, diagnosticNode, next) => {
  requestContext.endpoint = new URL(configContext.PROXY_PATH, window.location.href).href;
  console.log(`REQUEST CONTEXT ENDPOINT: ${JSON.stringify(requestContext.endpoint)}`);
  requestContext.headers["x-ms-proxy-target"] = endpoint();
  console.log(`REQUEST CONTEXT PROXY: ${JSON.stringify(requestContext.headers["x-ms-proxy-target"])}`);
  return next(requestContext);
};

export const endpoint = () => {
  if (configContext.platform === Platform.Emulator) {
    // In worker scope, _global(self).parent does not exist
    const location = _global.parent ? _global.parent.location : _global.location;
    return configContext.EMULATOR_ENDPOINT || location.origin;
  }
  // TODO: Add logic here to go through and possibly select a different endpoint from those available.
  // TODO: Will need flag to set write enabled.
  // If user is going to connect to an account with primary region down, need to connect directly to document service
  // with regional endpoint.
  return userContext.endpoint || userContext?.databaseAccount?.properties?.documentEndpoint;
};

export async function getTokenFromAuthService(
  verb: string,
  resourceType: string,
  resourceId?: string,
): Promise<AuthorizationToken> {
  try {
    const host = configContext.BACKEND_ENDPOINT;
    const response = await _global.fetch(host + "/api/guest/runtimeproxy/authorizationTokens", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ms-encrypted-auth-token": userContext.accessToken,
      },
      body: JSON.stringify({
        verb,
        resourceType,
        resourceId,
      }),
    });
    //TODO I am not sure why we have to parse the JSON again here. fetch should do it for us when we call .json()
    const result = JSON.parse(await response.json());
    return result;
  } catch (error) {
    logConsoleError(`Failed to get authorization headers for ${resourceType}: ${getErrorMessage(error)}`);
    return Promise.reject(error);
  }
}

// The Capability is a bitmap, which cosmosdb backend decodes as per the below enum
enum SDKSupportedCapabilities {
  None = 0,
  PartitionMerge = 1 << 0,
}

let _client: Cosmos.CosmosClient;

export function client(): Cosmos.CosmosClient {
  if (_client) return _client;

  console.log(`Creating new client.......`);

  let _defaultHeaders: Cosmos.CosmosHeaders = {};
  _defaultHeaders["x-ms-cosmos-sdk-supportedcapabilities"] =
    SDKSupportedCapabilities.None | SDKSupportedCapabilities.PartitionMerge;

  if (
    userContext.authType === AuthType.ConnectionString ||
    userContext.authType === AuthType.EncryptedToken ||
    userContext.authType === AuthType.ResourceToken
  ) {
    // Default to low priority. Needed for non-AAD-auth scenarios
    // where we cannot use RP API, and thus, cannot detect whether priority
    // based execution is enabled.
    // The header will be ignored if priority based execution is disabled on the account.
    _defaultHeaders["x-ms-cosmos-priority-level"] = PriorityLevel.Default;
  }

  // Parsing out endpoint from diagnostics.  Used to find address I need to add to firewall rule.
  function parseEndpointFromDiag(json: string): string {
    const suffix: string = ".documents.azure.com";
    const start: number = json.indexOf("//") + "//".length;
    const end: number = json.indexOf(suffix) + suffix.length;
    const endpoint: string = json.substring(start, end);

    return endpoint;
  }

  async function fetchConnectedRegions(client: Cosmos.CosmosClient) {
    // Check currently connected regions.
    try {
      const someMoreThings = await client.databases.readAll().fetchAll();
      console.log(`Current list of databases: ${JSON.stringify(someMoreThings)}`);
      const currentReadRegion = await client.getReadEndpoint();
      console.log(`Current read endpoint: ${JSON.stringify(currentReadRegion)}`);
      const currentReadRegions = await client.getReadEndpoints();
      console.log(`Current account endpoints: ${JSON.stringify(currentReadRegions)}`);
      // Getting primary region IP that needs to be blocked.
      // retrieve the regional endpoint of the account
      const regionalWriteEndpoint = await client.getWriteEndpoint();
      console.log(`Current write endpoint: ${JSON.stringify(regionalWriteEndpoint)}`);
      const parsedWriteEndpoint = parseEndpointFromDiag(JSON.stringify(regionalWriteEndpoint));
      console.log(`Current parsed write endpoint: ${JSON.stringify(parsedWriteEndpoint)}`);
      // const writeHostAddress = await findHostAddress(parsedWriteEndpoint);
      // console.log(`Current write host address: ${JSON.stringify(writeHostAddress)}`);
    } catch (error) {
      console.error("Error getting read endpoints:", error);
    }

    const currentWriteRegion = await client.getWriteEndpoint();
    console.log(`Current write endpoint: ${JSON.stringify(currentWriteRegion)}`);
  }

  const options: Cosmos.CosmosClientOptions = {
    endpoint: endpoint() || "https://cosmos.azure.com", // CosmosClient gets upset if we pass a bad URL. This should never actually get called
    // endpoint: "https://test-craig-nosql-periodic-eastus.documents.azure.com:443",
    key: userContext.masterKey,
    tokenProvider,
    connectionPolicy: {
      enableEndpointDiscovery: true,
      preferredLocations: ["East US", "Central US"],
      connectionMode: Cosmos.ConnectionMode.Gateway,
      enableBackgroundEndpointRefreshing: true,
      endpointRefreshRateInMs: 5000,
    },
    userAgentSuffix: "Azure Portal",
    defaultHeaders: _defaultHeaders,
  };

  // Account details from userContext.
  console.log(`userContext details: ${JSON.stringify(userContext)}`);
  console.log(`userContext.databaseaccount details: ${JSON.stringify(userContext.databaseAccount)}`);
  console.log(
    `userContext?.databaseAccount?.properties?.documentEndpoint details: ${JSON.stringify(
      userContext?.databaseAccount?.properties?.documentEndpoint,
    )}`,
  );
  console.log(
    `userContext?.databaseAccount?.properties?.readLocations details: ${JSON.stringify(
      userContext?.databaseAccount?.properties?.readLocations,
    )}`,
  );
  console.log(
    `userContext?.databaseAccount?.properties?.writeLocations details: ${JSON.stringify(
      userContext?.databaseAccount?.properties?.writeLocations,
    )}`,
  );

  // The proxy path is added as part of the dev environment.
  // This is what is used to route all requests back to the global endpoint.
  // In order for local page running in browser to make cross-origin requests to the Cosmos DB backend.
  if (configContext.PROXY_PATH !== undefined) {
    (options as any).plugins = [{ on: "request", plugin: requestPlugin }];
  }

  if (PriorityBasedExecutionUtils.isFeatureEnabled()) {
    const plugins = (options as any).plugins || [];
    plugins.push({ on: "request", plugin: PriorityBasedExecutionUtils.requestPlugin });
    (options as any).plugins = plugins;
  }

  _client = new Cosmos.CosmosClient(options);

  // Log debug vals
  fetchConnectedRegions(_client).catch((error) => console.error(error));

  return _client;
}
