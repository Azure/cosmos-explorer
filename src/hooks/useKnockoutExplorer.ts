import * as Constants from "Common/Constants";
import { getEnvironmentScopeEndpoint } from "Common/EnvironmentUtility";
import { createUri } from "Common/UrlUtility";
import { DATA_EXPLORER_RPC_VERSION } from "Contracts/DataExplorerMessagesContract";
import { FabricMessageTypes } from "Contracts/FabricMessageTypes";
import {
  ArtifactConnectionInfo,
  CosmosDbArtifactType,
  FABRIC_RPC_VERSION,
  FabricMessageV2,
  FabricMessageV3,
  InitializeMessageV3,
} from "Contracts/FabricMessagesContract";
import { useDialog } from "Explorer/Controls/Dialog";
import Explorer from "Explorer/Explorer";
import { useDataPlaneRbac } from "Explorer/Panes/SettingsPane/SettingsPane";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { isFabricMirroredKey, scheduleRefreshFabricToken } from "Platform/Fabric/FabricUtil";
import {
  AppStateComponentNames,
  deleteState,
  hasState,
  loadState,
  OPEN_TABS_SUBCOMPONENT_NAME,
  readSubComponentState,
} from "Shared/AppStatePersistenceUtility";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { isDataplaneRbacSupported } from "Utils/APITypeUtils";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import { useClientWriteEnabled } from "hooks/useClientWriteEnabled";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import { useEffect, useState } from "react";
import { AuthType } from "../AuthType";
import { AccountKind, Flights } from "../Common/Constants";
import { normalizeArmEndpoint } from "../Common/EnvironmentUtility";
import * as Logger from "../Common/Logger";
import { handleCachedDataMessage, sendMessage, sendReadyMessage } from "../Common/MessageHandler";
import { configContext, Platform, updateConfigContext } from "../ConfigContext";
import { ActionType, DataExplorerAction, TabKind } from "../Contracts/ActionContracts";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { DataExplorerInputsFrame } from "../Contracts/ViewModels";
import { handleOpenAction } from "../Explorer/OpenActions/OpenActions";
import { useDatabases } from "../Explorer/useDatabases";
import {
  AAD,
  ConnectionString,
  EncryptedToken,
  HostedExplorerChildFrame,
  ResourceToken,
} from "../HostedExplorerChildFrame";
import { emulatorAccount } from "../Platform/Emulator/emulatorAccount";
import { parseResourceTokenConnectionString } from "../Platform/Hosted/Helpers/ResourceTokenUtils";
import {
  getDatabaseAccountKindFromExperience,
  getDatabaseAccountPropertiesFromMetadata,
} from "../Platform/Hosted/HostedUtils";
import { extractFeatures } from "../Platform/Hosted/extractFeatures";
import { DefaultExperienceUtility } from "../Shared/DefaultExperienceUtility";
import { FabricArtifactInfo, Node, PortalEnv, updateUserContext, userContext } from "../UserContext";
import {
  acquireMsalTokenForAccount,
  acquireTokenWithMsal,
  getAuthorizationHeader,
  getMsalInstance,
  isDataplaneRbacEnabledForProxyApi,
} from "../Utils/AuthorizationUtils";
import { isInvalidParentFrameOrigin, shouldProcessMessage } from "../Utils/MessageValidation";
import { get, getReadOnlyKeys, listKeys } from "../Utils/arm/generatedClients/cosmos/databaseAccounts";
import * as Types from "../Utils/arm/generatedClients/cosmos/types";
import { applyExplorerBindings } from "../applyExplorerBindings";

// This hook will create a new instance of Explorer.ts and bind it to the DOM
// This hook has a LOT of magic, but ideally we can delete it once we have removed KO and switched entirely to React
// Please tread carefully :)

export function useKnockoutExplorer(platform: Platform): Explorer {
  const [explorer, setExplorer] = useState<Explorer>();

  useEffect(() => {
    const effect = async () => {
      if (platform) {
        //Updating phoenix feature flags for MPAC based of config context
        if (configContext.isPhoenixEnabled === true) {
          userContext.features.phoenixNotebooks = true;
          userContext.features.phoenixFeatures = true;
        }
        let explorer: Explorer;
        if (platform === Platform.Hosted) {
          explorer = await configureHosted();
        } else if (platform === Platform.Emulator || platform === Platform.VNextEmulator) {
          explorer = configureEmulator();
        } else if (platform === Platform.Portal) {
          explorer = await configurePortal();
        } else if (platform === Platform.Fabric) {
          explorer = await configureFabric();
        }
        if (explorer && userContext.features.enableCopilot) {
          await updateContextForCopilot(explorer);
          await updateContextForSampleData(explorer);
        }

        restoreOpenTabs();

        setExplorer(explorer);
      }
    };
    effect();
  }, [platform]);

  useEffect(() => {
    if (explorer) {
      applyExplorerBindings(explorer);
    }
  }, [explorer]);

  return explorer;
}

