import { isPublicInternetAccessAllowed } from "Common/DatabaseAccountUtility";
import { sendMessage } from "Common/MessageHandler";
import { Platform, configContext } from "ConfigContext";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { getCopilotEnabled, isCopilotFeatureRegistered } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { IGalleryItem } from "Juno/JunoClient";
import { scheduleRefreshDatabaseResourceToken } from "Platform/Fabric/FabricUtil";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { allowedNotebookServerUrls, validateEndpoint } from "Utils/EndpointUtils";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import * as ko from "knockout";
import React from "react";
import _ from "underscore";
import shallow from "zustand/shallow";
import { AuthType } from "../AuthType";
import { BindingHandlersRegisterer } from "../Bindings/BindingHandlersRegisterer";
import * as Constants from "../Common/Constants";
import { Areas, ConnectionStatusType, HttpStatusCodes, PoolIdType } from "../Common/Constants";
import { getErrorMessage, getErrorStack, handleError } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { QueriesClient } from "../Common/QueriesClient";
import { readCollection, readSampleCollection } from "../Common/dataAccess/readCollection";
import { readDatabases } from "../Common/dataAccess/readDatabases";
import * as DataModels from "../Contracts/DataModels";
import { ContainerConnectionInfo, IPhoenixServiceInfo, IProvisionData, IResponse } from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { GitHubOAuthService } from "../GitHub/GitHubOAuthService";
import { PhoenixClient } from "../Phoenix/PhoenixClient";
import * as ExplorerSettings from "../Shared/ExplorerSettings";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { isAccountNewerThanThresholdInMs, userContext } from "../UserContext";
import { getCollectionName, getUploadName } from "../Utils/APITypeUtils";
import { isCapabilityEnabled } from "../Utils/CapabilityUtils";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../Utils/NotificationConsoleUtils";
import { update } from "../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { useSidePanel } from "../hooks/useSidePanel";
import { useTabs } from "../hooks/useTabs";
import "./ComponentRegisterer";
import { DialogProps, useDialog } from "./Controls/Dialog";
import { GalleryTab as GalleryTabKind } from "./Controls/NotebookGallery/GalleryViewerComponent";
import { useCommandBar } from "./Menus/CommandBar/CommandBarComponentAdapter";
import { NotebookContentItem } from "./Notebook/NotebookContentItem";
import type NotebookManager from "./Notebook/NotebookManager";
import { useNotebook } from "./Notebook/useNotebook";
import { AddCollectionPanel } from "./Panes/AddCollectionPanel";
import { CassandraAddCollectionPane } from "./Panes/CassandraAddCollectionPane/CassandraAddCollectionPane";
import { ExecuteSprocParamsPane } from "./Panes/ExecuteSprocParamsPane/ExecuteSprocParamsPane";
import { UploadItemsPane } from "./Panes/UploadItemsPane/UploadItemsPane";
import { CassandraAPIDataClient, TableDataClient, TablesAPIDataClient } from "./Tables/TableDataClient";
import TabsBase from "./Tabs/TabsBase";
import TerminalTab from "./Tabs/TerminalTab";
import Database from "./Tree/Database";
import ResourceTokenCollection from "./Tree/ResourceTokenCollection";
import { ResourceTreeAdapter } from "./Tree/ResourceTreeAdapter";
import StoredProcedure from "./Tree/StoredProcedure";
import { useDatabases } from "./useDatabases";
import { useSelectedNode } from "./useSelectedNode";

BindingHandlersRegisterer.registerBindingHandlers();

export default class Explorer {
  public isFixedCollectionWithSharedThroughputSupported: ko.Computed<boolean>;
  public queriesClient: QueriesClient;
  public tableDataClient: TableDataClient;

  // Resource Tree
  private resourceTree: ResourceTreeAdapter;

  // Tabs
  public isTabsContentExpanded: ko.Observable<boolean>;

  public gitHubOAuthService: GitHubOAuthService;

  // Notebooks
  public notebookManager?: NotebookManager;

  private notebookToImport: {
    name: string;
    content: string;
  };

