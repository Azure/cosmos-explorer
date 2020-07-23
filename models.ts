interface DatabaseAccountsListResult {
  /* List of database account and their properties. */
  readonly value: DatabaseAccountGetResults[];
}

interface SqlDatabaseListResult {
  /* List of SQL databases and their properties. */
  readonly value: SqlDatabaseGetResults[];
}

interface SqlContainerListResult {
  /* List of containers and their properties. */
  readonly value: SqlContainerGetResults[];
}

interface SqlStoredProcedureListResult {
  /* List of storedProcedures and their properties. */
  readonly value: SqlStoredProcedureGetResults[];
}

interface SqlUserDefinedFunctionListResult {
  /* List of userDefinedFunctions and their properties. */
  readonly value: SqlUserDefinedFunctionGetResults[];
}

interface SqlTriggerListResult {
  /* List of triggers and their properties. */
  readonly value: SqlTriggerGetResults[];
}

interface MongoDBDatabaseListResult {
  /* List of MongoDB databases and their properties. */
  readonly value: MongoDBDatabaseGetResults[];
}

interface MongoDBCollectionListResult {
  /* List of MongoDB collections and their properties. */
  readonly value: MongoDBCollectionGetResults[];
}

interface TableListResult {
  /* List of Table and their properties. */
  readonly value: TableGetResults[];
}

interface CassandraKeyspaceListResult {
  /* List of Cassandra keyspaces and their properties. */
  readonly value: CassandraKeyspaceGetResults[];
}

interface CassandraTableListResult {
  /* List of Cassandra tables and their properties. */
  readonly value: CassandraTableGetResults[];
}

interface GremlinDatabaseListResult {
  /* List of Gremlin databases and their properties. */
  readonly value: GremlinDatabaseGetResults[];
}

interface GremlinGraphListResult {
  /* List of graphs and their properties. */
  readonly value: GremlinGraphGetResults[];
}

interface ErrorResponse {
  /* Error code. */
  code: string;
  /* Error message indicating why the operation failed. */
  message: string;
}

interface ErrorResponseUpdatedFormat {
  /* undefined */
  error: unknown;
}

interface FailoverPolicies {
  /* List of failover policies. */
  failoverPolicies: FailoverPolicy[];
}

interface FailoverPolicy {
  /* The unique identifier of the region in which the database account replicates to. Example: &lt;accountName&gt;-&lt;locationName&gt;. */
  readonly id: string;
  /* The name of the region in which the database account exists. */
  locationName: string;
  /* The failover priority of the region. A failover priority of 0 indicates a write region. The maximum value for a failover priority = (total number of regions - 1). Failover priority values must be unique for each of the regions in which the database account exists. */
  failoverPriority: number;
}

interface RegionForOnlineOffline {
  /* Cosmos DB region, with spaces between words and each word capitalized. */
  region: string;
}

interface Location {
  /* The unique identifier of the region within the database account. Example: &lt;accountName&gt;-&lt;locationName&gt;. */
  readonly id: string;
  /* The name of the region. */
  locationName: string;
  /* The connection endpoint for the specific region. Example: https://&lt;accountName&gt;-&lt;locationName&gt;.documents.azure.com:443/ */
  readonly documentEndpoint: string;
  /* undefined */
  provisioningState: ProvisioningState;

  /* The failover priority of the region. A failover priority of 0 indicates a write region. The maximum value for a failover priority = (total number of regions - 1). Failover priority values must be unique for each of the regions in which the database account exists. */
  failoverPriority: number;
  /* Flag to indicate whether or not this region is an AvailabilityZone region */
  isZoneRedundant: boolean;
}

interface ARMResourceProperties {
  /* The unique resource identifier of the ARM resource. */
  readonly id: string;
  /* The name of the ARM resource. */
  readonly name: string;
  /* The type of Azure resource. */
  readonly type: string;
  /* The location of the resource group to which the resource belongs. */
  location: string;
  /* undefined */
  tags: Tags;

  /* undefined */
  identity: ManagedServiceIdentity;
}

interface ARMProxyResource {
  /* The unique resource identifier of the database account. */
  readonly id: string;
  /* The name of the database account. */
  readonly name: string;
  /* The type of Azure resource. */
  readonly type: string;
}

type DatabaseAccountGetResults = ARMResourceProperties & {
  /* Indicates the type of database account. This can only be set at database account creation. */
  kind: string;
  /* undefined */
  properties: DatabaseAccountGetProperties;

  /* The system meta data relating to this resource. */
  readonly systemData: unknown;
};

interface ExtendedResourceProperties {
  /* A system generated property. A unique identifier. */
  readonly _rid: string;
  /* A system generated property that denotes the last updated timestamp of the resource. */
  readonly _ts: undefined;
  /* A system generated property representing the resource etag required for optimistic concurrency control. */
  readonly _etag: string;
}

type ThroughputSettingsGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB resource throughput */
  properties: ThroughputSettingsGetProperties;
};

interface ThroughputSettingsGetProperties {
  /* undefined */
  resource: undefined;
}

type SqlDatabaseGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB SQL database */
  properties: SqlDatabaseGetProperties;
};

interface SqlDatabaseGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type SqlContainerGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB container */
  properties: SqlContainerGetProperties;
};

interface SqlContainerGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type SqlStoredProcedureGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB storedProcedure */
  properties: SqlStoredProcedureGetProperties;
};

interface SqlStoredProcedureGetProperties {
  /* undefined */
  resource: undefined;
}

type SqlUserDefinedFunctionGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB userDefinedFunction */
  properties: SqlUserDefinedFunctionGetProperties;
};

interface SqlUserDefinedFunctionGetProperties {
  /* undefined */
  resource: undefined;
}

type SqlTriggerGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB trigger */
  properties: SqlTriggerGetProperties;
};

interface SqlTriggerGetProperties {
  /* undefined */
  resource: undefined;
}

type MongoDBDatabaseGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB MongoDB database */
  properties: MongoDBDatabaseGetProperties;
};

interface MongoDBDatabaseGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type MongoDBCollectionGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB MongoDB collection */
  properties: MongoDBCollectionGetProperties;
};

interface MongoDBCollectionGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type TableGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB Table */
  properties: TableGetProperties;
};

interface TableGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type CassandraKeyspaceGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB Cassandra keyspace */
  properties: CassandraKeyspaceGetProperties;
};

interface CassandraKeyspaceGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type CassandraTableGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB Cassandra table */
  properties: CassandraTableGetProperties;
};

interface CassandraTableGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type GremlinDatabaseGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB SQL database */
  properties: GremlinDatabaseGetProperties;
};

interface GremlinDatabaseGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

type GremlinGraphGetResults = ARMResourceProperties & {
  /* The properties of an Azure Cosmos DB Gremlin graph */
  properties: GremlinGraphGetProperties;
};

interface GremlinGraphGetProperties {
  /* undefined */
  resource: undefined;
  /* undefined */
  options: undefined;
}

interface ConsistencyPolicy {
  /* The default consistency level and configuration settings of the Cosmos DB account. */
  defaultConsistencyLevel: string;
  /* When used with the Bounded Staleness consistency level, this value represents the number of stale requests tolerated. Accepted range for this value is 1 – 2,147,483,647. Required when defaultConsistencyPolicy is set to 'BoundedStaleness'. */
  maxStalenessPrefix: number;
  /* When used with the Bounded Staleness consistency level, this value represents the time amount of staleness (in seconds) tolerated. Accepted range for this value is 5 - 86400. Required when defaultConsistencyPolicy is set to 'BoundedStaleness'. */
  maxIntervalInSeconds: number;
}

