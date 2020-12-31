"use strict";
exports.__esModule = true;
exports.TerminalQueryParams = exports.AnalyticalStorageTtl = exports.SparkLibrary = exports.Notebook = exports.StyleConstants = exports.EmulatorMasterKey = exports.ConflictOperationType = exports.OfferVersions = exports.TryCosmosExperience = exports.NormalizedEventKey = exports.KeyCodes = exports.ConfigurationOverridesValues = exports.HashRoutePrefixes = exports.Urls = exports.HttpStatusCodes = exports.ApiType = exports.HttpHeaders = exports.Areas = exports.SplitterMetrics = exports.ExplorerMetrics = exports.DocumentsGridMetrics = exports.SavedQueries = exports.Queries = exports.CassandraBackend = exports.MongoBackendEndpointType = exports.MongoDBAccounts = exports.TagNames = exports.Spark = exports.AfecFeatures = exports.Flights = exports.Features = exports.CapabilityNames = exports.DefaultAccountExperience = exports.CorrelationBackend = exports.AccountKind = exports.ClientDefaults = exports.BackendDefaults = exports.ArmResourceTypes = exports.ArmApiVersions = exports.ServerIds = exports.ApiEndpoints = exports.EndpointsRegex = exports.CodeOfConductEndpoints = exports.AuthorizationEndpoints = void 0;
var HashMap_1 = require("./HashMap");
var AuthorizationEndpoints = /** @class */ (function () {
    function AuthorizationEndpoints() {
    }
    AuthorizationEndpoints.arm = "https://management.core.windows.net/";
    AuthorizationEndpoints.common = "https://login.windows.net/";
    return AuthorizationEndpoints;
}());
exports.AuthorizationEndpoints = AuthorizationEndpoints;
var CodeOfConductEndpoints = /** @class */ (function () {
    function CodeOfConductEndpoints() {
    }
    CodeOfConductEndpoints.privacyStatement = "https://aka.ms/ms-privacy-policy";
    CodeOfConductEndpoints.codeOfConduct = "https://aka.ms/cosmos-code-of-conduct";
    CodeOfConductEndpoints.termsOfUse = "https://aka.ms/ms-terms-of-use";
    return CodeOfConductEndpoints;
}());
exports.CodeOfConductEndpoints = CodeOfConductEndpoints;
var EndpointsRegex = /** @class */ (function () {
    function EndpointsRegex() {
    }
    EndpointsRegex.cassandra = [
        "AccountEndpoint=(.*).cassandra.cosmosdb.azure.com",
        "HostName=(.*).cassandra.cosmos.azure.com"
    ];
    EndpointsRegex.mongo = "mongodb://.*:(.*)@(.*).documents.azure.com";
    EndpointsRegex.mongoCompute = "mongodb://.*:(.*)@(.*).mongo.cosmos.azure.com";
    EndpointsRegex.sql = "AccountEndpoint=https://(.*).documents.azure.com";
    EndpointsRegex.table = "TableEndpoint=https://(.*).table.cosmosdb.azure.com";
    return EndpointsRegex;
}());
exports.EndpointsRegex = EndpointsRegex;
var ApiEndpoints = /** @class */ (function () {
    function ApiEndpoints() {
    }
    ApiEndpoints.runtimeProxy = "/api/RuntimeProxy";
    ApiEndpoints.guestRuntimeProxy = "/api/guest/RuntimeProxy";
    return ApiEndpoints;
}());
exports.ApiEndpoints = ApiEndpoints;
var ServerIds = /** @class */ (function () {
    function ServerIds() {
    }
    ServerIds.localhost = "localhost";
    ServerIds.blackforest = "blackforest";
    ServerIds.fairfax = "fairfax";
    ServerIds.mooncake = "mooncake";
    ServerIds.productionPortal = "prod";
    ServerIds.dev = "dev";
    return ServerIds;
}());
exports.ServerIds = ServerIds;
var ArmApiVersions = /** @class */ (function () {
    function ArmApiVersions() {
    }
    ArmApiVersions.documentDB = "2015-11-06";
    ArmApiVersions.arcadia = "2019-06-01-preview";
    ArmApiVersions.arcadiaLivy = "2019-11-01-preview";
    ArmApiVersions.arm = "2015-11-01";
    ArmApiVersions.armFeatures = "2014-08-01-preview";
    ArmApiVersions.publicVersion = "2020-04-01";
    return ArmApiVersions;
}());
exports.ArmApiVersions = ArmApiVersions;
var ArmResourceTypes = /** @class */ (function () {
    function ArmResourceTypes() {
    }
    ArmResourceTypes.notebookWorkspaces = "Microsoft.DocumentDB/databaseAccounts/notebookWorkspaces";
    ArmResourceTypes.synapseWorkspaces = "Microsoft.Synapse/workspaces";
    return ArmResourceTypes;
}());
exports.ArmResourceTypes = ArmResourceTypes;
var BackendDefaults = /** @class */ (function () {
    function BackendDefaults() {
    }
    BackendDefaults.partitionKeyKind = "Hash";
    BackendDefaults.singlePartitionStorageInGb = "10";
    BackendDefaults.multiPartitionStorageInGb = "100";
    BackendDefaults.maxChangeFeedRetentionDuration = 10;
    BackendDefaults.partitionKeyVersion = 2;
    return BackendDefaults;
}());
exports.BackendDefaults = BackendDefaults;
var ClientDefaults = /** @class */ (function () {
    function ClientDefaults() {
    }
    ClientDefaults.requestTimeoutMs = 60000;
    ClientDefaults.portalCacheTimeoutMs = 10000;
    ClientDefaults.errorNotificationTimeoutMs = 5000;
    ClientDefaults.copyHelperTimeoutMs = 2000;
    ClientDefaults.waitForDOMElementMs = 500;
    ClientDefaults.cacheBustingTimeoutMs = 10 /** minutes **/ * 60 /** to seconds **/ * 1000 /** to milliseconds **/;
    ClientDefaults.databaseThroughputIncreaseFactor = 100;
    ClientDefaults.arcadiaTokenRefreshInterval = 20 /** minutes **/ * 60 /** to seconds **/ * 1000 /** to milliseconds **/;
    ClientDefaults.arcadiaTokenRefreshIntervalPaddingMs = 2000;
    return ClientDefaults;
}());
exports.ClientDefaults = ClientDefaults;
var AccountKind = /** @class */ (function () {
    function AccountKind() {
    }
    AccountKind.DocumentDB = "DocumentDB";
    AccountKind.MongoDB = "MongoDB";
    AccountKind.Parse = "Parse";
    AccountKind.GlobalDocumentDB = "GlobalDocumentDB";
    AccountKind.Default = AccountKind.DocumentDB;
    return AccountKind;
}());
exports.AccountKind = AccountKind;
var CorrelationBackend = /** @class */ (function () {
    function CorrelationBackend() {
    }
    CorrelationBackend.Url = "https://aka.ms/cosmosdbanalytics";
    return CorrelationBackend;
}());
exports.CorrelationBackend = CorrelationBackend;
var DefaultAccountExperience = /** @class */ (function () {
    function DefaultAccountExperience() {
    }
    DefaultAccountExperience.DocumentDB = "DocumentDB";
    DefaultAccountExperience.Graph = "Graph";
    DefaultAccountExperience.MongoDB = "MongoDB";
    DefaultAccountExperience.ApiForMongoDB = "Azure Cosmos DB for MongoDB API";
    DefaultAccountExperience.Table = "Table";
    DefaultAccountExperience.Cassandra = "Cassandra";
    DefaultAccountExperience.Default = DefaultAccountExperience.DocumentDB;
    return DefaultAccountExperience;
}());
exports.DefaultAccountExperience = DefaultAccountExperience;
var CapabilityNames = /** @class */ (function () {
    function CapabilityNames() {
    }
    CapabilityNames.EnableTable = "EnableTable";
    CapabilityNames.EnableGremlin = "EnableGremlin";
    CapabilityNames.EnableCassandra = "EnableCassandra";
    CapabilityNames.EnableAutoScale = "EnableAutoScale";
    CapabilityNames.EnableNotebooks = "EnableNotebooks";
    CapabilityNames.EnableStorageAnalytics = "EnableStorageAnalytics";
    CapabilityNames.EnableMongo = "EnableMongo";
    CapabilityNames.EnableServerless = "EnableServerless";
    return CapabilityNames;
}());
exports.CapabilityNames = CapabilityNames;
var Features = /** @class */ (function () {
    function Features() {
    }
    Features.cosmosdb = "cosmosdb";
    Features.enableChangeFeedPolicy = "enablechangefeedpolicy";
    Features.executeSproc = "dataexplorerexecutesproc";
    Features.hostedDataExplorer = "hosteddataexplorerenabled";
    Features.enableTtl = "enablettl";
    Features.enableNotebooks = "enablenotebooks";
    Features.enableGalleryPublish = "enablegallerypublish";
    Features.enableLinkInjection = "enablelinkinjection";
    Features.enableSpark = "enablespark";
    Features.livyEndpoint = "livyendpoint";
    Features.notebookServerUrl = "notebookserverurl";
    Features.notebookServerToken = "notebookservertoken";
    Features.notebookBasePath = "notebookbasepath";
    Features.canExceedMaximumValue = "canexceedmaximumvalue";
    Features.enableFixedCollectionWithSharedThroughput = "enablefixedcollectionwithsharedthroughput";
    Features.ttl90Days = "ttl90days";
    Features.enableRightPanelV2 = "enablerightpanelv2";
    Features.enableSchema = "enableschema";
    Features.enableSDKoperations = "enablesdkoperations";
    Features.showMinRUSurvey = "showminrusurvey";
    return Features;
}());
exports.Features = Features;
// flight names returned from the portal are always lowercase
var Flights = /** @class */ (function () {
    function Flights() {
    }
    Flights.SettingsV2 = "settingsv2";
    Flights.MongoIndexEditor = "mongoindexeditor";
    return Flights;
}());
exports.Flights = Flights;
var AfecFeatures = /** @class */ (function () {
    function AfecFeatures() {
    }
    AfecFeatures.Spark = "spark-public-preview";
    AfecFeatures.Notebooks = "sparknotebooks-public-preview";
    AfecFeatures.StorageAnalytics = "storageanalytics-public-preview";
    return AfecFeatures;
}());
exports.AfecFeatures = AfecFeatures;
var Spark = /** @class */ (function () {
    function Spark() {
    }
    Spark.MaxWorkerCount = 10;
    Spark.SKUs = new HashMap_1.HashMap({
        "Cosmos.Spark.D1s": "D1s / 1 core / 4GB RAM",
        "Cosmos.Spark.D2s": "D2s / 2 cores / 8GB RAM",
        "Cosmos.Spark.D4s": "D4s / 4 cores / 16GB RAM",
        "Cosmos.Spark.D8s": "D8s / 8 cores / 32GB RAM",
        "Cosmos.Spark.D16s": "D16s / 16 cores / 64GB RAM",
        "Cosmos.Spark.D32s": "D32s / 32 cores / 128GB RAM",
        "Cosmos.Spark.D64s": "D64s / 64 cores / 256GB RAM"
    });
    return Spark;
}());
exports.Spark = Spark;
var TagNames = /** @class */ (function () {
    function TagNames() {
    }
    TagNames.defaultExperience = "defaultExperience";
    return TagNames;
}());
exports.TagNames = TagNames;
var MongoDBAccounts = /** @class */ (function () {
    function MongoDBAccounts() {
    }
    MongoDBAccounts.protocol = "https";
    MongoDBAccounts.defaultPort = "10255";
    return MongoDBAccounts;
}());
exports.MongoDBAccounts = MongoDBAccounts;
var MongoBackendEndpointType;
(function (MongoBackendEndpointType) {
    MongoBackendEndpointType[MongoBackendEndpointType["local"] = 0] = "local";
    MongoBackendEndpointType[MongoBackendEndpointType["remote"] = 1] = "remote";
})(MongoBackendEndpointType = exports.MongoBackendEndpointType || (exports.MongoBackendEndpointType = {}));
// TODO: 435619 Add default endpoints per cloud and use regional only when available
var CassandraBackend = /** @class */ (function () {
    function CassandraBackend() {
    }
    CassandraBackend.createOrDeleteApi = "api/cassandra/createordelete";
    CassandraBackend.guestCreateOrDeleteApi = "api/guest/cassandra/createordelete";
    CassandraBackend.queryApi = "api/cassandra";
    CassandraBackend.guestQueryApi = "api/guest/cassandra";
    CassandraBackend.keysApi = "api/cassandra/keys";
    CassandraBackend.guestKeysApi = "api/guest/cassandra/keys";
    CassandraBackend.schemaApi = "api/cassandra/schema";
    CassandraBackend.guestSchemaApi = "api/guest/cassandra/schema";
    return CassandraBackend;
}());
exports.CassandraBackend = CassandraBackend;
var Queries = /** @class */ (function () {
    function Queries() {
    }
    Queries.CustomPageOption = "custom";
    Queries.UnlimitedPageOption = "unlimited";
    Queries.itemsPerPage = 100;
    Queries.unlimitedItemsPerPage = 100; // TODO: Figure out appropriate value so it works for accounts with a large number of partitions
    Queries.QueryEditorMinHeightRatio = 0.1;
    Queries.QueryEditorMaxHeightRatio = 0.4;
    Queries.DefaultMaxDegreeOfParallelism = 6;
    return Queries;
}());
exports.Queries = Queries;
var SavedQueries = /** @class */ (function () {
    function SavedQueries() {
    }
    SavedQueries.CollectionName = "___Query";
    SavedQueries.DatabaseName = "___Cosmos";
    SavedQueries.OfferThroughput = 400;
    SavedQueries.PartitionKeyProperty = "id";
    return SavedQueries;
}());
exports.SavedQueries = SavedQueries;
var DocumentsGridMetrics = /** @class */ (function () {
    function DocumentsGridMetrics() {
    }
    DocumentsGridMetrics.DocumentsPerPage = 100;
    DocumentsGridMetrics.IndividualRowHeight = 34;
    DocumentsGridMetrics.BufferHeight = 28;
    DocumentsGridMetrics.SplitterMinWidth = 200;
    DocumentsGridMetrics.SplitterMaxWidth = 360;
    DocumentsGridMetrics.DocumentEditorMinWidthRatio = 0.2;
    DocumentsGridMetrics.DocumentEditorMaxWidthRatio = 0.4;
    return DocumentsGridMetrics;
}());
exports.DocumentsGridMetrics = DocumentsGridMetrics;
var ExplorerMetrics = /** @class */ (function () {
    function ExplorerMetrics() {
    }
    ExplorerMetrics.SplitterMinWidth = 240;
    ExplorerMetrics.SplitterMaxWidth = 400;
    ExplorerMetrics.CollapsedResourceTreeWidth = 36;
    return ExplorerMetrics;
}());
exports.ExplorerMetrics = ExplorerMetrics;
var SplitterMetrics = /** @class */ (function () {
    function SplitterMetrics() {
    }
    SplitterMetrics.CollapsedPositionLeft = ExplorerMetrics.CollapsedResourceTreeWidth;
    return SplitterMetrics;
}());
exports.SplitterMetrics = SplitterMetrics;
var Areas = /** @class */ (function () {
    function Areas() {
    }
    Areas.ResourceTree = "Resource Tree";
    Areas.ContextualPane = "Contextual Pane";
    Areas.Tab = "Tab";
    Areas.ShareDialog = "Share Access Dialog";
    Areas.Notebook = "Notebook";
    return Areas;
}());
exports.Areas = Areas;
var HttpHeaders = /** @class */ (function () {
    function HttpHeaders() {
    }
    HttpHeaders.activityId = "x-ms-activity-id";
    HttpHeaders.apiType = "x-ms-cosmos-apitype";
    HttpHeaders.authorization = "authorization";
    HttpHeaders.collectionIndexTransformationProgress = "x-ms-documentdb-collection-index-transformation-progress";
    HttpHeaders.continuation = "x-ms-continuation";
    HttpHeaders.correlationRequestId = "x-ms-correlation-request-id";
    HttpHeaders.enableScriptLogging = "x-ms-documentdb-script-enable-logging";
    HttpHeaders.guestAccessToken = "x-ms-encrypted-auth-token";
    HttpHeaders.getReadOnlyKey = "x-ms-get-read-only-key";
    HttpHeaders.connectionString = "x-ms-connection-string";
    HttpHeaders.msDate = "x-ms-date";
    HttpHeaders.location = "Location";
    HttpHeaders.contentType = "Content-Type";
    HttpHeaders.offerReplacePending = "x-ms-offer-replace-pending";
    HttpHeaders.user = "x-ms-user";
    HttpHeaders.populatePartitionStatistics = "x-ms-documentdb-populatepartitionstatistics";
    HttpHeaders.queryMetrics = "x-ms-documentdb-query-metrics";
    HttpHeaders.requestCharge = "x-ms-request-charge";
    HttpHeaders.resourceQuota = "x-ms-resource-quota";
    HttpHeaders.resourceUsage = "x-ms-resource-usage";
    HttpHeaders.retryAfterMs = "x-ms-retry-after-ms";
    HttpHeaders.scriptLogResults = "x-ms-documentdb-script-log-results";
    HttpHeaders.populateCollectionThroughputInfo = "x-ms-documentdb-populatecollectionthroughputinfo";
    HttpHeaders.supportSpatialLegacyCoordinates = "x-ms-documentdb-supportspatiallegacycoordinates";
    HttpHeaders.usePolygonsSmallerThanAHemisphere = "x-ms-documentdb-usepolygonssmallerthanahemisphere";
    HttpHeaders.autoPilotThroughput = "autoscaleSettings";
    HttpHeaders.autoPilotThroughputSDK = "x-ms-cosmos-offer-autopilot-settings";
    HttpHeaders.partitionKey = "x-ms-documentdb-partitionkey";
    HttpHeaders.migrateOfferToManualThroughput = "x-ms-cosmos-migrate-offer-to-manual-throughput";
    HttpHeaders.migrateOfferToAutopilot = "x-ms-cosmos-migrate-offer-to-autopilot";
    return HttpHeaders;
}());
exports.HttpHeaders = HttpHeaders;
var ApiType = /** @class */ (function () {
    function ApiType() {
    }
    // Mapped to hexadecimal values in the backend
    ApiType.MongoDB = 1;
    ApiType.Gremlin = 2;
    ApiType.Cassandra = 4;
    ApiType.Table = 8;
    ApiType.SQL = 16;
    return ApiType;
}());
exports.ApiType = ApiType;
var HttpStatusCodes = /** @class */ (function () {
    function HttpStatusCodes() {
    }
    HttpStatusCodes.OK = 200;
    HttpStatusCodes.Created = 201;
    HttpStatusCodes.Accepted = 202;
    HttpStatusCodes.NoContent = 204;
    HttpStatusCodes.NotModified = 304;
    HttpStatusCodes.Unauthorized = 401;
    HttpStatusCodes.Forbidden = 403;
    HttpStatusCodes.NotFound = 404;
    HttpStatusCodes.TooManyRequests = 429;
    HttpStatusCodes.Conflict = 409;
    HttpStatusCodes.InternalServerError = 500;
    HttpStatusCodes.BadGateway = 502;
    HttpStatusCodes.ServiceUnavailable = 503;
    HttpStatusCodes.GatewayTimeout = 504;
    HttpStatusCodes.RetryableStatusCodes = [
        HttpStatusCodes.TooManyRequests,
        HttpStatusCodes.InternalServerError,
        HttpStatusCodes.BadGateway,
        HttpStatusCodes.ServiceUnavailable,
        HttpStatusCodes.GatewayTimeout
    ];
    return HttpStatusCodes;
}());
exports.HttpStatusCodes = HttpStatusCodes;
var Urls = /** @class */ (function () {
    function Urls() {
    }
    Urls.feedbackEmail = "https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20Data%20Explorer%20Feedback";
    Urls.autoscaleMigration = "https://aka.ms/cosmos-autoscale-migration";
    Urls.freeTierInformation = "https://aka.ms/cosmos-free-tier";
    Urls.cosmosPricing = "https://aka.ms/azure-cosmos-db-pricing";
    return Urls;
}());
exports.Urls = Urls;
var HashRoutePrefixes = /** @class */ (function () {
    function HashRoutePrefixes() {
    }
    HashRoutePrefixes.databasesWithId = function (databaseId) {
        return this.databases.replace("{db_id}", databaseId).replace("/", ""); // strip the first slash since hasher adds it
    };
    HashRoutePrefixes.collectionsWithIds = function (databaseId, collectionId) {
        var transformedDatabasePrefix = this.collections.replace("{db_id}", databaseId);
        return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("/", ""); // strip the first slash since hasher adds it
    };
    HashRoutePrefixes.sprocWithIds = function (databaseId, collectionId, sprocId, stripFirstSlash) {
        if (stripFirstSlash === void 0) { stripFirstSlash = true; }
        var transformedDatabasePrefix = this.sprocs.replace("{db_id}", databaseId);
        var transformedSprocRoute = transformedDatabasePrefix
            .replace("{coll_id}", collectionId)
            .replace("{sproc_id}", sprocId);
        if (!!stripFirstSlash) {
            return transformedSprocRoute.replace("/", ""); // strip the first slash since hasher adds it
        }
        return transformedSprocRoute;
    };
    HashRoutePrefixes.conflictsWithIds = function (databaseId, collectionId) {
        var transformedDatabasePrefix = this.conflicts.replace("{db_id}", databaseId);
        return transformedDatabasePrefix.replace("{coll_id}", collectionId).replace("/", ""); // strip the first slash since hasher adds it;
    };
    HashRoutePrefixes.docsWithIds = function (databaseId, collectionId, docId) {
        var transformedDatabasePrefix = this.docs.replace("{db_id}", databaseId);
        return transformedDatabasePrefix
            .replace("{coll_id}", collectionId)
            .replace("{doc_id}", docId)
            .replace("/", ""); // strip the first slash since hasher adds it
    };
    HashRoutePrefixes.databases = "/dbs/{db_id}";
    HashRoutePrefixes.collections = "/dbs/{db_id}/colls/{coll_id}";
    HashRoutePrefixes.sprocHash = "/sprocs/";
    HashRoutePrefixes.sprocs = HashRoutePrefixes.collections + HashRoutePrefixes.sprocHash + "{sproc_id}";
    HashRoutePrefixes.docs = HashRoutePrefixes.collections + "/docs/{doc_id}/";
    HashRoutePrefixes.conflicts = HashRoutePrefixes.collections + "/conflicts";
    return HashRoutePrefixes;
}());
exports.HashRoutePrefixes = HashRoutePrefixes;
var ConfigurationOverridesValues = /** @class */ (function () {
    function ConfigurationOverridesValues() {
    }
    ConfigurationOverridesValues.IsBsonSchemaV2 = "true";
    return ConfigurationOverridesValues;
}());
exports.ConfigurationOverridesValues = ConfigurationOverridesValues;
var KeyCodes = /** @class */ (function () {
    function KeyCodes() {
    }
    KeyCodes.Space = 32;
    KeyCodes.Enter = 13;
    KeyCodes.Escape = 27;
    KeyCodes.UpArrow = 38;
    KeyCodes.DownArrow = 40;
    KeyCodes.LeftArrow = 37;
    KeyCodes.RightArrow = 39;
    KeyCodes.Tab = 9;
    return KeyCodes;
}());
exports.KeyCodes = KeyCodes;
// Normalized per: https://www.w3.org/TR/uievents-key/#named-key-attribute-values
var NormalizedEventKey = /** @class */ (function () {
    function NormalizedEventKey() {
    }
    NormalizedEventKey.Space = " ";
    NormalizedEventKey.Enter = "Enter";
    NormalizedEventKey.Escape = "Escape";
    NormalizedEventKey.UpArrow = "ArrowUp";
    NormalizedEventKey.DownArrow = "ArrowDown";
    NormalizedEventKey.LeftArrow = "ArrowLeft";
    NormalizedEventKey.RightArrow = "ArrowRight";
    return NormalizedEventKey;
}());
exports.NormalizedEventKey = NormalizedEventKey;
var TryCosmosExperience = /** @class */ (function () {
    function TryCosmosExperience() {
    }
    TryCosmosExperience.extendUrl = "https://trycosmosdb.azure.com/api/resource/extendportal?userId={0}";
    TryCosmosExperience.deleteUrl = "https://trycosmosdb.azure.com/api/resource/deleteportal?userId={0}";
    TryCosmosExperience.collectionsPerAccount = 3;
    TryCosmosExperience.maxRU = 5000;
    TryCosmosExperience.defaultRU = 3000;
    return TryCosmosExperience;
}());
exports.TryCosmosExperience = TryCosmosExperience;
var OfferVersions = /** @class */ (function () {
    function OfferVersions() {
    }
    OfferVersions.V1 = "V1";
    OfferVersions.V2 = "V2";
    return OfferVersions;
}());
exports.OfferVersions = OfferVersions;
var ConflictOperationType;
(function (ConflictOperationType) {
    ConflictOperationType["Replace"] = "replace";
    ConflictOperationType["Create"] = "create";
    ConflictOperationType["Delete"] = "delete";
})(ConflictOperationType = exports.ConflictOperationType || (exports.ConflictOperationType = {}));
exports.EmulatorMasterKey = 
//[SuppressMessage("Microsoft.Security", "CS002:SecretInNextLine", Justification="Well known public masterKey for emulator")]
"C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
// A variable @MyVariable defined in Constants.less is accessible as StyleConstants.MyVariable
exports.StyleConstants = require("less-vars-loader!../../less/Common/Constants.less");
var Notebook = /** @class */ (function () {
    function Notebook() {
    }
    Notebook.defaultBasePath = "./notebooks";
    Notebook.heartbeatDelayMs = 5000;
    Notebook.kernelRestartInitialDelayMs = 1000;
    Notebook.kernelRestartMaxDelayMs = 20000;
    Notebook.autoSaveIntervalMs = 120000;
    return Notebook;
}());
exports.Notebook = Notebook;
var SparkLibrary = /** @class */ (function () {
    function SparkLibrary() {
    }
    SparkLibrary.nameMinLength = 3;
    SparkLibrary.nameMaxLength = 63;
    return SparkLibrary;
}());
exports.SparkLibrary = SparkLibrary;
var AnalyticalStorageTtl = /** @class */ (function () {
    function AnalyticalStorageTtl() {
    }
    AnalyticalStorageTtl.Days90 = 7776000;
    AnalyticalStorageTtl.Infinite = -1;
    AnalyticalStorageTtl.Disabled = 0;
    return AnalyticalStorageTtl;
}());
exports.AnalyticalStorageTtl = AnalyticalStorageTtl;
var TerminalQueryParams = /** @class */ (function () {
    function TerminalQueryParams() {
    }
    TerminalQueryParams.Terminal = "terminal";
    TerminalQueryParams.Server = "server";
    TerminalQueryParams.Token = "token";
    TerminalQueryParams.SubscriptionId = "subscriptionId";
    TerminalQueryParams.TerminalEndpoint = "terminalEndpoint";
    return TerminalQueryParams;
}());
exports.TerminalQueryParams = TerminalQueryParams;
