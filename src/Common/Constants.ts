export class CodeOfConductEndpoints {
  public static privacyStatement: string = "https://aka.ms/ms-privacy-policy";
  public static codeOfConduct: string = "https://aka.ms/cosmos-code-of-conduct";
  public static termsOfUse: string = "https://aka.ms/ms-terms-of-use";
}

export class EndpointsRegex {
  public static readonly cassandra = [
    "AccountEndpoint=(.*).cassandra.cosmosdb.azure.com",
    "HostName=(.*).cassandra.cosmos.azure.com",
  ];
  public static readonly mongo = "mongodb://.*:(.*)@(.*).documents.azure.com";
  public static readonly mongoCompute = "mongodb://.*:(.*)@(.*).mongo.cosmos.azure.com";
  public static readonly sql = "AccountEndpoint=https://(.*).documents.azure.com";
  public static readonly table = "TableEndpoint=https://(.*).table.cosmosdb.azure.com";
}

export class ApiEndpoints {
  public static runtimeProxy: string = "/api/RuntimeProxy";
  public static guestRuntimeProxy: string = "/api/guest/RuntimeProxy";
}

export class ServerIds {
  public static localhost: string = "localhost";
  public static blackforest: string = "blackforest";
  public static fairfax: string = "fairfax";
  public static mooncake: string = "mooncake";
  public static productionPortal: string = "prod";
  public static dev: string = "dev";
}

export class ArmApiVersions {
  public static readonly documentDB: string = "2015-11-06";
  public static readonly arcadia: string = "2019-06-01-preview";
  public static readonly arcadiaLivy: string = "2019-11-01-preview";
  public static readonly arm: string = "2015-11-01";
  public static readonly armFeatures: string = "2014-08-01-preview";
  public static readonly publicVersion = "2020-04-01";
}

export class ArmResourceTypes {
  public static readonly notebookWorkspaces = "Microsoft.DocumentDB/databaseAccounts/notebookWorkspaces";
  public static readonly synapseWorkspaces = "Microsoft.Synapse/workspaces";
}

export class BackendDefaults {
  public static partitionKeyKind: string = "Hash";
  public static singlePartitionStorageInGb: string = "10";
  public static multiPartitionStorageInGb: string = "100";
  public static maxChangeFeedRetentionDuration: number = 10;
  public static partitionKeyVersion = 2;
}

export class ClientDefaults {
  public static requestTimeoutMs: number = 60000;
  public static portalCacheTimeoutMs: number = 10000;
  public static errorNotificationTimeoutMs: number = 5000;
  public static copyHelperTimeoutMs: number = 2000;
  public static waitForDOMElementMs: number = 500;
  public static cacheBustingTimeoutMs: number =
    10 /** minutes **/ * 60 /** to seconds **/ * 1000 /** to milliseconds **/;
  public static databaseThroughputIncreaseFactor: number = 100;
  public static readonly arcadiaTokenRefreshInterval: number =
    20 /** minutes **/ * 60 /** to seconds **/ * 1000 /** to milliseconds **/;
  public static readonly arcadiaTokenRefreshIntervalPaddingMs: number = 2000;
}

export enum AccountKind {
  DocumentDB = "DocumentDB",
  MongoDB = "MongoDB",
  Parse = "Parse",
  GlobalDocumentDB = "GlobalDocumentDB",
  Default = "DocumentDB",
}

export class CorrelationBackend {
  public static Url: string = "https://aka.ms/cosmosdbanalytics";
}

export class CapabilityNames {
  public static EnableTable: string = "EnableTable";
  public static EnableGremlin: string = "EnableGremlin";
  public static EnableCassandra: string = "EnableCassandra";
  public static EnableAutoScale: string = "EnableAutoScale";
  public static readonly EnableNotebooks: string = "EnableNotebooks";
  public static readonly EnableStorageAnalytics: string = "EnableStorageAnalytics";
  public static readonly EnableMongo: string = "EnableMongo";
  public static readonly EnableServerless: string = "EnableServerless";
}