interface DatabaseAccountGetProperties {
  /* undefined */
  provisioningState: ProvisioningState;

  /* The connection endpoint for the Cosmos DB database account. */
  readonly documentEndpoint: string;
  /* The offer type for the Cosmos DB database account. Default value: Standard. */
  readonly databaseAccountOfferType: DatabaseAccountOfferType;

  /* List of IpRules. */
  ipRules: IPRules;

  /* Flag to indicate whether to enable/disable Virtual Network ACL rules. */
  isVirtualNetworkFilterEnabled: boolean;
  /* Enables automatic failover of the write region in the rare event that the region is unavailable due to an outage. Automatic failover will result in a new write region for the account and is chosen based on the failover priorities configured for the account. */
  enableAutomaticFailover: boolean;
  /* The consistency policy for the Cosmos DB database account. */
  consistencyPolicy: ConsistencyPolicy;

  /* List of Cosmos DB capabilities for the account */
  capabilities: Capability[];

  /* An array that contains the write location for the Cosmos DB account. */
  readonly writeLocations: Location[];

  /* An array that contains of the read locations enabled for the Cosmos DB account. */
  readonly readLocations: Location[];

  /* An array that contains all of the locations enabled for the Cosmos DB account. */
  readonly locations: Location[];

  /* An array that contains the regions ordered by their failover priorities. */
  readonly failoverPolicies: FailoverPolicy[];

  /* List of Virtual Network ACL rules configured for the Cosmos DB account. */
  virtualNetworkRules: VirtualNetworkRule[];

  /* List of Private Endpoint Connections configured for the Cosmos DB account. */
  readonly privateEndpointConnections: PrivateEndpointConnection[];

  /* Enables the account to write in multiple locations */
  enableMultipleWriteLocations: boolean;
  /* Enables the cassandra connector on the Cosmos DB C* account */
  enableCassandraConnector: boolean;
  /* The cassandra connector offer type for the Cosmos DB database C* account. */
  connectorOffer: ConnectorOffer;

  /* Disable write operations on metadata resources (databases, containers, throughput) via account keys */
  disableKeyBasedMetadataWriteAccess: boolean;
  /* The URI of the key vault */
  keyVaultKeyUri: string;
  /* Whether requests from Public Network are allowed */
  publicNetworkAccess: PublicNetworkAccess;

  /* Flag to indicate whether Free Tier is enabled. */
  enableFreeTier: boolean;
  /* API specific properties. */
  apiProperties: ApiProperties;

  /* Flag to indicate whether to enable storage analytics. */
  enableAnalyticalStorage: boolean;
  /* A unique identifier assigned to the database account */
  readonly instanceId: string;
  /* Enum to indicate the mode of account creation. */
  createMode: CreateMode;

  /* Parameters to indicate the information about the restore. */
  restoreParameters: RestoreParameters;

  /* The object representing the policy for taking backups on an account. */
  backupPolicy: BackupPolicy;
}

interface DatabaseAccountCreateUpdateProperties {
  /* The consistency policy for the Cosmos DB account. */
  consistencyPolicy: ConsistencyPolicy;

  /* An array that contains the georeplication locations enabled for the Cosmos DB account. */
  locations: Location[];

  /* The offer type for the database */
  databaseAccountOfferType: DatabaseAccountOfferType;

  /* List of IpRules. */
  ipRules: IPRules;

  /* Flag to indicate whether to enable/disable Virtual Network ACL rules. */
  isVirtualNetworkFilterEnabled: boolean;
  /* Enables automatic failover of the write region in the rare event that the region is unavailable due to an outage. Automatic failover will result in a new write region for the account and is chosen based on the failover priorities configured for the account. */
  enableAutomaticFailover: boolean;
  /* List of Cosmos DB capabilities for the account */
  capabilities: Capability[];

  /* List of Virtual Network ACL rules configured for the Cosmos DB account. */
  virtualNetworkRules: VirtualNetworkRule[];

  /* Enables the account to write in multiple locations */
  enableMultipleWriteLocations: boolean;
  /* Enables the cassandra connector on the Cosmos DB C* account */
  enableCassandraConnector: boolean;
  /* The cassandra connector offer type for the Cosmos DB database C* account. */
  connectorOffer: ConnectorOffer;

  /* Disable write operations on metadata resources (databases, containers, throughput) via account keys */
  disableKeyBasedMetadataWriteAccess: boolean;
  /* The URI of the key vault */
  keyVaultKeyUri: string;
  /* Whether requests from Public Network are allowed */
  publicNetworkAccess: PublicNetworkAccess;

  /* Flag to indicate whether Free Tier is enabled. */
  enableFreeTier: boolean;
  /* API specific properties. Currently, supported only for MongoDB API. */
  apiProperties: ApiProperties;

  /* Flag to indicate whether to enable storage analytics. */
  enableAnalyticalStorage: boolean;
  /* Enum to indicate the mode of account creation. */
  createMode: CreateMode;

  /* The object representing the policy for taking backups on an account. */
  backupPolicy: BackupPolicy;
}

type RestoreReqeustDatabaseAccountCreateUpdateProperties = DatabaseAccountCreateUpdateProperties & {
  /* Parameters to indicate the information about the restore. */
  restoreParameters: RestoreParameters;
};

type DatabaseAccountCreateUpdateParameters = ARMResourceProperties & {
  /* Indicates the type of database account. This can only be set at database account creation. */
  kind: string;
  /* undefined */
  properties: DatabaseAccountCreateUpdateProperties;
};

interface DatabaseAccountUpdateProperties {
  /* The consistency policy for the Cosmos DB account. */
  consistencyPolicy: ConsistencyPolicy;

  /* An array that contains the georeplication locations enabled for the Cosmos DB account. */
  locations: Location[];

  /* List of IpRules. */
  ipRules: IPRules;

  /* Flag to indicate whether to enable/disable Virtual Network ACL rules. */
  isVirtualNetworkFilterEnabled: boolean;
  /* Enables automatic failover of the write region in the rare event that the region is unavailable due to an outage. Automatic failover will result in a new write region for the account and is chosen based on the failover priorities configured for the account. */
  enableAutomaticFailover: boolean;
  /* List of Cosmos DB capabilities for the account */
  capabilities: Capability[];

  /* List of Virtual Network ACL rules configured for the Cosmos DB account. */
  virtualNetworkRules: VirtualNetworkRule[];

  /* Enables the account to write in multiple locations */
  enableMultipleWriteLocations: boolean;
  /* Enables the cassandra connector on the Cosmos DB C* account */
  enableCassandraConnector: boolean;
  /* The cassandra connector offer type for the Cosmos DB database C* account. */
  connectorOffer: ConnectorOffer;

  /* Disable write operations on metadata resources (databases, containers, throughput) via account keys */
  disableKeyBasedMetadataWriteAccess: boolean;
  /* The URI of the key vault */
  keyVaultKeyUri: string;
  /* Whether requests from Public Network are allowed */
  publicNetworkAccess: PublicNetworkAccess;