async function configureFabric(): Promise<Explorer> {
  // These are the versions of Fabric that Data Explorer supports.
  const SUPPORTED_FABRIC_VERSIONS = ["2", FABRIC_RPC_VERSION];

  let firstContainerOpened = false;
  let explorer: Explorer;
  return new Promise<Explorer>((resolve) => {
    window.addEventListener(
      "message",
      async (event) => {
        if (isInvalidParentFrameOrigin(event)) {
          return;
        }

        if (!shouldProcessMessage(event)) {
          return;
        }

        const data: FabricMessageV2 | FabricMessageV3 = event.data?.data;
        if (!data) {
          return;
        }

        switch (data.type) {
          case "initialize": {
            const fabricVersion = data.version;
            if (!SUPPORTED_FABRIC_VERSIONS.includes(fabricVersion)) {
              // TODO Surface error to user and log to telemetry
              useDialog
                .getState()
                .showOkModalDialog("Unsupported Fabric version", `Unsupported Fabric version: ${fabricVersion}`);
              Logger.logError(`Unsupported Fabric version: ${fabricVersion}`, "Explorer/configureFabric");
              console.error(`Unsupported Fabric version: ${fabricVersion}`);
              return;
            }

            if (fabricVersion === "2") {
              // ----------------- TODO: Remove this when FabricMessageV2 is deprecated -----------------
              const initializationMessage = data.message as {
                connectionId: string;
                isVisible: boolean;
              };

              explorer = createExplorerFabricLegacy(initializationMessage, data.version);
              await scheduleRefreshFabricToken(true);
              resolve(explorer);
              await explorer.refreshAllDatabases();
              if (userContext.fabricContext.isVisible) {
                firstContainerOpened = true;
                openFirstContainer(explorer, userContext.fabricContext.databaseName);
              }
              // -----------------------------------------------------------------------------------------
            } else if (fabricVersion === FABRIC_RPC_VERSION) {
              const initializationMessage = data.message as InitializeMessageV3<CosmosDbArtifactType>;
              explorer = createExplorerFabric(initializationMessage, data.version);

              if (initializationMessage.artifactType === CosmosDbArtifactType.MIRRORED_KEY) {
                // Do not show Home tab for Mirrored
                useTabs.getState().closeReactTab(ReactTabKind.Home);
              }

              // All tokens used in fabric expire, so schedule a refresh
              // For Mirrored key, we need the token right away to get the database and containers list.
              if (isFabricMirroredKey()) {
                await scheduleRefreshFabricToken(true);
              } else {
                scheduleRefreshFabricToken(false);
              }

              resolve(explorer);
              await explorer.refreshAllDatabases();

              const { databaseName } = userContext.fabricContext;
              if (userContext.fabricContext.isVisible && databaseName) {
                firstContainerOpened = true;
                openFirstContainer(explorer, databaseName);
              }
            }

            break;
          }
          case "newContainer":
            explorer.onNewCollectionClicked();
            break;
          case "authorizationToken":
          case "allResourceTokens_v2":
          case "accessToken": {
            handleCachedDataMessage(data);
            break;
          }
          case "explorerVisible": {
            userContext.fabricContext.isVisible = data.message.visible;
            if (userContext.fabricContext.isVisible && !firstContainerOpened) {
              const { databaseName } = userContext.fabricContext;
              if (databaseName !== undefined) {
                firstContainerOpened = true;
                openFirstContainer(explorer, databaseName);
              }
            }
            break;
          }
          case "refreshResourceTree": {
            explorer.onRefreshResourcesClick();
            break;
          }
          default:
            console.error(`Unknown Fabric message type: ${JSON.stringify(data)}`);
            break;
        }
      },
      false,
    );

    sendMessage({
      type: FabricMessageTypes.Ready,
      id: "ready",
      params: [DATA_EXPLORER_RPC_VERSION],
    });
  });
}

const openFirstContainer = async (explorer: Explorer, databaseName: string, collectionName?: string) => {
  if (useTabs.getState().openedTabs.length > 0) {
    // Don't open any tabs if there are already tabs open
    return;
  }

  // Expand database first
  databaseName = sessionStorage.getItem("openDatabaseName") ?? databaseName;
  const database = useDatabases.getState().databases.find((db) => db.id() === databaseName);
  if (database) {
    await database.expandDatabase();
    useDatabases.getState().updateDatabase(database);
    useSelectedNode.getState().setSelectedNode(database);

    let collectionResourceId = collectionName;
    if (collectionResourceId === undefined) {
      // Pick first collection if collectionName not specified in message
      collectionResourceId = database.collections()[0]?.id();
    }

    if (collectionResourceId !== undefined) {
      // Expand collection
      const collection = database.collections().find((coll) => coll.id() === collectionResourceId);
      collection.expandCollection();
      useSelectedNode.getState().setSelectedNode(collection);

      handleOpenAction(
        {
          actionType: ActionType.OpenCollectionTab,
          databaseResourceId: databaseName,
          collectionResourceId: collectionName,
          tabKind: TabKind.SQLDocuments,
        } as DataExplorerAction,
        useDatabases.getState().databases,
        explorer,
      );
    }
  }
};

