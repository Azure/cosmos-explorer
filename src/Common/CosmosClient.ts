import * as Cosmos from "@azure/cosmos";
import { RequestInfo, setAuthorizationTokenHeaderUsingMasterKey } from "@azure/cosmos";
import { DatabaseAccount } from "../Contracts/DataModels";
import { HttpHeaders, EmulatorMasterKey } from "./Constants";
import { NotificationConsoleUtils } from "../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { config, Platform } from "../Config";

let _client: Cosmos.CosmosClient;
let _masterKey: string;
let _endpoint: string;
let _authorizationToken: string;
let _accessToken: string;
let _databaseAccount: DatabaseAccount;
let _subscriptionId: string;
let _resourceGroup: string;
let _resourceToken: string;

const _global = typeof self === "undefined" ? window : self;

export const tokenProvider = async (requestInfo: RequestInfo) => {
  const { verb, resourceId, resourceType, headers } = requestInfo;
  if (config.platform === Platform.Emulator) {
    // TODO Remove any. SDK expects a return value for tokenProvider, but we are mutating the header object instead.
    return setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, EmulatorMasterKey) as any;
  }

  if (_masterKey) {
    // TODO Remove any. SDK expects a return value for tokenProvider, but we are mutating the header object instead.
    return setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, _masterKey) as any;
  }

  if (_resourceToken) {
    return _resourceToken;
  }

  const result = await getTokenFromAuthService(verb, resourceType, resourceId);
  headers[HttpHeaders.msDate] = result.XDate;
  return decodeURIComponent(result.PrimaryReadWriteToken);
};

export const requestPlugin: Cosmos.Plugin<any> = async (requestContext, next) => {
  requestContext.endpoint = config.PROXY_PATH;
  requestContext.headers["x-ms-proxy-target"] = endpoint();
  return next(requestContext);
};

export const endpoint = () => {
  if (config.platform === Platform.Emulator) {
    return config.EMULATOR_ENDPOINT || window.parent.location.origin;
  }
  return _endpoint || (_databaseAccount && _databaseAccount.properties && _databaseAccount.properties.documentEndpoint);
};

export async function getTokenFromAuthService(verb: string, resourceType: string, resourceId?: string): Promise<any> {
  try {
    const host = config.BACKEND_ENDPOINT || _global.dataExplorer.extensionEndpoint();
    const response = await _global.fetch(host + "/api/guest/runtimeproxy/authorizationTokens", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ms-encrypted-auth-token": _accessToken
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
    NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.Error,
      `Failed to get authorization headers for ${resourceType}: ${JSON.stringify(error)}`
    );
    return Promise.reject(error);
  }
}

export const CosmosClient = {
  client(): Cosmos.CosmosClient {
    if (_client) {
      return _client;
    }
    const options: Cosmos.CosmosClientOptions = {
      endpoint: endpoint() || " ", // CosmosClient gets upset if we pass a falsy value here
      key: _masterKey,
      tokenProvider,
      connectionPolicy: {
        enableEndpointDiscovery: false
      },
      userAgentSuffix: "Azure Portal"
    };

    // In development we proxy requests to the backend via webpack. This is removed in production bundles.
    if (process.env.NODE_ENV === "development") {
      (options as any).plugins = [{ on: "request", plugin: requestPlugin }];
    }
    _client = new Cosmos.CosmosClient(options);
    return _client;
  },

  authorizationToken(value?: string): string {
    if (typeof value === "undefined") {
      return _authorizationToken;
    }
    _authorizationToken = value;
    _client = null;
    return value;
  },

  accessToken(value?: string): string {
    if (typeof value === "undefined") {
      return _accessToken;
    }
    _accessToken = value;
    _client = null;
    return value;
  },

  masterKey(value?: string): string {
    if (typeof value === "undefined") {
      return _masterKey;
    }
    _client = null;
    _masterKey = value;
    return value;
  },

  endpoint(value?: string): string {
    if (typeof value === "undefined") {
      return _endpoint;
    }
    _client = null;
    _endpoint = value;
    return value;
  },

  databaseAccount(value?: DatabaseAccount): DatabaseAccount {
    if (typeof value === "undefined") {
      return _databaseAccount || ({} as any);
    }
    _client = null;
    _databaseAccount = value;
    return value;
  },

  subscriptionId(value?: string): string {
    if (typeof value === "undefined") {
      return _subscriptionId;
    }
    _client = null;
    _subscriptionId = value;
    return value;
  },

  resourceGroup(value?: string): string {
    if (typeof value === "undefined") {
      return _resourceGroup;
    }
    _client = null;
    _resourceGroup = value;
    return value;
  },

  resourceToken(value?: string): string {
    if (typeof value === "undefined") {
      return _resourceToken;
    }
    _client = null;
    _resourceToken = value;
    return value;
  }
};