  /* Flag to indicate whether Free Tier is enabled. */
  enableFreeTier: boolean;
  /* API specific properties. Currently, supported only for MongoDB API. */
  apiProperties: ApiProperties;

  /* Flag to indicate whether to enable storage analytics. */
  enableAnalyticalStorage: boolean;
  /* The object representing the policy for taking backups on an account. */
  backupPolicy: BackupPolicy;
}

interface DatabaseAccountUpdateParameters {
  /* undefined */
  tags: Tags;

  /* The location of the resource group to which the resource belongs. */
  location: string;
  /* undefined */
  properties: DatabaseAccountUpdateProperties;
}

interface DatabaseAccountListReadOnlyKeysResult {
  /* Base 64 encoded value of the primary read-only key. */
  readonly primaryReadonlyMasterKey: string;
  /* Base 64 encoded value of the secondary read-only key. */
  readonly secondaryReadonlyMasterKey: string;
}

type DatabaseAccountListKeysResult = DatabaseAccountListReadOnlyKeysResult & {
  /* Base 64 encoded value of the primary read-write key. */
  readonly primaryMasterKey: string;
  /* Base 64 encoded value of the secondary read-write key. */
  readonly secondaryMasterKey: string;
};

interface DatabaseAccountConnectionString {
  /* Value of the connection string */
  readonly connectionString: string;
  /* Description of the connection string */
  readonly description: string;
}

interface DatabaseAccountListConnectionStringsResult {
  /* An array that contains the connection strings for the Cosmos DB account. */
  connectionStrings: DatabaseAccountConnectionString[];
}

interface DatabaseAccountRegenerateKeyParameters {
  /* The access key to regenerate. */
  keyKind: string;
}

/* The offer type for the Cosmos DB database account. */
type DatabaseAccountOfferType = "Standard";
type ThroughputSettingsUpdateParameters = ARMResourceProperties & {
  /* Properties to update Azure Cosmos DB resource throughput. */
  properties: ThroughputSettingsUpdateProperties;
};

interface ThroughputSettingsUpdateProperties {
  /* The standard JSON format of a resource throughput */
  resource: ThroughputSettingsResource;
}

type SqlDatabaseCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB SQL database. */
  properties: SqlDatabaseCreateUpdateProperties;
};

interface SqlDatabaseCreateUpdateProperties {
  /* The standard JSON format of a SQL database */
  resource: SqlDatabaseResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type SqlContainerCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB container. */
  properties: SqlContainerCreateUpdateProperties;
};

interface SqlContainerCreateUpdateProperties {
  /* The standard JSON format of a container */
  resource: SqlContainerResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type SqlStoredProcedureCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB storedProcedure. */
  properties: SqlStoredProcedureCreateUpdateProperties;
};

interface SqlStoredProcedureCreateUpdateProperties {
  /* The standard JSON format of a storedProcedure */
  resource: SqlStoredProcedureResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type SqlUserDefinedFunctionCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB userDefinedFunction. */
  properties: SqlUserDefinedFunctionCreateUpdateProperties;
};

interface SqlUserDefinedFunctionCreateUpdateProperties {
  /* The standard JSON format of a userDefinedFunction */
  resource: SqlUserDefinedFunctionResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type SqlTriggerCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB trigger. */
  properties: SqlTriggerCreateUpdateProperties;
};

interface SqlTriggerCreateUpdateProperties {
  /* The standard JSON format of a trigger */
  resource: SqlTriggerResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type MongoDBDatabaseCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB MongoDB database. */
  properties: MongoDBDatabaseCreateUpdateProperties;
};

interface MongoDBDatabaseCreateUpdateProperties {
  /* The standard JSON format of a MongoDB database */
  resource: MongoDBDatabaseResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type MongoDBCollectionCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB MongoDB collection. */
  properties: MongoDBCollectionCreateUpdateProperties;
};

interface MongoDBCollectionCreateUpdateProperties {
  /* The standard JSON format of a MongoDB collection */
  resource: MongoDBCollectionResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type TableCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB Table. */
  properties: TableCreateUpdateProperties;
};

interface TableCreateUpdateProperties {
  /* The standard JSON format of a Table */
  resource: TableResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type CassandraKeyspaceCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB Cassandra keyspace. */
  properties: CassandraKeyspaceCreateUpdateProperties;
};

interface CassandraKeyspaceCreateUpdateProperties {
  /* The standard JSON format of a Cassandra keyspace */
  resource: CassandraKeyspaceResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type CassandraTableCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB Cassandra table. */
  properties: CassandraTableCreateUpdateProperties;
};

interface CassandraTableCreateUpdateProperties {
  /* The standard JSON format of a Cassandra table */
  resource: CassandraTableResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type GremlinDatabaseCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB Gremlin database. */
  properties: GremlinDatabaseCreateUpdateProperties;
};

interface GremlinDatabaseCreateUpdateProperties {
  /* The standard JSON format of a Gremlin database */
  resource: GremlinDatabaseResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

type GremlinGraphCreateUpdateParameters = ARMResourceProperties & {
  /* Properties to create and update Azure Cosmos DB Gremlin graph. */
  properties: GremlinGraphCreateUpdateProperties;
};

interface GremlinGraphCreateUpdateProperties {
  /* The standard JSON format of a Gremlin graph */
  resource: GremlinGraphResource;

  /* A key-value pair of options to be applied for the request. This corresponds to the headers sent with the request. */
  options: CreateUpdateOptions;
}

interface ThroughputSettingsResource {
  /* Value of the Cosmos DB resource throughput. Either throughput is required or autoscaleSettings is required, but not both. */
  throughput: number;
  /* Cosmos DB resource for autoscale settings. Either throughput is required or autoscaleSettings is required, but not both. */
  autoscaleSettings: AutoscaleSettingsResource;

  /* The minimum throughput of the resource */
  readonly minimumThroughput: string;
  /* The throughput replace is pending */
  readonly offerReplacePending: string;
}

interface AutoscaleSettingsResource {
  /* Represents maximum throughput container can scale up to. */
  maxThroughput: number;
  /* Cosmos DB resource auto-upgrade policy */
  autoUpgradePolicy: AutoUpgradePolicyResource;

  /* Represents target maximum throughput container can scale up to once offer is no longer in pending state. */
  readonly targetMaxThroughput: number;
}

interface AutoUpgradePolicyResource {
  /* Represents throughput policy which service must adhere to for auto-upgrade */
  throughputPolicy: ThroughputPolicyResource;
}

interface ThroughputPolicyResource {
  /* Determines whether the ThroughputPolicy is active or not */
  isEnabled: boolean;
  /* Represents the percentage by which throughput can increase every time throughput policy kicks in. */
  incrementPercent: number;
}

interface OptionsResource {
  /* Value of the Cosmos DB resource throughput or autoscaleSettings. Use the ThroughputSetting resource when retrieving offer details. */
  throughput: number;
  /* Specifies the Autoscale settings. */
  autoscaleSettings: AutoscaleSettings;
}

interface SqlDatabaseResource {
  /* Name of the Cosmos DB SQL database */
  id: string;
}

interface SqlContainerResource {
  /* Name of the Cosmos DB SQL container */
  id: string;
  /* The configuration of the indexing policy. By default, the indexing is automatic for all document paths within the container */
  indexingPolicy: IndexingPolicy;

