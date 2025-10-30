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
  public static partitionKeyKind = "Hash";
  public static partitionKeyMultiHash = "MultiHash";
  public static maxNumMultiHashPartition = 2;
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
  public static readonly EnableNoSQLVectorSearch: string = "EnableNoSQLVectorSearch";
  public static readonly EnableNoSQLFullTextSearch: string = "EnableNoSQLFullTextSearch";
  public static readonly EnableDataMasking: string = "EnableDataMasking";
  public static readonly EnableDynamicDataMasking: string = "EnableDynamicDataMasking";
  public static readonly EnableNoSQLFullTextSearchPreviewFeatures: string = "EnableNoSQLFullTextSearchPreviewFeatures";
  public static readonly EnableOnlineCopyFeature: string = "EnableOnlineCopyFeature";
}

export enum CapacityMode {
  Provisioned = "Provisioned",
  Serverless = "Serverless",
}

export enum WorkloadType {
  Learning = "Learning",
  DevelopmentTesting = "Development/Testing",
  Production = "Production",
  None = "None",
}
// flight names returned from the portal are always lowercase
export class Flights {
  public static readonly SettingsV2 = "settingsv2";
  public static readonly MongoIndexEditor = "mongoindexeditor";
  public static readonly MongoIndexing = "mongoindexing";
  public static readonly AutoscaleTest = "autoscaletest";
  public static readonly PartitionKeyTest = "partitionkeytest";
  public static readonly PKPartitionKeyTest = "pkpartitionkeytest";
  public static readonly PhoenixNotebooks = "phoenixnotebooks";
  public static readonly PhoenixFeatures = "phoenixfeatures";
  public static readonly NotebooksDownBanner = "notebooksdownbanner";
  public static readonly PublicGallery = "publicgallery";
}

export class AfecFeatures {
  public static readonly Spark = "spark-public-preview";
  public static readonly Notebooks = "sparknotebooks-public-preview";
  public static readonly StorageAnalytics = "storageanalytics-public-preview";
}

export class TagNames {
  public static defaultExperience: string = "defaultExperience";
  public static WorkloadType: string = "hidden-workload-type";
}

export class MongoDBAccounts {
  public static protocol: string = "https";
  public static defaultPort: string = "10255";
}

export enum MongoBackendEndpointType {
  local,
  remote,
}

export class AadScopeEndpoints {
  public static readonly Development: string = "https://cosmos.azure.com";
  public static readonly MPAC: string = "https://cosmos.azure.com";
  public static readonly Prod: string = "https://cosmos.azure.com";
  public static readonly Fairfax: string = "https://cosmos.azure.us";
  public static readonly Mooncake: string = "https://cosmos.azure.cn";
}

export class PortalBackendEndpoints {
  public static readonly Development: string = "https://localhost:7235";
  public static readonly Mpac: string = "https://cdb-ms-mpac-pbe.cosmos.azure.com";
  public static readonly Prod: string = "https://cdb-ms-prod-pbe.cosmos.azure.com";
  public static readonly Fairfax: string = "https://cdb-ff-prod-pbe.cosmos.azure.us";
  public static readonly Mooncake: string = "https://cdb-mc-prod-pbe.cosmos.azure.cn";
}

export class MongoProxyEndpoints {
  public static readonly Development: string = "https://localhost:7238";
  public static readonly Mpac: string = "https://cdb-ms-mpac-mp.cosmos.azure.com";
  public static readonly Prod: string = "https://cdb-ms-prod-mp.cosmos.azure.com";
  public static readonly Fairfax: string = "https://cdb-ff-prod-mp.cosmos.azure.us";
  public static readonly Mooncake: string = "https://cdb-mc-prod-mp.cosmos.azure.cn";
}

export class MongoProxyApi {
  public static readonly ResourceList: string = "ResourceList";
  public static readonly QueryDocuments: string = "QueryDocuments";
  public static readonly CreateDocument: string = "CreateDocument";
  public static readonly ReadDocument: string = "ReadDocument";
  public static readonly UpdateDocument: string = "UpdateDocument";
  public static readonly DeleteDocument: string = "DeleteDocument";
  public static readonly CreateCollectionWithProxy: string = "CreateCollectionWithProxy";
  public static readonly LegacyMongoShell: string = "LegacyMongoShell";
  public static readonly BulkDelete: string = "BulkDelete";
}

