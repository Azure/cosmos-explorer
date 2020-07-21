import * as DataModels from "../../src/Contracts/DataModels";
import * as ko from "knockout";
import * as ViewModels from "../../src/Contracts/ViewModels";
import DocumentClientUtilityBase from "../Common/DocumentClientUtilityBase";
import Q from "q";
import { CassandraTableKey, CassandraTableKeys } from "../../src/Explorer/Tables/TableDataClient";
import { UploadDetails } from "../workers/upload/definitions";
import Explorer from "./Explorer";

export class DatabaseStub implements ViewModels.Database {
  public nodeKind: string;
  public container: Explorer;
  public self: string;
  public rid: string;
  public id: ko.Observable<string>;
  public collections: ko.ObservableArray<ViewModels.Collection>;
  public isDatabaseExpanded: ko.Observable<boolean>;
  public isDatabaseShared: ko.Computed<boolean>;
  public selectedSubnodeKind: ko.Observable<ViewModels.CollectionTabKind>;
  public offer: ko.Observable<DataModels.Offer>;

  constructor(options?: any) {
    this.nodeKind = options.nodeKind;
    this.container = options.container;
    this.self = options.self;
    this.rid = options.rid;
    this.id = options.id;
    this.collections = options.collections;
    this.isDatabaseExpanded = options.isDatabaseExpanded;
    this.offer = options.offer;
    this.selectedSubnodeKind = options.selectedSubnodeKind;
  }

  public onKeyPress = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onMenuKeyDown = (source: any, event: KeyboardEvent): boolean => {
    throw new Error("Not implemented");
  };

  public onDeleteDatabaseContextMenuClick(source: ViewModels.Database, event: MouseEvent | KeyboardEvent) {
    throw new Error("Not implemented");
  }

  public selectDatabase() {
    throw new Error("Not implemented");
  }

  public expandCollapseDatabase() {
    throw new Error("Not implemented");
  }

  public expandDatabase() {
    throw new Error("Not implemented");
  }

  public collapseDatabase() {
    throw new Error("Not implemented");
  }

  public loadCollections(): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public findCollectionWithId(collectionId: string): ViewModels.Collection {
    throw new Error("Not implemented");
  }

  public openAddCollection(database: ViewModels.Database, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public readSettings() {
    throw new Error("Not implemented");
  }

  public onSettingsClick(): void {
    throw new Error("Not implemented");
  }
}

export class CollectionStub implements ViewModels.Collection {
  public nodeKind: string;
  public container: Explorer;
  public rawDataModel: DataModels.Collection;
  public self: string;
  public rid: string;
  public databaseId: string;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyPropertyHeader: string;
  public partitionKeyProperty: string;
  public id: ko.Observable<string>;
  public defaultTtl: ko.Observable<number>;
  public analyticalStorageTtl: ko.Observable<number>;
  public indexingPolicy: ko.Observable<DataModels.IndexingPolicy>;
  public uniqueKeyPolicy: DataModels.UniqueKeyPolicy;
  public quotaInfo: ko.Observable<DataModels.CollectionQuotaInfo>;
  public offer: ko.Observable<DataModels.Offer>;
  public partitions: ko.Computed<number>;
  public throughput: ko.Computed<number>;
  public cassandraKeys: CassandraTableKeys;
  public cassandraSchema: CassandraTableKey[];
  public documentIds: ko.ObservableArray<ViewModels.DocumentId>;
  public children: ko.ObservableArray<ViewModels.TreeNode>;
  public storedProcedures: ko.Computed<ViewModels.StoredProcedure[]>;
  public userDefinedFunctions: ko.Computed<ViewModels.UserDefinedFunction[]>;
  public triggers: ko.Computed<ViewModels.Trigger[]>;
  public showStoredProcedures: ko.Observable<boolean>;
  public showTriggers: ko.Observable<boolean>;
  public showUserDefinedFunctions: ko.Observable<boolean>;
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
  public conflictResolutionPolicy: ko.Observable<DataModels.ConflictResolutionPolicy>;
  public changeFeedPolicy: ko.Observable<DataModels.ChangeFeedPolicy>;
  public geospatialConfig: ko.Observable<DataModels.GeospatialConfig>;

  constructor(options: any) {
    this.nodeKind = options.nodeKind;
    this.container = options.container;
    this.self = options.self;
    this.rid = options.rid;
    this.databaseId = options.databaseId;
    this.partitionKey = options.partitionKey;
    this.partitionKeyPropertyHeader = options.partitionKeyPropertyHeader;
    this.partitionKeyProperty = options.partitionKeyProperty;
    this.id = options.id;
    this.defaultTtl = options.defaultTtl;
    this.analyticalStorageTtl = options.analyticalStorageTtl;
    this.indexingPolicy = options.indexingPolicy;
    this.uniqueKeyPolicy = options.uniqueKeyPolicy;
    this.quotaInfo = options.quotaInfo;
    this.offer = options.offer;
    this.partitions = options.partitions;
    this.throughput = options.throughput;
    this.cassandraKeys = options.cassandraKeys;
    this.cassandraSchema = options.cassandraSchema;
    this.documentIds = options.documentIds;
    this.children = options.children;
    this.storedProcedures = options.storedProcedures;
    this.userDefinedFunctions = options.userDefinedFunctions;
    this.triggers = options.triggers;
    this.showStoredProcedures = options.showStoredProcedures;
    this.showTriggers = options.showTriggers;
    this.showUserDefinedFunctions = options.showUserDefinedFunctions;
    this.selectedDocumentContent = options.selectedDocumentContent;
    this.selectedSubnodeKind = options.selectedSubnodeKind;
    this.focusedSubnodeKind = options.focusedSubnodeKind;
    this.isCollectionExpanded = options.isCollectionExpanded;
    this.isStoredProceduresExpanded = options.isStoredProceduresExpanded;
    this.isUserDefinedFunctionsExpanded = options.isUserDefinedFunctionsExpanded;
    this.isTriggersExpanded = options.isTriggersExpanded;
    this.documentsFocused = options.documentsFocused;
    this.settingsFocused = options.settingsFocused;
    this.storedProceduresFocused = options.storedProceduresFocused;
    this.userDefinedFunctionsFocused = options.userDefinedFunctionsFocused;
    this.triggersFocused = options.triggersFocused;
  }