  private static readonly MaxNbDatabasesToAutoExpand = 5;
  public phoenixClient: PhoenixClient;
  constructor() {
    const startKey: number = TelemetryProcessor.traceStart(Action.InitializeDataExplorer, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    this.phoenixClient = new PhoenixClient(userContext?.databaseAccount?.id);
    useNotebook.subscribe(
      () => this.refreshCommandBarButtons(),
      (state) => state.isNotebooksEnabledForAccount,
    );

    this.queriesClient = new QueriesClient(this);

    useSelectedNode.subscribe(() => {
      // Make sure switching tabs restores tabs display
      this.isTabsContentExpanded(false);
    });

    this.isFixedCollectionWithSharedThroughputSupported = ko.computed(() => {
      if (userContext.features.enableFixedCollectionWithSharedThroughput) {
        return true;
      }

      if (!userContext.databaseAccount) {
        return false;
      }

      return isCapabilityEnabled("EnableMongo");
    });

    useTabs.subscribe(
      (openedTabs: TabsBase[]) => {
        if (openedTabs.length === 0) {
          useSelectedNode.getState().setSelectedNode(undefined);
          useCommandBar.getState().setContextButtons([]);
        }
      },
      (state) => state.openedTabs,
    );

    this.isTabsContentExpanded = ko.observable(false);

    document.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
      },
      false,
    );

    $(() => {
      $(document.body).click(() => $(".commandDropdownContainer").hide());
    });

    switch (userContext.apiType) {
      case "Tables":
        this.tableDataClient = new TablesAPIDataClient();
        break;
      case "Cassandra":
        this.tableDataClient = new CassandraAPIDataClient();
        break;
      default:
    }

    this._initSettings();

    TelemetryProcessor.traceSuccess(
      Action.InitializeDataExplorer,
      { dataExplorerArea: Constants.Areas.ResourceTree },
      startKey,
    );

    useNotebook.subscribe(
      async () => this.initiateAndRefreshNotebookList(),
      (state) => [state.isNotebookEnabled, state.isRefreshed],
      shallow,
    );

    this.resourceTree = new ResourceTreeAdapter(this);

    // Override notebook server parameters from URL parameters
    if (
      userContext.features.notebookServerUrl &&
      validateEndpoint(userContext.features.notebookServerUrl, allowedNotebookServerUrls) &&
      userContext.features.notebookServerToken
    ) {
      useNotebook.getState().setNotebookServerInfo({
        notebookServerEndpoint: userContext.features.notebookServerUrl,
        authToken: userContext.features.notebookServerToken,
        forwardingId: undefined,
      });
    }

    if (userContext.features.notebookBasePath) {
      useNotebook.getState().setNotebookBasePath(userContext.features.notebookBasePath);
    }

