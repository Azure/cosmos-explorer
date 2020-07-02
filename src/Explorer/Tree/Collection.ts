import * as ko from "knockout";
import Q from "q";
import * as _ from "underscore";
import UploadWorker from "worker-loader!../../workers/upload";
import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { CosmosClient } from "../../Common/CosmosClient";
import * as Logger from "../../Common/Logger";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { PlatformType } from "../../PlatformType";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";
import { OfferUtils } from "../../Utils/OfferUtils";
import { StartUploadMessageParams, UploadDetails, UploadDetailsRecord } from "../../workers/upload/definitions";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { CassandraAPIDataClient, CassandraTableKey, CassandraTableKeys } from "../Tables/TableDataClient";
import { ConflictsTab } from "../Tabs/ConflictsTab";
import DocumentsTab from "../Tabs/DocumentsTab";
import GraphTab from "../Tabs/GraphTab";
import MongoDocumentsTab from "../Tabs/MongoDocumentsTab";
import MongoQueryTab from "../Tabs/MongoQueryTab";
import MongoShellTab from "../Tabs/MongoShellTab";
import QueryTab from "../Tabs/QueryTab";
import QueryTablesTab from "../Tabs/QueryTablesTab";
import SettingsTab from "../Tabs/SettingsTab";
import ConflictId from "./ConflictId";
import DocumentId from "./DocumentId";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";
import { config } from "../../Config";

export default class Collection implements ViewModels.Collection {
  public nodeKind: string;
  public container: ViewModels.Explorer;
  public self: string;
  public rid: string;
  public databaseId: string;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyPropertyHeader: string;
  public partitionKeyProperty: string;
  public id: ko.Observable<string>;
  public defaultTtl: ko.Observable<number>;
  public indexingPolicy: ko.Observable<DataModels.IndexingPolicy>;
  public uniqueKeyPolicy: DataModels.UniqueKeyPolicy;
  public quotaInfo: ko.Observable<DataModels.CollectionQuotaInfo>;
  public offer: ko.Observable<DataModels.Offer>;
  public conflictResolutionPolicy: ko.Observable<DataModels.ConflictResolutionPolicy>;
  public changeFeedPolicy: ko.Observable<DataModels.ChangeFeedPolicy>;
  public partitions: ko.Computed<number>;
  public throughput: ko.Computed<number>;
  public rawDataModel: DataModels.Collection;
  public analyticalStorageTtl: ko.Observable<number>;
  public geospatialConfig: ko.Observable<DataModels.GeospatialConfig>;

  // TODO move this to API customization class
  public cassandraKeys: CassandraTableKeys;
  public cassandraSchema: CassandraTableKey[];

  public documentIds: ko.ObservableArray<DocumentId>;
  public children: ko.ObservableArray<ViewModels.TreeNode>;
  public storedProcedures: ko.Computed<ViewModels.StoredProcedure[]>;
  public userDefinedFunctions: ko.Computed<ViewModels.UserDefinedFunction[]>;
  public triggers: ko.Computed<ViewModels.Trigger[]>;

  public showStoredProcedures: ko.Observable<boolean>;
  public showTriggers: ko.Observable<boolean>;
  public showUserDefinedFunctions: ko.Observable<boolean>;
  public showConflicts: ko.Observable<boolean>;

  public selectedDocumentContent: ViewModels.Editable<any>;
  public selectedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  public focusedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  public isCollectionExpanded: ko.Observable<boolean>;
  public isStoredProceduresExpanded: ko.Observable<boolean>;
  public isUserDefinedFunctionsExpanded: ko.Observable<boolean>;
  public isTriggersExpanded: ko.Observable<boolean>;

  public documentsFocused: ko.Observable<boolean>;
  public settingsFocused: ko.Observable<boolean>;
  public storedProceduresFocused: ko.Observable<boolean>;
  public userDefinedFunctionsFocused: ko.Observable<boolean>;
  public triggersFocused: ko.Observable<boolean>;

