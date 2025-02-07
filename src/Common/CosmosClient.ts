import * as Cosmos from "@azure/cosmos";
import { getAuthorizationTokenUsingResourceTokens } from "Common/getAuthorizationTokenUsingResourceTokens";
import { CosmosDbArtifactType } from "Contracts/FabricMessagesContract";
import { AuthorizationToken } from "Contracts/FabricMessageTypes";
import { checkDatabaseResourceTokensValidity, isFabricMirroredKey } from "Platform/Fabric/FabricUtil";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { AuthType } from "../AuthType";
import { PriorityLevel } from "../Common/Constants";
import * as Logger from "../Common/Logger";
import { Platform, configContext } from "../ConfigContext";
import { FabricArtifactInfo, updateUserContext, userContext } from "../UserContext";
import { isDataplaneRbacSupported } from "../Utils/APITypeUtils";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import * as PriorityBasedExecutionUtils from "../Utils/PriorityBasedExecutionUtils";
import { EmulatorMasterKey, HttpHeaders } from "./Constants";
import { getErrorMessage } from "./ErrorHandlingUtils";

const _global = typeof self === "undefined" ? window : self;

export const tokenProvider = async (requestInfo: Cosmos.RequestInfo) => {
  const { verb, resourceId, resourceType, headers } = requestInfo;

  const dataPlaneRBACOptionEnabled = userContext.dataPlaneRbacEnabled && isDataplaneRbacSupported(userContext.apiType);
  if (userContext.features.enableAadDataPlane || dataPlaneRBACOptionEnabled) {
    Logger.logInfo(
      `AAD Data Plane Feature flag set to ${userContext.features.enableAadDataPlane} for account with disable local auth ${userContext.databaseAccount.properties.disableLocalAuth} `,
      "Explorer/tokenProvider",
    );
    if (!userContext.aadToken) {
      logConsoleError(
        `AAD token does not exist. Please use the "Login for Entra ID" button in the Toolbar prior to performing Entra ID RBAC operations`,
      );
      return null;
    }
    const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
    const authorizationToken = `${AUTH_PREFIX}${userContext.aadToken}`;
    return authorizationToken;
  }

  if (configContext.platform === Platform.Emulator) {
    // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
    await Cosmos.setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, EmulatorMasterKey);
    return decodeURIComponent(headers.authorization);
  }

  if (isFabricMirroredKey()) {
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
        const resourceTokens = (
          userContext.fabricContext.artifactInfo as FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY]
        ).resourceTokenInfo.resourceTokens;
        checkDatabaseResourceTokensValidity(
          (userContext.fabricContext.artifactInfo as FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY])
            .resourceTokenInfo.resourceTokensTimestamp,
        );
        return getAuthorizationTokenUsingResourceTokens(resourceTokens, requestInfo.path, requestInfo.resourceId);

      case Cosmos.ResourceType.none:
      case Cosmos.ResourceType.database:
      case Cosmos.ResourceType.offer:
      case Cosmos.ResourceType.user:
      case Cosmos.ResourceType.permission:
        // For now, these operations aren't used, so fetching the authorization token is commented out.
        // This provider must return a real token to pass validation by the client, so we return the cached resource token
        // (which is a valid token, but won't work for these operations).
        const resourceTokens2 = (
          userContext.fabricContext.artifactInfo as FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY]
        ).resourceTokenInfo.resourceTokens;
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
    Logger.logInfo(`Master Key exists`, "Explorer/tokenProvider");
    // TODO This SDK method mutates the headers object. Find a better one or fix the SDK.
    await Cosmos.setAuthorizationTokenHeaderUsingMasterKey(
      verb,
      resourceId,
      resourceType,
      headers,
      userContext.masterKey,
    );
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
  try {
    return await next(requestContext);
  } catch (error) {
    throw {
      code: error?.code || undefined,
      message: error.message,
    };
  }
};

export const endpoint = () => {
  if (configContext.platform === Platform.Emulator) {
    // In worker scope, _global(self).parent does not exist
    const location = _global.parent ? _global.parent.location : _global.location;
    return configContext.EMULATOR_ENDPOINT || location.origin;
  }
  return (
    userContext.selectedRegionalEndpoint ||
    userContext.endpoint ||
    userContext?.databaseAccount?.properties?.documentEndpoint
  );
};

export async function getTokenFromAuthService(
  verb: string,
  resourceType: string,
  resourceId?: string,
): Promise<AuthorizationToken> {
  try {
    const host: string = configContext.PORTAL_BACKEND_ENDPOINT;
    const response: Response = await _global.fetch(host + "/api/connectionstring/runtimeproxy/authorizationtokens", {
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
    const result: AuthorizationToken = await response.json();
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
  console.log(`Client Call`);
  console.log(`Client Call: userContext.refreshCosmosClient: ${userContext.refreshCosmosClient}`);
  if (_client) {
    if (!userContext.refreshCosmosClient) {
      return _client;
    }
    _client.dispose();
    _client = null;
  }

  if (userContext.refreshCosmosClient) {
    updateUserContext({
      refreshCosmosClient: false,
    });
  }

  let _defaultHeaders: Cosmos.CosmosHeaders = {};

  _defaultHeaders["x-ms-cosmos-sdk-supportedcapabilities"] =
    SDKSupportedCapabilities.None | SDKSupportedCapabilities.PartitionMerge;
  _defaultHeaders["x-ms-cosmos-throughput-bucket"] = 1;

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
  // Used to check current client region configuration.
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
    console.log(
      `Current userContext.selectedRegionalEndpoint: ${JSON.stringify(userContext?.selectedRegionalEndpoint)}`,
    );
  }

  const options: Cosmos.CosmosClientOptions = {
    endpoint: endpoint() || "https://cosmos.azure.com", // CosmosClient gets upset if we pass a bad URL. This should never actually get called
    key: userContext.dataPlaneRbacEnabled ? "" : userContext.masterKey,
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