  /* The configuration of the partition key to be used for partitioning data into multiple partitions */
  partitionKey: ContainerPartitionKey;

  /* Default time to live */
  defaultTtl: number;
  /* The unique key policy configuration for specifying uniqueness constraints on documents in the collection in the Azure Cosmos DB service. */
  uniqueKeyPolicy: UniqueKeyPolicy;

  /* The conflict resolution policy for the container. */
  conflictResolutionPolicy: ConflictResolutionPolicy;
}

interface IndexingPolicy {
  /* Indicates if the indexing policy is automatic */
  automatic: boolean;
  /* Indicates the indexing mode. */
  indexingMode: string;
  /* List of paths to include in the indexing */
  includedPaths: IncludedPath[];

  /* List of paths to exclude from indexing */
  excludedPaths: ExcludedPath[];

  /* List of composite path list */
  compositeIndexes: CompositePathList[];

  /* List of spatial specifics */
  spatialIndexes: SpatialSpec[];
}

interface ExcludedPath {
  /* The path for which the indexing behavior applies to. Index paths typically start with root and end with wildcard (/path/*) */
  path: string;
}

interface IncludedPath {
  /* The path for which the indexing behavior applies to. Index paths typically start with root and end with wildcard (/path/*) */
  path: string;
  /* List of indexes for this path */
  indexes: Indexes[];
}

interface Indexes {
  /* The datatype for which the indexing behavior is applied to. */
  dataType: string;
  /* The precision of the index. -1 is maximum precision. */
  precision: number;
  /* Indicates the type of index. */
  kind: string;
}

/* List of composite path */
type CompositePathList = CompositePath[];
interface CompositePath {
  /* The path for which the indexing behavior applies to. Index paths typically start with root and end with wildcard (/path/*) */
  path: string;
  /* Sort order for composite paths. */
  order: string;
}

interface SpatialSpec {
  /* The path for which the indexing behavior applies to. Index paths typically start with root and end with wildcard (/path/*) */
  path: string;
  /* List of path's spatial type */
  types: SpatialType[];
}

/* Indicates the spatial type of index. */
type SpatialType = "Point" | "LineString" | "Polygon" | "MultiPolygon";
interface ContainerPartitionKey {
  /* List of paths using which data within the container can be partitioned */
  paths: Path[];

  /* Indicates the kind of algorithm used for partitioning */
  kind: string;
  /* Indicates the version of the partition key definition */
  version: number;
}

/* A path. These typically start with root (/path) */
type Path = string;
interface UniqueKeyPolicy {
  /* List of unique keys on that enforces uniqueness constraint on documents in the collection in the Azure Cosmos DB service. */
  uniqueKeys: UniqueKey[];
}

interface UniqueKey {
  /* List of paths must be unique for each document in the Azure Cosmos DB service */
  paths: Path[];
}

interface ConflictResolutionPolicy {
  /* Indicates the conflict resolution mode. */
  mode: string;
  /* The conflict resolution path in the case of LastWriterWins mode. */
  conflictResolutionPath: string;
  /* The procedure to resolve conflicts in the case of custom mode. */
  conflictResolutionProcedure: string;
}

interface SqlStoredProcedureResource {
  /* Name of the Cosmos DB SQL storedProcedure */
  id: string;
  /* Body of the Stored Procedure */
  body: string;
}

interface SqlUserDefinedFunctionResource {
  /* Name of the Cosmos DB SQL userDefinedFunction */
  id: string;
  /* Body of the User Defined Function */
  body: string;
}

interface SqlTriggerResource {
  /* Name of the Cosmos DB SQL trigger */
  id: string;
  /* Body of the Trigger */
  body: string;
  /* Type of the Trigger */
  triggerType: string;
  /* The operation the trigger is associated with */
  triggerOperation: string;
}

interface MongoDBDatabaseResource {
  /* Name of the Cosmos DB MongoDB database */
  id: string;
}

interface MongoDBCollectionResource {
  /* Name of the Cosmos DB MongoDB collection */
  id: string;
  /* A key-value pair of shard keys to be applied for the request. */
  shardKey: ShardKeys;

  /* List of index keys */
  indexes: MongoIndex[];

  /* Analytical TTL. */
  analyticalStorageTtl: number;
}

/* The shard key and partition kind pair, only support "Hash" partition kind */
type ShardKeys = { [key: string]: string };
interface MongoIndex {
  /* Cosmos DB MongoDB collection index keys */
  key: MongoIndexKeys;

  /* Cosmos DB MongoDB collection index key options */
  options: MongoIndexOptions;
}

interface MongoIndexKeys {
  /* List of keys for each MongoDB collection in the Azure Cosmos DB service */
  keys: Key[];
}

/* A Key. */
type Key = string;
interface MongoIndexOptions {
  /* Expire after seconds */
  expireAfterSeconds: number;
  /* Is unique or not */
  unique: boolean;
}

interface TableResource {
  /* Name of the Cosmos DB table */
  id: string;
}

interface CassandraKeyspaceResource {
  /* Name of the Cosmos DB Cassandra keyspace */
  id: string;
}

interface CassandraTableResource {
  /* Name of the Cosmos DB Cassandra table */
  id: string;
  /* Time to live of the Cosmos DB Cassandra table */
  defaultTtl: number;
  /* Schema of the Cosmos DB Cassandra table */
  schema: CassandraSchema;

  /* Analytical TTL. */
  analyticalStorageTtl: number;
}

interface CassandraSchema {
  /* List of Cassandra table columns. */
  columns: Column[];

  /* List of partition key. */
  partitionKeys: CassandraPartitionKey[];

  /* List of cluster key. */
  clusterKeys: ClusterKey[];
}

interface Column {
  /* Name of the Cosmos DB Cassandra table column */
  name: string;
  /* Type of the Cosmos DB Cassandra table column */
  type: string;
}

interface CassandraPartitionKey {
  /* Name of the Cosmos DB Cassandra table partition key */
  name: string;
}

interface ClusterKey {
  /* Name of the Cosmos DB Cassandra table cluster key */
  name: string;
  /* Order of the Cosmos DB Cassandra table cluster key, only support "Asc" and "Desc" */
  orderBy: string;
}

interface GremlinDatabaseResource {
  /* Name of the Cosmos DB Gremlin database */
  id: string;
}

interface GremlinGraphResource {
  /* Name of the Cosmos DB Gremlin graph */
  id: string;
  /* The configuration of the indexing policy. By default, the indexing is automatic for all document paths within the graph */
  indexingPolicy: IndexingPolicy;

  /* The configuration of the partition key to be used for partitioning data into multiple partitions */
  partitionKey: ContainerPartitionKey;

  /* Default time to live */
  defaultTtl: number;
  /* The unique key policy configuration for specifying uniqueness constraints on documents in the collection in the Azure Cosmos DB service. */
  uniqueKeyPolicy: UniqueKeyPolicy;