    this.refreshExplorer();
  }

  public async initiateAndRefreshNotebookList(): Promise<void> {
    if (!this.notebookManager) {
      const NotebookManager = (await import(/* webpackChunkName: "NotebookManager" */ "./Notebook/NotebookManager"))
        .default;
      this.notebookManager = new NotebookManager();
      this.notebookManager.initialize({
        container: this,
        resourceTree: this.resourceTree,
        refreshCommandBarButtons: () => this.refreshCommandBarButtons(),
      });
    }

    this.refreshCommandBarButtons();
  }

  public openEnableSynapseLinkDialog(): void {
    const addSynapseLinkDialogProps: DialogProps = {
      linkProps: {
        linkText: "Learn more",
        linkUrl: "https://aka.ms/cosmosdb-synapselink",
      },
      isModal: true,
      title: `Enable Azure Synapse Link on your Cosmos DB account`,
      subText: `Enable Azure Synapse Link to perform near real time analytical analytics on this account, without impacting the performance of your transactional workloads.
      Azure Synapse Link brings together Cosmos Db Analytical Store and Synapse Analytics`,
      primaryButtonText: "Enable Azure Synapse Link",
      secondaryButtonText: "Cancel",

      onPrimaryButtonClick: async () => {
        const startTime = TelemetryProcessor.traceStart(Action.EnableAzureSynapseLink);
        const clearInProgressMessage = logConsoleProgress(
          "Enabling Azure Synapse Link for this account. This may take a few minutes before you can enable analytical store for this account.",
        );
        useNotebook.getState().setIsSynapseLinkUpdating(true);
        useDialog.getState().closeDialog();

        try {
          await update(userContext.subscriptionId, userContext.resourceGroup, userContext.databaseAccount.name, {
            properties: {
              enableAnalyticalStorage: true,
            },
          });

          clearInProgressMessage();
          logConsoleInfo("Enabled Azure Synapse Link for this account");
          TelemetryProcessor.traceSuccess(Action.EnableAzureSynapseLink, {}, startTime);
          userContext.databaseAccount.properties.enableAnalyticalStorage = true;
        } catch (error) {
          clearInProgressMessage();
          logConsoleError(`Enabling Azure Synapse Link for this account failed. ${getErrorMessage(error)}`);
          TelemetryProcessor.traceFailure(Action.EnableAzureSynapseLink, {}, startTime);
        } finally {
          useNotebook.getState().setIsSynapseLinkUpdating(false);
        }
      },

      onSecondaryButtonClick: () => {
        useDialog.getState().closeDialog();
        TelemetryProcessor.traceCancel(Action.EnableAzureSynapseLink);
      },
    };
    useDialog.getState().openDialog(addSynapseLinkDialogProps);
    TelemetryProcessor.traceStart(Action.EnableAzureSynapseLink);

    // TODO: return result
  }

  public openNPSSurveyDialog(): void {
    if (!Platform.Portal) {
      return;
    }

    const ONE_DAY_IN_MS = 86400000;
    const SEVEN_DAYS_IN_MS = 604800000;

    // Try Cosmos DB subscription - survey shown to 100% of users at day 1 in Data Explorer.
    if (userContext.isTryCosmosDBSubscription) {
      if (isAccountNewerThanThresholdInMs(userContext.databaseAccount?.systemData?.createdAt || "", ONE_DAY_IN_MS)) {
        Logger.logInfo(
          `Sending message to Portal to check if NPS Survey can be displayed in Try Cosmos DB ${userContext.apiType}`,
          "Explorer/openNPSSurveyDialog",
        );
        sendMessage({ type: MessageTypes.DisplayNPSSurvey });
      }
    } else {
      // Show survey when an existing account is older than 7 days
      if (
        !isAccountNewerThanThresholdInMs(userContext.databaseAccount?.systemData?.createdAt || "", SEVEN_DAYS_IN_MS)
      ) {
        Logger.logInfo(
          `Sending message to Portal to check if NPS Survey can be displayed for existing ${userContext.apiType} account older than 7 days`,
          "Explorer/openNPSSurveyDialog",
        );
        sendMessage({ type: MessageTypes.DisplayNPSSurvey });
      }
    }
  }

  public async openCESCVAFeedbackBlade(): Promise<void> {
    sendMessage({ type: MessageTypes.OpenCESCVAFeedbackBlade });
    Logger.logInfo(
      `CES CVA Feedback logging current date when survey is shown ${Date.now().toString()}`,
      "Explorer/openCESCVAFeedbackBlade",
    );
  }

  public async refreshDatabaseForResourceToken(): Promise<void> {
    const databaseId = userContext.parsedResourceToken?.databaseId;
    const collectionId = userContext.parsedResourceToken?.collectionId;
    if (!databaseId || !collectionId) {
      return;
    }

    const collection: DataModels.Collection = await readCollection(databaseId, collectionId);
    const resourceTokenCollection = new ResourceTokenCollection(this, databaseId, collection);
    useDatabases.setState({ resourceTokenCollection });
    useSelectedNode.getState().setSelectedNode(resourceTokenCollection);
  }

  public async refreshAllDatabases(): Promise<void> {
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadDatabases, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    try {
      const databases: DataModels.Database[] = await readDatabases();
      TelemetryProcessor.traceSuccess(
        Action.LoadDatabases,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
        },
        startKey,
      );
      const currentDatabases = useDatabases.getState().databases;
      const deltaDatabases = this.getDeltaDatabases(databases, currentDatabases);
      let updatedDatabases = currentDatabases.filter(
        (database) => !deltaDatabases.toDelete.some((deletedDatabase) => deletedDatabase.id() === database.id()),
      );
      updatedDatabases = [...updatedDatabases, ...deltaDatabases.toAdd].sort((db1, db2) =>
        db1.id().localeCompare(db2.id()),
      );
      useDatabases.setState({ databases: updatedDatabases });
      await this.refreshAndExpandNewDatabases(deltaDatabases.toAdd, updatedDatabases);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      TelemetryProcessor.traceFailure(
        Action.LoadDatabases,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey,
      );
      logConsoleError(`Error while refreshing databases: ${errorMessage}`);
    }
  }

  public onRefreshDatabasesKeyPress = (source: string, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.onRefreshResourcesClick();
      return false;
    }
    return true;
  };

  public onRefreshResourcesClick = (): void => {
    if (configContext.platform === Platform.Fabric) {
      scheduleRefreshDatabaseResourceToken(true).then(() => this.refreshAllDatabases());
      return;
    }

    userContext.authType === AuthType.ResourceToken
      ? this.refreshDatabaseForResourceToken()
      : this.refreshAllDatabases();
  };

  // Facade
  public provideFeedbackEmail = (): void => {
    window.open(Constants.Urls.feedbackEmail, "_blank");
  };

  public async allocateContainer(poolId: PoolIdType, mode?: string): Promise<void> {
    const shouldUseNotebookStates = poolId === PoolIdType.DefaultPoolId ? true : false;
    const notebookServerInfo = shouldUseNotebookStates
      ? useNotebook.getState().notebookServerInfo
      : useQueryCopilot.getState().notebookServerInfo;

    const isAllocating = shouldUseNotebookStates
      ? useNotebook.getState().isAllocating
      : useQueryCopilot.getState().isAllocatingContainer;
    if (
      isAllocating === false &&
      (notebookServerInfo === undefined ||
        (notebookServerInfo && notebookServerInfo.notebookServerEndpoint === undefined))
    ) {
      const connectionStatus: ContainerConnectionInfo = {
        status: ConnectionStatusType.Connecting,
      };

      shouldUseNotebookStates && useNotebook.getState().setConnectionInfo(connectionStatus);

      let connectionInfo;
      let provisionData: IProvisionData;
      try {
        TelemetryProcessor.traceStart(Action.PhoenixConnection, {
          dataExplorerArea: Areas.Notebook,
        });
        if (shouldUseNotebookStates) {
          useNotebook.getState().setIsAllocating(true);
          provisionData = {
            cosmosEndpoint: userContext?.databaseAccount?.properties?.documentEndpoint,
            poolId: undefined,
          };
        } else {
          useQueryCopilot.getState().setIsAllocatingContainer(true);
          provisionData = {
            poolId: poolId,
            databaseId: useTabs.getState().activeTab.collection.databaseId,
            containerId: useTabs.getState().activeTab.collection.id(),
            mode: mode,
          };
        }
        connectionInfo = await this.phoenixClient.allocateContainer(provisionData);
        if (!connectionInfo?.data?.phoenixServiceUrl) {
          throw new Error(`PhoenixServiceUrl is invalid!`);
        }
        await this.setNotebookInfo(shouldUseNotebookStates, connectionInfo, connectionStatus);
        TelemetryProcessor.traceSuccess(Action.PhoenixConnection, {
          dataExplorerArea: Areas.Notebook,
        });
      } catch (error) {
        TelemetryProcessor.traceFailure(Action.PhoenixConnection, {
          dataExplorerArea: Areas.Notebook,
          status: error.status,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        });
        if (shouldUseNotebookStates) {
          connectionStatus.status = ConnectionStatusType.Failed;
          shouldUseNotebookStates
            ? useNotebook.getState().resetContainerConnection(connectionStatus)
            : useQueryCopilot.getState().resetContainerConnection();
          if (error?.status === HttpStatusCodes.Forbidden && error.message) {
            useDialog.getState().showOkModalDialog("Connection Failed", `${error.message}`);
          } else {
            useDialog
              .getState()
              .showOkModalDialog(
                "Connection Failed",
                "We are unable to connect to the temporary workspace. Please try again in a few minutes. If the error persists, file a support ticket.",
              );
          }
        }
        throw error;
      } finally {
        shouldUseNotebookStates
          ? useNotebook.getState().setIsAllocating(false)
          : useQueryCopilot.getState().setIsAllocatingContainer(false);
        this.refreshCommandBarButtons();
      }
    }
  }

  public async setNotebookInfo(
    shouldUseNotebookStates: boolean,
    connectionInfo: IResponse<IPhoenixServiceInfo>,
    connectionStatus: DataModels.ContainerConnectionInfo,
  ): Promise<void> {
    const containerData = {
      forwardingId: connectionInfo.data.forwardingId,
      dbAccountName: userContext.databaseAccount.name,
    };
    await this.phoenixClient.initiateContainerHeartBeat(shouldUseNotebookStates, containerData);

    connectionStatus.status = ConnectionStatusType.Connected;
    shouldUseNotebookStates && useNotebook.getState().setConnectionInfo(connectionStatus);

    const noteBookServerInfo = {
      notebookServerEndpoint:
        (validateEndpoint(userContext.features.notebookServerUrl, allowedNotebookServerUrls) &&
          userContext.features.notebookServerUrl) ||
        connectionInfo.data.phoenixServiceUrl,
      authToken: userContext.features.notebookServerToken || connectionInfo.data.authToken,
      forwardingId: connectionInfo.data.forwardingId,
    };
    shouldUseNotebookStates
      ? useNotebook.getState().setNotebookServerInfo(noteBookServerInfo)
      : useQueryCopilot.getState().setNotebookServerInfo(noteBookServerInfo);

    shouldUseNotebookStates &&
      this.notebookManager?.notebookClient
        .getMemoryUsage()
        .then((memoryUsageInfo) => useNotebook.getState().setMemoryUsageInfo(memoryUsageInfo));
  }

  private getDeltaDatabases(
    updatedDatabaseList: DataModels.Database[],
    databases: ViewModels.Database[],
  ): {
    toAdd: ViewModels.Database[];
    toDelete: ViewModels.Database[];
  } {
    const newDatabases: DataModels.Database[] = _.filter(updatedDatabaseList, (database: DataModels.Database) => {
      const databaseExists = _.some(
        databases,
        (existingDatabase: ViewModels.Database) => existingDatabase.id() === database.id,
      );
      return !databaseExists;
    });
    const databasesToAdd: ViewModels.Database[] = newDatabases.map(
      (newDatabase: DataModels.Database) => new Database(this, newDatabase),
    );

    const databasesToDelete: ViewModels.Database[] = [];
    databases.forEach((database: ViewModels.Database) => {
      const databasePresentInUpdatedList = _.some(
        updatedDatabaseList,
        (db: DataModels.Database) => db.id === database.id(),
      );
      if (!databasePresentInUpdatedList) {
        databasesToDelete.push(database);
      }
    });

    return { toAdd: databasesToAdd, toDelete: databasesToDelete };
  }

  private async refreshAndExpandNewDatabases(
    newDatabases: ViewModels.Database[],
    databases: ViewModels.Database[],
  ): Promise<void> {
    // we reload collections for all databases so the resource tree reflects any collection-level changes
    // i.e addition of stored procedures, etc.

    // If the user has a lot of databases, only load expanded databases.
    const databasesToLoad =
      databases.length <= Explorer.MaxNbDatabasesToAutoExpand
        ? databases
        : databases.filter((db) => db.isDatabaseExpanded() || db.id() === Constants.SavedQueries.DatabaseName);

    const startKey: number = TelemetryProcessor.traceStart(Action.LoadCollections, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    try {
      await Promise.all(
        databasesToLoad.map(async (database: ViewModels.Database) => {
          await database.loadCollections(true);
          const isNewDatabase: boolean = _.some(newDatabases, (db: ViewModels.Database) => db.id() === database.id());
          if (isNewDatabase) {
            database.expandDatabase();
          }
          useTabs
            .getState()
            .refreshActiveTab((tab) => tab.collection && tab.collection.getDatabase().id() === database.id());
          TelemetryProcessor.traceSuccess(
            Action.LoadCollections,
            { dataExplorerArea: Constants.Areas.ResourceTree },
            startKey,
          );
        }),
      );
    } catch (error) {
      TelemetryProcessor.traceFailure(
        Action.LoadCollections,
        {
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );
    }
  }

  private _initSettings() {
    if (!ExplorerSettings.hasSettingsDefined()) {
      ExplorerSettings.createDefaultSettings();
    } else {
      ExplorerSettings.ensurePriorityLevel();
    }
  }

  // TODO: Delete this function when ResourceTreeAdapter is removed.
  public async refreshContentItem(item: NotebookContentItem): Promise<void> {
    if (!useNotebook.getState().isNotebookEnabled || !this.notebookManager?.notebookContentClient) {
      const error = "Attempt to refresh notebook list, but notebook is not enabled";
      handleError(error, "Explorer/refreshContentItem");
      return Promise.reject(new Error(error));
    }

    await this.notebookManager?.notebookContentClient.updateItemChildrenInPlace(item);
  }

  public async openNotebookTerminal(kind: ViewModels.TerminalKind): Promise<void> {
    if (useNotebook.getState().isPhoenixFeatures) {
      await this.allocateContainer(PoolIdType.DefaultPoolId);
      const notebookServerInfo = useNotebook.getState().notebookServerInfo;
      if (notebookServerInfo && notebookServerInfo.notebookServerEndpoint !== undefined) {
        this.connectToNotebookTerminal(kind);
      } else {
        useDialog
          .getState()
          .showOkModalDialog(
            "Failed to connect",
            "Failed to connect to temporary workspace. This could happen because of network issues. Please refresh the page and try again.",
          );
      }
    } else {
      this.connectToNotebookTerminal(kind);
    }
  }

  private connectToNotebookTerminal(kind: ViewModels.TerminalKind): void {
    let title: string;

    switch (kind) {
      case ViewModels.TerminalKind.Default:
        title = "Terminal";
        break;

      case ViewModels.TerminalKind.Mongo:
        title = "Mongo Shell";
        break;

      case ViewModels.TerminalKind.Cassandra:
        title = "Cassandra Shell";
        break;

      case ViewModels.TerminalKind.Postgres:
        title = "PSQL Shell";
        break;

      case ViewModels.TerminalKind.VCoreMongo:
        title = "VCoreMongo Shell";
        break;

      default:
        throw new Error("Terminal kind: ${kind} not supported");
    }

    const terminalTabs: TerminalTab[] = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.Terminal, (tab) => tab.tabTitle().startsWith(title)) as TerminalTab[];

    let index = 1;
    if (terminalTabs.length > 0) {
      index = terminalTabs[terminalTabs.length - 1].index + 1;
    }

    const newTab = new TerminalTab({
      account: userContext.databaseAccount,
      tabKind: ViewModels.CollectionTabKind.Terminal,
      node: undefined,
      title: `${title} ${index}`,
      tabPath: `${title} ${index}`,
      collection: undefined,
      isTabsContentExpanded: ko.observable(true),
      onLoadStartKey: undefined,
      container: this,
      kind: kind,
      index: index,
    });

    useTabs.getState().activateNewTab(newTab);
  }

  public async openGallery(
    selectedTab?: GalleryTabKind,
    notebookUrl?: string,
    galleryItem?: IGalleryItem,
    isFavorite?: boolean,
  ): Promise<void> {
    const title = "Gallery";
    const GalleryTab = await (await import(/* webpackChunkName: "GalleryTab" */ "./Tabs/GalleryTab")).default;
    const galleryTab = useTabs
      .getState()
      .getTabs(ViewModels.CollectionTabKind.Gallery)
      .find((tab) => tab.tabTitle() === title);

    if (galleryTab instanceof GalleryTab) {
      useTabs.getState().activateTab(galleryTab);
    } else {
      useTabs.getState().activateNewTab(
        new GalleryTab(
          {
            tabKind: ViewModels.CollectionTabKind.Gallery,
            title,
            tabPath: title,
            onLoadStartKey: undefined,
            isTabsContentExpanded: ko.observable(true),
          },
          {
            account: userContext.databaseAccount,
            container: this,
            junoClient: this.notebookManager?.junoClient,
            selectedTab: selectedTab || GalleryTabKind.OfficialSamples,
            notebookUrl,
            galleryItem,
            isFavorite,
          },
        ),
      );
    }
  }

  public async onNewCollectionClicked(
    options: {
      databaseId?: string;
      isQuickstart?: boolean;
    } = {},
  ): Promise<void> {
    if (userContext.apiType === "Cassandra") {
      useSidePanel
        .getState()
        .openSidePanel(
          "Add Table",
          <CassandraAddCollectionPane explorer={this} cassandraApiClient={new CassandraAPIDataClient()} />,
        );
    } else {
      const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
      throughputCap && throughputCap !== -1
        ? await useDatabases.getState().loadAllOffers()
        : await useDatabases.getState().loadDatabaseOffers();
      useSidePanel
        .getState()
        .openSidePanel("New " + getCollectionName(), <AddCollectionPanel explorer={this} {...options} />);
    }
  }

  private refreshCommandBarButtons(): void {
    const activeTab = useTabs.getState().activeTab;
    if (activeTab) {
      activeTab.onActivate(); // TODO only update tabs buttons?
    } else {
      useCommandBar.getState().setContextButtons([]);
    }
  }

  public openUploadItemsPanePane(): void {
    useSidePanel.getState().openSidePanel("Upload " + getUploadName(), <UploadItemsPane />);
  }
  public openExecuteSprocParamsPanel(storedProcedure: StoredProcedure): void {
    useSidePanel
      .getState()
      .openSidePanel("Input parameters", <ExecuteSprocParamsPane storedProcedure={storedProcedure} />);
  }

  public async refreshExplorer(): Promise<void> {
    if (userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo") {
      userContext.authType === AuthType.ResourceToken
        ? this.refreshDatabaseForResourceToken()
        : this.refreshAllDatabases();
    }
    await useNotebook.getState().refreshNotebooksEnabledStateForAccount();

    // TODO: remove reference to isNotebookEnabled and isNotebooksEnabledForAccount
    const isNotebookEnabled =
      configContext.platform !== Platform.Fabric &&
      (userContext.features.notebooksDownBanner ||
        useNotebook.getState().isPhoenixNotebooks ||
        useNotebook.getState().isPhoenixFeatures);
    useNotebook.getState().setIsNotebookEnabled(isNotebookEnabled);
    useNotebook
      .getState()
      .setIsShellEnabled(useNotebook.getState().isPhoenixFeatures && isPublicInternetAccessAllowed());

    TelemetryProcessor.trace(Action.NotebookEnabled, ActionModifiers.Mark, {
      isNotebookEnabled,
      dataExplorerArea: Constants.Areas.Notebook,
    });

    await this.refreshSampleData();
  }

  public async configureCopilot(): Promise<void> {
    if (userContext.apiType !== "SQL" || !userContext.subscriptionId) {
      return;
    }
    const copilotEnabledPromise = getCopilotEnabled();
    const copilotUserDBEnabledPromise = isCopilotFeatureRegistered(userContext.subscriptionId);
    const [copilotEnabled, copilotUserDBEnabled] = await Promise.all([
      copilotEnabledPromise,
      copilotUserDBEnabledPromise,
    ]);
    const copilotSampleDBEnabled = LocalStorageUtility.getEntryString(StorageKey.CopilotSampleDBEnabled) === "true";
    useQueryCopilot.getState().setCopilotEnabled(copilotEnabled && copilotUserDBEnabled);
    useQueryCopilot.getState().setCopilotUserDBEnabled(copilotUserDBEnabled);
    useQueryCopilot
      .getState()
      .setCopilotSampleDBEnabled(copilotEnabled && copilotUserDBEnabled && copilotSampleDBEnabled);
  }

  public async refreshSampleData(): Promise<void> {
    if (!userContext.sampleDataConnectionInfo) {
      return;
    }

    const collection: DataModels.Collection = await readSampleCollection();
    if (!collection) {
      return;
    }

    const databaseId = userContext.sampleDataConnectionInfo?.databaseId;
    if (!databaseId) {
      return;
    }

    const sampleDataResourceTokenCollection = new ResourceTokenCollection(this, databaseId, collection, true);
    useDatabases.setState({ sampleDataResourceTokenCollection });
  }
}