export class CassandraProxyEndpoints {
  public static readonly Development: string = "https://localhost:7240";
  public static readonly Mpac: string = "https://cdb-ms-mpac-cp.cosmos.azure.com";
  public static readonly Prod: string = "https://cdb-ms-prod-cp.cosmos.azure.com";
  public static readonly Fairfax: string = "https://cdb-ff-prod-cp.cosmos.azure.us";
  public static readonly Mooncake: string = "https://cdb-mc-prod-cp.cosmos.azure.cn";
}

//TODO: Remove this when new backend is migrated over
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

export class CassandraProxyAPIs {
  public static readonly createOrDeleteApi: string = "api/cassandra/createordelete";
  public static readonly connectionStringCreateOrDeleteApi: string = "api/connectionstring/cassandra/createordelete";
  public static readonly queryApi: string = "api/cassandra";
  public static readonly connectionStringQueryApi: string = "api/connectionstring/cassandra";
  public static readonly keysApi: string = "api/cassandra/keys";
  public static readonly connectionStringKeysApi: string = "api/connectionstring/cassandra/keys";
  public static readonly schemaApi: string = "api/cassandra/schema";
  public static readonly connectionStringSchemaApi: string = "api/connectionstring/cassandra/schema";
}

export class AadEndpoints {
  public static readonly Prod: string = "https://login.microsoftonline.com/";
  public static readonly Fairfax: string = "https://login.microsoftonline.us/";
  public static readonly Mooncake: string = "https://login.partner.microsoftonline.cn/";
}

export class Queries {
  public static CustomPageOption: string = "custom";
  public static UnlimitedPageOption: string = "unlimited";
  public static itemsPerPage: number = 100;
  public static unlimitedItemsPerPage: number = 100; // TODO: Figure out appropriate value so it works for accounts with a large number of partitions
  public static containersPerPage: number = 50;
  public static QueryEditorMinHeightRatio: number = 0.1;
  public static QueryEditorMaxHeightRatio: number = 0.4;
  public static readonly DefaultMaxDegreeOfParallelism = 6;
  public static readonly DefaultRetryAttempts = 9;
  public static readonly DefaultRetryIntervalInMs = 0;
  public static readonly DefaultMaxWaitTimeInSeconds = 30;
}

