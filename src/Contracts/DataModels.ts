export interface DatabaseAccount {
  id: string;
  name: string;
  location: string;
  type: string;
  kind: string;
  tags: any;
  properties: DatabaseAccountExtendedProperties;
}

export interface DatabaseAccountExtendedProperties {
  documentEndpoint: string;
  tableEndpoint: string;
  gremlinEndpoint: string;
  cassandraEndpoint: string;
  configurationOverrides?: ConfigurationOverrides;
  capabilities?: Capability[];
  enableMultipleWriteLocations?: boolean;
  mongoEndpoint?: string;
  readLocations?: DatabaseAccountResponseLocation[];
  writeLocations?: DatabaseAccountResponseLocation[];
  enableFreeTier?: boolean;
  enableAnalyticalStorage?: boolean;
}

export interface DatabaseAccountResponseLocation {
  documentEndpoint: string;
  failoverPriority: number;
  id: string;
  locationId: string;
  locationName: string;
  provisioningState: string;
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
  MongoDBCompute
}

export interface GenerateTokenResponse {
  readWrite: string;
  read: string;
}

export interface Subscription {
  uniqueDisplayName: string;
  displayName: string;
  subscriptionId: string;
  tenantId: string;
  state: string;
  subscriptionPolicies: SubscriptionPolicies;
  authorizationSource: string;
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

export interface ResourceRequest {
  id: string;
}

export interface Collection extends Resource {
  defaultTtl?: number;
  indexingPolicy?: IndexingPolicy;
  partitionKey?: PartitionKey;
  statistics?: Statistic[];
  uniqueKeyPolicy?: UniqueKeyPolicy;
  conflictResolutionPolicy?: ConflictResolutionPolicy;
  changeFeedPolicy?: ChangeFeedPolicy;
  analyticalStorageTtl?: number;
  geospatialConfig?: GeospatialConfig;
}

export interface CreateCollectionWithRpResponse extends Resource {
  properties: Collection;
  name: string;
  type: string;
}

export interface CollectionRequest extends ResourceRequest {
  defaultTtl?: number;
  indexingPolicy?: IndexingPolicy;
  partitionKey?: PartitionKey;
  uniqueKeyPolicy?: UniqueKeyPolicy;
  conflictResolutionPolicy?: ConflictResolutionPolicy;
}

export interface Database extends Resource {
  collections?: Collection[];
}

export interface DocumentId extends Resource {}

export interface Script extends Resource {
  body: string;
}

export interface StoredProcedure extends Script {}

export interface UserDefinedFunction extends Script {}

export interface Trigger extends Script {
  triggerType: string;
  triggerOperation: string;
}

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

export interface IndexingPolicy {}

export interface PartitionKey {
  paths: string[];
  kind: string;
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

export interface Offer extends Resource {
  offerVersion?: string;
  offerType?: string;
  content?: {
    offerThroughput: number;
    offerIsRUPerMinuteThroughputEnabled: boolean;
    collectionThroughputInfo?: OfferThroughputInfo;
    offerAutopilotSettings?: AutoPilotOfferSettings;
  };
  resource?: string;
  offerResourceId?: string;
}

export interface OfferWithHeaders extends Offer {
  headers: any;
}

export interface CollectionQuotaInfo {
  storedProcedures: number;
  triggers: number;
  functions: number;
  documentsSize: number;
  collectionSize: number;
  documentsCount: number;
  usageSizeInKB: number;
  numPartitions: number;
  uniqueKeyPolicy?: UniqueKeyPolicy; // TODO: This should ideally not be a part of the collection quota. Remove after refactoring. (#119617)
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

// Returned by DocumentDb client proxy
// Inner errors in BackendErrorDataModel when error is in SQL syntax
export interface ErrorDataModel {
  message: string;
  severity?: string;
  location?: {
    start: string;
    end: string;
  };
  code?: string;
}

/**
 * Defines a property bag for telemetry e.g. see ITelemetryError.
 */
export interface ITelemetryProperties {
  [propertyName: string]: string;
}

/**
 * Defines a property bag for telemetry e.g. see ITelemetryError.
 */
export interface ITelemetryEvent {
  name: string;
  properties?: ITelemetryProperties;
}

/**
 * Defines an error to be logged as telemetry data.
 */
export interface ITelemetryError extends ITelemetryEvent {
  error: any;
}

export interface CreateDatabaseAndCollectionRequest {
  databaseId: string;
  collectionId: string;
  offerThroughput: number;
  databaseLevelThroughput: boolean;
  rupmEnabled?: boolean;
  partitionKey?: PartitionKey;
  indexingPolicy?: IndexingPolicy;
  uniqueKeyPolicy?: UniqueKeyPolicy;
  autoPilot?: AutoPilotCreationSettings;
  analyticalStorageTtl?: number;
  hasAutoPilotV2FeatureFlag?: boolean;
}

export interface AutoPilotCreationSettings {
  autopilotTier?: AutopilotTier;
  maxThroughput?: number;
}

export enum AutopilotTier {
  Tier1 = 1,
  Tier2 = 2,
  Tier3 = 3,
  Tier4 = 4
}

export interface RpOptions {
  // tier is sent as string, autoscale as object (AutoPilotCreationSettings)
  [key: string]: string | AutoPilotCreationSettings;
}

export interface Query {
  id: string;
  resourceId: string;
  queryName: string;
  query: string;
}

export interface UpdateOfferThroughputRequest {
  subscriptionId: string;
  resourceGroup: string;
  databaseAccountName: string;
  databaseName: string;
  collectionName: string;
  throughput: number;
  offerIsRUPerMinuteThroughputEnabled: boolean;
  offerAutopilotSettings?: AutoPilotOfferSettings;
}

export interface AutoPilotOfferSettings {
  tier?: AutopilotTier;
  maximumTierThroughput?: number;
  targetTier?: AutopilotTier;
  maxThroughput?: number;
  targetMaxThroughput?: number;
}

export interface CreateDatabaseRequest {
  databaseId: string;
  databaseLevelThroughput?: boolean;
  offerThroughput?: number;
  autoPilot?: AutoPilotCreationSettings;
  hasAutoPilotV2FeatureFlag?: boolean;
}

export interface SharedThroughputRange {
  minimumRU: number;
  maximumRU: number;
  defaultRU: number;
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
  LastWriterWins = "LastWriterWins"
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

export interface GatewayDatabaseAccount {
  MediaLink: string;
  DatabasesLink: string;
  MaxMediaStorageUsageInMB: number;
  CurrentMediaStorageUsageInMB: number;
  EnableMultipleWriteLocations?: boolean;
  WritableLocations: RegionEndpoint[];
  ReadableLocations: RegionEndpoint[];
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
  properties: {
    primaryReadonlyMasterKey: string;
    secondaryReadonlyMasterKey: string;
  };
}

export interface AfecFeature {
  id: string;
  name: string;
  properties: { state: string };
  type: string;
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

export interface SparkCluster {
  id: string;
  name: string;
  type: string;
  properties: {
    kind: string;
    driverSize: string;
    workerSize: string;
    workerInstanceCount: number;
    creationTime: string;
    status: string;
    libraries?: SparkClusterLibrary[];
  };
}

export interface SparkClusterFeedResponse {
  value: SparkCluster[];
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
  Livy = "Livy"
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
  autoPilotTier?: string;
  autoPilotThroughput?: string;
  analyticalStorageTtl?: number;
}

export interface GraphParameters extends RpParameters {
  pk: string;
  coll: string;
  cd: Boolean;
  indexingPolicy?: IndexingPolicy;
}

export interface CreationRequest {
  properties: {
    resource: {
      id: string;
    };
    options: RpOptions;
  };
}

export interface SqlCollectionParameters extends RpParameters {
  uniqueKeyPolicy?: UniqueKeyPolicy;
  pk: string;
  coll: string;
  cd: Boolean;
  analyticalStorageTtl?: number;
  indexingPolicy?: IndexingPolicy;
}

export interface MongoCreationRequest extends CreationRequest {
  properties: {
    resource: {
      id: string;
      analyticalStorageTtl?: number;
      shardKey?: {};
    };
    options: RpOptions;
  };
}

export interface GraphCreationRequest extends CreationRequest {
  properties: {
    resource: {
      id: string;
      partitionKey: {};
      indexingPolicy?: IndexingPolicy;
    };
    options: RpOptions;
  };
}

export interface CreateDatabaseWithRpResponse {
  id: string;
  name: string;
  type: string;
  properties: {
    id: string;
  };
}

export interface SparkClusterLibrary {
  name: string;
}

export interface SqlCollectionCreationRequest extends CreationRequest {
  properties: {
    resource: {
      uniqueKeyPolicy?: UniqueKeyPolicy;
      id: string;
      partitionKey: {};
      analyticalStorageTtl?: number;
      indexingPolicy?: IndexingPolicy;
    };
    options: RpOptions;
  };
}

export interface Library extends SparkClusterLibrary {
  properties: {
    kind: "Jar";
    source: {
      kind: "HttpsUri";
      uri: string;
      libraryFileName: string;
    };
  };
}

export interface LibraryFeedResponse {
  value: Library[];
}

export interface ArmResource {
  id: string;
  location: string;
  name: string;
  type: string;
  tags: { [key: string]: string };
}

export interface ArcadiaWorkspaceIdentity {
  type: string;
  principalId: string;
  tenantId: string;
}

export interface ArcadiaWorkspaceProperties {
  managedResourceGroupName: string;
  provisioningState: string;
  sqlAdministratorLogin: string;
  connectivityEndpoints: {
    artifacts: string;
    dev: string;
    spark: string;
    sql: string;
    web: string;
  };
  defaultDataLakeStorage: {
    accountUrl: string;
    filesystem: string;
  };
}

export interface ArcadiaWorkspaceFeedResponse {
  value: ArcadiaWorkspace[];
}

export interface ArcadiaWorkspace extends ArmResource {
  identity: ArcadiaWorkspaceIdentity;
  properties: ArcadiaWorkspaceProperties;
}

export interface SparkPoolFeedResponse {
  value: SparkPool[];
}

export interface SparkPoolProperties {
  creationDate: string;
  sparkVersion: string;
  nodeCount: number;
  nodeSize: string;
  nodeSizeFamily: string;
  provisioningState: string;
  autoScale: {
    enabled: boolean;
    minNodeCount: number;
    maxNodeCount: number;
  };
  autoPause: {
    enabled: boolean;
    delayInMinutes: number;
  };
}

export interface SparkPool extends ArmResource {
  properties: SparkPoolProperties;
}

export interface MemoryUsageInfo {
  freeKB: number;
  totalKB: number;
}

export interface resourceTokenConnectionStringProperties {
  accountEndpoint: string;
  collectionId: string;
  databaseId: string;
  partitionKey?: string;
  resourceToken: string;
}