// flight names returned from the portal are always lowercase
export class Flights {
  public static readonly SettingsV2 = "settingsv2";
  public static readonly MongoIndexEditor = "mongoindexeditor";
  public static readonly MongoIndexing = "mongoindexing";
  public static readonly AutoscaleTest = "autoscaletest";
  public static readonly SchemaAnalyzer = "schemaanalyzer";
}

export class AfecFeatures {
  public static readonly Spark = "spark-public-preview";
  public static readonly Notebooks = "sparknotebooks-public-preview";
  public static readonly StorageAnalytics = "storageanalytics-public-preview";
}

export class TagNames {
  public static defaultExperience: string = "defaultExperience";
}

export class MongoDBAccounts {
  public static protocol: string = "https";
  public static defaultPort: string = "10255";
}

export enum MongoBackendEndpointType {
  local,
  remote,
}

// TODO: 435619 Add default endpoints per cloud and use regional only when available
export class CassandraBackend {
  public static readonly createOrDeleteApi: string = "api/cassandra/createordelete";
  public static readonly guestCreateOrDeleteApi: string = "api/guest/cassandra/createordelete";
  public static readonly queryApi: string = "api/cassandra";
  public static readonly guestQueryApi: string = "api/guest/cassandra";
  public static readonly keysApi: string = "api/cassandra/keys";
  public static readonly guestKeysApi: string = "api/guest/cassandra/keys";
  public static readonly schemaApi: string = "api/cassandra/schema";
  public static readonly guestSchemaApi: string = "api/guest/cassandra/schema";
}

export class Queries {
  public static CustomPageOption: string = "custom";
  public static UnlimitedPageOption: string = "unlimited";
  public static itemsPerPage: number = 100;
  public static unlimitedItemsPerPage: number = 100; // TODO: Figure out appropriate value so it works for accounts with a large number of partitions

  public static QueryEditorMinHeightRatio: number = 0.1;
  public static QueryEditorMaxHeightRatio: number = 0.4;
  public static readonly DefaultMaxDegreeOfParallelism = 6;
}

export class SavedQueries {
  public static readonly CollectionName: string = "___Query";
  public static readonly DatabaseName: string = "___Cosmos";
  public static readonly OfferThroughput: number = 400;
  public static readonly PartitionKeyProperty: string = "id";
}

export class DocumentsGridMetrics {
  public static DocumentsPerPage: number = 100;
  public static IndividualRowHeight: number = 34;
  public static BufferHeight: number = 28;
  public static SplitterMinWidth: number = 200;
  public static SplitterMaxWidth: number = 360;

  public static DocumentEditorMinWidthRatio: number = 0.2;
  public static DocumentEditorMaxWidthRatio: number = 0.4;
}

export class ExplorerMetrics {
  public static SplitterMinWidth: number = 240;
  public static SplitterMaxWidth: number = 400;
  public static CollapsedResourceTreeWidth: number = 36;
}

export class SplitterMetrics {
  public static CollapsedPositionLeft: number = ExplorerMetrics.CollapsedResourceTreeWidth;
}

export class Areas {
  public static ResourceTree: string = "Resource Tree";
  public static ContextualPane: string = "Contextual Pane";
  public static Tab: string = "Tab";
  public static ShareDialog: string = "Share Access Dialog";
  public static Notebook: string = "Notebook";
}