  /* The conflict resolution policy for the graph. */
  conflictResolutionPolicy: ConflictResolutionPolicy;
}

interface CreateUpdateOptions {
  /* Request Units per second. For example, "throughput": 10000. */
  throughput: number;
  /* Specifies the Autoscale settings. */
  autoscaleSettings: AutoscaleSettings;
}

interface AutoscaleSettings {
  /* Represents maximum throughput, the resource can scale up to. */
  maxThroughput: number;
}

interface Capability {
  /* Name of the Cosmos DB capability. For example, "name": "EnableCassandra". Current values also include "EnableTable" and "EnableGremlin". */
  name: string;
}

/* Tags are a list of key-value pairs that describe the resource. These tags can be used in viewing and grouping this resource (across resource groups). A maximum of 15 tags can be provided for a resource. Each tag must have a key no greater than 128 characters and value no greater than 256 characters. For example, the default experience for a template type is set with "defaultExperience": "Cassandra". Current "defaultExperience" values also include "Table", "Graph", "DocumentDB", and "MongoDB". */
type Tags = { [key: string]: string };
interface ManagedServiceIdentity {
  /* The principal id of the system assigned identity. This property will only be provided for a system assigned identity. */
  readonly principalId: string;
  /* The tenant id of the system assigned identity. This property will only be provided for a system assigned identity. */
  readonly tenantId: string;
  /* The type of identity used for the resource. The type 'SystemAssigned, UserAssigned' includes both an implicitly created identity and a set of user assigned identities. The type 'None' will remove any identities from the service. */
  type: string;
}

/* The status of the Cosmos DB account at the time the operation was called. The status can be one of following. 'Creating' – the Cosmos DB account is being created. When an account is in Creating state, only properties that are specified as input for the Create Cosmos DB account operation are returned. 'Succeeded' – the Cosmos DB account is active for use. 'Updating' – the Cosmos DB account is being updated. 'Deleting' – the Cosmos DB account is being deleted. 'Failed' – the Cosmos DB account failed creation. 'DeletionFailed' – the Cosmos DB account deletion failed. */
type ProvisioningState = string;

/* Array of IpAddressOrRange objects. */
type IPRules = IpAddressOrRange[];
interface IpAddressOrRange {
  /* A single IPv4 address or a single IPv4 address range in CIDR format. Provided IPs must be well-formatted and cannot be contained in one of the following ranges: 10.0.0.0/8, 100.64.0.0/10, 172.16.0.0/12, 192.168.0.0/16, since these are not enforceable by the IP address filter. Example of valid inputs: “23.40.210.245” or “23.40.210.0/8”. */
  ipAddressOrRange: string;
}

interface VirtualNetworkRule {
  /* Resource ID of a subnet, for example: /subscriptions/{subscriptionId}/resourceGroups/{groupName}/providers/Microsoft.Network/virtualNetworks/{virtualNetworkName}/subnets/{subnetName}. */
  id: string;
  /* Create firewall rule before the virtual network has vnet service endpoint enabled. */
  ignoreMissingVNetServiceEndpoint: boolean;
}

type PrivateEndpointConnection = unknown & {
  /* Resource properties. */
  properties: PrivateEndpointConnectionProperties;
};

interface PrivateEndpointConnectionProperties {
  /* Private endpoint which the connection belongs to. */
  privateEndpoint: PrivateEndpointProperty;

  /* Connection State of the Private Endpoint Connection. */
  privateLinkServiceConnectionState: PrivateLinkServiceConnectionStateProperty;
}

interface PrivateEndpointProperty {
  /* Resource id of the private endpoint. */
  id: string;
}

interface PrivateLinkServiceConnectionStateProperty {
  /* The private link service connection status. */
  status: string;
  /* Any action that is required beyond basic workflow (approve/ reject/ disconnect) */
  readonly actionsRequired: string;
}

interface Operation {
  /* Operation name: {provider}/{resource}/{operation} */
  name: string;
  /* The object that represents the operation. */
  display: undefined;
}

interface OperationListResult {
  /* List of operations supported by the Resource Provider. */
  value: Operation[];

  /* URL to get the next set of operation list results if there are any. */
  nextLink: string;
}

interface UsagesResult {
  /* The list of usages for the database. A usage is a point in time metric */
  readonly value: Usage[];
}

interface Usage {
  /* The unit of the metric. */
  unit: UnitType;

  /* The name information for the metric. */
  readonly name: MetricName;

  /* The quota period used to summarize the usage values. */
  readonly quotaPeriod: string;
  /* Maximum value for this metric */
  readonly limit: number;
  /* Current value for this metric */
  readonly currentValue: number;
}

interface PartitionUsagesResult {
  /* The list of partition-level usages for the database. A usage is a point in time metric */
  readonly value: PartitionUsage[];
}

type PartitionUsage = Usage & {
  /* The partition id (GUID identifier) of the usages. */
  readonly partitionId: string;
  /* The partition key range id (integer identifier) of the usages. */
  readonly partitionKeyRangeId: string;
};

interface MetricDefinitionsListResult {
  /* The list of metric definitions for the account. */
  readonly value: MetricDefinition[];
}

interface MetricDefinition {
  /* The list of metric availabilities for the account. */
  readonly metricAvailabilities: MetricAvailability[];

  /* The primary aggregation type of the metric. */
  readonly primaryAggregationType: string;
  /* The unit of the metric. */
  unit: UnitType;

  /* The resource uri of the database. */
  readonly resourceUri: string;
  /* The name information for the metric. */
  readonly name: MetricName;
}

interface MetricAvailability {
  /* The time grain to be used to summarize the metric values. */
  readonly timeGrain: string;
  /* The retention for the metric values. */
  readonly retention: string;
}

interface MetricListResult {
  /* The list of metrics for the account. */
  readonly value: Metric[];
}

interface Metric {
  /* The start time for the metric (ISO-8601 format). */
  readonly startTime: string;
  /* The end time for the metric (ISO-8601 format). */
  readonly endTime: string;
  /* The time grain to be used to summarize the metric values. */
  readonly timeGrain: string;
  /* The unit of the metric. */
  unit: UnitType;

  /* The name information for the metric. */
  readonly name: MetricName;

  /* The metric values for the specified time window and timestep. */
  readonly metricValues: MetricValue[];
}

interface MetricName {
  /* The name of the metric. */
  readonly value: string;
  /* The friendly name of the metric. */
  readonly localizedValue: string;
}

interface MetricValue {
  /* The number of values for the metric. */
  readonly _count: number;
  /* The average value of the metric. */
  readonly average: number;
  /* The max value of the metric. */
  readonly maximum: number;
  /* The min value of the metric. */
  readonly minimum: number;
  /* The metric timestamp (ISO-8601 format). */
  readonly timestamp: string;
  /* The total value of the metric. */
  readonly total: number;
}

interface PercentileMetricListResult {
  /* The list of percentile metrics for the account. */
  readonly value: PercentileMetric[];
}

interface PercentileMetric {
  /* The start time for the metric (ISO-8601 format). */
  readonly startTime: string;
  /* The end time for the metric (ISO-8601 format). */
  readonly endTime: string;
  /* The time grain to be used to summarize the metric values. */
  readonly timeGrain: string;
  /* The unit of the metric. */
  unit: UnitType;

  /* The name information for the metric. */
  readonly name: MetricName;

