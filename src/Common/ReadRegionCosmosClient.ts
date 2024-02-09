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
import { EmulatorMasterKey, HttpHeaders } from "./Constants";
import { getErrorMessage } from "./ErrorHandlingUtils";

const _global = typeof self === "undefined" ? window : self;

export const tokenProvider2 = async (requestInfo: Cosmos.RequestInfo) => {
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

  const result = await getTokenFromAuthService2(verb, resourceType, resourceId);
  headers[HttpHeaders.msDate] = result.XDate;
  return decodeURIComponent(result.PrimaryReadWriteToken);
};

export const requestPlugin2: Cosmos.Plugin<any> = async (requestContext, diagnosticNode, next) => {
  requestContext.endpoint = new URL(configContext.PROXY_PATH, window.location.href).href;
  requestContext.headers["x-ms-proxy-target"] = endpoint2();
  console.log(`Client2 request context: ${JSON.stringify(requestContext)}`);
  return next(requestContext);
};

export const endpoint2 = () => {
  if (configContext.platform === Platform.Emulator) {
    // In worker scope, _global(self).parent does not exist
    const location = _global.parent ? _global.parent.location : _global.location;
    return configContext.EMULATOR_ENDPOINT || location.origin;
  }
  // return userContext.endpoint || userContext?.databaseAccount?.properties?.documentEndpoint;
  return "https://test-craig-nosql-periodic-eastus.documents.azure.com:443/";
};

export async function getTokenFromAuthService2(
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

let _client2: Cosmos.CosmosClient;

export function client2(): Cosmos.CosmosClient {
  console.log(`Called client2`);
  if (_client2) return _client2;

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

  const options: Cosmos.CosmosClientOptions = {
    endpoint: endpoint2() || "https://cosmos.azure.com", // CosmosClient gets upset if we pass a bad URL. This should never actually get called
    key: userContext.masterKey,
    tokenProvider: tokenProvider2,
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

  // Account details from userContext.
  // console.log(`userContext details: ${JSON.stringify(userContext)}`);
  // console.log(`userContext.databaseaccount details: ${JSON.stringify(userContext.databaseAccount)}`);
  console.log(
    `userContext?.databaseAccount?.properties?.documentEndpoint details: ${JSON.stringify(
      userContext?.databaseAccount?.properties?.documentEndpoint,
    )}`,
  );
  console.log(`userContext?.endpoint details: ${JSON.stringify(userContext?.endpoint)}`);
  // console.log(
  //   `userContext?.databaseAccount?.properties?.readLocations details: ${JSON.stringify(
  //     userContext?.databaseAccount?.properties?.readLocations,
  //   )}`,
  // );
  // console.log(
  //   `userContext?.databaseAccount?.properties?.writeLocations details: ${JSON.stringify(
  //     userContext?.databaseAccount?.properties?.writeLocations,
  //   )}`,
  // );

  if (configContext.PROXY_PATH !== undefined) {
    (options as any).plugins = [{ on: "request", plugin: requestPlugin2 }];
  }

  // if (PriorityBasedExecutionUtils.isFeatureEnabled()) {
  //   const plugins = (options as any).plugins || [];
  //   plugins.push({ on: "request", plugin: PriorityBasedExecutionUtils.requestPlugin });
  //   (options as any).plugins = plugins;
  // }

  _client2 = new Cosmos.CosmosClient(options);
  return _client2;
}
