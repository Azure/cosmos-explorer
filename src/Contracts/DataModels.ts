import { CapacityMode, ConnectionStatusType, ContainerStatusType } from "../Common/Constants";

export interface ArmEntity {
  id: string;
  name: string;
  location: string;
  type: string;
  kind: string;
  tags?: Tags;
  resourceGroup?: string;
}

export interface DatabaseAccount extends ArmEntity {
  properties: DatabaseAccountExtendedProperties;
  systemData?: DatabaseAccountSystemData;
}

export interface DatabaseAccountSystemData {
  createdAt: string;
}

export interface DatabaseAccountExtendedProperties {
  documentEndpoint?: string;
  disableLocalAuth?: boolean;
  tableEndpoint?: string;
  gremlinEndpoint?: string;
  cassandraEndpoint?: string;
  configurationOverrides?: ConfigurationOverrides;
  capabilities?: Capability[];
  enableMultipleWriteLocations?: boolean;
  mongoEndpoint?: string;
  readLocations?: DatabaseAccountResponseLocation[];
  writeLocations?: DatabaseAccountResponseLocation[];
  enableFreeTier?: boolean;
  enableAnalyticalStorage?: boolean;
  enableMaterializedViews?: boolean;
  isVirtualNetworkFilterEnabled?: boolean;
  ipRules?: IpRule[];
  privateEndpointConnections?: unknown[];
  capacity?: { totalThroughputLimit: number };
  capacityMode?: CapacityMode;
  locations?: DatabaseAccountResponseLocation[];
  postgresqlEndpoint?: string;
  publicNetworkAccess?: string;
  enablePriorityBasedExecution?: boolean;
  vcoreMongoEndpoint?: string;
}

export interface DatabaseAccountResponseLocation {
  documentEndpoint: string;
  failoverPriority: number;
  id: string;
  locationId: string;
  locationName: string;
  provisioningState: string;
}

export interface IpRule {
  ipAddressOrRange: string;
}

export interface ConfigurationOverrides {
  EnableBsonSchema: string;
}

export interface Capability {
  name: string;
  description: string;
}

export interface AccessInputMetadata {
  accountName: string;
  apiEndpoint: string;
  apiKind: number;
  documentEndpoint: string;
  expiryTimestamp: string;
  mongoEndpoint?: string;
}

export enum ApiKind {
  SQL = 0,
  MongoDB,
  Table,
  Cassandra,
  Graph,
  MongoDBCompute,
}

export interface GenerateTokenResponse {
  readWrite: string;
  read: string;
}

export interface Subscription {
  uniqueDisplayName?: string;
  displayName: string;
  subscriptionId: string;
  tenantId?: string;
  state: string;
  subscriptionPolicies?: SubscriptionPolicies;
  authorizationSource?: string;
}

export interface SubscriptionPolicies {
  locationPlacementId: string;
  quotaId: string;
  spendingLimit?: string;
}

export interface Resource {
  _rid: string;
  _self: string;
  _etag: string;
  _ts: number | string;
  id: string;
}

export interface IType {
  name: string;
  code: number;
}

export interface IDataField {
  dataType: IType;
  hasNulls: boolean;
  isArray: boolean;
  schemaType: IType;
  name: string;
  path: string;
  maxRepetitionLevel: number;
  maxDefinitionLevel: number;
}

export interface ISchema {
  id: string;
  accountName: string;
  resource: string;
  fields: IDataField[];
}

export interface ISchemaRequest {
  id: string;
  subscriptionId: string;
  resourceGroup: string;
  accountName: string;
  resource: string;
  status: string;
}

export interface Collection extends Resource {
  // Only in Mongo collections loaded via ARM
  shardKey?: {
    [key: string]: string;
  };
  defaultTtl?: number;
  indexingPolicy?: IndexingPolicy;
  partitionKey?: PartitionKey;
  statistics?: Statistic[];
  uniqueKeyPolicy?: UniqueKeyPolicy;
  conflictResolutionPolicy?: ConflictResolutionPolicy;
  changeFeedPolicy?: ChangeFeedPolicy;
  analyticalStorageTtl?: number;
  geospatialConfig?: GeospatialConfig;
  vectorEmbeddingPolicy?: VectorEmbeddingPolicy;
  fullTextPolicy?: FullTextPolicy;
  schema?: ISchema;
  requestSchema?: () => void;
  computedProperties?: ComputedProperties;
  materializedViews?: MaterializedView[];
  materializedViewDefinition?: MaterializedViewDefinition;
}