export class HttpHeaders {
  public static activityId: string = "x-ms-activity-id";
  public static apiType: string = "x-ms-cosmos-apitype";
  public static authorization: string = "authorization";
  public static collectionIndexTransformationProgress: string =
    "x-ms-documentdb-collection-index-transformation-progress";
  public static continuation: string = "x-ms-continuation";
  public static correlationRequestId: string = "x-ms-correlation-request-id";
  public static enableScriptLogging: string = "x-ms-documentdb-script-enable-logging";
  public static guestAccessToken: string = "x-ms-encrypted-auth-token";
  public static getReadOnlyKey: string = "x-ms-get-read-only-key";
  public static connectionString: string = "x-ms-connection-string";
  public static msDate: string = "x-ms-date";
  public static location: string = "Location";
  public static contentType: string = "Content-Type";
  public static offerReplacePending: string = "x-ms-offer-replace-pending";
  public static user: string = "x-ms-user";
  public static populatePartitionStatistics: string = "x-ms-documentdb-populatepartitionstatistics";
  public static queryMetrics: string = "x-ms-documentdb-query-metrics";
  public static requestCharge: string = "x-ms-request-charge";
  public static resourceQuota: string = "x-ms-resource-quota";
  public static resourceUsage: string = "x-ms-resource-usage";
  public static retryAfterMs: string = "x-ms-retry-after-ms";
  public static scriptLogResults: string = "x-ms-documentdb-script-log-results";
  public static populateCollectionThroughputInfo = "x-ms-documentdb-populatecollectionthroughputinfo";
  public static supportSpatialLegacyCoordinates = "x-ms-documentdb-supportspatiallegacycoordinates";
  public static usePolygonsSmallerThanAHemisphere = "x-ms-documentdb-usepolygonssmallerthanahemisphere";
  public static autoPilotThroughput = "autoscaleSettings";
  public static autoPilotThroughputSDK = "x-ms-cosmos-offer-autopilot-settings";
  public static partitionKey: string = "x-ms-documentdb-partitionkey";
  public static migrateOfferToManualThroughput: string = "x-ms-cosmos-migrate-offer-to-manual-throughput";
  public static migrateOfferToAutopilot: string = "x-ms-cosmos-migrate-offer-to-autopilot";
}

export class ApiType {
  // Mapped to hexadecimal values in the backend
  public static readonly MongoDB: number = 1;
  public static readonly Gremlin: number = 2;
  public static readonly Cassandra: number = 4;
  public static readonly Table: number = 8;
  public static readonly SQL: number = 16;
}

export class HttpStatusCodes {
  public static readonly OK: number = 200;
  public static readonly Created: number = 201;
  public static readonly Accepted: number = 202;
  public static readonly NoContent: number = 204;
  public static readonly NotModified: number = 304;
  public static readonly Unauthorized: number = 401;
  public static readonly Forbidden: number = 403;
  public static readonly NotFound: number = 404;
  public static readonly TooManyRequests: number = 429;
  public static readonly Conflict: number = 409;

  public static readonly InternalServerError: number = 500;
  public static readonly BadGateway: number = 502;
  public static readonly ServiceUnavailable: number = 503;
  public static readonly GatewayTimeout: number = 504;

  public static readonly RetryableStatusCodes: number[] = [
    HttpStatusCodes.TooManyRequests,
    HttpStatusCodes.InternalServerError, // TODO: Handle all 500s on Portal backend and remove from retries list
    HttpStatusCodes.BadGateway,
    HttpStatusCodes.ServiceUnavailable,
    HttpStatusCodes.GatewayTimeout,
  ];
}

export class Urls {
  public static feedbackEmail = "https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Data%20Explorer%20Feedback";
  public static autoscaleMigration = "https://aka.ms/cosmos-autoscale-migration";
  public static freeTierInformation = "https://aka.ms/cosmos-free-tier";
  public static cosmosPricing = "https://aka.ms/azure-cosmos-db-pricing";
}

export class HashRoutePrefixes {
  public static databases: string = "/dbs/{db_id}";
  public static collections: string = "/dbs/{db_id}/colls/{coll_id}";
  public static sprocHash: string = "/sprocs/";
  public static sprocs: string = HashRoutePrefixes.collections + HashRoutePrefixes.sprocHash + "{sproc_id}";
  public static docs: string = HashRoutePrefixes.collections + "/docs/{doc_id}/";
  public static conflicts: string = HashRoutePrefixes.collections + "/conflicts";

  public static databasesWithId(databaseId: string): string {
    return this.databases.replace("{db_id}", databaseId).replace("/", ""); // strip the first slash since hasher adds it
  }

