import * as msal from "@azure/msal-browser";
import { Link } from "@fluentui/react/lib/Link";
import { isPublicInternetAccessAllowed } from "Common/DatabaseAccountUtility";
import { sendMessage } from "Common/MessageHandler";
import { stringifyError } from "Common/stringifyError";
import { Platform, configContext } from "ConfigContext";
import { MessageTypes } from "Contracts/ExplorerContracts";
import { useDataPlaneRbac } from "Explorer/Panes/SettingsPane/SettingsPane";
import {
  isFabricMirrored,
  isFabricMirroredKey,
  isFabricNative,
  scheduleRefreshFabricToken,
} from "Platform/Fabric/FabricUtil";
import { acquireMsalTokenForAccount } from "Utils/AuthorizationUtils";
import { allowedNotebookServerUrls, validateEndpoint } from "Utils/EndpointUtils";
import { featureRegistered } from "Utils/FeatureRegistrationUtils";
import { update } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import * as ko from "knockout";
import React from "react";
import _ from "underscore";
import shallow from "zustand/shallow";
import { AuthType } from "../AuthType";
import { BindingHandlersRegisterer } from "../Bindings/BindingHandlersRegisterer";
import * as Constants from "../Common/Constants";
import { Areas, ConnectionStatusType, HttpStatusCodes, Notebook } from "../Common/Constants";
import { getErrorMessage, getErrorStack } from "../Common/ErrorHandlingUtils";
import * as Logger from "../Common/Logger";
import { QueriesClient } from "../Common/QueriesClient";
import { readCollection } from "../Common/dataAccess/readCollection";
import { readDatabases } from "../Common/dataAccess/readDatabases";
import * as DataModels from "../Contracts/DataModels";
import { ContainerConnectionInfo, IPhoenixServiceInfo, IProvisionData, IResponse } from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";
import { UploadDetailsRecord } from "../Contracts/ViewModels";
import MetricScenario from "../Metrics/MetricEvents";
import { ApplicationMetricPhase } from "../Metrics/ScenarioConfig";
import { scenarioMonitor } from "../Metrics/ScenarioMonitor";
import { PhoenixClient } from "../Phoenix/PhoenixClient";
import * as ExplorerSettings from "../Shared/ExplorerSettings";
import { Action, ActionModifiers } from "../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../Shared/Telemetry/TelemetryProcessor";
import { updateUserContext, userContext } from "../UserContext";
import { getCollectionName, getUploadName } from "../Utils/APITypeUtils";
import { isCapabilityEnabled } from "../Utils/CapabilityUtils";
import { logConsoleError, logConsoleInfo, logConsoleProgress } from "../Utils/NotificationConsoleUtils";
import { useSidePanel } from "../hooks/useSidePanel";
import { ReactTabKind, useTabs } from "../hooks/useTabs";
import "./ComponentRegisterer";
import { DialogProps, useDialog } from "./Controls/Dialog";
import { useCommandBar } from "./Menus/CommandBar/CommandBarComponentAdapter";
import type NotebookManager from "./Notebook/NotebookManager";
import { useNotebook } from "./Notebook/useNotebook";
import { AddCollectionPanel } from "./Panes/AddCollectionPanel/AddCollectionPanel";
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

  // Notebooks
  public notebookManager?: NotebookManager;

  private _isInitializingNotebooks: boolean;

  private static readonly MaxNbDatabasesToAutoExpand = 5;
  public phoenixClient: PhoenixClient;

  /**
   * Resolves when the initial refreshAllDatabases (including collection loading) completes.
   * Await this instead of calling refreshAllDatabases again to avoid duplicate concurrent loads.
   */
  public databasesRefreshed: Promise<void> = Promise.resolve();
  constructor() {
    const startKey: number = TelemetryProcessor.traceStart(Action.InitializeDataExplorer, {
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    this._isInitializingNotebooks = false;

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

    if (isFabricMirrored()) {
      useTabs.getState().closeReactTab(ReactTabKind.Home);
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
        refreshNotebookList: () => this.refreshNotebookList(),
      });
    }

    this.refreshCommandBarButtons();
    this.refreshNotebookList();
  }

  public openEnableSynapseLinkDialog(targetAccountOverride?: DataModels.AccountOverride): void {
    const subscriptionId = targetAccountOverride?.subscriptionId ?? userContext.subscriptionId;
    const resourceGroup = targetAccountOverride?.resourceGroup ?? userContext.resourceGroup;
    const accountName = targetAccountOverride?.accountName ?? userContext.databaseAccount.name;

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
          await update(subscriptionId, resourceGroup, accountName, {
            properties: {
              enableAnalyticalStorage: true,
            },
          });

          clearInProgressMessage();
          logConsoleInfo("Enabled Azure Synapse Link for this account");
          TelemetryProcessor.traceSuccess(Action.EnableAzureSynapseLink, {}, startTime);
          if (!targetAccountOverride) {
            userContext.databaseAccount.properties.enableAnalyticalStorage = true;
          }
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
  }

  public async openLoginForEntraIDPopUp(): Promise<void> {
    if (userContext.databaseAccount.properties?.documentEndpoint) {
      try {
        const aadToken = await acquireMsalTokenForAccount(userContext.databaseAccount, false);
        updateUserContext({ aadToken: aadToken });
        useDataPlaneRbac.setState({ aadTokenUpdated: true });
      } catch (error) {
        if (error instanceof msal.AuthError && error.errorCode === msal.BrowserAuthErrorCodes.popupWindowError) {
          logConsoleError(
            "We were unable to establish authorization for this account, due to pop-ups being disabled in the browser.\nPlease enable pop-ups for this site and try again",
          );
        } else {
          const errorJson = stringifyError(error);
          logConsoleError(
            `Failed to perform authorization for this account, due to the following error: \n${errorJson}`,
          );
        }
      }
    }
  }

  /**
   * Generates a VS Code DocumentDB connection URL using the current user's MongoDB connection parameters.
   * Double-encodes the updated connection string for safe usage in VS Code URLs.
   *
   * The DocumentDB VS Code extension requires double encoding for connection strings.
   * See: https://microsoft.github.io/vscode-documentdb/manual/how-to-construct-url.html#double-encoding
   *
   * @returns {string} The encoded VS Code DocumentDB connection URL.
   */
  private getDocumentDbUrl() {
    const { adminLogin: adminLoginuserName = "", connectionString = "" } = userContext.vcoreMongoConnectionParams;
    const updatedConnectionString = connectionString.replace(/<(user|username)>:<password>/i, adminLoginuserName);
    const encodedUpdatedConnectionString = encodeURIComponent(encodeURIComponent(updatedConnectionString));
    const documentDbUrl = `vscode://ms-azuretools.vscode-documentdb?connectionString=${encodedUpdatedConnectionString}`;
    return documentDbUrl;
  }

  private getCosmosDbUrl() {
    const activeTab = useTabs.getState().activeTab;
    const resourceId = encodeURIComponent(userContext.databaseAccount.id);
    const database = encodeURIComponent(activeTab?.collection?.databaseId);
    const container = encodeURIComponent(activeTab?.collection?.id());
    const baseUrl = `vscode://ms-azuretools.vscode-cosmosdb?resourceId=${resourceId}`;
    const vscodeUrl = activeTab ? `${baseUrl}&database=${database}&container=${container}` : baseUrl;
    return vscodeUrl;
  }

  private getVSCodeUrl(): string {
    const isvCore = (userContext.apiType || userContext.databaseAccount.kind) === "VCoreMongo";
    return isvCore ? this.getDocumentDbUrl() : this.getCosmosDbUrl();
  }

  public openInVsCode(): void {
    const vscodeUrl = this.getVSCodeUrl();
    const openVSCodeDialogProps: DialogProps = {
      linkProps: {
        linkText: "Download Visual Studio Code",
        linkUrl: "https://code.visualstudio.com/download",
      },
      isModal: true,
      title: `Open your Azure Cosmos DB account in Visual Studio Code`,
      subText: `Please ensure Visual Studio Code is installed on your device.
      If you don't have it installed, please download it from the link below.`,
      primaryButtonText: "Open in VS Code",
      secondaryButtonText: "Cancel",

      onPrimaryButtonClick: () => {
        try {
          window.location.href = vscodeUrl;
          TelemetryProcessor.traceStart(Action.OpenVSCode);
        } catch (error) {
          logConsoleError(`Failed to open VS Code: ${getErrorMessage(error)}`);
        }
      },
      onSecondaryButtonClick: () => {
        useDialog.getState().closeDialog();
        TelemetryProcessor.traceCancel(Action.OpenVSCode);
      },
    };
    useDialog.getState().openDialog(openVSCodeDialogProps);
  }

  public async openCESCVAFeedbackBlade(): Promise<void> {
    sendMessage({ type: MessageTypes.OpenCESCVAFeedbackBlade });
    Logger.logInfo(
      `CES CVA Feedback logging current date when survey is shown ${Date.now().toString()}`,
      "Explorer/openCESCVAFeedbackBlade",
    );
  }

  public async openContainerCopyFeedbackBlade(): Promise<void> {
    sendMessage({ type: MessageTypes.OpenContainerCopyFeedbackBlade });
    Logger.logInfo(
      `Container Copy Feedback logging current date when survey is shown ${Date.now().toString()}`,
      "Explorer/openContainerCopyFeedbackBlade",
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
      useDatabases.setState({ databases: updatedDatabases, databasesFetchedSuccessfully: true });
      scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);

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
      useDatabases.setState({ databasesFetchedSuccessfully: false });
      scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);
    }
  }

  public onRefreshDatabasesKeyPress = (source: string, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.onRefreshResourcesClick();
      return false;
    }
    return true;
  };

  public onRefreshResourcesClick = async (): Promise<void> => {
    if (isFabricMirroredKey()) {
      scheduleRefreshFabricToken(true).then(() => this.refreshAllDatabases());
    } else {
      await (userContext.authType === AuthType.ResourceToken
        ? this.refreshDatabaseForResourceToken()
        : this.refreshAllDatabases());
      await this.refreshNotebookList();
    }

    logConsoleInfo("Successfully refreshed databases");
  };

  // Facade
  public provideFeedbackEmail = (): void => {
    window.open(Constants.Urls.feedbackEmail, "_blank");
  };

  public async initNotebooks(databaseAccount: DataModels.DatabaseAccount): Promise<void> {
    if (!databaseAccount) {
      throw new Error("No database account specified");
    }

    if (this._isInitializingNotebooks) {
      return;
    }
    this._isInitializingNotebooks = true;
    this.refreshNotebookList();
    this._isInitializingNotebooks = false;
  }

  public async allocateContainer(): Promise<void> {
    const notebookServerInfo = useNotebook.getState().notebookServerInfo;
    const isAllocating = useNotebook.getState().isAllocating;
    if (
      isAllocating === false &&
      (notebookServerInfo === undefined ||
        (notebookServerInfo && notebookServerInfo.notebookServerEndpoint === undefined))
    ) {
      const connectionStatus: ContainerConnectionInfo = {
        status: ConnectionStatusType.Connecting,
      };

      useNotebook.getState().setConnectionInfo(connectionStatus);

      let connectionInfo;
      try {
        TelemetryProcessor.traceStart(Action.PhoenixConnection, {
          dataExplorerArea: Areas.Notebook,
        });
        useNotebook.getState().setIsAllocating(true);
        const provisionData: IProvisionData = {
          cosmosEndpoint: userContext?.databaseAccount?.properties?.documentEndpoint,
          poolId: undefined,
        };
        connectionInfo = await this.phoenixClient.allocateContainer(provisionData);
        if (!connectionInfo?.data?.phoenixServiceUrl) {
          throw new Error(`PhoenixServiceUrl is invalid!`);
        }
        await this.setNotebookInfo(connectionInfo, connectionStatus);
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
        connectionStatus.status = ConnectionStatusType.Failed;
        useNotebook.getState().resetContainerConnection(connectionStatus);
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
        throw error;
      } finally {
        useNotebook.getState().setIsAllocating(false);
        this.refreshCommandBarButtons();
        this.refreshNotebookList();
        this._isInitializingNotebooks = false;
      }
    }
  }

  public async setNotebookInfo(
    connectionInfo: IResponse<IPhoenixServiceInfo>,
    connectionStatus: DataModels.ContainerConnectionInfo,
  ): Promise<void> {
    const containerData = {
      forwardingId: connectionInfo.data.forwardingId,
      dbAccountName: userContext.databaseAccount.name,
    };
    await this.phoenixClient.initiateContainerHeartBeat(true, containerData);

    connectionStatus.status = ConnectionStatusType.Connected;
    useNotebook.getState().setConnectionInfo(connectionStatus);

    const noteBookServerInfo = {
      notebookServerEndpoint:
        (validateEndpoint(userContext.features.notebookServerUrl, allowedNotebookServerUrls) &&
          userContext.features.notebookServerUrl) ||
        connectionInfo.data.phoenixServiceUrl,
      authToken: userContext.features.notebookServerToken || connectionInfo.data.authToken,
      forwardingId: connectionInfo.data.forwardingId,
    };
    useNotebook.getState().setNotebookServerInfo(noteBookServerInfo);

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

    scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
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
        }),
      );
      TelemetryProcessor.traceSuccess(
        Action.LoadCollections,
        { dataExplorerArea: Constants.Areas.ResourceTree },
        startKey,
      );
      scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
      // Start DatabaseTreeRendered — React render cycle will complete it in ResourceTree
      scenarioMonitor.startPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
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
      scenarioMonitor.failPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
    }
  }

  private _initSettings() {
    if (!ExplorerSettings.hasSettingsDefined()) {
      ExplorerSettings.createDefaultSettings();
    } else {
      ExplorerSettings.ensurePriorityLevel();
    }
  }

  private refreshNotebookList = (): Promise<void> => {
    // Notebook authoring and listing have been removed.
    return Promise.resolve();
  };

  public openNotebookTerminal(kind: ViewModels.TerminalKind): void {
    this.connectToNotebookTerminal(kind);
  }

  private connectToNotebookTerminal(kind: ViewModels.TerminalKind): void {
    let title: string;

    switch (kind) {
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
        title = "Mongo Shell";
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

  public openUploadItemsPane(onUpload?: (data: UploadDetailsRecord[]) => void): void {
    useSidePanel.getState().openSidePanel("Upload " + getUploadName(), <UploadItemsPane onUpload={onUpload} />);
  }
  public openExecuteSprocParamsPanel(storedProcedure: StoredProcedure): void {
    useSidePanel
      .getState()
      .openSidePanel("Input parameters", <ExecuteSprocParamsPane storedProcedure={storedProcedure} />);
  }

  public getDownloadModalContent(fileName: string): JSX.Element {
    if (useNotebook.getState().isPhoenixNotebooks) {
      return (
        <>
          <p>{Notebook.galleryNotebookDownloadContent1}</p>
          <br />
          <p>
            {Notebook.galleryNotebookDownloadContent2}
            <Link href={Notebook.cosmosNotebookGitDocumentationUrl} target="_blank">
              {Notebook.learnMore}
            </Link>
          </p>
        </>
      );
    }
    return <p> Download {fileName} from gallery as a copy to your notebooks to run and/or edit the notebook. </p>;
  }

  public async refreshExplorer(): Promise<void> {
    // Start DatabaseLoad scenario before fetching databases
    if (userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo") {
      scenarioMonitor.start(MetricScenario.DatabaseLoad);
    }

    // Run independent initialization tasks in parallel:
    // - Database loading (ARM/SDK calls for databases + collections)
    // - Notebook enabled check (Phoenix + Portal backend — no dependency on databases)
    // - Feature registration check (ARM call — no dependency on databases or notebooks)
    const databasesTask =
      userContext.apiType !== "Postgres" && userContext.apiType !== "VCoreMongo"
        ? (async () => {
            if (userContext.authType === AuthType.ResourceToken) {
              scenarioMonitor.skipPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.CollectionsLoaded);
              scenarioMonitor.skipPhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabaseTreeRendered);
              this.databasesRefreshed = this.refreshDatabaseForResourceToken().then(() => {
                scenarioMonitor.completePhase(MetricScenario.DatabaseLoad, ApplicationMetricPhase.DatabasesFetched);
              });
            } else {
              this.databasesRefreshed = this.refreshAllDatabases();
            }
            await this.databasesRefreshed;
          })()
        : Promise.resolve();

    const notebooksTask = !isFabricNative()
      ? useNotebook.getState().refreshNotebooksEnabledStateForAccount()
      : Promise.resolve();

    const featureRegistrationTask =
      userContext.authType === AuthType.AAD && userContext.apiType === "SQL" && !isFabricNative()
        ? featureRegistered(userContext.subscriptionId, "ThroughputBucketing")
        : Promise.resolve(false);

    const [, , throughputBucketsEnabled] = await Promise.all([databasesTask, notebooksTask, featureRegistrationTask]);

    // Notebook initialization depends on refreshNotebooksEnabledStateForAccount completing above
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

    if (useNotebook.getState().isPhoenixNotebooks) {
      await this.initNotebooks(userContext.databaseAccount);
    }

    if (throughputBucketsEnabled) {
      updateUserContext({ throughputBucketsEnabled });
    }
  }
}