export interface CollectionsWithPagination {
  continuationToken?: string;
  collections?: Collection[];
}

export interface Database extends Resource {
  collections?: Collection[];
}

export interface DocumentId extends Resource {}

export interface ConflictId extends Resource {
  resourceId?: string;
  resourceType?: string;
  operationType?: string;
  content?: string;
}

export interface AuthHeaders {
  "x-ms-date": string;
  authorization: string;
}

export interface KeyResource {
  Token: string;
}

export interface IndexingPolicy {
  automatic: boolean;
  indexingMode: "consistent" | "lazy" | "none";
  includedPaths: any;
  excludedPaths: any;
  compositeIndexes?: any[];
  spatialIndexes?: any[];
  vectorIndexes?: VectorIndex[];
  fullTextIndexes?: FullTextIndex[];
}

export interface VectorIndex {
  path: string;
  type: "flat" | "diskANN" | "quantizedFlat";
  vectorIndexShardKey?: string[];
  indexingSearchListSize?: number;
  quantizationByteSize?: number;
}

export interface FullTextIndex {
  path: string;
}

export interface ComputedProperty {
  name: string;
  query: string;
}

export type ComputedProperties = ComputedProperty[];

export interface MaterializedView {
  id: string;
  _rid: string;
}

export interface MaterializedViewDefinition {
  definition: string;
  sourceCollectionId: string;
  sourceCollectionRid?: string;
}

export interface PartitionKey {
  paths: string[];
  kind: "Hash" | "Range" | "MultiHash";
  version: number;
  systemKey?: boolean;
}

export interface Statistic {
  documentCount: number;
  id: string;
  partitionKeys: any[];
  sizeInKB: number;
}

export interface QueryPreparationTimes {
  queryCompilationTime: any;
  logicalPlanBuildTime: any;
  physicalPlanBuildTime: any;
  queryOptimizationTime: any;
}

export interface RuntimeExecutionTimes {
  queryEngineExecutionTime: any;
  systemFunctionExecutionTime: any;
  userDefinedFunctionExecutionTime: any;
}

export interface QueryMetrics {
  clientSideMetrics: any;
  documentLoadTime: any;
  documentWriteTime: any;
  indexHitDocumentCount: number;
  indexLookupTime: any;
  outputDocumentCount: number;
  outputDocumentSize: number;
  queryPreparationTimes: QueryPreparationTimes;
  retrievedDocumentCount: number;
  retrievedDocumentSize: number;
  runtimeExecutionTimes: RuntimeExecutionTimes;
  totalQueryExecutionTime: any;
  vmExecutionTime: any;
}

export interface Offer {
  id: string;
  autoscaleMaxThroughput: number | undefined;
  manualThroughput: number | undefined;
  minimumThroughput: number | undefined;
  offerDefinition?: SDKOfferDefinition;
  offerReplacePending: boolean;
  instantMaximumThroughput?: number;
  softAllowedMaximumThroughput?: number;
  throughputBuckets?: ThroughputBucket[];
}

export interface ThroughputBucket {
  id: number;
  maxThroughputPercentage: number;
}

export interface SDKOfferDefinition extends Resource {
  offerVersion?: string;
  offerType?: string;
  content?: {
    offerThroughput: number;
    offerIsRUPerMinuteThroughputEnabled?: boolean;
    collectionThroughputInfo?: OfferThroughputInfo;
    offerAutopilotSettings?: AutoPilotOfferSettings;
  };
  resource?: string;
  offerResourceId?: string;
}

export interface OfferThroughputInfo {
  minimumRUForCollection: number;
  numPhysicalPartitions: number;
}

export interface UniqueKeyPolicy {
  uniqueKeys: UniqueKey[];
}

export interface UniqueKey {
  paths: string[];
}

export interface CreateDatabaseAndCollectionRequest {
  databaseId: string;
  collectionId: string;
  offerThroughput: number;
  databaseLevelThroughput: boolean;
  partitionKey?: PartitionKey;
  indexingPolicy?: IndexingPolicy;
  uniqueKeyPolicy?: UniqueKeyPolicy;
  autoPilot?: AutoPilotCreationSettings;
  analyticalStorageTtl?: number;
}

export interface AutoPilotCreationSettings {
  maxThroughput?: number;
}

export interface Query {
  id: string;
  resourceId: string;
  queryName: string;
  query: string;
}

export interface AutoPilotOfferSettings {
  maximumTierThroughput?: number;
  maxThroughput?: number;
  targetMaxThroughput?: number;
}

