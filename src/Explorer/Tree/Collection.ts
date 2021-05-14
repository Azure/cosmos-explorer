import { Resource, StoredProcedureDefinition, TriggerDefinition, UserDefinedFunctionDefinition } from "@azure/cosmos";
import * as ko from "knockout";
import * as _ from "underscore";
import * as Constants from "../../Common/Constants";
import { bulkCreateDocument } from "../../Common/dataAccess/bulkCreateDocument";
import { createDocument } from "../../Common/dataAccess/createDocument";
import { getCollectionUsageSizeInKB } from "../../Common/dataAccess/getCollectionDataUsageSize";
import { readCollectionOffer } from "../../Common/dataAccess/readCollectionOffer";
import { readStoredProcedures } from "../../Common/dataAccess/readStoredProcedures";
import { readTriggers } from "../../Common/dataAccess/readTriggers";
import { readUserDefinedFunctions } from "../../Common/dataAccess/readUserDefinedFunctions";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import { fetchPortalNotifications } from "../../Common/PortalNotifications";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { UploadDetailsRecord } from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { logConsoleInfo } from "../../Utils/NotificationConsoleUtils";
import Explorer from "../Explorer";
import { CassandraAPIDataClient, CassandraTableKey, CassandraTableKeys } from "../Tables/TableDataClient";
import ConflictsTab from "../Tabs/ConflictsTab";
import DocumentsTab from "../Tabs/DocumentsTab";
import GraphTab from "../Tabs/GraphTab";
import MongoDocumentsTab from "../Tabs/MongoDocumentsTab";
import MongoQueryTab from "../Tabs/MongoQueryTab";
import MongoShellTab from "../Tabs/MongoShellTab";
import QueryTab from "../Tabs/QueryTab";
import QueryTablesTab from "../Tabs/QueryTablesTab";
import { CollectionSettingsTabV2 } from "../Tabs/SettingsTabV2";
import ConflictId from "./ConflictId";
import DocumentId from "./DocumentId";
import StoredProcedure from "./StoredProcedure";
import Trigger from "./Trigger";
import UserDefinedFunction from "./UserDefinedFunction";

export default class Collection implements ViewModels.Collection {
  public nodeKind: string;
  public container: Explorer;
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
  public usageSizeInKB: ko.Observable<number>;

  public offer: ko.Observable<DataModels.Offer>;
  public conflictResolutionPolicy: ko.Observable<DataModels.ConflictResolutionPolicy>;
  public changeFeedPolicy: ko.Observable<DataModels.ChangeFeedPolicy>;
  public partitions: ko.Computed<number>;
  public throughput: ko.Computed<number>;
  public rawDataModel: DataModels.Collection;
  public analyticalStorageTtl: ko.Observable<number>;
  public schema: DataModels.ISchema;
  public requestSchema: () => void;
  public geospatialConfig: ko.Observable<DataModels.GeospatialConfig>;

  // TODO move this to API customization class
  public cassandraKeys: CassandraTableKeys;
  public cassandraSchema: CassandraTableKey[];

  public documentIds: ko.ObservableArray<DocumentId>;
  public children: ko.ObservableArray<ViewModels.TreeNode>;
  public storedProcedures: ko.Computed<StoredProcedure[]>;
  public userDefinedFunctions: ko.Computed<UserDefinedFunction[]>;
  public triggers: ko.Computed<Trigger[]>;

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
  private isOfferRead: boolean;