  constructor(
    container: ViewModels.Explorer,
    databaseId: string,
    data: DataModels.Collection,
    quotaInfo: DataModels.CollectionQuotaInfo,
    offer: DataModels.Offer
  ) {
    this.nodeKind = "Collection";
    this.container = container;
    this.self = data._self;
    this.rid = data._rid;
    this.databaseId = databaseId;
    this.rawDataModel = data;
    this.partitionKey = data.partitionKey;

    this.id = ko.observable(data.id);
    this.defaultTtl = ko.observable(data.defaultTtl);
    this.indexingPolicy = ko.observable(data.indexingPolicy);
    this.quotaInfo = ko.observable(quotaInfo);
    this.offer = ko.observable(offer);
    this.conflictResolutionPolicy = ko.observable(data.conflictResolutionPolicy);
    this.changeFeedPolicy = ko.observable<DataModels.ChangeFeedPolicy>(data.changeFeedPolicy);
    this.analyticalStorageTtl = ko.observable(data.analyticalStorageTtl);
    this.geospatialConfig = ko.observable(data.geospatialConfig);

    // TODO fix this to only replace non-excaped single quotes
    this.partitionKeyProperty =
      (this.partitionKey &&
        this.partitionKey.paths &&
        this.partitionKey.paths.length &&
        this.partitionKey.paths.length > 0 &&
        this.partitionKey.paths[0].replace(/[/]+/g, ".").substr(1).replace(/[']+/g, "")) ||
      null;
    this.partitionKeyPropertyHeader =
      (this.partitionKey &&
        this.partitionKey.paths &&
        this.partitionKey.paths.length > 0 &&
        this.partitionKey.paths[0]) ||
      null;

    if (!!container.isPreferredApiMongoDB() && this.partitionKeyProperty && ~this.partitionKeyProperty.indexOf(`"`)) {
      this.partitionKeyProperty = this.partitionKeyProperty.replace(/["]+/g, "");
    }

    // TODO #10738269 : Add this logic in a derived class for Mongo
    if (
      !!container.isPreferredApiMongoDB() &&
      this.partitionKeyProperty &&
      this.partitionKeyProperty.indexOf("$v") > -1
    ) {
      // From $v.shard.$v.key.$v > shard.key
      this.partitionKeyProperty = this.partitionKeyProperty.replace(/.\$v/g, "").replace(/\$v./g, "");
      this.partitionKeyPropertyHeader = "/" + this.partitionKeyProperty;
    }

    this.documentIds = ko.observableArray<DocumentId>([]);
    this.isCollectionExpanded = ko.observable<boolean>(false);
    this.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();
    this.focusedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();

    this.documentsFocused = ko.observable<boolean>();
    this.documentsFocused.subscribe((focus) => {
      console.log("Focus set on Documents: " + focus);
      this.focusedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    });

    this.settingsFocused = ko.observable<boolean>(false);
    this.settingsFocused.subscribe((focus) => {
      this.focusedSubnodeKind(ViewModels.CollectionTabKind.Settings);
    });

    this.storedProceduresFocused = ko.observable<boolean>(false);
    this.storedProceduresFocused.subscribe((focus) => {
      this.focusedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
    });

    this.userDefinedFunctionsFocused = ko.observable<boolean>(false);
    this.userDefinedFunctionsFocused.subscribe((focus) => {
      this.focusedSubnodeKind(ViewModels.CollectionTabKind.UserDefinedFunctions);
    });

    this.triggersFocused = ko.observable<boolean>(false);
    this.triggersFocused.subscribe((focus) => {
      this.focusedSubnodeKind(ViewModels.CollectionTabKind.Triggers);
    });

    this.children = ko.observableArray<ViewModels.TreeNode>([]);

    this.storedProcedures = ko.computed(() => {
      return this.children()
        .filter((node) => node.nodeKind === "StoredProcedure")
        .map((node) => <ViewModels.StoredProcedure>node);
    });

    this.userDefinedFunctions = ko.computed(() => {
      return this.children()
        .filter((node) => node.nodeKind === "UserDefinedFunction")
        .map((node) => <ViewModels.UserDefinedFunction>node);
    });

    this.triggers = ko.computed(() => {
      return this.children()
        .filter((node) => node.nodeKind === "Trigger")
        .map((node) => <ViewModels.Trigger>node);
    });

    const showScriptsMenus: boolean = container.isPreferredApiDocumentDB() || container.isPreferredApiGraph();
    this.showStoredProcedures = ko.observable<boolean>(showScriptsMenus);
    this.showTriggers = ko.observable<boolean>(showScriptsMenus);
    this.showUserDefinedFunctions = ko.observable<boolean>(showScriptsMenus);

    this.showConflicts = ko.observable<boolean>(
      container &&
        container.databaseAccount &&
        container.databaseAccount() &&
        container.databaseAccount().properties &&
        container.databaseAccount().properties.enableMultipleWriteLocations &&
        data &&
        !!data.conflictResolutionPolicy
    );

    this.isStoredProceduresExpanded = ko.observable<boolean>(false);
    this.isUserDefinedFunctionsExpanded = ko.observable<boolean>(false);
    this.isTriggersExpanded = ko.observable<boolean>(false);
  }

  public expandCollapseCollection() {
    this.container.selectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Collection node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    if (this.isCollectionExpanded()) {
      this.collapseCollection();
    } else {
      this.expandCollection();
    }
    this.container.onUpdateTabsButtons([]);
    this.refreshActiveTab();
  }

  public collapseCollection() {
    if (!this.isCollectionExpanded()) {
      return;
    }

    this.isCollectionExpanded(false);
    TelemetryProcessor.trace(Action.CollapseTreeNode, ActionModifiers.Mark, {
      description: "Collection node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public expandCollection(): Q.Promise<any> {
    if (this.isCollectionExpanded()) {
      return Q();
    }

    this.isCollectionExpanded(true);
    TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
      description: "Collection node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    return Q.resolve();
  }

  public onDocumentDBDocumentsClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Documents node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    // create documents tab if not created yet
    const openedTabs = this.container.openedTabs();

    let documentsTab: ViewModels.Tab = openedTabs
      .filter((tab) => tab.collection && tab.collection.rid === this.rid)
      .filter((tab) => tab.tabKind === ViewModels.CollectionTabKind.Documents)[0];

    if (!documentsTab) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseAccountName: this.container.databaseAccount().name,
        databaseName: this.databaseId,
        collectionName: this.id(),
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Items",
      });
      this.documentIds([]);
      documentsTab = new DocumentsTab({
        partitionKey: this.partitionKey,
        documentIds: ko.observableArray<DocumentId>([]),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "Items",
        documentClientUtility: this.container.documentClientUtility,

        selfLink: this.self,
        isActive: ko.observable<boolean>(false),
        collection: this,
        node: this,
        tabPath: `${this.databaseId}>${this.id()}>Documents`,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/documents`,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
        openedTabs: this.container.openedTabs(),
      });
      this.container.openedTabs.push(documentsTab);
    }

    // Activate
    documentsTab.onTabClick();
  }

  public onConflictsClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Conflicts);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Conflicts node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    // create documents tab if not created yet
    const openedTabs = this.container.openedTabs();

    let conflictsTab: ViewModels.Tab = openedTabs
      .filter((tab) => tab.collection && tab.collection.rid === this.rid)
      .filter((tab) => tab.tabKind === ViewModels.CollectionTabKind.Conflicts)[0];

    if (!conflictsTab) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseAccountName: this.container.databaseAccount().name,
        databaseName: this.databaseId,
        collectionName: this.id(),
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Conflicts",
      });
      this.documentIds([]);
      conflictsTab = new ConflictsTab({
        partitionKey: this.partitionKey,
        conflictIds: ko.observableArray<ConflictId>([]),
        tabKind: ViewModels.CollectionTabKind.Conflicts,
        title: "Conflicts",
        documentClientUtility: this.container.documentClientUtility,

        selfLink: this.self,
        isActive: ko.observable<boolean>(false),
        collection: this,
        node: this,
        tabPath: `${this.databaseId}>${this.id()}>Conflicts`,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/conflicts`,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
        openedTabs: this.container.openedTabs(),
      });
      this.container.openedTabs.push(conflictsTab);
    }

    // Activate
    conflictsTab.onTabClick();
  }

  public onTableEntitiesClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.QueryTables);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Entities node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    if (this.container.isPreferredApiCassandra() && !this.cassandraKeys) {
      (<CassandraAPIDataClient>this.container.tableDataClient).getTableKeys(this).then((keys: CassandraTableKeys) => {
        this.cassandraKeys = keys;
      });
    }

    // create entities tab if not created yet
    const openedTabs = this.container.openedTabs();

    let documentsTab: ViewModels.Tab = openedTabs
      .filter((tab) => tab.collection && tab.collection.rid === this.rid)
      .filter((tab) => tab.tabKind === ViewModels.CollectionTabKind.QueryTables)[0];

    if (!documentsTab) {
      this.documentIds([]);
      let title = `Entities`;
      if (this.container.isPreferredApiCassandra()) {
        title = `Rows`;
      }
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseAccountName: this.container.databaseAccount().name,
        databaseName: this.databaseId,
        collectionName: this.id(),
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: title,
      });
      documentsTab = new QueryTablesTab({
        tabKind: ViewModels.CollectionTabKind.QueryTables,
        title: title,
        tabPath: "",
        documentClientUtility: this.container.documentClientUtility,
        collection: this,

        node: this,
        selfLink: this.self,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/entities`,
        isActive: ko.observable(false),
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
        openedTabs: this.container.openedTabs(),
      });
      this.container.openedTabs.push(documentsTab);
    }

    // Activate
    documentsTab.onTabClick();
  }

  public onGraphDocumentsClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Graph);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Documents node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    // create documents tab if not created yet
    const openedTabs = this.container.openedTabs();

    let documentsTab: ViewModels.Tab = openedTabs
      .filter((tab) => tab.collection && tab.collection.rid === this.rid)
      .filter((tab) => tab.tabKind === ViewModels.CollectionTabKind.Graph)[0];

    if (!documentsTab) {
      this.documentIds([]);
      documentsTab = this._createGraphTab("Graph");
      this.container.openedTabs.push(documentsTab);
    }

    // Activate
    documentsTab.onTabClick();
  }

  private _createGraphTab = (title: string): ViewModels.GraphTab => {
    const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: title,
    });
    // TODO where does the success/failure trace for this tab go?
    return new GraphTab({
      account: CosmosClient.databaseAccount(),
      tabKind: ViewModels.CollectionTabKind.Graph,
      node: this,
      title: title,
      tabPath: "",
      documentClientUtility: this.container.documentClientUtility,
      collection: this,
      selfLink: this.self,
      masterKey: CosmosClient.masterKey() || "",
      collectionPartitionKeyProperty: this.partitionKeyProperty,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/graphs`,
      collectionId: this.id(),
      isActive: ko.observable(false),
      databaseId: this.databaseId,
      isTabsContentExpanded: this.container.isTabsContentExpanded,
      onLoadStartKey: startKey,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      openedTabs: this.container.openedTabs(),
    });
  };

