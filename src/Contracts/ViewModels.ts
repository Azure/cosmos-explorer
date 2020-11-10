import {
  QueryMetrics,
  Resource,
  StoredProcedureDefinition,
  TriggerDefinition,
  UserDefinedFunctionDefinition
} from "@azure/cosmos";
import Q from "q";
import { CommandButtonComponentProps } from "../Explorer/Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer/Explorer";
import { ConsoleData } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { CassandraTableKey, CassandraTableKeys } from "../Explorer/Tables/TableDataClient";
import ConflictId from "../Explorer/Tree/ConflictId";
import DocumentId from "../Explorer/Tree/DocumentId";
import StoredProcedure from "../Explorer/Tree/StoredProcedure";
import Trigger from "../Explorer/Tree/Trigger";
import UserDefinedFunction from "../Explorer/Tree/UserDefinedFunction";
import { UploadDetails } from "../workers/upload/definitions";
import * as DataModels from "./DataModels";

export interface TokenProvider {
  getAuthHeader(): Promise<Headers>;
}

export interface QueryResultsMetadata {
  hasMoreResults: boolean;
  firstItemIndex: number;
  lastItemIndex: number;
  itemCount: number;
}

export interface QueryResults extends QueryResultsMetadata {
  documents: any[];
  activityId: string;
  requestCharge: number;
  roundTrips?: number;
  headers?: any;
  queryMetrics?: QueryMetrics;
}

export interface Button {
  visible: ko.Computed<boolean>;
  enabled: ko.Computed<boolean>;
  isSelected?: ko.Computed<boolean>;
}

export interface NotificationConsole {
  filteredConsoleData: ko.ObservableArray<ConsoleData>;
  isConsoleExpanded: ko.Observable<boolean>;

  expandConsole(source: any, evt: MouseEvent): void;
  collapseConsole(source: any, evt: MouseEvent): void;
}

export interface WaitsForTemplate {
  isTemplateReady: ko.Observable<boolean>;
}

export interface TreeNode {
  nodeKind: string;
  rid: string;
  id: ko.Observable<string>;
  database?: Database;
  collection?: Collection;

  onNewQueryClick?(source: any, event: MouseEvent): void;
  onNewStoredProcedureClick?(source: Collection, event: MouseEvent): void;
  onNewUserDefinedFunctionClick?(source: Collection, event: MouseEvent): void;
  onNewTriggerClick?(source: Collection, event: MouseEvent): void;
}

export interface Database extends TreeNode {
  container: Explorer;
  self: string;
  id: ko.Observable<string>;
  collections: ko.ObservableArray<Collection>;
  offer: ko.Observable<DataModels.Offer>;
  isDatabaseExpanded: ko.Observable<boolean>;
  isDatabaseShared: ko.Computed<boolean>;

  selectedSubnodeKind: ko.Observable<CollectionTabKind>;

  selectDatabase(): void;
  expandDatabase(): Promise<void>;
  collapseDatabase(): void;

  loadCollections(): Promise<void>;
  findCollectionWithId(collectionId: string): Collection;
  openAddCollection(database: Database, event: MouseEvent): void;
  onDeleteDatabaseContextMenuClick(source: Database, event: MouseEvent | KeyboardEvent): void;
  onSettingsClick: () => void;
  loadOffer(): Promise<void>;
}

export interface CollectionBase extends TreeNode {
  container: Explorer;
  databaseId: string;
  self: string;
  rawDataModel: DataModels.Collection;
  partitionKey: DataModels.PartitionKey;
  partitionKeyProperty: string;
  partitionKeyPropertyHeader: string;
  id: ko.Observable<string>;
  selectedSubnodeKind: ko.Observable<CollectionTabKind>;
  children: ko.ObservableArray<TreeNode>;
  isCollectionExpanded: ko.Observable<boolean>;

  onDocumentDBDocumentsClick(): void;
  onNewQueryClick(source: any, event: MouseEvent, queryText?: string): void;
  expandCollection(): Q.Promise<any>;
  collapseCollection(): void;
  getDatabase(): Database;
}

export interface Collection extends CollectionBase {
  defaultTtl: ko.Observable<number>;
  analyticalStorageTtl: ko.Observable<number>;
  schema?: DataModels.ISchema;
  requestSchema?: () => void;
  indexingPolicy: ko.Observable<DataModels.IndexingPolicy>;
  uniqueKeyPolicy: DataModels.UniqueKeyPolicy;
  quotaInfo: ko.Observable<DataModels.CollectionQuotaInfo>;
  offer: ko.Observable<DataModels.Offer>;
  conflictResolutionPolicy: ko.Observable<DataModels.ConflictResolutionPolicy>;
  changeFeedPolicy: ko.Observable<DataModels.ChangeFeedPolicy>;
  geospatialConfig: ko.Observable<DataModels.GeospatialConfig>;
  documentIds: ko.ObservableArray<DocumentId>;

