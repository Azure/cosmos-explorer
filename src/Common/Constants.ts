import { AutopilotTier } from "../Contracts/DataModels";
import { config } from "../Config";
import { HashMap } from "./HashMap";

export class AuthorizationEndpoints {
  public static arm: string = "https://management.core.windows.net/";
  public static common: string = "https://login.windows.net/";
}

export class BackendEndpoints {
  public static localhost: string = "https://localhost:12900";
  public static dev: string = "https://ext.documents-dev.windows-int.net";
  public static productionPortal: string = config.BACKEND_ENDPOINT || "https://main.documentdb.ext.azure.com";
}

export class EndpointsRegex {
  public static readonly cassandra = "AccountEndpoint=(.*).cassandra.cosmosdb.azure.com";
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

export class AccountKind {
  public static DocumentDB: string = "DocumentDB";
  public static MongoDB: string = "MongoDB";
  public static Parse: string = "Parse";
  public static GlobalDocumentDB: string = "GlobalDocumentDB";
  public static Default: string = AccountKind.DocumentDB;
}

export class CorrelationBackend {
  public static Url: string = "https://aka.ms/cosmosdbanalytics";
}

export class DefaultAccountExperience {
  public static DocumentDB: string = "DocumentDB";
  public static Graph: string = "Graph";
  public static MongoDB: string = "MongoDB";
  public static ApiForMongoDB: string = "Azure Cosmos DB for MongoDB API";
  public static Table: string = "Table";
  public static Cassandra: string = "Cassandra";
  public static Default: string = DefaultAccountExperience.DocumentDB;
}

export class CapabilityNames {
  public static EnableTable: string = "EnableTable";
  public static EnableGremlin: string = "EnableGremlin";
  public static EnableCassandra: string = "EnableCassandra";
  public static EnableAutoScale: string = "EnableAutoScale";
  public static readonly EnableNotebooks: string = "EnableNotebooks";
  public static readonly EnableStorageAnalytics: string = "EnableStorageAnalytics";
  public static readonly EnableMongo: string = "EnableMongo";
}

export class Features {
  public static readonly cosmosdb = "cosmosdb";
  public static readonly enableChangeFeedPolicy = "enablechangefeedpolicy";
  public static readonly enableRupm = "enablerupm";
  public static readonly executeSproc = "dataexplorerexecutesproc";
  public static readonly hostedDataExplorer = "hosteddataexplorerenabled";
  public static readonly enableTtl = "enablettl";
  public static readonly enableNotebooks = "enablenotebooks";
  public static readonly enableGalleryPublish = "enablegallerypublish";
  public static readonly enableSpark = "enablespark";
  public static readonly livyEndpoint = "livyendpoint";
  public static readonly notebookServerUrl = "notebookserverurl";
  public static readonly notebookServerToken = "notebookservertoken";
  public static readonly notebookBasePath = "notebookbasepath";
  public static readonly canExceedMaximumValue = "canexceedmaximumvalue";
  public static readonly enableFixedCollectionWithSharedThroughput = "enablefixedcollectionwithsharedthroughput";
  public static readonly enableAutoPilotV2 = "enableautopilotv2";
  public static readonly ttl90Days = "ttl90days";
  public static readonly enableRightPanelV2 = "enablerightpanelv2";
}

export class AfecFeatures {
  public static readonly Spark = "spark-public-preview";
  public static readonly Notebooks = "sparknotebooks-public-preview";
  public static readonly StorageAnalytics = "storageanalytics-public-preview";
}

export class Spark {
  public static readonly MaxWorkerCount = 10;
  public static readonly SKUs: HashMap<string> = new HashMap({
    "Cosmos.Spark.D1s": "D1s / 1 core / 4GB RAM",
    "Cosmos.Spark.D2s": "D2s / 2 cores / 8GB RAM",
    "Cosmos.Spark.D4s": "D4s / 4 cores / 16GB RAM",
    "Cosmos.Spark.D8s": "D8s / 8 cores / 32GB RAM",
    "Cosmos.Spark.D16s": "D16s / 16 cores / 64GB RAM",
    "Cosmos.Spark.D32s": "D32s / 32 cores / 128GB RAM",
    "Cosmos.Spark.D64s": "D64s / 64 cores / 256GB RAM"
  });
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
  remote
}

export class MongoBackend {
  public static localhostEndpoint: string = "/api/mongo/explorer";
  public static centralUsEndpoint: string = "https://main.documentdb.ext.azure.com/api/mongo/explorer";
  public static northEuropeEndpoint: string = "https://main.documentdb.ext.azure.com/api/mongo/explorer";
  public static southEastAsiaEndpoint: string = "https://main.documentdb.ext.azure.com/api/mongo/explorer";

  public static endpointsByRegion: any = {
    default: MongoBackend.centralUsEndpoint,
    northeurope: MongoBackend.northEuropeEndpoint,
    ukwest: MongoBackend.northEuropeEndpoint,
    uksouth: MongoBackend.northEuropeEndpoint,
    westeurope: MongoBackend.northEuropeEndpoint,
    australiaeast: MongoBackend.southEastAsiaEndpoint,
    australiasoutheast: MongoBackend.southEastAsiaEndpoint,
    centralindia: MongoBackend.southEastAsiaEndpoint,
    eastasia: MongoBackend.southEastAsiaEndpoint,
    japaneast: MongoBackend.southEastAsiaEndpoint,
    japanwest: MongoBackend.southEastAsiaEndpoint,
    koreacentral: MongoBackend.southEastAsiaEndpoint,
    koreasouth: MongoBackend.southEastAsiaEndpoint,
    southeastasia: MongoBackend.southEastAsiaEndpoint,
    southindia: MongoBackend.southEastAsiaEndpoint,
    westindia: MongoBackend.southEastAsiaEndpoint
  };