  /* The percentile metric values for the specified time window and timestep. */
  readonly metricValues: PercentileMetricValue[];
}

type PercentileMetricValue = MetricValue & {
  /* The 10th percentile value for the metric. */
  readonly P10: number;
  /* The 25th percentile value for the metric. */
  readonly P25: number;
  /* The 50th percentile value for the metric. */
  readonly P50: number;
  /* The 75th percentile value for the metric. */
  readonly P75: number;
  /* The 90th percentile value for the metric. */
  readonly P90: number;
  /* The 95th percentile value for the metric. */
  readonly P95: number;
  /* The 99th percentile value for the metric. */
  readonly P99: number;
};

interface PartitionMetricListResult {
  /* The list of partition-level metrics for the account. */
  readonly value: PartitionMetric[];
}

type PartitionMetric = Metric & {
  /* The partition id (GUID identifier) of the metric values. */
  readonly partitionId: string;
  /* The partition key range id (integer identifier) of the metric values. */
  readonly partitionKeyRangeId: string;
};

/* The unit of the metric. */
type UnitType = "Count" | "Bytes" | "Seconds" | "Percent" | "CountPerSecond" | "BytesPerSecond" | "Milliseconds";

/* The cassandra connector offer type for the Cosmos DB C* database account. */
type ConnectorOffer = "Small";

/* Whether requests from Public Network are allowed */
type PublicNetworkAccess = "Enabled" | "Disabled";
interface ApiProperties {
  /* Describes the ServerVersion of an a MongoDB account. */
  serverVersion: string;
}

/* Enum to indicate the mode of account creation. */
type CreateMode = "Default" | "Restore";
interface RestoreParameters {
  /* Describes the mode of the restore. */
  restoreMode: string;
  /* Path of the source account from which the restore has to be initiated */
  restoreSource: string;
  /* Time to which the account has to be restored (ISO-8601 format). */
  restoreTimestampInUtc: string;
  /* List of specific databases to restore. */
  databasesToRestore: DatabaseRestoreResource[];
}

interface DatabaseRestoreResource {
  /* The name of the database to restore. */
  databaseName: string;
  /* The names of the collections to restore. */
  collectionNames: CollectionName[];
}

/* The name of the collection. */
type CollectionName = string;
interface BackupPolicy {
  /* Describes the mode of backups. */
  type: string;
}

type PeriodicModeBackupPolicy = BackupPolicy & {
  /* Configuration values for periodic mode backup */
  periodicModeProperties: PeriodicModeProperties;
};

/* The object representing continuous mode backup policy. */
type ContinuousModeBackupPolicy = BackupPolicy;
interface PeriodicModeProperties {
  /* An integer representing the interval in minutes between two backups */
  backupIntervalInMinutes: number;
  /* An integer representing the time (in hours) that each backup is retained */
  backupRetentionIntervalInHours: number;
}

interface RestorableDatabaseAccountsListResult {
  /* List of restorable database accounts and their properties. */
  readonly value: RestorableDatabaseAccountGetResult[];
}

type RestorableDatabaseAccountGetResult = ARMResourceProperties & {
  /* The properties of a restorable database account. */
  properties: RestorableDatabaseAccountProperties;
};

interface RestorableDatabaseAccountProperties {
  /* The name of the global database account */
  accountName: string;
  /* The creation time of the restorable database account (ISO-8601 format). */
  creationTime: string;
  /* The time at which the restorable database account has been deleted (ISO-8601 format). */
  deletionTime: string;
}

export const DatabaseAccounts = {
  /* Retrieves the properties of an existing Azure Cosmos DB database account. */
  async get(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<DatabaseAccountGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Updates the properties of an existing Azure Cosmos DB database account. */
  async update(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    body: DatabaseAccountUpdateParameters
  ): Promise<DatabaseAccountGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
        { method: "patch", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Creates or updates an Azure Cosmos DB database account. The "Update" method is preferred when performing updates on an account. */
  async createOrUpdate(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    body: DatabaseAccountCreateUpdateParameters
  ): Promise<DatabaseAccountGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB database account. */
  async delete(subscriptionId: string, resourceGroupName: string, accountName: string): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Changes the failover priority for the Azure Cosmos DB database account. A failover priority of 0 indicates a write region. The maximum value for a failover priority = (total number of regions - 1). Failover priority values must be unique for each of the regions in which the database account exists. */
  async failoverPriorityChange(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    body: FailoverPolicies
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/failoverPriorityChange`,
        { method: "post", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Lists all the Azure Cosmos DB database accounts available under the subscription. */
  async list(subscriptionId: string): Promise<DatabaseAccountsListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.DocumentDB/databaseAccounts`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Lists all the Azure Cosmos DB database accounts available under the given resource group. */
  async listByResourceGroup(subscriptionId: string, resourceGroupName: string): Promise<DatabaseAccountsListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Lists the access keys for the specified Azure Cosmos DB database account. */
  async listKeys(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<DatabaseAccountListKeysResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/listKeys`,
        { method: "post" }
      )
      .then(response => response.json());
  },
  /* Lists the connection strings for the specified Azure Cosmos DB database account. */
  async listConnectionStrings(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<DatabaseAccountListConnectionStringsResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/listConnectionStrings`,
        { method: "post" }
      )
      .then(response => response.json());
  },
  /* Offline the specified region for the specified Azure Cosmos DB database account. */
  async offlineRegion(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    body: RegionForOnlineOffline
  ): Promise<void | void | ErrorResponse> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/offlineRegion`,
        { method: "post", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Online the specified region for the specified Azure Cosmos DB database account. */
  async onlineRegion(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    body: RegionForOnlineOffline
  ): Promise<void | void | ErrorResponse> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/onlineRegion`,
        { method: "post", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Lists the read-only access keys for the specified Azure Cosmos DB database account. */
  async getReadOnlyKeys(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<DatabaseAccountListReadOnlyKeysResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/readonlykeys`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Lists the read-only access keys for the specified Azure Cosmos DB database account. */
  async listReadOnlyKeys(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<DatabaseAccountListReadOnlyKeysResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/readonlykeys`,
        { method: "post" }
      )
      .then(response => response.json());
  },
  /* Regenerates an access key for the specified Azure Cosmos DB database account. */
  async regenerateKey(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    body: DatabaseAccountRegenerateKeyParameters
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/regenerateKey`,
        { method: "post", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Checks that the Azure Cosmos DB account name already exists. A valid account name may contain only lowercase letters, numbers, and the '-' character, and must be between 3 and 50 characters. */
  async checkNameExists(accountName: string): Promise<void | void> {
    return window
      .fetch(`https://management.azure.com/providers/Microsoft.DocumentDB/databaseAccountNames/${accountName}`, {
        method: "head"
      })
      .then(response => response.json());
  },
  /* Retrieves the metrics determined by the given filter for the given database account. */
  async listMetrics(subscriptionId: string, resourceGroupName: string, accountName: string): Promise<MetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves the usages (most recent data) for the given database account. */
  async listUsages(subscriptionId: string, resourceGroupName: string, accountName: string): Promise<UsagesResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/usages`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves metric definitions for the given database account. */
  async listMetricDefinitions(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<MetricDefinitionsListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/metricDefinitions`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const Operations = {
  /* Lists all of the available Cosmos DB Resource Provider operations. */
  async list(): Promise<OperationListResult> {
    return window
      .fetch(`https://management.azure.com/providers/Microsoft.DocumentDB/operations`, { method: "get" })
      .then(response => response.json());
  }
};
export const Database = {
  /* Retrieves the metrics determined by the given filter for the given database account and database. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string
  ): Promise<MetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves the usages (most recent data) for the given database. */
  async listUsages(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string
  ): Promise<UsagesResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/usages`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves metric definitions for the given database. */
  async listMetricDefinitions(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string
  ): Promise<MetricDefinitionsListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/metricDefinitions`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const Collection = {
  /* Retrieves the metrics determined by the given filter for the given database account and collection. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string,
    collectionRid: string
  ): Promise<MetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves the usages (most recent storage data) for the given collection. */
  async listUsages(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string,
    collectionRid: string
  ): Promise<UsagesResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/usages`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves metric definitions for the given collection. */
  async listMetricDefinitions(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string,
    collectionRid: string
  ): Promise<MetricDefinitionsListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/metricDefinitions`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const CollectionRegion = {
  /* Retrieves the metrics determined by the given filter for the given database account, collection and region. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    region: string,
    databaseRid: string,
    collectionRid: string
  ): Promise<MetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/region/${region}/databases/${databaseRid}/collections/${collectionRid}/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const DatabaseAccountRegion = {
  /* Retrieves the metrics determined by the given filter for the given database account and region. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    region: string
  ): Promise<MetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/region/${region}/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const PercentileSourceTarget = {
  /* Retrieves the metrics determined by the given filter for the given account, source and target region. This url is only for PBS and Replication Latency data */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    sourceRegion: string,
    targetRegion: string
  ): Promise<PercentileMetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sourceRegion/${sourceRegion}/targetRegion/${targetRegion}/percentile/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const PercentileTarget = {
  /* Retrieves the metrics determined by the given filter for the given account target region. This url is only for PBS and Replication Latency data */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    targetRegion: string
  ): Promise<PercentileMetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/targetRegion/${targetRegion}/percentile/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const Percentile = {
  /* Retrieves the metrics determined by the given filter for the given database account. This url is only for PBS and Replication Latency data */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<PercentileMetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/percentile/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const CollectionPartitionRegion = {
  /* Retrieves the metrics determined by the given filter for the given collection and region, split by partition. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    region: string,
    databaseRid: string,
    collectionRid: string
  ): Promise<PartitionMetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/region/${region}/databases/${databaseRid}/collections/${collectionRid}/partitions/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const CollectionPartition = {
  /* Retrieves the metrics determined by the given filter for the given collection, split by partition. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string,
    collectionRid: string
  ): Promise<PartitionMetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/partitions/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves the usages (most recent storage data) for the given collection, split by partition. */
  async listUsages(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string,
    collectionRid: string
  ): Promise<PartitionUsagesResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/partitions/usages`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const PartitionKeyRangeId = {
  /* Retrieves the metrics determined by the given filter for the given partition key range id. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseRid: string,
    collectionRid: string,
    partitionKeyRangeId: string
  ): Promise<PartitionMetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/databases/${databaseRid}/collections/${collectionRid}/partitionKeyRangeId/${partitionKeyRangeId}/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const PartitionKeyRangeIdRegion = {
  /* Retrieves the metrics determined by the given filter for the given partition key range id and region. */
  async listMetrics(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    region: string,
    databaseRid: string,
    collectionRid: string,
    partitionKeyRangeId: string
  ): Promise<PartitionMetricListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/region/${region}/databases/${databaseRid}/collections/${collectionRid}/partitionKeyRangeId/${partitionKeyRangeId}/metrics`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
export const SqlResources = {
  /* Lists the SQL databases under an existing Azure Cosmos DB database account. */
  async listSqlDatabases(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<SqlDatabaseListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the SQL database under an existing Azure Cosmos DB database account with the provided name. */
  async getSqlDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<SqlDatabaseGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB SQL database */
  async createUpdateSqlDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    body: SqlDatabaseCreateUpdateParameters
  ): Promise<SqlDatabaseGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB SQL database. */
  async deleteSqlDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the SQL database under an existing Azure Cosmos DB database account with the provided name. */
  async getSqlDatabaseThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of an Azure Cosmos DB SQL database */
  async updateSqlDatabaseThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Lists the SQL container under an existing Azure Cosmos DB database account. */
  async listSqlContainers(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<SqlContainerListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the SQL container under an existing Azure Cosmos DB database account. */
  async getSqlContainer(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string
  ): Promise<SqlContainerGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB SQL container */
  async createUpdateSqlContainer(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    body: SqlContainerCreateUpdateParameters
  ): Promise<SqlContainerGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB SQL container. */
  async deleteSqlContainer(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the SQL container under an existing Azure Cosmos DB database account. */
  async getSqlContainerThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of an Azure Cosmos DB SQL container */
  async updateSqlContainerThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Lists the SQL storedProcedure under an existing Azure Cosmos DB database account. */
  async listSqlStoredProcedures(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string
  ): Promise<SqlStoredProcedureListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the SQL storedProcedure under an existing Azure Cosmos DB database account. */
  async getSqlStoredProcedure(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    storedProcedureName: string
  ): Promise<SqlStoredProcedureGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures/${storedProcedureName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB SQL storedProcedure */
  async createUpdateSqlStoredProcedure(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    storedProcedureName: string,
    body: SqlStoredProcedureCreateUpdateParameters
  ): Promise<SqlStoredProcedureGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures/${storedProcedureName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB SQL storedProcedure. */
  async deleteSqlStoredProcedure(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    storedProcedureName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/storedProcedures/${storedProcedureName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Lists the SQL userDefinedFunction under an existing Azure Cosmos DB database account. */
  async listSqlUserDefinedFunctions(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string
  ): Promise<SqlUserDefinedFunctionListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the SQL userDefinedFunction under an existing Azure Cosmos DB database account. */
  async getSqlUserDefinedFunction(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    userDefinedFunctionName: string
  ): Promise<SqlUserDefinedFunctionGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions/${userDefinedFunctionName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB SQL userDefinedFunction */
  async createUpdateSqlUserDefinedFunction(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    userDefinedFunctionName: string,
    body: SqlUserDefinedFunctionCreateUpdateParameters
  ): Promise<SqlUserDefinedFunctionGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions/${userDefinedFunctionName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB SQL userDefinedFunction. */
  async deleteSqlUserDefinedFunction(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    userDefinedFunctionName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/userDefinedFunctions/${userDefinedFunctionName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Lists the SQL trigger under an existing Azure Cosmos DB database account. */
  async listSqlTriggers(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string
  ): Promise<SqlTriggerListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the SQL trigger under an existing Azure Cosmos DB database account. */
  async getSqlTrigger(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    triggerName: string
  ): Promise<SqlTriggerGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers/${triggerName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB SQL trigger */
  async createUpdateSqlTrigger(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    triggerName: string,
    body: SqlTriggerCreateUpdateParameters
  ): Promise<SqlTriggerGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers/${triggerName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB SQL trigger. */
  async deleteSqlTrigger(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    containerName: string,
    triggerName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/sqlDatabases/${databaseName}/containers/${containerName}/triggers/${triggerName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  }
};
export const MongoDBResources = {
  /* Lists the MongoDB databases under an existing Azure Cosmos DB database account. */
  async listMongoDBDatabases(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<MongoDBDatabaseListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the MongoDB databases under an existing Azure Cosmos DB database account with the provided name. */
  async getMongoDBDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<MongoDBDatabaseGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or updates Azure Cosmos DB MongoDB database */
  async createUpdateMongoDBDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    body: MongoDBDatabaseCreateUpdateParameters
  ): Promise<MongoDBDatabaseGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB MongoDB database. */
  async deleteMongoDBDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the MongoDB database under an existing Azure Cosmos DB database account with the provided name. */
  async getMongoDBDatabaseThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of the an Azure Cosmos DB MongoDB database */
  async updateMongoDBDatabaseThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Lists the MongoDB collection under an existing Azure Cosmos DB database account. */
  async listMongoDBCollections(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<MongoDBCollectionListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the MongoDB collection under an existing Azure Cosmos DB database account. */
  async getMongoDBCollection(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    collectionName: string
  ): Promise<MongoDBCollectionGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB MongoDB Collection */
  async createUpdateMongoDBCollection(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    collectionName: string,
    body: MongoDBCollectionCreateUpdateParameters
  ): Promise<MongoDBCollectionGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB MongoDB Collection. */
  async deleteMongoDBCollection(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    collectionName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the MongoDB collection under an existing Azure Cosmos DB database account with the provided name. */
  async getMongoDBCollectionThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    collectionName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update the RUs per second of an Azure Cosmos DB MongoDB collection */
  async updateMongoDBCollectionThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    collectionName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/mongodbDatabases/${databaseName}/collections/${collectionName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  }
};
export const TableResources = {
  /* Lists the Tables under an existing Azure Cosmos DB database account. */
  async listTables(subscriptionId: string, resourceGroupName: string, accountName: string): Promise<TableListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the Tables under an existing Azure Cosmos DB database account with the provided name. */
  async getTable(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    tableName: string
  ): Promise<TableGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB Table */
  async createUpdateTable(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    tableName: string,
    body: TableCreateUpdateParameters
  ): Promise<TableGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB Table. */
  async deleteTable(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    tableName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the Table under an existing Azure Cosmos DB database account with the provided name. */
  async getTableThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    tableName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of an Azure Cosmos DB Table */
  async updateTableThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    tableName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/tables/${tableName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  }
};
export const CassandraResources = {
  /* Lists the Cassandra keyspaces under an existing Azure Cosmos DB database account. */
  async listCassandraKeyspaces(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<CassandraKeyspaceListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the Cassandra keyspaces under an existing Azure Cosmos DB database account with the provided name. */
  async getCassandraKeyspace(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string
  ): Promise<CassandraKeyspaceGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB Cassandra keyspace */
  async createUpdateCassandraKeyspace(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string,
    body: CassandraKeyspaceCreateUpdateParameters
  ): Promise<CassandraKeyspaceGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB Cassandra keyspace. */
  async deleteCassandraKeyspace(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the Cassandra Keyspace under an existing Azure Cosmos DB database account with the provided name. */
  async getCassandraKeyspaceThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of an Azure Cosmos DB Cassandra Keyspace */
  async updateCassandraKeyspaceThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Lists the Cassandra table under an existing Azure Cosmos DB database account. */
  async listCassandraTables(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string
  ): Promise<CassandraTableListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/tables`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the Cassandra table under an existing Azure Cosmos DB database account. */
  async getCassandraTable(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string,
    tableName: string
  ): Promise<CassandraTableGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/tables/${tableName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB Cassandra Table */
  async createUpdateCassandraTable(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string,
    tableName: string,
    body: CassandraTableCreateUpdateParameters
  ): Promise<CassandraTableGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/tables/${tableName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB Cassandra table. */
  async deleteCassandraTable(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string,
    tableName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/tables/${tableName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the Cassandra table under an existing Azure Cosmos DB database account with the provided name. */
  async getCassandraTableThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string,
    tableName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/tables/${tableName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of an Azure Cosmos DB Cassandra table */
  async updateCassandraTableThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    keyspaceName: string,
    tableName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/cassandraKeyspaces/${keyspaceName}/tables/${tableName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  }
};
export const GremlinResources = {
  /* Lists the Gremlin databases under an existing Azure Cosmos DB database account. */
  async listGremlinDatabases(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string
  ): Promise<GremlinDatabaseListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the Gremlin databases under an existing Azure Cosmos DB database account with the provided name. */
  async getGremlinDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<GremlinDatabaseGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB Gremlin database */
  async createUpdateGremlinDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    body: GremlinDatabaseCreateUpdateParameters
  ): Promise<GremlinDatabaseGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB Gremlin database. */
  async deleteGremlinDatabase(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the RUs per second of the Gremlin database under an existing Azure Cosmos DB database account with the provided name. */
  async getGremlinDatabaseThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of an Azure Cosmos DB Gremlin database */
  async updateGremlinDatabaseThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Lists the Gremlin graph under an existing Azure Cosmos DB database account. */
  async listGremlinGraphs(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string
  ): Promise<GremlinGraphListResult> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Gets the Gremlin graph under an existing Azure Cosmos DB database account. */
  async getGremlinGraph(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    graphName: string
  ): Promise<GremlinGraphGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Create or update an Azure Cosmos DB Gremlin graph */
  async createUpdateGremlinGraph(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    graphName: string,
    body: GremlinGraphCreateUpdateParameters
  ): Promise<GremlinGraphGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  },
  /* Deletes an existing Azure Cosmos DB Gremlin graph. */
  async deleteGremlinGraph(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    graphName: string
  ): Promise<void | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}`,
        { method: "delete" }
      )
      .then(response => response.json());
  },
  /* Gets the Gremlin graph throughput under an existing Azure Cosmos DB database account with the provided name. */
  async getGremlinGraphThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    graphName: string
  ): Promise<ThroughputSettingsGetResults> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}/throughputSettings/default`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Update RUs per second of an Azure Cosmos DB Gremlin graph */
  async updateGremlinGraphThroughput(
    subscriptionId: string,
    resourceGroupName: string,
    accountName: string,
    databaseName: string,
    graphName: string,
    body: ThroughputSettingsUpdateParameters
  ): Promise<ThroughputSettingsGetResults | void> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.DocumentDB/databaseAccounts/${accountName}/gremlinDatabases/${databaseName}/graphs/${graphName}/throughputSettings/default`,
        { method: "put", body: JSON.stringify(body) }
      )
      .then(response => response.json());
  }
};
export const RestorableDatabaseAccounts = {
  /* Lists all the restorable Azure Cosmos DB database accounts available under the subscription and in a region. */
  async listByLocation(
    subscriptionId: string,
    location: string
  ): Promise<RestorableDatabaseAccountsListResult | ErrorResponseUpdatedFormat> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.DocumentDB/locations/${location}/restorableDatabaseAccounts`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Lists all the restorable Azure Cosmos DB database accounts available under the subscription. */
  async list(subscriptionId: string): Promise<RestorableDatabaseAccountsListResult | ErrorResponseUpdatedFormat> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.DocumentDB/restorableDatabaseAccounts`,
        { method: "get" }
      )
      .then(response => response.json());
  },
  /* Retrieves the properties of an existing Azure Cosmos DB restorable database account. */
  async getByLocation(
    subscriptionId: string,
    location: string,
    instanceId: string
  ): Promise<RestorableDatabaseAccountGetResult | ErrorResponseUpdatedFormat> {
    return window
      .fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.DocumentDB/locations/${location}/restorableDatabaseAccounts/${instanceId}`,
        { method: "get" }
      )
      .then(response => response.json());
  }
};