  cassandraKeys: CassandraTableKeys;
  cassandraSchema: CassandraTableKey[];

  onConflictsClick(): void;
  onTableEntitiesClick(): void;
  onGraphDocumentsClick(): void;
  onMongoDBDocumentsClick(): void;
  openTab(): void;

  onSettingsClick: () => Promise<void>;
  onDeleteCollectionContextMenuClick(source: Collection, event: MouseEvent): void;

  onNewGraphClick(): void;
  onNewMongoQueryClick(source: any, event: MouseEvent, queryText?: string): void;
  onNewMongoShellClick(): void;
  onNewStoredProcedureClick(source: Collection, event: MouseEvent): void;
  onNewUserDefinedFunctionClick(source: Collection, event: MouseEvent): void;
  onNewTriggerClick(source: Collection, event: MouseEvent): void;
  storedProcedures: ko.Computed<StoredProcedure[]>;
  userDefinedFunctions: ko.Computed<UserDefinedFunction[]>;
  triggers: ko.Computed<Trigger[]>;

  isStoredProceduresExpanded: ko.Observable<boolean>;
  isTriggersExpanded: ko.Observable<boolean>;
  isUserDefinedFunctionsExpanded: ko.Observable<boolean>;

  expandStoredProcedures(): void;
  expandUserDefinedFunctions(): void;
  expandTriggers(): void;

  collapseStoredProcedures(): void;
  collapseUserDefinedFunctions(): void;
  collapseTriggers(): void;

  loadUserDefinedFunctions(): Promise<any>;
  loadStoredProcedures(): Promise<any>;
  loadTriggers(): Promise<any>;
  loadOffer(): Promise<void>;

  createStoredProcedureNode(data: StoredProcedureDefinition & Resource): StoredProcedure;
  createUserDefinedFunctionNode(data: UserDefinedFunctionDefinition & Resource): UserDefinedFunction;
  createTriggerNode(data: TriggerDefinition & Resource): Trigger;
  findStoredProcedureWithId(sprocRid: string): StoredProcedure;
  findTriggerWithId(triggerRid: string): Trigger;
  findUserDefinedFunctionWithId(udfRid: string): UserDefinedFunction;

  onDragOver(source: Collection, event: { originalEvent: DragEvent }): void;
  onDrop(source: Collection, event: { originalEvent: DragEvent }): void;
  uploadFiles(fileList: FileList): Q.Promise<UploadDetails>;

  getLabel(): string;
}

/**
 * Options used to initialize pane
 */
export interface PaneOptions {
  id: string;
  visible: ko.Observable<boolean>;
  container?: Explorer;
}

/**
 * Graph configuration
 */
export enum NeighborType {
  SOURCES_ONLY,
  TARGETS_ONLY,
  BOTH
}

/**
 * Set of observable related to graph configuration by user
 */
export interface GraphConfigUiData {
  showNeighborType: ko.Observable<NeighborType>;
  nodeProperties: ko.ObservableArray<string>;
  nodePropertiesWithNone: ko.ObservableArray<string>;
  nodeCaptionChoice: ko.Observable<string>;
  nodeColorKeyChoice: ko.Observable<string>;
  nodeIconChoice: ko.Observable<string>;
  nodeIconSet: ko.Observable<string>;
}

/**
 * User input for creating new vertex
 */
export interface NewVertexData {
  label: string;
  properties: InputProperty[];
}

export type GremlinPropertyValueType = string | boolean | number | null | undefined;
export type InputPropertyValueTypeString = "string" | "number" | "boolean" | "null";
export interface InputPropertyValue {
  value: GremlinPropertyValueType;
  type: InputPropertyValueTypeString;
}
/**
 * Property input by user
 */
export interface InputProperty {
  key: string;
  values: InputPropertyValue[];
}

export interface Editable<T> extends ko.Observable<T> {
  setBaseline(baseline: T): void;

  editableIsDirty: ko.Computed<boolean>;
  editableIsValid: ko.Observable<boolean>;
  getEditableCurrentValue?: ko.Computed<T>;
  getEditableOriginalValue?: ko.Computed<T>;
  edits?: ko.ObservableArray<T>;
  validations?: ko.ObservableArray<(value: T) => boolean>;
}

export interface QueryError {
  message: string;
  start: string;
  end: string;
  code: string;
  severity: string;
}

export interface DocumentRequestContainer {
  self: string;
  rid?: string;
  resourceName?: string;
}

export interface DocumentClientOption {
  endpoint?: string;
  masterKey?: string;
  requestTimeoutMs?: number;
}

