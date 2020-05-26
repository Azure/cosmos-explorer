import * as Constants from "../../Common/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import AuthHeadersUtil from "./Authorization";
import HostedExplorerFactory from "./ExplorerFactory";
import Q from "q";
import {
  AccessInputMetadata,
  AccountKeys,
  ApiKind,
  DatabaseAccount,
  GenerateTokenResponse,
  resourceTokenConnectionStringProperties
} from "../../Contracts/DataModels";
import { AuthType } from "../../AuthType";
import { CollectionCreation } from "../../Shared/Constants";
import { isInvalidParentFrameOrigin } from "../../Utils/MessageValidation";
import { CosmosClient } from "../../Common/CosmosClient";
import { DataExplorerInputsFrame } from "../../Contracts/ViewModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { HostedUtils } from "./HostedUtils";
import { MessageHandler } from "../../Common/MessageHandler";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { SessionStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import { SubscriptionUtilMappings } from "../../Shared/Constants";
import "../../Explorer/Tables/DataTable/DataTableBindingManager";

export default class Main {
  private static _databaseAccountId: string;
  private static _encryptedToken: string;
  private static _accessInputMetadata: AccessInputMetadata;
  private static _defaultSubscriptionType: ViewModels.SubscriptionType = ViewModels.SubscriptionType.Free;
  private static _features: { [key: string]: string };
  // For AAD, Need to post message to hosted frame to do the auth
  // Use local deferred variable as work around until we find better solution
  private static _getAadAccessDeferred: Q.Deferred<ViewModels.Explorer>;
  private static _explorer: ViewModels.Explorer;

  public static isUsingEncryptionToken(): boolean {
    const params = new URLSearchParams(window.parent.location.search);
    if ((!!params && params.has("key")) || Main._hasCachedEncryptedKey()) {
      return true;
    }
    return false;
  }

  public static initializeExplorer(): Q.Promise<ViewModels.Explorer> {
    window.addEventListener("message", this._handleMessage.bind(this), false);
    this._features = {};
    const params = new URLSearchParams(window.parent.location.search);
    const deferred: Q.Deferred<ViewModels.Explorer> = Q.defer<ViewModels.Explorer>();
    let authType: string = null;

    // Encrypted token flow
    if (!!params && params.has("key")) {
      Main._encryptedToken = encodeURIComponent(params.get("key"));
      SessionStorageUtility.setEntryString(StorageKey.EncryptedKeyToken, Main._encryptedToken);
      authType = AuthType.EncryptedToken;
    } else if (Main._hasCachedEncryptedKey()) {
      Main._encryptedToken = SessionStorageUtility.getEntryString(StorageKey.EncryptedKeyToken);
      authType = AuthType.EncryptedToken;
    }

    // Aad flow
    if (AuthHeadersUtil.isUserSignedIn()) {
      authType = AuthType.AAD;
    }

    if (params) {
      this._features = Main.extractFeatures(params);
    }

    (<any>window).authType = authType;
    if (!authType) {
      return Q.reject("Sign in needed");
    }

    const explorer: ViewModels.Explorer = this._instantiateExplorer();
    if (authType === AuthType.EncryptedToken) {
      MessageHandler.sendMessage({
        type: MessageTypes.UpdateAccountSwitch,
        props: {
          authType: AuthType.EncryptedToken,
          displayText: "Loading..."
        }
      });
      CosmosClient.accessToken(Main._encryptedToken);
      Main._getAccessInputMetadata(Main._encryptedToken).then(
        () => {
          const expiryTimestamp: number =
            Main._accessInputMetadata && parseInt(Main._accessInputMetadata.expiryTimestamp);
          if (authType === AuthType.EncryptedToken && (isNaN(expiryTimestamp) || expiryTimestamp <= 0)) {
            return deferred.reject("Token expired");
          }

          Main._initDataExplorerFrameInputs(explorer);
          deferred.resolve(explorer);
        },
        (error: any) => {
          console.error(error);
          deferred.reject(error);
        }
      );
    } else if (authType === AuthType.AAD) {
      MessageHandler.sendMessage({
        type: MessageTypes.GetAccessAadRequest
      });
      if (this._getAadAccessDeferred != null) {
        // already request aad access, don't duplicate
        return Q(null);
      }
      this._explorer = explorer;
      this._getAadAccessDeferred = Q.defer<ViewModels.Explorer>();
      return this._getAadAccessDeferred.promise.finally(() => {
        this._getAadAccessDeferred = null;
      });
    } else {
      Main._initDataExplorerFrameInputs(explorer);
      deferred.resolve(explorer);
    }

    return deferred.promise;
  }

  public static extractFeatures(params: URLSearchParams): { [key: string]: string } {
    const featureParamRegex = /feature.(.*)/i;
    const features: { [key: string]: string } = {};
    params.forEach((value: string, param: string) => {
      if (featureParamRegex.test(param)) {
        const matches: string[] = param.match(featureParamRegex);
        if (matches.length > 0) {
          features[matches[1].toLowerCase()] = value;
        }
      }
    });
    return features;
  }

  public static configureTokenValidationDisplayPrompt(explorer: ViewModels.Explorer): void {
    const authType: AuthType = (<any>window).authType;
    if (
      !explorer ||
      !Main._encryptedToken ||
      !Main._accessInputMetadata ||
      Main._accessInputMetadata.expiryTimestamp == null ||
      authType !== AuthType.EncryptedToken
    ) {
      return;
    }

    Main._showGuestAccessTokenRenewalPromptInMs(explorer, parseInt(Main._accessInputMetadata.expiryTimestamp));
  }

  public static parseResourceTokenConnectionString(connectionString: string): resourceTokenConnectionStringProperties {
    let accountEndpoint: string;
    let collectionId: string;
    let databaseId: string;
    let partitionKey: string;
    let resourceToken: string;
    const connectionStringParts = connectionString.split(";");
    connectionStringParts.forEach((part: string) => {
      if (part.startsWith("type=resource")) {
        resourceToken = part + ";";
      } else if (part.startsWith("AccountEndpoint=")) {
        accountEndpoint = part.substring(16);
      } else if (part.startsWith("DatabaseId=")) {
        databaseId = part.substring(11);
      } else if (part.startsWith("CollectionId=")) {
        collectionId = part.substring(13);
      } else if (part.startsWith("PartitionKey=")) {
        partitionKey = part.substring(13);
      } else if (part !== "") {
        resourceToken += part + ";";
      }
    });

    return {
      accountEndpoint,
      collectionId,
      databaseId,
      partitionKey,
      resourceToken
    };
  }

  public static renewExplorerAccess = (explorer: ViewModels.Explorer, connectionString: string): Q.Promise<void> => {
    if (!connectionString) {
      console.error("Missing or invalid connection string input");
      Q.reject("Missing or invalid connection string input");
    }

    if (Main._isResourceToken(connectionString)) {
      return Main._renewExplorerAccessWithResourceToken(explorer, connectionString);
    }

    const deferred: Q.Deferred<void> = Q.defer<void>();
    AuthHeadersUtil.generateUnauthenticatedEncryptedTokenForConnectionString(connectionString).then(
      (encryptedToken: GenerateTokenResponse) => {
        if (!encryptedToken || !encryptedToken.readWrite) {
          deferred.reject("Encrypted token is empty or undefined");
        }

        Main._encryptedToken = encryptedToken.readWrite;
        window.authType = AuthType.EncryptedToken;

        CosmosClient.accessToken(Main._encryptedToken);
        Main._getAccessInputMetadata(Main._encryptedToken).then(
          () => {
            if (explorer.isConnectExplorerVisible()) {
              HostedExplorerFactory.reInitializeDocumentClientUtilityForExplorer(explorer);
              explorer.hideConnectExplorerForm();
            }

            if (Main._accessInputMetadata.apiKind != ApiKind.Graph) {
              // do not save encrypted token for graphs because we cannot extract master key in the client
              SessionStorageUtility.setEntryString(StorageKey.EncryptedKeyToken, Main._encryptedToken);
              window.parent &&
                window.parent.history.replaceState(
                  { encryptedToken: encryptedToken },
                  "",
                  `?key=${Main._encryptedToken}${(window.parent && window.parent.location.hash) || ""}`
                ); // replace query params if any
            } else {
              SessionStorageUtility.removeEntry(StorageKey.EncryptedKeyToken);
              window.parent &&
                window.parent.history.replaceState(
                  { encryptedToken: encryptedToken },
                  "",
                  `?${(window.parent && window.parent.location.hash) || ""}`
                ); // replace query params if any
            }

            const masterKey: string = Main._getMasterKeyFromConnectionString(connectionString);
            Main.configureTokenValidationDisplayPrompt(explorer);
            Main._setExplorerReady(explorer, masterKey);

            deferred.resolve();
          },
          (error: any) => {
            console.error(error);
            deferred.reject(error);
          }
        );
      },
      (error: any) => {
        deferred.reject(`Failed to generate encrypted token: ${JSON.stringify(error)}`);
      }
    );

    return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
  };

  public static getUninitializedExplorerForGuestAccess(): ViewModels.Explorer {
    const explorer = Main._instantiateExplorer();
    if (window.authType === AuthType.AAD) {
      this._explorer = explorer;
    }
    (<any>window).dataExplorer = explorer;

    return explorer;
  }

  private static _initDataExplorerFrameInputs(
    explorer: ViewModels.Explorer,
    masterKey?: string /* master key extracted from connection string if available */,
    account?: DatabaseAccount,
    authorizationToken?: string /* access key */
  ): Q.Promise<void> {
    const serverId: string = AuthHeadersUtil.serverId;
    const authType: string = (<any>window).authType;
    const accountResourceId =
      authType === AuthType.EncryptedToken
        ? Main._databaseAccountId
        : authType === AuthType.AAD && account
        ? account.id
        : "";
    const subscriptionId: string = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
    const resourceGroup: string = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];

    explorer.isTryCosmosDBSubscription(SubscriptionUtilMappings.FreeTierSubscriptionIds.indexOf(subscriptionId) >= 0);
    if (authorizationToken && authorizationToken.indexOf("Bearer") !== 0) {
      // Portal sends the auth token with bearer suffix, so we prepend the same to be consistent
      authorizationToken = `Bearer ${authorizationToken}`;
    }

    if (authType === AuthType.EncryptedToken) {
      const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
        Main._accessInputMetadata.apiKind
      );
      MessageHandler.sendMessage({
        type: MessageTypes.UpdateAccountSwitch,
        props: {
          authType: AuthType.EncryptedToken,
          selectedAccountName: Main._accessInputMetadata.accountName
        }
      });
      return explorer.initDataExplorerWithFrameInputs({
        databaseAccount: {
          id: Main._databaseAccountId,
          name: Main._accessInputMetadata.accountName,
          kind: this._getDatabaseAccountKindFromExperience(apiExperience),
          properties: HostedUtils.getDatabaseAccountPropertiesFromMetadata(Main._accessInputMetadata),
          tags: { defaultExperience: apiExperience }
        },
        subscriptionId,
        resourceGroup,
        masterKey,
        hasWriteAccess: true, // TODO: we should embed this information in the token ideally
        authorizationToken: undefined,
        features: this._features,
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: AuthHeadersUtil.extensionEndpoint,
        subscriptionType: CollectionCreation.DefaultSubscriptionType,
        quotaId: undefined,
        addCollectionDefaultFlight: explorer.flight(),
        isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription()
      });
    }

    if (authType === AuthType.AAD) {
      const inputs: DataExplorerInputsFrame = {
        databaseAccount: account,
        subscriptionId,
        resourceGroup,
        masterKey,
        hasWriteAccess: true, //TODO: 425017 - support read access
        authorizationToken,
        features: this._features,
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: AuthHeadersUtil.extensionEndpoint,
        subscriptionType: CollectionCreation.DefaultSubscriptionType,
        quotaId: undefined,
        addCollectionDefaultFlight: explorer.flight(),
        isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription()
      };
      return explorer.initDataExplorerWithFrameInputs(inputs);
    }

    if (authType === AuthType.ResourceToken) {
      const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
        Main._accessInputMetadata.apiKind
      );
      return explorer.initDataExplorerWithFrameInputs({
        databaseAccount: {
          id: Main._databaseAccountId,
          name: Main._accessInputMetadata.accountName,
          kind: this._getDatabaseAccountKindFromExperience(apiExperience),
          properties: HostedUtils.getDatabaseAccountPropertiesFromMetadata(Main._accessInputMetadata),
          tags: { defaultExperience: apiExperience }
        },
        subscriptionId,
        resourceGroup,
        masterKey,
        hasWriteAccess: true, // TODO: we should embed this information in the token ideally
        authorizationToken: undefined,
        features: this._features,
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: AuthHeadersUtil.extensionEndpoint,
        subscriptionType: CollectionCreation.DefaultSubscriptionType,
        quotaId: undefined,
        addCollectionDefaultFlight: explorer.flight(),
        isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription(),
        isAuthWithresourceToken: true
      });
    }

    return Q.reject(`Unsupported AuthType ${authType}`);
  }

  private static _instantiateExplorer(): ViewModels.Explorer {
    const hostedExplorerFactory = new HostedExplorerFactory();
    const explorer = hostedExplorerFactory.createExplorer();
    // workaround to resolve cyclic refs with view
    explorer.renewExplorerShareAccess = Main.renewExplorerAccess;
    window.addEventListener("message", explorer.handleMessage.bind(explorer), false);

    // Hosted needs click to dismiss any menu
    if (window.authType === AuthType.AAD) {
      window.addEventListener(
        "click",
        () => {
          MessageHandler.sendMessage({
            type: MessageTypes.ExplorerClickEvent
          });
        },
        true
      );
    }

    return explorer;
  }

  private static _showGuestAccessTokenRenewalPromptInMs(explorer: ViewModels.Explorer, interval: number): void {
    if (interval != null && !isNaN(interval)) {
      setTimeout(() => {
        explorer.displayGuestAccessTokenRenewalPrompt();
      }, interval);
    }
  }

  private static _hasCachedEncryptedKey(): boolean {
    return SessionStorageUtility.hasItem(StorageKey.EncryptedKeyToken);
  }

  private static _getDatabaseAccountKindFromExperience(apiExperience: string): string {
    if (apiExperience === Constants.DefaultAccountExperience.MongoDB) {
      return Constants.AccountKind.MongoDB;
    }

    if (apiExperience === Constants.DefaultAccountExperience.ApiForMongoDB) {
      return Constants.AccountKind.MongoDB;
    }

    return Constants.AccountKind.GlobalDocumentDB;
  }

  private static _getAccessInputMetadata(accessInput: string): Q.Promise<void> {
    const deferred: Q.Deferred<void> = Q.defer<void>();
    AuthHeadersUtil.getAccessInputMetadata(accessInput).then(
      (metadata: any) => {
        Main._accessInputMetadata = metadata;
        deferred.resolve();
      },
      (error: any) => {
        deferred.reject(error);
      }
    );

    return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
  }

  private static _getMasterKeyFromConnectionString(connectionString: string): string {
    if (!connectionString || Main._accessInputMetadata == null || Main._accessInputMetadata.apiKind !== ApiKind.Graph) {
      // client only needs master key for Graph API
      return undefined;
    }

    const matchedParts: string[] = connectionString.match("AccountKey=(.*);ApiKind=Gremlin;$");
    return (matchedParts.length > 1 && matchedParts[1]) || undefined;
  }

  private static _isResourceToken(connectionString: string): boolean {
    return connectionString && connectionString.includes("type=resource");
  }

  private static _getSubscriptionTypeFromQuotaId(quotaId: string): ViewModels.SubscriptionType {
    const subscriptionType: ViewModels.SubscriptionType = SubscriptionUtilMappings.SubscriptionTypeMap[quotaId];
    return subscriptionType || Main._defaultSubscriptionType;
  }

  private static _renewExplorerAccessWithResourceToken = (
    explorer: ViewModels.Explorer,
    connectionString: string
  ): Q.Promise<void> => {
    window.authType = AuthType.ResourceToken;

    const properties: resourceTokenConnectionStringProperties = Main.parseResourceTokenConnectionString(
      connectionString
    );
    if (
      !properties.accountEndpoint ||
      !properties.resourceToken ||
      !properties.databaseId ||
      !properties.collectionId
    ) {
      console.error("Invalid connection string input");
      Q.reject("Invalid connection string input");
    }
    CosmosClient.resourceToken(properties.resourceToken);
    CosmosClient.endpoint(properties.accountEndpoint);
    explorer.resourceTokenDatabaseId(properties.databaseId);
    explorer.resourceTokenCollectionId(properties.collectionId);
    if (properties.partitionKey) {
      explorer.resourceTokenPartitionKey(properties.partitionKey);
    }
    Main._accessInputMetadata = Main._getAccessInputMetadataFromAccountEndpoint(properties.accountEndpoint);

    if (explorer.isConnectExplorerVisible()) {
      HostedExplorerFactory.reInitializeDocumentClientUtilityForExplorer(explorer);
      explorer.hideConnectExplorerForm();
    }

    Main._setExplorerReady(explorer);
    return Q.resolve();
  };

  private static _getAccessInputMetadataFromAccountEndpoint = (accountEndpoint: string): AccessInputMetadata => {
    const documentEndpoint: string = accountEndpoint;
    const result: RegExpMatchArray = accountEndpoint.match("https://([^\\.]+)\\..+");
    const accountName: string = result && result[1];
    const apiEndpoint: string = accountEndpoint.substring(8);
    const apiKind: number = ApiKind.SQL;

    return {
      accountName,
      apiEndpoint,
      apiKind,
      documentEndpoint,
      expiryTimestamp: ""
    };
  };

  private static _setExplorerReady(
    explorer: ViewModels.Explorer,
    masterKey?: string,
    account?: DatabaseAccount,
    authorizationToken?: string
  ) {
    Main._initDataExplorerFrameInputs(explorer, masterKey, account, authorizationToken);
    explorer.isAccountReady.valueHasMutated();
    MessageHandler.sendMessage("ready");
  }

  private static _shouldProcessMessage(event: MessageEvent): boolean {
    if (typeof event.data !== "object") {
      return false;
    }
    if (event.data["signature"] !== "pcIframe") {
      return false;
    }
    if (!("data" in event.data)) {
      return false;
    }
    if (typeof event.data["data"] !== "object") {
      return false;
    }
    return true;
  }

  private static _handleMessage(event: MessageEvent) {
    if (isInvalidParentFrameOrigin(event)) {
      return;
    }

    if (!this._shouldProcessMessage(event)) {
      return;
    }

    const message: any = event.data.data;
    if (message.type) {
      if (message.type === MessageTypes.GetAccessAadResponse && (message.response || message.error)) {
        if (message.response) {
          Main._handleGetAccessAadSucceed(message.response);
        }
        if (message.error) {
          Main._handleGetAccessAadFailed(message.error);
        }
        return;
      }
      if (message.type === MessageTypes.SwitchAccount && message.account && message.keys) {
        Main._handleSwitchAccountSucceed(message.account, message.keys, message.authorizationToken);
        return;
      }
    }
  }

  private static _handleSwitchAccountSucceed(account: DatabaseAccount, keys: AccountKeys, authorizationToken: string) {
    if (!this._explorer) {
      console.error("no explorer found");
      return;
    }

    this._explorer.hideConnectExplorerForm();

    HostedExplorerFactory.reInitializeDocumentClientUtilityForExplorer(this._explorer);
    Main._setExplorerReady(this._explorer, keys.primaryMasterKey, account, authorizationToken);
  }

  private static _handleGetAccessAadSucceed(response: [DatabaseAccount, AccountKeys, string]) {
    if (!response || response.length < 1) {
      return;
    }
    const account = response[0];
    const keys = response[1];
    const authorizationToken = response[2];
    Main._setExplorerReady(this._explorer, keys.primaryMasterKey, account, authorizationToken);
    this._getAadAccessDeferred.resolve(this._explorer);
  }

  private static _handleGetAccessAadFailed(error: any) {
    this._getAadAccessDeferred.reject(error);
  }
}