  public expandCollapseCollection() {
    throw new Error("Not implemented");
  }

  public collapseCollection() {
    throw new Error("Not implemented");
  }

  public expandCollection(): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public onDocumentDBDocumentsClick() {
    throw new Error("onDocumentDBDocumentsClick");
  }

  public onTableEntitiesClick() {
    throw new Error("Not implemented");
  }

  public onGraphDocumentsClick() {
    throw new Error("Not implemented");
  }

  public onMongoDBDocumentsClick = () => {
    throw new Error("Not implemented");
  };

  public openTab = () => {
    throw new Error("Not implemented");
  };

  public onSettingsClick() {
    throw new Error("Not implemented");
  }

  public onConflictsClick() {
    throw new Error("Not implemented");
  }

  public readSettings(): Q.Promise<void> {
    throw new Error("Not implemented");
  }

  public onNewQueryClick(source: any, event: MouseEvent, queryText?: string) {
    throw new Error("Not implemented");
  }

  public onNewMongoQueryClick(source: any, event: MouseEvent, queryText?: string) {
    throw new Error("Not implemented");
  }

  public onNewGraphClick() {
    throw new Error("Not implemented");
  }

  public onNewMongoShellClick() {
    throw new Error("Not implemented");
  }

  public onNewStoredProcedureClick(source: ViewModels.Collection, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public onNewUserDefinedFunctionClick(source: ViewModels.Collection, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public onNewTriggerClick(source: ViewModels.Collection, event: MouseEvent) {
    throw new Error("Not implemented");
  }

  public createStoredProcedureNode(data: DataModels.StoredProcedure): ViewModels.StoredProcedure {
    throw new Error("Not implemented");
  }

  public createUserDefinedFunctionNode(data: DataModels.UserDefinedFunction): ViewModels.UserDefinedFunction {
    throw new Error("Not implemented");
  }

  public createTriggerNode(data: DataModels.Trigger): ViewModels.Trigger {
    throw new Error("Not implemented");
  }

  public expandCollapseStoredProcedures() {
    throw new Error("Not implemented");
  }

  public expandStoredProcedures() {
    throw new Error("Not implemented");
  }

  public collapseStoredProcedures() {
    throw new Error("Not implemented");
  }

  public expandCollapseUserDefinedFunctions() {
    throw new Error("Not implemented");
  }

  public expandUserDefinedFunctions() {
    throw new Error("Not implemented");
  }

  public collapseUserDefinedFunctions() {
    throw new Error("Not implemented");
  }

  public expandCollapseTriggers() {
    throw new Error("Not implemented");
  }

  public expandTriggers() {
    throw new Error("Not implemented");
  }

  public collapseTriggers() {
    throw new Error("Not implemented");
  }

  public loadStoredProcedures(): Q.Promise<any> {
    throw new Error("Not implemented");
  }

  public loadUserDefinedFunctions(): Q.Promise<any> {
    throw new Error("Not implemented");
  }

  public loadTriggers(): Q.Promise<any> {
    throw new Error("Not implemented");
  }

  public onDragOver(source: ViewModels.Collection, event: { originalEvent: DragEvent }) {
    throw new Error("Not implemented");
  }

  public onDrop(source: ViewModels.Collection, event: { originalEvent: DragEvent }) {
    throw new Error("Not implemented");
  }

  public isCollectionNodeSelected(): boolean {
    throw new Error("Not implemented");
  }

  public isSubNodeSelected(nodeKind: ViewModels.CollectionTabKind): boolean {
    throw new Error("Not implemented");
  }

  public onDeleteCollectionContextMenuClick(source: ViewModels.Collection, event: MouseEvent | KeyboardEvent) {
    throw new Error("Not implemented");
  }

  public findStoredProcedureWithId(sprocId: string): ViewModels.StoredProcedure {
    throw new Error("Not implemented");
  }

  public findTriggerWithId(triggerId: string): ViewModels.Trigger {
    throw new Error("Not implemented");
  }

  public findUserDefinedFunctionWithId(userDefinedFunctionId: string): ViewModels.UserDefinedFunction {
    throw new Error("Not implemented");
  }

  public uploadFiles = (fileList: FileList): Q.Promise<UploadDetails> => {
    throw new Error("Not implemented");
  };

  public getLabel(): string {
    throw new Error("Not implemented");
  }

  public getDatabase(): ViewModels.Database {
    throw new Error("Not implemented");
  }
}
