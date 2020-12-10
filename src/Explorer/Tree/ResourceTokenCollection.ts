import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import DocumentId from "./DocumentId";
import DocumentsTab from "../Tabs/DocumentsTab";
import Q from "q";
import QueryTab from "../Tabs/QueryTab";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import Explorer from "../Explorer";
import TabsBase from "../Tabs/TabsBase";

export default class ResourceTokenCollection implements ViewModels.CollectionBase {
  public nodeKind: string;
  public container: Explorer;
  public databaseId: string;
  public self: string;
  public rid: string;
  public rawDataModel: DataModels.Collection;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyProperty: string;
  public partitionKeyPropertyHeader: string;
  public id: ko.Observable<string>;
  public children: ko.ObservableArray<ViewModels.TreeNode>;
  public selectedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  public isCollectionExpanded: ko.Observable<boolean>;

  constructor(container: Explorer, databaseId: string, data: DataModels.Collection) {
    this.nodeKind = "Collection";
    this.container = container;
    this.databaseId = databaseId;
    this.self = data._self;
    this.rid = data._rid;
    this.rawDataModel = data;
    this.partitionKey = data.partitionKey;

    this.id = ko.observable(data.id);
    this.children = ko.observableArray<ViewModels.TreeNode>([]);
    this.selectedSubnodeKind = ko.observable<ViewModels.CollectionTabKind>();
    this.isCollectionExpanded = ko.observable<boolean>(true);
  }

  public expandCollection(): Q.Promise<void> {
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

  public onNewQueryClick(source: any, event: MouseEvent, queryText?: string) {
    const collection: ViewModels.Collection = source.collection || source;
    const id = this.container.tabsManager.getTabs(ViewModels.CollectionTabKind.Query).length + 1;
    const title = "Query " + id;
    const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
      databaseAccountName: this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
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
      isActive: ko.observable(false),
      queryText: queryText,
      partitionKey: collection.partitionKey,
      resourceTokenPartitionKey: this.container.resourceTokenPartitionKey(),
      onLoadStartKey: startKey,
      onUpdateTabsButtons: this.container.onUpdateTabsButtons,
    });

    this.container.tabsManager.activateNewTab(queryTab);
  }

  public onDocumentDBDocumentsClick() {
    this.container.selectedNode(this);
    this.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    TelemetryProcessor.trace(Action.SelectItem, ActionModifiers.Mark, {
      description: "Documents node",
      databaseAccountName: this.container.databaseAccount() && this.container.databaseAccount().name,
      databaseName: this.databaseId,
      collectionName: this.id(),
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.ResourceTree,
    });

    const documentsTabs: DocumentsTab[] = this.container.tabsManager.getTabs(
      ViewModels.CollectionTabKind.Documents,
      (tab: TabsBase) =>
        tab.collection?.id() === this.id() &&
        (tab.collection as ViewModels.CollectionBase).databaseId === this.databaseId
    ) as DocumentsTab[];
    let documentsTab: DocumentsTab = documentsTabs && documentsTabs[0];

    if (documentsTab) {
      this.container.tabsManager.activateTab(documentsTab);
    } else {
      const startKey: number = TelemetryProcessor.traceStart(Action.Tab, {
        databaseAccountName: this.container.databaseAccount() && this.container.databaseAccount().name,
        databaseName: this.databaseId,
        collectionName: this.id(),
        defaultExperience: this.container.defaultExperience(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: "Items",
      });

      documentsTab = new DocumentsTab({
        partitionKey: this.partitionKey,
        resourceTokenPartitionKey: this.container.resourceTokenPartitionKey(),
        documentIds: ko.observableArray<DocumentId>([]),
        tabKind: ViewModels.CollectionTabKind.Documents,
        title: "Items",
        isActive: ko.observable<boolean>(false),
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

  public getDatabase(): ViewModels.Database {
    return this.container.findDatabaseWithId(this.databaseId);
  }
}