  constructor(container: Explorer, databaseId: string, data: DataModels.Collection) {
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
    this.usageSizeInKB = ko.observable();
    this.offer = ko.observable();
    this.conflictResolutionPolicy = ko.observable(data.conflictResolutionPolicy);
    this.changeFeedPolicy = ko.observable<DataModels.ChangeFeedPolicy>(data.changeFeedPolicy);
    this.analyticalStorageTtl = ko.observable(data.analyticalStorageTtl);
    this.schema = data.schema;
    this.requestSchema = data.requestSchema;
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

    if (userContext.apiType === "Mongo" && this.partitionKeyProperty && ~this.partitionKeyProperty.indexOf(`"`)) {
      this.partitionKeyProperty = this.partitionKeyProperty.replace(/["]+/g, "");
    }

    // TODO #10738269 : Add this logic in a derived class for Mongo
    if (userContext.apiType === "Mongo" && this.partitionKeyProperty && this.partitionKeyProperty.indexOf("$v") > -1) {
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
        .map((node) => <StoredProcedure>node);
    });

    this.userDefinedFunctions = ko.computed(() => {
      return this.children()
        .filter((node) => node.nodeKind === "UserDefinedFunction")
        .map((node) => <UserDefinedFunction>node);
    });

    this.triggers = ko.computed(() => {
      return this.children()
        .filter((node) => node.nodeKind === "Trigger")
        .map((node) => <Trigger>node);
    });

    const showScriptsMenus: boolean = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
    this.showStoredProcedures = ko.observable<boolean>(showScriptsMenus);
    this.showTriggers = ko.observable<boolean>(showScriptsMenus);
    this.showUserDefinedFunctions = ko.observable<boolean>(showScriptsMenus);

    this.showConflicts = ko.observable<boolean>(
      userContext?.databaseAccount?.properties.enableMultipleWriteLocations && data && !!data.conflictResolutionPolicy
    );

    this.isStoredProceduresExpanded = ko.observable<boolean>(false);
    this.isUserDefinedFunctionsExpanded = ko.observable<boolean>(false);
    this.isTriggersExpanded = ko.observable<boolean>(false);
    this.isOfferRead = false;
  }

  public expandCollapseCollection() {
    this.container.selectedNode(this);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Collection node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
    if (this.isCollectionExpanded()) {
      this.collapseCollection();
    } else {
      this.expandCollection();
    }
    this.container.onUpdateTabsButtons([]);
    this.container.tabsManager.refreshActiveTab(
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    );
  }

  public collapseCollection() {
    if (!this.isCollectionExpanded()) {
      return;
    }

    this.isCollectionExpanded(false);
    TelemetryProcessor.trace(Action.CollapseTreeNode, ActionModifiers.Mark, {
      description: "Collection node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public expandCollection(): void {
    if (this.isCollectionExpanded()) {
      return;
    }

    this.isCollectionExpanded(true);
    TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
      description: "Collection node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public onDocumentDBDocumentsClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Documents node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const documentsTabs: DocumentsTab[] = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Documents,
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    ) as DocumentsTab[];
    let documentsTab: DocumentsTab = documentsTabs && documentsTabs[0];

    if (documentsTab) {
      this.container.tabsManager.activateTab(documentsTab);
    } else {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseName: this.databaseId,
        collectionName: this.id(),

        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Items",
      });
      this.documentIds([]);

      documentsTab = new DocumentsTab({
        partitionKey: this.partitionKey,
        documentIds: ko.observableArray<DocumentId>([]),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "Items",
        collection: this,
        node: this,
        tabPath: `${this.databaseId}>${this.id()}>Documents`,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/documents`,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      });

      this.container.tabsManager.activateNewTab(documentsTab);
    }
  }

  public onConflictsClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Conflicts);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Conflicts node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const conflictsTabs: ConflictsTab[] = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Conflicts,
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    ) as ConflictsTab[];
    let conflictsTab: ConflictsTab = conflictsTabs && conflictsTabs[0];

    if (conflictsTab) {
      this.container.tabsManager.activateTab(conflictsTab);
    } else {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseName: this.databaseId,
        collectionName: this.id(),

        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Conflicts",
      });
      this.documentIds([]);

      const conflictsTab: ConflictsTab = new ConflictsTab({
        partitionKey: this.partitionKey,
        conflictIds: ko.observableArray<ConflictId>([]),
        tabKind: ViewModels.CollectionTabKind.Conflicts,
        title: "Conflicts",
        collection: this,
        node: this,
        tabPath: `${this.databaseId}>${this.id()}>Conflicts`,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/conflicts`,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      });

      this.container.tabsManager.activateNewTab(conflictsTab);
    }
  }

