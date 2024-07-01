import * as Cosmos from "@azure/cosmos";
import { getAuthorizationTokenUsingResourceTokens } from "Common/getAuthorizationTokenUsingResourceTokens";
import { AuthorizationToken } from "Contracts/FabricMessageTypes";
import { checkDatabaseResourceTokensValidity } from "Platform/Fabric/FabricUtil";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { listKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { DatabaseAccountListKeysResult } from "Utils/arm/generatedClients/cosmos/types";
import { AuthType } from "../AuthType";
import { PriorityLevel } from "../Common/Constants";
import { Platform, configContext } from "../ConfigContext";
import { updateUserContext, userContext } from "../UserContext";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import * as PriorityBasedExecutionUtils from "../Utils/PriorityBasedExecutionUtils";
import { EmulatorMasterKey, HttpHeaders } from "./Constants";
import { getErrorMessage } from "./ErrorHandlingUtils";

const _global = typeof self === "undefined" ? window : self;

export const tokenProvider = async (requestInfo: Cosmos.RequestInfo) => {
  const { verb, resourceId, resourceType, headers } = requestInfo;

  const aadDataPlaneFeatureEnabled =
    userContext.features.enableAadDataPlane && userContext.databaseAccount.properties.disableLocalAuth;
  const dataPlaneRBACOptionEnabled = userContext.dataPlaneRbacEnabled && userContext.apiType === "SQL";
  if (aadDataPlaneFeatureEnabled || (!userContext.features.enableAadDataPlane && dataPlaneRBACOptionEnabled)) {
    if (!userContext.aadToken) {
      logConsoleError(
        `AAD token does not exist. Please use "Login for Entra ID" prior to performing Entra ID RBAC operations`,
      );
      return null;
    }
    const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
    const authorizationToken = `${AUTH_PREFIX}${userContext.aadToken}`;
    console.log(`Returning Auth token`);
    return authorizationToken;
  }

  if ((userContext.dataPlaneRbacEnabled) && userContext.authorizationToken) {
    console.log(` Getting Portal Auth token `)
    const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
    const authorizationToken = `${AUTH_PREFIX}${userContext.authorizationToken}`;
    console.log(`Returning Portal Auth token`);
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
        // For now, these operations aren't used, so fetching the authorization token is commented out.
        // This provider must return a real token to pass validation by the client, so we return the cached resource token
        // (which is a valid token, but won't work for these operations).
        const resourceTokens2 = userContext.fabricContext.databaseConnectionInfo.resourceTokens;
        return getAuthorizationTokenUsingResourceTokens(resourceTokens2, requestInfo.path, requestInfo.resourceId);

      /* ************** TODO: Uncomment this code if we need to support these operations **************
      // User master tokens
      const authorizationToken = await sendCachedDataMessage<AuthorizationToken>(
        FabricMessageTypes.GetAuthorizationToken,
        [requestInfo],
        userContext.fabricContext.connectionId,
      );
      console.log("Response from Fabric: ", authorizationToken);
      headers[HttpHeaders.msDate] = authorizationToken.XDate;
      return decodeURIComponent(authorizationToken.PrimaryReadWriteToken);
       ***********************************************************************************************/
    }
  }

  if (userContext.masterKey) {
    // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
    await Cosmos.setAuthorizationTokenHeaderUsingMasterKey(
      verb,
      resourceId,
      resourceType,
      headers,
      userContext.masterKey,
    );
    return decodeURIComponent(headers.authorization);
  } else if (userContext.dataPlaneRbacEnabled == false) {
    const { databaseAccount: account, subscriptionId, resourceGroup } = userContext;
    const keys: DatabaseAccountListKeysResult = await listKeys(subscriptionId, resourceGroup, account.name);

    if (keys.primaryMasterKey) {
      updateUserContext({ masterKey: keys.primaryMasterKey });
      // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
      await Cosmos.setAuthorizationTokenHeaderUsingMasterKey(
        verb,
        resourceId,
        resourceType,
        headers,
        keys.primaryMasterKey,
      );
      return decodeURIComponent(headers.authorization);
    }
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

  const options: Cosmos.CosmosClientOptions = {
    endpoint: endpoint() || "https://cosmos.azure.com", // CosmosClient gets upset if we pass a bad URL. This should never actually get called
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
  return _client;
}