// Tab options
export interface TabOptions {
  tabKind: CollectionTabKind;
  title: string;
  tabPath: string;
  isActive: ko.Observable<boolean>;
  hashLocation: string;
  onUpdateTabsButtons: (buttons: CommandButtonComponentProps[]) => void;
  isTabsContentExpanded?: ko.Observable<boolean>;
  onLoadStartKey?: number;

  // TODO Remove the flag and use a context to handle this
  // TODO: 145357 Remove dependency on collection/database and add abstraction
  collection?: CollectionBase;
  database?: Database;
  rid?: string;
  node?: TreeNode;
  theme?: string;
}

export interface DocumentsTabOptions extends TabOptions {
  partitionKey: DataModels.PartitionKey;
  documentIds: ko.ObservableArray<DocumentId>;
  container?: Explorer;
  isPreferredApiMongoDB?: boolean;
  resourceTokenPartitionKey?: string;
}

export interface SettingsTabV2Options extends TabOptions {
  getPendingNotification: Q.Promise<DataModels.Notification>;
}

export interface ConflictsTabOptions extends TabOptions {
  partitionKey: DataModels.PartitionKey;
  conflictIds: ko.ObservableArray<ConflictId>;
  container?: Explorer;
}

export interface QueryTabOptions extends TabOptions {
  partitionKey?: DataModels.PartitionKey;
  queryText?: string;
  resourceTokenPartitionKey?: string;
}

export interface ScriptTabOption extends TabOptions {
  resource: any;
  isNew: boolean;
  partitionKey?: DataModels.PartitionKey;
}

export interface EditorPosition {
  line: number;
  column: number;
}

export enum DocumentExplorerState {
  noDocumentSelected,
  newDocumentValid,
  newDocumentInvalid,
  exisitingDocumentNoEdits,
  exisitingDocumentDirtyValid,
  exisitingDocumentDirtyInvalid
}

export enum IndexingPolicyEditorState {
  noCollectionSelected,
  noEdits,
  dirtyValid,
  dirtyInvalid
}

export enum ScriptEditorState {
  newInvalid,
  newValid,
  exisitingNoEdits,
  exisitingDirtyValid,
  exisitingDirtyInvalid
}

export enum CollectionTabKind {
  Documents = 0,
  Settings = 1,
  StoredProcedures = 2,
  UserDefinedFunctions = 3,
  Triggers = 4,
  Query = 5,
  Graph = 6,
  QueryTables = 9,
  MongoShell = 10,
  DatabaseSettings = 11,
  Conflicts = 12,
  Notebook = 13 /* Deprecated */,
  Terminal = 14,
  NotebookV2 = 15,
  SparkMasterTab = 16,
  Gallery = 17,
  NotebookViewer = 18,
  Schema = 19
  SettingsV2 = 19
}

export enum TerminalKind {
  Default = 0,
  Mongo = 1,
  Cassandra = 2
}

export interface DataExplorerInputsFrame {
  databaseAccount: any;
  subscriptionId: string;
  resourceGroup: string;
  masterKey: string;
  hasWriteAccess: boolean;
  authorizationToken: string;
  features: any;
  csmEndpoint: string;
  dnsSuffix: string;
  serverId: string;
  extensionEndpoint: string;
  subscriptionType: SubscriptionType;
  quotaId: string;
  addCollectionDefaultFlight: string;
  isTryCosmosDBSubscription: boolean;
  loadDatabaseAccountTimestamp?: number;
  sharedThroughputMinimum?: number;
  sharedThroughputMaximum?: number;
  sharedThroughputDefault?: number;
  dataExplorerVersion?: string;
  isAuthWithresourceToken?: boolean;
  defaultCollectionThroughput?: CollectionCreationDefaults;
  flights?: readonly string[];
}

export interface CollectionCreationDefaults {
  storage: string;
  throughput: ThroughputDefaults;
}

export interface ThroughputDefaults {
  fixed: number;
  unlimited:
    | number
    | {
        collectionThreshold: number;
        lessThanOrEqualToThreshold: number;
        greatThanThreshold: number;
      };
  unlimitedmax: number;
  unlimitedmin: number;
  shared: number;
}

export enum SubscriptionType {
  Benefits,
  EA,
  Free,
  Internal,
  PAYG
}

export class MonacoEditorSettings {
  public readonly language: string;
  public readonly readOnly: boolean;

  constructor(supportedLanguage: string, isReadOnly: boolean) {
    this.language = supportedLanguage;
    this.readOnly = isReadOnly;
  }
}

export interface AuthorizationTokenHeaderMetadata {
  header: string;
  token: string;
}

export interface DropdownOption<T> {
  text: string;
  value: T;
  disable?: boolean;
}