  public static endpointsByEnvironment: any = {
    default: MongoBackendEndpointType.local,
    localhost: MongoBackendEndpointType.local,
    prod1: MongoBackendEndpointType.remote,
    prod2: MongoBackendEndpointType.remote
  };
}

// TODO: 435619 Add default endpoints per cloud and use regional only when available
export class CassandraBackend {
  public static readonly localhostEndpoint: string = "https://localhost:12901/";
  public static readonly devEndpoint: string = "https://platformproxycassandradev.azurewebsites.net/";

  public static readonly centralUsEndpoint: string = "https://main.documentdb.ext.azure.com/";
  public static readonly northEuropeEndpoint: string = "https://main.documentdb.ext.azure.com/";
  public static readonly southEastAsiaEndpoint: string = "https://main.documentdb.ext.azure.com/";

  public static readonly bf_default: string = "https://main.documentdb.ext.microsoftazure.de/";
  public static readonly mc_default: string = "https://main.documentdb.ext.azure.cn/";
  public static readonly ff_default: string = "https://main.documentdb.ext.azure.us/";

  public static readonly endpointsByRegion: any = {
    default: CassandraBackend.centralUsEndpoint,
    northeurope: CassandraBackend.northEuropeEndpoint,
    ukwest: CassandraBackend.northEuropeEndpoint,
    uksouth: CassandraBackend.northEuropeEndpoint,
    westeurope: CassandraBackend.northEuropeEndpoint,
    australiaeast: CassandraBackend.southEastAsiaEndpoint,
    australiasoutheast: CassandraBackend.southEastAsiaEndpoint,
    centralindia: CassandraBackend.southEastAsiaEndpoint,
    eastasia: CassandraBackend.southEastAsiaEndpoint,
    japaneast: CassandraBackend.southEastAsiaEndpoint,
    japanwest: CassandraBackend.southEastAsiaEndpoint,
    koreacentral: CassandraBackend.southEastAsiaEndpoint,
    koreasouth: CassandraBackend.southEastAsiaEndpoint,
    southeastasia: CassandraBackend.southEastAsiaEndpoint,
    southindia: CassandraBackend.southEastAsiaEndpoint,
    westindia: CassandraBackend.southEastAsiaEndpoint,

    // Black Forest
    germanycentral: CassandraBackend.bf_default,
    germanynortheast: CassandraBackend.bf_default,

    // Fairfax
    usdodeast: CassandraBackend.ff_default,
    usdodcentral: CassandraBackend.ff_default,
    usgovarizona: CassandraBackend.ff_default,
    usgoviowa: CassandraBackend.ff_default,
    usgovtexas: CassandraBackend.ff_default,
    usgovvirginia: CassandraBackend.ff_default,

    // Mooncake
    chinaeast: CassandraBackend.mc_default,
    chinaeast2: CassandraBackend.mc_default,
    chinanorth: CassandraBackend.mc_default,
    chinanorth2: CassandraBackend.mc_default
  };

  public static readonly createOrDeleteApi: string = "api/cassandra/createordelete";
  public static readonly guestCreateOrDeleteApi: string = "api/guest/cassandra/createordelete";
  public static readonly queryApi: string = "api/cassandra";
  public static readonly guestQueryApi: string = "api/guest/cassandra";
  public static readonly keysApi: string = "api/cassandra/keys";
  public static readonly guestKeysApi: string = "api/guest/cassandra/keys";
  public static readonly schemaApi: string = "api/cassandra/schema";
  public static readonly guestSchemaApi: string = "api/guest/cassandra/schema";
}

export class RUPMStates {
  public static on: string = "on";
  public static off: string = "off";
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
  public static autoPilotTier = "x-ms-cosmos-offer-autopilot-tier";
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
    HttpStatusCodes.GatewayTimeout
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

    return transformedDatabasePrefix
      .replace("{coll_id}", collectionId)
      .replace("{doc_id}", docId)
      .replace("/", ""); // strip the first slash since hasher adds it
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
  Delete = "delete"
}

export class AutoPilot {
  public static tier1Text: string = "4,000 RU/s";
  public static tier2Text: string = "20,000 RU/s";
  public static tier3Text: string = "100,000 RU/s";
  public static tier4Text: string = "500,000 RU/s";

  public static tierText = {
    [AutopilotTier.Tier1]: "Tier 1",
    [AutopilotTier.Tier2]: "Tier 2",
    [AutopilotTier.Tier3]: "Tier 3",
    [AutopilotTier.Tier4]: "Tier 4"
  };

  public static tierMaxRus = {
    [AutopilotTier.Tier1]: 2000,
    [AutopilotTier.Tier2]: 20000,
    [AutopilotTier.Tier3]: 100000,
    [AutopilotTier.Tier4]: 500000
  };

  public static tierMinRus = {
    [AutopilotTier.Tier1]: 0,
    [AutopilotTier.Tier2]: 0,
    [AutopilotTier.Tier3]: 0,
    [AutopilotTier.Tier4]: 0
  };

  public static tierStorageInGB = {
    [AutopilotTier.Tier1]: 50,
    [AutopilotTier.Tier2]: 200,
    [AutopilotTier.Tier3]: 1000,
    [AutopilotTier.Tier4]: 5000
  };
}

export class DataExplorerVersions {
  public static readonly v_1_0_0: string = "1.0.0";
  public static readonly v_1_0_1: string = "1.0.1";
}

export class DataExplorerFeatures {
  public static offerCache: string = "OfferCache";
}

export const DataExplorerFeaturesVersions: any = {
  OfferCache: DataExplorerVersions.v_1_0_1
};

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
