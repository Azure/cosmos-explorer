import * as Constants from "../../Common/Constants";
import AuthHeadersUtil from "./Authorization";
import Q from "q";
import {
  AccessInputMetadata,
  ApiKind,
  DatabaseAccount,
  GenerateTokenResponse,
  resourceTokenConnectionStringProperties
} from "../../Contracts/DataModels";
import { AuthType } from "../../AuthType";
import { CollectionCreation } from "../../Shared/Constants";
import { DataExplorerInputsFrame } from "../../Contracts/ViewModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { HostedUtils } from "./HostedUtils";
import { sendMessage } from "../../Common/MessageHandler";
import { SessionStorageUtility, StorageKey } from "../../Shared/StorageUtility";
import { SubscriptionUtilMappings } from "../../Shared/Constants";
import "../../Explorer/Tables/DataTable/DataTableBindingManager";
import Explorer from "../../Explorer/Explorer";
import { updateUserContext } from "../../UserContext";
import { configContext } from "../../ConfigContext";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";
import { extractFeatures } from "./extractFeatures";

export default class Main {
  private static _databaseAccountId: string;
  private static _encryptedToken: string;
  private static _accessInputMetadata: AccessInputMetadata;

  public static initializeExplorer(): Explorer {
    const params = new URLSearchParams(window.location.search);
    let authType: string = params && params.get("authType");

    // Encrypted token flow
    if (params && params.has("key")) {
      Main._encryptedToken = encodeURIComponent(params.get("key"));
      Main._accessInputMetadata = JSON.parse(params.get("metadata"));
      authType = AuthType.EncryptedToken;
    }

    const explorer = new Explorer();
    // workaround to resolve cyclic refs with view // TODO. Is this even needed anymore?
    explorer.renewExplorerShareAccess = Main.renewExplorerAccess;
    window.addEventListener("message", explorer.handleMessage.bind(explorer), false);
    if (authType === AuthType.EncryptedToken) {
      updateUserContext({
        accessToken: Main._encryptedToken
      });
      Main._initDataExplorerFrameInputs(explorer);
    } else if (authType === AuthType.AAD) {
    } else {
      Main._initDataExplorerFrameInputs(explorer);
    }
    return explorer;
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

  public static renewExplorerAccess = (explorer: Explorer, connectionString: string): Q.Promise<void> => {
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

        updateUserContext({
          accessToken: Main._encryptedToken
        });
        Main._getAccessInputMetadata(Main._encryptedToken).then(
          () => {
            if (explorer.isConnectExplorerVisible()) {
              explorer.notificationConsoleData([]);
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
        deferred.reject(`Failed to generate encrypted token: ${getErrorMessage(error)}`);
      }
    );

    return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
  };

  private static _initDataExplorerFrameInputs(
    explorer: Explorer,
    masterKey?: string /* master key extracted from connection string if available */,
    account?: DatabaseAccount,
    authorizationToken?: string /* access key */
  ): void {
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
        features: extractFeatures(),
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: configContext.BACKEND_ENDPOINT,
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
        features: extractFeatures(),
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: configContext.BACKEND_ENDPOINT,
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
        features: extractFeatures(),
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: configContext.BACKEND_ENDPOINT,
        subscriptionType: CollectionCreation.DefaultSubscriptionType,
        quotaId: undefined,
        addCollectionDefaultFlight: explorer.flight(),
        isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription(),
        isAuthWithresourceToken: true
      });
    }

    throw new Error(`Unsupported AuthType ${authType}`);
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

  private static async _getAccessInputMetadata(accessInput: string): Promise<void> {
    const metadata = await AuthHeadersUtil.getAccessInputMetadata(accessInput);
    Main._accessInputMetadata = metadata;
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

  private static _renewExplorerAccessWithResourceToken = (
    explorer: Explorer,
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
    updateUserContext({
      resourceToken: properties.resourceToken,
      endpoint: properties.accountEndpoint
    });
    explorer.resourceTokenDatabaseId(properties.databaseId);
    explorer.resourceTokenCollectionId(properties.collectionId);
    if (properties.partitionKey) {
      explorer.resourceTokenPartitionKey(properties.partitionKey);
    }
    Main._accessInputMetadata = Main._getAccessInputMetadataFromAccountEndpoint(properties.accountEndpoint);

    if (explorer.isConnectExplorerVisible()) {
      explorer.notificationConsoleData([]);
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
    explorer: Explorer,
    masterKey?: string,
    account?: DatabaseAccount,
    authorizationToken?: string
  ) {
    Main._initDataExplorerFrameInputs(explorer, masterKey, account, authorizationToken);
    explorer.isAccountReady.valueHasMutated();
    sendMessage("ready");
  }
}