export class RBACOptions {
  public static setAutomaticRBACOption: string = "Automatic";
  public static setTrueRBACOption: string = "True";
  public static setFalseRBACOption: string = "False";
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

export class Areas {
  public static ResourceTree: string = "Resource Tree";
  public static ContextualPane: string = "Contextual Pane";
  public static Tab: string = "Tab";
  public static ShareDialog: string = "Share Access Dialog";
  public static Notebook: string = "Notebook";
  public static Copilot: string = "Copilot";
  public static CloudShell: string = "Cloud Shell";
}

export class HttpHeaders {
  public static activityId: string = "x-ms-activity-id";
  public static apiType: string = "x-ms-cosmos-apitype";
  public static authorization: string = "authorization";
  public static entraIdToken: string = "x-ms-entraid-token";
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
  public static xAPIKey: string = "X-API-Key";
}

export class ContentType {
  public static applicationJson: string = "application/json";
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
  public static readonly BadRequest: number = 400;
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
    stripFirstSlash: boolean = true,
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

export enum ConnectionStatusType {
  Connect = "Connect",
  Connecting = "Connecting",
  Connected = "Connected",
  Failed = "Connection Failed",
  Reconnect = "Reconnect",
}

export enum ContainerStatusType {
  Active = "Active",
  Disconnected = "Disconnected",
}

export enum PoolIdType {
  DefaultPoolId = "default",
  QueryCopilot = "query-copilot",
}

export const EmulatorMasterKey =
  //[SuppressMessage("Microsoft.Security", "CS002:SecretInNextLine", Justification="Well known public masterKey for emulator")]
  "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

export class Notebook {
  public static readonly defaultBasePath = "./notebooks";
  public static readonly heartbeatDelayMs = 60000;
  public static readonly containerStatusHeartbeatDelayMs = 30000;
  public static readonly kernelRestartInitialDelayMs = 1000;
  public static readonly kernelRestartMaxDelayMs = 20000;
  public static readonly autoSaveIntervalMs = 300000;
  public static readonly memoryGuageToGB = 1048576;
  public static readonly lowMemoryThreshold = 0.8;
  public static readonly remainingTimeForAlert = 10;
  public static readonly retryAttempts = 3;
  public static readonly retryAttemptDelayMs = 5000;
  public static readonly temporarilyDownMsg = "Notebooks is currently not available. We are working on it.";
  public static readonly mongoShellTemporarilyDownMsg =
    "We have identified an issue with the Mongo Shell and it is unavailable right now. We are actively working on the mitigation.";
  public static readonly cassandraShellTemporarilyDownMsg =
    "We have identified an issue with the Cassandra Shell and it is unavailable right now. We are actively working on the mitigation.";
  public static saveNotebookModalTitle = "Save notebook in temporary workspace";
  public static saveNotebookModalContent =
    "This notebook will be saved in the temporary workspace and will be removed when the session expires.";
  public static newNotebookModalTitle = "Create notebook in temporary workspace";
  public static newNotebookUploadModalTitle = "Upload notebook to temporary workspace";
  public static newNotebookModalContent1 =
    "A temporary workspace will be created to enable you to work with notebooks. When the session expires, any notebooks in the workspace will be removed.";
  public static newNotebookModalContent2 =
    "To save your work permanently, save your notebooks to a GitHub repository or download the notebooks to your local machine before the session ends. ";
  public static galleryNotebookDownloadContent1 =
    "To download, run, and make changes to this sample notebook, a temporary workspace will be created. When the session expires, any notebooks in the workspace will be removed.";
  public static galleryNotebookDownloadContent2 =
    "To save your work permanently, save your notebooks to a GitHub repository or download the Notebooks to your local machine before the session ends. ";
  public static cosmosNotebookHomePageUrl = "https://aka.ms/cosmos-notebooks-limits";
  public static cosmosNotebookGitDocumentationUrl = "https://aka.ms/cosmos-notebooks-github";
  public static learnMore = "Learn more.";
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

export class JunoEndpoints {
  public static readonly Test = "https://juno-test.documents-dev.windows-int.net";
  public static readonly Test2 = "https://juno-test2.documents-dev.windows-int.net";
  public static readonly Test3 = "https://juno-test3.documents-dev.windows-int.net";
  public static readonly Prod = "https://tools.cosmos.azure.com";
  public static readonly Stage = "https://tools-staging.cosmos.azure.com";
}

export class PriorityLevel {
  public static readonly High = "high";
  public static readonly Low = "low";
  public static readonly Default = "low";
}

export class ariaLabelForLearnMoreLink {
  public static readonly AnalyticalStore = "Learn more about analytical store.";
  public static readonly AzureSynapseLink = "Learn more about Azure Synapse Link.";
}

export class GlobalSecondaryIndexLabels {
  public static readonly NewGlobalSecondaryIndex: string = "New Global Secondary Index";
}
export class FeedbackLabels {
  public static readonly provideFeedback: string = "Provide feedback";
}

export const QueryCopilotSampleDatabaseId = "CopilotSampleDB";
export const QueryCopilotSampleContainerId = "SampleContainer";

export const QueryCopilotSampleContainerSchema = {
  product: {
    sampleData: {
      id: "c415e70f-9bf5-4cda-aebe-a290cb8b94c2",
      name: "Amazing Phone 3000 (Black)",
      price: 223.33,
      category: "Electronics",
      description:
        "This Amazing Phone 3000 (Black) is made of black metal! It has a very well made aluminum body and it feels very comfortable. We loved the sound that comes out of it! Also, the design of the phone was a little loose at first because I was using the camera and felt uncomfortable wearing it. The phone is actually made slightly smaller than these photos! This is due to the addition of a 3.3mm filter",
      stock: 84,
      countryOfOrigin: "USA",
      firstAvailable: "2018-09-07 19:41:44",
      priceHistory: [238.68, 234.7, 221.49, 205.88, 220.15],
      customerRatings: [
        {
          username: "steven66",
          firstName: "Carol",
          gender: "female",
          lastName: "Shelton",
          age: "25-35",
          area: "suburban",
          address: "261 Collins Burgs Apt. 332\nNorth Taylor, NM 32268",
          stars: 5,
          date: "2021-04-22 13:42:14",
          verifiedUser: true,
        },
        {
          username: "khudson",
          firstName: "Ronald",
          gender: "male",
          lastName: "Webb",
          age: "18-24",
          area: "suburban",
          address: "9912 Parker Court Apt. 068\nNorth Austin, HI 76225",
          stars: 5,
          date: "2021-02-07 07:00:22",
          verifiedUser: false,
        },
        {
          username: "lfrancis",
          firstName: "Brady",
          gender: "male",
          lastName: "Wright",
          age: "35-45",
          area: "urban",
          address: "PSC 5437, Box 3159\nAPO AA 26385",
          stars: 2,
          date: "2022-02-23 21:40:10",
          verifiedUser: false,
        },
        {
          username: "nicolemartinez",
          firstName: "Megan",
          gender: "female",
          lastName: "Tran",
          age: "18-24",
          area: "rural",
          address: "7445 Salazar Brooks\nNew Sarah, PW 18097",
          stars: 4,
          date: "2021-09-01 22:21:40",
          verifiedUser: false,
        },
        {
          username: "uguzman",
          firstName: "Deanna",
          gender: "female",
          lastName: "Campbell",
          age: "18-24",
          area: "urban",
          address: "41104 Moreno Fort Suite 872\nPort Michaelbury, AK 48712",
          stars: 1,
          date: "2022-03-07 02:23:14",
          verifiedUser: false,
        },
        {
          username: "rebeccahunt",
          firstName: "Jared",
          gender: "male",
          lastName: "Lopez",
          age: "18-24",
          area: "rural",
          address: "392 Morgan Village Apt. 785\nGreenshire, CT 05921",
          stars: 5,
          date: "2021-04-17 04:17:49",
          verifiedUser: false,
        },
      ],
      rareProperty: true,
    },
    schema: {
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        price: {
          type: "number",
        },
        category: {
          type: "string",
        },
        description: {
          type: "string",
        },
        stock: {
          type: "number",
        },
        countryOfOrigin: {
          type: "string",
        },
        firstAvailable: {
          type: "string",
        },
        priceHistory: {
          items: {
            type: "number",
          },
          type: "array",
        },
        customerRatings: {
          items: {
            properties: {
              username: {
                type: "string",
              },
              firstName: {
                type: "string",
              },
              gender: {
                type: "string",
              },
              lastName: {
                type: "string",
              },
              age: {
                type: "string",
              },
              area: {
                type: "string",
              },
              address: {
                type: "string",
              },
              stars: {
                type: "number",
              },
              date: {
                type: "string",
              },
              verifiedUser: {
                type: "boolean",
              },
            },
            type: "object",
          },
          type: "array",
        },
        rareProperty: {
          type: "boolean",
        },
      },
      type: "object",
    },
  },
};

export const ShortenedQueryCopilotSampleContainerSchema = {
  containerSchema: {
    product: {
      sampleData: {
        categoryName: "Components, Saddles",

        name: "LL Road Seat/Saddle",

        price: 27.12,

        tags: [
          {
            id: "0573D684-9140-4DEE-89AF-4E4A90E65666",

            name: "Tag-113",
          },

          {
            id: "6C2F05C8-1E61-4912-BE1A-C67A378429BB",

            name: "Tag-5",
          },
        ],
      },

      schema: {
        properties: {
          categoryName: {
            type: "string",
          },

          name: {
            type: "string",
          },

          price: {
            type: "number",
          },

          tags: {
            items: {
              properties: {
                id: {
                  type: "string",
                },

                name: {
                  type: "string",
                },
              },

              type: "object",
            },

            type: "array",
          },
        },

        type: "object",
      },
    },
  },

  userPrompt: "find all products",
};

export enum MongoGuidRepresentation {
  Standard = "Standard",
  CSharpLegacy = "CSharpLegacy",
  JavaLegacy = "JavaLegacy",
  PythonLegacy = "PythonLegacy",
}