export interface CreateDatabaseParams {
  autoPilotMaxThroughput?: number;
  databaseId: string;
  databaseLevelThroughput?: boolean;
  offerThroughput?: number;
}

export interface CreateCollectionParamsBase {
  databaseId: string;
  databaseLevelThroughput: boolean;
  offerThroughput?: number;
  analyticalStorageTtl?: number;
  autoPilotMaxThroughput?: number;
  indexingPolicy?: IndexingPolicy;
  partitionKey?: PartitionKey;
  uniqueKeyPolicy?: UniqueKeyPolicy;
  createMongoWildcardIndex?: boolean;
  vectorEmbeddingPolicy?: VectorEmbeddingPolicy;
  fullTextPolicy?: FullTextPolicy;
}

export interface CreateCollectionParams extends CreateCollectionParamsBase {
  createNewDatabase: boolean;
  collectionId: string;
}

export interface CreateMaterializedViewsParams extends CreateCollectionParamsBase {
  materializedViewId: string;
  materializedViewDefinition: MaterializedViewDefinition;
}

export interface VectorEmbeddingPolicy {
  vectorEmbeddings: VectorEmbedding[];
}

export interface VectorEmbedding {
  dataType: "float32" | "float16" | "uint8" | "int8";
  dimensions: number;
  distanceFunction: "euclidean" | "cosine" | "dotproduct";
  path: string;
}

export interface FullTextPolicy {
  defaultLanguage: string;
  fullTextPaths: FullTextPath[];
}

export interface FullTextPath {
  path: string;
  language: string;
}

export interface ReadDatabaseOfferParams {
  databaseId: string;
  databaseResourceId?: string;
  offerId?: string;
}

export interface ReadCollectionOfferParams {
  collectionId: string;
  databaseId: string;
  collectionResourceId?: string;
  offerId?: string;
}

export interface UpdateOfferParams {
  currentOffer: Offer;
  databaseId: string;
  autopilotThroughput: number;
  manualThroughput: number;
  collectionId?: string;
  migrateToAutoPilot?: boolean;
  migrateToManual?: boolean;
  throughputBuckets?: ThroughputBucket[];
}

export interface Notification {
  id: string;
  kind: string;
  accountName: string;
  action: any;
  buttonValue?: any;
  collectionName?: string;
  databaseName?: string;
  description: string;
  endDateUtc: number;
  seenAtUtc: number;
  state: string;
  type: string;
  updatedAtUtc: string;
}

export enum ConflictResolutionMode {
  Custom = "Custom",
  LastWriterWins = "LastWriterWins",
}

/**
 * Represents the conflict resolution policy configuration for specifying how to resolve conflicts
 *  in case writes from different regions result in conflicts on documents in the collection in the Azure Cosmos DB service.
 */
export interface ConflictResolutionPolicy {
  /**
   * Gets or sets the ConflictResolutionMode in the Azure Cosmos DB service. By default it is ConflictResolutionMode.LastWriterWins.
   */
  mode?: keyof typeof ConflictResolutionMode;
  /**
   * Gets or sets the path which is present in each document in the Azure Cosmos DB service for last writer wins conflict-resolution.
   * This path must be present in each document and must be an integer value.
   * In case of a conflict occuring on a document, the document with the higher integer value in the specified path will be picked.
   * If the path is unspecified, by default the timestamp path will be used.
   *
   * This value should only be set when using ConflictResolutionMode.LastWriterWins.
   *
   * ```typescript
   * conflictResolutionPolicy.ConflictResolutionPath = "/name/first";
   * ```
   *
   */
  conflictResolutionPath?: string;
  /**
   * Gets or sets the StoredProcedure which is used for conflict resolution in the Azure Cosmos DB service.
   * This stored procedure may be created after the Container is created and can be changed as required.
   *
   * 1. This value should only be set when using ConflictResolutionMode.Custom.
   * 2. In case the stored procedure fails or throws an exception, the conflict resolution will default to registering conflicts in the conflicts feed.
   *
   * ```typescript
   * conflictResolutionPolicy.ConflictResolutionProcedure = "resolveConflict"
   * ```
   */
  conflictResolutionProcedure?: string;
}

export interface ChangeFeedPolicy {
  retentionDuration: number;
}

export interface GeospatialConfig {
  type: string;
}

export interface RegionEndpoint {
  name: string;
  documentAccountEndpoint: string;
}

export interface Tenant {
  displayName: string;
  id: string;
  tenantId: string;
  countryCode: string;
  domains: Array<string>;
}

