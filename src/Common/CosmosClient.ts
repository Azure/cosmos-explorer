import * as Cosmos from "@azure/cosmos";
import { sendCachedDataMessage } from "Common/MessageHandler";
import { getAuthorizationTokenUsingResourceTokens } from "Common/getAuthorizationTokenUsingResourceTokens";
import { AuthorizationToken, MessageTypes } from "Contracts/MessageTypes";
import { checkDatabaseResourceTokensValidity } from "Platform/Fabric/FabricUtil";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
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
        // TODO userContext.fabricContext.databaseConnectionInfo can be undefined
        headers[HttpHeaders.msDate] = new Date().toUTCString();
        const resourceTokens = userContext.fabricContext.databaseConnectionInfo.resourceTokens;
        checkDatabaseResourceTokensValidity(userContext.fabricContext.databaseConnectionInfo.resourceTokensTimestamp);
        return getAuthorizationTokenUsingResourceTokens(resourceTokens, requestInfo.path, requestInfo.resourceId);

      case Cosmos.ResourceType.none:
      case Cosmos.ResourceType.database:
      case Cosmos.ResourceType.offer:
      case Cosmos.ResourceType.user:
      case Cosmos.ResourceType.permission:
        // User master tokens
        const authorizationToken = await sendCachedDataMessage<AuthorizationToken>(
          MessageTypes.GetAuthorizationToken,
          [requestInfo],
          userContext.fabricContext.connectionId,
        );
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
  requestContext.headers["x-ms-proxy-target"] = endpoint();
  return next(requestContext);
};

export const endpoint = () => {
  if (configContext.platform === Platform.Emulator) {
    // In worker scope, _global(self).parent does not exist
    const location = _global.parent ? _global.parent.location : _global.location;
    return configContext.EMULATOR_ENDPOINT || location.origin;
  }
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

  // find the ip address associated with the endpoint
  function findHostAddress(endpoint: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Extract hostname from endpoint
      const hostname = new URL(endpoint).hostname;

      // Use dns.lookup to find the IP address
      dns.lookup(hostname, (err, address) => {
        if (err) {
          reject(err);
        } else {
          resolve(address);
        }
      });
    });
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
      const writeHostAddress = await findHostAddress(parsedWriteEndpoint);
      console.log(`Current write host address: ${JSON.stringify(writeHostAddress)}`);
    } catch (error) {
      console.error("Error getting read endpoints:", error);
    }

    const currentWriteRegion = await client.getWriteEndpoint();
    console.log(`Current write endpoint: ${JSON.stringify(currentWriteRegion)}`);
  }

  const options: Cosmos.CosmosClientOptions = {
    endpoint: endpoint() || "https://cosmos.azure.com", // CosmosClient gets upset if we pass a bad URL. This should never actually get called
    key: userContext.masterKey,
    tokenProvider,
    userAgentSuffix: "Azure Portal",
    defaultHeaders: _defaultHeaders,
    connectionPolicy: {
      retryOptions: {
        maxRetryAttemptCount: LocalStorageUtility.getEntryNumber(StorageKey.RetryAttempts),
        fixedRetryIntervalInMilliseconds: LocalStorageUtility.getEntryNumber(StorageKey.RetryInterval),
        maxWaitTimeInSeconds: LocalStorageUtility.getEntryNumber(StorageKey.MaxWaitTimeInSeconds),
      },
    },
  };

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