  public onTableEntitiesClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.QueryTables);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Entities node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    if (userContext.apiType === "Cassandra" && !this.cassandraKeys) {
      (<CassandraAPIDataClient>this.container.tableDataClient).getTableKeys(this).then((keys: CassandraTableKeys) => {
        this.cassandraKeys = keys;
      });
    }

    const queryTablesTabs: QueryTablesTab[] = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.QueryTables,
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    ) as QueryTablesTab[];
    let queryTablesTab: QueryTablesTab = queryTablesTabs && queryTablesTabs[0];

    if (queryTablesTab) {
      this.container.tabsManager.activateTab(queryTablesTab);
    } else {
      this.documentIds([]);
      let title = `Entities`;
      if (userContext.apiType === "Cassandra") {
        title = `Rows`;
      }
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseName: this.databaseId,
        collectionName: this.id(),

        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: title,
      });

      queryTablesTab = new QueryTablesTab({
        tabKind: ViewModels.CollectionTabKind.QueryTables,
        title: title,
        tabPath: "",
        collection: this,
        node: this,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/entities`,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      });

      this.container.tabsManager.activateNewTab(queryTablesTab);
    }
  }

  public onGraphDocumentsClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Graph);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Documents node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const graphTabs: GraphTab[] = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Graph,
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    ) as GraphTab[];
    let graphTab: GraphTab = graphTabs && graphTabs[0];

    if (graphTab) {
      this.container.tabsManager.activateTab(graphTab);
    } else {
      this.documentIds([]);
      const title = "Graph";
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseName: this.databaseId,
        collectionName: this.id(),

        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: title,
      });

      graphTab = new GraphTab({
        account: userContext.databaseAccount,
        tabKind: ViewModels.CollectionTabKind.Graph,
        node: this,
        title: title,
        tabPath: "",

        collection: this,
        masterKey: userContext.masterKey || "",
        collectionPartitionKeyProperty: this.partitionKeyProperty,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/graphs`,
        collectionId: this.id(),
        databaseId: this.databaseId,
        isTabsContentExpanded: this.container.isTabsContentExpanded,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      });

      this.container.tabsManager.activateNewTab(graphTab);
    }
  }

  public onMongoDBDocumentsClick = () => {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Documents node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const mongoDocumentsTabs: MongoDocumentsTab[] = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Documents,
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    ) as MongoDocumentsTab[];
    let mongoDocumentsTab: MongoDocumentsTab = mongoDocumentsTabs && mongoDocumentsTabs[0];

    if (mongoDocumentsTab) {
      this.container.tabsManager.activateTab(mongoDocumentsTab);
    } else {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseName: this.databaseId,
        collectionName: this.id(),

        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Documents",
      });
      this.documentIds([]);

      mongoDocumentsTab = new MongoDocumentsTab({
        partitionKey: this.partitionKey,
        documentIds: this.documentIds,
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "Documents",
        tabPath: "",
        collection: this,
        node: this,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/mongoDocuments`,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      });
      this.container.tabsManager.activateNewTab(mongoDocumentsTab);
    }
  };

  public onSchemaAnalyzerClick = async () => {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.SchemaAnalyzer);
    const SchemaAnalyzerTab = await (await import("../Tabs/SchemaAnalyzerTab")).default;
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Schema node",
      databaseName: this.databaseId,
      collectionName: this.id(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    for (const tab of this.container.tabsManager.openedTabs()) {
      if (
        tab instanceof SchemaAnalyzerTab &&
        tab.collection?.databaseId === this.databaseId &&
        tab.collection?.id() === this.id()
      ) {
        return this.container.tabsManager.activateTab(tab);
      }
    }

    const startKey = TelemetryProcessor.traceStart(Action.Tab, {
      databaseName: this.databaseId,
      collectionName: this.id(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: "Schema",
    });
    this.documentIds([]);
    this.container.tabsManager.activateNewTab(
      new SchemaAnalyzerTab({
        account: userContext.databaseAccount,
        masterKey: userContext.masterKey || "",
        container: this.container,
        tabKind: ViewModels.CollectionTabKind.SchemaAnalyzer,
        title: "Schema",
        tabPath: "",
        collection: this,
        node: this,
        hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/schemaAnalyzer`,
        onLoadStartKey: startKey,
        onUpdateTabsButtons: this.container.onUpdateTabsButtons,
      })
    );
  };

  public onSettingsClick = async (): Promise<void> => {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Settings);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Settings node",

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const tabTitle = !this.offer() ? "Settings" : "Scale & Settings";
    const matchingTabs = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.CollectionSettingsV2,
      (tab) => {
        return tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id();
      }
    );

    const traceStartData = {
      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: tabTitle,
    };

    const settingsTabOptions: ViewModels.TabOptions = {
      tabKind: undefined,
      title: !this.offer() ? "Settings" : "Scale & Settings",
      tabPath: "",
      collection: this,
      node: this,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/settings`,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
    };

    let settingsTabV2 = matchingTabs && (matchingTabs[0] as CollectionSettingsTabV2);
    this.launchSettingsTabV2(settingsTabV2, traceStartData, settingsTabOptions);
  };

  private launchSettingsTabV2 = (
    settingsTabV2: CollectionSettingsTabV2,
    traceStartData: any,
    settingsTabOptions: ViewModels.TabOptions
  ): void => {
    if (!settingsTabV2) {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, traceStartData);
      settingsTabOptions.onLoadStartKey = startKey;
      settingsTabOptions.tabKind = ViewModels.CollectionTabKind.CollectionSettingsV2;
      settingsTabV2 = new CollectionSettingsTabV2(settingsTabOptions);
      this.container.tabsManager.activateNewTab(settingsTabV2);
    } else {
      this.container.tabsManager.activateTab(settingsTabV2);
    }
  };

  public onNewQueryClick(source: any, event: MouseEvent, queryText?: string) {
    const collection: ViewModels.Collection = source.collection || source;
    const id = this.container.tabsManager.getTabs(ViewModels.CollectionTabKind.Query).length + 1;
    const title = "Query " + id;
    const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: title,
    });

    const queryTab: QueryTab = new QueryTab({
      tabKind: ViewModels.CollectionTabKind.Query,
      title: title,
      tabPath: "",
      collection: this,
      node: this,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/query`,
      queryText: queryText,
      partitionKey: collection.partitionKey,
      onLoadStartKey: startKey,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
    });

    this.container.tabsManager.activateNewTab(queryTab);
  }

  public onNewMongoQueryClick(source: any, event: MouseEvent, queryText?: string) {
    const collection: ViewModels.Collection = source.collection || source;
    const id = this.container.tabsManager.getTabs(ViewModels.CollectionTabKind.Query).length + 1;

    const title = "Query " + id;
    const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: title,
    });

    const mongoQueryTab: MongoQueryTab = new MongoQueryTab({
      tabKind: ViewModels.CollectionTabKind.Query,
      title: title,
      tabPath: "",
      collection: this,
      node: this,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/mongoQuery`,
      partitionKey: collection.partitionKey,
      onLoadStartKey: startKey,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
    });

    this.container.tabsManager.activateNewTab(mongoQueryTab);
  }

  public onNewGraphClick() {
    const id: number = this.container.tabsManager.getTabs(ViewModels.CollectionTabKind.Graph).length + 1;
    const title: string = "Graph Query " + id;

    const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: title,
    });

    const graphTab: GraphTab = new GraphTab({
      account: userContext.databaseAccount,
      tabKind: ViewModels.CollectionTabKind.Graph,
      node: this,
      title: title,
      tabPath: "",
      collection: this,
      masterKey: userContext.masterKey || "",
      collectionPartitionKeyProperty: this.partitionKeyProperty,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/graphs`,
      collectionId: this.id(),
      databaseId: this.databaseId,
      isTabsContentExpanded: this.container.isTabsContentExpanded,
      onLoadStartKey: startKey,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
    });

    this.container.tabsManager.activateNewTab(graphTab);
  }

  public onNewMongoShellClick() {
    const id = this.container.tabsManager.getTabs(ViewModels.CollectionTabKind.MongoShell).length + 1;
    const mongoShellTab: MongoShellTab = new MongoShellTab({
      tabKind: ViewModels.CollectionTabKind.MongoShell,
      title: "Shell " + id,
      tabPath: "",
      collection: this,
      node: this,
      hashLocation: `${Constants.HashRoutePrefixes.collectionsWithIds(this.databaseId, this.id())}/mongoShell`,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
    });

    this.container.tabsManager.activateNewTab(mongoShellTab);
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

  public createStoredProcedureNode(data: StoredProcedureDefinition & Resource): StoredProcedure {
    const node = new StoredProcedure(this.container, this, data);
    this.container.selectedNode(node);
    this.children.push(node);
    return node;
  }

  public createUserDefinedFunctionNode(data: UserDefinedFunctionDefinition & Resource): UserDefinedFunction {
    const node = new UserDefinedFunction(this.container, this, data);
    this.container.selectedNode(node);
    this.children.push(node);
    return node;
  }

  public createTriggerNode(data: TriggerDefinition & Resource): Trigger {
    const node = new Trigger(this.container, this, data);
    this.container.selectedNode(node);
    this.children.push(node);
    return node;
  }

  public findStoredProcedureWithId(sprocId: string): StoredProcedure {
    return _.find(this.storedProcedures(), (storedProcedure: StoredProcedure) => storedProcedure.id() === sprocId);
  }

  public findTriggerWithId(triggerId: string): Trigger {
    return _.find(this.triggers(), (trigger: Trigger) => trigger.id() === triggerId);
  }

  public findUserDefinedFunctionWithId(userDefinedFunctionId: string): UserDefinedFunction {
    return _.find(
      this.userDefinedFunctions(),
      (userDefinedFunction: Trigger) => userDefinedFunction.id() === userDefinedFunctionId
    );
  }

  public expandCollapseStoredProcedures() {
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.StoredProcedures);
    if (this.isStoredProceduresExpanded()) {
      this.collapseStoredProcedures();
    } else {
      this.expandStoredProcedures();
    }
    this.container.tabsManager.refreshActiveTab(
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    );
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

          databaseName: this.databaseId,
          collectionName: this.id(),

          dataExplorerArea: Constants.Areas.ResourceTree,
        });
      },
      (error) => {
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Failed, {
          description: "Stored procedures node",

          databaseName: this.databaseId,
          collectionName: this.id(),

          dataExplorerArea: Constants.Areas.ResourceTree,
          error: getErrorMessage(error),
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

      databaseName: this.databaseId,
      collectionName: this.id(),

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
    this.container.tabsManager.refreshActiveTab(
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    );
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

          databaseName: this.databaseId,
          collectionName: this.id(),

          dataExplorerArea: Constants.Areas.ResourceTree,
        });
      },
      (error) => {
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Failed, {
          description: "UDF node",

          databaseName: this.databaseId,
          collectionName: this.id(),

          dataExplorerArea: Constants.Areas.ResourceTree,
          error: getErrorMessage(error),
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

      databaseName: this.databaseId,
      collectionName: this.id(),

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
    this.container.tabsManager.refreshActiveTab(
      (tab) => tab.collection && tab.collection.databaseId === this.databaseId && tab.collection.id() === this.id()
    );
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

          databaseName: this.databaseId,
          collectionName: this.id(),

          dataExplorerArea: Constants.Areas.ResourceTree,
        });
      },
      (error) => {
        this.isTriggersExpanded(true);
        TelemetryProcessor.trace(Action.ExpandTreeNode, ActionModifiers.Mark, {
          description: "Triggers node",

          databaseName: this.databaseId,
          collectionName: this.id(),

          dataExplorerArea: Constants.Areas.ResourceTree,
          error: getErrorMessage(error),
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

      databaseName: this.databaseId,
      collectionName: this.id(),

      dataExplorerArea: Constants.Areas.ResourceTree,
    });
  }

  public loadStoredProcedures(): Promise<any> {
    return readStoredProcedures(this.databaseId, this.id()).then((storedProcedures) => {
      const storedProceduresNodes: ViewModels.TreeNode[] = storedProcedures.map(
        (storedProcedure) => new StoredProcedure(this.container, this, storedProcedure)
      );
      const otherNodes = this.children().filter((node) => node.nodeKind !== "StoredProcedure");
      const allNodes = otherNodes.concat(storedProceduresNodes);
      this.children(allNodes);
    });
  }

  public loadUserDefinedFunctions(): Promise<any> {
    return readUserDefinedFunctions(this.databaseId, this.id()).then((userDefinedFunctions) => {
      const userDefinedFunctionsNodes: ViewModels.TreeNode[] = userDefinedFunctions.map(
        (udf) => new UserDefinedFunction(this.container, this, udf)
      );
      const otherNodes = this.children().filter((node) => node.nodeKind !== "UserDefinedFunction");
      const allNodes = otherNodes.concat(userDefinedFunctionsNodes);
      this.children(allNodes);
    });
  }

  public loadTriggers(): Promise<any> {
    return readTriggers(this.databaseId, this.id()).then((triggers) => {
      const triggerNodes: ViewModels.TreeNode[] = triggers.map((trigger) => new Trigger(this.container, this, trigger));
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

  public async getPendingThroughputSplitNotification(): Promise<DataModels.Notification> {
    if (!this.container) {
      return undefined;
    }

    try {
      const notifications: DataModels.Notification[] = await fetchPortalNotifications();
      if (!notifications || notifications.length === 0) {
        return undefined;
      }

      return _.find(notifications, (notification: DataModels.Notification) => {
        const throughputUpdateRegExp: RegExp = new RegExp("Throughput update (.*) in progress");
        return (
          notification.kind === "message" &&
          notification.collectionName === this.id() &&
          notification.description &&
          throughputUpdateRegExp.test(notification.description)
        );
      });
    } catch (error) {
      Logger.logError(
        JSON.stringify({
          error: getErrorMessage(error),
          accountName: userContext?.databaseAccount,
          databaseName: this.databaseId,
          collectionName: this.id(),
        }),
        "Settings tree node"
      );

      return undefined;
    }
  }

  public async uploadFiles(files: FileList): Promise<{ data: UploadDetailsRecord[] }> {
    const data = await Promise.all(Array.from(files).map((file) => this.uploadFile(file)));

    return { data };
  }

  private uploadFile(file: File): Promise<UploadDetailsRecord> {
    const reader = new FileReader();
    const onload = (resolve: (value: UploadDetailsRecord) => void, evt: any): void => {
      const fileData: string = evt.target.result;
      this._createDocumentsFromFile(file.name, fileData).then((record) => resolve(record));
    };

    const onerror = (resolve: (value: UploadDetailsRecord) => void, evt: ProgressEvent): void => {
      resolve({
        fileName: file.name,
        numSucceeded: 0,
        numThrottled: 0,
        numFailed: 1,
        errors: [(evt as any).error.message],
      });
    };

    return new Promise<UploadDetailsRecord>((resolve) => {
      reader.onload = onload.bind(this, resolve);
      reader.onerror = onerror.bind(this, resolve);
      reader.readAsText(file);
    });
  }

  private async _createDocumentsFromFile(fileName: string, documentContent: string): Promise<UploadDetailsRecord> {
    const record: UploadDetailsRecord = {
      fileName: fileName,
      numSucceeded: 0,
      numFailed: 0,
      numThrottled: 0,
      errors: [],
    };

    try {
      const parsedContent = JSON.parse(documentContent);
      if (Array.isArray(parsedContent)) {
        const chunkSize = 100; // 100 is the max # of bulk operations the SDK currently accepts
        const chunkedContent = Array.from({ length: Math.ceil(parsedContent.length / chunkSize) }, (_, index) =>
          parsedContent.slice(index * chunkSize, index * chunkSize + chunkSize)
        );
        for (const chunk of chunkedContent) {
          let retryAttempts = 0;
          let chunkComplete = false;
          let documentsToAttempt = chunk;
          while (retryAttempts < 10 && !chunkComplete) {
            const responses = await bulkCreateDocument(this, documentsToAttempt);
            const attemptedDocuments = [...documentsToAttempt];
            documentsToAttempt = [];
            responses.forEach((response, index) => {
              if (response.statusCode === 201) {
                record.numSucceeded++;
              } else if (response.statusCode === 429) {
                documentsToAttempt.push(attemptedDocuments[index]);
              } else {
                record.numFailed++;
              }
            });
            if (documentsToAttempt.length === 0) {
              chunkComplete = true;
              break;
            }
            logConsoleInfo(
              `${documentsToAttempt.length} document creations were throttled. Waiting ${retryAttempts} seconds and retrying throttled documents`
            );
            retryAttempts++;
            await sleep(retryAttempts);
          }
        }
      } else {
        await createDocument(this, parsedContent);
        record.numSucceeded++;
      }

      return record;
    } catch (error) {
      record.numFailed++;
      record.errors = [...record.errors, error.message];
      return record;
    }
  }

  /**
   * Top-level method that will open the correct tab type depending on account API
   */
  public openTab(): void {
    if (userContext.apiType === "Tables") {
      this.onTableEntitiesClick();
      return;
    } else if (userContext.apiType === "Cassandra") {
      this.onTableEntitiesClick();
      return;
    } else if (userContext.apiType === "Gremlin") {
      this.onGraphDocumentsClick();
      return;
    } else if (userContext.apiType === "Mongo") {
      this.onMongoDBDocumentsClick();
      return;
    }

    this.onDocumentDBDocumentsClick();
  }

  /**
   * Get correct collection label depending on account API
   */
  public getLabel(): string {
    if (userContext.apiType === "Tables") {
      return "Entities";
    } else if (userContext.apiType === "Cassandra") {
      return "Rows";
    } else if (userContext.apiType === "Gremlin") {
      return "Graph";
    } else if (userContext.apiType === "Mongo") {
      return "Documents";
    }

    return "Items";
  }

  public getDatabase(): ViewModels.Database {
    return this.container.findDatabaseWithId(this.databaseId);
  }

  public async loadOffer(): Promise<void> {
    if (!this.isOfferRead && !this.container.isServerlessEnabled() && !this.offer()) {
      const startKey: number = TelemetryProcessor.traceStart(Action.LoadOffers, {
        databaseName: this.databaseId,
        collectionName: this.id(),
      });

      const params: DataModels.ReadCollectionOfferParams = {
        collectionId: this.id(),
        collectionResourceId: this.self,
        databaseId: this.databaseId,
      };

      try {
        this.offer(await readCollectionOffer(params));
        this.usageSizeInKB(await getCollectionUsageSizeInKB(this.databaseId, this.id()));
        this.isOfferRead = true;

        TelemetryProcessor.traceSuccess(
          Action.LoadOffers,
          {
            databaseName: this.databaseId,
            collectionName: this.id(),
          },
          startKey
        );
      } catch (error) {
        TelemetryProcessor.traceFailure(
          Action.LoadOffers,
          {
            databaseName: this.databaseId,
            collectionName: this.id(),

            error: getErrorMessage(error),
            errorStack: getErrorStack(error),
          },
          startKey
        );
        throw error;
      }
    }
  }
}

function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