export interface AccountKeys {
  primaryMasterKey: string;
  secondaryMasterKey: string;
  primaryReadonlyMasterKey: string;
  secondaryReadonlyMasterKey: string;
}

export interface OperationStatus {
  status: string;
  id?: string;
  name?: string; // operationId
  properties?: any;
  error?: { code: string; message: string };
}

export interface NotebookWorkspaceConnectionInfo {
  authToken: string;
  notebookServerEndpoint: string;
  forwardingId: string;
}

export interface ContainerInfo {
  durationLeftInMinutes: number;
  phoenixServerInfo: NotebookWorkspaceConnectionInfo;
  status: ContainerStatusType;
}

export interface IProvisionData {
  cosmosEndpoint?: string;
  poolId: string;
  databaseId?: string;
  containerId?: string;
  mode?: string;
}

export interface IContainerData {
  forwardingId: string;
}

export interface IDbAccountAllow {
  status: number;
  message?: string;
  type?: string;
}

export interface IResponse<T> {
  status: number;
  data: T;
}

export interface IPhoenixError {
  message: string;
  type: string;
}

export interface IMaxAllocationTimeExceeded extends IPhoenixError {
  earliestAllocationTimestamp: string;
  maxAllocationTimePerDayPerUserInMinutes: string;
}

export interface IMaxDbAccountsPerUserExceeded extends IPhoenixError {
  maxSimultaneousConnectionsPerUser: string;
}

export interface IMaxUsersPerDbAccountExceeded extends IPhoenixError {
  maxSimultaneousUsersPerDbAccount: string;
}

export interface IPhoenixConnectionInfoResult {
  readonly phoenixServiceInfo?: IPhoenixServiceInfo;
}

export interface IPhoenixServiceInfo {
  readonly authToken?: string;
  readonly phoenixServiceUrl?: string;
  readonly forwardingId?: string;
}

export interface NotebookWorkspaceFeedResponse {
  value: NotebookWorkspace[];
}

export interface NotebookWorkspace {
  id: string;
  name: string;
  properties: {
    status: string;
    notebookServerEndpoint: string;
  };
}

export interface NotebookConfigurationEndpoints {
  path: string;
  endpoints: NotebookConfigurationEndpointInfo[];
}

export interface NotebookConfigurationEndpointInfo {
  type: string;
  endpoint: string;
  username: string;
  password: string;
  token: string;
}

export interface SparkClusterConnectionInfo {
  userName: string;
  password: string;
  endpoints: SparkClusterEndpoint[];
}

export interface SparkClusterEndpoint {
  kind: SparkClusterEndpointKind;
  endpoint: string;
}

export enum SparkClusterEndpointKind {
  SparkUI = "SparkUI",
  HistoryServerUI = "HistoryServerUI",
  Livy = "Livy",
}

export interface RpParameters {
  db: string;
  offerThroughput?: number;
  st: Boolean;
  sid: string;
  rg: string;
  dba: string;
  partitionKeyVersion?: number;
}

export interface MongoParameters extends RpParameters {
  pk?: string;
  resourceUrl?: string;
  coll?: string;
  cd?: Boolean;
  is?: Boolean;
  rid?: string;
  rtype?: string;
  isAutoPilot?: Boolean;
  autoPilotThroughput?: string;
  analyticalStorageTtl?: number;
}

export interface MemoryUsageInfo {
  freeKB: number;
  totalKB: number;
}

export interface ContainerConnectionInfo {
  status: ConnectionStatusType;
  //need to add ram and rom info
}

export interface FirewallRule {
  id: string;
  name: string;
  type: string;
  properties: {
    startIpAddress: string;
    endIpAddress: string;
  };
}

export enum PhoenixErrorType {
  MaxAllocationTimeExceeded = "MaxAllocationTimeExceeded",
  MaxDbAccountsPerUserExceeded = "MaxDbAccountsPerUserExceeded",
  MaxUsersPerDbAccountExceeded = "MaxUsersPerDbAccountExceeded",
  AllocationValidationResult = "AllocationValidationResult",
  RegionNotServicable = "RegionNotServicable",
  SubscriptionNotAllowed = "SubscriptionNotAllowed",
  UnknownError = "UnknownError",
  PhoenixFlightFallback = "PhoenixFlightFallback",
  UserMissingPermissionsError = "UserMissingPermissionsError",
}

export interface CopilotEnabledConfiguration {
  isEnabled: boolean;
}

export interface FeatureRegistration {
  name: string;
  properties: {
    state: string;
  };
}

export type Tags = { [key: string]: string };