async function configureHosted(): Promise<Explorer> {
  const win = window as unknown as HostedExplorerChildFrame;
  let explorer: Explorer;
  if (win.hostedConfig.authType === AuthType.EncryptedToken) {
    explorer = configureWithEncryptedToken(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.ResourceToken) {
    explorer = configureHostedWithResourceToken(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.ConnectionString) {
    explorer = configureHostedWithConnectionString(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.AAD) {
    explorer = await configureHostedWithAAD(win.hostedConfig);
  } else {
    throw new Error(`Unknown hosted config: ${win.hostedConfig}`);
  }

  window.addEventListener(
    "message",
    (event) => {
      if (isInvalidParentFrameOrigin(event)) {
        return;
      }

      if (!shouldProcessMessage(event)) {
        return;
      }

      if (event.data?.type === MessageTypes.CloseTab) {
        if (
          event.data?.data?.tabId === "QuickstartPSQLShell" ||
          event.data?.data?.tabId === "QuickstartVcoreMongoShell"
        ) {
          useTabs.getState().closeReactTab(ReactTabKind.Quickstart);
        } else {
          useTabs.getState().closeTabsByComparator((tab) => tab.tabId === event.data?.data?.tabId);
        }
      }
    },
    false,
  );

  return explorer;
}

async function configureHostedWithAAD(config: AAD): Promise<Explorer> {
  // TODO: Refactor. updateUserContext needs to be called twice because listKeys below depends on userContext.authorizationToken
  updateUserContext({
    authType: AuthType.AAD,
    authorizationToken: `Bearer ${config.authorizationToken}`,
  });
  const account = config.databaseAccount;
  const accountResourceId = account.id;
  const subscriptionId = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
  const resourceGroup = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];
  let aadToken;
  if (account.properties?.documentEndpoint) {
    let hrefEndpoint = "";
    if (isDataplaneRbacEnabledForProxyApi(userContext)) {
      hrefEndpoint = getEnvironmentScopeEndpoint();
    } else {
      hrefEndpoint = new URL(account.properties.documentEndpoint).href.replace(/\/$/, "/.default");
    }
    const msalInstance = await getMsalInstance();
    const cachedAccount = msalInstance.getAllAccounts()?.[0];
    msalInstance.setActiveAccount(cachedAccount);
    const cachedTenantId = localStorage.getItem("cachedTenantId");
    try {
      aadToken = await acquireTokenWithMsal(msalInstance, {
        forceRefresh: true,
        scopes: [hrefEndpoint],
        authority: `${configContext.AAD_ENDPOINT}${cachedTenantId}`,
      });
    } catch (authError) {
      logConsoleError("Failed to acquire authorization token: " + authError);
    }
  }
  try {
    // TO DO - Remove once we have ARG API support for enableMaterializedViews property
    const databaseAccount: Types.DatabaseAccountGetResults = await get(
      subscriptionId,
      account.resourceGroup,
      account.name,
    );
    config.databaseAccount.properties.enableMaterializedViews = databaseAccount.properties?.enableMaterializedViews;

    updateUserContext({
      databaseAccount: config.databaseAccount,
    });
    Logger.logInfo(
      `Configuring Data Explorer for ${userContext.apiType} account ${account.name}`,
      "Explorer/configureHostedWithAAD",
    );
    if (userContext.apiType === "SQL") {
      checkAndUpdateSelectedRegionalEndpoint();
    }
    if (!userContext.features.enableAadDataPlane) {
      Logger.logInfo(`AAD Feature flag is not enabled for account ${account.name}`, "Explorer/configureHostedWithAAD");
      if (isDataplaneRbacSupported(userContext.apiType)) {
        if (LocalStorageUtility.hasItem(StorageKey.DataPlaneRbacEnabled)) {
          const isDataPlaneRbacSetting = LocalStorageUtility.getEntryString(StorageKey.DataPlaneRbacEnabled);
          Logger.logInfo(
            `Local storage RBAC setting for ${userContext.apiType} account ${account.name} is ${isDataPlaneRbacSetting}`,
            "Explorer/configureHostedWithAAD",
          );

          let dataPlaneRbacEnabled;
          if (isDataPlaneRbacSetting === Constants.RBACOptions.setAutomaticRBACOption) {
            dataPlaneRbacEnabled = account.properties.disableLocalAuth;
            Logger.logInfo(
              `Data Plane RBAC value for ${userContext.apiType} account ${account.name} with disable local auth set to ${account.properties.disableLocalAuth} is ${dataPlaneRbacEnabled}`,
              "Explorer/configureHostedWithAAD",
            );
          } else {
            dataPlaneRbacEnabled = isDataPlaneRbacSetting === Constants.RBACOptions.setTrueRBACOption;
            Logger.logInfo(
              `Data Plane RBAC value for ${userContext.apiType} account ${account.name} with disable local auth set to ${account.properties.disableLocalAuth} is ${dataPlaneRbacEnabled}`,
              "Explorer/configureHostedWithAAD",
            );
          }
          if (!dataPlaneRbacEnabled) {
            Logger.logInfo(
              `Calling fetch keys for ${userContext.apiType} account ${account.name} with RBAC setting ${dataPlaneRbacEnabled}`,
              "Explorer/configureHostedWithAAD",
            );
            await fetchAndUpdateKeys(subscriptionId, resourceGroup, account.name);
          }

          updateUserContext({ dataPlaneRbacEnabled });
        } else {
          const dataPlaneRbacEnabled = account.properties.disableLocalAuth;
          Logger.logInfo(
            `Local storage setting does not exist : Data Plane RBAC value for ${userContext.apiType} account ${account.name} with disable local auth set to ${account.properties.disableLocalAuth} is ${dataPlaneRbacEnabled}`,
            "Explorer/configureHostedWithAAD",
          );

          if (!dataPlaneRbacEnabled) {
            Logger.logInfo(
              `Fetching keys for ${userContext.apiType} account ${account.name} with RBAC setting ${dataPlaneRbacEnabled}`,
              "Explorer/configureHostedWithAAD",
            );
            await fetchAndUpdateKeys(subscriptionId, resourceGroup, account.name);
          }

          updateUserContext({ dataPlaneRbacEnabled });
          useDataPlaneRbac.setState({ dataPlaneRbacEnabled: dataPlaneRbacEnabled });
        }
      } else {
        Logger.logInfo(
          `Fetching keys for ${userContext.apiType} account ${account.name}`,
          "Explorer/configureHostedWithAAD",
        );
        await fetchAndUpdateKeys(subscriptionId, resourceGroup, account.name);
      }
    }
  } catch (e) {
    if (userContext.features.enableAadDataPlane) {
      console.warn(e);
    } else {
      throw new Error(`List keys failed: ${e.message}`);
    }
  }
  updateUserContext({
    subscriptionId,
    resourceGroup,
    aadToken,
  });
  const explorer = new Explorer();
  return explorer;
}

function configureHostedWithConnectionString(config: ConnectionString): Explorer {
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(config.encryptedTokenMetadata.apiKind);
  const databaseAccount = {
    id: "",
    location: "",
    type: "",
    name: config.encryptedTokenMetadata.accountName,
    kind: getDatabaseAccountKindFromExperience(apiExperience),
    properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
    tags: {},
  };
  updateUserContext({
    // For legacy reasons lots of code expects a connection string login to look and act like an encrypted token login
    authType: AuthType.EncryptedToken,
    accessToken: encodeURIComponent(config.encryptedToken),
    databaseAccount,
    masterKey: config.masterKey,
  });
  const explorer = new Explorer();
  return explorer;
}

function configureHostedWithResourceToken(config: ResourceToken): Explorer {
  const parsedResourceToken = parseResourceTokenConnectionString(config.resourceToken);
  const databaseAccount = {
    id: "",
    location: "",
    type: "",
    name: parsedResourceToken.accountEndpoint,
    kind: AccountKind.GlobalDocumentDB,
    properties: { documentEndpoint: parsedResourceToken.accountEndpoint },
  };
  updateUserContext({
    databaseAccount,
    authType: AuthType.ResourceToken,
    resourceToken: parsedResourceToken.resourceToken,
    endpoint: parsedResourceToken.accountEndpoint,
    parsedResourceToken: {
      databaseId: parsedResourceToken.databaseId,
      collectionId: parsedResourceToken.collectionId,
      partitionKey: parsedResourceToken.partitionKey,
    },
  });
  const explorer = new Explorer();
  return explorer;
}

/**
 * Initialization for FabricMessageV2
 * TODO: delete when FabricMessageV2 is deprecated
 * @param params
 * @returns
 */
function createExplorerFabricLegacy(
  params: { connectionId: string; isVisible: boolean },
  fabricClientRpcVersion: string,
): Explorer {
  const artifactInfo: FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY] = {
    connectionId: params.connectionId,
    resourceTokenInfo: undefined,
  };

  updateUserContext({
    fabricContext: {
      fabricClientRpcVersion,
      isReadOnly: true,
      isVisible: params.isVisible ?? true,
      databaseName: undefined,
      artifactType: CosmosDbArtifactType.MIRRORED_KEY,
      artifactInfo,
    },
    authType: AuthType.ConnectionString,
    databaseAccount: {
      id: "",
      location: "",
      type: "",
      name: "Mounted",
      kind: AccountKind.Default,
      properties: {
        documentEndpoint: undefined,
      },
    },
  });
  const explorer = new Explorer();
  return explorer;
}

/**
 * Initialization for FabricMessageV3 and above
 * @param params
 * @returns
 */
const createExplorerFabric = (
  params: InitializeMessageV3<CosmosDbArtifactType>,
  fabricClientRpcVersion: string,
): Explorer => {
  updateUserContext({
    fabricContext: {
      fabricClientRpcVersion,
      databaseName: undefined,
      isVisible: params.isVisible,
      isReadOnly: params.isReadOnly,
      artifactType: params.artifactType,
      artifactInfo: undefined,
    },
  });

  if (params.artifactType === CosmosDbArtifactType.MIRRORED_KEY) {
    updateUserContext({
      authType: AuthType.ConnectionString, // TODO: will need its own type
      databaseAccount: {
        id: "",
        location: "",
        type: "",
        name: "Mounted", // TODO: not used?
        kind: AccountKind.Default,
        properties: {
          documentEndpoint: undefined,
        },
      },
      fabricContext: {
        ...userContext.fabricContext,
        artifactInfo: {
          connectionId: (params.artifactConnectionInfo as ArtifactConnectionInfo[CosmosDbArtifactType.MIRRORED_KEY])
            .connectionId,
          resourceTokenInfo: undefined,
        },
      },
    });
  } else if (params.artifactType === CosmosDbArtifactType.MIRRORED_AAD) {
    updateUserContext({
      databaseAccount: {
        id: "",
        location: "",
        type: "",
        name: "Mounted", // TODO: not used?
        kind: AccountKind.Default,
        properties: {
          documentEndpoint: undefined,
        },
      },
      authType: AuthType.AAD,
      dataPlaneRbacEnabled: true,
      aadToken: undefined,
      masterKey: undefined,
      fabricContext: {
        ...userContext.fabricContext,
        artifactInfo: undefined,
      },
    });
  } else if (params.artifactType === CosmosDbArtifactType.NATIVE) {
    const nativeParams = params as InitializeMessageV3<CosmosDbArtifactType.NATIVE>;
    // Make it behave like Hosted/AAD/RBAC
    updateUserContext({
      databaseAccount: {
        id: "",
        location: "",
        type: "",
        name: "Native", // TODO: not used?
        kind: AccountKind.Default,
        properties: {
          documentEndpoint: nativeParams.artifactConnectionInfo.accountEndpoint,
        },
      },
      authType: AuthType.AAD,
      dataPlaneRbacEnabled: true,
      aadToken: nativeParams.artifactConnectionInfo.accessToken,
      masterKey: undefined,
      fabricContext: {
        ...userContext.fabricContext,
        databaseName: nativeParams.artifactConnectionInfo.databaseName,
      },
    });
  }

  const explorer = new Explorer();
  return explorer;
};

function configureWithEncryptedToken(config: EncryptedToken): Explorer {
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(config.encryptedTokenMetadata.apiKind);
  updateUserContext({
    authType: AuthType.EncryptedToken,
    accessToken: encodeURIComponent(config.encryptedToken),
    databaseAccount: {
      id: "",
      location: "",
      type: "",
      name: config.encryptedTokenMetadata.accountName,
      kind: getDatabaseAccountKindFromExperience(apiExperience),
      properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
    },
  });
  const explorer = new Explorer();
  return explorer;
}

function configureEmulator(): Explorer {
  updateUserContext({
    databaseAccount: emulatorAccount,
    authType: AuthType.MasterKey,
  });
  const explorer = new Explorer();
  return explorer;
}

export async function fetchAndUpdateKeys(subscriptionId: string, resourceGroup: string, account: string) {
  Logger.logInfo(`Fetching keys for ${userContext.apiType} account ${account}`, "Explorer/fetchAndUpdateKeys");
  let keys;
  try {
    keys = await listKeys(subscriptionId, resourceGroup, account);
    Logger.logInfo(`Keys fetched for ${userContext.apiType} account ${account}`, "Explorer/fetchAndUpdateKeys");
    updateUserContext({
      masterKey: keys.primaryMasterKey,
    });
  } catch (error) {
    if (error.code === "AuthorizationFailed") {
      keys = await getReadOnlyKeys(subscriptionId, resourceGroup, account);
      Logger.logInfo(
        `Read only Keys fetched for ${userContext.apiType} account ${account}`,
        "Explorer/fetchAndUpdateKeys",
      );
      updateUserContext({
        masterKey: keys.primaryReadonlyMasterKey,
      });
    } else {
      logConsoleError(`Error occurred fetching keys for the account." ${error.message}`);
      Logger.logError(
        `Error during fetching keys or updating user context: ${error} for ${userContext.apiType} account ${account}`,
        "Explorer/fetchAndUpdateKeys",
      );
      throw error;
    }
  }
}

async function configurePortal(): Promise<Explorer> {
  updateUserContext({
    authType: AuthType.AAD,
  });

  let explorer: Explorer;
  return new Promise((resolve) => {
    // In development mode, try to load the iframe message from session storage.
    // This allows webpack hot reload to function properly in the portal
    if (process.env.NODE_ENV === "development" && !window.location.search.includes("disablePortalInitCache")) {
      const initMessage = sessionStorage.getItem("portalDataExplorerInitMessage");
      if (initMessage) {
        const message = JSON.parse(initMessage) as DataExplorerInputsFrame;
        console.warn(
          "Loaded cached portal iframe message from session storage. Do a full page refresh to get a new message",
        );
        console.dir(message);
        updateContextsFromPortalMessage(message);
        explorer = new Explorer();

        // In development mode, save the iframe message from the portal in session storage.
        // This allows webpack hot reload to funciton properly
        if (process.env.NODE_ENV === "development") {
          sessionStorage.setItem("portalDataExplorerInitMessage", JSON.stringify(message));
        }
        resolve(explorer);
      }
    }

    // In the Portal, configuration of Explorer happens via iframe message
    window.addEventListener(
      "message",
      async (event) => {
        if (isInvalidParentFrameOrigin(event)) {
          return;
        }

        if (!shouldProcessMessage(event)) {
          return;
        }

        // Check for init message
        const message: PortalMessage = event.data?.data;
        const inputs = message?.inputs;
        const openAction = message?.openAction;
        if (inputs) {
          updateContextsFromPortalMessage(inputs);

          const { databaseAccount: account, subscriptionId, resourceGroup } = userContext;

          if (userContext.apiType === "SQL") {
            checkAndUpdateSelectedRegionalEndpoint();
          }

          let dataPlaneRbacEnabled;
          if (isDataplaneRbacSupported(userContext.apiType)) {
            if (LocalStorageUtility.hasItem(StorageKey.DataPlaneRbacEnabled)) {
              const isDataPlaneRbacSetting = LocalStorageUtility.getEntryString(StorageKey.DataPlaneRbacEnabled);
              Logger.logInfo(
                `Local storage RBAC setting for ${userContext.apiType} account ${account.name} is ${isDataPlaneRbacSetting}`,
                "Explorer/configurePortal",
              );

              if (isDataPlaneRbacSetting === Constants.RBACOptions.setAutomaticRBACOption) {
                dataPlaneRbacEnabled = account.properties.disableLocalAuth;
              } else {
                dataPlaneRbacEnabled = isDataPlaneRbacSetting === Constants.RBACOptions.setTrueRBACOption;
              }
            } else {
              Logger.logInfo(
                `Local storage does not exist for ${userContext.apiType} account ${account.name} with disable local auth set to ${account.properties.disableLocalAuth} is ${dataPlaneRbacEnabled}`,
                "Explorer/configurePortal",
              );
              dataPlaneRbacEnabled = account.properties.disableLocalAuth;
            }
            Logger.logInfo(
              `Data Plane RBAC value for ${userContext.apiType} account ${account.name} with disable local auth set to ${account.properties.disableLocalAuth} is ${dataPlaneRbacEnabled}`,
              "Explorer/configurePortal",
            );

            if (!dataPlaneRbacEnabled) {
              Logger.logInfo(
                `Calling fetch keys for ${userContext.apiType} account ${account.name}`,
                "Explorer/configurePortal",
              );
              await fetchAndUpdateKeys(subscriptionId, resourceGroup, account.name);
            } else {
              Logger.logInfo(
                `Trying to silently acquire MSAL token for ${userContext.apiType} account ${account.name}`,
                "Explorer/configurePortal",
              );
              try {
                const aadToken = await acquireMsalTokenForAccount(userContext.databaseAccount, true);
                updateUserContext({ aadToken: aadToken });
                useDataPlaneRbac.setState({ aadTokenUpdated: true });
              } catch (authError) {
                Logger.logWarning(
                  `Failed to silently acquire authorization token from MSAL: ${authError} for ${userContext.apiType} account ${account}`,
                  "Explorer/configurePortal",
                );
                logConsoleError("Failed to silently acquire authorization token: " + authError);
              }
            }

            updateUserContext({ dataPlaneRbacEnabled });
            useDataPlaneRbac.setState({ dataPlaneRbacEnabled: dataPlaneRbacEnabled });
          } else if (userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo") {
            Logger.logInfo(
              `Calling fetch keys for ${userContext.apiType} account ${account.name}`,
              "Explorer/configurePortal",
            );
            await fetchAndUpdateKeys(subscriptionId, resourceGroup, account.name);
          }

          explorer = new Explorer();
          resolve(explorer);

          if (openAction) {
            handleOpenAction(openAction, useDatabases.getState().databases, explorer);
          }
        } else if (shouldForwardMessage(message, event.origin)) {
          sendMessage(message);
        } else if (event.data?.type === MessageTypes.CloseTab) {
          if (
            event.data?.data?.tabId === "QuickstartPSQLShell" ||
            event.data?.data?.tabId === "QuickstartVcoreMongoShell"
          ) {
            useTabs.getState().closeReactTab(ReactTabKind.Quickstart);
          } else {
            useTabs.getState().closeTabsByComparator((tab) => tab.tabId === event.data?.data?.tabId);
          }
        } else if (message?.type === MessageTypes.RefreshResources) {
          explorer.onRefreshResourcesClick();
        }
      },
      false,
    );

    sendReadyMessage();
  });
}

function shouldForwardMessage(message: PortalMessage, messageOrigin: string) {
  // Only allow forwarding messages from the same origin
  return messageOrigin === window.document.location.origin && message.type === MessageTypes.TelemetryInfo;
}

function updateAADEndpoints(portalEnv: PortalEnv) {
  switch (portalEnv) {
    case "prod1":
    case "prod":
      updateConfigContext({
        AAD_ENDPOINT: Constants.AadEndpoints.Prod,
      });
      break;
    case "fairfax":
      updateConfigContext({
        AAD_ENDPOINT: Constants.AadEndpoints.Fairfax,
      });
      break;
    case "mooncake":
      updateConfigContext({
        AAD_ENDPOINT: Constants.AadEndpoints.Mooncake,
      });
      break;

    default:
      console.warn(`Unknown portal environment: ${portalEnv}`);
      break;
  }
}

function checkAndUpdateSelectedRegionalEndpoint() {
  const accountName = userContext.databaseAccount?.name;
  if (hasState({ componentName: AppStateComponentNames.SelectedRegionalEndpoint, globalAccountName: accountName })) {
    const storedRegionalEndpoint = loadState({
      componentName: AppStateComponentNames.SelectedRegionalEndpoint,
      globalAccountName: accountName,
    }) as string;
    const validEndpoint = userContext.databaseAccount?.properties?.readLocations?.find(
      (loc) => loc.documentEndpoint === storedRegionalEndpoint,
    );
    const validWriteEndpoint = userContext.databaseAccount?.properties?.writeLocations?.find(
      (loc) => loc.documentEndpoint === storedRegionalEndpoint,
    );
    if (validEndpoint) {
      updateUserContext({
        selectedRegionalEndpoint: storedRegionalEndpoint,
        writeEnabledInSelectedRegion: !!validWriteEndpoint,
        refreshCosmosClient: true,
      });
      useClientWriteEnabled.setState({ clientWriteEnabled: !!validWriteEndpoint });
    } else {
      deleteState({ componentName: AppStateComponentNames.SelectedRegionalEndpoint, globalAccountName: accountName });
      updateUserContext({
        writeEnabledInSelectedRegion: true,
      });
      useClientWriteEnabled.setState({ clientWriteEnabled: true });
    }
  } else {
    updateUserContext({
      writeEnabledInSelectedRegion: true,
    });
    useClientWriteEnabled.setState({ clientWriteEnabled: true });
  }
}

function updateContextsFromPortalMessage(inputs: DataExplorerInputsFrame) {
  if (
    configContext.PORTAL_BACKEND_ENDPOINT &&
    configContext.platform === Platform.Portal &&
    process.env.NODE_ENV === "development"
  ) {
    inputs.portalBackendEndpoint = configContext.PROXY_PATH;
  }

  const authorizationToken = inputs.authorizationToken || "";
  const databaseAccount = inputs.databaseAccount;
  const aadToken = inputs.aadToken || "";

  updateConfigContext({
    ARM_ENDPOINT: normalizeArmEndpoint(inputs.csmEndpoint || configContext.ARM_ENDPOINT),
    MONGO_PROXY_ENDPOINT: inputs.mongoProxyEndpoint,
    CASSANDRA_PROXY_ENDPOINT: inputs.cassandraProxyEndpoint,
    PORTAL_BACKEND_ENDPOINT: inputs.portalBackendEndpoint,
  });

  updateAADEndpoints(inputs.serverId as PortalEnv);

  updateUserContext({
    authorizationToken,
    aadToken,
    databaseAccount,
    resourceGroup: inputs.resourceGroup,
    subscriptionId: inputs.subscriptionId,
    tenantId: inputs.tenantId,
    subscriptionType: inputs.subscriptionType,
    userName: inputs.userName,
    quotaId: inputs.quotaId,
    portalEnv: inputs.serverId as PortalEnv,
    hasWriteAccess: inputs.hasWriteAccess ?? true,
    collectionCreationDefaults: inputs.defaultCollectionThroughput,
    isTryCosmosDBSubscription: inputs.isTryCosmosDBSubscription,
    feedbackPolicies: inputs.feedbackPolicies,
  });

  if (inputs.isPostgresAccount) {
    updateUserContext({ apiType: "Postgres", isReplica: !!inputs.isReplica });

    if (inputs.connectionStringParams) {
      // TODO: Remove after the nodes param has been updated to be a flat array in the OSS extension
      let flattenedNodesArray: Node[] = [];
      inputs.connectionStringParams.nodes?.forEach((node: Node | Node[]) => {
        if (Array.isArray(node)) {
          flattenedNodesArray = [...flattenedNodesArray, ...node];
        } else {
          flattenedNodesArray.push(node);
        }
      });
      inputs.connectionStringParams.nodes = flattenedNodesArray;
      updateUserContext({ postgresConnectionStrParams: inputs.connectionStringParams });
    }
  }

  if (inputs.isVCoreMongoAccount) {
    if (inputs.connectionStringParams) {
      updateUserContext({
        apiType: "VCoreMongo",
        vcoreMongoConnectionParams: inputs.connectionStringParams,
      });
    }
  }

  if (inputs.features) {
    Object.assign(userContext.features, extractFeatures(new URLSearchParams(inputs.features)));
  }

  if (configContext.platform === Platform.Portal && inputs.containerCopyEnabled && userContext.apiType === "SQL") {
    Object.assign(userContext.features, { enableContainerCopy: inputs.containerCopyEnabled });
  }

  if (inputs.flights) {
    if (inputs.flights.indexOf(Flights.AutoscaleTest) !== -1) {
      userContext.features.autoscaleDefault;
    }
    if (inputs.flights.indexOf(Flights.PartitionKeyTest) !== -1) {
      userContext.features.partitionKeyDefault = true;
    }
    if (inputs.flights.indexOf(Flights.PartitionKeyTest) !== -1) {
      userContext.features.partitionKeyDefault = true;
    }
    if (inputs.flights.indexOf(Flights.PKPartitionKeyTest) !== -1) {
      userContext.features.partitionKeyDefault2 = true;
    }
    if (inputs.flights.indexOf(Flights.PhoenixNotebooks) !== -1) {
      userContext.features.phoenixNotebooks = true;
    }
    if (inputs.flights.indexOf(Flights.PhoenixFeatures) !== -1) {
      userContext.features.phoenixFeatures = true;
    }
    if (inputs.flights.indexOf(Flights.NotebooksDownBanner) !== -1) {
      userContext.features.notebooksDownBanner = true;
    }
    if (inputs.flights.indexOf(Flights.PublicGallery) !== -1) {
      userContext.features.publicGallery = true;
    }
  }
}

interface PortalMessage {
  openAction?: DataExplorerAction;
  actionType?: ActionType;
  type?: MessageTypes;
  inputs?: DataExplorerInputsFrame;
}

async function updateContextForCopilot(explorer: Explorer): Promise<void> {
  await explorer.configureCopilot();
}

async function updateContextForSampleData(explorer: Explorer): Promise<void> {
  const copilotEnabled =
    userContext.apiType === "SQL" && userContext.features.enableCopilot && useQueryCopilot.getState().copilotEnabled;

  if (!copilotEnabled) {
    return;
  }

  const url: string = createUri(configContext.PORTAL_BACKEND_ENDPOINT, "/api/sampledata");
  const authorizationHeader = getAuthorizationHeader();
  const headers = { [authorizationHeader.header]: authorizationHeader.token };

  const response = await window.fetch(url, {
    headers,
  });

  if (!response.ok) {
    return undefined;
  }

  const data: SampledataconnectionResponse = await response.json();
  const sampleDataConnectionInfo = parseResourceTokenConnectionString(data.connectionString);
  updateUserContext({ sampleDataConnectionInfo });

  explorer.refreshSampleData();
}

interface SampledataconnectionResponse {
  connectionString: string;
}

const restoreOpenTabs = () => {
  const openTabsState = readSubComponentState<(DataExplorerAction | undefined)[]>(
    AppStateComponentNames.DataExplorerAction,
    OPEN_TABS_SUBCOMPONENT_NAME,
    undefined,
    [],
  );
  openTabsState.forEach((openTabState) => {
    if (openTabState) {
      handleOpenAction(openTabState, useDatabases.getState().databases, this);
    }
  });
};