  public onMongoDBDocumentsClick = () => {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Documents node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    // create documents tab if not created yet
    const openedTabs = this.container.openedTabs();

    let documentsTab: ViewModels.Tab = openedTabs
      .filter((tab) => tab.collection && tab.collection && tab.collection.rid === this.rid)
      .filter((tab) => tab.tabKind === ViewModels.CollectionTabKind.Documents)[0];

    if (!documentsTab) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseAccountName: this.container.databaseAccount().name,
        databaseName: this.databaseId,
        collectionName: this.id(),
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Documents",
      });
      this.documentIds([]);
      documentsTab = new MongoDocumentsTab({
        partitionKey: this.partitionKey,
        documentIds: this.documentIds,
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "Documents",
        tabPath: "",
        documentClientUtility: this.container.documentClientUtility,
        collection: this,

        node: this,
        selfLink: this.self,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/mongoDocuments`,
        isActive: ko.observable(false),
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
        openedTabs: this.container.openedTabs(),
      });
      this.container.openedTabs.push(documentsTab);
    }

    // Activate
    documentsTab.onTabClick();
  };

  public onSettingsClick = () => {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Settings);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Settings node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    // create settings tab if not created yet
    const openedTabs = this.container.openedTabs();
    let settingsTab: ViewModels.Tab = openedTabs
      .filter((tab) => tab.collection && tab.collection.rid === this.rid)
      .filter((tab) => tab.tabKind === ViewModels.CollectionTabKind.Settings)[0];

    const tabTitle = "Scale & Settings";
    const pendingNotificationsPromise: Q.Promise<DataModels.Notification> = this._getPendingThroughputSplitNotification();
    if (!settingsTab) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseAccountName: this.container.databaseAccount().name,
        databaseName: this.databaseId,
        collectionName: this.id(),
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: tabTitle,
      });

      Q.all([pendingNotificationsPromise, this.readSettings()]).then(
        (data: any) => {
          const pendingNotification: DataModels.Notification = data && data[0];
          settingsTab = new SettingsTab({
            tabKind: ViewModels.CollectionTabKind.Settings,
            title: !this.offer() ? "Settings" : "Scale & Settings",
            tabPath: "",
            documentClientUtility: this.container.documentClientUtility,
            collection: this,
            node: this,

            selfLink: this.self,
            hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/settings`,
            isActive: ko.observable(false),
            onLoadStartKey: startKey,
            onUpdateTabsButtons: this.container.onUpdateTabsButtons,
            openedTabs: this.container.openedTabs(),
          });
          (settingsTab as ViewModels.SettingsTab).pendingNotification(pendingNotification);
          this.container.openedTabs.push(settingsTab);
          settingsTab.onTabClick(); // Activate
        },
        (error: any) => {
          TelemetryProcessor.traceFailure(
            Action.Tab,
            {
              databaseAccountName: this.container.databaseAccount().name,
              databaseName: this.databaseId,
              collectionName: this.id(),
              defaultExperience: this.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: tabTitle,
              error: error,
            },
            startKey
          );
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            `Error while fetching container settings for container ${this.id()}: ${JSON.stringify(error)}`
          );
          throw error;
        }
      );
    } else {
      pendingNotificationsPromise.then(
        (pendingNotification: DataModels.Notification) => {
          (settingsTab as ViewModels.SettingsTab).pendingNotification(pendingNotification);
          settingsTab.onTabClick();
        },
        (error: any) => {
          (settingsTab as ViewModels.SettingsTab).pendingNotification(undefined);
          settingsTab.onTabClick();
        }
      );
    }
  };

  public readSettings(): Q.Promise<void> {
    const deferred: Q.Deferred<void> = Q.defer<void>();
    this.container.isRefreshingExplorer(true);
    const collectionDataModel: DataModels.Collection = <DataModels.Collection>{
      id: this.id(),
      _rid: this.rid,
      _self: this.self,
      defaultTtl: this.defaultTtl(),
      indexingPolicy: this.indexingPolicy(),
      partitionKey: this.partitionKey,
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.LoadOffers, {
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
    });
    // TODO: Use the collection entity cache to get quota info
    const quotaInfoPromise: Q.Promise<DataModels.CollectionQuotaInfo> = this.container.documentClientUtility.readCollectionQuotaInfo(
      this
    );
    const offerInfoPromise: Q.Promise<DataModels.Offer[]> = this.container.documentClientUtility.readOffers();
    Q.all([quotaInfoPromise, offerInfoPromise]).then(
      () => {
        this.container.isRefreshingExplorer(false);
        const quotaInfoWithUniqueKeyPolicy: DataModels.CollectionQuotaInfo = quotaInfoPromise.valueOf();
        this.uniqueKeyPolicy = quotaInfoWithUniqueKeyPolicy.uniqueKeyPolicy;
        const quotaInfo = _.omit(quotaInfoWithUniqueKeyPolicy, "uniqueKeyPolicy");

        const collectionOffer = this._getOfferForCollection(offerInfoPromise.valueOf(), collectionDataModel);
        const isDatabaseShared = this.getDatabase() && this.getDatabase().isDatabaseShared();
        if (isDatabaseShared && !collectionOffer) {
          this.quotaInfo(quotaInfo);
          TelemetryProcessor.traceSuccess(
            Action.LoadOffers,
            {
              databaseAccountName: this.container.databaseAccount().name,
              databaseName: this.databaseId,
              collectionName: this.id(),
              defaultExperience: this.container.defaultExperience(),
            },
            startKey
          );
          deferred.resolve();
          return;
        }

        this.container.documentClientUtility
          .readOffer(collectionOffer)
          .then((offerDetail: DataModels.OfferWithHeaders) => {
            if (OfferUtils.isNotOfferV1(collectionOffer)) {
              const offerThroughputInfo: DataModels.OfferThroughputInfo = {
                minimumRUForCollection:
                  offerDetail.content &&
                  offerDetail.content.collectionThroughputInfo &&
                  offerDetail.content.collectionThroughputInfo.minimumRUForCollection,
                numPhysicalPartitions:
                  offerDetail.content &&
                  offerDetail.content.collectionThroughputInfo &&
                  offerDetail.content.collectionThroughputInfo.numPhysicalPartitions,
              };

              collectionOffer.content.collectionThroughputInfo = offerThroughputInfo;
            }

            (collectionOffer as DataModels.OfferWithHeaders).headers = offerDetail.headers;
            this.offer(collectionOffer);
            this.offer.valueHasMutated();
            this.quotaInfo(quotaInfo);
            TelemetryProcessor.traceSuccess(
              Action.LoadOffers,
              {
                databaseAccountName: this.container.databaseAccount().name,
                databaseName: this.databaseId,
                collectionName: this.id(),
                defaultExperience: this.container.defaultExperience(),
                offerVersion: collectionOffer && collectionOffer.offerVersion,
              },
              startKey
            );
            deferred.resolve();
          });
      },
      (error: any) => {
        this.container.isRefreshingExplorer(false);
        deferred.reject(error);
        TelemetryProcessor.traceFailure(
          Action.LoadOffers,
          {
            databaseAccountName: this.container.databaseAccount().name,
            databaseName: this.databaseId,
            collectionName: this.id(),
            defaultExperience: this.container.defaultExperience(),
          },
          startKey
        );
      }
    );

    return deferred.promise;
  }

  public onNewQueryClick(source: any, event: MouseEvent, queryText?: string) {
    const collection: ViewModels.Collection = source.collection || source;
    const explorer: ViewModels.Explorer = source.container;
    const openedTabs = explorer.openedTabs();
    const id = openedTabs.filter((t) => t.tabKind === ViewModels.CollectionTabKind.Query).length + 1;
    const title = "Query " + id;
    const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: title,
    });

    let queryTab: ViewModels.Tab = new QueryTab({
      tabKind: ViewModels.CollectionTabKind.Query,
      title: title,
      tabPath: "",
      documentClientUtility: this.container.documentClientUtility,
      collection: this,
      node: this,
      selfLink: this.self,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/query`,
      isActive: ko.observable(false),
      queryText: queryText,
      partitionKey: collection.partitionKey,
      onLoadStartKey: startKey,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      openedTabs: this.container.openedTabs(),
    });
    this.container.openedTabs.push(queryTab);

    // Activate
    queryTab.onTabClick();
  }

  public onNewMongoQueryClick(source: any, event: MouseEvent, queryText?: string) {
    const collection: ViewModels.Collection = source.collection || source;
    const explorer: ViewModels.Explorer = source.container;
    const openedTabs = explorer.openedTabs();
    const id = openedTabs.filter((t) => t.tabKind === ViewModels.CollectionTabKind.Query).length + 1;

    const title = "Query " + id;
    const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: title,
    });

    let queryTab: ViewModels.Tab = new MongoQueryTab({
      tabKind: ViewModels.CollectionTabKind.Query,
      title: title,
      tabPath: "",
      documentClientUtility: this.container.documentClientUtility,
      collection: this,
      node: this,
      selfLink: this.self,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/mongoQuery`,
      isActive: ko.observable(false),
      partitionKey: collection.partitionKey,
      onLoadStartKey: startKey,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      openedTabs: this.container.openedTabs(),
    });
    this.container.openedTabs.push(queryTab);

    // Activate
    queryTab.onTabClick();
  }

  public onNewGraphClick() {
    var id = this.container.openedTabs().filter((t) => t.tabKind === ViewModels.CollectionTabKind.Graph).length + 1;
    var graphTab = this._createGraphTab("Graph Query " + id);
    this.container.openedTabs.push(graphTab);
    // Activate
    graphTab.onTabClick();
  }

  public onNewMongoShellClick() {
    var id =
      this.container.openedTabs().filter((t) => t.tabKind === ViewModels.CollectionTabKind.MongoShell).length + 1;
    var mongoShellTab = new MongoShellTab({
      tabKind: ViewModels.CollectionTabKind.MongoShell,
      title: "Shell " + id,
      tabPath: "",
      documentClientUtility: this.container.documentClientUtility,
      collection: this,
      node: this,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/mongoShell`,
      selfLink: this.self,
      isActive: ko.observable(false),
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      openedTabs: this.container.openedTabs(),
    });

    this.container.openedTabs.push(mongoShellTab);

    // Activate
    mongoShellTab.onTabClick();
  }

  public onNewStoredProcedureClick(source: ViewModels.Collection, event: MouseEvent) {
    StoredProcedure.create(source, event);
  }

  public onNewUserDefinedFunctionClick(source: ViewModels.Collection, event: MouseEvent) {
    UserDefinedFunction.create(source, event);
  }

  public onNewTriggerClick(source: ViewModels.Collection, event: MouseEvent) {
    Trigger.create(source, event);
  }

  public createStoredProcedureNode(data: DataModels.StoredProcedure): StoredProcedure {
    const node = new StoredProcedure(this.container, this, data);
    this.container.selectedNode(node);
    this.children.push(node);
    return node;
  }

  public createUserDefinedFunctionNode(data: DataModels.UserDefinedFunction): UserDefinedFunction {
    const node = new UserDefinedFunction(this.container, this, data);
    this.container.selectedNode(node);
    this.children.push(node);
    return node;
  }

  public createTriggerNode(data: DataModels.Trigger): Trigger {
    const node = new Trigger(this.container, this, data);
    this.container.selectedNode(node);
    this.children.push(node);
    return node;
  }

  public findStoredProcedureWithId(sprocId: string): ViewModels.StoredProcedure {
    return _.find(
      this.storedProcedures(),
      (storedProcedure: ViewModels.StoredProcedure) => storedProcedure.id() === sprocId
    );
  }

  public findTriggerWithId(triggerId: string): ViewModels.Trigger {
    return _.find(this.triggers(), (trigger: ViewModels.Trigger) => trigger.id() === triggerId);
  }

  public findUserDefinedFunctionWithId(userDefinedFunctionId: string): ViewModels.UserDefinedFunction {
    return _.find(
      this.userDefinedFunctions(),
      (userDefinedFunction: ViewModels.Trigger) => userDefinedFunction.id() === userDefinedFunctionId
    );
  }

  public expandCollapseStoredProcedures() {
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
    if (this.isStoredProceduresExpanded()) {
      this.collapseStoredProcedures();
    } else {
      this.expandStoredProcedures();
    }
    this.refreshActiveTab();
  }

  public expandStoredProcedures() {
    if (this.isStoredProceduresExpanded()) {
      return;
    }

    this.loadStoredProcedures().then(
      () => {
        this.isStoredProceduresExpanded(true);
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
          description: "Stored procedures node",
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.databaseId,
          collectionName: this.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree,
        });
      },
      (error) => {
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Failed, {
          description: "Stored procedures node",
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.databaseId,
          collectionName: this.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: typeof error === "string" ? error : JSON.stringify(error),
        });
      }
    );
  }

  public collapseStoredProcedures() {
    if (!this.isStoredProceduresExpanded()) {
      return;
    }

    this.isStoredProceduresExpanded(false);
    TelemetryProcessor.trace(Action.CollapseTreeNode, ActionModifiers.Mark, {
      description: "Stored procedures node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public expandCollapseUserDefinedFunctions() {
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.UserDefinedFunctions);
    if (this.isUserDefinedFunctionsExpanded()) {
      this.collapseUserDefinedFunctions();
    } else {
      this.expandUserDefinedFunctions();
    }
    this.refreshActiveTab();
  }

  public expandUserDefinedFunctions() {
    if (this.isUserDefinedFunctionsExpanded()) {
      return;
    }

    this.loadUserDefinedFunctions().then(
      () => {
        this.isUserDefinedFunctionsExpanded(true);
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
          description: "UDF node",
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.databaseId,
          collectionName: this.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree,
        });
      },
      (error) => {
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Failed, {
          description: "UDF node",
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.databaseId,
          collectionName: this.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: typeof error === "string" ? error : JSON.stringify(error),
        });
      }
    );
  }

  public collapseUserDefinedFunctions() {
    if (!this.isUserDefinedFunctionsExpanded()) {
      return;
    }

    this.isUserDefinedFunctionsExpanded(false);
    TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
      description: "UDF node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public expandCollapseTriggers() {
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Triggers);
    if (this.isTriggersExpanded()) {
      this.collapseTriggers();
    } else {
      this.expandTriggers();
    }
    this.refreshActiveTab();
  }

  public expandTriggers() {
    if (this.isTriggersExpanded()) {
      return;
    }

    this.loadTriggers().then(
      () => {
        this.isTriggersExpanded(true);
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
          description: "Triggers node",
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.databaseId,
          collectionName: this.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree,
        });
      },
      (error) => {
        this.isTriggersExpanded(true);
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
          description: "Triggers node",
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.databaseId,
          collectionName: this.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.ResourceTree,
          error: typeof error === "string" ? error : JSON.stringify(error),
        });
      }
    );
  }

  public collapseTriggers() {
    if (!this.isTriggersExpanded()) {
      return;
    }

    this.isTriggersExpanded(false);
    TelemetryProcessor.trace(Action.CollapseTreeNode, ActionModifiers.Mark, {
      description: "Triggers node",
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public loadStoredProcedures(): Q.Promise<any> {
    return this.container.documentClientUtility
      .readStoredProcedures(this)
      .then((storedProcedures: DataModels.StoredProcedure[]) => {
        const storedProceduresNodes: ViewModels.TreeNode[] = storedProcedures.map(
          (storedProcedure) => new StoredProcedure(this.container, this, storedProcedure)
        );
        const otherNodes = this.children().filter((node) => node.nodeKind !== "StoredProcedure");
        const allNodes = otherNodes.concat(storedProceduresNodes);
        this.children(allNodes);
      });
  }

  public loadUserDefinedFunctions(): Q.Promise<any> {
    return this.container.documentClientUtility
      .readUserDefinedFunctions(this)
      .then((userDefinedFunctions: DataModels.UserDefinedFunction[]) => {
        const userDefinedFunctionsNodes: ViewModels.TreeNode[] = userDefinedFunctions.map(
          (udf) => new UserDefinedFunction(this.container, this, udf)
        );
        const otherNodes = this.children().filter((node) => node.nodeKind !== "UserDefinedFunction");
        const allNodes = otherNodes.concat(userDefinedFunctionsNodes);
        this.children(allNodes);
      });
  }

  public loadTriggers(): Q.Promise<any> {
    return this.container.documentClientUtility
      .readTriggers(this, null /*options*/)
      .then((triggers: DataModels.Trigger[]) => {
        const triggerNodes: ViewModels.TreeNode[] = triggers.map(
          (trigger) => new Trigger(this.container, this, trigger)
        );
        const otherNodes = this.children().filter((node) => node.nodeKind !== "Trigger");
        const allNodes = otherNodes.concat(triggerNodes);
        this.children(allNodes);
      });
  }

  public onDragOver(source: Collection, event: { originalEvent: DragEvent }) {
    event.originalEvent.stopPropagation();
    event.originalEvent.preventDefault();
  }

  public onDrop(source: Collection, event: { originalEvent: DragEvent }) {
    event.originalEvent.stopPropagation();
    event.originalEvent.preventDefault();
    this.uploadFiles(event.originalEvent.dataTransfer.files);
  }

  public isCollectionNodeSelected(): boolean {
    return (
      this.isSubNodeSelected(ViewModels.CollectionTabKind.Query) ||
      (!this.isCollectionExpanded() &&
        this.container.selectedNode &&
        this.container.selectedNode() &&
        this.container.selectedNode().rid === this.rid &&
        this.container.selectedNode().nodeKind === "Collection")
    );
  }

  public isSubNodeSelected(nodeKind: ViewModels.CollectionTabKind): boolean {
    return (
      this.container.selectedNode &&
      this.container.selectedNode() &&
      this.container.selectedNode().rid === this.rid &&
      this.selectedSubnodeKind() === nodeKind
    );
  }

  public onDeleteCollectionContextMenuClick(source: ViewModels.Collection, event: MouseEvent | KeyboardEvent) {
    this.container.deleteCollectionConfirmationPane.open();
  }

  public uploadFiles = (fileList: FileList): Q.Promise<UploadDetails> => {
    const platformType: string = PlatformType[(<any>window).dataExplorerPlatform];
    // TODO: right now web worker is not working with AAD flow. Use main thread for upload for now until we have backend upload capability
    if (platformType === PlatformType[PlatformType.Hosted] && window.authType === AuthType.AAD) {
      return this._uploadFilesCors(fileList);
    }
    const documentUploader: Worker = new UploadWorker();
    const deferred: Q.Deferred<UploadDetails> = Q.defer<UploadDetails>();
    let inProgressNotificationId: string = "";

    if (!fileList || fileList.length === 0) {
      return Q.reject("No files specified");
    }
    documentUploader.onmessage = (event: MessageEvent) => {
      const numSuccessful: number = event.data.numUploadsSuccessful;
      const numFailed: number = event.data.numUploadsFailed;
      const runtimeError: string = event.data.runtimeError;
      const uploadDetails: UploadDetails = event.data.uploadDetails;

      NotificationConsoleUtils.clearInProgressMessageWithId(inProgressNotificationId);
      documentUploader.terminate();
      if (!!runtimeError) {
        deferred.reject(runtimeError);
      } else if (numSuccessful === 0) {
        // all uploads failed
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to upload all documents to container ${this.id()}`
        );
      } else if (numFailed > 0) {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Failed to upload ${numFailed} of ${numSuccessful + numFailed} documents to container ${this.id()}`
        );
      } else {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully uploaded all ${numSuccessful} documents to container ${this.id()}`
        );
      }
      this._logUploadDetailsInConsole(uploadDetails);
      deferred.resolve(uploadDetails);
    };
    documentUploader.onerror = (event: ErrorEvent): void => {
      documentUploader.terminate();
      deferred.reject(event.error);
    };

    const uploaderMessage: StartUploadMessageParams = {
      files: fileList,
      documentClientParams: {
        databaseId: this.databaseId,
        containerId: this.id(),
        masterKey: CosmosClient.masterKey(),
        endpoint: CosmosClient.endpoint(),
        accessToken: CosmosClient.accessToken(),
        platform: config.platform,
        databaseAccount: CosmosClient.databaseAccount(),
      },
    };

    documentUploader.postMessage(uploaderMessage);
    inProgressNotificationId = NotificationConsoleUtils.logConsoleMessage(
      ConsoleDataType.InProgress,
      `Uploading and creating documents in container ${this.id()}`
    );

    return deferred.promise;
  };

  private _uploadFilesCors(files: FileList): Q.Promise<UploadDetails> {
    const deferred: Q.Deferred<UploadDetails> = Q.defer<UploadDetails>();
    const promises: Array<Q.Promise<UploadDetailsRecord>> = [];

    for (let i = 0; i < files.length; i++) {
      promises.push(this._uploadFile(files[i]));
    }
    Q.all(promises).then((uploadDetails: Array<UploadDetailsRecord>) => {
      deferred.resolve({ data: uploadDetails });
    });

    return deferred.promise;
  }

  private _uploadFile(file: File): Q.Promise<UploadDetailsRecord> {
    const deferred: Q.Deferred<UploadDetailsRecord> = Q.defer();

    const reader = new FileReader();
    reader.onload = (evt: any): void => {
      const fileData: string = evt.target.result;
      this._createDocumentsFromFile(file.name, fileData).then((record) => {
        deferred.resolve(record);
      });
    };

    reader.onerror = (evt: ProgressEvent): void => {
      deferred.resolve({
        fileName: file.name,
        numSucceeded: 0,
        numFailed: 1,
        errors: [(evt as any).error.message],
      });
    };

    reader.readAsText(file);

    return deferred.promise;
  }

  private _createDocumentsFromFile(fileName: string, documentContent: string): Q.Promise<UploadDetailsRecord> {
    const deferred: Q.Deferred<UploadDetailsRecord> = Q.defer();
    const record: UploadDetailsRecord = {
      fileName: fileName,
      numSucceeded: 0,
      numFailed: 0,
      errors: [],
    };

    try {
      const content = JSON.parse(documentContent);
      const promises: Array<Q.Promise<any>> = [];

      const triggerCreateDocument: (documentContent: any) => Q.Promise<any> = (documentContent: any) => {
        return this.container.documentClientUtility.createDocument(this, documentContent).then(
          (doc) => {
            record.numSucceeded++;
            return Q.resolve();
          },
          (error) => {
            record.numFailed++;
            record.errors = [...record.errors, JSON.stringify(error)];
            return Q.resolve();
          }
        );
      };

      if (Array.isArray(content)) {
        for (let i = 0; i < content.length; i++) {
          promises.push(triggerCreateDocument(content[i]));
        }
      } else {
        promises.push(triggerCreateDocument(content));
      }

      Q.all(promises).then(() => {
        deferred.resolve(record);
      });
    } catch (e) {
      record.numFailed++;
      record.errors = [...record.errors, e.message];
      deferred.resolve(record);
    }
    return deferred.promise;
  }

  private _getPendingThroughputSplitNotification(): Q.Promise<DataModels.Notification> {
    if (!this.container) {
      return Q.resolve(undefined);
    }

    const deferred: Q.Deferred<DataModels.Notification> = Q.defer<DataModels.Notification>();
    this.container.notificationsClient.fetchNotifications().then(
      (notifications: DataModels.Notification[]) => {
        if (!notifications || notifications.length === 0) {
          deferred.resolve(undefined);
          return;
        }

        const pendingNotification = _.find(notifications, (notification: DataModels.Notification) => {
          const throughputUpdateRegExp: RegExp = new RegExp("Throughput update (.*) in progress");
          return (
            notification.kind === "message" &&
            notification.collectionName === this.id() &&
            notification.description &&
            throughputUpdateRegExp.test(notification.description)
          );
        });

        deferred.resolve(pendingNotification);
      },
      (error: any) => {
        Logger.logError(
          JSON.stringify({
            error: JSON.stringify(error),
            accountName: this.container && this.container.databaseAccount(),
            databaseName: this.databaseId,
            collectionName: this.id(),
          }),
          "Settings tree node"
        );
        deferred.resolve(undefined);
      }
    );

    return deferred.promise;
  }

  private _logUploadDetailsInConsole(uploadDetails: UploadDetails): void {
    const uploadDetailsRecords: UploadDetailsRecord[] = uploadDetails.data;
    const numFiles: number = uploadDetailsRecords.length;
    const stackTraceLimit: number = 100;
    let stackTraceCount: number = 0;
    let currentFileIndex = 0;
    while (stackTraceCount < stackTraceLimit && currentFileIndex < numFiles) {
      const errors: string[] = uploadDetailsRecords[currentFileIndex].errors;
      for (let i = 0; i < errors.length; i++) {
        if (stackTraceCount >= stackTraceLimit) {
          break;
        }
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Document creation error for container ${this.id()} - file ${
            uploadDetailsRecords[currentFileIndex].fileName
          }: ${errors[i]}`
        );
        stackTraceCount++;
      }
      currentFileIndex++;
    }

    uploadDetailsRecords.forEach((record: UploadDetailsRecord) => {
      const consoleDataType: ConsoleDataType = record.numFailed > 0 ? ConsoleDataType.Error : ConsoleDataType.Info;
      NotificationConsoleUtils.logConsoleMessage(
        consoleDataType,
        `Item creation summary for container ${this.id()} - file ${record.fileName}: ${
          record.numSucceeded
        } items created, ${record.numFailed} errors`
      );
    });
  }

  public refreshActiveTab(): void {
    // ensures that the tab selects/highlights the right node based on resource tree expand/collapse state
    const openedRelevantTabs: ViewModels.Tab[] = this.container
      .openedTabs()
      .filter((tab: ViewModels.Tab) => tab && tab.collection && tab.collection.rid === this.rid);

    openedRelevantTabs.forEach((tab: ViewModels.Tab) => {
      if (tab.isActive()) {
        tab.onActivate();
      }
    });
  }

  protected _getOfferForCollection(offers: DataModels.Offer[], collection: DataModels.Collection): DataModels.Offer {
    return _.find(offers, (offer: DataModels.Offer) => offer.resource.indexOf(collection._rid) >= 0);
  }

  /**
   * Top-level method that will open the correct tab type depending on account API
   */
  public openTab(): void {
    if (this.container.isPreferredApiTable()) {
      this.onTableEntitiesClick();
      return;
    } else if (this.container.isPreferredApiCassandra()) {
      this.onTableEntitiesClick();
      return;
    } else if (this.container.isPreferredApiGraph()) {
      this.onGraphDocumentsClick();
      return;
    } else if (this.container.isPreferredApiMongoDB()) {
      this.onMongoDBDocumentsClick();
      return;
    }

    this.onDocumentDBDocumentsClick();
  }

  /**
   * Get correct collection label depending on account API
   */
  public getLabel(): string {
    if (this.container.isPreferredApiTable()) {
      return "Entities";
    } else if (this.container.isPreferredApiCassandra()) {
      return "Rows";
    } else if (this.container.isPreferredApiGraph()) {
      return "Graph";
    } else if (this.container.isPreferredApiMongoDB()) {
      return "Documents";
    }

    return "Items";
  }

  public getDatabase(): ViewModels.Database {
    return this.container.findDatabaseWithId(this.databaseId);
  }
}