  public static collectionsWithIds(databaseId: string, collectionId: string): string {
    const transformedDatabasePrefix: string = this.collections.replace("{db_id}", databaseId);

    return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("/", ""); // strip the first slash since hasher adds it
  }

  public static sprocWithIds(
    databaseId: string,
    collectionId: string,
    sprocId: string,
    stripFirstSlash: boolean = true
  ): string {
    const transformedDatabasePrefix: string = this.sprocs.replace("{db_id}", databaseId);

    const transformedSprocRoute: string = transformedDatabasePrefix
      .replace("{coll_id}", collectionId)
      .replace("{sproc_id}", sprocId);
    if (!!stripFirstSlash) {
      return transformedSprocRoute.replace("/", ""); // strip the first slash since hasher adds it
    }

    return transformedSprocRoute;
  }

  public static conflictsWithIds(databaseId: string, collectionId: string) {
    const transformedDatabasePrefix: string = this.conflicts.replace("{db_id}", databaseId);

    return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("/", ""); // strip the first slash since hasher adds it;
  }

  public static docsWithIds(databaseId: string, collectionId: string, docId: string) {
    const transformedDatabasePrefix: string = this.docs.replace("{db_id}", databaseId);

    return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("{doc_id}", docId).replace("/", ""); // strip the first slash since hasher adds it
  }
}

export class ConfigurationOverridesValues {
  public static IsBsonSchemaV2: string = "true";
}

export class KeyCodes {
  public static Space: number = 32;
  public static Enter: number = 13;
  public static Escape: number = 27;
  public static UpArrow: number = 38;
  public static DownArrow: number = 40;
  public static LeftArrow: number = 37;
  public static RightArrow: number = 39;
  public static Tab: number = 9;
}

// Normalized per: https://www.w3.org/TR/uievents-key/#named-key-attribute-values
export class NormalizedEventKey {
  public static readonly Space = " ";
  public static readonly Enter = "Enter";
  public static readonly Escape = "Escape";
  public static readonly UpArrow = "ArrowUp";
  public static readonly DownArrow = "ArrowDown";
  public static readonly LeftArrow = "ArrowLeft";
  public static readonly RightArrow = "ArrowRight";
}

export class TryCosmosExperience {
  public static extendUrl: string = "https://trycosmosdb.azure.com/api/resource/extendportal?userId={0}";
  public static deleteUrl: string = "https://trycosmosdb.azure.com/api/resource/deleteportal?userId={0}";
  public static collectionsPerAccount: number = 3;
  public static maxRU: number = 5000;
  public static defaultRU: number = 3000;
}

export class OfferVersions {
  public static V1: string = "V1";
  public static V2: string = "V2";
}

export enum ConflictOperationType {
  Replace = "replace",
  Create = "create",
  Delete = "delete",
}

export const EmulatorMasterKey =
  //[SuppressMessage("Microsoft.Security", "CS002:SecretInNextLine", Justification="Well known public masterKey for emulator")]
  "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

// A variable @MyVariable defined in Constants.less is accessible as StyleConstants.MyVariable
export const StyleConstants = require("less-vars-loader!../../less/Common/Constants.less");

export class Notebook {
  public static readonly defaultBasePath = "./notebooks";
  public static readonly heartbeatDelayMs = 5000;
  public static readonly kernelRestartInitialDelayMs = 1000;
  public static readonly kernelRestartMaxDelayMs = 20000;
  public static readonly autoSaveIntervalMs = 120000;
}

export class SparkLibrary {
  public static readonly nameMinLength = 3;
  public static readonly nameMaxLength = 63;
}

export class AnalyticalStorageTtl {
  public static readonly Days90: number = 7776000;
  public static readonly Infinite: number = -1;
  public static readonly Disabled: number = 0;
}

export class TerminalQueryParams {
  public static readonly Terminal = "terminal";
  public static readonly Server = "server";
  public static readonly Token = "token";
  public static readonly SubscriptionId = "subscriptionId";
  public static readonly TerminalEndpoint = "terminalEndpoint";
}
