'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crypto = require('crypto');
var logger$5 = require('@azure/logger');
var uuid$3 = require('uuid');
var tslib = require('tslib');
var semaphore = require('semaphore');
var stableStringify = require('fast-json-stable-stringify');
var PriorityQueue = require('priorityqueuejs');
var coreRestPipeline = require('@azure/core-rest-pipeline');
var nodeAbortController = require('node-abort-controller');
var universalUserAgent = require('universal-user-agent');
var JSBI = require('jsbi');
var abortController = require('@azure/abort-controller');

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const DEFAULT_PARTITION_KEY_PATH = "/_partitionKey"; // eslint-disable-line @typescript-eslint/prefer-as-const

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
const Constants$1 = {
    HttpHeaders: {
        Authorization: "authorization",
        ETag: "etag",
        MethodOverride: "X-HTTP-Method",
        Slug: "Slug",
        ContentType: "Content-Type",
        LastModified: "Last-Modified",
        ContentEncoding: "Content-Encoding",
        CharacterSet: "CharacterSet",
        UserAgent: "User-Agent",
        IfModifiedSince: "If-Modified-Since",
        IfMatch: "If-Match",
        IfNoneMatch: "If-None-Match",
        ContentLength: "Content-Length",
        AcceptEncoding: "Accept-Encoding",
        KeepAlive: "Keep-Alive",
        CacheControl: "Cache-Control",
        TransferEncoding: "Transfer-Encoding",
        ContentLanguage: "Content-Language",
        ContentLocation: "Content-Location",
        ContentMd5: "Content-Md5",
        ContentRange: "Content-Range",
        Accept: "Accept",
        AcceptCharset: "Accept-Charset",
        AcceptLanguage: "Accept-Language",
        IfRange: "If-Range",
        IfUnmodifiedSince: "If-Unmodified-Since",
        MaxForwards: "Max-Forwards",
        ProxyAuthorization: "Proxy-Authorization",
        AcceptRanges: "Accept-Ranges",
        ProxyAuthenticate: "Proxy-Authenticate",
        RetryAfter: "Retry-After",
        SetCookie: "Set-Cookie",
        WwwAuthenticate: "Www-Authenticate",
        Origin: "Origin",
        Host: "Host",
        AccessControlAllowOrigin: "Access-Control-Allow-Origin",
        AccessControlAllowHeaders: "Access-Control-Allow-Headers",
        KeyValueEncodingFormat: "application/x-www-form-urlencoded",
        WrapAssertionFormat: "wrap_assertion_format",
        WrapAssertion: "wrap_assertion",
        WrapScope: "wrap_scope",
        SimpleToken: "SWT",
        HttpDate: "date",
        Prefer: "Prefer",
        Location: "Location",
        Referer: "referer",
        A_IM: "A-IM",
        // Query
        Query: "x-ms-documentdb-query",
        IsQuery: "x-ms-documentdb-isquery",
        IsQueryPlan: "x-ms-cosmos-is-query-plan-request",
        SupportedQueryFeatures: "x-ms-cosmos-supported-query-features",
        QueryVersion: "x-ms-cosmos-query-version",
        // Our custom Azure Cosmos DB headers
        Continuation: "x-ms-continuation",
        ContinuationToken: "x-ms-continuation-token",
        PageSize: "x-ms-max-item-count",
        ItemCount: "x-ms-item-count",
        // Request sender generated. Simply echoed by backend.
        ActivityId: "x-ms-activity-id",
        PreTriggerInclude: "x-ms-documentdb-pre-trigger-include",
        PreTriggerExclude: "x-ms-documentdb-pre-trigger-exclude",
        PostTriggerInclude: "x-ms-documentdb-post-trigger-include",
        PostTriggerExclude: "x-ms-documentdb-post-trigger-exclude",
        IndexingDirective: "x-ms-indexing-directive",
        SessionToken: "x-ms-session-token",
        ConsistencyLevel: "x-ms-consistency-level",
        XDate: "x-ms-date",
        CollectionPartitionInfo: "x-ms-collection-partition-info",
        CollectionServiceInfo: "x-ms-collection-service-info",
        // Deprecated, use RetryAfterInMs instead.
        RetryAfterInMilliseconds: "x-ms-retry-after-ms",
        RetryAfterInMs: "x-ms-retry-after-ms",
        IsFeedUnfiltered: "x-ms-is-feed-unfiltered",
        ResourceTokenExpiry: "x-ms-documentdb-expiry-seconds",
        EnableScanInQuery: "x-ms-documentdb-query-enable-scan",
        EmitVerboseTracesInQuery: "x-ms-documentdb-query-emit-traces",
        EnableCrossPartitionQuery: "x-ms-documentdb-query-enablecrosspartition",
        ParallelizeCrossPartitionQuery: "x-ms-documentdb-query-parallelizecrosspartitionquery",
        ResponseContinuationTokenLimitInKB: "x-ms-documentdb-responsecontinuationtokenlimitinkb",
        // QueryMetrics
        // Request header to tell backend to give you query metrics.
        PopulateQueryMetrics: "x-ms-documentdb-populatequerymetrics",
        // Response header that holds the serialized version of query metrics.
        QueryMetrics: "x-ms-documentdb-query-metrics",
        // IndexMetrics
        // Request header to tell backend to give you index metrics.
        PopulateIndexMetrics: "x-ms-cosmos-populateindexmetrics",
        // Response header that holds the serialized version of index metrics.
        IndexUtilization: "x-ms-cosmos-index-utilization",
        // Version headers and values
        Version: "x-ms-version",
        // Owner name
        OwnerFullName: "x-ms-alt-content-path",
        // Owner ID used for name based request in session token.
        OwnerId: "x-ms-content-path",
        // Partition Key
        PartitionKey: "x-ms-documentdb-partitionkey",
        PartitionKeyRangeID: "x-ms-documentdb-partitionkeyrangeid",
        // Epk Range headers
        StartEpk: "x-ms-start-epk",
        EndEpk: "x-ms-end-epk",
        // Read Feed Type
        ReadFeedKeyType: "x-ms-read-key-type",
        // Quota Info
        MaxEntityCount: "x-ms-root-entity-max-count",
        CurrentEntityCount: "x-ms-root-entity-current-count",
        CollectionQuotaInMb: "x-ms-collection-quota-mb",
        CollectionCurrentUsageInMb: "x-ms-collection-usage-mb",
        MaxMediaStorageUsageInMB: "x-ms-max-media-storage-usage-mb",
        CurrentMediaStorageUsageInMB: "x-ms-media-storage-usage-mb",
        RequestCharge: "x-ms-request-charge",
        PopulateQuotaInfo: "x-ms-documentdb-populatequotainfo",
        MaxResourceQuota: "x-ms-resource-quota",
        // Offer header
        OfferType: "x-ms-offer-type",
        OfferThroughput: "x-ms-offer-throughput",
        AutoscaleSettings: "x-ms-cosmos-offer-autopilot-settings",
        // Custom RUs/minute headers
        DisableRUPerMinuteUsage: "x-ms-documentdb-disable-ru-per-minute-usage",
        IsRUPerMinuteUsed: "x-ms-documentdb-is-ru-per-minute-used",
        OfferIsRUPerMinuteThroughputEnabled: "x-ms-offer-is-ru-per-minute-throughput-enabled",
        // Index progress headers
        IndexTransformationProgress: "x-ms-documentdb-collection-index-transformation-progress",
        LazyIndexingProgress: "x-ms-documentdb-collection-lazy-indexing-progress",
        // Upsert header
        IsUpsert: "x-ms-documentdb-is-upsert",
        // Sub status of the error
        SubStatus: "x-ms-substatus",
        // StoredProcedure related headers
        EnableScriptLogging: "x-ms-documentdb-script-enable-logging",
        ScriptLogResults: "x-ms-documentdb-script-log-results",
        // Multi-Region Write
        ALLOW_MULTIPLE_WRITES: "x-ms-cosmos-allow-tentative-writes",
        // Bulk/Batch header
        IsBatchRequest: "x-ms-cosmos-is-batch-request",
        IsBatchAtomic: "x-ms-cosmos-batch-atomic",
        BatchContinueOnError: "x-ms-cosmos-batch-continue-on-error",
        // Dedicated Gateway Headers
        DedicatedGatewayPerRequestCacheStaleness: "x-ms-dedicatedgateway-max-age",
        // Cache Refresh header
        ForceRefresh: "x-ms-force-refresh",
        // Priority Based throttling header
        PriorityLevel: "x-ms-cosmos-priority-level",
    },
    // GlobalDB related constants
    WritableLocations: "writableLocations",
    ReadableLocations: "readableLocations",
    LocationUnavailableExpirationTimeInMs: 5 * 60 * 1000,
    // ServiceDocument Resource
    ENABLE_MULTIPLE_WRITABLE_LOCATIONS: "enableMultipleWriteLocations",
    // Background refresh time
    DefaultUnavailableLocationExpirationTimeMS: 5 * 60 * 1000,
    // Client generated retry count response header
    ThrottleRetryCount: "x-ms-throttle-retry-count",
    ThrottleRetryWaitTimeInMs: "x-ms-throttle-retry-wait-time-ms",
    // Platform
    CurrentVersion: "2020-07-15",
    AzureNamespace: "Azure.Cosmos",
    AzurePackageName: "@azure/cosmos",
    SDKName: "azure-cosmos-js",
    SDKVersion: "4.0.1-beta.3",
    // Diagnostics
    CosmosDbDiagnosticLevelEnvVarName: "AZURE_COSMOSDB_DIAGNOSTICS_LEVEL",
    // Bulk Operations
    DefaultMaxBulkRequestBodySizeInBytes: 220201,
    Quota: {
        CollectionSize: "collectionSize",
    },
    Path: {
        Root: "/",
        DatabasesPathSegment: "dbs",
        CollectionsPathSegment: "colls",
        UsersPathSegment: "users",
        DocumentsPathSegment: "docs",
        PermissionsPathSegment: "permissions",
        StoredProceduresPathSegment: "sprocs",
        TriggersPathSegment: "triggers",
        UserDefinedFunctionsPathSegment: "udfs",
        ConflictsPathSegment: "conflicts",
        AttachmentsPathSegment: "attachments",
        PartitionKeyRangesPathSegment: "pkranges",
        SchemasPathSegment: "schemas",
        OffersPathSegment: "offers",
        TopologyPathSegment: "topology",
        DatabaseAccountPathSegment: "databaseaccount",
    },
    PartitionKeyRange: {
        // Partition Key Range Constants
        MinInclusive: "minInclusive",
        MaxExclusive: "maxExclusive",
        Id: "id",
    },
    QueryRangeConstants: {
        // Partition Key Range Constants
        MinInclusive: "minInclusive",
        MaxExclusive: "maxExclusive",
        min: "min",
    },
    /**
     * @deprecated Use EffectivePartitionKeyConstants instead
     */
    EffectiveParitionKeyConstants: {
        MinimumInclusiveEffectivePartitionKey: "",
        MaximumExclusiveEffectivePartitionKey: "FF",
    },
    EffectivePartitionKeyConstants: {
        MinimumInclusiveEffectivePartitionKey: "",
        MaximumExclusiveEffectivePartitionKey: "FF",
    },
    // NonStreaming queries
    NonStreamingQueryDefaultRUThreshold: 5000,
};
/**
 * @hidden
 */
exports.ResourceType = void 0;
(function (ResourceType) {
    ResourceType["none"] = "";
    ResourceType["database"] = "dbs";
    ResourceType["offer"] = "offers";
    ResourceType["user"] = "users";
    ResourceType["permission"] = "permissions";
    ResourceType["container"] = "colls";
    ResourceType["conflicts"] = "conflicts";
    ResourceType["sproc"] = "sprocs";
    ResourceType["udf"] = "udfs";
    ResourceType["trigger"] = "triggers";
    ResourceType["item"] = "docs";
    ResourceType["pkranges"] = "pkranges";
    ResourceType["partitionkey"] = "partitionKey";
})(exports.ResourceType || (exports.ResourceType = {}));
/**
 * @hidden
 */
exports.HTTPMethod = void 0;
(function (HTTPMethod) {
    HTTPMethod["get"] = "GET";
    HTTPMethod["patch"] = "PATCH";
    HTTPMethod["post"] = "POST";
    HTTPMethod["put"] = "PUT";
    HTTPMethod["delete"] = "DELETE";
})(exports.HTTPMethod || (exports.HTTPMethod = {}));
/**
 * @hidden
 */
exports.OperationType = void 0;
(function (OperationType) {
    OperationType["Create"] = "create";
    OperationType["Replace"] = "replace";
    OperationType["Upsert"] = "upsert";
    OperationType["Delete"] = "delete";
    OperationType["Read"] = "read";
    OperationType["Query"] = "query";
    OperationType["Execute"] = "execute";
    OperationType["Batch"] = "batch";
    OperationType["Patch"] = "patch";
})(exports.OperationType || (exports.OperationType = {}));
/**
 * @hidden
 */
var CosmosKeyType;
(function (CosmosKeyType) {
    CosmosKeyType["PrimaryMaster"] = "PRIMARY_MASTER";
    CosmosKeyType["SecondaryMaster"] = "SECONDARY_MASTER";
    CosmosKeyType["PrimaryReadOnly"] = "PRIMARY_READONLY";
    CosmosKeyType["SecondaryReadOnly"] = "SECONDARY_READONLY";
})(CosmosKeyType || (CosmosKeyType = {}));
/**
 * @hidden
 */
var CosmosContainerChildResourceKind;
(function (CosmosContainerChildResourceKind) {
    CosmosContainerChildResourceKind["Item"] = "ITEM";
    CosmosContainerChildResourceKind["StoredProcedure"] = "STORED_PROCEDURE";
    CosmosContainerChildResourceKind["UserDefinedFunction"] = "USER_DEFINED_FUNCTION";
    CosmosContainerChildResourceKind["Trigger"] = "TRIGGER";
})(CosmosContainerChildResourceKind || (CosmosContainerChildResourceKind = {}));
/**
 * @hidden
 */
var PermissionScopeValues;
(function (PermissionScopeValues) {
    /**
     * Values which set permission Scope applicable to control plane related operations.
     */
    PermissionScopeValues[PermissionScopeValues["ScopeAccountReadValue"] = 1] = "ScopeAccountReadValue";
    PermissionScopeValues[PermissionScopeValues["ScopeAccountListDatabasesValue"] = 2] = "ScopeAccountListDatabasesValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseReadValue"] = 4] = "ScopeDatabaseReadValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseReadOfferValue"] = 8] = "ScopeDatabaseReadOfferValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseListContainerValue"] = 16] = "ScopeDatabaseListContainerValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadValue"] = 32] = "ScopeContainerReadValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadOfferValue"] = 64] = "ScopeContainerReadOfferValue";
    PermissionScopeValues[PermissionScopeValues["ScopeAccountCreateDatabasesValue"] = 1] = "ScopeAccountCreateDatabasesValue";
    PermissionScopeValues[PermissionScopeValues["ScopeAccountDeleteDatabasesValue"] = 2] = "ScopeAccountDeleteDatabasesValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseDeleteValue"] = 4] = "ScopeDatabaseDeleteValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseReplaceOfferValue"] = 8] = "ScopeDatabaseReplaceOfferValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseCreateContainerValue"] = 16] = "ScopeDatabaseCreateContainerValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseDeleteContainerValue"] = 32] = "ScopeDatabaseDeleteContainerValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReplaceValue"] = 64] = "ScopeContainerReplaceValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerDeleteValue"] = 128] = "ScopeContainerDeleteValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReplaceOfferValue"] = 256] = "ScopeContainerReplaceOfferValue";
    PermissionScopeValues[PermissionScopeValues["ScopeAccountReadAllAccessValue"] = 65535] = "ScopeAccountReadAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseReadAllAccessValue"] = 124] = "ScopeDatabaseReadAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainersReadAllAccessValue"] = 96] = "ScopeContainersReadAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeAccountWriteAllAccessValue"] = 65535] = "ScopeAccountWriteAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeDatabaseWriteAllAccessValue"] = 508] = "ScopeDatabaseWriteAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainersWriteAllAccessValue"] = 448] = "ScopeContainersWriteAllAccessValue";
    /**
     * Values which set permission Scope applicable to data plane related operations.
     */
    PermissionScopeValues[PermissionScopeValues["ScopeContainerExecuteQueriesValue"] = 1] = "ScopeContainerExecuteQueriesValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadFeedsValue"] = 2] = "ScopeContainerReadFeedsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadStoredProceduresValue"] = 4] = "ScopeContainerReadStoredProceduresValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadUserDefinedFunctionsValue"] = 8] = "ScopeContainerReadUserDefinedFunctionsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadTriggersValue"] = 16] = "ScopeContainerReadTriggersValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadConflictsValue"] = 32] = "ScopeContainerReadConflictsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeItemReadValue"] = 64] = "ScopeItemReadValue";
    PermissionScopeValues[PermissionScopeValues["ScopeStoredProcedureReadValue"] = 128] = "ScopeStoredProcedureReadValue";
    PermissionScopeValues[PermissionScopeValues["ScopeUserDefinedFunctionReadValue"] = 256] = "ScopeUserDefinedFunctionReadValue";
    PermissionScopeValues[PermissionScopeValues["ScopeTriggerReadValue"] = 512] = "ScopeTriggerReadValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerCreateItemsValue"] = 1] = "ScopeContainerCreateItemsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReplaceItemsValue"] = 2] = "ScopeContainerReplaceItemsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerUpsertItemsValue"] = 4] = "ScopeContainerUpsertItemsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerDeleteItemsValue"] = 8] = "ScopeContainerDeleteItemsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerCreateStoredProceduresValue"] = 16] = "ScopeContainerCreateStoredProceduresValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReplaceStoredProceduresValue"] = 32] = "ScopeContainerReplaceStoredProceduresValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerDeleteStoredProceduresValue"] = 64] = "ScopeContainerDeleteStoredProceduresValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerExecuteStoredProceduresValue"] = 128] = "ScopeContainerExecuteStoredProceduresValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerCreateTriggersValue"] = 256] = "ScopeContainerCreateTriggersValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReplaceTriggersValue"] = 512] = "ScopeContainerReplaceTriggersValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerDeleteTriggersValue"] = 1024] = "ScopeContainerDeleteTriggersValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerCreateUserDefinedFunctionsValue"] = 2048] = "ScopeContainerCreateUserDefinedFunctionsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReplaceUserDefinedFunctionsValue"] = 4096] = "ScopeContainerReplaceUserDefinedFunctionsValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerDeleteUserDefinedFunctionSValue"] = 8192] = "ScopeContainerDeleteUserDefinedFunctionSValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerDeleteCONFLICTSValue"] = 16384] = "ScopeContainerDeleteCONFLICTSValue";
    PermissionScopeValues[PermissionScopeValues["ScopeItemReplaceValue"] = 65536] = "ScopeItemReplaceValue";
    PermissionScopeValues[PermissionScopeValues["ScopeItemUpsertValue"] = 131072] = "ScopeItemUpsertValue";
    PermissionScopeValues[PermissionScopeValues["ScopeItemDeleteValue"] = 262144] = "ScopeItemDeleteValue";
    PermissionScopeValues[PermissionScopeValues["ScopeStoredProcedureReplaceValue"] = 1048576] = "ScopeStoredProcedureReplaceValue";
    PermissionScopeValues[PermissionScopeValues["ScopeStoredProcedureDeleteValue"] = 2097152] = "ScopeStoredProcedureDeleteValue";
    PermissionScopeValues[PermissionScopeValues["ScopeStoredProcedureExecuteValue"] = 4194304] = "ScopeStoredProcedureExecuteValue";
    PermissionScopeValues[PermissionScopeValues["ScopeUserDefinedFunctionReplaceValue"] = 8388608] = "ScopeUserDefinedFunctionReplaceValue";
    PermissionScopeValues[PermissionScopeValues["ScopeUserDefinedFunctionDeleteValue"] = 16777216] = "ScopeUserDefinedFunctionDeleteValue";
    PermissionScopeValues[PermissionScopeValues["ScopeTriggerReplaceValue"] = 33554432] = "ScopeTriggerReplaceValue";
    PermissionScopeValues[PermissionScopeValues["ScopeTriggerDeleteValue"] = 67108864] = "ScopeTriggerDeleteValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerReadAllAccessValue"] = 4294967295] = "ScopeContainerReadAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeItemReadAllAccessValue"] = 65] = "ScopeItemReadAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeContainerWriteAllAccessValue"] = 4294967295] = "ScopeContainerWriteAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["ScopeItemWriteAllAccessValue"] = 458767] = "ScopeItemWriteAllAccessValue";
    PermissionScopeValues[PermissionScopeValues["NoneValue"] = 0] = "NoneValue";
})(PermissionScopeValues || (PermissionScopeValues = {}));
/**
 * @hidden
 */
exports.SasTokenPermissionKind = void 0;
(function (SasTokenPermissionKind) {
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerCreateItems"] = 1] = "ContainerCreateItems";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReplaceItems"] = 2] = "ContainerReplaceItems";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerUpsertItems"] = 4] = "ContainerUpsertItems";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerDeleteItems"] = 128] = "ContainerDeleteItems";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerExecuteQueries"] = 1] = "ContainerExecuteQueries";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReadFeeds"] = 2] = "ContainerReadFeeds";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerCreateStoreProcedure"] = 16] = "ContainerCreateStoreProcedure";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReadStoreProcedure"] = 4] = "ContainerReadStoreProcedure";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReplaceStoreProcedure"] = 32] = "ContainerReplaceStoreProcedure";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerDeleteStoreProcedure"] = 64] = "ContainerDeleteStoreProcedure";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerCreateTriggers"] = 256] = "ContainerCreateTriggers";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReadTriggers"] = 16] = "ContainerReadTriggers";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReplaceTriggers"] = 512] = "ContainerReplaceTriggers";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerDeleteTriggers"] = 1024] = "ContainerDeleteTriggers";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerCreateUserDefinedFunctions"] = 2048] = "ContainerCreateUserDefinedFunctions";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReadUserDefinedFunctions"] = 8] = "ContainerReadUserDefinedFunctions";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReplaceUserDefinedFunctions"] = 4096] = "ContainerReplaceUserDefinedFunctions";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerDeleteUserDefinedFunctions"] = 8192] = "ContainerDeleteUserDefinedFunctions";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerExecuteStoredProcedure"] = 128] = "ContainerExecuteStoredProcedure";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReadConflicts"] = 32] = "ContainerReadConflicts";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerDeleteConflicts"] = 16384] = "ContainerDeleteConflicts";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerReadAny"] = 64] = "ContainerReadAny";
    SasTokenPermissionKind[SasTokenPermissionKind["ContainerFullAccess"] = 4294967295] = "ContainerFullAccess";
    SasTokenPermissionKind[SasTokenPermissionKind["ItemReadAny"] = 65536] = "ItemReadAny";
    SasTokenPermissionKind[SasTokenPermissionKind["ItemFullAccess"] = 65] = "ItemFullAccess";
    SasTokenPermissionKind[SasTokenPermissionKind["ItemRead"] = 64] = "ItemRead";
    SasTokenPermissionKind[SasTokenPermissionKind["ItemReplace"] = 65536] = "ItemReplace";
    SasTokenPermissionKind[SasTokenPermissionKind["ItemUpsert"] = 131072] = "ItemUpsert";
    SasTokenPermissionKind[SasTokenPermissionKind["ItemDelete"] = 262144] = "ItemDelete";
    SasTokenPermissionKind[SasTokenPermissionKind["StoreProcedureRead"] = 128] = "StoreProcedureRead";
    SasTokenPermissionKind[SasTokenPermissionKind["StoreProcedureReplace"] = 1048576] = "StoreProcedureReplace";
    SasTokenPermissionKind[SasTokenPermissionKind["StoreProcedureDelete"] = 2097152] = "StoreProcedureDelete";
    SasTokenPermissionKind[SasTokenPermissionKind["StoreProcedureExecute"] = 4194304] = "StoreProcedureExecute";
    SasTokenPermissionKind[SasTokenPermissionKind["UserDefinedFuntionRead"] = 256] = "UserDefinedFuntionRead";
    SasTokenPermissionKind[SasTokenPermissionKind["UserDefinedFuntionReplace"] = 8388608] = "UserDefinedFuntionReplace";
    SasTokenPermissionKind[SasTokenPermissionKind["UserDefinedFuntionDelete"] = 16777216] = "UserDefinedFuntionDelete";
    SasTokenPermissionKind[SasTokenPermissionKind["TriggerRead"] = 512] = "TriggerRead";
    SasTokenPermissionKind[SasTokenPermissionKind["TriggerReplace"] = 33554432] = "TriggerReplace";
    SasTokenPermissionKind[SasTokenPermissionKind["TriggerDelete"] = 67108864] = "TriggerDelete";
})(exports.SasTokenPermissionKind || (exports.SasTokenPermissionKind = {}));
var QueryFeature;
(function (QueryFeature) {
    QueryFeature["NonValueAggregate"] = "NonValueAggregate";
    QueryFeature["Aggregate"] = "Aggregate";
    QueryFeature["Distinct"] = "Distinct";
    QueryFeature["MultipleOrderBy"] = "MultipleOrderBy";
    QueryFeature["OffsetAndLimit"] = "OffsetAndLimit";
    QueryFeature["OrderBy"] = "OrderBy";
    QueryFeature["Top"] = "Top";
    QueryFeature["CompositeAggregate"] = "CompositeAggregate";
    QueryFeature["GroupBy"] = "GroupBy";
    QueryFeature["MultipleAggregates"] = "MultipleAggregates";
    QueryFeature["NonStreamingOrderBy"] = "NonStreamingOrderBy";
})(QueryFeature || (QueryFeature = {}));

const trimLeftSlashes = new RegExp("^[/]+");
const trimRightSlashes = new RegExp("[/]+$");
const illegalResourceIdCharacters = new RegExp("[/\\\\?#]");
const illegalItemResourceIdCharacters = new RegExp("[/\\\\#]");
/** @hidden */
function jsonStringifyAndEscapeNonASCII(arg) {
    // TODO: better way for this? Not sure.
    // escapes non-ASCII characters as \uXXXX
    return JSON.stringify(arg).replace(/[\u007F-\uFFFF]/g, (m) => {
        return "\\u" + ("0000" + m.charCodeAt(0).toString(16)).slice(-4);
    });
}
/**
 * @hidden
 */
function parseLink(resourcePath) {
    if (resourcePath.length === 0) {
        /* for DatabaseAccount case, both type and objectBody will be undefined. */
        return {
            type: undefined,
            objectBody: undefined,
        };
    }
    if (resourcePath[resourcePath.length - 1] !== "/") {
        resourcePath = resourcePath + "/";
    }
    if (resourcePath[0] !== "/") {
        resourcePath = "/" + resourcePath;
    }
    /*
           The path will be in the form of /[resourceType]/[resourceId]/ ....
           /[resourceType]//[resourceType]/[resourceId]/ .... /[resourceType]/[resourceId]/
           or /[resourceType]/[resourceId]/ .... /[resourceType]/[resourceId]/[resourceType]/[resourceId]/ ....
            /[resourceType]/[resourceId]/
           The result of split will be in the form of
           [[[resourceType], [resourceId] ... ,[resourceType], [resourceId], ""]
           In the first case, to extract the resourceId it will the element before last ( at length -2 )
           and the type will be before it ( at length -3 )
           In the second case, to extract the resource type it will the element before last ( at length -2 )
          */
    const pathParts = resourcePath.split("/");
    let id;
    let type;
    if (pathParts.length % 2 === 0) {
        // request in form /[resourceType]/[resourceId]/ .... /[resourceType]/[resourceId].
        id = pathParts[pathParts.length - 2];
        type = pathParts[pathParts.length - 3];
    }
    else {
        // request in form /[resourceType]/[resourceId]/ .... /[resourceType]/.
        id = pathParts[pathParts.length - 3];
        type = pathParts[pathParts.length - 2];
    }
    const result = {
        type,
        objectBody: {
            id,
            self: resourcePath,
        },
    };
    return result;
}
/**
 * @hidden
 */
function isReadRequest(operationType) {
    return operationType === exports.OperationType.Read || operationType === exports.OperationType.Query;
}
/**
 * @hidden
 */
function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
/**
 * @hidden
 */
function getContainerLink(link) {
    return link.split("/").slice(0, 4).join("/");
}
/**
 * @hidden
 */
function prepareURL(endpoint, path) {
    return trimSlashes(endpoint) + path;
}
/**
 * @hidden
 */
function trimSlashes(source) {
    return source.replace(trimLeftSlashes, "").replace(trimRightSlashes, "");
}
/**
 * @hidden
 */
function parsePath(path) {
    const pathParts = [];
    let currentIndex = 0;
    const throwError = () => {
        throw new Error("Path " + path + " is invalid at index " + currentIndex);
    };
    const getEscapedToken = () => {
        const quote = path[currentIndex];
        let newIndex = ++currentIndex;
        for (;;) {
            newIndex = path.indexOf(quote, newIndex);
            if (newIndex === -1) {
                throwError();
            }
            if (path[newIndex - 1] !== "\\") {
                break;
            }
            ++newIndex;
        }
        const token = path.substr(currentIndex, newIndex - currentIndex);
        currentIndex = newIndex + 1;
        return token;
    };
    const getToken = () => {
        const newIndex = path.indexOf("/", currentIndex);
        let token = null;
        if (newIndex === -1) {
            token = path.substr(currentIndex);
            currentIndex = path.length;
        }
        else {
            token = path.substr(currentIndex, newIndex - currentIndex);
            currentIndex = newIndex;
        }
        token = token.trim();
        return token;
    };
    while (currentIndex < path.length) {
        if (path[currentIndex] !== "/") {
            throwError();
        }
        if (++currentIndex === path.length) {
            break;
        }
        if (path[currentIndex] === '"' || path[currentIndex] === "'") {
            pathParts.push(getEscapedToken());
        }
        else {
            pathParts.push(getToken());
        }
    }
    return pathParts;
}
/**
 * @hidden
 */
function isResourceValid(resource, err) {
    // TODO: fix strictness issues so that caller contexts respects the types of the functions
    if (resource.id) {
        if (typeof resource.id !== "string") {
            err.message = "Id must be a string.";
            return false;
        }
        if (resource.id.indexOf("/") !== -1 ||
            resource.id.indexOf("\\") !== -1 ||
            resource.id.indexOf("?") !== -1 ||
            resource.id.indexOf("#") !== -1) {
            err.message = "Id contains illegal chars.";
            return false;
        }
        if (resource.id[resource.id.length - 1] === " ") {
            err.message = "Id ends with a space.";
            return false;
        }
    }
    return true;
}
/**
 * @hidden
 */
function isItemResourceValid(resource, err) {
    // TODO: fix strictness issues so that caller contexts respects the types of the functions
    if (resource.id) {
        if (typeof resource.id !== "string") {
            err.message = "Id must be a string.";
            return false;
        }
        if (resource.id.indexOf("/") !== -1 ||
            resource.id.indexOf("\\") !== -1 ||
            resource.id.indexOf("#") !== -1) {
            err.message = "Id contains illegal chars.";
            return false;
        }
    }
    return true;
}
/** @hidden */
function getIdFromLink(resourceLink) {
    resourceLink = trimSlashes(resourceLink);
    return resourceLink;
}
/** @hidden */
function getPathFromLink(resourceLink, resourceType) {
    resourceLink = trimSlashes(resourceLink);
    if (resourceType) {
        return "/" + encodeURI(resourceLink) + "/" + resourceType;
    }
    else {
        return "/" + encodeURI(resourceLink);
    }
}
/**
 * @hidden
 */
function isStringNullOrEmpty(inputString) {
    // checks whether string is null, undefined, empty or only contains space
    return !inputString || /^\s*$/.test(inputString);
}
/**
 * @hidden
 */
function trimSlashFromLeftAndRight(inputString) {
    if (typeof inputString !== "string") {
        throw new Error("invalid input: input is not string");
    }
    return inputString.replace(trimLeftSlashes, "").replace(trimRightSlashes, "");
}
/**
 * @hidden
 */
function validateResourceId(resourceId) {
    // if resourceId is not a string or is empty throw an error
    if (typeof resourceId !== "string" || isStringNullOrEmpty(resourceId)) {
        throw new Error("Resource ID must be a string and cannot be undefined, null or empty");
    }
    // if resource id contains illegal characters throw an error
    if (illegalResourceIdCharacters.test(resourceId)) {
        throw new Error("Illegal characters ['/', '\\', '#', '?'] cannot be used in Resource ID");
    }
    return true;
}
/**
 * @hidden
 */
function validateItemResourceId(resourceId) {
    // if resourceId is not a string or is empty throw an error
    if (typeof resourceId !== "string" || isStringNullOrEmpty(resourceId)) {
        throw new Error("Resource ID must be a string and cannot be undefined, null or empty");
    }
    // if resource id contains illegal characters throw an error
    if (illegalItemResourceIdCharacters.test(resourceId)) {
        throw new Error("Illegal characters ['/', '\\', '#'] cannot be used in Resource ID");
    }
    return true;
}
/**
 * @hidden
 */
function getResourceIdFromPath(resourcePath) {
    if (!resourcePath || typeof resourcePath !== "string") {
        return null;
    }
    const trimmedPath = trimSlashFromLeftAndRight(resourcePath);
    const pathSegments = trimmedPath.split("/");
    // number of segments of a path must always be even
    if (pathSegments.length % 2 !== 0) {
        return null;
    }
    return pathSegments[pathSegments.length - 1];
}
/**
 * @hidden
 */
function parseConnectionString(connectionString) {
    const keyValueStrings = connectionString.split(";");
    const { AccountEndpoint, AccountKey } = keyValueStrings.reduce((connectionObject, keyValueString) => {
        const [key, ...value] = keyValueString.split("=");
        connectionObject[key] = value.join("=");
        return connectionObject;
    }, {});
    if (!AccountEndpoint || !AccountKey) {
        throw new Error("Could not parse the provided connection string");
    }
    return {
        endpoint: AccountEndpoint,
        key: AccountKey,
    };
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
const StatusCodes = {
    // Success
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NoContent: 204,
    NotModified: 304,
    // Client error
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    PreconditionFailed: 412,
    RequestEntityTooLarge: 413,
    TooManyRequests: 429,
    RetryWith: 449,
    // Server Error
    InternalServerError: 500,
    ServiceUnavailable: 503,
    // System codes
    ENOTFOUND: "ENOTFOUND",
    // Operation pause and cancel. These are FAKE status codes for QOS logging purpose only.
    OperationPaused: 1200,
    OperationCancelled: 1201,
};
/**
 * @hidden
 */
const SubStatusCodes = {
    Unknown: 0,
    // 400: Bad Request Substatus
    CrossPartitionQueryNotServable: 1004,
    // 410: StatusCodeType_Gone: substatus
    PartitionKeyRangeGone: 1002,
    CompletingSplit: 1007,
    // 404: NotFound Substatus
    ReadSessionNotAvailable: 1002,
    // 403: Forbidden Substatus
    WriteForbidden: 3,
    DatabaseAccountNotFound: 1008,
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Would be used when creating or deleting a DocumentCollection
 * or a User in Azure Cosmos DB database service
 * @hidden
 * Given a database id, this creates a database link.
 * @param databaseId - The database id
 * @returns A database link in the format of `dbs/{0}`
 * with `{0}` being a Uri escaped version of the databaseId
 */
function createDatabaseUri(databaseId) {
    databaseId = trimSlashFromLeftAndRight(databaseId);
    validateResourceId(databaseId);
    return Constants$1.Path.DatabasesPathSegment + "/" + databaseId;
}
/**
 * Given a database and collection id, this creates a collection link.
 * Would be used when updating or deleting a DocumentCollection, creating a
 * Document, a StoredProcedure, a Trigger, a UserDefinedFunction, or when executing a query
 * with CreateDocumentQuery in Azure Cosmos DB database service.
 * @param databaseId - The database id
 * @param collectionId - The collection id
 * @returns A collection link in the format of `dbs/{0}/colls/{1}`
 * with `{0}` being a Uri escaped version of the databaseId and `{1}` being collectionId
 * @hidden
 */
function createDocumentCollectionUri(databaseId, collectionId) {
    collectionId = trimSlashFromLeftAndRight(collectionId);
    validateResourceId(collectionId);
    return (createDatabaseUri(databaseId) + "/" + Constants$1.Path.CollectionsPathSegment + "/" + collectionId);
}
/**
 * Given a database and user id, this creates a user link.
 * Would be used when creating a Permission, or when replacing or deleting
 * a User in Azure Cosmos DB database service
 * @param databaseId - The database id
 * @param userId - The user id
 * @returns A user link in the format of `dbs/{0}/users/{1}`
 * with `{0}` being a Uri escaped version of the databaseId and `{1}` being userId
 * @hidden
 */
function createUserUri(databaseId, userId) {
    userId = trimSlashFromLeftAndRight(userId);
    validateResourceId(userId);
    return createDatabaseUri(databaseId) + "/" + Constants$1.Path.UsersPathSegment + "/" + userId;
}
/**
 * Given a database and collection id, this creates a collection link.
 * Would be used when creating an Attachment, or when replacing
 * or deleting a Document in Azure Cosmos DB database service
 * @param databaseId - The database id
 * @param collectionId - The collection id
 * @param documentId - The document id
 * @returns A document link in the format of
 * `dbs/{0}/colls/{1}/docs/{2}` with `{0}` being a Uri escaped version of
 * the databaseId, `{1}` being collectionId and `{2}` being the documentId
 * @hidden
 */
function createDocumentUri(databaseId, collectionId, documentId) {
    documentId = trimSlashFromLeftAndRight(documentId);
    validateItemResourceId(documentId);
    return (createDocumentCollectionUri(databaseId, collectionId) +
        "/" +
        Constants$1.Path.DocumentsPathSegment +
        "/" +
        documentId);
}
/**
 * Given a database, collection and document id, this creates a document link.
 * Would be used when replacing or deleting a Permission in Azure Cosmos DB database service.
 * @param databaseId    -The database Id
 * @param userId        -The user Id
 * @param permissionId  - The permissionId
 * @returns A permission link in the format of `dbs/{0}/users/{1}/permissions/{2}`
 * with `{0}` being a Uri escaped version of the databaseId, `{1}` being userId and `{2}` being permissionId
 * @hidden
 */
function createPermissionUri(databaseId, userId, permissionId) {
    permissionId = trimSlashFromLeftAndRight(permissionId);
    validateResourceId(permissionId);
    return (createUserUri(databaseId, userId) +
        "/" +
        Constants$1.Path.PermissionsPathSegment +
        "/" +
        permissionId);
}
/**
 * Given a database, collection and stored proc id, this creates a stored proc link.
 * Would be used when replacing, executing, or deleting a StoredProcedure in
 * Azure Cosmos DB database service.
 * @param databaseId        -The database Id
 * @param collectionId      -The collection Id
 * @param storedProcedureId -The stored procedure Id
 * @returns A stored procedure link in the format of
 * `dbs/{0}/colls/{1}/sprocs/{2}` with `{0}` being a Uri escaped version of the databaseId,
 * `{1}` being collectionId and `{2}` being the storedProcedureId
 * @hidden
 */
function createStoredProcedureUri(databaseId, collectionId, storedProcedureId) {
    storedProcedureId = trimSlashFromLeftAndRight(storedProcedureId);
    validateResourceId(storedProcedureId);
    return (createDocumentCollectionUri(databaseId, collectionId) +
        "/" +
        Constants$1.Path.StoredProceduresPathSegment +
        "/" +
        storedProcedureId);
}
/**
 * Given a database, collection and trigger id, this creates a trigger link.
 * Would be used when replacing, executing, or deleting a Trigger in Azure Cosmos DB database service
 * @param databaseId        -The database Id
 * @param collectionId      -The collection Id
 * @param triggerId         -The trigger Id
 * @returns A trigger link in the format of
 * `dbs/{0}/colls/{1}/triggers/{2}` with `{0}` being a Uri escaped version of the databaseId,
 * `{1}` being collectionId and `{2}` being the triggerId
 * @hidden
 */
function createTriggerUri(databaseId, collectionId, triggerId) {
    triggerId = trimSlashFromLeftAndRight(triggerId);
    validateResourceId(triggerId);
    return (createDocumentCollectionUri(databaseId, collectionId) +
        "/" +
        Constants$1.Path.TriggersPathSegment +
        "/" +
        triggerId);
}
/**
 * Given a database, collection and udf id, this creates a udf link.
 * Would be used when replacing, executing, or deleting a UserDefinedFunction in
 * Azure Cosmos DB database service
 * @param databaseId        -The database Id
 * @param collectionId      -The collection Id
 * @param udfId             -The User Defined Function Id
 * @returns A udf link in the format of `dbs/{0}/colls/{1}/udfs/{2}`
 * with `{0}` being a Uri escaped version of the databaseId, `{1}` being collectionId and `{2}` being the udfId
 * @hidden
 */
function createUserDefinedFunctionUri(databaseId, collectionId, udfId) {
    udfId = trimSlashFromLeftAndRight(udfId);
    validateResourceId(udfId);
    return (createDocumentCollectionUri(databaseId, collectionId) +
        "/" +
        Constants$1.Path.UserDefinedFunctionsPathSegment +
        "/" +
        udfId);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * @hidden
 * Specifies Net RUConsumed
 */
class RUConsumedManager {
    constructor() {
        this.ruConsumed = 0;
        this.semaphore = semaphore(1);
    }
    getRUConsumed() {
        return new Promise((resolve) => {
            this.semaphore.take(() => {
                this.semaphore.leave();
                resolve(this.ruConsumed);
            });
        });
    }
    addToRUConsumed(value) {
        return new Promise((resolve) => {
            this.semaphore.take(() => {
                this.ruConsumed += value;
                this.semaphore.leave();
                resolve();
            });
        });
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
async function hmac(key, message) {
    return crypto.createHmac("sha256", Buffer.from(key, "base64")).update(message).digest("base64");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
async function generateHeaders(masterKey, method, resourceType = exports.ResourceType.none, resourceId = "", date = new Date()) {
    if (masterKey.startsWith("type=sas&")) {
        return {
            [Constants$1.HttpHeaders.Authorization]: encodeURIComponent(masterKey),
            [Constants$1.HttpHeaders.XDate]: date.toUTCString(),
        };
    }
    const sig = await signature(masterKey, method, resourceType, resourceId, date);
    return {
        [Constants$1.HttpHeaders.Authorization]: sig,
        [Constants$1.HttpHeaders.XDate]: date.toUTCString(),
    };
}
async function signature(masterKey, method, resourceType, resourceId = "", date = new Date()) {
    const type = "master";
    const version = "1.0";
    const text = method.toLowerCase() +
        "\n" +
        resourceType.toLowerCase() +
        "\n" +
        resourceId +
        "\n" +
        date.toUTCString().toLowerCase() +
        "\n" +
        "" +
        "\n";
    const signed = await hmac(masterKey, text);
    return encodeURIComponent("type=" + type + "&ver=" + version + "&sig=" + signed);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
async function setAuthorizationHeader(clientOptions, verb, path, resourceId, resourceType, headers) {
    if (clientOptions.permissionFeed) {
        clientOptions.resourceTokens = {};
        for (const permission of clientOptions.permissionFeed) {
            const id = getResourceIdFromPath(permission.resource);
            if (!id) {
                throw new Error(`authorization error: ${id} \
                          is an invalid resourceId in permissionFeed`);
            }
            clientOptions.resourceTokens[id] = permission._token; // TODO: any
        }
    }
    if (clientOptions.key) {
        await setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, clientOptions.key);
    }
    else if (clientOptions.resourceTokens) {
        headers[Constants$1.HttpHeaders.Authorization] = encodeURIComponent(getAuthorizationTokenUsingResourceTokens(clientOptions.resourceTokens, path, resourceId));
    }
    else if (clientOptions.tokenProvider) {
        headers[Constants$1.HttpHeaders.Authorization] = encodeURIComponent(await clientOptions.tokenProvider({ verb, path, resourceId, resourceType, headers }));
    }
}
/**
 * The default function for setting header token using the masterKey
 * @hidden
 */
async function setAuthorizationTokenHeaderUsingMasterKey(verb, resourceId, resourceType, headers, masterKey) {
    // TODO This should live in cosmos-sign
    if (resourceType === exports.ResourceType.offer) {
        resourceId = resourceId && resourceId.toLowerCase();
    }
    headers = Object.assign(headers, await generateHeaders(masterKey, verb, resourceType, resourceId));
}
/**
 * @hidden
 */
// TODO: Resource tokens
function getAuthorizationTokenUsingResourceTokens(resourceTokens, path, resourceId) {
    if (resourceTokens && Object.keys(resourceTokens).length > 0) {
        // For database account access(through getDatabaseAccount API), path and resourceId are "",
        // so in this case we return the first token to be used for creating the auth header as the
        // service will accept any token in this case
        if (!path && !resourceId) {
            return resourceTokens[Object.keys(resourceTokens)[0]];
        }
        // If we have exact resource token for the path use it
        if (resourceId && resourceTokens[resourceId]) {
            return resourceTokens[resourceId];
        }
        // minimum valid path /dbs
        if (!path || path.length < 4) {
            // TODO: This should throw an error
            return null;
        }
        path = trimSlashFromLeftAndRight(path);
        const pathSegments = (path && path.split("/")) || [];
        // Item path
        if (pathSegments.length === 6) {
            // Look for a container token matching the item path
            const containerPath = pathSegments.slice(0, 4).map(decodeURIComponent).join("/");
            if (resourceTokens[containerPath]) {
                return resourceTokens[containerPath];
            }
        }
        // TODO remove in v4: This is legacy behavior that lets someone use a resource token pointing ONLY at an ID
        // It was used when _rid was exposed by the SDK, but now that we are using user provided ids it is not needed
        // However removing it now would be a breaking change
        // if it's an incomplete path like /dbs/db1/colls/, start from the parent resource
        let index = pathSegments.length % 2 === 0 ? pathSegments.length - 1 : pathSegments.length - 2;
        for (; index > 0; index -= 2) {
            const id = decodeURI(pathSegments[index]);
            if (resourceTokens[id]) {
                return resourceTokens[id];
            }
        }
    }
    // TODO: This should throw an error
    return null;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** Determines the connection behavior of the CosmosClient. Note, we currently only support Gateway Mode. */
exports.ConnectionMode = void 0;
(function (ConnectionMode) {
    /** Gateway mode talks to an intermediate gateway which handles the direct communication with your individual partitions. */
    ConnectionMode[ConnectionMode["Gateway"] = 0] = "Gateway";
})(exports.ConnectionMode || (exports.ConnectionMode = {}));

/**
 * @hidden
 */
const defaultConnectionPolicy = Object.freeze({
    connectionMode: exports.ConnectionMode.Gateway,
    requestTimeout: 60000,
    enableEndpointDiscovery: true,
    preferredLocations: [],
    retryOptions: {
        maxRetryAttemptCount: 9,
        fixedRetryIntervalInMilliseconds: 0,
        maxWaitTimeInSeconds: 30,
    },
    useMultipleWriteLocations: true,
    endpointRefreshRateInMs: 300000,
    enableBackgroundEndpointRefreshing: true,
});

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Represents the consistency levels supported for Azure Cosmos DB client operations.<br>
 * The requested ConsistencyLevel must match or be weaker than that provisioned for the database account.
 * Consistency levels.
 *
 * Consistency levels by order of strength are Strong, BoundedStaleness, Session, Consistent Prefix, and Eventual.
 *
 * See https://aka.ms/cosmos-consistency for more detailed documentation on Consistency Levels.
 */
exports.ConsistencyLevel = void 0;
(function (ConsistencyLevel) {
    /**
     * Strong Consistency guarantees that read operations always return the value that was last written.
     */
    ConsistencyLevel["Strong"] = "Strong";
    /**
     * Bounded Staleness guarantees that reads are not too out-of-date.
     * This can be configured based on number of operations (MaxStalenessPrefix) or time (MaxStalenessIntervalInSeconds).
     */
    ConsistencyLevel["BoundedStaleness"] = "BoundedStaleness";
    /**
     * Session Consistency guarantees monotonic reads (you never read old data, then new, then old again),
     * monotonic writes (writes are ordered) and read your writes (your writes are immediately visible to your reads)
     * within any single session.
     */
    ConsistencyLevel["Session"] = "Session";
    /**
     * Eventual Consistency guarantees that reads will return a subset of writes.
     * All writes will be eventually be available for reads.
     */
    ConsistencyLevel["Eventual"] = "Eventual";
    /**
     * ConsistentPrefix Consistency guarantees that reads will return some prefix of all writes with no gaps.
     * All writes will be eventually be available for reads.
     */
    ConsistencyLevel["ConsistentPrefix"] = "ConsistentPrefix";
})(exports.ConsistencyLevel || (exports.ConsistencyLevel = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Represents a DatabaseAccount in the Azure Cosmos DB database service.
 */
class DatabaseAccount {
    /**
     * The self-link for Databases in the databaseAccount.
     * @deprecated Use `databasesLink`
     */
    get DatabasesLink() {
        return this.databasesLink;
    }
    /**
     * The self-link for Media in the databaseAccount.
     * @deprecated Use `mediaLink`
     */
    get MediaLink() {
        return this.mediaLink;
    }
    /**
     * Attachment content (media) storage quota in MBs ( Retrieved from gateway ).
     * @deprecated use `maxMediaStorageUsageInMB`
     */
    get MaxMediaStorageUsageInMB() {
        return this.maxMediaStorageUsageInMB;
    }
    /**
     * Current attachment content (media) usage in MBs (Retrieved from gateway )
     *
     * Value is returned from cached information updated periodically and is not guaranteed
     * to be real time.
     *
     * @deprecated use `currentMediaStorageUsageInMB`
     */
    get CurrentMediaStorageUsageInMB() {
        return this.currentMediaStorageUsageInMB;
    }
    /**
     * Gets the UserConsistencyPolicy settings.
     * @deprecated use `consistencyPolicy`
     */
    get ConsistencyPolicy() {
        return this.consistencyPolicy;
    }
    // TODO: body - any
    constructor(body, headers) {
        /** The list of writable locations for a geo-replicated database account. */
        this.writableLocations = [];
        /** The list of readable locations for a geo-replicated database account. */
        this.readableLocations = [];
        this.databasesLink = "/dbs/";
        this.mediaLink = "/media/";
        this.maxMediaStorageUsageInMB = headers[Constants$1.HttpHeaders.MaxMediaStorageUsageInMB];
        this.currentMediaStorageUsageInMB = headers[Constants$1.HttpHeaders.CurrentMediaStorageUsageInMB];
        this.consistencyPolicy = body.userConsistencyPolicy
            ? body.userConsistencyPolicy.defaultConsistencyLevel
            : exports.ConsistencyLevel.Session;
        if (body[Constants$1.WritableLocations] && body.id !== "localhost") {
            this.writableLocations = body[Constants$1.WritableLocations];
        }
        if (body[Constants$1.ReadableLocations] && body.id !== "localhost") {
            this.readableLocations = body[Constants$1.ReadableLocations];
        }
        if (body[Constants$1.ENABLE_MULTIPLE_WRITABLE_LOCATIONS]) {
            this.enableMultipleWritableLocations =
                body[Constants$1.ENABLE_MULTIPLE_WRITABLE_LOCATIONS] === true ||
                    body[Constants$1.ENABLE_MULTIPLE_WRITABLE_LOCATIONS] === "true";
        }
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** Defines a target data type of an index path specification in the Azure Cosmos DB service. */
exports.DataType = void 0;
(function (DataType) {
    /** Represents a numeric data type. */
    DataType["Number"] = "Number";
    /** Represents a string data type. */
    DataType["String"] = "String";
    /** Represents a point data type. */
    DataType["Point"] = "Point";
    /** Represents a line string data type. */
    DataType["LineString"] = "LineString";
    /** Represents a polygon data type. */
    DataType["Polygon"] = "Polygon";
    /** Represents a multi-polygon data type. */
    DataType["MultiPolygon"] = "MultiPolygon";
})(exports.DataType || (exports.DataType = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Specifies the supported indexing modes.
 */
exports.IndexingMode = void 0;
(function (IndexingMode) {
    /**
     * Index is updated synchronously with a create or update operation.
     *
     * With consistent indexing, query behavior is the same as the default consistency level for the container.
     * The index is always kept up to date with the data.
     */
    IndexingMode["consistent"] = "consistent";
    /**
     * Index is updated asynchronously with respect to a create or update operation.
     *
     * With lazy indexing, queries are eventually consistent. The index is updated when the container is idle.
     */
    IndexingMode["lazy"] = "lazy";
    /** No Index is provided. */
    IndexingMode["none"] = "none";
})(exports.IndexingMode || (exports.IndexingMode = {}));

/* The target data type of a spatial path */
exports.SpatialType = void 0;
(function (SpatialType) {
    SpatialType["LineString"] = "LineString";
    SpatialType["MultiPolygon"] = "MultiPolygon";
    SpatialType["Point"] = "Point";
    SpatialType["Polygon"] = "Polygon";
})(exports.SpatialType || (exports.SpatialType = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Specifies the supported Index types.
 */
exports.IndexKind = void 0;
(function (IndexKind) {
    /**
     * This is supplied for a path which requires sorting.
     */
    IndexKind["Range"] = "Range";
    /**
     * This is supplied for a path which requires geospatial indexing.
     */
    IndexKind["Spatial"] = "Spatial";
})(exports.IndexKind || (exports.IndexKind = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * None PartitionKey Literal
 */
const NonePartitionKeyLiteral = {};
/**
 * @hidden
 * Null PartitionKey Literal
 */
const NullPartitionKeyLiteral = null;
/**
 * @hidden
 * Maps PartitionKey to InternalPartitionKey.
 * @param partitionKey - PartitonKey to be converted.
 * @returns PartitionKeyInternal
 */
function convertToInternalPartitionKey(partitionKey) {
    if (Array.isArray(partitionKey)) {
        return partitionKey.map((key) => (key === undefined ? NonePartitionKeyLiteral : key));
    }
    else
        return [partitionKey];
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Builder class for building PartitionKey.
 */
class PartitionKeyBuilder {
    constructor() {
        this.values = [];
    }
    addValue(value) {
        this.values.push(value);
        return this;
    }
    addNullValue() {
        this.values.push(NullPartitionKeyLiteral);
        return this;
    }
    addNoneValue() {
        this.values.push(NonePartitionKeyLiteral);
        return this;
    }
    build() {
        return [...this.values];
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * PartitionKey Definition Version
 */
exports.PartitionKeyDefinitionVersion = void 0;
(function (PartitionKeyDefinitionVersion) {
    PartitionKeyDefinitionVersion[PartitionKeyDefinitionVersion["V1"] = 1] = "V1";
    PartitionKeyDefinitionVersion[PartitionKeyDefinitionVersion["V2"] = 2] = "V2";
})(exports.PartitionKeyDefinitionVersion || (exports.PartitionKeyDefinitionVersion = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Type of PartitionKey i.e. Hash, MultiHash
 */
exports.PartitionKeyKind = void 0;
(function (PartitionKeyKind) {
    PartitionKeyKind["Hash"] = "Hash";
    PartitionKeyKind["MultiHash"] = "MultiHash";
})(exports.PartitionKeyKind || (exports.PartitionKeyKind = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Enum for permission mode values.
 */
exports.PermissionMode = void 0;
(function (PermissionMode) {
    /** Permission not valid. */
    PermissionMode["None"] = "none";
    /** Permission applicable for read operations only. */
    PermissionMode["Read"] = "read";
    /** Permission applicable for all operations. */
    PermissionMode["All"] = "all";
})(exports.PermissionMode || (exports.PermissionMode = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Represents Priority Level associated with each Azure Cosmos DB client requests.<br>
 * The Low priority requests are always throttled before any High priority requests.
 *
 * By default all requests are considered as High priority requests.
 *
 * See https://aka.ms/CosmosDB/PriorityBasedExecution for more detailed documentation on Priority based throttling.
 */
exports.PriorityLevel = void 0;
(function (PriorityLevel) {
    /**
     * High Priority requests are throttled after Low priority requests.
     */
    PriorityLevel["High"] = "High";
    /**
     * Low Priority requests are throttled before High priority requests.
     */
    PriorityLevel["Low"] = "Low";
})(exports.PriorityLevel || (exports.PriorityLevel = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Enum for trigger operation values.
 * specifies the operations on which a trigger should be executed.
 */
exports.TriggerOperation = void 0;
(function (TriggerOperation) {
    /** All operations. */
    TriggerOperation["All"] = "all";
    /** Create operations only. */
    TriggerOperation["Create"] = "create";
    /** Update operations only. */
    TriggerOperation["Update"] = "update";
    /** Delete operations only. */
    TriggerOperation["Delete"] = "delete";
    /** Replace operations only. */
    TriggerOperation["Replace"] = "replace";
})(exports.TriggerOperation || (exports.TriggerOperation = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Enum for trigger type values.
 * Specifies the type of the trigger.
 */
exports.TriggerType = void 0;
(function (TriggerType) {
    /** Trigger should be executed before the associated operation(s). */
    TriggerType["Pre"] = "pre";
    /** Trigger should be executed after the associated operation(s). */
    TriggerType["Post"] = "post";
})(exports.TriggerType || (exports.TriggerType = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Enum for udf type values.
 * Specifies the types of user defined functions.
 */
exports.UserDefinedFunctionType = void 0;
(function (UserDefinedFunctionType) {
    /** The User Defined Function is written in JavaScript. This is currently the only option. */
    UserDefinedFunctionType["Javascript"] = "Javascript";
})(exports.UserDefinedFunctionType || (exports.UserDefinedFunctionType = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
exports.GeospatialType = void 0;
(function (GeospatialType) {
    /** Represents data in round-earth coordinate system. */
    GeospatialType["Geography"] = "Geography";
    /** Represents data in Eucledian(flat) coordinate system. */
    GeospatialType["Geometry"] = "Geometry";
})(exports.GeospatialType || (exports.GeospatialType = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const logger$4 = logger$5.createClientLogger("extractPartitionKey");
/**
 * Function to extract PartitionKey based on {@link PartitionKeyDefinition}
 * from an object.
 * Retuns
 * 1. PartitionKeyInternal[] if extraction is successful.
 * 2. undefined if either {@link partitionKeyDefinition} is not well formed
 * or an unsupported partitionkey type is encountered.
 * @hidden
 */
function extractPartitionKeys(document, partitionKeyDefinition) {
    if (partitionKeyDefinition &&
        partitionKeyDefinition.paths &&
        partitionKeyDefinition.paths.length > 0) {
        if (partitionKeyDefinition.systemKey === true) {
            return [];
        }
        if (partitionKeyDefinition.paths.length === 1 &&
            partitionKeyDefinition.paths[0] === DEFAULT_PARTITION_KEY_PATH) {
            return [extractPartitionKey(DEFAULT_PARTITION_KEY_PATH, document)];
        }
        const partitionKeys = [];
        partitionKeyDefinition.paths.forEach((path) => {
            const obj = extractPartitionKey(path, document);
            if (obj === undefined) {
                logger$4.warning("Unsupported PartitionKey found.");
                return undefined;
            }
            partitionKeys.push(obj);
        });
        return partitionKeys;
    }
    logger$4.error("Unexpected Partition Key Definition Found.");
    return undefined;
}
function extractPartitionKey(path, obj) {
    const pathParts = parsePath(path);
    for (const part of pathParts) {
        if (typeof obj === "object" && obj !== null && part in obj) {
            obj = obj[part];
        }
        else {
            obj = undefined;
            break;
        }
    }
    if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
        return obj;
    }
    else if (obj === NullPartitionKeyLiteral) {
        return NullPartitionKeyLiteral;
    }
    else if (obj === undefined || JSON.stringify(obj) === JSON.stringify(NonePartitionKeyLiteral)) {
        return NonePartitionKeyLiteral;
    }
    return undefined;
}
/**
 * @hidden
 */
function undefinedPartitionKey(partitionKeyDefinition) {
    if (partitionKeyDefinition.systemKey === true) {
        return [];
    }
    else {
        return partitionKeyDefinition.paths.map(() => NonePartitionKeyLiteral);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Utility function to avoid writing boilder plate code while checking for
 * undefined values. It throws Error if the input value is undefined.
 * @param value - Value which is potentially undefined.
 * @param msg - Error Message to throw if value is undefined.
 * @returns
 */
function assertNotUndefined(value, msg) {
    if (value !== undefined) {
        return value;
    }
    throw new Error(msg || "Unexpected 'undefined' value encountered");
}
/**
 * Check for value being PrimitivePartitionKeyValue.
 * @internal
 */
function isPrimitivePartitionKeyValue(value) {
    return (isWellDefinedPartitionKeyValue(value) ||
        isNonePartitionKeyValue(value) ||
        isNullPartitionKeyValue(value));
}
/**
 * Check for value being string, number or boolean.
 * @internal
 */
function isWellDefinedPartitionKeyValue(value) {
    return typeof value === "string" || typeof value === "boolean" || typeof value === "number";
}
/**
 * Check for value being NonePartitionKeyType.
 * @internal
 */
function isNonePartitionKeyValue(value) {
    return value !== undefined && JSON.stringify(value) === JSON.stringify(NonePartitionKeyLiteral);
}
/**
 * Check for value being NullPartitionKeyType.
 * @internal
 */
function isNullPartitionKeyValue(value) {
    return value === NullPartitionKeyLiteral;
}
/**
 * Verify validity of partition key.
 * @internal
 */
function isPartitionKey(partitionKey) {
    return isPrimitivePartitionKeyValue(partitionKey) || Array.isArray(partitionKey);
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * The \@azure/logger configuration for this package.
 */
const defaultLogger = logger$5.createClientLogger("cosmosdb");

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------
// Utility methods
//
/** @hidden */
function javaScriptFriendlyJSONStringify(s) {
    // two line terminators (Line separator and Paragraph separator) are not needed to be escaped in JSON
    // but are needed to be escaped in JavaScript.
    return JSON.stringify(s)
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}
/** @hidden */
function bodyFromData(data) {
    if (typeof data === "object") {
        return javaScriptFriendlyJSONStringify(data);
    }
    return data;
}
const JsonContentType = "application/json";
/**
 * @hidden
 */
async function getHeaders({ clientOptions, defaultHeaders, verb, path, resourceId, resourceType, options = {}, partitionKeyRangeId, useMultipleWriteLocations, partitionKey, }) {
    const headers = Object.assign({ [Constants$1.HttpHeaders.ResponseContinuationTokenLimitInKB]: 1, [Constants$1.HttpHeaders.EnableCrossPartitionQuery]: true }, defaultHeaders);
    if (useMultipleWriteLocations) {
        headers[Constants$1.HttpHeaders.ALLOW_MULTIPLE_WRITES] = true;
    }
    if (options.continuationTokenLimitInKB) {
        headers[Constants$1.HttpHeaders.ResponseContinuationTokenLimitInKB] =
            options.continuationTokenLimitInKB;
    }
    if (options.continuationToken) {
        headers[Constants$1.HttpHeaders.Continuation] = options.continuationToken;
    }
    else if (options.continuation) {
        headers[Constants$1.HttpHeaders.Continuation] = options.continuation;
    }
    if (options.preTriggerInclude) {
        headers[Constants$1.HttpHeaders.PreTriggerInclude] =
            options.preTriggerInclude.constructor === Array
                ? options.preTriggerInclude.join(",")
                : options.preTriggerInclude;
    }
    if (options.postTriggerInclude) {
        headers[Constants$1.HttpHeaders.PostTriggerInclude] =
            options.postTriggerInclude.constructor === Array
                ? options.postTriggerInclude.join(",")
                : options.postTriggerInclude;
    }
    if (options.offerType) {
        headers[Constants$1.HttpHeaders.OfferType] = options.offerType;
    }
    if (options.offerThroughput) {
        headers[Constants$1.HttpHeaders.OfferThroughput] = options.offerThroughput;
    }
    if (options.maxItemCount) {
        headers[Constants$1.HttpHeaders.PageSize] = options.maxItemCount;
    }
    if (options.accessCondition) {
        if (options.accessCondition.type === "IfMatch") {
            headers[Constants$1.HttpHeaders.IfMatch] = options.accessCondition.condition;
        }
        else {
            headers[Constants$1.HttpHeaders.IfNoneMatch] = options.accessCondition.condition;
        }
    }
    if (options.useIncrementalFeed) {
        headers[Constants$1.HttpHeaders.A_IM] = "Incremental Feed";
    }
    if (options.indexingDirective) {
        headers[Constants$1.HttpHeaders.IndexingDirective] = options.indexingDirective;
    }
    if (options.consistencyLevel) {
        headers[Constants$1.HttpHeaders.ConsistencyLevel] = options.consistencyLevel;
    }
    if (options.priorityLevel) {
        headers[Constants$1.HttpHeaders.PriorityLevel] = options.priorityLevel;
    }
    if (options.maxIntegratedCacheStalenessInMs && resourceType === exports.ResourceType.item) {
        if (typeof options.maxIntegratedCacheStalenessInMs === "number") {
            headers[Constants$1.HttpHeaders.DedicatedGatewayPerRequestCacheStaleness] =
                options.maxIntegratedCacheStalenessInMs.toString();
        }
        else {
            defaultLogger.error(`RangeError: maxIntegratedCacheStalenessInMs "${options.maxIntegratedCacheStalenessInMs}" is not a valid parameter.`);
            headers[Constants$1.HttpHeaders.DedicatedGatewayPerRequestCacheStaleness] = "null";
        }
    }
    if (options.resourceTokenExpirySeconds) {
        headers[Constants$1.HttpHeaders.ResourceTokenExpiry] = options.resourceTokenExpirySeconds;
    }
    if (options.sessionToken) {
        headers[Constants$1.HttpHeaders.SessionToken] = options.sessionToken;
    }
    if (options.enableScanInQuery) {
        headers[Constants$1.HttpHeaders.EnableScanInQuery] = options.enableScanInQuery;
    }
    if (options.populateQuotaInfo) {
        headers[Constants$1.HttpHeaders.PopulateQuotaInfo] = options.populateQuotaInfo;
    }
    if (options.populateQueryMetrics) {
        headers[Constants$1.HttpHeaders.PopulateQueryMetrics] = options.populateQueryMetrics;
    }
    if (options.maxDegreeOfParallelism !== undefined) {
        headers[Constants$1.HttpHeaders.ParallelizeCrossPartitionQuery] = true;
    }
    if (options.populateQuotaInfo) {
        headers[Constants$1.HttpHeaders.PopulateQuotaInfo] = true;
    }
    if (partitionKey !== undefined && !headers[Constants$1.HttpHeaders.PartitionKey]) {
        headers[Constants$1.HttpHeaders.PartitionKey] = jsonStringifyAndEscapeNonASCII(partitionKey);
    }
    if (clientOptions.key || clientOptions.tokenProvider) {
        headers[Constants$1.HttpHeaders.XDate] = new Date().toUTCString();
    }
    if (verb === exports.HTTPMethod.post || verb === exports.HTTPMethod.put) {
        if (!headers[Constants$1.HttpHeaders.ContentType]) {
            headers[Constants$1.HttpHeaders.ContentType] = JsonContentType;
        }
    }
    if (!headers[Constants$1.HttpHeaders.Accept]) {
        headers[Constants$1.HttpHeaders.Accept] = JsonContentType;
    }
    if (partitionKeyRangeId !== undefined) {
        headers[Constants$1.HttpHeaders.PartitionKeyRangeID] = partitionKeyRangeId;
    }
    if (options.enableScriptLogging) {
        headers[Constants$1.HttpHeaders.EnableScriptLogging] = options.enableScriptLogging;
    }
    if (options.disableRUPerMinuteUsage) {
        headers[Constants$1.HttpHeaders.DisableRUPerMinuteUsage] = true;
    }
    if (options.populateIndexMetrics) {
        headers[Constants$1.HttpHeaders.PopulateIndexMetrics] = options.populateIndexMetrics;
    }
    if (clientOptions.key ||
        clientOptions.resourceTokens ||
        clientOptions.tokenProvider ||
        clientOptions.permissionFeed) {
        await setAuthorizationHeader(clientOptions, verb, path, resourceId, resourceType, headers);
    }
    return headers;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const uuid$2 = uuid$3.v4;
function isKeyInRange(min, max, key) {
    const isAfterMinInclusive = key.localeCompare(min) >= 0;
    const isBeforeMax = key.localeCompare(max) < 0;
    return isAfterMinInclusive && isBeforeMax;
}
const BulkOperationType = {
    Create: "Create",
    Upsert: "Upsert",
    Read: "Read",
    Delete: "Delete",
    Replace: "Replace",
    Patch: "Patch",
};
/**
 * Maps OperationInput to Operation by
 * - generating Ids if needed.
 * - choosing partitionKey which can be used to choose which batch this
 * operation should be part of. The order is -
 *   1. If the operationInput itself has partitionKey field set it is used.
 *   2. Other wise for create/replace/upsert it is extracted from resource body.
 *   3. For read/delete/patch type operations undefined partitionKey is used.
 * - Here one nuance is that, the partitionKey field inside Operation needs to
 *  be serialized as a JSON string.
 * @param operationInput - OperationInput
 * @param definition - PartitionKeyDefinition
 * @param options - RequestOptions
 * @returns
 */
function prepareOperations(operationInput, definition, options = {}) {
    populateIdsIfNeeded(operationInput, options);
    let partitionKey;
    if (Object.prototype.hasOwnProperty.call(operationInput, "partitionKey")) {
        if (operationInput.partitionKey === undefined) {
            partitionKey = definition.paths.map(() => NonePartitionKeyLiteral);
        }
        else {
            partitionKey = convertToInternalPartitionKey(operationInput.partitionKey);
        }
    }
    else {
        switch (operationInput.operationType) {
            case BulkOperationType.Create:
            case BulkOperationType.Replace:
            case BulkOperationType.Upsert:
                partitionKey = assertNotUndefined(extractPartitionKeys(operationInput.resourceBody, definition), "Unexpected undefined Partition Key Found.");
                break;
            case BulkOperationType.Read:
            case BulkOperationType.Delete:
            case BulkOperationType.Patch:
                partitionKey = definition.paths.map(() => NonePartitionKeyLiteral);
        }
    }
    return {
        operation: Object.assign(Object.assign({}, operationInput), { partitionKey: JSON.stringify(partitionKey) }),
        partitionKey,
    };
}
/**
 * For operations requiring Id genrate random uuids.
 * @param operationInput - OperationInput to be checked.
 * @param options - RequestOptions
 */
function populateIdsIfNeeded(operationInput, options) {
    if (operationInput.operationType === BulkOperationType.Create ||
        operationInput.operationType === BulkOperationType.Upsert) {
        if ((operationInput.resourceBody.id === undefined || operationInput.resourceBody.id === "") &&
            !options.disableAutomaticIdGeneration) {
            operationInput.resourceBody.id = uuid$2();
        }
    }
}
/**
 * Splits a batch into array of batches based on cumulative size of its operations by making sure
 * cumulative size of an individual batch is not larger than {@link Constants.DefaultMaxBulkRequestBodySizeInBytes}.
 * If a single operation itself is larger than {@link Constants.DefaultMaxBulkRequestBodySizeInBytes}, that
 * operation would be moved into a batch containing only that operation.
 * @param originalBatch - A batch of operations needed to be checked.
 * @returns
 * @hidden
 */
function splitBatchBasedOnBodySize(originalBatch) {
    if ((originalBatch === null || originalBatch === void 0 ? void 0 : originalBatch.operations) === undefined || originalBatch.operations.length < 1)
        return [];
    let currentBatchSize = calculateObjectSizeInBytes(originalBatch.operations[0]);
    let currentBatch = Object.assign(Object.assign({}, originalBatch), { operations: [originalBatch.operations[0]], indexes: [originalBatch.indexes[0]] });
    const processedBatches = [];
    processedBatches.push(currentBatch);
    for (let index = 1; index < originalBatch.operations.length; index++) {
        const operation = originalBatch.operations[index];
        const currentOpSize = calculateObjectSizeInBytes(operation);
        if (currentBatchSize + currentOpSize > Constants$1.DefaultMaxBulkRequestBodySizeInBytes) {
            currentBatch = Object.assign(Object.assign({}, originalBatch), { operations: [], indexes: [] });
            processedBatches.push(currentBatch);
            currentBatchSize = 0;
        }
        currentBatch.operations.push(operation);
        currentBatch.indexes.push(originalBatch.indexes[index]);
        currentBatchSize += currentOpSize;
    }
    return processedBatches;
}
/**
 * Calculates size of an JSON object in bytes with utf-8 encoding.
 * @hidden
 */
function calculateObjectSizeInBytes(obj) {
    return new TextEncoder().encode(bodyFromData(obj)).length;
}
function decorateBatchOperation(operation, options = {}) {
    if (operation.operationType === BulkOperationType.Create ||
        operation.operationType === BulkOperationType.Upsert) {
        if ((operation.resourceBody.id === undefined || operation.resourceBody.id === "") &&
            !options.disableAutomaticIdGeneration) {
            operation.resourceBody.id = uuid$2();
        }
    }
    return operation;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const PatchOperationType = {
    add: "add",
    replace: "replace",
    remove: "remove",
    set: "set",
    incr: "incr",
};

class ErrorResponse extends Error {
}

class ResourceResponse {
    constructor(resource, headers, statusCode, diagnostics, substatus) {
        this.resource = resource;
        this.headers = headers;
        this.statusCode = statusCode;
        this.diagnostics = diagnostics;
        this.substatus = substatus;
    }
    get requestCharge() {
        return Number(this.headers[Constants$1.HttpHeaders.RequestCharge]) || 0;
    }
    get activityId() {
        return this.headers[Constants$1.HttpHeaders.ActivityId];
    }
    get etag() {
        return this.headers[Constants$1.HttpHeaders.ETag];
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class ClientSideMetrics {
    constructor(requestCharge) {
        this.requestCharge = requestCharge;
    }
    /**
     * Adds one or more ClientSideMetrics to a copy of this instance and returns the result.
     */
    add(...clientSideMetricsArray) {
        let requestCharge = this.requestCharge;
        for (const clientSideMetrics of clientSideMetricsArray) {
            if (clientSideMetrics == null) {
                throw new Error("clientSideMetrics has null or undefined item(s)");
            }
            requestCharge += clientSideMetrics.requestCharge;
        }
        return new ClientSideMetrics(requestCharge);
    }
    static createFromArray(...clientSideMetricsArray) {
        if (clientSideMetricsArray == null) {
            throw new Error("clientSideMetricsArray is null or undefined item(s)");
        }
        return this.zero.add(...clientSideMetricsArray);
    }
}
ClientSideMetrics.zero = new ClientSideMetrics(0);

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var QueryMetricsConstants = {
    // QueryMetrics
    RetrievedDocumentCount: "retrievedDocumentCount",
    RetrievedDocumentSize: "retrievedDocumentSize",
    OutputDocumentCount: "outputDocumentCount",
    OutputDocumentSize: "outputDocumentSize",
    IndexHitRatio: "indexUtilizationRatio",
    IndexHitDocumentCount: "indexHitDocumentCount",
    TotalQueryExecutionTimeInMs: "totalExecutionTimeInMs",
    // QueryPreparationTimes
    QueryCompileTimeInMs: "queryCompileTimeInMs",
    LogicalPlanBuildTimeInMs: "queryLogicalPlanBuildTimeInMs",
    PhysicalPlanBuildTimeInMs: "queryPhysicalPlanBuildTimeInMs",
    QueryOptimizationTimeInMs: "queryOptimizationTimeInMs",
    // QueryTimes
    IndexLookupTimeInMs: "indexLookupTimeInMs",
    DocumentLoadTimeInMs: "documentLoadTimeInMs",
    VMExecutionTimeInMs: "VMExecutionTimeInMs",
    DocumentWriteTimeInMs: "writeOutputTimeInMs",
    // RuntimeExecutionTimes
    QueryEngineTimes: "queryEngineTimes",
    SystemFunctionExecuteTimeInMs: "systemFunctionExecuteTimeInMs",
    UserDefinedFunctionExecutionTimeInMs: "userFunctionExecuteTimeInMs",
    // QueryMetrics Text
    RetrievedDocumentCountText: "Retrieved Document Count",
    RetrievedDocumentSizeText: "Retrieved Document Size",
    OutputDocumentCountText: "Output Document Count",
    OutputDocumentSizeText: "Output Document Size",
    IndexUtilizationText: "Index Utilization",
    TotalQueryExecutionTimeText: "Total Query Execution Time",
    // QueryPreparationTimes Text
    QueryPreparationTimesText: "Query Preparation Times",
    QueryCompileTimeText: "Query Compilation Time",
    LogicalPlanBuildTimeText: "Logical Plan Build Time",
    PhysicalPlanBuildTimeText: "Physical Plan Build Time",
    QueryOptimizationTimeText: "Query Optimization Time",
    // QueryTimes Text
    QueryEngineTimesText: "Query Engine Times",
    IndexLookupTimeText: "Index Lookup Time",
    DocumentLoadTimeText: "Document Load Time",
    WriteOutputTimeText: "Document Write Time",
    // RuntimeExecutionTimes Text
    RuntimeExecutionTimesText: "Runtime Execution Times",
    TotalExecutionTimeText: "Query Engine Execution Time",
    SystemFunctionExecuteTimeText: "System Function Execution Time",
    UserDefinedFunctionExecutionTimeText: "User-defined Function Execution Time",
    // ClientSideQueryMetrics Text
    ClientSideQueryMetricsText: "Client Side Metrics",
    RetriesText: "Retry Count",
    RequestChargeText: "Request Charge",
    FetchExecutionRangesText: "Partition Execution Timeline",
    SchedulingMetricsText: "Scheduling Metrics",
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// Ported this implementation to javascript:
// https://referencesource.microsoft.com/#mscorlib/system/timespan.cs,83e476c1ae112117
/** @hidden */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const ticksPerMillisecond = 10000;
/** @hidden */
const millisecondsPerTick = 1.0 / ticksPerMillisecond;
/** @hidden */
const ticksPerSecond = ticksPerMillisecond * 1000; // 10,000,000
/** @hidden */
const secondsPerTick = 1.0 / ticksPerSecond; // 0.0001
/** @hidden */
const ticksPerMinute = ticksPerSecond * 60; // 600,000,000
/** @hidden */
const minutesPerTick = 1.0 / ticksPerMinute; // 1.6666666666667e-9
/** @hidden */
const ticksPerHour = ticksPerMinute * 60; // 36,000,000,000
/** @hidden */
const hoursPerTick = 1.0 / ticksPerHour; // 2.77777777777777778e-11
/** @hidden */
const ticksPerDay = ticksPerHour * 24; // 864,000,000,000
/** @hidden */
const daysPerTick = 1.0 / ticksPerDay; // 1.1574074074074074074e-12
/** @hidden */
const millisPerSecond = 1000;
/** @hidden */
const millisPerMinute = millisPerSecond * 60; //     60,000
/** @hidden */
const millisPerHour = millisPerMinute * 60; //  3,600,000
/** @hidden */
const millisPerDay = millisPerHour * 24; // 86,400,000
/** @hidden */
const maxMilliSeconds = Number.MAX_SAFE_INTEGER / ticksPerMillisecond;
/** @hidden */
const minMilliSeconds = Number.MIN_SAFE_INTEGER / ticksPerMillisecond;
/**
 * Represents a time interval.
 *
 * @param days                 - Number of days.
 * @param hours                - Number of hours.
 * @param minutes              - Number of minutes.
 * @param seconds              - Number of seconds.
 * @param milliseconds         - Number of milliseconds.
 * @hidden
 */
class TimeSpan {
    constructor(days, hours, minutes, seconds, milliseconds) {
        // Constructor
        if (!Number.isInteger(days)) {
            throw new Error("days is not an integer");
        }
        if (!Number.isInteger(hours)) {
            throw new Error("hours is not an integer");
        }
        if (!Number.isInteger(minutes)) {
            throw new Error("minutes is not an integer");
        }
        if (!Number.isInteger(seconds)) {
            throw new Error("seconds is not an integer");
        }
        if (!Number.isInteger(milliseconds)) {
            throw new Error("milliseconds is not an integer");
        }
        const totalMilliSeconds = (days * 3600 * 24 + hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
        if (totalMilliSeconds > maxMilliSeconds || totalMilliSeconds < minMilliSeconds) {
            throw new Error("Total number of milliseconds was either too large or too small");
        }
        this._ticks = totalMilliSeconds * ticksPerMillisecond;
    }
    /**
     * Returns a new TimeSpan object whose value is the sum of the specified TimeSpan object and this instance.
     * @param ts - The time interval to add.
     */
    add(ts) {
        if (TimeSpan.additionDoesOverflow(this._ticks, ts._ticks)) {
            throw new Error("Adding the two timestamps causes an overflow.");
        }
        const results = this._ticks + ts._ticks;
        return TimeSpan.fromTicks(results);
    }
    /**
     * Returns a new TimeSpan object whose value is the difference of the specified TimeSpan object and this instance.
     * @param ts - The time interval to subtract.
     */
    subtract(ts) {
        if (TimeSpan.subtractionDoesUnderflow(this._ticks, ts._ticks)) {
            throw new Error("Subtracting the two timestamps causes an underflow.");
        }
        const results = this._ticks - ts._ticks;
        return TimeSpan.fromTicks(results);
    }
    /**
     * Compares this instance to a specified object and returns an integer that indicates whether this
     * instance is shorter than, equal to, or longer than the specified object.
     * @param value - The time interval to add.
     */
    compareTo(value) {
        if (value == null) {
            return 1;
        }
        if (!TimeSpan.isTimeSpan(value)) {
            throw new Error("Argument must be a TimeSpan object");
        }
        return TimeSpan.compare(this, value);
    }
    /**
     * Returns a new TimeSpan object whose value is the absolute value of the current TimeSpan object.
     */
    duration() {
        return TimeSpan.fromTicks(this._ticks >= 0 ? this._ticks : -this._ticks);
    }
    /**
     * Returns a value indicating whether this instance is equal to a specified object.
     * @param value - The time interval to check for equality.
     */
    equals(value) {
        if (TimeSpan.isTimeSpan(value)) {
            return this._ticks === value._ticks;
        }
        return false;
    }
    /**
     * Returns a new TimeSpan object whose value is the negated value of this instance.
     * @param value - The time interval to check for equality.
     */
    negate() {
        return TimeSpan.fromTicks(-this._ticks);
    }
    days() {
        return Math.floor(this._ticks / ticksPerDay);
    }
    hours() {
        return Math.floor(this._ticks / ticksPerHour);
    }
    milliseconds() {
        return Math.floor(this._ticks / ticksPerMillisecond);
    }
    seconds() {
        return Math.floor(this._ticks / ticksPerSecond);
    }
    ticks() {
        return this._ticks;
    }
    totalDays() {
        return this._ticks * daysPerTick;
    }
    totalHours() {
        return this._ticks * hoursPerTick;
    }
    totalMilliseconds() {
        return this._ticks * millisecondsPerTick;
    }
    totalMinutes() {
        return this._ticks * minutesPerTick;
    }
    totalSeconds() {
        return this._ticks * secondsPerTick;
    }
    static fromTicks(value) {
        const timeSpan = new TimeSpan(0, 0, 0, 0, 0);
        timeSpan._ticks = value;
        return timeSpan;
    }
    static isTimeSpan(timespan) {
        return timespan._ticks;
    }
    static additionDoesOverflow(a, b) {
        const c = a + b;
        return a !== c - b || b !== c - a;
    }
    static subtractionDoesUnderflow(a, b) {
        const c = a - b;
        return a !== c + b || b !== a - c;
    }
    static compare(t1, t2) {
        if (t1._ticks > t2._ticks) {
            return 1;
        }
        if (t1._ticks < t2._ticks) {
            return -1;
        }
        return 0;
    }
    static interval(value, scale) {
        if (isNaN(value)) {
            throw new Error("value must be a number");
        }
        const milliseconds = value * scale;
        if (milliseconds > maxMilliSeconds || milliseconds < minMilliSeconds) {
            throw new Error("timespan too long");
        }
        return TimeSpan.fromTicks(Math.floor(milliseconds * ticksPerMillisecond));
    }
    static fromMilliseconds(value) {
        return TimeSpan.interval(value, 1);
    }
    static fromSeconds(value) {
        return TimeSpan.interval(value, millisPerSecond);
    }
    static fromMinutes(value) {
        return TimeSpan.interval(value, millisPerMinute);
    }
    static fromHours(value) {
        return TimeSpan.interval(value, millisPerHour);
    }
    static fromDays(value) {
        return TimeSpan.interval(value, millisPerDay);
    }
}
TimeSpan.zero = new TimeSpan(0, 0, 0, 0, 0);
TimeSpan.maxValue = TimeSpan.fromTicks(Number.MAX_SAFE_INTEGER);
TimeSpan.minValue = TimeSpan.fromTicks(Number.MIN_SAFE_INTEGER);

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
function parseDelimitedString(delimitedString) {
    if (delimitedString == null) {
        throw new Error("delimitedString is null or undefined");
    }
    const metrics = {};
    const headerAttributes = delimitedString.split(";");
    for (const attribute of headerAttributes) {
        const attributeKeyValue = attribute.split("=");
        if (attributeKeyValue.length !== 2) {
            throw new Error("recieved a malformed delimited string");
        }
        const attributeKey = attributeKeyValue[0];
        const attributeValue = parseFloat(attributeKeyValue[1]);
        metrics[attributeKey] = attributeValue;
    }
    return metrics;
}
/**
 * @hidden
 */
function timeSpanFromMetrics(metrics /* TODO: any */, key) {
    if (key in metrics) {
        return TimeSpan.fromMilliseconds(metrics[key]);
    }
    return TimeSpan.zero;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class QueryPreparationTimes {
    constructor(queryCompilationTime, logicalPlanBuildTime, physicalPlanBuildTime, queryOptimizationTime) {
        this.queryCompilationTime = queryCompilationTime;
        this.logicalPlanBuildTime = logicalPlanBuildTime;
        this.physicalPlanBuildTime = physicalPlanBuildTime;
        this.queryOptimizationTime = queryOptimizationTime;
    }
    /**
     * returns a new QueryPreparationTimes instance that is the addition of this and the arguments.
     */
    add(...queryPreparationTimesArray) {
        let queryCompilationTime = this.queryCompilationTime;
        let logicalPlanBuildTime = this.logicalPlanBuildTime;
        let physicalPlanBuildTime = this.physicalPlanBuildTime;
        let queryOptimizationTime = this.queryOptimizationTime;
        for (const queryPreparationTimes of queryPreparationTimesArray) {
            if (queryPreparationTimes == null) {
                throw new Error("queryPreparationTimesArray has null or undefined item(s)");
            }
            queryCompilationTime = queryCompilationTime.add(queryPreparationTimes.queryCompilationTime);
            logicalPlanBuildTime = logicalPlanBuildTime.add(queryPreparationTimes.logicalPlanBuildTime);
            physicalPlanBuildTime = physicalPlanBuildTime.add(queryPreparationTimes.physicalPlanBuildTime);
            queryOptimizationTime = queryOptimizationTime.add(queryPreparationTimes.queryOptimizationTime);
        }
        return new QueryPreparationTimes(queryCompilationTime, logicalPlanBuildTime, physicalPlanBuildTime, queryOptimizationTime);
    }
    /**
     * Output the QueryPreparationTimes as a delimited string.
     */
    toDelimitedString() {
        return (`${QueryMetricsConstants.QueryCompileTimeInMs}=${this.queryCompilationTime.totalMilliseconds()};` +
            `${QueryMetricsConstants.LogicalPlanBuildTimeInMs}=${this.logicalPlanBuildTime.totalMilliseconds()};` +
            `${QueryMetricsConstants.PhysicalPlanBuildTimeInMs}=${this.physicalPlanBuildTime.totalMilliseconds()};` +
            `${QueryMetricsConstants.QueryOptimizationTimeInMs}=${this.queryOptimizationTime.totalMilliseconds()}`);
    }
    /**
     * Returns a new instance of the QueryPreparationTimes class that is the
     * aggregation of an array of QueryPreparationTimes.
     */
    static createFromArray(queryPreparationTimesArray) {
        if (queryPreparationTimesArray == null) {
            throw new Error("queryPreparationTimesArray is null or undefined item(s)");
        }
        return QueryPreparationTimes.zero.add(...queryPreparationTimesArray);
    }
    /**
     * Returns a new instance of the QueryPreparationTimes class this is deserialized from a delimited string.
     */
    static createFromDelimitedString(delimitedString) {
        const metrics = parseDelimitedString(delimitedString);
        return new QueryPreparationTimes(timeSpanFromMetrics(metrics, QueryMetricsConstants.QueryCompileTimeInMs), timeSpanFromMetrics(metrics, QueryMetricsConstants.LogicalPlanBuildTimeInMs), timeSpanFromMetrics(metrics, QueryMetricsConstants.PhysicalPlanBuildTimeInMs), timeSpanFromMetrics(metrics, QueryMetricsConstants.QueryOptimizationTimeInMs));
    }
}
QueryPreparationTimes.zero = new QueryPreparationTimes(TimeSpan.zero, TimeSpan.zero, TimeSpan.zero, TimeSpan.zero);

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class RuntimeExecutionTimes {
    constructor(queryEngineExecutionTime, systemFunctionExecutionTime, userDefinedFunctionExecutionTime) {
        this.queryEngineExecutionTime = queryEngineExecutionTime;
        this.systemFunctionExecutionTime = systemFunctionExecutionTime;
        this.userDefinedFunctionExecutionTime = userDefinedFunctionExecutionTime;
    }
    /**
     * returns a new RuntimeExecutionTimes instance that is the addition of this and the arguments.
     */
    add(...runtimeExecutionTimesArray) {
        let queryEngineExecutionTime = this.queryEngineExecutionTime;
        let systemFunctionExecutionTime = this.systemFunctionExecutionTime;
        let userDefinedFunctionExecutionTime = this.userDefinedFunctionExecutionTime;
        for (const runtimeExecutionTimes of runtimeExecutionTimesArray) {
            if (runtimeExecutionTimes == null) {
                throw new Error("runtimeExecutionTimes has null or undefined item(s)");
            }
            queryEngineExecutionTime = queryEngineExecutionTime.add(runtimeExecutionTimes.queryEngineExecutionTime);
            systemFunctionExecutionTime = systemFunctionExecutionTime.add(runtimeExecutionTimes.systemFunctionExecutionTime);
            userDefinedFunctionExecutionTime = userDefinedFunctionExecutionTime.add(runtimeExecutionTimes.userDefinedFunctionExecutionTime);
        }
        return new RuntimeExecutionTimes(queryEngineExecutionTime, systemFunctionExecutionTime, userDefinedFunctionExecutionTime);
    }
    /**
     * Output the RuntimeExecutionTimes as a delimited string.
     */
    toDelimitedString() {
        return (`${QueryMetricsConstants.SystemFunctionExecuteTimeInMs}=${this.systemFunctionExecutionTime.totalMilliseconds()};` +
            `${QueryMetricsConstants.UserDefinedFunctionExecutionTimeInMs}=${this.userDefinedFunctionExecutionTime.totalMilliseconds()}`);
    }
    /**
     * Returns a new instance of the RuntimeExecutionTimes class that is
     *  the aggregation of an array of RuntimeExecutionTimes.
     */
    static createFromArray(runtimeExecutionTimesArray) {
        if (runtimeExecutionTimesArray == null) {
            throw new Error("runtimeExecutionTimesArray is null or undefined item(s)");
        }
        return RuntimeExecutionTimes.zero.add(...runtimeExecutionTimesArray);
    }
    /**
     * Returns a new instance of the RuntimeExecutionTimes class this is deserialized from a delimited string.
     */
    static createFromDelimitedString(delimitedString) {
        const metrics = parseDelimitedString(delimitedString);
        const vmExecutionTime = timeSpanFromMetrics(metrics, QueryMetricsConstants.VMExecutionTimeInMs);
        const indexLookupTime = timeSpanFromMetrics(metrics, QueryMetricsConstants.IndexLookupTimeInMs);
        const documentLoadTime = timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentLoadTimeInMs);
        const documentWriteTime = timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentWriteTimeInMs);
        let queryEngineExecutionTime = TimeSpan.zero;
        queryEngineExecutionTime = queryEngineExecutionTime.add(vmExecutionTime);
        queryEngineExecutionTime = queryEngineExecutionTime.subtract(indexLookupTime);
        queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentLoadTime);
        queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentWriteTime);
        return new RuntimeExecutionTimes(queryEngineExecutionTime, timeSpanFromMetrics(metrics, QueryMetricsConstants.SystemFunctionExecuteTimeInMs), timeSpanFromMetrics(metrics, QueryMetricsConstants.UserDefinedFunctionExecutionTimeInMs));
    }
}
RuntimeExecutionTimes.zero = new RuntimeExecutionTimes(TimeSpan.zero, TimeSpan.zero, TimeSpan.zero);

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class QueryMetrics {
    constructor(retrievedDocumentCount, retrievedDocumentSize, outputDocumentCount, outputDocumentSize, indexHitDocumentCount, totalQueryExecutionTime, queryPreparationTimes, indexLookupTime, documentLoadTime, vmExecutionTime, runtimeExecutionTimes, documentWriteTime, clientSideMetrics) {
        this.retrievedDocumentCount = retrievedDocumentCount;
        this.retrievedDocumentSize = retrievedDocumentSize;
        this.outputDocumentCount = outputDocumentCount;
        this.outputDocumentSize = outputDocumentSize;
        this.indexHitDocumentCount = indexHitDocumentCount;
        this.totalQueryExecutionTime = totalQueryExecutionTime;
        this.queryPreparationTimes = queryPreparationTimes;
        this.indexLookupTime = indexLookupTime;
        this.documentLoadTime = documentLoadTime;
        this.vmExecutionTime = vmExecutionTime;
        this.runtimeExecutionTimes = runtimeExecutionTimes;
        this.documentWriteTime = documentWriteTime;
        this.clientSideMetrics = clientSideMetrics;
    }
    /**
     * Gets the IndexHitRatio
     * @hidden
     */
    get indexHitRatio() {
        return this.retrievedDocumentCount === 0
            ? 1
            : this.indexHitDocumentCount / this.retrievedDocumentCount;
    }
    /**
     * returns a new QueryMetrics instance that is the addition of this and the arguments.
     */
    add(queryMetricsArray) {
        let retrievedDocumentCount = 0;
        let retrievedDocumentSize = 0;
        let outputDocumentCount = 0;
        let outputDocumentSize = 0;
        let indexHitDocumentCount = 0;
        let totalQueryExecutionTime = TimeSpan.zero;
        const queryPreparationTimesArray = [];
        let indexLookupTime = TimeSpan.zero;
        let documentLoadTime = TimeSpan.zero;
        let vmExecutionTime = TimeSpan.zero;
        const runtimeExecutionTimesArray = [];
        let documentWriteTime = TimeSpan.zero;
        const clientSideQueryMetricsArray = [];
        queryMetricsArray.push(this);
        for (const queryMetrics of queryMetricsArray) {
            if (queryMetrics) {
                retrievedDocumentCount += queryMetrics.retrievedDocumentCount;
                retrievedDocumentSize += queryMetrics.retrievedDocumentSize;
                outputDocumentCount += queryMetrics.outputDocumentCount;
                outputDocumentSize += queryMetrics.outputDocumentSize;
                indexHitDocumentCount += queryMetrics.indexHitDocumentCount;
                totalQueryExecutionTime = totalQueryExecutionTime.add(queryMetrics.totalQueryExecutionTime);
                queryPreparationTimesArray.push(queryMetrics.queryPreparationTimes);
                indexLookupTime = indexLookupTime.add(queryMetrics.indexLookupTime);
                documentLoadTime = documentLoadTime.add(queryMetrics.documentLoadTime);
                vmExecutionTime = vmExecutionTime.add(queryMetrics.vmExecutionTime);
                runtimeExecutionTimesArray.push(queryMetrics.runtimeExecutionTimes);
                documentWriteTime = documentWriteTime.add(queryMetrics.documentWriteTime);
                clientSideQueryMetricsArray.push(queryMetrics.clientSideMetrics);
            }
        }
        return new QueryMetrics(retrievedDocumentCount, retrievedDocumentSize, outputDocumentCount, outputDocumentSize, indexHitDocumentCount, totalQueryExecutionTime, QueryPreparationTimes.createFromArray(queryPreparationTimesArray), indexLookupTime, documentLoadTime, vmExecutionTime, RuntimeExecutionTimes.createFromArray(runtimeExecutionTimesArray), documentWriteTime, ClientSideMetrics.createFromArray(...clientSideQueryMetricsArray));
    }
    /**
     * Output the QueryMetrics as a delimited string.
     * @hidden
     */
    toDelimitedString() {
        return (QueryMetricsConstants.RetrievedDocumentCount +
            "=" +
            this.retrievedDocumentCount +
            ";" +
            QueryMetricsConstants.RetrievedDocumentSize +
            "=" +
            this.retrievedDocumentSize +
            ";" +
            QueryMetricsConstants.OutputDocumentCount +
            "=" +
            this.outputDocumentCount +
            ";" +
            QueryMetricsConstants.OutputDocumentSize +
            "=" +
            this.outputDocumentSize +
            ";" +
            QueryMetricsConstants.IndexHitRatio +
            "=" +
            this.indexHitRatio +
            ";" +
            QueryMetricsConstants.TotalQueryExecutionTimeInMs +
            "=" +
            this.totalQueryExecutionTime.totalMilliseconds() +
            ";" +
            this.queryPreparationTimes.toDelimitedString() +
            ";" +
            QueryMetricsConstants.IndexLookupTimeInMs +
            "=" +
            this.indexLookupTime.totalMilliseconds() +
            ";" +
            QueryMetricsConstants.DocumentLoadTimeInMs +
            "=" +
            this.documentLoadTime.totalMilliseconds() +
            ";" +
            QueryMetricsConstants.VMExecutionTimeInMs +
            "=" +
            this.vmExecutionTime.totalMilliseconds() +
            ";" +
            this.runtimeExecutionTimes.toDelimitedString() +
            ";" +
            QueryMetricsConstants.DocumentWriteTimeInMs +
            "=" +
            this.documentWriteTime.totalMilliseconds());
    }
    /**
     * Returns a new instance of the QueryMetrics class that is the aggregation of an array of query metrics.
     */
    static createFromArray(queryMetricsArray) {
        if (!queryMetricsArray) {
            throw new Error("queryMetricsArray is null or undefined item(s)");
        }
        return QueryMetrics.zero.add(queryMetricsArray);
    }
    /**
     * Returns a new instance of the QueryMetrics class this is deserialized from a delimited string.
     */
    static createFromDelimitedString(delimitedString, clientSideMetrics) {
        const metrics = parseDelimitedString(delimitedString);
        const indexHitRatio = metrics[QueryMetricsConstants.IndexHitRatio] || 0;
        const retrievedDocumentCount = metrics[QueryMetricsConstants.RetrievedDocumentCount] || 0;
        const indexHitCount = indexHitRatio * retrievedDocumentCount;
        const outputDocumentCount = metrics[QueryMetricsConstants.OutputDocumentCount] || 0;
        const outputDocumentSize = metrics[QueryMetricsConstants.OutputDocumentSize] || 0;
        const retrievedDocumentSize = metrics[QueryMetricsConstants.RetrievedDocumentSize] || 0;
        const totalQueryExecutionTime = timeSpanFromMetrics(metrics, QueryMetricsConstants.TotalQueryExecutionTimeInMs);
        return new QueryMetrics(retrievedDocumentCount, retrievedDocumentSize, outputDocumentCount, outputDocumentSize, indexHitCount, totalQueryExecutionTime, QueryPreparationTimes.createFromDelimitedString(delimitedString), timeSpanFromMetrics(metrics, QueryMetricsConstants.IndexLookupTimeInMs), timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentLoadTimeInMs), timeSpanFromMetrics(metrics, QueryMetricsConstants.VMExecutionTimeInMs), RuntimeExecutionTimes.createFromDelimitedString(delimitedString), timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentWriteTimeInMs), clientSideMetrics || ClientSideMetrics.zero);
    }
}
QueryMetrics.zero = new QueryMetrics(0, 0, 0, 0, 0, TimeSpan.zero, QueryPreparationTimes.zero, TimeSpan.zero, TimeSpan.zero, TimeSpan.zero, RuntimeExecutionTimes.zero, TimeSpan.zero, ClientSideMetrics.zero);

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
// TODO: docs
function getRequestChargeIfAny(headers) {
    if (typeof headers === "number") {
        return headers;
    }
    else if (typeof headers === "string") {
        return parseFloat(headers);
    }
    if (headers) {
        const rc = headers[Constants$1.HttpHeaders.RequestCharge];
        if (rc) {
            return parseFloat(rc);
        }
        else {
            return 0;
        }
    }
    else {
        return 0;
    }
}
/**
 * @hidden
 */
function getInitialHeader() {
    const headers = {};
    headers[Constants$1.HttpHeaders.RequestCharge] = 0;
    headers[Constants$1.HttpHeaders.QueryMetrics] = {};
    return headers;
}
/**
 * @hidden
 */
// TODO: The name of this method isn't very accurate to what it does
function mergeHeaders(headers, toBeMergedHeaders) {
    if (headers[Constants$1.HttpHeaders.RequestCharge] === undefined) {
        headers[Constants$1.HttpHeaders.RequestCharge] = 0;
    }
    if (headers[Constants$1.HttpHeaders.QueryMetrics] === undefined) {
        headers[Constants$1.HttpHeaders.QueryMetrics] = QueryMetrics.zero;
    }
    if (!toBeMergedHeaders) {
        return;
    }
    headers[Constants$1.HttpHeaders.RequestCharge] += getRequestChargeIfAny(toBeMergedHeaders);
    if (toBeMergedHeaders[Constants$1.HttpHeaders.IsRUPerMinuteUsed]) {
        headers[Constants$1.HttpHeaders.IsRUPerMinuteUsed] =
            toBeMergedHeaders[Constants$1.HttpHeaders.IsRUPerMinuteUsed];
    }
    if (Constants$1.HttpHeaders.QueryMetrics in toBeMergedHeaders) {
        const headerQueryMetrics = headers[Constants$1.HttpHeaders.QueryMetrics];
        const toBeMergedHeaderQueryMetrics = toBeMergedHeaders[Constants$1.HttpHeaders.QueryMetrics];
        for (const partitionId in toBeMergedHeaderQueryMetrics) {
            if (headerQueryMetrics[partitionId]) {
                const combinedQueryMetrics = headerQueryMetrics[partitionId].add([
                    toBeMergedHeaderQueryMetrics[partitionId],
                ]);
                headerQueryMetrics[partitionId] = combinedQueryMetrics;
            }
            else {
                headerQueryMetrics[partitionId] = toBeMergedHeaderQueryMetrics[partitionId];
            }
        }
    }
    if (Constants$1.HttpHeaders.IndexUtilization in toBeMergedHeaders) {
        headers[Constants$1.HttpHeaders.IndexUtilization] =
            toBeMergedHeaders[Constants$1.HttpHeaders.IndexUtilization];
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class IndexUtilizationInfo {
    constructor(UtilizedSingleIndexes, PotentialSingleIndexes, UtilizedCompositeIndexes, PotentialCompositeIndexes) {
        this.UtilizedSingleIndexes = UtilizedSingleIndexes;
        this.PotentialSingleIndexes = PotentialSingleIndexes;
        this.UtilizedCompositeIndexes = UtilizedCompositeIndexes;
        this.PotentialCompositeIndexes = PotentialCompositeIndexes;
    }
    static tryCreateFromDelimitedBase64String(delimitedString, out) {
        if (delimitedString == null) {
            out.result = IndexUtilizationInfo.Empty;
            return false;
        }
        return IndexUtilizationInfo.tryCreateFromDelimitedString(Buffer.from(delimitedString, "base64").toString(), out);
    }
    static tryCreateFromDelimitedString(delimitedString, out) {
        if (delimitedString == null) {
            out.result = IndexUtilizationInfo.Empty;
            return false;
        }
        try {
            out.result = JSON.parse(delimitedString) || IndexUtilizationInfo.Empty;
            return true;
        }
        catch (error) {
            out.result = IndexUtilizationInfo.Empty;
            return false;
        }
    }
    static createFromString(delimitedString, isBase64Encoded) {
        var _a;
        const result = { result: undefined };
        if (isBase64Encoded) {
            IndexUtilizationInfo.tryCreateFromDelimitedBase64String(delimitedString, result);
        }
        else {
            IndexUtilizationInfo.tryCreateFromDelimitedString(delimitedString, result);
        }
        return (_a = result.result) !== null && _a !== void 0 ? _a : IndexUtilizationInfo.Empty;
    }
}
IndexUtilizationInfo.Empty = new IndexUtilizationInfo([], [], [], []);

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var Constants = {
    IndexUtilizationInfo: "Index Utilization Information",
    UtilizedSingleIndexes: "Utilized Single Indexes",
    PotentialSingleIndexes: "Potential Single Indexes",
    UtilizedCompositeIndexes: "Utilized Composite Indexes",
    PotentialCompositeIndexes: "Potential Composite Indexes",
    IndexExpression: "Index Spec",
    IndexImpactScore: "Index Impact Score",
    IndexUtilizationSeparator: "---",
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class IndexMetricWriter {
    writeIndexMetrics(indexUtilizationInfo) {
        let result = "";
        result = this.writeBeforeIndexUtilizationInfo(result);
        result = this.writeIndexUtilizationInfo(result, indexUtilizationInfo);
        result = this.writeAfterIndexUtilizationInfo(result);
        return result;
    }
    writeBeforeIndexUtilizationInfo(result) {
        result = this.appendNewlineToResult(result);
        result = this.appendHeaderToResult(result, Constants.IndexUtilizationInfo, 0);
        return result;
    }
    writeIndexUtilizationInfo(result, indexUtilizationInfo) {
        result = this.appendHeaderToResult(result, Constants.UtilizedSingleIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.UtilizedSingleIndexes) {
            result = this.writeSingleIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        result = this.appendHeaderToResult(result, Constants.PotentialSingleIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.PotentialSingleIndexes) {
            result = this.writeSingleIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        result = this.appendHeaderToResult(result, Constants.UtilizedCompositeIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.UtilizedCompositeIndexes) {
            result = this.writeCompositeIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        result = this.appendHeaderToResult(result, Constants.PotentialCompositeIndexes, 1);
        for (const indexUtilizationEntity of indexUtilizationInfo.PotentialCompositeIndexes) {
            result = this.writeCompositeIndexUtilizationEntity(result, indexUtilizationEntity);
        }
        return result;
    }
    writeAfterIndexUtilizationInfo(result) {
        return result;
    }
    writeSingleIndexUtilizationEntity(result, indexUtilizationEntity) {
        result = this.appendHeaderToResult(result, `${Constants.IndexExpression}: ${indexUtilizationEntity.IndexSpec}`, 2);
        result = this.appendHeaderToResult(result, `${Constants.IndexImpactScore}: ${indexUtilizationEntity.IndexImpactScore}`, 2);
        result = this.appendHeaderToResult(result, Constants.IndexUtilizationSeparator, 2);
        return result;
    }
    writeCompositeIndexUtilizationEntity(result, indexUtilizationEntity) {
        result = this.appendHeaderToResult(result, `${Constants.IndexExpression}: ${indexUtilizationEntity.IndexSpecs.join(", ")}`, 2);
        result = this.appendHeaderToResult(result, `${Constants.IndexImpactScore}: ${indexUtilizationEntity.IndexImpactScore}`, 2);
        result = this.appendHeaderToResult(result, Constants.IndexUtilizationSeparator, 2);
        return result;
    }
    appendNewlineToResult(result) {
        return this.appendHeaderToResult(result, "", 0);
    }
    appendHeaderToResult(result, headerTitle, indentLevel) {
        const Indent = "  ";
        const header = `${Indent.repeat(indentLevel)}${headerTitle}\n`;
        result += header;
        return result;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class FeedResponse {
    constructor(resources, headers, hasMoreResults, diagnostics) {
        this.resources = resources;
        this.headers = headers;
        this.hasMoreResults = hasMoreResults;
        this.diagnostics = diagnostics;
    }
    get continuation() {
        return this.continuationToken;
    }
    get continuationToken() {
        return this.headers[Constants$1.HttpHeaders.Continuation];
    }
    get queryMetrics() {
        return this.headers[Constants$1.HttpHeaders.QueryMetrics];
    }
    get requestCharge() {
        return getRequestChargeIfAny(this.headers);
    }
    get activityId() {
        return this.headers[Constants$1.HttpHeaders.ActivityId];
    }
    get indexMetrics() {
        const writer = new IndexMetricWriter();
        const indexUtilizationInfo = IndexUtilizationInfo.createFromString(this.headers[Constants$1.HttpHeaders.IndexUtilization], true);
        return writer.writeIndexMetrics(indexUtilizationInfo);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
const TimeoutErrorCode = "TimeoutError";
class TimeoutError extends Error {
    constructor(message = "Timeout Error") {
        super(message);
        this.code = TimeoutErrorCode;
        this.name = TimeoutErrorCode;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
const RUCapPerOperationExceededErrorCode = "OPERATION_RU_LIMIT_EXCEEDED";
class RUCapPerOperationExceededError extends ErrorResponse {
    constructor(message = "Request Unit limit per Operation call exceeded", fetchedResults = []) {
        super(message);
        this.code = RUCapPerOperationExceededErrorCode;
        this.code = RUCapPerOperationExceededErrorCode;
        this.body = {
            code: RUCapPerOperationExceededErrorCode,
            message,
        };
        this.fetchedResults = fetchedResults;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * Utility function to get currentTime in UTC milliseconds.
 * @returns
 */
function getCurrentTimestampInMs() {
    return Date.now();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * Internal class to hold CosmosDiagnostic aggregate information all through the lifecycle of a request.
 * This object gathers diagnostic information throughout Client operation which may span across multiple
 * Server call, retries etc.
 * Functions - recordFailedAttempt, recordMetaDataQuery, recordEndpointContactEvent are used to ingest
 * data into the context. At the end of operation, getDiagnostics() is used to
 * get final CosmosDiagnostic object.
 */
class CosmosDiagnosticContext {
    constructor() {
        this.failedAttempts = [];
        this.metadataLookups = [];
        this.gaterwayStatistics = [];
        this.locationEndpointsContacted = new Set();
        this.requestStartTimeUTCinMs = getCurrentTimestampInMs();
    }
    recordFailedAttempt(gaterwayStatistics, retryAttemptNumber) {
        const attempt = {
            attemptNumber: retryAttemptNumber,
            startTimeUTCInMs: gaterwayStatistics.startTimeUTCInMs,
            durationInMs: gaterwayStatistics.durationInMs,
            statusCode: gaterwayStatistics.statusCode,
            substatusCode: gaterwayStatistics.subStatusCode,
            requestPayloadLengthInBytes: gaterwayStatistics.requestPayloadLengthInBytes,
            responsePayloadLengthInBytes: gaterwayStatistics.responsePayloadLengthInBytes,
            activityId: gaterwayStatistics.activityId,
            operationType: gaterwayStatistics.operationType,
            resourceType: gaterwayStatistics.resourceType,
        };
        this.failedAttempts.push(attempt);
    }
    recordNetworkCall(gaterwayStatistics) {
        this.gaterwayStatistics.push(gaterwayStatistics);
    }
    /**
     * Merge given DiagnosticContext to current node's DiagnosticContext, Treating GatewayRequests of
     * given DiagnosticContext, as metadata requests.
     */
    mergeDiagnostics(childDiagnostics, metadataType) {
        // Copy Location endpoints contacted.
        childDiagnostics.locationEndpointsContacted.forEach((endpoint) => this.locationEndpointsContacted.add(endpoint));
        // Copy child nodes's GatewayStatistics to parent's metadata lookups.
        childDiagnostics.gaterwayStatistics.forEach((gateway) => this.metadataLookups.push({
            activityId: gateway.activityId,
            requestPayloadLengthInBytes: gateway.requestPayloadLengthInBytes,
            responsePayloadLengthInBytes: gateway.responsePayloadLengthInBytes,
            startTimeUTCInMs: gateway.startTimeUTCInMs,
            operationType: gateway.operationType,
            resourceType: gateway.resourceType,
            durationInMs: gateway.durationInMs,
            metaDataType: metadataType,
        }));
        // Copy child nodes's metadata lookups to parent's metadata lookups.
        childDiagnostics.metadataLookups.forEach((lookup) => this.metadataLookups.push(lookup));
        // Copy child nodes's failed attempts to parent's failed attempts.
        childDiagnostics.failedAttempts.forEach((lookup) => this.failedAttempts.push(lookup));
    }
    getClientSideStats(endTimeUTCInMs = getCurrentTimestampInMs()) {
        return {
            requestStartTimeUTCInMs: this.requestStartTimeUTCinMs,
            requestDurationInMs: endTimeUTCInMs - this.requestStartTimeUTCinMs,
            totalRequestPayloadLengthInBytes: this.getTotalRequestPayloadLength(),
            totalResponsePayloadLengthInBytes: this.getTotalResponsePayloadLength(),
            locationEndpointsContacted: [...this.locationEndpointsContacted.values()],
            metadataDiagnostics: {
                metadataLookups: [...this.metadataLookups],
            },
            retryDiagnostics: {
                failedAttempts: [...this.failedAttempts],
            },
            gatewayStatistics: this.gaterwayStatistics,
        };
    }
    getTotalRequestPayloadLength() {
        let totalRequestPayloadLength = 0;
        this.gaterwayStatistics.forEach((req) => (totalRequestPayloadLength += req.requestPayloadLengthInBytes));
        this.metadataLookups.forEach((req) => (totalRequestPayloadLength += req.requestPayloadLengthInBytes));
        this.failedAttempts.forEach((req) => (totalRequestPayloadLength += req.requestPayloadLengthInBytes));
        return totalRequestPayloadLength;
    }
    getTotalResponsePayloadLength() {
        let totalResponsePayloadLength = 0;
        this.gaterwayStatistics.forEach((req) => (totalResponsePayloadLength += req.responsePayloadLengthInBytes));
        this.metadataLookups.forEach((req) => (totalResponsePayloadLength += req.responsePayloadLengthInBytes));
        this.failedAttempts.forEach((req) => (totalResponsePayloadLength += req.responsePayloadLengthInBytes));
        return totalResponsePayloadLength;
    }
    recordEndpointResolution(location) {
        this.locationEndpointsContacted.add(location);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 *  * This is a Cosmos Diagnostic type that holds collected diagnostic information during a client operations. ie. Item.read(), Container.create().
 * It has three members -
 * 1. `clientSideRequestStatistics` member contains aggregate diagnostic information, including -
 *   - metadata lookups. Here all the server requests, apart from the final intended resource are considered as metadata calls.
 *    i.e. for item.read(id), if the client makes server call to discover endpoints it would be considered as metadata call.
 *   - retries
 *   - endpoints contacted.
 *   - request, response payload stats.
 *   - gatewayStatistics - Information corresponding to main operation. For example during Item.read(), the client might perform many operations
 *    i.e. metadata lookup etc, but gatewayStatistics represents the diagnostics information for actual read operation.
 *
 * 2. diagnosticNode - Is a tree like structure which captures detailed diagnostic information. By default it is disabled, and is intended to be
 * used only for debugging on non production environments. The kind of details captured in diagnosticNode is controlled by `CosmosDbDiagnosticLevel`.
 * - CosmosDbDiagnosticLevel.info - Is default value. In this level only clientSideRequestStatistics are captured. Is is meant for production environments.
 * - CosmosDbDiagnosticLevel.debug - Captures diagnosticNode and clientConfig. No request and response payloads are captured. Is not meant to be used
 * in production environment.
 * - CosmosDbDiagnosticLevel.debug-unsafe - In addition to data captured in CosmosDbDiagnosticLevel.debug, also captures request and response payloads.
 * Is not meant to be used in production environment.
 * 3. clientConfig - Captures information related to how client was configured during initialization.
 */
class CosmosDiagnostics {
    /**
     * @internal
     */
    constructor(clientSideRequestStatistics, diagnosticNode, clientConfig) {
        this.clientSideRequestStatistics = clientSideRequestStatistics;
        this.diagnosticNode = diagnosticNode;
        this.clientConfig = clientConfig;
    }
}
/**
 * This is enum for Type of Metadata lookups possible.
 */
exports.MetadataLookUpType = void 0;
(function (MetadataLookUpType) {
    MetadataLookUpType["PartitionKeyRangeLookUp"] = "PARTITION_KEY_RANGE_LOOK_UP";
    MetadataLookUpType["DatabaseAccountLookUp"] = "DATABASE_ACCOUNT_LOOK_UP";
    MetadataLookUpType["QueryPlanLookUp"] = "QUERY_PLAN_LOOK_UP";
    MetadataLookUpType["DatabaseLookUp"] = "DATABASE_LOOK_UP";
    MetadataLookUpType["ContainerLookUp"] = "CONTAINER_LOOK_UP";
})(exports.MetadataLookUpType || (exports.MetadataLookUpType = {}));
function getRootNode(node) {
    if (node.parent)
        return getRootNode(node.parent);
    else
        return node;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Cosmos DB Diagnostic Level
 */
exports.CosmosDbDiagnosticLevel = void 0;
(function (CosmosDbDiagnosticLevel) {
    CosmosDbDiagnosticLevel["info"] = "info";
    CosmosDbDiagnosticLevel["debug"] = "debug";
    CosmosDbDiagnosticLevel["debugUnsafe"] = "debug-unsafe";
})(exports.CosmosDbDiagnosticLevel || (exports.CosmosDbDiagnosticLevel = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
const CosmosDbDiagnosticLevelOrder = [
    exports.CosmosDbDiagnosticLevel.info,
    exports.CosmosDbDiagnosticLevel.debug,
    exports.CosmosDbDiagnosticLevel.debugUnsafe,
];
/**
 * @hidden
 */
function allowTracing(levelToCheck, clientDiagnosticLevel) {
    const indexOfDiagnosticLevelToCheck = CosmosDbDiagnosticLevelOrder.indexOf(levelToCheck);
    const indexOfClientDiagnosticLevel = CosmosDbDiagnosticLevelOrder.indexOf(clientDiagnosticLevel);
    if (indexOfDiagnosticLevelToCheck === -1 || indexOfClientDiagnosticLevel === -1) {
        return false;
    }
    return indexOfDiagnosticLevelToCheck <= indexOfClientDiagnosticLevel;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * This is Internal Representation for DiagnosticNode. It contains useful helper functions to collect
 * diagnostic information throughout the lifetime of Diagnostic session.
 * The functions toDiagnosticNode() & toDiagnostic() are given to convert it to public facing counterpart.
 */
class DiagnosticNodeInternal {
    /**
     * @internal
     */
    constructor(diagnosticLevel, type, parent, data = {}, startTimeUTCInMs = getCurrentTimestampInMs(), ctx = new CosmosDiagnosticContext()) {
        this.id = uuid$3.v4();
        this.nodeType = type;
        this.startTimeUTCInMs = startTimeUTCInMs;
        this.data = data;
        this.children = [];
        this.durationInMs = 0;
        this.parent = parent;
        this.diagnosticCtx = ctx;
        this.diagnosticLevel = diagnosticLevel;
    }
    /**
     * @internal
     */
    addLog(msg) {
        if (!this.data.log) {
            this.data.log = [];
        }
        this.data.log.push(msg);
    }
    /**
     * @internal
     */
    sanitizeHeaders(headers) {
        return headers;
    }
    /**
     * Updated durationInMs for node, based on endTimeUTCInMs provided.
     * @internal
     */
    updateTimestamp(endTimeUTCInMs = getCurrentTimestampInMs()) {
        this.durationInMs = endTimeUTCInMs - this.startTimeUTCInMs;
    }
    /**
     * @internal
     */
    recordSuccessfulNetworkCall(startTimeUTCInMs, requestContext, pipelineResponse, substatus, url) {
        const responseHeaders = pipelineResponse.headers.toJSON();
        const gatewayRequest = {
            activityId: responseHeaders[Constants$1.HttpHeaders.ActivityId],
            startTimeUTCInMs,
            durationInMs: getCurrentTimestampInMs() - startTimeUTCInMs,
            statusCode: pipelineResponse.status,
            subStatusCode: substatus,
            requestPayloadLengthInBytes: calculateRequestPayloadLength(requestContext),
            responsePayloadLengthInBytes: calculateResponsePayloadLength(pipelineResponse),
            operationType: requestContext.operationType,
            resourceType: requestContext.resourceType,
            partitionKeyRangeId: requestContext.partitionKeyRangeId,
        };
        let requestData = {
            OperationType: gatewayRequest.operationType,
            resourceType: gatewayRequest.resourceType,
            requestPayloadLengthInBytes: gatewayRequest.requestPayloadLengthInBytes,
        };
        if (allowTracing(exports.CosmosDbDiagnosticLevel.debugUnsafe, this.diagnosticLevel)) {
            requestData = Object.assign(Object.assign({}, requestData), { headers: this.sanitizeHeaders(requestContext.headers), requestBody: requestContext.body, responseBody: pipelineResponse.bodyAsText, url: url });
        }
        this.addData({
            requestPayloadLengthInBytes: gatewayRequest.requestPayloadLengthInBytes,
            responsePayloadLengthInBytes: gatewayRequest.responsePayloadLengthInBytes,
            startTimeUTCInMs: gatewayRequest.startTimeUTCInMs,
            durationInMs: gatewayRequest.durationInMs,
            requestData,
        });
        this.diagnosticCtx.recordNetworkCall(gatewayRequest);
    }
    /**
     * @internal
     */
    recordFailedNetworkCall(startTimeUTCInMs, requestContext, retryAttemptNumber, statusCode, substatusCode, responseHeaders) {
        this.addData({ failedAttempty: true });
        const requestPayloadLengthInBytes = calculateRequestPayloadLength(requestContext);
        this.diagnosticCtx.recordFailedAttempt({
            activityId: responseHeaders[Constants$1.HttpHeaders.ActivityId],
            startTimeUTCInMs,
            durationInMs: getCurrentTimestampInMs() - startTimeUTCInMs,
            statusCode,
            subStatusCode: substatusCode,
            requestPayloadLengthInBytes,
            responsePayloadLengthInBytes: 0,
            operationType: requestContext.operationType,
            resourceType: requestContext.resourceType,
        }, retryAttemptNumber);
        let requestData = {
            OperationType: requestContext.operationType,
            resourceType: requestContext.resourceType,
            requestPayloadLengthInBytes,
        };
        if (allowTracing(exports.CosmosDbDiagnosticLevel.debugUnsafe, this.diagnosticLevel)) {
            requestData = Object.assign(Object.assign({}, requestData), { headers: this.sanitizeHeaders(requestContext.headers), requestBody: requestContext.body, url: prepareURL(requestContext.endpoint, requestContext.path) });
        }
        this.addData({
            failedAttempty: true,
            requestData,
        });
    }
    /**
     * @internal
     */
    recordEndpointResolution(location) {
        this.addData({ selectedLocation: location });
        this.diagnosticCtx.recordEndpointResolution(location);
    }
    /**
     * @internal
     */
    addData(data, msg, level = this.diagnosticLevel) {
        if (level !== exports.CosmosDbDiagnosticLevel.info) {
            this.data = Object.assign(Object.assign({}, this.data), data);
            if (msg) {
                this.addLog(msg);
            }
        }
    }
    /**
     * Merge given DiagnosticNodeInternal's context to current node's DiagnosticContext, Treating GatewayRequests of
     * given DiagnosticContext, as metadata requests. Given DiagnosticNodeInternal becomes a child of this node.
     * @internal
     */
    addChildNode(child, level, metadataType) {
        this.diagnosticCtx.mergeDiagnostics(child.diagnosticCtx, metadataType);
        if (allowTracing(level, this.diagnosticLevel)) {
            child.parent = this;
            this.children.push(child);
        }
        return child;
    }
    /**
     * @internal
     */
    initializeChildNode(type, level, data = {}) {
        if (allowTracing(level, this.diagnosticLevel)) {
            const child = new DiagnosticNodeInternal(this.diagnosticLevel, type, this, data, getCurrentTimestampInMs(), this.diagnosticCtx);
            this.children.push(child);
            return child;
        }
        else {
            return this;
        }
    }
    /**
     * @internal
     */
    recordQueryResult(resources, level) {
        var _a;
        if (allowTracing(level, this.diagnosticLevel)) {
            const previousCount = (_a = this.data.queryRecordsRead) !== null && _a !== void 0 ? _a : 0;
            if (Array.isArray(resources)) {
                this.data.queryRecordsRead = previousCount + resources.length;
            }
        }
    }
    /**
     * Convert DiagnosticNodeInternal (internal representation) to DiagnosticNode (public, sanitized representation)
     * @internal
     */
    toDiagnosticNode() {
        return {
            id: this.id,
            nodeType: this.nodeType,
            children: this.children.map((child) => child.toDiagnosticNode()),
            data: this.data,
            startTimeUTCInMs: this.startTimeUTCInMs,
            durationInMs: this.durationInMs,
        };
    }
    /**
     * Convert to CosmosDiagnostics
     * @internal
     */
    toDiagnostic(clientConfigDiagnostic) {
        const rootNode = getRootNode(this);
        const diagnostiNode = allowTracing(exports.CosmosDbDiagnosticLevel.debug, this.diagnosticLevel)
            ? rootNode.toDiagnosticNode()
            : undefined;
        const clientConfig = allowTracing(exports.CosmosDbDiagnosticLevel.debug, this.diagnosticLevel)
            ? clientConfigDiagnostic
            : undefined;
        const cosmosDiagnostic = new CosmosDiagnostics(this.diagnosticCtx.getClientSideStats(), diagnostiNode, clientConfig);
        return cosmosDiagnostic;
    }
}
/**
 * @hidden
 */
exports.DiagnosticNodeType = void 0;
(function (DiagnosticNodeType) {
    DiagnosticNodeType["CLIENT_REQUEST_NODE"] = "CLIENT_REQUEST_NODE";
    DiagnosticNodeType["METADATA_REQUEST_NODE"] = "METADATA_REQUEST_NODE";
    DiagnosticNodeType["HTTP_REQUEST"] = "HTTP_REQUEST";
    DiagnosticNodeType["BATCH_REQUEST"] = "BATCH_REQUEST";
    DiagnosticNodeType["PARALLEL_QUERY_NODE"] = "PARALLEL_QUERY_NODE";
    DiagnosticNodeType["DEFAULT_QUERY_NODE"] = "DEFAULT_QUERY_NODE";
    DiagnosticNodeType["QUERY_REPAIR_NODE"] = "QUERY_REPAIR_NODE";
    DiagnosticNodeType["BACKGROUND_REFRESH_THREAD"] = "BACKGROUND_REFRESH_THREAD";
    DiagnosticNodeType["REQUEST_ATTEMPTS"] = "REQUEST_ATTEMPTS";
})(exports.DiagnosticNodeType || (exports.DiagnosticNodeType = {}));
function calculateResponsePayloadLength(response) {
    var _a;
    return ((_a = response === null || response === void 0 ? void 0 : response.bodyAsText) === null || _a === void 0 ? void 0 : _a.length) || 0;
}
function calculateRequestPayloadLength(requestContext) {
    return requestContext.body ? requestContext.body.length : 0;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * Utility function to create an Empty CosmosDiagnostic object.
 */
function getEmptyCosmosDiagnostics() {
    return new CosmosDiagnostics({
        requestDurationInMs: 0,
        requestStartTimeUTCInMs: getCurrentTimestampInMs(),
        totalRequestPayloadLengthInBytes: 0,
        totalResponsePayloadLengthInBytes: 0,
        locationEndpointsContacted: [],
        retryDiagnostics: {
            failedAttempts: [],
        },
        metadataDiagnostics: {
            metadataLookups: [],
        },
        gatewayStatistics: [],
    }, {
        id: uuid$3.v4(),
        nodeType: exports.DiagnosticNodeType.CLIENT_REQUEST_NODE,
        children: [],
        data: {},
        startTimeUTCInMs: getCurrentTimestampInMs(),
        durationInMs: 0,
    });
}
/**
 * A supporting utility wrapper function, to be used inside a diagnostic session started
 * by `withDiagnostics` function.
 * Created a Diagnostic node and add it as a child to existing diagnostic session.
 * @hidden
 */
async function addDignosticChild(callback, node, type, data = {}) {
    const childNode = node.initializeChildNode(type, exports.CosmosDbDiagnosticLevel.debug, data);
    try {
        const response = await callback(childNode);
        childNode.updateTimestamp();
        return response;
    }
    catch (e) {
        childNode.addData({
            failure: true,
        });
        childNode.updateTimestamp();
        throw e;
    }
}
/**
 * A supporting utility wrapper function, to be used inside a diagnostic session started
 * by `withDiagnostics` function.
 * Treats requests originating in  provided `callback` as metadata calls.
 * To realize this, starts a temporary diagnostic session, after execution of callback is
 * finished. Merges this temporary diagnostic session to the original diagnostic session
 * represented by the input parameter `node`.
 * @hidden
 */
async function withMetadataDiagnostics(callback, node, type) {
    const diagnosticNodeForMetadataCall = new DiagnosticNodeInternal(node.diagnosticLevel, exports.DiagnosticNodeType.METADATA_REQUEST_NODE, null);
    try {
        const response = await callback(diagnosticNodeForMetadataCall);
        node.addChildNode(diagnosticNodeForMetadataCall, exports.CosmosDbDiagnosticLevel.debug, type);
        return response;
    }
    catch (e) {
        node.addChildNode(diagnosticNodeForMetadataCall, exports.CosmosDbDiagnosticLevel.debug, type);
        throw e;
    }
}
/**
 * Utility wrapper function to managed lifecycle of a Diagnostic session.
 * Meant to be used at the root of the client operation. i.e. item.read(),
 * queryIterator.fetchAll().
 *
 * This utility starts a new diagnostic session. So using it any where else
 * other than start of operation, will result is different diagnostic sessions.
 *
 * Workings :
 * 1. Takes a callback function as input.
 * 2. Creates a new instance of DiagnosticNodeInternal, which can be though as starting
 * a new diagnostic session.
 * 3. Executes the callback function.
 * 4. If execution was successful. Converts DiagnosticNodeInternal to CosmosDiagnostics
 * and injects it to the response object and returns this object.
 * 5. If execution threw an exception. Sill converts DiagnosticNodeInternal to CosmosDiagnostics
 * and injects it to the Error object, and rethrows the Error object.
 *
 * @hidden
 */
async function withDiagnostics(callback, clientContext, type = exports.DiagnosticNodeType.CLIENT_REQUEST_NODE) {
    const diagnosticNode = new DiagnosticNodeInternal(clientContext.diagnosticLevel, type, null);
    try {
        const response = await callback(diagnosticNode);
        diagnosticNode.updateTimestamp();
        const diagnostics = diagnosticNode.toDiagnostic(clientContext.getClientConfig());
        if (typeof response === "object" && response !== null) {
            response.diagnostics = diagnostics;
        }
        clientContext.recordDiagnostics(diagnostics);
        return response;
    }
    catch (e) {
        diagnosticNode.updateTimestamp();
        diagnosticNode.addData({
            failure: true,
        });
        const diagnostics = diagnosticNode.toDiagnostic(clientContext.getClientConfig());
        e.diagnostics = diagnostics;
        clientContext.recordDiagnostics(diagnostics);
        throw e;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const logger$3 = logger$5.createClientLogger("ClientContext");
/** @hidden */
var STATES;
(function (STATES) {
    STATES["start"] = "start";
    STATES["inProgress"] = "inProgress";
    STATES["ended"] = "ended";
})(STATES || (STATES = {}));
/** @hidden */
class DefaultQueryExecutionContext {
    get continuation() {
        return this.continuationToken;
    }
    /**
     * Provides the basic Query Execution Context.
     * This wraps the internal logic query execution using provided fetch functions
     *
     * @param clientContext  - Is used to read the partitionKeyRanges for split proofing
     * @param query          - A SQL query.
     * @param options        - Represents the feed options.
     * @param fetchFunctions - A function to retrieve each page of data.
     *                          An array of functions may be used to query more than one partition.
     * @hidden
     */
    constructor(options, fetchFunctions) {
        this.resources = [];
        this.currentIndex = 0;
        this.currentPartitionIndex = 0;
        this.fetchFunctions = Array.isArray(fetchFunctions) ? fetchFunctions : [fetchFunctions];
        this.options = options || {};
        this.continuationToken = this.options.continuationToken || this.options.continuation || null;
        this.state = DefaultQueryExecutionContext.STATES.start;
    }
    /**
     * Execute a provided callback on the next element in the execution context.
     */
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        ++this.currentIndex;
        const response = await this.current(diagnosticNode, operationOptions, ruConsumedManager);
        return response;
    }
    /**
     * Retrieve the current element on the execution context.
     */
    async current(diagnosticNode, operationOptions, ruConsumedManager) {
        if (this.currentIndex < this.resources.length) {
            return {
                result: this.resources[this.currentIndex],
                headers: getInitialHeader(),
            };
        }
        if (this._canFetchMore()) {
            const { result: resources, headers } = await this.fetchMore(diagnosticNode, operationOptions, ruConsumedManager);
            this.resources = resources;
            if (this.resources.length === 0) {
                if (!this.continuationToken && this.currentPartitionIndex >= this.fetchFunctions.length) {
                    this.state = DefaultQueryExecutionContext.STATES.ended;
                    return { result: undefined, headers };
                }
                else {
                    return this.current(diagnosticNode, operationOptions, ruConsumedManager);
                }
            }
            return { result: this.resources[this.currentIndex], headers };
        }
        else {
            this.state = DefaultQueryExecutionContext.STATES.ended;
            return {
                result: undefined,
                headers: getInitialHeader(),
            };
        }
    }
    /**
     * Determine if there are still remaining resources to processs based on
     * the value of the continuation token or the elements remaining on the current batch in the execution context.
     *
     * @returns true if there is other elements to process in the DefaultQueryExecutionContext.
     */
    hasMoreResults() {
        return (this.state === DefaultQueryExecutionContext.STATES.start ||
            this.continuationToken !== undefined ||
            this.currentIndex < this.resources.length - 1 ||
            this.currentPartitionIndex < this.fetchFunctions.length);
    }
    /**
     * Fetches the next batch of the feed and pass them as an array to a callback
     */
    async fetchMore(diagnosticNode, operationOptions, ruConsumedManager) {
        return addDignosticChild(async (childDiagnosticNode) => {
            if (this.currentPartitionIndex >= this.fetchFunctions.length) {
                return {
                    headers: getInitialHeader(),
                    result: undefined,
                };
            }
            // Keep to the original continuation and to restore the value after fetchFunction call
            const originalContinuation = this.options.continuationToken || this.options.continuation;
            this.options.continuationToken = this.continuationToken;
            // Return undefined if there is no more results
            if (this.currentPartitionIndex >= this.fetchFunctions.length) {
                return {
                    headers: getInitialHeader(),
                    result: undefined,
                };
            }
            let resources;
            let responseHeaders;
            try {
                let p;
                if (this.nextFetchFunction !== undefined) {
                    logger$3.verbose("using prefetch");
                    p = this.nextFetchFunction;
                    this.nextFetchFunction = undefined;
                }
                else {
                    logger$3.verbose("using fresh fetch");
                    p = this.fetchFunctions[this.currentPartitionIndex](childDiagnosticNode, this.options);
                }
                const response = await p;
                resources = response.result;
                childDiagnosticNode.recordQueryResult(resources, exports.CosmosDbDiagnosticLevel.debugUnsafe);
                responseHeaders = response.headers;
                this.continuationToken = responseHeaders[Constants$1.HttpHeaders.Continuation];
                if (!this.continuationToken) {
                    ++this.currentPartitionIndex;
                }
                if (this.options && this.options.bufferItems === true) {
                    const fetchFunction = this.fetchFunctions[this.currentPartitionIndex];
                    this.nextFetchFunction = fetchFunction
                        ? fetchFunction(childDiagnosticNode, Object.assign(Object.assign({}, this.options), { continuationToken: this.continuationToken }))
                        : undefined;
                }
            }
            catch (err) {
                this.state = DefaultQueryExecutionContext.STATES.ended;
                // return callback(err, undefined, responseHeaders);
                // TODO: Error and data being returned is an antipattern, this might broken
                throw err;
            }
            this.state = DefaultQueryExecutionContext.STATES.inProgress;
            this.currentIndex = 0;
            this.options.continuationToken = originalContinuation;
            this.options.continuation = originalContinuation;
            // deserializing query metrics so that we aren't working with delimited strings in the rest of the code base
            if (Constants$1.HttpHeaders.QueryMetrics in responseHeaders) {
                const delimitedString = responseHeaders[Constants$1.HttpHeaders.QueryMetrics];
                let queryMetrics = QueryMetrics.createFromDelimitedString(delimitedString);
                // Add the request charge to the query metrics so that we can have per partition request charge.
                if (Constants$1.HttpHeaders.RequestCharge in responseHeaders) {
                    const requestCharge = Number(responseHeaders[Constants$1.HttpHeaders.RequestCharge]) || 0;
                    queryMetrics = new QueryMetrics(queryMetrics.retrievedDocumentCount, queryMetrics.retrievedDocumentSize, queryMetrics.outputDocumentCount, queryMetrics.outputDocumentSize, queryMetrics.indexHitDocumentCount, queryMetrics.totalQueryExecutionTime, queryMetrics.queryPreparationTimes, queryMetrics.indexLookupTime, queryMetrics.documentLoadTime, queryMetrics.vmExecutionTime, queryMetrics.runtimeExecutionTimes, queryMetrics.documentWriteTime, new ClientSideMetrics(requestCharge));
                }
                // Wraping query metrics in a object where the key is '0' just so single partition
                // and partition queries have the same response schema
                responseHeaders[Constants$1.HttpHeaders.QueryMetrics] = {};
                responseHeaders[Constants$1.HttpHeaders.QueryMetrics]["0"] = queryMetrics;
            }
            if (operationOptions && operationOptions.ruCapPerOperation && ruConsumedManager) {
                await ruConsumedManager.addToRUConsumed(getRequestChargeIfAny(responseHeaders));
                const ruConsumedValue = await ruConsumedManager.getRUConsumed();
                if (ruConsumedValue > operationOptions.ruCapPerOperation) {
                    // For RUCapPerOperationExceededError error, we won't be updating the state from
                    // inProgress as we want to support continue
                    throw new RUCapPerOperationExceededError("Request Unit limit per Operation call exceeded", resources);
                }
            }
            return { result: resources, headers: responseHeaders };
        }, diagnosticNode, exports.DiagnosticNodeType.DEFAULT_QUERY_NODE, {
            queryMethodIdentifier: "fetchMore",
        });
    }
    _canFetchMore() {
        const res = this.state === DefaultQueryExecutionContext.STATES.start ||
            (this.continuationToken && this.state === DefaultQueryExecutionContext.STATES.inProgress) ||
            (this.currentPartitionIndex < this.fetchFunctions.length &&
                this.state === DefaultQueryExecutionContext.STATES.inProgress);
        return res;
    }
}
DefaultQueryExecutionContext.STATES = STATES;

/** @hidden */
class AverageAggregator {
    /**
     * Add the provided item to aggregation result.
     */
    aggregate(other) {
        if (other == null || other.sum == null) {
            return;
        }
        if (this.sum == null) {
            this.sum = 0.0;
            this.count = 0;
        }
        this.sum += other.sum;
        this.count += other.count;
    }
    /**
     * Get the aggregation result.
     */
    getResult() {
        if (this.sum == null || this.count <= 0) {
            return undefined;
        }
        return this.sum / this.count;
    }
}

/** @hidden */
class CountAggregator {
    /**
     * Represents an aggregator for COUNT operator.
     * @hidden
     */
    constructor() {
        this.value = 0;
    }
    /**
     * Add the provided item to aggregation result.
     */
    aggregate(other) {
        this.value += other;
    }
    /**
     * Get the aggregation result.
     */
    getResult() {
        return this.value;
    }
}

// TODO: this smells funny
/** @hidden */
const TYPEORDCOMPARATOR$1 = Object.freeze({
    NoValue: {
        ord: 0,
    },
    undefined: {
        ord: 1,
    },
    boolean: {
        ord: 2,
        compFunc: (a, b) => {
            return a === b ? 0 : a > b ? 1 : -1;
        },
    },
    number: {
        ord: 4,
        compFunc: (a, b) => {
            return a === b ? 0 : a > b ? 1 : -1;
        },
    },
    string: {
        ord: 5,
        compFunc: (a, b) => {
            return a === b ? 0 : a > b ? 1 : -1;
        },
    },
});
/** @hidden */
class OrderByDocumentProducerComparator {
    constructor(sortOrder) {
        this.sortOrder = sortOrder;
    } // TODO: This should be an enum
    targetPartitionKeyRangeDocProdComparator(docProd1, docProd2) {
        const a = docProd1.getTargetParitionKeyRange()["minInclusive"];
        const b = docProd2.getTargetParitionKeyRange()["minInclusive"];
        return a === b ? 0 : a > b ? 1 : -1;
    }
    compare(docProd1, docProd2) {
        // Need to check for split, since we don't want to dereference "item" of undefined / exception
        if (docProd1.gotSplit()) {
            return -1;
        }
        if (docProd2.gotSplit()) {
            return 1;
        }
        const orderByItemsRes1 = this.getOrderByItems(docProd1.peekBufferedItems()[0]);
        const orderByItemsRes2 = this.getOrderByItems(docProd2.peekBufferedItems()[0]);
        // validate order by items and types
        // TODO: once V1 order by on different types is fixed this need to change
        this.validateOrderByItems(orderByItemsRes1, orderByItemsRes2);
        // no async call in the for loop
        for (let i = 0; i < orderByItemsRes1.length; i++) {
            // compares the orderby items one by one
            const compRes = this.compareOrderByItem(orderByItemsRes1[i], orderByItemsRes2[i]);
            if (compRes !== 0) {
                if (this.sortOrder[i] === "Ascending") {
                    return compRes;
                }
                else if (this.sortOrder[i] === "Descending") {
                    return -compRes;
                }
            }
        }
        return this.targetPartitionKeyRangeDocProdComparator(docProd1, docProd2);
    }
    // TODO: This smells funny
    compareValue(item1, type1, item2, type2) {
        if (type1 === "object" || type2 === "object") {
            throw new Error("Tried to compare an object type");
        }
        const type1Ord = TYPEORDCOMPARATOR$1[type1].ord;
        const type2Ord = TYPEORDCOMPARATOR$1[type2].ord;
        const typeCmp = type1Ord - type2Ord;
        if (typeCmp !== 0) {
            // if the types are different, use type ordinal
            return typeCmp;
        }
        // both are of the same type
        if (type1Ord === TYPEORDCOMPARATOR$1["undefined"].ord ||
            type1Ord === TYPEORDCOMPARATOR$1["NoValue"].ord) {
            // if both types are undefined or Null they are equal
            return 0;
        }
        const compFunc = TYPEORDCOMPARATOR$1[type1].compFunc;
        if (typeof compFunc === "undefined") {
            throw new Error("Cannot find the comparison function");
        }
        // same type and type is defined compare the items
        return compFunc(item1, item2);
    }
    compareOrderByItem(orderByItem1, orderByItem2) {
        const type1 = this.getType(orderByItem1);
        const type2 = this.getType(orderByItem2);
        return this.compareValue(orderByItem1["item"], type1, orderByItem2["item"], type2);
    }
    validateOrderByItems(res1, res2) {
        if (res1.length !== res2.length) {
            throw new Error(`Expected ${res1.length}, but got ${res2.length}.`);
        }
        if (res1.length !== this.sortOrder.length) {
            throw new Error("orderByItems cannot have a different size than sort orders.");
        }
        for (let i = 0; i < this.sortOrder.length; i++) {
            const type1 = this.getType(res1[i]);
            const type2 = this.getType(res2[i]);
            if (type1 !== type2) {
                throw new Error(`Expected ${type1}, but got ${type2}. Cannot execute cross partition order-by queries on mixed types. Consider filtering your query using IS_STRING or IS_NUMBER to get around this exception.`);
            }
        }
    }
    getType(orderByItem) {
        // TODO: any item?
        if (orderByItem === undefined || orderByItem.item === undefined) {
            return "NoValue";
        }
        const type = typeof orderByItem.item;
        if (TYPEORDCOMPARATOR$1[type] === undefined) {
            throw new Error(`unrecognizable type ${type}`);
        }
        return type;
    }
    getOrderByItems(res) {
        // TODO: any res?
        return res["orderByItems"];
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
class MaxAggregator {
    /**
     * Represents an aggregator for MAX operator.
     * @hidden
     */
    constructor() {
        this.value = undefined;
        this.comparer = new OrderByDocumentProducerComparator(["Ascending"]);
    }
    /**
     * Add the provided item to aggregation result.
     */
    aggregate(other) {
        if (this.value === undefined) {
            this.value = other.max;
        }
        else if (this.comparer.compareValue(other.max, typeof other.max, this.value, typeof this.value) > 0) {
            this.value = other.max;
        }
    }
    /**
     * Get the aggregation result.
     */
    getResult() {
        return this.value;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
class MinAggregator {
    /**
     * Represents an aggregator for MIN operator.
     * @hidden
     */
    constructor() {
        this.value = undefined;
        this.comparer = new OrderByDocumentProducerComparator(["Ascending"]);
    }
    /**
     * Add the provided item to aggregation result.
     */
    aggregate(other) {
        if (this.value === undefined) {
            // || typeof this.value === "object"
            this.value = other.min;
        }
        else {
            const otherType = other.min === null ? "NoValue" : typeof other.min; // || typeof other === "object"
            const thisType = this.value === null ? "NoValue" : typeof this.value;
            if (this.comparer.compareValue(other.min, otherType, this.value, thisType) < 0) {
                this.value = other.min;
            }
        }
    }
    /**
     * Get the aggregation result.
     */
    getResult() {
        return this.value;
    }
}

/** @hidden */
class SumAggregator {
    /**
     * Add the provided item to aggregation result.
     */
    aggregate(other) {
        if (other === undefined) {
            return;
        }
        if (this.sum === undefined) {
            this.sum = other;
        }
        else {
            this.sum += other;
        }
    }
    /**
     * Get the aggregation result.
     */
    getResult() {
        return this.sum;
    }
}

/** @hidden */
class StaticValueAggregator {
    aggregate(other) {
        if (this.value === undefined) {
            this.value = other;
        }
    }
    getResult() {
        return this.value;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function createAggregator(aggregateType) {
    switch (aggregateType) {
        case "Average":
            return new AverageAggregator();
        case "Count":
            return new CountAggregator();
        case "Max":
            return new MaxAggregator();
        case "Min":
            return new MinAggregator();
        case "Sum":
            return new SumAggregator();
        default:
            return new StaticValueAggregator();
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
var FetchResultType;
(function (FetchResultType) {
    FetchResultType[FetchResultType["Done"] = 0] = "Done";
    FetchResultType[FetchResultType["Exception"] = 1] = "Exception";
    FetchResultType[FetchResultType["Result"] = 2] = "Result";
})(FetchResultType || (FetchResultType = {}));
/** @hidden */
class FetchResult {
    /**
     * Wraps fetch results for the document producer.
     * This allows the document producer to buffer exceptions so that actual results don't get flushed during splits.
     *
     * @param feedReponse - The response the document producer got back on a successful fetch
     * @param error - The exception meant to be buffered on an unsuccessful fetch
     * @hidden
     */
    constructor(feedResponse, error) {
        // TODO: feedResponse/error
        if (feedResponse !== undefined) {
            this.feedResponse = feedResponse;
            this.fetchResultType = FetchResultType.Result;
        }
        else {
            this.error = error;
            this.fetchResultType = FetchResultType.Exception;
        }
    }
}

/** @hidden */
class DocumentProducer {
    /**
     * Provides the Target Partition Range Query Execution Context.
     * @param clientContext  - The service endpoint to use to create the client.
     * @param collectionLink - Represents collection link
     * @param query          - A SQL query.
     * @param targetPartitionKeyRange - Query Target Partition key Range
     * @hidden
     */
    constructor(clientContext, collectionLink, query, targetPartitionKeyRange, options) {
        this.clientContext = clientContext;
        this.generation = 0;
        this.fetchFunction = async (diagnosticNode, options) => {
            const path = getPathFromLink(this.collectionLink, exports.ResourceType.item);
            diagnosticNode.addData({ partitionKeyRangeId: this.targetPartitionKeyRange.id });
            const id = getIdFromLink(this.collectionLink);
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.item,
                resourceId: id,
                resultFn: (result) => result.Documents,
                query: this.query,
                options,
                diagnosticNode,
                partitionKeyRangeId: this.targetPartitionKeyRange["id"],
            });
        };
        // TODO: any options
        this.collectionLink = collectionLink;
        this.query = query;
        this.targetPartitionKeyRange = targetPartitionKeyRange;
        this.fetchResults = [];
        this.allFetched = false;
        this.err = undefined;
        this.previousContinuationToken = undefined;
        this.continuationToken = undefined;
        this.respHeaders = getInitialHeader();
        this.internalExecutionContext = new DefaultQueryExecutionContext(options, this.fetchFunction);
    }
    /**
     * Synchronously gives the contiguous buffered results (stops at the first non result) if any
     * @returns buffered current items if any
     * @hidden
     */
    peekBufferedItems() {
        const bufferedResults = [];
        for (let i = 0, done = false; i < this.fetchResults.length && !done; i++) {
            const fetchResult = this.fetchResults[i];
            switch (fetchResult.fetchResultType) {
                case FetchResultType.Done:
                    done = true;
                    break;
                case FetchResultType.Exception:
                    done = true;
                    break;
                case FetchResultType.Result:
                    bufferedResults.push(fetchResult.feedResponse);
                    break;
            }
        }
        return bufferedResults;
    }
    hasMoreResults() {
        return this.internalExecutionContext.hasMoreResults() || this.fetchResults.length !== 0;
    }
    gotSplit() {
        const fetchResult = this.fetchResults[0];
        if (fetchResult.fetchResultType === FetchResultType.Exception) {
            if (DocumentProducer._needPartitionKeyRangeCacheRefresh(fetchResult.error)) {
                return true;
            }
        }
        return false;
    }
    _getAndResetActiveResponseHeaders() {
        const ret = this.respHeaders;
        this.respHeaders = getInitialHeader();
        return ret;
    }
    _updateStates(err, allFetched) {
        // TODO: any Error
        if (err) {
            this.err = err;
            return;
        }
        if (allFetched) {
            this.allFetched = true;
        }
        if (this.internalExecutionContext.continuationToken === this.continuationToken) {
            // nothing changed
            return;
        }
        this.previousContinuationToken = this.continuationToken;
        this.continuationToken = this.internalExecutionContext.continuationToken;
    }
    static _needPartitionKeyRangeCacheRefresh(error) {
        // TODO: error
        return (error.code === StatusCodes.Gone &&
            "substatus" in error &&
            error["substatus"] === SubStatusCodes.PartitionKeyRangeGone);
    }
    /**
     * Fetches and bufferes the next page of results and executes the given callback
     */
    async bufferMore(diagnosticNode, operationOptions, ruConsumedManager) {
        if (this.err) {
            throw this.err;
        }
        try {
            const { result: resources, headers: headerResponse } = await this.internalExecutionContext.fetchMore(diagnosticNode, operationOptions, ruConsumedManager);
            ++this.generation;
            this._updateStates(undefined, resources === undefined);
            if (resources !== undefined) {
                // some more results
                resources.forEach((element) => {
                    // TODO: resources any
                    this.fetchResults.push(new FetchResult(element, undefined));
                });
            }
            // need to modify the header response so that the query metrics are per partition
            if (headerResponse != null && Constants$1.HttpHeaders.QueryMetrics in headerResponse) {
                // "0" is the default partition before one is actually assigned.
                const queryMetrics = headerResponse[Constants$1.HttpHeaders.QueryMetrics]["0"];
                // Wraping query metrics in a object where the keys are the partition key range.
                headerResponse[Constants$1.HttpHeaders.QueryMetrics] = {};
                headerResponse[Constants$1.HttpHeaders.QueryMetrics][this.targetPartitionKeyRange.id] =
                    queryMetrics;
            }
            return { result: resources, headers: headerResponse };
        }
        catch (err) {
            // TODO: any error
            if (DocumentProducer._needPartitionKeyRangeCacheRefresh(err)) {
                // Split just happend
                // Buffer the error so the execution context can still get the feedResponses in the itemBuffer
                const bufferedError = new FetchResult(undefined, err);
                this.fetchResults.push(bufferedError);
                // Putting a dummy result so that the rest of code flows
                return {
                    result: [bufferedError],
                    headers: err.headers,
                };
            }
            else {
                this._updateStates(err, err.resources === undefined);
                throw err;
            }
        }
    }
    /**
     * Synchronously gives the bufferend current item if any
     * @returns buffered current item if any
     * @hidden
     */
    getTargetParitionKeyRange() {
        return this.targetPartitionKeyRange;
    }
    /**
     * Fetches the next element in the DocumentProducer.
     */
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        if (this.err) {
            this._updateStates(this.err, undefined);
            throw this.err;
        }
        try {
            const { result, headers } = await this.current(diagnosticNode, operationOptions, ruConsumedManager);
            const fetchResult = this.fetchResults.shift();
            this._updateStates(undefined, result === undefined);
            if (fetchResult.feedResponse !== result) {
                throw new Error(`Expected ${fetchResult.feedResponse} to equal ${result}`);
            }
            switch (fetchResult.fetchResultType) {
                case FetchResultType.Done:
                    return { result: undefined, headers };
                case FetchResultType.Exception:
                    fetchResult.error.headers = headers;
                    throw fetchResult.error;
                case FetchResultType.Result:
                    return { result: fetchResult.feedResponse, headers };
            }
        }
        catch (err) {
            this._updateStates(err, err.item === undefined);
            throw err;
        }
    }
    /**
     * Retrieve the current element on the DocumentProducer.
     */
    async current(diagnosticNode, operationOptions, ruConsumedManager) {
        // If something is buffered just give that
        if (this.fetchResults.length > 0) {
            const fetchResult = this.fetchResults[0];
            // Need to unwrap fetch results
            switch (fetchResult.fetchResultType) {
                case FetchResultType.Done:
                    return {
                        result: undefined,
                        headers: this._getAndResetActiveResponseHeaders(),
                    };
                case FetchResultType.Exception:
                    fetchResult.error.headers = this._getAndResetActiveResponseHeaders();
                    throw fetchResult.error;
                case FetchResultType.Result:
                    return {
                        result: fetchResult.feedResponse,
                        headers: this._getAndResetActiveResponseHeaders(),
                    };
            }
        }
        // If there isn't anymore items left to fetch then let the user know.
        if (this.allFetched) {
            return {
                result: undefined,
                headers: this._getAndResetActiveResponseHeaders(),
            };
        }
        // If there are no more bufferd items and there are still items to be fetched then buffer more
        const { result, headers } = await this.bufferMore(diagnosticNode, operationOptions, ruConsumedManager);
        mergeHeaders(this.respHeaders, headers);
        if (result === undefined) {
            return { result: undefined, headers: this.respHeaders };
        }
        return this.current(diagnosticNode, operationOptions, ruConsumedManager);
    }
}

/** @hidden */
class QueryRange {
    /**
     * Represents a QueryRange.
     *
     * @param rangeMin                - min
     * @param rangeMin                - max
     * @param isMinInclusive         - isMinInclusive
     * @param isMaxInclusive         - isMaxInclusive
     * @hidden
     */
    constructor(rangeMin, rangeMax, isMinInclusive, isMaxInclusive) {
        this.min = rangeMin;
        this.max = rangeMax;
        this.isMinInclusive = isMinInclusive;
        this.isMaxInclusive = isMaxInclusive;
    }
    overlaps(other) {
        const range1 = this; // eslint-disable-line @typescript-eslint/no-this-alias
        const range2 = other;
        if (range1 === undefined || range2 === undefined) {
            return false;
        }
        if (range1.isEmpty() || range2.isEmpty()) {
            return false;
        }
        if (range1.min <= range2.max || range2.min <= range1.max) {
            if ((range1.min === range2.max && !(range1.isMinInclusive && range2.isMaxInclusive)) ||
                (range2.min === range1.max && !(range2.isMinInclusive && range1.isMaxInclusive))) {
                return false;
            }
            return true;
        }
        return false;
    }
    isFullRange() {
        return (this.min === Constants$1.EffectivePartitionKeyConstants.MinimumInclusiveEffectivePartitionKey &&
            this.max === Constants$1.EffectivePartitionKeyConstants.MaximumExclusiveEffectivePartitionKey &&
            this.isMinInclusive === true &&
            this.isMaxInclusive === false);
    }
    isEmpty() {
        return !(this.isMinInclusive && this.isMaxInclusive) && this.min === this.max;
    }
    /**
     * Parse a QueryRange from a partitionKeyRange
     * @returns QueryRange
     * @hidden
     */
    static parsePartitionKeyRange(partitionKeyRange) {
        return new QueryRange(partitionKeyRange[Constants$1.PartitionKeyRange.MinInclusive], partitionKeyRange[Constants$1.PartitionKeyRange.MaxExclusive], true, false);
    }
    /**
     * Parse a QueryRange from a dictionary
     * @returns QueryRange
     * @hidden
     */
    static parseFromDict(queryRangeDict) {
        return new QueryRange(queryRangeDict.min, queryRangeDict.max, queryRangeDict.isMinInclusive, queryRangeDict.isMaxInclusive);
    }
}

/** @hidden */
class InMemoryCollectionRoutingMap {
    /**
     * Represents a InMemoryCollectionRoutingMap Object,
     * Stores partition key ranges in an efficient way with some additional information and provides
     * convenience methods for working with set of ranges.
     */
    constructor(orderedPartitionKeyRanges, orderedPartitionInfo) {
        this.orderedPartitionKeyRanges = orderedPartitionKeyRanges;
        this.orderedRanges = orderedPartitionKeyRanges.map((pkr) => {
            return new QueryRange(pkr[Constants$1.PartitionKeyRange.MinInclusive], pkr[Constants$1.PartitionKeyRange.MaxExclusive], true, false);
        });
        this.orderedPartitionInfo = orderedPartitionInfo;
    }
    getOrderedParitionKeyRanges() {
        return this.orderedPartitionKeyRanges;
    }
    getOverlappingRanges(providedQueryRanges) {
        // TODO This code has all kinds of smells. Multiple iterations and sorts just to grab overlapping ranges
        // stfaul attempted to bring it down to one for-loop and failed
        const pqr = Array.isArray(providedQueryRanges)
            ? providedQueryRanges
            : [providedQueryRanges];
        const minToPartitionRange = {}; // TODO: any
        // this for loop doesn't invoke any async callback
        for (const queryRange of pqr) {
            if (queryRange.isEmpty()) {
                continue;
            }
            if (queryRange.isFullRange()) {
                return this.orderedPartitionKeyRanges;
            }
            const minIndex = this.orderedRanges.findIndex((range) => {
                if (queryRange.min > range.min && queryRange.min < range.max) {
                    return true;
                }
                if (queryRange.min === range.min) {
                    return true;
                }
                if (queryRange.min === range.max) {
                    return true;
                }
            });
            if (minIndex < 0) {
                throw new Error("error in collection routing map, queried value is less than the start range.");
            }
            // Start at the end and work backwards
            let maxIndex;
            for (let i = this.orderedRanges.length - 1; i >= 0; i--) {
                const range = this.orderedRanges[i];
                if (queryRange.max > range.min && queryRange.max < range.max) {
                    maxIndex = i;
                    break;
                }
                if (queryRange.max === range.min) {
                    maxIndex = i;
                    break;
                }
                if (queryRange.max === range.max) {
                    maxIndex = i;
                    break;
                }
            }
            if (maxIndex > this.orderedRanges.length) {
                throw new Error("error in collection routing map, queried value is greater than the end range.");
            }
            for (let j = minIndex; j < maxIndex + 1; j++) {
                if (queryRange.overlaps(this.orderedRanges[j])) {
                    minToPartitionRange[this.orderedPartitionKeyRanges[j][Constants$1.PartitionKeyRange.MinInclusive]] = this.orderedPartitionKeyRanges[j];
                }
            }
        }
        const overlappingPartitionKeyRanges = Object.keys(minToPartitionRange).map((k) => minToPartitionRange[k]);
        return overlappingPartitionKeyRanges.sort((a, b) => {
            return a[Constants$1.PartitionKeyRange.MinInclusive].localeCompare(b[Constants$1.PartitionKeyRange.MinInclusive]);
        });
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
function compareRanges(a, b) {
    const aVal = a[0][Constants$1.PartitionKeyRange.MinInclusive];
    const bVal = b[0][Constants$1.PartitionKeyRange.MinInclusive];
    if (aVal > bVal) {
        return 1;
    }
    if (aVal < bVal) {
        return -1;
    }
    return 0;
}
/** @hidden */
function createCompleteRoutingMap(partitionKeyRangeInfoTuppleList) {
    const rangeById = {}; // TODO: any
    const rangeByInfo = {}; // TODO: any
    let sortedRanges = [];
    // the for loop doesn't invoke any async callback
    for (const r of partitionKeyRangeInfoTuppleList) {
        rangeById[r[0][Constants$1.PartitionKeyRange.Id]] = r;
        rangeByInfo[r[1]] = r[0];
        sortedRanges.push(r);
    }
    sortedRanges = sortedRanges.sort(compareRanges);
    const partitionKeyOrderedRange = sortedRanges.map((r) => r[0]);
    const orderedPartitionInfo = sortedRanges.map((r) => r[1]);
    if (!isCompleteSetOfRange(partitionKeyOrderedRange)) {
        return undefined;
    }
    return new InMemoryCollectionRoutingMap(partitionKeyOrderedRange, orderedPartitionInfo);
}
/**
 * @hidden
 */
function isCompleteSetOfRange(partitionKeyOrderedRange) {
    // TODO: any
    let isComplete = false;
    if (partitionKeyOrderedRange.length > 0) {
        const firstRange = partitionKeyOrderedRange[0];
        const lastRange = partitionKeyOrderedRange[partitionKeyOrderedRange.length - 1];
        isComplete =
            firstRange[Constants$1.PartitionKeyRange.MinInclusive] ===
                Constants$1.EffectivePartitionKeyConstants.MinimumInclusiveEffectivePartitionKey;
        isComplete =
            isComplete &&
                lastRange[Constants$1.PartitionKeyRange.MaxExclusive] ===
                    Constants$1.EffectivePartitionKeyConstants.MaximumExclusiveEffectivePartitionKey;
        for (let i = 1; i < partitionKeyOrderedRange.length; i++) {
            const previousRange = partitionKeyOrderedRange[i - 1];
            const currentRange = partitionKeyOrderedRange[i];
            isComplete =
                isComplete &&
                    previousRange[Constants$1.PartitionKeyRange.MaxExclusive] ===
                        currentRange[Constants$1.PartitionKeyRange.MinInclusive];
            if (!isComplete) {
                if (previousRange[Constants$1.PartitionKeyRange.MaxExclusive] >
                    currentRange[Constants$1.PartitionKeyRange.MinInclusive]) {
                    throw Error("Ranges overlap");
                }
                break;
            }
        }
    }
    return isComplete;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
class PartitionKeyRangeCache {
    constructor(clientContext) {
        this.clientContext = clientContext;
        this.collectionRoutingMapByCollectionId = {};
    }
    /**
     * Finds or Instantiates the requested Collection Routing Map
     * @param collectionLink - Requested collectionLink
     * @hidden
     */
    async onCollectionRoutingMap(collectionLink, diagnosticNode, forceRefresh = false) {
        const collectionId = getIdFromLink(collectionLink);
        if (this.collectionRoutingMapByCollectionId[collectionId] === undefined || forceRefresh) {
            this.collectionRoutingMapByCollectionId[collectionId] = this.requestCollectionRoutingMap(collectionLink, diagnosticNode);
        }
        return this.collectionRoutingMapByCollectionId[collectionId];
    }
    /**
     * Given the query ranges and a collection, invokes the callback on the list of overlapping partition key ranges
     * @hidden
     */
    async getOverlappingRanges(collectionLink, queryRange, diagnosticNode, forceRefresh = false) {
        const crm = await this.onCollectionRoutingMap(collectionLink, diagnosticNode, forceRefresh);
        return crm.getOverlappingRanges(queryRange);
    }
    async requestCollectionRoutingMap(collectionLink, diagnosticNode) {
        const { resources } = await withMetadataDiagnostics(async (metadataDiagnostics) => {
            return this.clientContext
                .queryPartitionKeyRanges(collectionLink)
                .fetchAllInternal(metadataDiagnostics);
        }, diagnosticNode, exports.MetadataLookUpType.PartitionKeyRangeLookUp);
        return createCompleteRoutingMap(resources.map((r) => [r, true]));
    }
}

/** @hidden */
const PARITIONKEYRANGE = Constants$1.PartitionKeyRange;
/** @hidden */
class SmartRoutingMapProvider {
    constructor(clientContext) {
        this.partitionKeyRangeCache = new PartitionKeyRangeCache(clientContext);
    }
    static _secondRangeIsAfterFirstRange(range1, range2) {
        if (typeof range1.max === "undefined") {
            throw new Error("range1 must have max");
        }
        if (typeof range2.min === "undefined") {
            throw new Error("range2 must have min");
        }
        if (range1.max > range2.min) {
            // r.min < #previous_r.max
            return false;
        }
        else {
            if (range1.max === range2.min && range1.isMaxInclusive && range2.isMinInclusive) {
                // the inclusive ending endpoint of previous_r is the same as the inclusive beginning endpoint of r
                // they share a point
                return false;
            }
            return true;
        }
    }
    static _isSortedAndNonOverlapping(ranges) {
        for (let idx = 1; idx < ranges.length; idx++) {
            const previousR = ranges[idx - 1];
            const r = ranges[idx];
            if (!this._secondRangeIsAfterFirstRange(previousR, r)) {
                return false;
            }
        }
        return true;
    }
    static _stringMax(a, b) {
        return a >= b ? a : b;
    }
    static _stringCompare(a, b) {
        return a === b ? 0 : a > b ? 1 : -1;
    }
    static _subtractRange(r, partitionKeyRange) {
        const left = this._stringMax(partitionKeyRange[PARITIONKEYRANGE.MaxExclusive], r.min);
        const leftInclusive = this._stringCompare(left, r.min) === 0 ? r.isMinInclusive : false;
        return new QueryRange(left, r.max, leftInclusive, r.isMaxInclusive);
    }
    /**
     * Given the sorted ranges and a collection, invokes the callback on the list of overlapping partition key ranges
     * @param callback - Function execute on the overlapping partition key ranges result,
     *                   takes two parameters error, partition key ranges
     * @hidden
     */
    async getOverlappingRanges(collectionLink, sortedRanges, diagnosticNode) {
        // validate if the list is non- overlapping and sorted                             TODO: any PartitionKeyRanges
        if (!SmartRoutingMapProvider._isSortedAndNonOverlapping(sortedRanges)) {
            throw new Error("the list of ranges is not a non-overlapping sorted ranges");
        }
        let partitionKeyRanges = []; // TODO: any ParitionKeyRanges
        if (sortedRanges.length === 0) {
            return partitionKeyRanges;
        }
        const collectionRoutingMap = await this.partitionKeyRangeCache.onCollectionRoutingMap(collectionLink, diagnosticNode);
        let index = 0;
        let currentProvidedRange = sortedRanges[index];
        for (;;) {
            if (currentProvidedRange.isEmpty()) {
                // skip and go to the next item
                if (++index >= sortedRanges.length) {
                    return partitionKeyRanges;
                }
                currentProvidedRange = sortedRanges[index];
                continue;
            }
            let queryRange;
            if (partitionKeyRanges.length > 0) {
                queryRange = SmartRoutingMapProvider._subtractRange(currentProvidedRange, partitionKeyRanges[partitionKeyRanges.length - 1]);
            }
            else {
                queryRange = currentProvidedRange;
            }
            const overlappingRanges = collectionRoutingMap.getOverlappingRanges(queryRange);
            if (overlappingRanges.length <= 0) {
                throw new Error(`error: returned overlapping ranges for queryRange ${queryRange} is empty`);
            }
            partitionKeyRanges = partitionKeyRanges.concat(overlappingRanges);
            const lastKnownTargetRange = QueryRange.parsePartitionKeyRange(partitionKeyRanges[partitionKeyRanges.length - 1]);
            if (!lastKnownTargetRange) {
                throw new Error("expected lastKnowTargetRange to be truthy");
            }
            // the overlapping ranges must contain the requested range
            if (SmartRoutingMapProvider._stringCompare(currentProvidedRange.max, lastKnownTargetRange.max) >
                0) {
                throw new Error(`error: returned overlapping ranges ${overlappingRanges} \
        does not contain the requested range ${queryRange}`);
            }
            // the current range is contained in partitionKeyRanges just move forward
            if (++index >= sortedRanges.length) {
                return partitionKeyRanges;
            }
            currentProvidedRange = sortedRanges[index];
            while (SmartRoutingMapProvider._stringCompare(currentProvidedRange.max, lastKnownTargetRange.max) <= 0) {
                // the current range is covered too.just move forward
                if (++index >= sortedRanges.length) {
                    return partitionKeyRanges;
                }
                currentProvidedRange = sortedRanges[index];
            }
        }
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
const logger$2 = logger$5.createClientLogger("parallelQueryExecutionContextBase");
/** @hidden */
var ParallelQueryExecutionContextBaseStates;
(function (ParallelQueryExecutionContextBaseStates) {
    ParallelQueryExecutionContextBaseStates["started"] = "started";
    ParallelQueryExecutionContextBaseStates["inProgress"] = "inProgress";
    ParallelQueryExecutionContextBaseStates["ended"] = "ended";
})(ParallelQueryExecutionContextBaseStates || (ParallelQueryExecutionContextBaseStates = {}));
/** @hidden */
class ParallelQueryExecutionContextBase {
    /**
     * Provides the ParallelQueryExecutionContextBase.
     * This is the base class that ParallelQueryExecutionContext and OrderByQueryExecutionContext will derive from.
     *
     * When handling a parallelized query, it instantiates one instance of
     * DocumentProcuder per target partition key range and aggregates the result of each.
     *
     * @param clientContext - The service endpoint to use to create the client.
     * @param collectionLink - The Collection Link
     * @param options - Represents the feed options.
     * @param partitionedQueryExecutionInfo - PartitionedQueryExecutionInfo
     * @hidden
     */
    constructor(clientContext, collectionLink, query, options, partitionedQueryExecutionInfo) {
        this.clientContext = clientContext;
        this.collectionLink = collectionLink;
        this.query = query;
        this.options = options;
        this.partitionedQueryExecutionInfo = partitionedQueryExecutionInfo;
        this.initializedPriorityQueue = false;
        this.ruCapExceededError = undefined;
        this.clientContext = clientContext;
        this.collectionLink = collectionLink;
        this.query = query;
        this.options = options;
        this.partitionedQueryExecutionInfo = partitionedQueryExecutionInfo;
        this.diagnosticNodeWrapper = {
            consumed: false,
            diagnosticNode: new DiagnosticNodeInternal(clientContext.diagnosticLevel, exports.DiagnosticNodeType.PARALLEL_QUERY_NODE, null),
        };
        this.diagnosticNodeWrapper.diagnosticNode.addData({ stateful: true });
        this.err = undefined;
        this.state = ParallelQueryExecutionContextBase.STATES.started;
        this.routingProvider = new SmartRoutingMapProvider(this.clientContext);
        this.sortOrders = this.partitionedQueryExecutionInfo.queryInfo.orderBy;
        this.requestContinuation = options ? options.continuationToken || options.continuation : null;
        // response headers of undergoing operation
        this.respHeaders = getInitialHeader();
        // Make priority queue for documentProducers
        // The comparator is supplied by the derived class
        this.orderByPQ = new PriorityQueue((a, b) => this.documentProducerComparator(b, a));
        this.nextItemfetchSemaphore = semaphore(1);
    }
    _mergeWithActiveResponseHeaders(headers) {
        mergeHeaders(this.respHeaders, headers);
    }
    _getAndResetActiveResponseHeaders() {
        const ret = this.respHeaders;
        this.respHeaders = getInitialHeader();
        return ret;
    }
    getDiagnosticNode() {
        return this.diagnosticNodeWrapper.diagnosticNode;
    }
    async _onTargetPartitionRanges() {
        // invokes the callback when the target partition ranges are ready
        const parsedRanges = this.partitionedQueryExecutionInfo.queryRanges;
        const queryRanges = parsedRanges.map((item) => QueryRange.parseFromDict(item));
        return this.routingProvider.getOverlappingRanges(this.collectionLink, queryRanges, this.getDiagnosticNode());
    }
    /**
     * Gets the replacement ranges for a partitionkeyrange that has been split
     */
    async _getReplacementPartitionKeyRanges(documentProducer) {
        const partitionKeyRange = documentProducer.targetPartitionKeyRange;
        // Download the new routing map
        this.routingProvider = new SmartRoutingMapProvider(this.clientContext);
        // Get the queryRange that relates to this partitionKeyRange
        const queryRange = QueryRange.parsePartitionKeyRange(partitionKeyRange);
        return this.routingProvider.getOverlappingRanges(this.collectionLink, [queryRange], this.getDiagnosticNode());
    }
    // TODO: P0 Code smell - can barely tell what this is doing
    /**
     * Removes the current document producer from the priqueue,
     * replaces that document producer with child document producers,
     * then reexecutes the originFunction with the corrrected executionContext
     */
    async _repairExecutionContext(diagnosticNode, originFunction) {
        // TODO: any
        // Get the replacement ranges
        // Removing the invalid documentProducer from the orderByPQ
        const parentDocumentProducer = this.orderByPQ.deq();
        try {
            const replacementPartitionKeyRanges = await this._getReplacementPartitionKeyRanges(parentDocumentProducer);
            const replacementDocumentProducers = [];
            // Create the replacement documentProducers
            replacementPartitionKeyRanges.forEach((partitionKeyRange) => {
                // Create replacment document producers with the parent's continuationToken
                const replacementDocumentProducer = this._createTargetPartitionQueryExecutionContext(partitionKeyRange, parentDocumentProducer.continuationToken);
                replacementDocumentProducers.push(replacementDocumentProducer);
            });
            // We need to check if the documentProducers even has anything left to fetch from before enqueing them
            const checkAndEnqueueDocumentProducer = async (documentProducerToCheck, checkNextDocumentProducerCallback) => {
                try {
                    const { result: afterItem } = await documentProducerToCheck.current(diagnosticNode);
                    if (afterItem === undefined) {
                        // no more results left in this document producer, so we don't enqueue it
                    }
                    else {
                        // Safe to put document producer back in the queue
                        this.orderByPQ.enq(documentProducerToCheck);
                    }
                    await checkNextDocumentProducerCallback();
                }
                catch (err) {
                    this.err = err;
                    return;
                }
            };
            const checkAndEnqueueDocumentProducers = async (rdp) => {
                if (rdp.length > 0) {
                    // We still have a replacementDocumentProducer to check
                    const replacementDocumentProducer = rdp.shift();
                    await checkAndEnqueueDocumentProducer(replacementDocumentProducer, async () => {
                        await checkAndEnqueueDocumentProducers(rdp);
                    });
                }
                else {
                    // reexecutes the originFunction with the corrrected executionContext
                    return originFunction();
                }
            };
            // Invoke the recursive function to get the ball rolling
            await checkAndEnqueueDocumentProducers(replacementDocumentProducers);
        }
        catch (err) {
            this.err = err;
            throw err;
        }
    }
    static _needPartitionKeyRangeCacheRefresh(error) {
        // TODO: any error
        return (error.code === StatusCodes.Gone &&
            "substatus" in error &&
            error["substatus"] === SubStatusCodes.PartitionKeyRangeGone);
    }
    /**
     * Checks to see if the executionContext needs to be repaired.
     * if so it repairs the execution context and executes the ifCallback,
     * else it continues with the current execution context and executes the elseCallback
     */
    async _repairExecutionContextIfNeeded(diagnosticNode, ifCallback, elseCallback, operationOptions, ruConsumedManager) {
        const documentProducer = this.orderByPQ.peek();
        // Check if split happened
        try {
            await documentProducer.current(diagnosticNode, operationOptions, ruConsumedManager);
            elseCallback();
        }
        catch (err) {
            if (ParallelQueryExecutionContextBase._needPartitionKeyRangeCacheRefresh(err)) {
                // Split has happened so we need to repair execution context before continueing
                return addDignosticChild((childNode) => this._repairExecutionContext(childNode, ifCallback), diagnosticNode, exports.DiagnosticNodeType.QUERY_REPAIR_NODE);
            }
            else {
                // Something actually bad happened ...
                this.err = err;
                throw err;
            }
        }
    }
    /**
     * Fetches the next element in the ParallelQueryExecutionContextBase.
     */
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        if (this.err) {
            // if there is a prior error return error
            throw this.err;
        }
        return new Promise((resolve, reject) => {
            this.nextItemfetchSemaphore.take(async () => {
                // document producer queue initilization
                if (!this.initializedPriorityQueue) {
                    try {
                        await this._createDocumentProducersAndFillUpPriorityQueue(operationOptions, ruConsumedManager);
                        this.initializedPriorityQueue = true;
                    }
                    catch (err) {
                        this.err = err;
                        // release the lock before invoking callback
                        this.nextItemfetchSemaphore.leave();
                        reject(this.err);
                        return;
                    }
                }
                if (!this.diagnosticNodeWrapper.consumed) {
                    diagnosticNode.addChildNode(this.diagnosticNodeWrapper.diagnosticNode, exports.CosmosDbDiagnosticLevel.debug, exports.MetadataLookUpType.QueryPlanLookUp);
                    this.diagnosticNodeWrapper.diagnosticNode = undefined;
                    this.diagnosticNodeWrapper.consumed = true;
                }
                else {
                    this.diagnosticNodeWrapper.diagnosticNode = diagnosticNode;
                }
                // NOTE: lock must be released before invoking quitting
                if (this.err) {
                    // release the lock before invoking callback
                    this.nextItemfetchSemaphore.leave();
                    this.err.headers = this._getAndResetActiveResponseHeaders();
                    reject(this.err);
                    return;
                }
                if (this.orderByPQ.size() === 0) {
                    // there is no more results
                    this.state = ParallelQueryExecutionContextBase.STATES.ended;
                    // release the lock before invoking callback
                    this.nextItemfetchSemaphore.leave();
                    return resolve({
                        result: undefined,
                        headers: this._getAndResetActiveResponseHeaders(),
                    });
                }
                const ifCallback = () => {
                    // Release the semaphore to avoid deadlock
                    this.nextItemfetchSemaphore.leave();
                    // Reexcute the function
                    return resolve(this.nextItem(diagnosticNode, operationOptions, ruConsumedManager));
                };
                const elseCallback = async () => {
                    let documentProducer;
                    try {
                        documentProducer = this.orderByPQ.deq();
                    }
                    catch (e) {
                        // if comparing elements of the priority queue throws exception
                        // set that error and return error
                        this.err = e;
                        // release the lock before invoking callback
                        this.nextItemfetchSemaphore.leave();
                        this.err.headers = this._getAndResetActiveResponseHeaders();
                        reject(this.err);
                        return;
                    }
                    let item;
                    let headers;
                    try {
                        const response = await documentProducer.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
                        item = response.result;
                        headers = response.headers;
                        this._mergeWithActiveResponseHeaders(headers);
                        if (item === undefined) {
                            // this should never happen
                            // because the documentProducer already has buffered an item
                            // assert item !== undefined
                            this.err = new Error(`Extracted DocumentProducer from the priority queue \
                                            doesn't have any buffered item!`);
                            // release the lock before invoking callback
                            this.nextItemfetchSemaphore.leave();
                            return resolve({
                                result: undefined,
                                headers: this._getAndResetActiveResponseHeaders(),
                            });
                        }
                    }
                    catch (err) {
                        if (err.code === RUCapPerOperationExceededErrorCode) {
                            this._updateErrorObjectWithBufferedData(err);
                            this.err = err;
                        }
                        else {
                            this.err = new Error(`Extracted DocumentProducer from the priority queue fails to get the \
                                    buffered item. Due to ${JSON.stringify(err)}`);
                            this.err.headers = this._getAndResetActiveResponseHeaders();
                        }
                        // release the lock before invoking callback
                        this.nextItemfetchSemaphore.leave();
                        reject(this.err);
                        return;
                    }
                    // we need to put back the document producer to the queue if it has more elements.
                    // the lock will be released after we know document producer must be put back in the queue or not
                    try {
                        const { result: afterItem, headers: otherHeaders } = await documentProducer.current(diagnosticNode, operationOptions, ruConsumedManager);
                        this._mergeWithActiveResponseHeaders(otherHeaders);
                        if (afterItem === undefined) {
                            // no more results is left in this document producer
                        }
                        else {
                            try {
                                const headItem = documentProducer.fetchResults[0];
                                if (typeof headItem === "undefined") {
                                    throw new Error("Extracted DocumentProducer from PQ is invalid state with no result!");
                                }
                                this.orderByPQ.enq(documentProducer);
                            }
                            catch (e) {
                                // if comparing elements in priority queue throws exception
                                // set error
                                this.err = e;
                            }
                        }
                    }
                    catch (err) {
                        if (ParallelQueryExecutionContextBase._needPartitionKeyRangeCacheRefresh(err)) {
                            // We want the document producer enqueued
                            // So that later parts of the code can repair the execution context
                            this.orderByPQ.enq(documentProducer);
                        }
                        else if (err.code === RUCapPerOperationExceededErrorCode) {
                            this._updateErrorObjectWithBufferedData(err);
                            this.err = err;
                            reject(this.err);
                        }
                        else {
                            // Something actually bad happened
                            this.err = err;
                            reject(this.err);
                        }
                    }
                    finally {
                        // release the lock before returning
                        this.nextItemfetchSemaphore.leave();
                    }
                    // invoke the callback on the item
                    return resolve({
                        result: item,
                        headers: this._getAndResetActiveResponseHeaders(),
                    });
                };
                this._repairExecutionContextIfNeeded(diagnosticNode, ifCallback, elseCallback).catch(reject);
            });
        });
    }
    _updateErrorObjectWithBufferedData(err) {
        this.orderByPQ.forEach((dp) => {
            const bufferedItems = dp.peekBufferedItems();
            err.fetchedResults.push(...bufferedItems);
        });
    }
    /**
     * Determine if there are still remaining resources to processs based on the value of the continuation
     * token or the elements remaining on the current batch in the QueryIterator.
     * @returns true if there is other elements to process in the ParallelQueryExecutionContextBase.
     */
    hasMoreResults() {
        return !(this.state === ParallelQueryExecutionContextBase.STATES.ended || this.err !== undefined);
    }
    /**
     * Creates document producers
     */
    _createTargetPartitionQueryExecutionContext(partitionKeyTargetRange, continuationToken) {
        // TODO: any
        // creates target partition range Query Execution Context
        let rewrittenQuery = this.partitionedQueryExecutionInfo.queryInfo.rewrittenQuery;
        let sqlQuerySpec;
        const query = this.query;
        if (typeof query === "string") {
            sqlQuerySpec = { query };
        }
        else {
            sqlQuerySpec = query;
        }
        const formatPlaceHolder = "{documentdb-formattableorderbyquery-filter}";
        if (rewrittenQuery) {
            sqlQuerySpec = JSON.parse(JSON.stringify(sqlQuerySpec));
            // We hardcode the formattable filter to true for now
            rewrittenQuery = rewrittenQuery.replace(formatPlaceHolder, "true");
            sqlQuerySpec["query"] = rewrittenQuery;
        }
        const options = Object.assign({}, this.options);
        options.continuationToken = continuationToken;
        return new DocumentProducer(this.clientContext, this.collectionLink, sqlQuerySpec, partitionKeyTargetRange, options);
    }
    async _createDocumentProducersAndFillUpPriorityQueue(operationOptions, ruConsumedManager) {
        try {
            const targetPartitionRanges = await this._onTargetPartitionRanges();
            const maxDegreeOfParallelism = this.options.maxDegreeOfParallelism === undefined || this.options.maxDegreeOfParallelism < 1
                ? targetPartitionRanges.length
                : Math.min(this.options.maxDegreeOfParallelism, targetPartitionRanges.length);
            logger$2.info("Query starting against " +
                targetPartitionRanges.length +
                " ranges with parallelism of " +
                maxDegreeOfParallelism);
            let filteredPartitionKeyRanges = [];
            // The document producers generated from filteredPartitionKeyRanges
            const targetPartitionQueryExecutionContextList = [];
            if (this.requestContinuation) {
                throw new Error("Continuation tokens are not yet supported for cross partition queries");
            }
            else {
                filteredPartitionKeyRanges = targetPartitionRanges;
            }
            // Create one documentProducer for each partitionTargetRange
            filteredPartitionKeyRanges.forEach((partitionTargetRange) => {
                // TODO: any partitionTargetRange
                // no async callback
                targetPartitionQueryExecutionContextList.push(this._createTargetPartitionQueryExecutionContext(partitionTargetRange));
            });
            // Fill up our priority queue with documentProducers
            let inProgressPromises = [];
            for (const documentProducer of targetPartitionQueryExecutionContextList) {
                // Don't enqueue any new promise if RU cap exceeded
                if (this.ruCapExceededError) {
                    break;
                }
                const promise = this._processAndEnqueueDocumentProducer(documentProducer, operationOptions, ruConsumedManager);
                inProgressPromises.push(promise);
                // Limit concurrent executions
                if (inProgressPromises.length === maxDegreeOfParallelism) {
                    await Promise.all(inProgressPromises);
                    inProgressPromises = [];
                }
            }
            // Wait for all promises to complete
            await Promise.all(inProgressPromises);
            if (this.err) {
                if (this.ruCapExceededError) {
                    // merge the buffered items
                    this.orderByPQ.forEach((dp) => {
                        const bufferedItems = dp.peekBufferedItems();
                        this.ruCapExceededError.fetchedResults.push(...bufferedItems);
                    });
                    throw this.ruCapExceededError;
                }
                throw this.err;
            }
        }
        catch (err) {
            this.err = err;
            throw err;
        }
    }
    async _processAndEnqueueDocumentProducer(documentProducer, operationOptions, ruConsumedManager) {
        try {
            const { result: document, headers } = await documentProducer.current(this.getDiagnosticNode(), operationOptions, ruConsumedManager);
            this._mergeWithActiveResponseHeaders(headers);
            if (document !== undefined) {
                this.orderByPQ.enq(documentProducer);
            }
        }
        catch (err) {
            this._mergeWithActiveResponseHeaders(err.headers);
            this.err = err;
            if (err.code === RUCapPerOperationExceededErrorCode) {
                // would be halting further execution of other promises
                if (!this.ruCapExceededError) {
                    this.ruCapExceededError = err;
                }
                else {
                    // merge the buffered items
                    if (err.fetchedResults) {
                        this.ruCapExceededError.fetchedResults.push(...err.fetchedResults);
                    }
                }
            }
            else {
                throw err;
            }
        }
        return;
    }
}
ParallelQueryExecutionContextBase.STATES = ParallelQueryExecutionContextBaseStates;

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Provides the ParallelQueryExecutionContext.
 * This class is capable of handling parallelized queries and derives from ParallelQueryExecutionContextBase.
 * @hidden
 */
class ParallelQueryExecutionContext extends ParallelQueryExecutionContextBase {
    // Instance members are inherited
    // Overriding documentProducerComparator for ParallelQueryExecutionContexts
    /**
     * Provides a Comparator for document producers using the min value of the corresponding target partition.
     * @returns Comparator Function
     * @hidden
     */
    documentProducerComparator(docProd1, docProd2) {
        return docProd1.generation - docProd2.generation;
    }
}

/** @hidden */
class OrderByQueryExecutionContext extends ParallelQueryExecutionContextBase {
    /**
     * Provides the OrderByQueryExecutionContext.
     * This class is capable of handling orderby queries and dervives from ParallelQueryExecutionContextBase.
     *
     * When handling a parallelized query, it instantiates one instance of
     * DocumentProcuder per target partition key range and aggregates the result of each.
     *
     * @param clientContext - The service endpoint to use to create the client.
     * @param collectionLink - The Collection Link
     * @param options - Represents the feed options.
     * @param partitionedQueryExecutionInfo - PartitionedQueryExecutionInfo
     * @hidden
     */
    constructor(clientContext, collectionLink, query, options, partitionedQueryExecutionInfo) {
        // Calling on base class constructor
        super(clientContext, collectionLink, query, options, partitionedQueryExecutionInfo);
        this.orderByComparator = new OrderByDocumentProducerComparator(this.sortOrders);
    }
    // Instance members are inherited
    // Overriding documentProducerComparator for OrderByQueryExecutionContexts
    /**
     * Provides a Comparator for document producers which respects orderby sort order.
     * @returns Comparator Function
     * @hidden
     */
    documentProducerComparator(docProd1, docProd2) {
        return this.orderByComparator.compare(docProd1, docProd2);
    }
}

/** @hidden */
class OffsetLimitEndpointComponent {
    constructor(executionContext, offset, limit) {
        this.executionContext = executionContext;
        this.offset = offset;
        this.limit = limit;
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        const aggregateHeaders = getInitialHeader();
        try {
            while (this.offset > 0) {
                // Grab next item but ignore the result. We only need the headers
                const { headers } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
                this.offset--;
                mergeHeaders(aggregateHeaders, headers);
            }
            if (this.limit > 0) {
                const { result, headers } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
                this.limit--;
                mergeHeaders(aggregateHeaders, headers);
                return { result, headers: aggregateHeaders };
            }
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
        // If both limit and offset are 0, return nothing
        return {
            result: undefined,
            headers: getInitialHeader(),
        };
    }
    hasMoreResults() {
        return (this.offset > 0 || this.limit > 0) && this.executionContext.hasMoreResults();
    }
}

/** @hidden */
class OrderByEndpointComponent {
    /**
     * Represents an endpoint in handling an order by query. For each processed orderby
     * result it returns 'payload' item of the result
     *
     * @param executionContext - Underlying Execution Context
     * @hidden
     */
    constructor(executionContext) {
        this.executionContext = executionContext;
    }
    /**
     * Execute a provided function on the next element in the OrderByEndpointComponent.
     */
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        try {
            const { result: item, headers } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
            return {
                result: item !== undefined ? item.payload : undefined,
                headers,
            };
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
    }
    /**
     * Determine if there are still remaining resources to processs.
     * @returns true if there is other elements to process in the OrderByEndpointComponent.
     */
    hasMoreResults() {
        return this.executionContext.hasMoreResults();
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
async function digest(str) {
    const hash = crypto.createHash("sha256");
    hash.update(str, "utf8");
    return hash.digest("hex");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
async function hashObject(object) {
    const stringifiedObject = stableStringify(object);
    return digest(stringifiedObject);
}

/** @hidden */
class OrderedDistinctEndpointComponent {
    constructor(executionContext) {
        this.executionContext = executionContext;
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        try {
            const { headers, result } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
            if (result) {
                const hashedResult = await hashObject(result);
                if (hashedResult === this.hashedLastResult) {
                    return { result: undefined, headers };
                }
                this.hashedLastResult = hashedResult;
            }
            return { result, headers };
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
    }
    hasMoreResults() {
        return this.executionContext.hasMoreResults();
    }
}

/** @hidden */
class UnorderedDistinctEndpointComponent {
    constructor(executionContext) {
        this.executionContext = executionContext;
        this.hashedResults = new Set();
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        try {
            const { headers, result } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
            if (result) {
                const hashedResult = await hashObject(result);
                if (this.hashedResults.has(hashedResult)) {
                    return { result: undefined, headers };
                }
                this.hashedResults.add(hashedResult);
            }
            return { result, headers };
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
    }
    hasMoreResults() {
        return this.executionContext.hasMoreResults();
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// All aggregates are effectively a group by operation
// The empty group is used for aggregates without a GROUP BY clause
const emptyGroup = "__empty__";
// Newer API versions rewrite the query to return `item2`. It fixes some legacy issues with the original `item` result
// Aggregator code should use item2 when available
const extractAggregateResult = (payload) => Object.keys(payload).length > 0 ? (payload.item2 ? payload.item2 : payload.item) : null;

/** @hidden */
class GroupByEndpointComponent {
    constructor(executionContext, queryInfo) {
        this.executionContext = executionContext;
        this.queryInfo = queryInfo;
        this.groupings = new Map();
        this.aggregateResultArray = [];
        this.completed = false;
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        // If we have a full result set, begin returning results
        if (this.aggregateResultArray.length > 0) {
            return {
                result: this.aggregateResultArray.pop(),
                headers: getInitialHeader(),
            };
        }
        if (this.completed) {
            return {
                result: undefined,
                headers: getInitialHeader(),
            };
        }
        const aggregateHeaders = getInitialHeader();
        try {
            while (this.executionContext.hasMoreResults()) {
                // Grab the next result
                const { result, headers } = (await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager));
                mergeHeaders(aggregateHeaders, headers);
                // If it exists, process it via aggregators
                if (result) {
                    const group = result.groupByItems ? await hashObject(result.groupByItems) : emptyGroup;
                    const aggregators = this.groupings.get(group);
                    const payload = result.payload;
                    if (aggregators) {
                        // Iterator over all results in the payload
                        Object.keys(payload).map((key) => {
                            // in case the value of a group is null make sure we create a dummy payload with item2==null
                            const effectiveGroupByValue = payload[key]
                                ? payload[key]
                                : new Map().set("item2", null);
                            const aggregateResult = extractAggregateResult(effectiveGroupByValue);
                            aggregators.get(key).aggregate(aggregateResult);
                        });
                    }
                    else {
                        // This is the first time we have seen a grouping. Setup the initial result without aggregate values
                        const grouping = new Map();
                        this.groupings.set(group, grouping);
                        // Iterator over all results in the payload
                        Object.keys(payload).map((key) => {
                            const aggregateType = this.queryInfo.groupByAliasToAggregateType[key];
                            // Create a new aggregator for this specific aggregate field
                            const aggregator = createAggregator(aggregateType);
                            grouping.set(key, aggregator);
                            if (aggregateType) {
                                const aggregateResult = extractAggregateResult(payload[key]);
                                aggregator.aggregate(aggregateResult);
                            }
                            else {
                                aggregator.aggregate(payload[key]);
                            }
                        });
                    }
                }
            }
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
        for (const grouping of this.groupings.values()) {
            const groupResult = {};
            for (const [aggregateKey, aggregator] of grouping.entries()) {
                groupResult[aggregateKey] = aggregator.getResult();
            }
            this.aggregateResultArray.push(groupResult);
        }
        this.completed = true;
        return {
            result: this.aggregateResultArray.pop(),
            headers: aggregateHeaders,
        };
    }
    hasMoreResults() {
        return this.executionContext.hasMoreResults() || this.aggregateResultArray.length > 0;
    }
}

/** @hidden */
class GroupByValueEndpointComponent {
    constructor(executionContext, queryInfo) {
        this.executionContext = executionContext;
        this.queryInfo = queryInfo;
        this.aggregators = new Map();
        this.aggregateResultArray = [];
        this.completed = false;
        // VALUE queries will only every have a single grouping
        this.aggregateType = this.queryInfo.aggregates[0];
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        // Start returning results if we have processed a full results set
        if (this.aggregateResultArray.length > 0) {
            return {
                result: this.aggregateResultArray.pop(),
                headers: getInitialHeader(),
            };
        }
        if (this.completed) {
            return {
                result: undefined,
                headers: getInitialHeader(),
            };
        }
        const aggregateHeaders = getInitialHeader();
        try {
            while (this.executionContext.hasMoreResults()) {
                // Grab the next result
                const { result, headers } = (await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager));
                mergeHeaders(aggregateHeaders, headers);
                // If it exists, process it via aggregators
                if (result) {
                    let grouping = emptyGroup;
                    let payload = result;
                    if (result.groupByItems) {
                        // If the query contains a GROUP BY clause, it will have a payload property and groupByItems
                        payload = result.payload;
                        grouping = await hashObject(result.groupByItems);
                    }
                    const aggregator = this.aggregators.get(grouping);
                    if (!aggregator) {
                        // This is the first time we have seen a grouping so create a new aggregator
                        this.aggregators.set(grouping, createAggregator(this.aggregateType));
                    }
                    if (this.aggregateType) {
                        const aggregateResult = extractAggregateResult(payload[0]);
                        // if aggregate result is null, we need to short circuit aggregation and return undefined
                        if (aggregateResult === null) {
                            this.completed = true;
                        }
                        this.aggregators.get(grouping).aggregate(aggregateResult);
                    }
                    else {
                        // Queries with no aggregates pass the payload directly to the aggregator
                        // Example: SELECT VALUE c.team FROM c GROUP BY c.team
                        this.aggregators.get(grouping).aggregate(payload);
                    }
                }
            }
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
        // We bail early since we got an undefined result back `[{}]`
        if (this.completed) {
            return {
                result: undefined,
                headers: aggregateHeaders,
            };
        }
        // If no results are left in the underlying execution context, convert our aggregate results to an array
        for (const aggregator of this.aggregators.values()) {
            this.aggregateResultArray.push(aggregator.getResult());
        }
        this.completed = true;
        return {
            result: this.aggregateResultArray.pop(),
            headers: aggregateHeaders,
        };
    }
    hasMoreResults() {
        return this.executionContext.hasMoreResults() || this.aggregateResultArray.length > 0;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class NonStreamingOrderByPriorityQueue {
    constructor(compareFn, pqMaxSize = 2000) {
        this.compareFn = compareFn;
        this.pq = new PriorityQueue(this.compareFn);
        this.pqMaxSize = pqMaxSize;
    }
    enqueue(item) {
        if (this.pq.size() < this.pqMaxSize) {
            this.pq.enq(item);
        }
        else {
            const topItem = this.pq.peek();
            if (this.compareFn(topItem, item) > 0) {
                this.pq.deq();
                this.pq.enq(item);
            }
        }
    }
    dequeue() {
        return this.pq.deq();
    }
    size() {
        return this.pq.size();
    }
    isEmpty() {
        return this.pq.isEmpty();
    }
    peek() {
        return this.pq.peek();
    }
    getTopElements() {
        const elements = [];
        while (!this.pq.isEmpty()) {
            elements.unshift(this.pq.deq());
        }
        return elements;
    }
    // Create a new instance of NonStreamingOrderByPriorityQueue with a reversed compare function and the same maximum size.
    // Enqueue all elements from the current priority queue into the reverse priority queue.
    reverse() {
        const reversePQ = new NonStreamingOrderByPriorityQueue((a, b) => -this.compareFn(a, b), this.pqMaxSize);
        while (!this.pq.isEmpty()) {
            reversePQ.enqueue(this.pq.deq());
        }
        return reversePQ;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class NonStreamingOrderByMap {
    constructor(compareFn) {
        this.compareFn = compareFn;
        this.map = new Map();
    }
    set(key, value) {
        if (!this.map.has(key)) {
            this.map.set(key, value);
        }
        else {
            const oldValue = this.map.get(key);
            if (this.replaceResults(oldValue, value)) {
                this.map.set(key, value);
            }
        }
    }
    get(key) {
        if (!this.map.has(key))
            return undefined;
        return this.map.get(key);
    }
    getAllValues() {
        const res = [];
        for (const [key, value] of this.map) {
            res.push(value);
            this.map.delete(key);
        }
        return res;
    }
    replaceResults(res1, res2) {
        const res = this.compareFn(res1, res2);
        if (res < 0)
            return true;
        return false;
    }
    size() {
        return this.map.size;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
const TYPEORDCOMPARATOR = Object.freeze({
    NoValue: {
        ord: 0,
    },
    undefined: {
        ord: 1,
    },
    boolean: {
        ord: 2,
        compFunc: (a, b) => {
            return a === b ? 0 : a > b ? 1 : -1;
        },
    },
    number: {
        ord: 4,
        compFunc: (a, b) => {
            return a === b ? 0 : a > b ? 1 : -1;
        },
    },
    string: {
        ord: 5,
        compFunc: (a, b) => {
            return a === b ? 0 : a > b ? 1 : -1;
        },
    },
});
/** @hidden */
class OrderByComparator {
    constructor(sortOrder) {
        this.sortOrder = sortOrder;
    }
    compareItems(item1, item2) {
        const orderByItemsRes1 = this.getOrderByItems(item1);
        const orderByItemsRes2 = this.getOrderByItems(item2);
        for (let i = 0; i < orderByItemsRes1.length; i++) {
            // compares the orderby items one by one
            const compRes = this.compareOrderByItem(orderByItemsRes1[i], orderByItemsRes2[i]);
            if (compRes !== 0) {
                if (this.sortOrder[i] === "Descending") {
                    return compRes;
                }
                else if (this.sortOrder[i] === "Ascending") {
                    return -compRes;
                }
            }
        }
    }
    getOrderByItems(res) {
        return res["orderByItems"];
    }
    compareOrderByItem(orderByItem1, orderByItem2) {
        const type1 = this.getType(orderByItem1);
        const type2 = this.getType(orderByItem2);
        return this.compareValue(orderByItem1["item"], type1, orderByItem2["item"], type2);
    }
    getType(orderByItem) {
        // TODO: any item?
        if (orderByItem === undefined || orderByItem.item === undefined) {
            return "NoValue";
        }
        const type = typeof orderByItem.item;
        if (TYPEORDCOMPARATOR[type] === undefined) {
            throw new Error(`unrecognizable type ${type}`);
        }
        return type;
    }
    compareValue(item1, type1, item2, type2) {
        if (type1 === "object" || type2 === "object") {
            throw new Error("Tried to compare an object type");
        }
        const type1Ord = TYPEORDCOMPARATOR[type1].ord;
        const type2Ord = TYPEORDCOMPARATOR[type2].ord;
        const typeCmp = type1Ord - type2Ord;
        if (typeCmp !== 0) {
            // if the types are different, use type ordinal
            return typeCmp;
        }
        // both are of the same type
        if (type1Ord === TYPEORDCOMPARATOR["undefined"].ord ||
            type1Ord === TYPEORDCOMPARATOR["NoValue"].ord) {
            // if both types are undefined or Null they are equal
            return 0;
        }
        const compFunc = TYPEORDCOMPARATOR[type1].compFunc;
        if (typeof compFunc === "undefined") {
            throw new Error("Cannot find the comparison function");
        }
        // same type and type is defined compare the items
        return compFunc(item1, item2);
    }
}

/** @hidden */
class NonStreamingOrderByDistinctEndpointComponent {
    constructor(executionContext, queryInfo, priorityQueueBufferSize) {
        this.executionContext = executionContext;
        this.queryInfo = queryInfo;
        this.priorityQueueBufferSize = priorityQueueBufferSize;
        this.isCompleted = false;
        this.sortOrders = this.queryInfo.orderBy;
        const comparator = new OrderByComparator(this.sortOrders);
        this.aggregateMap = new NonStreamingOrderByMap((a, b) => {
            return comparator.compareItems(a, b);
        });
        this.nonStreamingOrderByPQ = new NonStreamingOrderByPriorityQueue((a, b) => {
            return comparator.compareItems(b, a);
        }, this.priorityQueueBufferSize);
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        // if size is 0, just return undefined. Valid if query is TOP 0 or LIMIT 0
        if (this.priorityQueueBufferSize === 0) {
            return {
                result: undefined,
                headers: getInitialHeader(),
            };
        }
        let resHeaders = getInitialHeader();
        if (!this.isCompleted && this.executionContext.hasMoreResults()) {
            // Grab the next result
            const { result, headers } = (await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager));
            resHeaders = headers;
            if (result) {
                // make hash of result object and update the map if required.
                const key = await hashObject(result === null || result === void 0 ? void 0 : result.payload);
                this.aggregateMap.set(key, result);
            }
            if (!this.executionContext.hasMoreResults()) {
                this.isCompleted = true;
                await this.buildFinalResultArray();
            }
        }
        if (this.isCompleted) {
            // start returning the results if final result is computed.
            if (this.finalResultArray.length > 0) {
                return {
                    result: this.finalResultArray.shift(),
                    headers: resHeaders,
                };
            }
            else {
                return {
                    result: undefined,
                    headers: getInitialHeader(),
                };
            }
        }
        else {
            // keep returning empty till final results are getting computed.
            return {
                result: {},
                headers: resHeaders,
            };
        }
    }
    /**
     * Build final sorted result array from which responses will be served.
     */
    async buildFinalResultArray() {
        var _a;
        const allValues = this.aggregateMap.getAllValues();
        for (const value of allValues) {
            this.nonStreamingOrderByPQ.enqueue(value);
        }
        const offSet = this.queryInfo.offset ? this.queryInfo.offset : 0;
        const queueSize = this.nonStreamingOrderByPQ.size();
        const finalArraySize = queueSize - offSet;
        if (finalArraySize <= 0) {
            this.finalResultArray = [];
        }
        else {
            this.finalResultArray = new Array(finalArraySize);
            for (let count = finalArraySize - 1; count >= 0; count--) {
                this.finalResultArray[count] = (_a = this.nonStreamingOrderByPQ.dequeue()) === null || _a === void 0 ? void 0 : _a.payload;
            }
        }
    }
    hasMoreResults() {
        if (this.priorityQueueBufferSize === 0)
            return false;
        return this.executionContext.hasMoreResults() || this.finalResultArray.length > 0;
    }
}

class NonStreamingOrderByEndpointComponent {
    /**
     * Represents an endpoint in handling an non-streaming order by query. For each processed orderby
     * result it returns 'payload' item of the result
     *
     * @param executionContext - Underlying Execution Context
     * @hidden
     */
    constructor(executionContext, sortOrders, priorityQueueBufferSize = 2000, offset = 0) {
        this.executionContext = executionContext;
        this.sortOrders = sortOrders;
        this.priorityQueueBufferSize = priorityQueueBufferSize;
        this.offset = offset;
        this.isCompleted = false;
        const comparator = new OrderByComparator(this.sortOrders);
        this.nonStreamingOrderByPQ = new NonStreamingOrderByPriorityQueue((a, b) => {
            return comparator.compareItems(b, a);
        }, this.priorityQueueBufferSize);
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        var _a, _b;
        if (this.priorityQueueBufferSize <= 0 ||
            (this.isCompleted && this.nonStreamingOrderByPQ.isEmpty())) {
            return {
                result: undefined,
                headers: getInitialHeader(),
            };
        }
        if (this.isCompleted && !this.nonStreamingOrderByPQ.isEmpty()) {
            const item = (_a = this.nonStreamingOrderByPQ.dequeue()) === null || _a === void 0 ? void 0 : _a.payload;
            return {
                result: item,
                headers: getInitialHeader(),
            };
        }
        try {
            if (this.executionContext.hasMoreResults()) {
                const { result: item, headers } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
                if (item !== undefined) {
                    this.nonStreamingOrderByPQ.enqueue(item);
                }
                return {
                    result: {},
                    headers,
                };
            }
            else {
                this.isCompleted = true;
                // Reverse the priority queue to get the results in the correct order
                this.nonStreamingOrderByPQ = this.nonStreamingOrderByPQ.reverse();
                // For offset limit case we set the size of priority queue to offset + limit
                // and we drain offset number of items from the priority queue
                while (this.offset < this.priorityQueueBufferSize && this.offset > 0) {
                    this.nonStreamingOrderByPQ.dequeue();
                    this.offset--;
                }
                if (this.nonStreamingOrderByPQ.size() !== 0) {
                    const item = (_b = this.nonStreamingOrderByPQ.dequeue()) === null || _b === void 0 ? void 0 : _b.payload;
                    return {
                        result: item,
                        headers: getInitialHeader(),
                    };
                }
                else {
                    return {
                        result: undefined,
                        headers: getInitialHeader(),
                    };
                }
            }
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
    }
    /**
     * Determine if there are still remaining resources to processs.
     * @returns true if there is other elements to process in the NonStreamingOrderByEndpointComponent.
     */
    hasMoreResults() {
        return (this.priorityQueueBufferSize > 0 &&
            (this.executionContext.hasMoreResults() || this.nonStreamingOrderByPQ.size() !== 0));
    }
}

/** @hidden */
class PipelinedQueryExecutionContext {
    constructor(clientContext, collectionLink, query, options, partitionedQueryExecutionInfo) {
        this.clientContext = clientContext;
        this.collectionLink = collectionLink;
        this.query = query;
        this.options = options;
        this.partitionedQueryExecutionInfo = partitionedQueryExecutionInfo;
        this.vectorSearchBufferSize = 0;
        this.nonStreamingOrderBy = false;
        this.endpoint = null;
        this.pageSize = options["maxItemCount"];
        if (this.pageSize === undefined) {
            this.pageSize = PipelinedQueryExecutionContext.DEFAULT_PAGE_SIZE;
        }
        // Pick between Nonstreaming and streaming endpoints
        this.nonStreamingOrderBy = partitionedQueryExecutionInfo.queryInfo.hasNonStreamingOrderBy;
        // Pick between parallel vs order by execution context
        const sortOrders = partitionedQueryExecutionInfo.queryInfo.orderBy;
        // TODO: Currently we don't get any field from backend to determine streaming queries
        if (this.nonStreamingOrderBy) {
            this.vectorSearchBufferSize = this.calculateVectorSearchBufferSize(partitionedQueryExecutionInfo.queryInfo, options);
            const distinctType = partitionedQueryExecutionInfo.queryInfo.distinctType;
            const context = new ParallelQueryExecutionContext(this.clientContext, this.collectionLink, this.query, this.options, this.partitionedQueryExecutionInfo);
            if (distinctType === "None") {
                this.endpoint = new NonStreamingOrderByEndpointComponent(context, sortOrders, this.vectorSearchBufferSize, partitionedQueryExecutionInfo.queryInfo.offset);
            }
            else {
                this.endpoint = new NonStreamingOrderByDistinctEndpointComponent(context, partitionedQueryExecutionInfo.queryInfo, this.vectorSearchBufferSize);
            }
        }
        else {
            if (Array.isArray(sortOrders) && sortOrders.length > 0) {
                // Need to wrap orderby execution context in endpoint component, since the data is nested as a \
                //      "payload" property.
                this.endpoint = new OrderByEndpointComponent(new OrderByQueryExecutionContext(this.clientContext, this.collectionLink, this.query, this.options, this.partitionedQueryExecutionInfo));
            }
            else {
                this.endpoint = new ParallelQueryExecutionContext(this.clientContext, this.collectionLink, this.query, this.options, this.partitionedQueryExecutionInfo);
            }
            if (Object.keys(partitionedQueryExecutionInfo.queryInfo.groupByAliasToAggregateType).length >
                0 ||
                partitionedQueryExecutionInfo.queryInfo.aggregates.length > 0 ||
                partitionedQueryExecutionInfo.queryInfo.groupByExpressions.length > 0) {
                if (partitionedQueryExecutionInfo.queryInfo.hasSelectValue) {
                    this.endpoint = new GroupByValueEndpointComponent(this.endpoint, partitionedQueryExecutionInfo.queryInfo);
                }
                else {
                    this.endpoint = new GroupByEndpointComponent(this.endpoint, partitionedQueryExecutionInfo.queryInfo);
                }
            }
            // If top then add that to the pipeline. TOP N is effectively OFFSET 0 LIMIT N
            const top = partitionedQueryExecutionInfo.queryInfo.top;
            if (typeof top === "number") {
                this.endpoint = new OffsetLimitEndpointComponent(this.endpoint, 0, top);
            }
            // If offset+limit then add that to the pipeline
            const limit = partitionedQueryExecutionInfo.queryInfo.limit;
            const offset = partitionedQueryExecutionInfo.queryInfo.offset;
            if (typeof limit === "number" && typeof offset === "number") {
                this.endpoint = new OffsetLimitEndpointComponent(this.endpoint, offset, limit);
            }
            // If distinct then add that to the pipeline
            const distinctType = partitionedQueryExecutionInfo.queryInfo.distinctType;
            if (distinctType === "Ordered") {
                this.endpoint = new OrderedDistinctEndpointComponent(this.endpoint);
            }
            if (distinctType === "Unordered") {
                this.endpoint = new UnorderedDistinctEndpointComponent(this.endpoint);
            }
        }
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        return this.endpoint.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
    }
    // Removed callback here beacuse it wouldn't have ever worked...
    hasMoreResults() {
        return this.endpoint.hasMoreResults();
    }
    async fetchMore(diagnosticNode, operationOptions, ruConsumedManager) {
        // if the wrapped endpoint has different implementation for fetchMore use that
        // otherwise use the default implementation
        if (typeof this.endpoint.fetchMore === "function") {
            return this.endpoint.fetchMore(diagnosticNode, operationOptions, ruConsumedManager);
        }
        else {
            this.fetchBuffer = [];
            this.fetchMoreRespHeaders = getInitialHeader();
            return this.nonStreamingOrderBy
                ? this._nonStreamingFetchMoreImplementation(diagnosticNode, operationOptions, ruConsumedManager)
                : this._fetchMoreImplementation(diagnosticNode, operationOptions, ruConsumedManager);
        }
    }
    async _fetchMoreImplementation(diagnosticNode, operationOptions, ruConsumedManager) {
        try {
            const { result: item, headers } = await this.endpoint.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
            mergeHeaders(this.fetchMoreRespHeaders, headers);
            if (item === undefined) {
                // no more results
                if (this.fetchBuffer.length === 0) {
                    return {
                        result: undefined,
                        headers: this.fetchMoreRespHeaders,
                    };
                }
                else {
                    // Just give what we have
                    const temp = this.fetchBuffer;
                    this.fetchBuffer = [];
                    return { result: temp, headers: this.fetchMoreRespHeaders };
                }
            }
            else {
                this.fetchBuffer.push(item);
                if (this.fetchBuffer.length >= this.pageSize) {
                    // fetched enough results
                    const temp = this.fetchBuffer.slice(0, this.pageSize);
                    this.fetchBuffer = this.fetchBuffer.splice(this.pageSize);
                    return { result: temp, headers: this.fetchMoreRespHeaders };
                }
                else {
                    // recursively fetch more
                    // TODO: is recursion a good idea?
                    return this._fetchMoreImplementation(diagnosticNode, operationOptions, ruConsumedManager);
                }
            }
        }
        catch (err) {
            mergeHeaders(this.fetchMoreRespHeaders, err.headers);
            err.headers = this.fetchMoreRespHeaders;
            if (err.code === RUCapPerOperationExceededErrorCode && err.fetchedResults) {
                err.fetchedResults.push(...this.fetchBuffer);
            }
            if (err) {
                throw err;
            }
        }
    }
    async _nonStreamingFetchMoreImplementation(diagnosticNode, operationOptions, ruConsumedManager) {
        try {
            const { result: item, headers } = await this.endpoint.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
            mergeHeaders(this.fetchMoreRespHeaders, headers);
            if (item === undefined) {
                // no more results
                if (this.fetchBuffer.length === 0) {
                    return {
                        result: undefined,
                        headers: this.fetchMoreRespHeaders,
                    };
                }
                else {
                    // Just give what we have
                    const temp = this.fetchBuffer;
                    this.fetchBuffer = [];
                    return { result: temp, headers: this.fetchMoreRespHeaders };
                }
            }
            else {
                const ruConsumed = await ruConsumedManager.getRUConsumed();
                const maxRUAllowed = operationOptions && operationOptions.ruCapPerOperation
                    ? operationOptions.ruCapPerOperation
                    : Constants$1.NonStreamingQueryDefaultRUThreshold;
                // append the result
                if (typeof item !== "object") {
                    this.fetchBuffer.push(item);
                }
                else if (Object.keys(item).length !== 0) {
                    this.fetchBuffer.push(item);
                }
                if (this.fetchBuffer.length >= this.pageSize) {
                    // fetched enough results
                    const temp = this.fetchBuffer.slice(0, this.pageSize);
                    this.fetchBuffer = this.fetchBuffer.splice(this.pageSize);
                    return { result: temp, headers: this.fetchMoreRespHeaders };
                }
                else if (ruConsumed * 2 < maxRUAllowed) {
                    // recursively fetch more only if we have more than 50% RUs left.
                    return this._nonStreamingFetchMoreImplementation(diagnosticNode, operationOptions, ruConsumedManager);
                }
                else {
                    return { result: [], headers: this.fetchMoreRespHeaders };
                }
            }
        }
        catch (err) {
            mergeHeaders(this.fetchMoreRespHeaders, err.headers);
            err.headers = this.fetchMoreRespHeaders;
            if (err.code === RUCapPerOperationExceededErrorCode && err.fetchedResults) {
                err.fetchedResults.push(...this.fetchBuffer);
            }
            if (err) {
                throw err;
            }
        }
    }
    calculateVectorSearchBufferSize(queryInfo, options) {
        if (queryInfo.top === 0 || queryInfo.limit === 0)
            return 0;
        return queryInfo.top
            ? queryInfo.top
            : queryInfo.limit
                ? queryInfo.offset + queryInfo.limit
                : options["vectorSearchBufferSize"] && options["vectorSearchBufferSize"] > 0
                    ? options["vectorSearchBufferSize"]
                    : PipelinedQueryExecutionContext.DEFAULT_VECTOR_SEARCH_BUFFER_SIZE;
    }
}
PipelinedQueryExecutionContext.DEFAULT_PAGE_SIZE = 10;
PipelinedQueryExecutionContext.DEFAULT_VECTOR_SEARCH_BUFFER_SIZE = 2000;

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Represents a QueryIterator Object, an implementation of feed or query response that enables
 * traversal and iterating over the response
 * in the Azure Cosmos DB database service.
 */
class QueryIterator {
    /**
     * @hidden
     */
    constructor(clientContext, query, options, fetchFunctions, resourceLink, resourceType) {
        this.clientContext = clientContext;
        this.query = query;
        this.options = options;
        this.fetchFunctions = fetchFunctions;
        this.resourceLink = resourceLink;
        this.resourceType = resourceType;
        this.nonStreamingOrderBy = false;
        this.query = query;
        this.fetchFunctions = fetchFunctions;
        this.options = options || {};
        this.resourceLink = resourceLink;
        this.fetchAllLastResHeaders = getInitialHeader();
        this.reset();
        this.isInitialized = false;
    }
    /**
     * Gets an async iterator that will yield results until completion.
     *
     * NOTE: AsyncIterators are a very new feature and you might need to
     * use polyfils/etc. in order to use them in your code.
     *
     * If you're using TypeScript, you can use the following polyfill as long
     * as you target ES6 or higher and are running on Node 6 or higher.
     *
     * ```typescript
     * if (!Symbol || !Symbol.asyncIterator) {
     *   (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
     * }
     * ```
     *
     * @example Iterate over all databases
     * ```typescript
     * for await(const { resources: db } of client.databases.readAll().getAsyncIterator()) {
     *   console.log(`Got ${db} from AsyncIterator`);
     * }
     * ```
     */
    getAsyncIterator(options) {
        return tslib.__asyncGenerator(this, arguments, function* getAsyncIterator_1() {
            this.reset();
            let diagnosticNode = new DiagnosticNodeInternal(this.clientContext.diagnosticLevel, exports.DiagnosticNodeType.CLIENT_REQUEST_NODE, null);
            this.queryPlanPromise = this.fetchQueryPlan(diagnosticNode);
            let ruConsumedManager;
            if (options && options.ruCapPerOperation) {
                ruConsumedManager = new RUConsumedManager();
            }
            while (this.queryExecutionContext.hasMoreResults()) {
                let response;
                try {
                    response = yield tslib.__await(this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager));
                }
                catch (error) {
                    if (this.needsQueryPlan(error)) {
                        yield tslib.__await(this.createPipelinedExecutionContext());
                        try {
                            response = yield tslib.__await(this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager));
                        }
                        catch (queryError) {
                            this.handleSplitError(queryError);
                        }
                    }
                    else {
                        throw error;
                    }
                }
                const feedResponse = new FeedResponse(response.result, response.headers, this.queryExecutionContext.hasMoreResults(), diagnosticNode.toDiagnostic(this.clientContext.getClientConfig()));
                diagnosticNode = new DiagnosticNodeInternal(this.clientContext.diagnosticLevel, exports.DiagnosticNodeType.CLIENT_REQUEST_NODE, null);
                if (response.result !== undefined) {
                    yield yield tslib.__await(feedResponse);
                }
            }
        });
    }
    /**
     * Determine if there are still remaining resources to process based on the value of the continuation token or the
     * elements remaining on the current batch in the QueryIterator.
     * @returns true if there is other elements to process in the QueryIterator.
     */
    hasMoreResults() {
        return this.queryExecutionContext.hasMoreResults();
    }
    /**
     * Fetch all pages for the query and return a single FeedResponse.
     */
    async fetchAll(options) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.fetchAllInternal(diagnosticNode, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async fetchAllInternal(diagnosticNode, options) {
        this.reset();
        let response;
        try {
            response = await this.toArrayImplementation(diagnosticNode, options);
        }
        catch (error) {
            this.handleSplitError(error);
        }
        return response;
    }
    /**
     * Retrieve the next batch from the feed.
     *
     * This may or may not fetch more pages from the backend depending on your settings
     * and the type of query. Aggregate queries will generally fetch all backend pages
     * before returning the first batch of responses.
     */
    async fetchNext(options) {
        return withDiagnostics(async (diagnosticNode) => {
            // Enabling RU metrics for all the fetchNext operations
            const ruConsumedManager = new RUConsumedManager();
            this.queryPlanPromise = withMetadataDiagnostics(async (metadataNode) => {
                return this.fetchQueryPlan(metadataNode);
            }, diagnosticNode, exports.MetadataLookUpType.QueryPlanLookUp);
            if (!this.isInitialized) {
                await this.init();
            }
            let response;
            try {
                response = await this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager);
            }
            catch (error) {
                if (this.needsQueryPlan(error)) {
                    await this.createPipelinedExecutionContext();
                    try {
                        response = await this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager);
                    }
                    catch (queryError) {
                        this.handleSplitError(queryError);
                    }
                }
                else {
                    throw error;
                }
            }
            return new FeedResponse(response.result, response.headers, this.queryExecutionContext.hasMoreResults(), getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Reset the QueryIterator to the beginning and clear all the resources inside it
     */
    reset() {
        this.queryPlanPromise = undefined;
        this.fetchAllLastResHeaders = getInitialHeader();
        this.fetchAllTempResources = [];
        this.queryExecutionContext = new DefaultQueryExecutionContext(this.options, this.fetchFunctions);
    }
    async toArrayImplementation(diagnosticNode, options) {
        let ruConsumedManager;
        if (options && options.ruCapPerOperation) {
            ruConsumedManager = new RUConsumedManager();
        }
        this.queryPlanPromise = withMetadataDiagnostics(async (metadataNode) => {
            return this.fetchQueryPlan(metadataNode);
        }, diagnosticNode, exports.MetadataLookUpType.QueryPlanLookUp);
        // this.queryPlanPromise = this.fetchQueryPlan(diagnosticNode);
        if (!this.isInitialized) {
            await this.init();
        }
        while (this.queryExecutionContext.hasMoreResults()) {
            let response;
            try {
                response = await this.queryExecutionContext.nextItem(diagnosticNode, options, ruConsumedManager);
            }
            catch (error) {
                if (this.needsQueryPlan(error)) {
                    await this.createPipelinedExecutionContext();
                    response = await this.queryExecutionContext.nextItem(diagnosticNode, options, ruConsumedManager);
                }
                else if (error.code === RUCapPerOperationExceededErrorCode && error.fetchedResults) {
                    error.fetchedResults.forEach((item) => {
                        this.fetchAllTempResources.push(item);
                    });
                    error.fetchedResults = this.fetchAllTempResources;
                    throw error;
                }
                else {
                    throw error;
                }
            }
            const { result, headers } = response;
            // concatenate the results and fetch more
            mergeHeaders(this.fetchAllLastResHeaders, headers);
            if (result !== undefined) {
                if (this.nonStreamingOrderBy &&
                    typeof result === "object" &&
                    Object.keys(result).length === 0) ;
                else
                    this.fetchAllTempResources.push(result);
            }
        }
        return new FeedResponse(this.fetchAllTempResources, this.fetchAllLastResHeaders, this.queryExecutionContext.hasMoreResults(), getEmptyCosmosDiagnostics());
    }
    async createPipelinedExecutionContext() {
        const queryPlanResponse = await this.queryPlanPromise;
        // We always coerce queryPlanPromise to resolved. So if it errored, we need to manually inspect the resolved value
        if (queryPlanResponse instanceof Error) {
            throw queryPlanResponse;
        }
        const queryPlan = queryPlanResponse.result;
        const queryInfo = queryPlan.queryInfo;
        this.nonStreamingOrderBy = queryInfo.hasNonStreamingOrderBy ? true : false;
        if (queryInfo.aggregates.length > 0 && queryInfo.hasSelectValue === false) {
            throw new Error("Aggregate queries must use the VALUE keyword");
        }
        this.queryExecutionContext = new PipelinedQueryExecutionContext(this.clientContext, this.resourceLink, this.query, this.options, queryPlan);
    }
    async fetchQueryPlan(diagnosticNode) {
        if (!this.queryPlanPromise && this.resourceType === exports.ResourceType.item) {
            return this.clientContext
                .getQueryPlan(getPathFromLink(this.resourceLink) + "/docs", exports.ResourceType.item, this.resourceLink, this.query, this.options, diagnosticNode)
                .catch((error) => error); // Without this catch, node reports an unhandled rejection. So we stash the promise as resolved even if it errored.
        }
        return this.queryPlanPromise;
    }
    needsQueryPlan(error) {
        var _a;
        let needsQueryPlanValue = false;
        if (((_a = error.body) === null || _a === void 0 ? void 0 : _a.additionalErrorInfo) ||
            error.message.includes("Cross partition query only supports")) {
            needsQueryPlanValue =
                error.code === StatusCodes.BadRequest && this.resourceType === exports.ResourceType.item;
        }
        return needsQueryPlanValue;
    }
    async init() {
        if (this.isInitialized === true) {
            return;
        }
        if (this.initPromise === undefined) {
            this.initPromise = this._init();
        }
        return this.initPromise;
    }
    async _init() {
        if (this.options.forceQueryPlan === true && this.resourceType === exports.ResourceType.item) {
            await this.createPipelinedExecutionContext();
        }
        this.isInitialized = true;
    }
    handleSplitError(err) {
        if (err.code === 410) {
            const error = new Error("Encountered partition split and could not recover. This request is retryable");
            error.code = 503;
            error.originalError = err;
            throw error;
        }
        else {
            throw err;
        }
    }
}

class ConflictResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, conflict, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.conflict = conflict;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
async function readPartitionKeyDefinition(diagnosticNode, container) {
    const partitionKeyDefinition = await container.readPartitionKeyDefinition(diagnosticNode);
    return partitionKeyDefinition.resource;
}

/**
 * Use to read or delete a given {@link Conflict} by id.
 *
 * @see {@link Conflicts} to query or read all conflicts.
 */
class Conflict {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return `/${this.container.url}/${Constants$1.Path.ConflictsPathSegment}/${this.id}`;
    }
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link Conflict}.
     */
    constructor(container, id, clientContext, partitionKey) {
        this.container = container;
        this.id = id;
        this.clientContext = clientContext;
        this.partitionKey = partitionKey;
        this.partitionKey = partitionKey;
    }
    /**
     * Read the {@link ConflictDefinition} for the given {@link Conflict}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url, exports.ResourceType.conflicts);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: exports.ResourceType.user,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new ConflictResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link ConflictDefinition}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = undefinedPartitionKey(partitionKeyDefinition);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.conflicts,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ConflictResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/**
 * Use to query or read all conflicts.
 *
 * @see {@link Conflict} to read or delete a given {@link Conflict} by id.
 */
class Conflicts {
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.container.url, exports.ResourceType.conflicts);
        const id = getIdFromLink(this.container.url);
        return new QueryIterator(this.clientContext, query, options, (diagNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.conflicts,
                resourceId: id,
                resultFn: (result) => result.Conflicts,
                query,
                options: innerOptions,
                diagnosticNode: diagNode,
            });
        });
    }
    /**
     * Reads all conflicts
     * @param options - Use to set options like response page size, continuation tokens, etc.
     */
    readAll(options) {
        return this.query(undefined, options);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
exports.ConflictResolutionMode = void 0;
(function (ConflictResolutionMode) {
    ConflictResolutionMode["Custom"] = "Custom";
    ConflictResolutionMode["LastWriterWins"] = "LastWriterWins";
})(exports.ConflictResolutionMode || (exports.ConflictResolutionMode = {}));

class ItemResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, subsstatusCode, item, diagnostics) {
        super(resource, headers, statusCode, diagnostics, subsstatusCode);
        this.item = item;
    }
}

/**
 * Used to perform operations on a specific item.
 *
 * @see {@link Items} for operations on all items; see `container.items`.
 */
class Item {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createDocumentUri(this.container.database.id, this.container.id, this.id);
    }
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link Item}.
     * @param partitionKey - The primary key of the given {@link Item} (only for partitioned containers).
     */
    constructor(container, id, clientContext, partitionKey) {
        this.container = container;
        this.id = id;
        this.clientContext = clientContext;
        this.partitionKey =
            partitionKey === undefined ? undefined : convertToInternalPartitionKey(partitionKey);
    }
    /**
     * Read the item's definition.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     * If the type, T, is a class, it won't pass `typeof` comparisons, because it won't have a match prototype.
     * It's recommended to only use interfaces.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param options - Additional options for the request
     *
     * @example Using custom type for response
     * ```typescript
     * interface TodoItem {
     *   title: string;
     *   done: bool;
     *   id: string;
     * }
     *
     * let item: TodoItem;
     * ({body: item} = await item.read<TodoItem>());
     * ```
     */
    async read(options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = undefinedPartitionKey(partitionKeyDefinition);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            let response;
            try {
                response = await this.clientContext.read({
                    path,
                    resourceType: exports.ResourceType.item,
                    resourceId: id,
                    options,
                    partitionKey: this.partitionKey,
                    diagnosticNode,
                });
            }
            catch (error) {
                if (error.code !== StatusCodes.NotFound) {
                    throw error;
                }
                response = error;
            }
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    async replace(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyResponse = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = extractPartitionKeys(body, partitionKeyResponse);
            }
            const err = {};
            if (!isItemResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: exports.ResourceType.item,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the item.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * @param options - Additional options for the request
     */
    async delete(options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyResponse = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = undefinedPartitionKey(partitionKeyResponse);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.item,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Perform a JSONPatch on the item.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * @param options - Additional options for the request
     */
    async patch(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyResponse = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = extractPartitionKeys(body, partitionKeyResponse);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.patch({
                body,
                path,
                resourceType: exports.ResourceType.item,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/**
 * A single response page from the Azure Cosmos DB Change Feed
 */
class ChangeFeedResponse {
    /**
     * @internal
     */
    constructor(
    /**
     * Gets the items returned in the response from Azure Cosmos DB
     */
    result, 
    /**
     * Gets the number of items returned in the response from Azure Cosmos DB
     */
    count, 
    /**
     * Gets the status code of the response from Azure Cosmos DB
     */
    statusCode, headers, diagnostics) {
        this.result = result;
        this.count = count;
        this.statusCode = statusCode;
        this.diagnostics = diagnostics;
        this.headers = Object.freeze(headers);
    }
    /**
     * Gets the request charge for this request from the Azure Cosmos DB service.
     */
    get requestCharge() {
        const rus = this.headers[Constants$1.HttpHeaders.RequestCharge];
        return rus ? parseInt(rus, 10) : null;
    }
    /**
     * Gets the activity ID for the request from the Azure Cosmos DB service.
     */
    get activityId() {
        return this.headers[Constants$1.HttpHeaders.ActivityId];
    }
    /**
     * Gets the continuation token to be used for continuing enumeration of the Azure Cosmos DB service.
     *
     * This is equivalent to the `etag` property.
     */
    get continuation() {
        return this.etag;
    }
    /**
     * Gets the session token for use in session consistency reads from the Azure Cosmos DB service.
     */
    get sessionToken() {
        return this.headers[Constants$1.HttpHeaders.SessionToken];
    }
    /**
     * Gets the entity tag associated with last transaction in the Azure Cosmos DB service,
     * which can be used as If-Non-Match Access condition for ReadFeed REST request or
     * `continuation` property of `ChangeFeedOptions` parameter for
     * `Items.changeFeed()`
     * to get feed changes since the transaction specified by this entity tag.
     *
     * This is equivalent to the `continuation` property.
     */
    get etag() {
        return this.headers[Constants$1.HttpHeaders.ETag];
    }
}

/**
 * Provides iterator for change feed.
 *
 * Use `Items.changeFeed()` to get an instance of the iterator.
 */
class ChangeFeedIterator {
    /**
     * @internal
     */
    constructor(clientContext, resourceId, resourceLink, partitionKey, changeFeedOptions) {
        this.clientContext = clientContext;
        this.resourceId = resourceId;
        this.resourceLink = resourceLink;
        this.partitionKey = partitionKey;
        this.changeFeedOptions = changeFeedOptions;
        // partition key XOR partition key range id
        const partitionKeyValid = partitionKey !== undefined;
        this.isPartitionSpecified = partitionKeyValid;
        let canUseStartFromBeginning = true;
        if (changeFeedOptions.continuation) {
            this.nextIfNoneMatch = changeFeedOptions.continuation;
            canUseStartFromBeginning = false;
        }
        if (changeFeedOptions.startTime) {
            // .toUTCString() is platform specific, but most platforms use RFC 1123.
            // In ECMAScript 2018, this was standardized to RFC 1123.
            // See for more info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString
            this.ifModifiedSince = changeFeedOptions.startTime.toUTCString();
            canUseStartFromBeginning = false;
        }
        if (canUseStartFromBeginning && !changeFeedOptions.startFromBeginning) {
            this.nextIfNoneMatch = ChangeFeedIterator.IfNoneMatchAllHeaderValue;
        }
    }
    /**
     * Gets a value indicating whether there are potentially additional results that can be retrieved.
     *
     * Initially returns true. This value is set based on whether the last execution returned a continuation token.
     *
     * @returns Boolean value representing if whether there are potentially additional results that can be retrieved.
     */
    get hasMoreResults() {
        return this.lastStatusCode !== StatusCodes.NotModified;
    }
    /**
     * Gets an async iterator which will yield pages of results from Azure Cosmos DB.
     */
    getAsyncIterator() {
        return tslib.__asyncGenerator(this, arguments, function* getAsyncIterator_1() {
            do {
                const result = yield tslib.__await(this.fetchNext());
                if (result.count > 0) {
                    yield yield tslib.__await(result);
                }
            } while (this.hasMoreResults);
        });
    }
    /**
     * Read feed and retrieves the next page of results in Azure Cosmos DB.
     */
    async fetchNext() {
        return withDiagnostics(async (diagnosticNode) => {
            const response = await this.getFeedResponse(diagnosticNode);
            this.lastStatusCode = response.statusCode;
            this.nextIfNoneMatch = response.headers[Constants$1.HttpHeaders.ETag];
            return response;
        }, this.clientContext);
    }
    async getFeedResponse(diagnosticNode) {
        if (!this.isPartitionSpecified) {
            throw new Error("Container is partitioned, but no partition key or partition key range id was specified.");
        }
        const feedOptions = { initialHeaders: {}, useIncrementalFeed: true };
        if (typeof this.changeFeedOptions.maxItemCount === "number") {
            feedOptions.maxItemCount = this.changeFeedOptions.maxItemCount;
        }
        if (this.changeFeedOptions.sessionToken) {
            feedOptions.sessionToken = this.changeFeedOptions.sessionToken;
        }
        if (this.nextIfNoneMatch) {
            feedOptions.accessCondition = {
                type: Constants$1.HttpHeaders.IfNoneMatch,
                condition: this.nextIfNoneMatch,
            };
        }
        if (this.ifModifiedSince) {
            feedOptions.initialHeaders[Constants$1.HttpHeaders.IfModifiedSince] = this.ifModifiedSince;
        }
        const response = await this.clientContext.queryFeed({
            path: this.resourceLink,
            resourceType: exports.ResourceType.item,
            resourceId: this.resourceId,
            resultFn: (result) => (result ? result.Documents : []),
            query: undefined,
            options: feedOptions,
            partitionKey: this.partitionKey,
            diagnosticNode: diagnosticNode,
        }); // TODO: some funky issues with query feed. Probably need to change it up.
        return new ChangeFeedResponse(response.result, response.result ? response.result.length : 0, response.code, response.headers, getEmptyCosmosDiagnostics());
    }
}
ChangeFeedIterator.IfNoneMatchAllHeaderValue = "*";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const BytePrefix = {
    Undefined: "00",
    Null: "01",
    False: "02",
    True: "03",
    MinNumber: "04",
    Number: "05",
    MaxNumber: "06",
    MinString: "07",
    String: "08",
    MaxString: "09",
    Int64: "0a",
    Int32: "0b",
    Int16: "0c",
    Int8: "0d",
    Uint64: "0e",
    Uint32: "0f",
    Uint16: "10",
    Uint8: "11",
    Binary: "12",
    Guid: "13",
    Float: "14",
    Infinity: "FF",
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function writeNumberForBinaryEncodingJSBI(hash) {
    let payload = encodeNumberAsUInt64JSBI(hash);
    let outputStream = Buffer.from(BytePrefix.Number, "hex");
    const firstChunk = JSBI.asUintN(64, JSBI.signedRightShift(payload, JSBI.BigInt(56)));
    outputStream = Buffer.concat([outputStream, Buffer.from(firstChunk.toString(16), "hex")]);
    payload = JSBI.asUintN(64, JSBI.leftShift(JSBI.BigInt(payload), JSBI.BigInt(0x8)));
    let byteToWrite = JSBI.BigInt(0);
    let shifted;
    let padded;
    do {
        {
            // we pad because after shifting because we will produce characters like "f" or similar,
            // which cannot be encoded as hex in a buffer because they are invalid hex
            // https://github.com/nodejs/node/issues/24491
            padded = byteToWrite.toString(16).padStart(2, "0");
            if (padded !== "00") {
                outputStream = Buffer.concat([outputStream, Buffer.from(padded, "hex")]);
            }
        }
        shifted = JSBI.asUintN(64, JSBI.signedRightShift(payload, JSBI.BigInt(56)));
        byteToWrite = JSBI.asUintN(64, JSBI.bitwiseOr(shifted, JSBI.BigInt(0x01)));
        payload = JSBI.asUintN(64, JSBI.leftShift(payload, JSBI.BigInt(7)));
    } while (JSBI.notEqual(payload, JSBI.BigInt(0)));
    const lastChunk = JSBI.asUintN(64, JSBI.bitwiseAnd(byteToWrite, JSBI.BigInt(0xfe)));
    // we pad because after shifting because we will produce characters like "f" or similar,
    // which cannot be encoded as hex in a buffer because they are invalid hex
    // https://github.com/nodejs/node/issues/24491
    padded = lastChunk.toString(16).padStart(2, "0");
    if (padded !== "00") {
        outputStream = Buffer.concat([outputStream, Buffer.from(padded, "hex")]);
    }
    return outputStream;
}
function encodeNumberAsUInt64JSBI(value) {
    const rawValueBits = getRawBitsJSBI(value);
    const mask = JSBI.BigInt(0x8000000000000000);
    const returned = rawValueBits < mask
        ? JSBI.bitwiseXor(rawValueBits, mask)
        : JSBI.add(JSBI.bitwiseNot(rawValueBits), JSBI.BigInt(1));
    return returned;
}
function doubleToByteArrayJSBI(double) {
    const output = Buffer.alloc(8);
    const lng = getRawBitsJSBI(double);
    for (let i = 0; i < 8; i++) {
        output[i] = JSBI.toNumber(JSBI.bitwiseAnd(JSBI.signedRightShift(lng, JSBI.multiply(JSBI.BigInt(i), JSBI.BigInt(8))), JSBI.BigInt(0xff)));
    }
    return output;
}
function getRawBitsJSBI(value) {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, value);
    return JSBI.BigInt(`0x${buf2hex(view.buffer)}`);
}
function buf2hex(buffer) {
    return Array.prototype.map
        .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
        .join("");
}

// +----------------------------------------------------------------------+
// | murmurHash3js.js v3.0.1 // https://github.com/pid/murmurHash3js
// | A javascript implementation of MurmurHash3's x86 hashing algorithms. |
// |----------------------------------------------------------------------|
// | Copyright (c) 2012-2015 Karan Lyons                                       |
// | https://github.com/karanlyons/murmurHash3.js/blob/c1778f75792abef7bdd74bc85d2d4e1a3d25cfe9/murmurHash3.js |
// | Freely distributable under the MIT license.                          |
// +----------------------------------------------------------------------+
// PRIVATE FUNCTIONS
// -----------------
function _x86Multiply(m, n) {
    //
    // Given two 32bit ints, returns the two multiplied together as a
    // 32bit int.
    //
    return (m & 0xffff) * n + ((((m >>> 16) * n) & 0xffff) << 16);
}
function _x86Rotl(m, n) {
    //
    // Given a 32bit int and an int representing a number of bit positions,
    // returns the 32bit int rotated left by that number of positions.
    //
    return (m << n) | (m >>> (32 - n));
}
function _x86Fmix(h) {
    //
    // Given a block, returns murmurHash3's final x86 mix of that block.
    //
    h ^= h >>> 16;
    h = _x86Multiply(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = _x86Multiply(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h;
}
function _x64Add(m, n) {
    //
    // Given two 64bit ints (as an array of two 32bit ints) returns the two
    // added together as a 64bit int (as an array of two 32bit ints).
    //
    m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
    n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
    const o = [0, 0, 0, 0];
    o[3] += m[3] + n[3];
    o[2] += o[3] >>> 16;
    o[3] &= 0xffff;
    o[2] += m[2] + n[2];
    o[1] += o[2] >>> 16;
    o[2] &= 0xffff;
    o[1] += m[1] + n[1];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[0] += m[0] + n[0];
    o[0] &= 0xffff;
    return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
}
function _x64Multiply(m, n) {
    //
    // Given two 64bit ints (as an array of two 32bit ints) returns the two
    // multiplied together as a 64bit int (as an array of two 32bit ints).
    //
    m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
    n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
    const o = [0, 0, 0, 0];
    o[3] += m[3] * n[3];
    o[2] += o[3] >>> 16;
    o[3] &= 0xffff;
    o[2] += m[2] * n[3];
    o[1] += o[2] >>> 16;
    o[2] &= 0xffff;
    o[2] += m[3] * n[2];
    o[1] += o[2] >>> 16;
    o[2] &= 0xffff;
    o[1] += m[1] * n[3];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[1] += m[2] * n[2];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[1] += m[3] * n[1];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[0] += m[0] * n[3] + m[1] * n[2] + m[2] * n[1] + m[3] * n[0];
    o[0] &= 0xffff;
    return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
}
function _x64Rotl(m, n) {
    //
    // Given a 64bit int (as an array of two 32bit ints) and an int
    // representing a number of bit positions, returns the 64bit int (as an
    // array of two 32bit ints) rotated left by that number of positions.
    //
    n %= 64;
    if (n === 32) {
        return [m[1], m[0]];
    }
    else if (n < 32) {
        return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))];
    }
    else {
        n -= 32;
        return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))];
    }
}
function _x64LeftShift(m, n) {
    //
    // Given a 64bit int (as an array of two 32bit ints) and an int
    // representing a number of bit positions, returns the 64bit int (as an
    // array of two 32bit ints) shifted left by that number of positions.
    //
    n %= 64;
    if (n === 0) {
        return m;
    }
    else if (n < 32) {
        return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n];
    }
    else {
        return [m[1] << (n - 32), 0];
    }
}
function _x64Xor(m, n) {
    //
    // Given two 64bit ints (as an array of two 32bit ints) returns the two
    // xored together as a 64bit int (as an array of two 32bit ints).
    //
    return [m[0] ^ n[0], m[1] ^ n[1]];
}
function _x64Fmix(h) {
    //
    // Given a block, returns murmurHash3's final x64 mix of that block.
    // (`[0, h[0] >>> 1]` is a 33 bit unsigned right shift. This is the
    // only place where we need to right shift 64bit ints.)
    //
    h = _x64Xor(h, [0, h[0] >>> 1]);
    h = _x64Multiply(h, [0xff51afd7, 0xed558ccd]);
    h = _x64Xor(h, [0, h[0] >>> 1]);
    h = _x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53]);
    h = _x64Xor(h, [0, h[0] >>> 1]);
    return h;
}
// PUBLIC FUNCTIONS
// ----------------
function x86Hash32(bytes, seed) {
    //
    // Given a string and an optional seed as an int, returns a 32 bit hash
    // using the x86 flavor of MurmurHash3, as an unsigned int.
    //
    seed = seed || 0;
    const remainder = bytes.length % 4;
    const blocks = bytes.length - remainder;
    let h1 = seed;
    let k1 = 0;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let j = 0;
    for (let i = 0; i < blocks; i = i + 4) {
        k1 = bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
        k1 = _x86Multiply(k1, c1);
        k1 = _x86Rotl(k1, 15);
        k1 = _x86Multiply(k1, c2);
        h1 ^= k1;
        h1 = _x86Rotl(h1, 13);
        h1 = _x86Multiply(h1, 5) + 0xe6546b64;
        j = i + 4;
    }
    k1 = 0;
    switch (remainder) {
        case 3:
            k1 ^= bytes[j + 2] << 16;
        case 2:
            k1 ^= bytes[j + 1] << 8;
        case 1:
            k1 ^= bytes[j];
            k1 = _x86Multiply(k1, c1);
            k1 = _x86Rotl(k1, 15);
            k1 = _x86Multiply(k1, c2);
            h1 ^= k1;
    }
    h1 ^= bytes.length;
    h1 = _x86Fmix(h1);
    return h1 >>> 0;
}
function x86Hash128(bytes, seed) {
    //
    // Given a string and an optional seed as an int, returns a 128 bit
    // hash using the x86 flavor of MurmurHash3, as an unsigned hex.
    //
    seed = seed || 0;
    const remainder = bytes.length % 16;
    const blocks = bytes.length - remainder;
    let h1 = seed;
    let h2 = seed;
    let h3 = seed;
    let h4 = seed;
    let k1 = 0;
    let k2 = 0;
    let k3 = 0;
    let k4 = 0;
    const c1 = 0x239b961b;
    const c2 = 0xab0e9789;
    const c3 = 0x38b34ae5;
    const c4 = 0xa1e38b93;
    let j = 0;
    for (let i = 0; i < blocks; i = i + 16) {
        k1 = bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
        k2 = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24);
        k3 = bytes[i + 8] | (bytes[i + 9] << 8) | (bytes[i + 10] << 16) | (bytes[i + 11] << 24);
        k4 = bytes[i + 12] | (bytes[i + 13] << 8) | (bytes[i + 14] << 16) | (bytes[i + 15] << 24);
        k1 = _x86Multiply(k1, c1);
        k1 = _x86Rotl(k1, 15);
        k1 = _x86Multiply(k1, c2);
        h1 ^= k1;
        h1 = _x86Rotl(h1, 19);
        h1 += h2;
        h1 = _x86Multiply(h1, 5) + 0x561ccd1b;
        k2 = _x86Multiply(k2, c2);
        k2 = _x86Rotl(k2, 16);
        k2 = _x86Multiply(k2, c3);
        h2 ^= k2;
        h2 = _x86Rotl(h2, 17);
        h2 += h3;
        h2 = _x86Multiply(h2, 5) + 0x0bcaa747;
        k3 = _x86Multiply(k3, c3);
        k3 = _x86Rotl(k3, 17);
        k3 = _x86Multiply(k3, c4);
        h3 ^= k3;
        h3 = _x86Rotl(h3, 15);
        h3 += h4;
        h3 = _x86Multiply(h3, 5) + 0x96cd1c35;
        k4 = _x86Multiply(k4, c4);
        k4 = _x86Rotl(k4, 18);
        k4 = _x86Multiply(k4, c1);
        h4 ^= k4;
        h4 = _x86Rotl(h4, 13);
        h4 += h1;
        h4 = _x86Multiply(h4, 5) + 0x32ac3b17;
        j = i + 16;
    }
    k1 = 0;
    k2 = 0;
    k3 = 0;
    k4 = 0;
    switch (remainder) {
        case 15:
            k4 ^= bytes[j + 14] << 16;
        case 14:
            k4 ^= bytes[j + 13] << 8;
        case 13:
            k4 ^= bytes[j + 12];
            k4 = _x86Multiply(k4, c4);
            k4 = _x86Rotl(k4, 18);
            k4 = _x86Multiply(k4, c1);
            h4 ^= k4;
        case 12:
            k3 ^= bytes[j + 11] << 24;
        case 11:
            k3 ^= bytes[j + 10] << 16;
        case 10:
            k3 ^= bytes[j + 9] << 8;
        case 9:
            k3 ^= bytes[j + 8];
            k3 = _x86Multiply(k3, c3);
            k3 = _x86Rotl(k3, 17);
            k3 = _x86Multiply(k3, c4);
            h3 ^= k3;
        case 8:
            k2 ^= bytes[j + 7] << 24;
        case 7:
            k2 ^= bytes[j + 6] << 16;
        case 6:
            k2 ^= bytes[j + 5] << 8;
        case 5:
            k2 ^= bytes[j + 4];
            k2 = _x86Multiply(k2, c2);
            k2 = _x86Rotl(k2, 16);
            k2 = _x86Multiply(k2, c3);
            h2 ^= k2;
        case 4:
            k1 ^= bytes[j + 3] << 24;
        case 3:
            k1 ^= bytes[j + 2] << 16;
        case 2:
            k1 ^= bytes[j + 1] << 8;
        case 1:
            k1 ^= bytes[j];
            k1 = _x86Multiply(k1, c1);
            k1 = _x86Rotl(k1, 15);
            k1 = _x86Multiply(k1, c2);
            h1 ^= k1;
    }
    h1 ^= bytes.length;
    h2 ^= bytes.length;
    h3 ^= bytes.length;
    h4 ^= bytes.length;
    h1 += h2;
    h1 += h3;
    h1 += h4;
    h2 += h1;
    h3 += h1;
    h4 += h1;
    h1 = _x86Fmix(h1);
    h2 = _x86Fmix(h2);
    h3 = _x86Fmix(h3);
    h4 = _x86Fmix(h4);
    h1 += h2;
    h1 += h3;
    h1 += h4;
    h2 += h1;
    h3 += h1;
    h4 += h1;
    return (("00000000" + (h1 >>> 0).toString(16)).slice(-8) +
        ("00000000" + (h2 >>> 0).toString(16)).slice(-8) +
        ("00000000" + (h3 >>> 0).toString(16)).slice(-8) +
        ("00000000" + (h4 >>> 0).toString(16)).slice(-8));
}
function x64Hash128(bytes, seed) {
    //
    // Given a string and an optional seed as an int, returns a 128 bit
    // hash using the x64 flavor of MurmurHash3, as an unsigned hex.
    //
    seed = seed || 0;
    const remainder = bytes.length % 16;
    const blocks = bytes.length - remainder;
    let h1 = [0, seed];
    let h2 = [0, seed];
    let k1 = [0, 0];
    let k2 = [0, 0];
    const c1 = [0x87c37b91, 0x114253d5];
    const c2 = [0x4cf5ad43, 0x2745937f];
    let j = 0;
    for (let i = 0; i < blocks; i = i + 16) {
        k1 = [
            bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24),
            bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24),
        ];
        k2 = [
            bytes[i + 12] | (bytes[i + 13] << 8) | (bytes[i + 14] << 16) | (bytes[i + 15] << 24),
            bytes[i + 8] | (bytes[i + 9] << 8) | (bytes[i + 10] << 16) | (bytes[i + 11] << 24),
        ];
        k1 = _x64Multiply(k1, c1);
        k1 = _x64Rotl(k1, 31);
        k1 = _x64Multiply(k1, c2);
        h1 = _x64Xor(h1, k1);
        h1 = _x64Rotl(h1, 27);
        h1 = _x64Add(h1, h2);
        h1 = _x64Add(_x64Multiply(h1, [0, 5]), [0, 0x52dce729]);
        k2 = _x64Multiply(k2, c2);
        k2 = _x64Rotl(k2, 33);
        k2 = _x64Multiply(k2, c1);
        h2 = _x64Xor(h2, k2);
        h2 = _x64Rotl(h2, 31);
        h2 = _x64Add(h2, h1);
        h2 = _x64Add(_x64Multiply(h2, [0, 5]), [0, 0x38495ab5]);
        j = i + 16;
    }
    k1 = [0, 0];
    k2 = [0, 0];
    switch (remainder) {
        case 15:
            k2 = _x64Xor(k2, _x64LeftShift([0, bytes[j + 14]], 48));
        case 14:
            k2 = _x64Xor(k2, _x64LeftShift([0, bytes[j + 13]], 40));
        case 13:
            k2 = _x64Xor(k2, _x64LeftShift([0, bytes[j + 12]], 32));
        case 12:
            k2 = _x64Xor(k2, _x64LeftShift([0, bytes[j + 11]], 24));
        case 11:
            k2 = _x64Xor(k2, _x64LeftShift([0, bytes[j + 10]], 16));
        case 10:
            k2 = _x64Xor(k2, _x64LeftShift([0, bytes[j + 9]], 8));
        case 9:
            k2 = _x64Xor(k2, [0, bytes[j + 8]]);
            k2 = _x64Multiply(k2, c2);
            k2 = _x64Rotl(k2, 33);
            k2 = _x64Multiply(k2, c1);
            h2 = _x64Xor(h2, k2);
        case 8:
            k1 = _x64Xor(k1, _x64LeftShift([0, bytes[j + 7]], 56));
        case 7:
            k1 = _x64Xor(k1, _x64LeftShift([0, bytes[j + 6]], 48));
        case 6:
            k1 = _x64Xor(k1, _x64LeftShift([0, bytes[j + 5]], 40));
        case 5:
            k1 = _x64Xor(k1, _x64LeftShift([0, bytes[j + 4]], 32));
        case 4:
            k1 = _x64Xor(k1, _x64LeftShift([0, bytes[j + 3]], 24));
        case 3:
            k1 = _x64Xor(k1, _x64LeftShift([0, bytes[j + 2]], 16));
        case 2:
            k1 = _x64Xor(k1, _x64LeftShift([0, bytes[j + 1]], 8));
        case 1:
            k1 = _x64Xor(k1, [0, bytes[j]]);
            k1 = _x64Multiply(k1, c1);
            k1 = _x64Rotl(k1, 31);
            k1 = _x64Multiply(k1, c2);
            h1 = _x64Xor(h1, k1);
    }
    h1 = _x64Xor(h1, [0, bytes.length]);
    h2 = _x64Xor(h2, [0, bytes.length]);
    h1 = _x64Add(h1, h2);
    h2 = _x64Add(h2, h1);
    h1 = _x64Fmix(h1);
    h2 = _x64Fmix(h2);
    h1 = _x64Add(h1, h2);
    h2 = _x64Add(h2, h1);
    // Here we reverse h1 and h2 in Cosmos
    // This is an implementation detail and not part of the public spec
    const h1Buff = Buffer.from(("00000000" + (h1[0] >>> 0).toString(16)).slice(-8) +
        ("00000000" + (h1[1] >>> 0).toString(16)).slice(-8), "hex");
    const h1Reversed = reverse$1(h1Buff).toString("hex");
    const h2Buff = Buffer.from(("00000000" + (h2[0] >>> 0).toString(16)).slice(-8) +
        ("00000000" + (h2[1] >>> 0).toString(16)).slice(-8), "hex");
    const h2Reversed = reverse$1(h2Buff).toString("hex");
    return h1Reversed + h2Reversed;
}
function reverse$1(buff) {
    const buffer = Buffer.allocUnsafe(buff.length);
    for (let i = 0, j = buff.length - 1; i <= j; ++i, --j) {
        buffer[i] = buff[j];
        buffer[j] = buff[i];
    }
    return buffer;
}
var MurmurHash = {
    version: "3.0.0",
    x86: {
        hash32: x86Hash32,
        hash128: x86Hash128,
    },
    x64: {
        hash128: x64Hash128,
    },
    inputValidation: true,
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function hashV2PartitionKey(partitionKey) {
    const toHash = Buffer.concat(partitionKey.map(prefixKeyByType$1));
    const hash = MurmurHash.x64.hash128(toHash);
    const reverseBuff = reverse(Buffer.from(hash, "hex"));
    reverseBuff[0] &= 0x3f;
    return reverseBuff.toString("hex").toUpperCase();
}
function prefixKeyByType$1(key) {
    let bytes;
    switch (typeof key) {
        case "string": {
            bytes = Buffer.concat([
                Buffer.from(BytePrefix.String, "hex"),
                Buffer.from(key),
                Buffer.from(BytePrefix.Infinity, "hex"),
            ]);
            return bytes;
        }
        case "number": {
            const numberBytes = doubleToByteArrayJSBI(key);
            bytes = Buffer.concat([Buffer.from(BytePrefix.Number, "hex"), numberBytes]);
            return bytes;
        }
        case "boolean": {
            const prefix = key ? BytePrefix.True : BytePrefix.False;
            return Buffer.from(prefix, "hex");
        }
        case "object": {
            if (key === null) {
                return Buffer.from(BytePrefix.Null, "hex");
            }
            return Buffer.from(BytePrefix.Undefined, "hex");
        }
        case "undefined": {
            return Buffer.from(BytePrefix.Undefined, "hex");
        }
        default:
            throw new Error(`Unexpected type: ${typeof key}`);
    }
}
function reverse(buff) {
    const buffer = Buffer.allocUnsafe(buff.length);
    for (let i = 0, j = buff.length - 1; i <= j; ++i, --j) {
        buffer[i] = buff[j];
        buffer[j] = buff[i];
    }
    return buffer;
}

/**
 * Generate Hash for a `Multi Hash` type partition.
 * @param partitionKey - to be hashed.
 * @returns
 */
function hashMultiHashPartitionKey(partitionKey) {
    return partitionKey.map((keys) => hashV2PartitionKey([keys])).join("");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function writeStringForBinaryEncoding(payload) {
    let outputStream = Buffer.from(BytePrefix.String, "hex");
    const MAX_STRING_BYTES_TO_APPEND = 100;
    const byteArray = [...Buffer.from(payload)];
    const isShortString = payload.length <= MAX_STRING_BYTES_TO_APPEND;
    for (let index = 0; index < (isShortString ? byteArray.length : MAX_STRING_BYTES_TO_APPEND + 1); index++) {
        let charByte = byteArray[index];
        if (charByte < 0xff) {
            charByte++;
        }
        outputStream = Buffer.concat([outputStream, Buffer.from(charByte.toString(16), "hex")]);
    }
    if (isShortString) {
        outputStream = Buffer.concat([outputStream, Buffer.from(BytePrefix.Undefined, "hex")]);
    }
    return outputStream;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const MAX_STRING_CHARS = 100;
function hashV1PartitionKey(partitionKey) {
    const key = partitionKey[0];
    const toHash = prefixKeyByType(key);
    const hash = MurmurHash.x86.hash32(toHash);
    const encodedJSBI = writeNumberForBinaryEncodingJSBI(hash);
    const encodedValue = encodeByType(key);
    const finalHash = Buffer.concat([encodedJSBI, encodedValue]).toString("hex").toUpperCase();
    return finalHash;
}
function prefixKeyByType(key) {
    let bytes;
    switch (typeof key) {
        case "string": {
            const truncated = key.substr(0, MAX_STRING_CHARS);
            bytes = Buffer.concat([
                Buffer.from(BytePrefix.String, "hex"),
                Buffer.from(truncated),
                Buffer.from(BytePrefix.Undefined, "hex"),
            ]);
            return bytes;
        }
        case "number": {
            const numberBytes = doubleToByteArrayJSBI(key);
            bytes = Buffer.concat([Buffer.from(BytePrefix.Number, "hex"), numberBytes]);
            return bytes;
        }
        case "boolean": {
            const prefix = key ? BytePrefix.True : BytePrefix.False;
            return Buffer.from(prefix, "hex");
        }
        case "object": {
            if (key === null) {
                return Buffer.from(BytePrefix.Null, "hex");
            }
            return Buffer.from(BytePrefix.Undefined, "hex");
        }
        case "undefined": {
            return Buffer.from(BytePrefix.Undefined, "hex");
        }
        default:
            throw new Error(`Unexpected type: ${typeof key}`);
    }
}
function encodeByType(key) {
    switch (typeof key) {
        case "string": {
            const truncated = key.substr(0, MAX_STRING_CHARS);
            return writeStringForBinaryEncoding(truncated);
        }
        case "number": {
            const encodedJSBI = writeNumberForBinaryEncodingJSBI(key);
            return encodedJSBI;
        }
        case "boolean": {
            const prefix = key ? BytePrefix.True : BytePrefix.False;
            return Buffer.from(prefix, "hex");
        }
        case "object":
            if (key === null) {
                return Buffer.from(BytePrefix.Null, "hex");
            }
            return Buffer.from(BytePrefix.Undefined, "hex");
        case "undefined":
            return Buffer.from(BytePrefix.Undefined, "hex");
        default:
            throw new Error(`Unexpected type: ${typeof key}`);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Generate hash of a PartitonKey based on it PartitionKeyDefinition.
 * @param partitionKey - to be hashed.
 * @param partitionDefinition - container's partitionKey definition
 * @returns
 */
function hashPartitionKey(partitionKey, partitionDefinition) {
    const kind = (partitionDefinition === null || partitionDefinition === void 0 ? void 0 : partitionDefinition.kind) || exports.PartitionKeyKind.Hash; // Default value.
    const isV2 = partitionDefinition &&
        partitionDefinition.version &&
        partitionDefinition.version === exports.PartitionKeyDefinitionVersion.V2;
    switch (kind) {
        case exports.PartitionKeyKind.Hash:
            return isV2 ? hashV2PartitionKey(partitionKey) : hashV1PartitionKey(partitionKey);
        case exports.PartitionKeyKind.MultiHash:
            return hashMultiHashPartitionKey(partitionKey);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @internal
 * FeedRange for which change feed is being requested.
 */
class ChangeFeedRange {
    constructor(minInclusive, maxExclusive, continuationToken, epkMinHeader, epkMaxHeader) {
        this.minInclusive = minInclusive;
        this.maxExclusive = maxExclusive;
        this.continuationToken = continuationToken;
        this.epkMinHeader = epkMinHeader;
        this.epkMaxHeader = epkMaxHeader;
    }
}

/**
 * A single response page from the Azure Cosmos DB Change Feed
 */
class ChangeFeedIteratorResponse {
    /**
     * @internal
     */
    constructor(
    /**
     * Gets the items returned in the response from Azure Cosmos DB
     */
    result, 
    /**
     * Gets the number of items returned in the response from Azure Cosmos DB
     */
    count, 
    /**
     * Gets the status code of the response from Azure Cosmos DB
     */
    statusCode, 
    /**
     * Headers related to cosmos DB and change feed.
     */
    headers, 
    /**
     * Cosmos Diagnostic Object.
     */
    diagnostics, 
    /**
     * Gets the subStatusCodes of the response from Azure Cosmos DB. Useful in partition split or partition gone.
     */
    subStatusCode) {
        this.result = result;
        this.count = count;
        this.statusCode = statusCode;
        this.diagnostics = diagnostics;
        this.subStatusCode = subStatusCode;
        this.headers = headers;
    }
    /**
     * Gets the request charge for this request from the Azure Cosmos DB service.
     */
    get requestCharge() {
        const rus = this.headers[Constants$1.HttpHeaders.RequestCharge];
        return rus ? parseInt(rus, 10) : null;
    }
    /**
     * Gets the activity ID for the request from the Azure Cosmos DB service.
     */
    get activityId() {
        return this.headers[Constants$1.HttpHeaders.ActivityId];
    }
    /**
     * Gets the continuation token to be used for continuing enumeration of the Azure Cosmos DB service.
     */
    get continuationToken() {
        return this.headers[Constants$1.HttpHeaders.ContinuationToken];
    }
    /**
     * Gets the session token for use in session consistency reads from the Azure Cosmos DB service.
     */
    get sessionToken() {
        return this.headers[Constants$1.HttpHeaders.SessionToken];
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * A queue for iterating over specified Epk ranges and fetch change feed for the given epk ranges.
 */
class FeedRangeQueue {
    constructor() {
        this.elements = [];
    }
    modifyFirstElement(newItem) {
        if (!this.isEmpty()) {
            this.elements[0] = newItem;
        }
    }
    enqueue(item) {
        this.elements.push(item);
    }
    dequeue() {
        return this.elements.shift();
    }
    peek() {
        return !this.isEmpty() ? this.elements[0] : undefined;
    }
    isEmpty() {
        return this.elements.length === 0;
    }
    moveFirstElementToTheEnd() {
        if (!this.isEmpty()) {
            this.elements.push(this.dequeue());
        }
    }
    /**
     * Returns a snapshot of the queue as an array to be used as Continuation token.
     */
    returnSnapshot() {
        const allFeedRanges = [];
        this.elements.map((element) => {
            const minInclusive = element.epkMinHeader ? element.epkMinHeader : element.minInclusive;
            const maxExclusive = element.epkMaxHeader ? element.epkMaxHeader : element.maxExclusive;
            const feedRangeElement = new ChangeFeedRange(minInclusive, maxExclusive, element.continuationToken);
            allFeedRanges.push(feedRangeElement);
        });
        return allFeedRanges;
    }
}

/**
 * Continuation token for change feed of entire container, or a specific Epk Range.
 * @internal
 */
class CompositeContinuationToken {
    constructor(rid, Continuation) {
        this.rid = rid;
        this.Continuation = Continuation;
    }
}

/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from beginning of time.
 */
class ChangeFeedStartFromBeginning {
    constructor(cfResource) {
        this.cfResource = cfResource;
    }
    getCfResource() {
        return this.cfResource;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from this moment in time.
 */
class ChangeFeedStartFromNow {
    constructor(cfResource) {
        this.cfResource = cfResource;
    }
    getCfResource() {
        return this.cfResource;
    }
}

/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from a particular point of time.
 */
class ChangeFeedStartFromTime {
    constructor(startTime, cfResource) {
        this.startTime = startTime;
        this.cfResource = cfResource;
    }
    getCfResource() {
        return this.cfResource;
    }
    getStartTime() {
        return this.startTime;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Specifies a feed range for the changefeed.
 */
class FeedRange {
    /**
     * @internal
     */
    constructor(minInclusive, maxExclusive) {
        // only way to explictly block users from creating FeedRange directly in JS
        if (new.target === FeedRange) {
            throw new ErrorResponse("Cannot instantiate abstract class FeedRange");
        }
        this.minInclusive = minInclusive;
        this.maxExclusive = maxExclusive;
    }
}
/**
 * @hidden
 * Specifies a feed range for the changefeed.
 */
class FeedRangeInternal extends FeedRange {
    /* eslint-disable @typescript-eslint/no-useless-constructor */
    constructor(minInclusive, maxExclusive) {
        super(minInclusive, maxExclusive);
    }
}

/**
 * @hidden
 * Validates the change feed options passed by the user
 */
function validateChangeFeedIteratorOptions(options) {
    if (!isChangeFeedIteratorOptions(options)) {
        throw new ErrorResponse("Invalid Changefeed Iterator Options.");
    }
    if ((options === null || options === void 0 ? void 0 : options.maxItemCount) && typeof (options === null || options === void 0 ? void 0 : options.maxItemCount) !== "number") {
        throw new ErrorResponse("maxItemCount must be number");
    }
    if ((options === null || options === void 0 ? void 0 : options.maxItemCount) !== undefined && (options === null || options === void 0 ? void 0 : options.maxItemCount) < 1) {
        throw new ErrorResponse("maxItemCount must be a positive number");
    }
}
function isChangeFeedIteratorOptions(options) {
    if (typeof options !== "object") {
        return false;
    }
    if (Object.keys(options).length === 0 && JSON.stringify(options) === "{}") {
        return true;
    }
    return options && !(isPrimitivePartitionKeyValue(options) || Array.isArray(options));
}
/**
 * @hidden
 * Checks if pkRange entirely covers the given overLapping range or there is only partial overlap.
 *
 * If no complete overlap, exact range which overlaps is retured which is used to set minEpk and maxEpk headers while quering change feed.
 */
async function extractOverlappingRanges(epkRange, overLappingRange) {
    if (overLappingRange.minInclusive >= epkRange.min &&
        overLappingRange.maxExclusive <= epkRange.max) {
        return [undefined, undefined];
    }
    else if (overLappingRange.minInclusive <= epkRange.min &&
        overLappingRange.maxExclusive >= epkRange.max) {
        return [epkRange.min, epkRange.max];
    }
    // Right Side of overlapping range is covered
    else if (overLappingRange.minInclusive <= epkRange.min &&
        overLappingRange.maxExclusive <= epkRange.max &&
        overLappingRange.maxExclusive >= epkRange.min) {
        return [epkRange.min, overLappingRange.maxExclusive];
    }
    // Left Side of overlapping range is covered
    else {
        return [overLappingRange.minInclusive, epkRange.max];
    }
}
/**
 * @hidden
 * Checks if the object is a valid EpkRange
 */
function isEpkRange(obj) {
    return (obj instanceof FeedRangeInternal &&
        typeof obj.minInclusive === "string" &&
        typeof obj.maxExclusive === "string" &&
        obj.minInclusive >=
            Constants$1.EffectivePartitionKeyConstants.MinimumInclusiveEffectivePartitionKey &&
        obj.maxExclusive <=
            Constants$1.EffectivePartitionKeyConstants.MaximumExclusiveEffectivePartitionKey &&
        obj.maxExclusive > obj.minInclusive);
}
/**
 * @hidden
 */
function buildInternalChangeFeedOptions(options, continuationToken, startTime) {
    const internalCfOptions = {};
    internalCfOptions.maxItemCount = options === null || options === void 0 ? void 0 : options.maxItemCount;
    internalCfOptions.sessionToken = options === null || options === void 0 ? void 0 : options.sessionToken;
    internalCfOptions.continuationToken = continuationToken;
    // Default option of changefeed is to start from now.
    internalCfOptions.startTime = startTime;
    return internalCfOptions;
}
/**
 * @hidden
 */
function fetchStartTime(changeFeedStartFrom) {
    if (changeFeedStartFrom instanceof ChangeFeedStartFromBeginning) {
        return undefined;
    }
    else if (changeFeedStartFrom instanceof ChangeFeedStartFromNow) {
        return new Date();
    }
    else if (changeFeedStartFrom instanceof ChangeFeedStartFromTime) {
        return changeFeedStartFrom.getStartTime();
    }
}
/**
 * @hidden
 */
function isNullOrEmpty(text) {
    return text === null || text === undefined || text.trim() === "";
}

/**
 * @hidden
 * Provides iterator for change feed for entire container or an epk range.
 *
 * Use `Items.getChangeFeedIterator()` to get an instance of the iterator.
 */
class ChangeFeedForEpkRange {
    /**
     * @internal
     */
    constructor(clientContext, container, partitionKeyRangeCache, resourceId, resourceLink, url, changeFeedOptions, epkRange) {
        this.clientContext = clientContext;
        this.container = container;
        this.partitionKeyRangeCache = partitionKeyRangeCache;
        this.resourceId = resourceId;
        this.resourceLink = resourceLink;
        this.url = url;
        this.changeFeedOptions = changeFeedOptions;
        this.epkRange = epkRange;
        this.generateContinuationToken = () => {
            return JSON.stringify(new CompositeContinuationToken(this.rId, this.queue.returnSnapshot()));
        };
        this.queue = new FeedRangeQueue();
        this.continuationToken = changeFeedOptions.continuationToken
            ? JSON.parse(changeFeedOptions.continuationToken)
            : undefined;
        this.startTime = changeFeedOptions.startTime
            ? changeFeedOptions.startTime.toUTCString()
            : undefined;
        this.isInstantiated = false;
    }
    async setIteratorRid(diagnosticNode) {
        const { resource } = await this.container.readInternal(diagnosticNode);
        this.rId = resource._rid;
    }
    continuationTokenRidMatchContainerRid() {
        if (this.continuationToken.rid !== this.rId) {
            return false;
        }
        return true;
    }
    async fillChangeFeedQueue(diagnosticNode) {
        if (this.continuationToken) {
            // fill the queue with feed ranges in continuation token.
            await this.fetchContinuationTokenFeedRanges(diagnosticNode);
        }
        else {
            // fill the queue with feed ranges overlapping the given epk range.
            await this.fetchOverLappingFeedRanges(diagnosticNode);
        }
        this.isInstantiated = true;
    }
    /**
     * Fill the queue with the feed ranges overlapping with the given epk range.
     */
    async fetchOverLappingFeedRanges(diagnosticNode) {
        try {
            const overLappingRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, this.epkRange, diagnosticNode);
            for (const overLappingRange of overLappingRanges) {
                const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(this.epkRange, overLappingRange);
                const feedRange = new ChangeFeedRange(overLappingRange.minInclusive, overLappingRange.maxExclusive, "", epkMinHeader, epkMaxHeader);
                this.queue.enqueue(feedRange);
            }
        }
        catch (err) {
            throw new ErrorResponse(err.message);
        }
    }
    /**
     * Fill the queue with feed ranges from continuation token
     */
    async fetchContinuationTokenFeedRanges(diagnosticNode) {
        const contToken = this.continuationToken;
        if (!this.continuationTokenRidMatchContainerRid()) {
            throw new ErrorResponse("The continuation token is not for the current container definition");
        }
        else {
            for (const cToken of contToken.Continuation) {
                const queryRange = new QueryRange(cToken.minInclusive, cToken.maxExclusive, true, false);
                try {
                    const overLappingRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, queryRange, diagnosticNode);
                    for (const overLappingRange of overLappingRanges) {
                        // check if the epk range present in continuation token entirely covers the overlapping range.
                        // If yes, minInclusive and maxExclusive of the overlapping range will be set.
                        // If no, i.e. there is only partial overlap, epkMinHeader and epkMaxHeader are set as min and max of overlap.
                        // This will be used when we make a call to fetch change feed.
                        const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(queryRange, overLappingRange);
                        const feedRange = new ChangeFeedRange(overLappingRange.minInclusive, overLappingRange.maxExclusive, cToken.continuationToken, epkMinHeader, epkMaxHeader);
                        this.queue.enqueue(feedRange);
                    }
                }
                catch (err) {
                    throw new ErrorResponse(err.message);
                }
            }
        }
    }
    /**
     * Change feed is an infinite feed. hasMoreResults is always true.
     */
    get hasMoreResults() {
        return true;
    }
    /**
     * Gets an async iterator which will yield change feed results.
     */
    getAsyncIterator() {
        return tslib.__asyncGenerator(this, arguments, function* getAsyncIterator_1() {
            do {
                const result = yield tslib.__await(this.readNext());
                yield yield tslib.__await(result);
            } while (this.hasMoreResults);
        });
    }
    /**
     * Gets an async iterator which will yield pages of results from Azure Cosmos DB.
     *
     * Keeps iterating over the feedranges and checks if any feed range has new result. Keeps note of the last feed range which returned non 304 result.
     *
     * When same feed range is reached and no new changes are found, a 304 (not Modified) is returned to the end user. Then starts process all over again.
     */
    async readNext() {
        return withDiagnostics(async (diagnosticNode) => {
            // validate if the internal queue is filled up with feed ranges.
            if (!this.isInstantiated) {
                await this.setIteratorRid(diagnosticNode);
                await this.fillChangeFeedQueue(diagnosticNode);
            }
            // stores the last feedRange for which statusCode is not 304 i.e. there were new changes in that feed range.
            let firstNotModifiedFeedRange = undefined;
            let result;
            do {
                const [processedFeedRange, response] = await this.fetchNext(diagnosticNode);
                result = response;
                if (result !== undefined) {
                    {
                        if (firstNotModifiedFeedRange === undefined) {
                            firstNotModifiedFeedRange = processedFeedRange;
                        }
                        // move current feed range to end of queue to fetch result of next feed range.
                        // This is done to fetch changes in breadth first manner and avoid starvation.
                        this.queue.moveFirstElementToTheEnd();
                        // check if there are new results for the given feed range.
                        if (result.statusCode === StatusCodes.Ok) {
                            result.headers[Constants$1.HttpHeaders.ContinuationToken] =
                                this.generateContinuationToken();
                            return result;
                        }
                    }
                }
            } while (!this.checkedAllFeedRanges(firstNotModifiedFeedRange));
            // set the continuation token after processing.
            result.headers[Constants$1.HttpHeaders.ContinuationToken] = this.generateContinuationToken();
            return result;
        }, this.clientContext);
    }
    /**
     * Read feed and retrieves the next page of results in Azure Cosmos DB.
     */
    async fetchNext(diagnosticNode) {
        const feedRange = this.queue.peek();
        if (feedRange) {
            // fetch results for feed range at the beginning of the queue.
            const result = await this.getFeedResponse(feedRange, diagnosticNode);
            // check if results need to be fetched again depending on status code returned.
            // Eg. in case of paritionSplit, results need to be fetched for the child partitions.
            const shouldRetry = await this.shouldRetryOnFailure(feedRange, result, diagnosticNode);
            if (shouldRetry) {
                this.queue.dequeue();
                return this.fetchNext(diagnosticNode);
            }
            else {
                // update the continuation value for the current feed range.
                const continuationValueForFeedRange = result.headers[Constants$1.HttpHeaders.ETag];
                const newFeedRange = this.queue.peek();
                newFeedRange.continuationToken = continuationValueForFeedRange;
                return [[newFeedRange.minInclusive, newFeedRange.maxExclusive], result];
            }
        }
        else {
            return [[undefined, undefined], undefined];
        }
    }
    checkedAllFeedRanges(firstNotModifiedFeedRange) {
        if (firstNotModifiedFeedRange === undefined) {
            return false;
        }
        const feedRangeQueueFirstElement = this.queue.peek();
        return (firstNotModifiedFeedRange[0] === (feedRangeQueueFirstElement === null || feedRangeQueueFirstElement === void 0 ? void 0 : feedRangeQueueFirstElement.minInclusive) &&
            firstNotModifiedFeedRange[1] === (feedRangeQueueFirstElement === null || feedRangeQueueFirstElement === void 0 ? void 0 : feedRangeQueueFirstElement.maxExclusive));
    }
    /**
     * Checks whether the current EpkRange is split into multiple ranges or not.
     *
     * If yes, it force refreshes the partitionKeyRange cache and enqueue children epk ranges.
     */
    async shouldRetryOnFailure(feedRange, response, diagnosticNode) {
        if (response.statusCode === StatusCodes.Ok || response.statusCode === StatusCodes.NotModified) {
            return false;
        }
        const partitionSplit = response.statusCode === StatusCodes.Gone &&
            (response.subStatusCode === SubStatusCodes.PartitionKeyRangeGone ||
                response.subStatusCode === SubStatusCodes.CompletingSplit);
        if (partitionSplit) {
            const queryRange = new QueryRange(feedRange.minInclusive, feedRange.maxExclusive, true, false);
            const resolvedRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, queryRange, diagnosticNode, true);
            if (resolvedRanges.length < 1) {
                throw new ErrorResponse("Partition split/merge detected but no overlapping ranges found.");
            }
            // This covers both cases of merge and split.
            // resolvedRanges.length > 1 in case of split.
            // resolvedRanges.length === 1 in case of merge. EpkRange headers will be added in this case.
            if (resolvedRanges.length >= 1) {
                await this.handleSplit(false, resolvedRanges, queryRange, feedRange.continuationToken);
            }
            return true;
        }
        return false;
    }
    /*
     * Enqueues all the children feed ranges for the given feed range.
     */
    async handleSplit(shiftLeft, resolvedRanges, oldFeedRange, continuationToken) {
        let flag = 0;
        if (shiftLeft) {
            // This section is only applicable when handleSplit is called by getPartitionRangeId().
            // used only when existing partition key range cache is used to check for any overlapping ranges.
            // Modifies the first element with the first overlapping range.
            const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(oldFeedRange, resolvedRanges[0]);
            const newFeedRange = new ChangeFeedRange(resolvedRanges[0].minInclusive, resolvedRanges[0].maxExclusive, continuationToken, epkMinHeader, epkMaxHeader);
            this.queue.modifyFirstElement(newFeedRange);
            flag = 1;
        }
        // Enqueue the overlapping ranges.
        for (let i = flag; i < resolvedRanges.length; i++) {
            const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(oldFeedRange, resolvedRanges[i]);
            const newFeedRange = new ChangeFeedRange(resolvedRanges[i].minInclusive, resolvedRanges[i].maxExclusive, continuationToken, epkMinHeader, epkMaxHeader);
            this.queue.enqueue(newFeedRange);
        }
    }
    /**
     * Fetch the partitionKeyRangeId for the given feed range.
     *
     * This partitionKeyRangeId is passed to queryFeed to fetch the results.
     */
    async getPartitionRangeId(feedRange, diagnosticNode) {
        const min = feedRange.epkMinHeader ? feedRange.epkMinHeader : feedRange.minInclusive;
        const max = feedRange.epkMaxHeader ? feedRange.epkMaxHeader : feedRange.maxExclusive;
        const queryRange = new QueryRange(min, max, true, false);
        const resolvedRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, queryRange, diagnosticNode, false);
        if (resolvedRanges.length < 1) {
            throw new ErrorResponse("No overlapping ranges found.");
        }
        const firstResolvedRange = resolvedRanges[0];
        if (resolvedRanges.length > 1) {
            await this.handleSplit(true, resolvedRanges, queryRange, feedRange.continuationToken);
        }
        return firstResolvedRange.id;
    }
    async getFeedResponse(feedRange, diagnosticNode) {
        const feedOptions = { initialHeaders: {}, useIncrementalFeed: true };
        if (typeof this.changeFeedOptions.maxItemCount === "number") {
            feedOptions.maxItemCount = this.changeFeedOptions.maxItemCount;
        }
        if (this.changeFeedOptions.sessionToken) {
            feedOptions.sessionToken = this.changeFeedOptions.sessionToken;
        }
        if (feedRange.continuationToken) {
            feedOptions.accessCondition = {
                type: Constants$1.HttpHeaders.IfNoneMatch,
                condition: feedRange.continuationToken,
            };
        }
        if (this.startTime) {
            feedOptions.initialHeaders[Constants$1.HttpHeaders.IfModifiedSince] = this.startTime;
        }
        const rangeId = await this.getPartitionRangeId(feedRange, diagnosticNode);
        try {
            // startEpk and endEpk are only valid in case we want to fetch result for a part of partition and not the entire partition.
            const response = await this.clientContext.queryFeed({
                path: this.resourceLink,
                resourceType: exports.ResourceType.item,
                resourceId: this.resourceId,
                resultFn: (result) => (result ? result.Documents : []),
                query: undefined,
                options: feedOptions,
                diagnosticNode,
                partitionKey: undefined,
                partitionKeyRangeId: rangeId,
                startEpk: feedRange.epkMinHeader,
                endEpk: feedRange.epkMaxHeader,
            });
            return new ChangeFeedIteratorResponse(response.result, response.result ? response.result.length : 0, response.code, response.headers, getEmptyCosmosDiagnostics());
        }
        catch (err) {
            // If any errors are encountered, eg. partition split or gone, handle it based on error code and not break the flow.
            return new ChangeFeedIteratorResponse([], 0, err.code, err.headers, getEmptyCosmosDiagnostics(), err.substatus);
        }
    }
}

/**
 * Continuation token for change feed of entire container, or a specific Epk Range.
 * @internal
 */
class ContinuationTokenForPartitionKey {
    constructor(rid, partitionKey, continuation) {
        this.rid = rid;
        this.partitionKey = partitionKey;
        this.Continuation = continuation;
    }
}

/**
 * @hidden
 * Provides iterator for change feed for one partition key.
 *
 * Use `Items.getChangeFeedIterator()` to get an instance of the iterator.
 */
class ChangeFeedForPartitionKey {
    /**
     * @internal
     */
    constructor(clientContext, container, resourceId, resourceLink, partitionKey, changeFeedOptions) {
        this.clientContext = clientContext;
        this.container = container;
        this.resourceId = resourceId;
        this.resourceLink = resourceLink;
        this.partitionKey = partitionKey;
        this.changeFeedOptions = changeFeedOptions;
        this.continuationToken = changeFeedOptions.continuationToken
            ? JSON.parse(changeFeedOptions.continuationToken)
            : undefined;
        this.isInstantiated = false;
        if (changeFeedOptions.startTime) {
            this.startTime = changeFeedOptions.startTime.toUTCString();
        }
    }
    async instantiateIterator(diagnosticNode) {
        await this.setIteratorRid(diagnosticNode);
        if (this.continuationToken) {
            if (!this.continuationTokenRidMatchContainerRid()) {
                throw new ErrorResponse("The continuation is not for the current container definition.");
            }
        }
        else {
            this.continuationToken = new ContinuationTokenForPartitionKey(this.rId, this.partitionKey, "");
        }
        this.isInstantiated = true;
    }
    continuationTokenRidMatchContainerRid() {
        if (this.continuationToken.rid !== this.rId) {
            return false;
        }
        return true;
    }
    async setIteratorRid(diagnosticNode) {
        const { resource } = await this.container.readInternal(diagnosticNode);
        this.rId = resource._rid;
    }
    /**
     * Change feed is an infinite feed. hasMoreResults is always true.
     */
    get hasMoreResults() {
        return true;
    }
    /**
     * Gets an async iterator which will yield change feed results.
     */
    getAsyncIterator() {
        return tslib.__asyncGenerator(this, arguments, function* getAsyncIterator_1() {
            do {
                const result = yield tslib.__await(this.readNext());
                yield yield tslib.__await(result);
            } while (this.hasMoreResults);
        });
    }
    /**
     * Returns the result of change feed from Azure Cosmos DB.
     */
    async readNext() {
        return withDiagnostics(async (diagnosticNode) => {
            if (!this.isInstantiated) {
                await this.instantiateIterator(diagnosticNode);
            }
            const result = await this.fetchNext(diagnosticNode);
            return result;
        }, this.clientContext);
    }
    /**
     * Read feed and retrieves the next set of results in Azure Cosmos DB.
     */
    async fetchNext(diagnosticNode) {
        const response = await this.getFeedResponse(diagnosticNode);
        this.continuationToken.Continuation = response.headers[Constants$1.HttpHeaders.ETag];
        response.headers[Constants$1.HttpHeaders.ContinuationToken] = JSON.stringify(this.continuationToken);
        return response;
    }
    async getFeedResponse(diagnosticNode) {
        const feedOptions = { initialHeaders: {}, useIncrementalFeed: true };
        if (typeof this.changeFeedOptions.maxItemCount === "number") {
            feedOptions.maxItemCount = this.changeFeedOptions.maxItemCount;
        }
        if (this.changeFeedOptions.sessionToken) {
            feedOptions.sessionToken = this.changeFeedOptions.sessionToken;
        }
        const continuation = this.continuationToken.Continuation;
        if (continuation) {
            feedOptions.accessCondition = {
                type: Constants$1.HttpHeaders.IfNoneMatch,
                condition: continuation,
            };
        }
        if (this.startTime) {
            feedOptions.initialHeaders[Constants$1.HttpHeaders.IfModifiedSince] = this.startTime;
        }
        const response = await this.clientContext.queryFeed({
            path: this.resourceLink,
            resourceType: exports.ResourceType.item,
            resourceId: this.resourceId,
            resultFn: (result) => (result ? result.Documents : []),
            diagnosticNode,
            query: undefined,
            options: feedOptions,
            partitionKey: this.partitionKey,
        });
        return new ChangeFeedIteratorResponse(response.result, response.result ? response.result.length : 0, response.code, response.headers, getEmptyCosmosDiagnostics());
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Enum to specify the resource for which change feed is being fetched.
 */
var ChangeFeedResourceType;
(function (ChangeFeedResourceType) {
    ChangeFeedResourceType[ChangeFeedResourceType["FeedRange"] = 0] = "FeedRange";
    ChangeFeedResourceType[ChangeFeedResourceType["PartitionKey"] = 1] = "PartitionKey";
})(ChangeFeedResourceType || (ChangeFeedResourceType = {}));

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from a saved point.
 */
class ChangeFeedStartFromContinuation {
    constructor(continuation) {
        this.continuationToken = continuation;
    }
    getCfResource() {
        return this.continuationToken;
    }
    getCfResourceJson() {
        return JSON.parse(this.continuationToken);
    }
    getResourceType() {
        const cToken = this.getCfResourceJson();
        if (Object.prototype.hasOwnProperty.call(cToken, "partitionKey") &&
            Object.prototype.hasOwnProperty.call(cToken, "Continuation") &&
            typeof cToken.Continuation === "string") {
            return ChangeFeedResourceType.PartitionKey;
        }
        else if (Object.prototype.hasOwnProperty.call(cToken, "Continuation") &&
            Array.isArray(cToken.Continuation) &&
            cToken.Continuation.length > 0) {
            return ChangeFeedResourceType.FeedRange;
        }
        else {
            throw new ErrorResponse("Invalid continuation token.");
        }
    }
}

/**
 * Base class for where to start a ChangeFeedIterator.
 */
/* eslint-disable @typescript-eslint/no-extraneous-class */
class ChangeFeedStartFrom {
    /**
     * Returns an object that tells the ChangeFeedIterator to start from the beginning of time.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     */
    static Beginning(cfResource) {
        return new ChangeFeedStartFromBeginning(cfResource);
    }
    /**
     *  Returns an object that tells the ChangeFeedIterator to start reading changes from this moment onward.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     **/
    static Now(cfResource) {
        return new ChangeFeedStartFromNow(cfResource);
    }
    /**
     * Returns an object that tells the ChangeFeedIterator to start reading changes from some point in time onward.
     * @param startTime - Date object specfiying the time to start reading changes from.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     */
    static Time(startTime, cfResource) {
        if (!startTime) {
            throw new ErrorResponse("startTime must be present");
        }
        if (startTime instanceof Date === true) {
            return new ChangeFeedStartFromTime(startTime, cfResource);
        }
        else {
            throw new ErrorResponse("startTime must be a Date object.");
        }
    }
    /**
     * Returns an object that tells the ChangeFeedIterator to start reading changes from a save point.
     * @param continuation - The continuation to resume from.
     */
    static Continuation(continuationToken) {
        if (!continuationToken) {
            throw new ErrorResponse("Argument continuation must be passed.");
        }
        if (isNullOrEmpty(continuationToken)) {
            throw new ErrorResponse("Argument continuationToken must be a non-empty string.");
        }
        return new ChangeFeedStartFromContinuation(continuationToken);
    }
}

function changeFeedIteratorBuilder(cfOptions, clientContext, container, partitionKeyRangeCache) {
    const url = container.url;
    const path = getPathFromLink(url, exports.ResourceType.item);
    const id = getIdFromLink(url);
    let changeFeedStartFrom = cfOptions.changeFeedStartFrom;
    if (changeFeedStartFrom === undefined) {
        changeFeedStartFrom = ChangeFeedStartFrom.Now();
    }
    if (changeFeedStartFrom instanceof ChangeFeedStartFromContinuation) {
        const continuationToken = changeFeedStartFrom.getCfResourceJson();
        const resourceType = changeFeedStartFrom.getResourceType();
        const internalCfOptions = buildInternalChangeFeedOptions(cfOptions, changeFeedStartFrom.getCfResource());
        if (resourceType === ChangeFeedResourceType.PartitionKey &&
            isPartitionKey(continuationToken.partitionKey)) {
            return new ChangeFeedForPartitionKey(clientContext, container, id, path, continuationToken.partitionKey, internalCfOptions);
        }
        else if (resourceType === ChangeFeedResourceType.FeedRange) {
            return new ChangeFeedForEpkRange(clientContext, container, partitionKeyRangeCache, id, path, url, internalCfOptions, undefined);
        }
        else {
            throw new ErrorResponse("Invalid continuation token.");
        }
    }
    else if (changeFeedStartFrom instanceof ChangeFeedStartFromNow ||
        changeFeedStartFrom instanceof ChangeFeedStartFromTime ||
        changeFeedStartFrom instanceof ChangeFeedStartFromBeginning) {
        const startTime = fetchStartTime(changeFeedStartFrom);
        const internalCfOptions = buildInternalChangeFeedOptions(cfOptions, undefined, startTime);
        const cfResource = changeFeedStartFrom.getCfResource();
        if (isPartitionKey(cfResource)) {
            return new ChangeFeedForPartitionKey(clientContext, container, id, path, cfResource, internalCfOptions);
        }
        else {
            let internalCfResource;
            if (cfResource === undefined) {
                internalCfResource = new QueryRange(Constants$1.EffectivePartitionKeyConstants.MinimumInclusiveEffectivePartitionKey, Constants$1.EffectivePartitionKeyConstants.MaximumExclusiveEffectivePartitionKey, true, false);
            }
            else if (isEpkRange(cfResource)) {
                internalCfResource = new QueryRange(cfResource.minInclusive, cfResource.maxExclusive, true, false);
            }
            else {
                throw new ErrorResponse("Invalid feed range.");
            }
            return new ChangeFeedForEpkRange(clientContext, container, partitionKeyRangeCache, id, path, url, internalCfOptions, internalCfResource);
        }
    }
    else {
        throw new ErrorResponse("Invalid change feed start location.");
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const uuid$1 = uuid$3.v4;
/**
 * @hidden
 */
function isChangeFeedOptions(options) {
    return options && !(isPrimitivePartitionKeyValue(options) || Array.isArray(options));
}
/**
 * Operations for creating new items, and reading/querying all items
 *
 * @see {@link Item} for reading, replacing, or deleting an existing container; use `.item(id)`.
 */
class Items {
    /**
     * Create an instance of {@link Items} linked to the parent {@link Container}.
     * @param container - The parent container.
     * @hidden
     */
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
        this.partitionKeyRangeCache = new PartitionKeyRangeCache(this.clientContext);
    }
    query(query, options = {}) {
        const path = getPathFromLink(this.container.url, exports.ResourceType.item);
        const id = getIdFromLink(this.container.url);
        const fetchFunction = async (diagnosticNode, innerOptions) => {
            const response = await this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.item,
                resourceId: id,
                resultFn: (result) => (result ? result.Documents : []),
                query,
                options: innerOptions,
                partitionKey: options.partitionKey,
                diagnosticNode,
            });
            return response;
        };
        return new QueryIterator(this.clientContext, query, options, fetchFunction, this.container.url, exports.ResourceType.item);
    }
    readChangeFeed(partitionKeyOrChangeFeedOptions, changeFeedOptions) {
        if (isChangeFeedOptions(partitionKeyOrChangeFeedOptions)) {
            return this.changeFeed(partitionKeyOrChangeFeedOptions);
        }
        else {
            return this.changeFeed(partitionKeyOrChangeFeedOptions, changeFeedOptions);
        }
    }
    changeFeed(partitionKeyOrChangeFeedOptions, changeFeedOptions) {
        let partitionKey;
        if (!changeFeedOptions && isChangeFeedOptions(partitionKeyOrChangeFeedOptions)) {
            partitionKey = undefined;
            changeFeedOptions = partitionKeyOrChangeFeedOptions;
        }
        else if (partitionKeyOrChangeFeedOptions !== undefined &&
            !isChangeFeedOptions(partitionKeyOrChangeFeedOptions)) {
            partitionKey = partitionKeyOrChangeFeedOptions;
        }
        if (!changeFeedOptions) {
            changeFeedOptions = {};
        }
        const path = getPathFromLink(this.container.url, exports.ResourceType.item);
        const id = getIdFromLink(this.container.url);
        return new ChangeFeedIterator(this.clientContext, id, path, partitionKey, changeFeedOptions);
    }
    /**
     * Returns an iterator to iterate over pages of changes. The iterator returned can be used to fetch changes for a single partition key, feed range or an entire container.
     */
    getChangeFeedIterator(changeFeedIteratorOptions) {
        const cfOptions = changeFeedIteratorOptions !== undefined ? changeFeedIteratorOptions : {};
        validateChangeFeedIteratorOptions(cfOptions);
        const iterator = changeFeedIteratorBuilder(cfOptions, this.clientContext, this.container, this.partitionKeyRangeCache);
        return iterator;
    }
    readAll(options) {
        return this.query("SELECT * from c", options);
    }
    /**
     * Create an item.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param body - Represents the body of the item. Can contain any number of user defined properties.
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     */
    async create(body, options = {}) {
        // Generate random document id if the id is missing in the payload and
        // options.disableAutomaticIdGeneration != true
        return withDiagnostics(async (diagnosticNode) => {
            if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                body.id = uuid$1();
            }
            const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
            const partitionKey = extractPartitionKeys(body, partitionKeyDefinition);
            const err = {};
            if (!isItemResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, exports.ResourceType.item);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: exports.ResourceType.item,
                resourceId: id,
                diagnosticNode,
                options,
                partitionKey,
            });
            const ref = new Item(this.container, response.result.id, this.clientContext, partitionKey);
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    async upsert(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            // Generate random document id if the id is missing in the payload and
            // options.disableAutomaticIdGeneration != true
            if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                body.id = uuid$1();
            }
            const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
            const partitionKey = extractPartitionKeys(body, partitionKeyDefinition);
            const err = {};
            if (!isItemResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, exports.ResourceType.item);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.upsert({
                body,
                path,
                resourceType: exports.ResourceType.item,
                resourceId: id,
                options,
                partitionKey,
                diagnosticNode,
            });
            const ref = new Item(this.container, response.result.id, this.clientContext, partitionKey);
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Execute bulk operations on items.
     *
     * Bulk takes an array of Operations which are typed based on what the operation does.
     * The choices are: Create, Upsert, Read, Replace, and Delete
     *
     * Usage example:
     * ```typescript
     * // partitionKey is optional at the top level if present in the resourceBody
     * const operations: OperationInput[] = [
     *    {
     *       operationType: "Create",
     *       resourceBody: { id: "doc1", name: "sample", key: "A" }
     *    },
     *    {
     *       operationType: "Upsert",
     *       partitionKey: 'A',
     *       resourceBody: { id: "doc2", name: "other", key: "A" }
     *    }
     * ]
     *
     * await database.container.items.bulk(operations)
     * ```
     *
     * @param operations - List of operations. Limit 100
     * @param bulkOptions - Optional options object to modify bulk behavior. Pass \{ continueOnError: true \} to continue executing operations when one fails. (Defaults to false) ** NOTE: THIS WILL DEFAULT TO TRUE IN THE 4.0 RELEASE
     * @param options - Used for modifying the request.
     */
    async bulk(operations, bulkOptions, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const { resources: partitionKeyRanges } = await this.container
                .readPartitionKeyRanges()
                .fetchAll();
            const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
            const batches = partitionKeyRanges.map((keyRange) => {
                return {
                    min: keyRange.minInclusive,
                    max: keyRange.maxExclusive,
                    rangeId: keyRange.id,
                    indexes: [],
                    operations: [],
                };
            });
            this.groupOperationsBasedOnPartitionKey(operations, partitionKeyDefinition, options, batches);
            const path = getPathFromLink(this.container.url, exports.ResourceType.item);
            const orderedResponses = [];
            await Promise.all(batches
                .filter((batch) => batch.operations.length)
                .flatMap((batch) => splitBatchBasedOnBodySize(batch))
                .map(async (batch) => {
                if (batch.operations.length > 100) {
                    throw new Error("Cannot run bulk request with more than 100 operations per partition");
                }
                try {
                    const response = await addDignosticChild(async (childNode) => this.clientContext.bulk({
                        body: batch.operations,
                        partitionKeyRangeId: batch.rangeId,
                        path,
                        resourceId: this.container.url,
                        bulkOptions,
                        options,
                        diagnosticNode: childNode,
                    }), diagnosticNode, exports.DiagnosticNodeType.BATCH_REQUEST);
                    response.result.forEach((operationResponse, index) => {
                        orderedResponses[batch.indexes[index]] = operationResponse;
                    });
                }
                catch (err) {
                    // In the case of 410 errors, we need to recompute the partition key ranges
                    // and redo the batch request, however, 410 errors occur for unsupported
                    // partition key types as well since we don't support them, so for now we throw
                    if (err.code === 410) {
                        throw new Error("Partition key error. Either the partitions have split or an operation has an unsupported partitionKey type" +
                            err.message);
                    }
                    throw new Error(`Bulk request errored with: ${err.message}`);
                }
            }));
            const response = orderedResponses;
            response.diagnostics = diagnosticNode.toDiagnostic(this.clientContext.getClientConfig());
            return response;
        }, this.clientContext);
    }
    /**
     * Function to create batches based of partition key Ranges.
     * @param operations - operations to group
     * @param partitionDefinition - PartitionKey definition of container.
     * @param options - Request options for bulk request.
     * @param batches - Groups to be filled with operations.
     */
    groupOperationsBasedOnPartitionKey(operations, partitionDefinition, options, batches) {
        operations.forEach((operationInput, index) => {
            const { operation, partitionKey } = prepareOperations(operationInput, partitionDefinition, options);
            const hashed = hashPartitionKey(assertNotUndefined(partitionKey, "undefined value for PartitionKey is not expected during grouping of bulk operations."), partitionDefinition);
            const batchForKey = assertNotUndefined(batches.find((batch) => {
                return isKeyInRange(batch.min, batch.max, hashed);
            }), "No suitable Batch found.");
            batchForKey.operations.push(operation);
            batchForKey.indexes.push(index);
        });
    }
    /**
     * Execute transactional batch operations on items.
     *
     * Batch takes an array of Operations which are typed based on what the operation does. Batch is transactional and will rollback all operations if one fails.
     * The choices are: Create, Upsert, Read, Replace, and Delete
     *
     * Usage example:
     * ```typescript
     * // partitionKey is required as a second argument to batch, but defaults to the default partition key
     * const operations: OperationInput[] = [
     *    {
     *       operationType: "Create",
     *       resourceBody: { id: "doc1", name: "sample", key: "A" }
     *    },
     *    {
     *       operationType: "Upsert",
     *       partitionKey: 'A',
     *       resourceBody: { id: "doc2", name: "other", key: "A" }
     *    }
     * ]
     *
     * await database.container.items.batch(operations)
     * ```
     *
     * @param operations - List of operations. Limit 100
     * @param options - Used for modifying the request
     */
    async batch(operations, partitionKey, options) {
        return withDiagnostics(async (diagnosticNode) => {
            operations.map((operation) => decorateBatchOperation(operation, options));
            const path = getPathFromLink(this.container.url, exports.ResourceType.item);
            if (operations.length > 100) {
                throw new Error("Cannot run batch request with more than 100 operations per partition");
            }
            try {
                const response = await this.clientContext.batch({
                    body: operations,
                    partitionKey,
                    path,
                    resourceId: this.container.url,
                    options,
                    diagnosticNode,
                });
                return response;
            }
            catch (err) {
                throw new Error(`Batch request error: ${err.message}`);
            }
        }, this.clientContext);
    }
}

class StoredProcedureResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, storedProcedure, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.storedProcedure = storedProcedure;
    }
    /**
     * Alias for storedProcedure.
     *
     * A reference to the {@link StoredProcedure} which the {@link StoredProcedureDefinition} corresponds to.
     */
    get sproc() {
        return this.storedProcedure;
    }
}

/**
 * Operations for reading, replacing, deleting, or executing a specific, existing stored procedure by id.
 *
 * For operations to create, read all, or query Stored Procedures,
 */
class StoredProcedure {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createStoredProcedureUri(this.container.database.id, this.container.id, this.id);
    }
    /**
     * Creates a new instance of {@link StoredProcedure} linked to the parent {@link Container}.
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link StoredProcedure}.
     * @hidden
     */
    constructor(container, id, clientContext) {
        this.container = container;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Read the {@link StoredProcedureDefinition} for the given {@link StoredProcedure}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: exports.ResourceType.sproc,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new StoredProcedureResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Replace the given {@link StoredProcedure} with the specified {@link StoredProcedureDefinition}.
     * @param body - The specified {@link StoredProcedureDefinition} to replace the existing definition.
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (body.body) {
                body.body = body.body.toString();
            }
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: exports.ResourceType.sproc,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new StoredProcedureResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link StoredProcedure}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.sproc,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new StoredProcedureResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Execute the given {@link StoredProcedure}.
     *
     * The specified type, T, is not enforced by the client.
     * Be sure to validate the response from the stored procedure matches the type, T, you provide.
     *
     * @param partitionKey - The partition key to use when executing the stored procedure
     * @param params - Array of parameters to pass as arguments to the given {@link StoredProcedure}.
     * @param options - Additional options, such as the partition key to invoke the {@link StoredProcedure} on.
     */
    async execute(partitionKey, params, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (partitionKey === undefined) {
                const partitionKeyResponse = await readPartitionKeyDefinition(diagnosticNode, this.container);
                partitionKey = undefinedPartitionKey(partitionKeyResponse);
            }
            const response = await this.clientContext.execute({
                sprocLink: this.url,
                params,
                options,
                partitionKey,
                diagnosticNode,
            });
            return new ResourceResponse(response.result, response.headers, response.code, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/**
 * Operations for creating, upserting, or reading/querying all Stored Procedures.
 *
 * For operations to read, replace, delete, or execute a specific, existing stored procedure by id, see `container.storedProcedure()`.
 */
class StoredProcedures {
    /**
     * @param container - The parent {@link Container}.
     * @hidden
     */
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.container.url, exports.ResourceType.sproc);
        const id = getIdFromLink(this.container.url);
        return new QueryIterator(this.clientContext, query, options, (diagNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.sproc,
                resourceId: id,
                resultFn: (result) => result.StoredProcedures,
                query,
                options: innerOptions,
                diagnosticNode: diagNode,
            });
        });
    }
    /**
     * Read all stored procedures.
     * @example Read all stored procedures to array.
     * ```typescript
     * const {body: sprocList} = await containers.storedProcedures.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
    /**
     * Create a StoredProcedure.
     *
     * Azure Cosmos DB allows stored procedures to be executed in the storage tier,
     * directly against an item container. The script
     * gets executed under ACID transactions on the primary storage partition of the
     * specified container. For additional details,
     * refer to the server-side JavaScript API documentation.
     */
    async create(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (body.body) {
                body.body = body.body.toString();
            }
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, exports.ResourceType.sproc);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: exports.ResourceType.sproc,
                resourceId: id,
                options,
                diagnosticNode,
            });
            const ref = new StoredProcedure(this.container, response.result.id, this.clientContext);
            return new StoredProcedureResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

class TriggerResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, trigger, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.trigger = trigger;
    }
}

/**
 * Operations to read, replace, or delete a {@link Trigger}.
 *
 * Use `container.triggers` to create, upsert, query, or read all.
 */
class Trigger {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createTriggerUri(this.container.database.id, this.container.id, this.id);
    }
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link Trigger}.
     */
    constructor(container, id, clientContext) {
        this.container = container;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Read the {@link TriggerDefinition} for the given {@link Trigger}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: exports.ResourceType.trigger,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new TriggerResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Replace the given {@link Trigger} with the specified {@link TriggerDefinition}.
     * @param body - The specified {@link TriggerDefinition} to replace the existing definition with.
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (body.body) {
                body.body = body.body.toString();
            }
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: exports.ResourceType.trigger,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new TriggerResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link Trigger}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.trigger,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new TriggerResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/**
 * Operations to create, upsert, query, and read all triggers.
 *
 * Use `container.triggers` to read, replace, or delete a {@link Trigger}.
 */
class Triggers {
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     */
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.container.url, exports.ResourceType.trigger);
        const id = getIdFromLink(this.container.url);
        return new QueryIterator(this.clientContext, query, options, (diagnosticNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.trigger,
                resourceId: id,
                resultFn: (result) => result.Triggers,
                query,
                options: innerOptions,
                diagnosticNode,
            });
        });
    }
    /**
     * Read all Triggers.
     * @example Read all trigger to array.
     * ```typescript
     * const {body: triggerList} = await container.triggers.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
    /**
     * Create a trigger.
     *
     * Azure Cosmos DB supports pre and post triggers defined in JavaScript to be executed
     * on creates, updates and deletes.
     *
     * For additional details, refer to the server-side JavaScript API documentation.
     */
    async create(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (body.body) {
                body.body = body.body.toString();
            }
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, exports.ResourceType.trigger);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: exports.ResourceType.trigger,
                resourceId: id,
                options,
                diagnosticNode,
            });
            const ref = new Trigger(this.container, response.result.id, this.clientContext);
            return new TriggerResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

class UserDefinedFunctionResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, udf, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.userDefinedFunction = udf;
    }
    /**
     * Alias for `userDefinedFunction(id)`.
     *
     * A reference to the {@link UserDefinedFunction} corresponding to the returned {@link UserDefinedFunctionDefinition}.
     */
    get udf() {
        return this.userDefinedFunction;
    }
}

/**
 * Used to read, replace, or delete a specified User Definied Function by id.
 *
 * @see {@link UserDefinedFunction} to create, upsert, query, read all User Defined Functions.
 */
class UserDefinedFunction {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createUserDefinedFunctionUri(this.container.database.id, this.container.id, this.id);
    }
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link UserDefinedFunction}.
     */
    constructor(container, id, clientContext) {
        this.container = container;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Read the {@link UserDefinedFunctionDefinition} for the given {@link UserDefinedFunction}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: exports.ResourceType.udf,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new UserDefinedFunctionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Replace the given {@link UserDefinedFunction} with the specified {@link UserDefinedFunctionDefinition}.
     * @param options -
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (body.body) {
                body.body = body.body.toString();
            }
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: exports.ResourceType.udf,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new UserDefinedFunctionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link UserDefined}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.udf,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new UserDefinedFunctionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/**
 * Used to create, upsert, query, or read all User Defined Functions.
 *
 * @see {@link UserDefinedFunction} to read, replace, or delete a given User Defined Function by id.
 */
class UserDefinedFunctions {
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     */
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.container.url, exports.ResourceType.udf);
        const id = getIdFromLink(this.container.url);
        return new QueryIterator(this.clientContext, query, options, (diagnosticNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.udf,
                resourceId: id,
                resultFn: (result) => result.UserDefinedFunctions,
                query,
                options: innerOptions,
                diagnosticNode,
            });
        });
    }
    /**
     * Read all User Defined Functions.
     * @example Read all User Defined Functions to array.
     * ```typescript
     * const {body: udfList} = await container.userDefinedFunctions.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
    /**
     * Create a UserDefinedFunction.
     *
     * Azure Cosmos DB supports JavaScript UDFs which can be used inside queries, stored procedures and triggers.
     *
     * For additional details, refer to the server-side JavaScript API documentation.
     *
     */
    async create(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (body.body) {
                body.body = body.body.toString();
            }
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, exports.ResourceType.udf);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: exports.ResourceType.udf,
                resourceId: id,
                options,
                diagnosticNode,
            });
            const ref = new UserDefinedFunction(this.container, response.result.id, this.clientContext);
            return new UserDefinedFunctionResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class Scripts {
    /**
     * @param container - The parent {@link Container}.
     * @hidden
     */
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
    }
    /**
     * Used to read, replace, or delete a specific, existing {@link StoredProcedure} by id.
     *
     * Use `.storedProcedures` for creating new stored procedures, or querying/reading all stored procedures.
     * @param id - The id of the {@link StoredProcedure}.
     */
    storedProcedure(id) {
        return new StoredProcedure(this.container, id, this.clientContext);
    }
    /**
     * Used to read, replace, or delete a specific, existing {@link Trigger} by id.
     *
     * Use `.triggers` for creating new triggers, or querying/reading all triggers.
     * @param id - The id of the {@link Trigger}.
     */
    trigger(id) {
        return new Trigger(this.container, id, this.clientContext);
    }
    /**
     * Used to read, replace, or delete a specific, existing {@link UserDefinedFunction} by id.
     *
     * Use `.userDefinedFunctions` for creating new user defined functions, or querying/reading all user defined functions.
     * @param id - The id of the {@link UserDefinedFunction}.
     */
    userDefinedFunction(id) {
        return new UserDefinedFunction(this.container, id, this.clientContext);
    }
    /**
     * Operations for creating new stored procedures, and reading/querying all stored procedures.
     *
     * For reading, replacing, or deleting an existing stored procedure, use `.storedProcedure(id)`.
     */
    get storedProcedures() {
        if (!this.$sprocs) {
            this.$sprocs = new StoredProcedures(this.container, this.clientContext);
        }
        return this.$sprocs;
    }
    /**
     * Operations for creating new triggers, and reading/querying all triggers.
     *
     * For reading, replacing, or deleting an existing trigger, use `.trigger(id)`.
     */
    get triggers() {
        if (!this.$triggers) {
            this.$triggers = new Triggers(this.container, this.clientContext);
        }
        return this.$triggers;
    }
    /**
     * Operations for creating new user defined functions, and reading/querying all user defined functions.
     *
     * For reading, replacing, or deleting an existing user defined function, use `.userDefinedFunction(id)`.
     */
    get userDefinedFunctions() {
        if (!this.$udfs) {
            this.$udfs = new UserDefinedFunctions(this.container, this.clientContext);
        }
        return this.$udfs;
    }
}

/** Response object for Container operations */
class ContainerResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, container, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.container = container;
    }
}

class OfferResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, diagnostics, offer) {
        super(resource, headers, statusCode, diagnostics);
        this.offer = offer;
    }
}

/**
 * Use to read or replace an existing {@link Offer} by id.
 *
 * @see {@link Offers} to query or read all offers.
 */
class Offer {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return `/${Constants$1.Path.OffersPathSegment}/${this.id}`;
    }
    /**
     * @hidden
     * @param client - The parent {@link CosmosClient} for the Database Account.
     * @param id - The id of the given {@link Offer}.
     */
    constructor(client, id, clientContext) {
        this.client = client;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Read the {@link OfferDefinition} for the given {@link Offer}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const response = await this.clientContext.read({
                path: this.url,
                resourceType: exports.ResourceType.offer,
                resourceId: this.id,
                options,
                diagnosticNode,
            });
            return new OfferResponse(response.result, response.headers, response.code, getEmptyCosmosDiagnostics(), this);
        }, this.clientContext);
    }
    /**
     * Replace the given {@link Offer} with the specified {@link OfferDefinition}.
     * @param body - The specified {@link OfferDefinition}
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const response = await this.clientContext.replace({
                body,
                path: this.url,
                resourceType: exports.ResourceType.offer,
                resourceId: this.id,
                options,
                diagnosticNode,
            });
            return new OfferResponse(response.result, response.headers, response.code, getEmptyCosmosDiagnostics(), this);
        }, this.clientContext);
    }
}

/**
 * Use to query or read all Offers.
 *
 * @see {@link Offer} to read or replace an existing {@link Offer} by id.
 */
class Offers {
    /**
     * @hidden
     * @param client - The parent {@link CosmosClient} for the offers.
     */
    constructor(client, clientContext) {
        this.client = client;
        this.clientContext = clientContext;
    }
    query(query, options) {
        return new QueryIterator(this.clientContext, query, options, (diagnosticNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path: "/offers",
                resourceType: exports.ResourceType.offer,
                resourceId: "",
                resultFn: (result) => result.Offers,
                query,
                options: innerOptions,
                diagnosticNode,
            });
        });
    }
    /**
     * Read all offers.
     * @example Read all offers to array.
     * ```typescript
     * const {body: offerList} = await client.offers.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
}

/**
 * Operations for reading, replacing, or deleting a specific, existing container by id.
 *
 * @see {@link Containers} for creating new containers, and reading/querying all containers; use `.containers`.
 *
 * Note: all these operations make calls against a fixed budget.
 * You should design your system such that these calls scale sublinearly with your application.
 * For instance, do not call `container(id).read()` before every single `item.read()` call, to ensure the container exists;
 * do this once on application start up.
 */
class Container {
    /**
     * Operations for creating new items, and reading/querying all items
     *
     * For reading, replacing, or deleting an existing item, use `.item(id)`.
     *
     * @example Create a new item
     * ```typescript
     * const {body: createdItem} = await container.items.create({id: "<item id>", properties: {}});
     * ```
     */
    get items() {
        if (!this.$items) {
            this.$items = new Items(this, this.clientContext);
        }
        return this.$items;
    }
    /**
     * All operations for Stored Procedures, Triggers, and User Defined Functions
     */
    get scripts() {
        if (!this.$scripts) {
            this.$scripts = new Scripts(this, this.clientContext);
        }
        return this.$scripts;
    }
    /**
     * Operations for reading and querying conflicts for the given container.
     *
     * For reading or deleting a specific conflict, use `.conflict(id)`.
     */
    get conflicts() {
        if (!this.$conflicts) {
            this.$conflicts = new Conflicts(this, this.clientContext);
        }
        return this.$conflicts;
    }
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createDocumentCollectionUri(this.database.id, this.id);
    }
    /**
     * Returns a container instance. Note: You should get this from `database.container(id)`, rather than creating your own object.
     * @param database - The parent {@link Database}.
     * @param id - The id of the given container.
     * @hidden
     */
    constructor(database, id, clientContext) {
        this.database = database;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Used to read, replace, or delete a specific, existing {@link Item} by id.
     *
     * Use `.items` for creating new items, or querying/reading all items.
     *
     * @param id - The id of the {@link Item}.
     * @param partitionKeyValue - The value of the {@link Item} partition key
     * @example Replace an item
     * `const {body: replacedItem} = await container.item("<item id>", "<partition key value>").replace({id: "<item id>", title: "Updated post", authorID: 5});`
     */
    item(id, partitionKeyValue) {
        return new Item(this, id, this.clientContext, partitionKeyValue);
    }
    /**
     * Used to read, replace, or delete a specific, existing {@link Conflict} by id.
     *
     * Use `.conflicts` for creating new conflicts, or querying/reading all conflicts.
     * @param id - The id of the {@link Conflict}.
     */
    conflict(id, partitionKey) {
        return new Conflict(this, id, this.clientContext, partitionKey);
    }
    /** Read the container's definition */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.readInternal(diagnosticNode, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async readInternal(diagnosticNode, options) {
        const path = getPathFromLink(this.url);
        const id = getIdFromLink(this.url);
        const response = await this.clientContext.read({
            path,
            resourceType: exports.ResourceType.container,
            resourceId: id,
            options,
            diagnosticNode,
        });
        this.clientContext.partitionKeyDefinitionCache[this.url] = response.result.partitionKey;
        return new ContainerResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
    }
    /** Replace the container's definition */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: exports.ResourceType.container,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new ContainerResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /** Delete the container */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.container,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new ContainerResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Gets the partition key definition first by looking into the cache otherwise by reading the collection.
     * @deprecated This method has been renamed to readPartitionKeyDefinition.
     */
    async getPartitionKeyDefinition() {
        return withDiagnostics(async (diagnosticNode) => {
            return this.readPartitionKeyDefinition(diagnosticNode);
        }, this.clientContext);
    }
    /**
     * Gets the partition key definition first by looking into the cache otherwise by reading the collection.
     * @hidden
     */
    async readPartitionKeyDefinition(diagnosticNode) {
        // $ISSUE-felixfan-2016-03-17: Make name based path and link based path use the same key
        // $ISSUE-felixfan-2016-03-17: Refresh partitionKeyDefinitionCache when necessary
        if (this.url in this.clientContext.partitionKeyDefinitionCache) {
            diagnosticNode.addData({ readFromCache: true });
            return new ResourceResponse(this.clientContext.partitionKeyDefinitionCache[this.url], {}, 0, getEmptyCosmosDiagnostics());
        }
        const { headers, statusCode, diagnostics } = await withMetadataDiagnostics(async (node) => {
            return this.readInternal(node);
        }, diagnosticNode, exports.MetadataLookUpType.ContainerLookUp);
        return new ResourceResponse(this.clientContext.partitionKeyDefinitionCache[this.url], headers, statusCode, diagnostics);
    }
    /**
     * Gets offer on container. If none exists, returns an OfferResponse with undefined.
     */
    async readOffer(options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            const { resource: container } = await this.read();
            const path = "/offers";
            const url = container._self;
            const response = await this.clientContext.queryFeed({
                path,
                resourceId: "",
                resourceType: exports.ResourceType.offer,
                query: `SELECT * from root where root.resource = "${url}"`,
                resultFn: (result) => result.Offers,
                options,
                diagnosticNode,
            });
            const offer = response.result[0]
                ? new Offer(this.database.client, response.result[0].id, this.clientContext)
                : undefined;
            return new OfferResponse(response.result[0], response.headers, response.code, getEmptyCosmosDiagnostics(), offer);
        }, this.clientContext);
    }
    async getQueryPlan(query) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            return this.clientContext.getQueryPlan(path + "/docs", exports.ResourceType.item, getIdFromLink(this.url), query, {}, diagnosticNode);
        }, this.clientContext);
    }
    readPartitionKeyRanges(feedOptions) {
        feedOptions = feedOptions || {};
        return this.clientContext.queryPartitionKeyRanges(this.url, undefined, feedOptions);
    }
    /**
     *
     * @returns all the feed ranges for which changefeed could be fetched.
     */
    async getFeedRanges() {
        return withDiagnostics(async (diagnosticNode) => {
            const { resources } = await this.readPartitionKeyRanges().fetchAllInternal(diagnosticNode);
            const feedRanges = [];
            for (const resource of resources) {
                const feedRange = new FeedRangeInternal(resource.minInclusive, resource.maxExclusive);
                Object.freeze(feedRange);
                feedRanges.push(feedRange);
            }
            return feedRanges;
        }, this.clientContext);
    }
    /**
     * Delete all documents belong to the container for the provided partition key value
     * @param partitionKey - The partition key value of the items to be deleted
     */
    async deleteAllItemsForPartitionKey(partitionKey, options) {
        return withDiagnostics(async (diagnosticNode) => {
            let path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            path = path + "/operations/partitionkeydelete";
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.container,
                resourceId: id,
                options,
                partitionKey: partitionKey,
                method: exports.HTTPMethod.post,
                diagnosticNode,
            });
            return new ContainerResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function validateOffer(body) {
    if (body.throughput) {
        if (body.maxThroughput) {
            console.log("should be erroring");
            throw new Error("Cannot specify `throughput` with `maxThroughput`");
        }
        if (body.autoUpgradePolicy) {
            throw new Error("Cannot specify autoUpgradePolicy with throughput. Use `maxThroughput` instead");
        }
    }
}

/**
 * Operations for creating new containers, and reading/querying all containers
 *
 * @see {@link Container} for reading, replacing, or deleting an existing container; use `.container(id)`.
 *
 * Note: all these operations make calls against a fixed budget.
 * You should design your system such that these calls scale sublinearly with your application.
 * For instance, do not call `containers.readAll()` before every single `item.read()` call, to ensure the container exists;
 * do this once on application start up.
 */
class Containers {
    constructor(database, clientContext) {
        this.database = database;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.database.url, exports.ResourceType.container);
        const id = getIdFromLink(this.database.url);
        return new QueryIterator(this.clientContext, query, options, (diagNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.container,
                resourceId: id,
                resultFn: (result) => result.DocumentCollections,
                query,
                options: innerOptions,
                diagnosticNode: diagNode,
            });
        });
    }
    /**
     * Creates a container.
     *
     * A container is a named logical container for items.
     *
     * A database may contain zero or more named containers and each container consists of
     * zero or more JSON items.
     *
     * Being schema-free, the items in a container do not need to share the same structure or fields.
     *
     *
     * Since containers are application resources, they can be authorized using either the
     * master key or resource keys.
     *
     * @param body - Represents the body of the container.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     */
    async create(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.createInternal(diagnosticNode, body, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async createInternal(diagnosticNode, body, options = {}) {
        const err = {};
        if (!isResourceValid(body, err)) {
            throw err;
        }
        const path = getPathFromLink(this.database.url, exports.ResourceType.container);
        const id = getIdFromLink(this.database.url);
        validateOffer(body);
        if (body.maxThroughput) {
            const autoscaleParams = {
                maxThroughput: body.maxThroughput,
            };
            if (body.autoUpgradePolicy) {
                autoscaleParams.autoUpgradePolicy = body.autoUpgradePolicy;
            }
            const autoscaleHeader = JSON.stringify(autoscaleParams);
            options.initialHeaders = Object.assign({}, options.initialHeaders, {
                [Constants$1.HttpHeaders.AutoscaleSettings]: autoscaleHeader,
            });
            delete body.maxThroughput;
            delete body.autoUpgradePolicy;
        }
        if (body.throughput) {
            options.initialHeaders = Object.assign({}, options.initialHeaders, {
                [Constants$1.HttpHeaders.OfferThroughput]: body.throughput,
            });
            delete body.throughput;
        }
        if (typeof body.partitionKey === "string") {
            if (!body.partitionKey.startsWith("/")) {
                throw new Error("Partition key must start with '/'");
            }
            body.partitionKey = {
                paths: [body.partitionKey],
            };
        }
        // If they don't specify a partition key, use the default path
        if (!body.partitionKey || !body.partitionKey.paths) {
            body.partitionKey = {
                paths: [DEFAULT_PARTITION_KEY_PATH],
            };
        }
        const response = await this.clientContext.create({
            body,
            path,
            resourceType: exports.ResourceType.container,
            resourceId: id,
            diagnosticNode,
            options,
        });
        const ref = new Container(this.database, response.result.id, this.clientContext);
        return new ContainerResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
    }
    /**
     * Checks if a Container exists, and, if it doesn't, creates it.
     * This will make a read operation based on the id in the `body`, then if it is not found, a create operation.
     * You should confirm that the output matches the body you passed in for non-default properties (i.e. indexing policy/etc.)
     *
     * A container is a named logical container for items.
     *
     * A database may contain zero or more named containers and each container consists of
     * zero or more JSON items.
     *
     * Being schema-free, the items in a container do not need to share the same structure or fields.
     *
     *
     * Since containers are application resources, they can be authorized using either the
     * master key or resource keys.
     *
     * @param body - Represents the body of the container.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     */
    async createIfNotExists(body, options) {
        if (!body || body.id === null || body.id === undefined) {
            throw new Error("body parameter must be an object with an id property");
        }
        /*
          1. Attempt to read the Container (based on an assumption that most containers will already exist, so its faster)
          2. If it fails with NotFound error, attempt to create the container. Else, return the read results.
        */
        return withDiagnostics(async (diagnosticNode) => {
            try {
                const readResponse = await this.database
                    .container(body.id)
                    .readInternal(diagnosticNode, options);
                return readResponse;
            }
            catch (err) {
                if (err.code === StatusCodes.NotFound) {
                    const createResponse = await this.createInternal(diagnosticNode, body, options);
                    // Must merge the headers to capture RU costskaty
                    mergeHeaders(createResponse.headers, err.headers);
                    return createResponse;
                }
                else {
                    throw err;
                }
            }
        }, this.clientContext);
    }
    /**
     * Read all containers.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     * @returns {@link QueryIterator} Allows you to return all containers in an array or iterate over them one at a time.
     * @example Read all containers to array.
     * ```typescript
     * const {body: containerList} = await client.database("<db id>").containers.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
}

class PermissionResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, permission, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.permission = permission;
    }
}

/**
 * Use to read, replace, or delete a given {@link Permission} by id.
 *
 * @see {@link Permissions} to create, upsert, query, or read all Permissions.
 */
class Permission {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createPermissionUri(this.user.database.id, this.user.id, this.id);
    }
    /**
     * @hidden
     * @param user - The parent {@link User}.
     * @param id - The id of the given {@link Permission}.
     */
    constructor(user, id, clientContext) {
        this.user = user;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Read the {@link PermissionDefinition} of the given {@link Permission}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: exports.ResourceType.permission,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new PermissionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Replace the given {@link Permission} with the specified {@link PermissionDefinition}.
     * @param body - The specified {@link PermissionDefinition}.
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: exports.ResourceType.permission,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new PermissionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link Permission}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.permission,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new PermissionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/**
 * Use to create, replace, query, and read all Permissions.
 *
 * @see {@link Permission} to read, replace, or delete a specific permission by id.
 */
class Permissions {
    /**
     * @hidden
     * @param user - The parent {@link User}.
     */
    constructor(user, clientContext) {
        this.user = user;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.user.url, exports.ResourceType.permission);
        const id = getIdFromLink(this.user.url);
        return new QueryIterator(this.clientContext, query, options, (diagnosticNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.permission,
                resourceId: id,
                resultFn: (result) => result.Permissions,
                query,
                options: innerOptions,
                diagnosticNode,
            });
        });
    }
    /**
     * Read all permissions.
     * @example Read all permissions to array.
     * ```typescript
     * const {body: permissionList} = await user.permissions.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
    /**
     * Create a permission.
     *
     * A permission represents a per-User Permission to access a specific resource
     * e.g. Item or Container.
     * @param body - Represents the body of the permission.
     */
    async create(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.user.url, exports.ResourceType.permission);
            const id = getIdFromLink(this.user.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: exports.ResourceType.permission,
                resourceId: id,
                diagnosticNode,
                options,
            });
            const ref = new Permission(this.user, response.result.id, this.clientContext);
            return new PermissionResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Upsert a permission.
     *
     * A permission represents a per-User Permission to access a
     * specific resource e.g. Item or Container.
     */
    async upsert(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.user.url, exports.ResourceType.permission);
            const id = getIdFromLink(this.user.url);
            const response = await this.clientContext.upsert({
                body,
                path,
                resourceType: exports.ResourceType.permission,
                resourceId: id,
                options,
                diagnosticNode,
            });
            const ref = new Permission(this.user, response.result.id, this.clientContext);
            return new PermissionResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

class UserResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, user, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.user = user;
    }
}

/**
 * Used to read, replace, and delete Users.
 *
 * Additionally, you can access the permissions for a given user via `user.permission` and `user.permissions`.
 *
 * @see {@link Users} to create, upsert, query, or read all.
 */
class User {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createUserUri(this.database.id, this.id);
    }
    /**
     * @hidden
     * @param database - The parent {@link Database}.
     */
    constructor(database, id, clientContext) {
        this.database = database;
        this.id = id;
        this.clientContext = clientContext;
        this.permissions = new Permissions(this, this.clientContext);
    }
    /**
     * Operations to read, replace, or delete a specific Permission by id.
     *
     * See `client.permissions` for creating, upserting, querying, or reading all operations.
     */
    permission(id) {
        return new Permission(this, id, this.clientContext);
    }
    /**
     * Read the {@link UserDefinition} for the given {@link User}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: exports.ResourceType.user,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new UserResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Replace the given {@link User}'s definition with the specified {@link UserDefinition}.
     * @param body - The specified {@link UserDefinition} to replace the definition.
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: exports.ResourceType.user,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new UserResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link User}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.user,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new UserResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/**
 * Used to create, upsert, query, and read all users.
 *
 * @see {@link User} to read, replace, or delete a specific User by id.
 */
class Users {
    /**
     * @hidden
     * @param database - The parent {@link Database}.
     */
    constructor(database, clientContext) {
        this.database = database;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.database.url, exports.ResourceType.user);
        const id = getIdFromLink(this.database.url);
        return new QueryIterator(this.clientContext, query, options, (diagnosticNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: exports.ResourceType.user,
                resourceId: id,
                resultFn: (result) => result.Users,
                query,
                options: innerOptions,
                diagnosticNode,
            });
        });
    }
    /**
     * Read all users.-
     * @example Read all users to array.
     * ```typescript
     * const {body: usersList} = await database.users.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
    /**
     * Create a database user with the specified {@link UserDefinition}.
     * @param body - The specified {@link UserDefinition}.
     */
    async create(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.database.url, exports.ResourceType.user);
            const id = getIdFromLink(this.database.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: exports.ResourceType.user,
                resourceId: id,
                options,
                diagnosticNode,
            });
            const ref = new User(this.database, response.result.id, this.clientContext);
            return new UserResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Upsert a database user with a specified {@link UserDefinition}.
     * @param body - The specified {@link UserDefinition}.
     */
    async upsert(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.database.url, exports.ResourceType.user);
            const id = getIdFromLink(this.database.url);
            const response = await this.clientContext.upsert({
                body,
                path,
                resourceType: exports.ResourceType.user,
                resourceId: id,
                options,
                diagnosticNode,
            });
            const ref = new User(this.database, response.result.id, this.clientContext);
            return new UserResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}

/** Response object for Database operations */
class DatabaseResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, database, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.database = database;
    }
}

/**
 * Operations for reading or deleting an existing database.
 *
 * @see {@link Databases} for creating new databases, and reading/querying all databases; use `client.databases`.
 *
 * Note: all these operations make calls against a fixed budget.
 * You should design your system such that these calls scale sublinearly with your application.
 * For instance, do not call `database.read()` before every single `item.read()` call, to ensure the database exists;
 * do this once on application start up.
 */
class Database {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createDatabaseUri(this.id);
    }
    /** Returns a new {@link Database} instance.
     *
     * Note: the intention is to get this object from {@link CosmosClient} via `client.database(id)`, not to instantiate it yourself.
     */
    constructor(client, id, clientContext) {
        this.client = client;
        this.id = id;
        this.clientContext = clientContext;
        this.containers = new Containers(this, this.clientContext);
        this.users = new Users(this, this.clientContext);
    }
    /**
     * Used to read, replace, or delete a specific, existing {@link Database} by id.
     *
     * Use `.containers` creating new containers, or querying/reading all containers.
     *
     * @example Delete a container
     * ```typescript
     * await client.database("<db id>").container("<container id>").delete();
     * ```
     */
    container(id) {
        return new Container(this, id, this.clientContext);
    }
    /**
     * Used to read, replace, or delete a specific, existing {@link User} by id.
     *
     * Use `.users` for creating new users, or querying/reading all users.
     */
    user(id) {
        return new User(this, id, this.clientContext);
    }
    /** Read the definition of the given Database. */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.readInternal(diagnosticNode, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async readInternal(diagnosticNode, options) {
        const path = getPathFromLink(this.url);
        const id = getIdFromLink(this.url);
        const response = await this.clientContext.read({
            path,
            resourceType: exports.ResourceType.database,
            resourceId: id,
            options,
            diagnosticNode,
        });
        return new DatabaseResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
    }
    /** Delete the given Database. */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: exports.ResourceType.database,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new DatabaseResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Gets offer on database. If none exists, returns an OfferResponse with undefined.
     */
    async readOffer(options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            const { resource: record } = await withMetadataDiagnostics(async (node) => {
                return this.readInternal(node);
            }, diagnosticNode, exports.MetadataLookUpType.DatabaseLookUp);
            const path = "/offers";
            const url = record._self;
            const response = await this.clientContext.queryFeed({
                path,
                resourceId: "",
                resourceType: exports.ResourceType.offer,
                query: `SELECT * from root where root.resource = "${url}"`,
                resultFn: (result) => result.Offers,
                options,
                diagnosticNode,
            });
            const offer = response.result[0]
                ? new Offer(this.client, response.result[0].id, this.clientContext)
                : undefined;
            return new OfferResponse(response.result[0], response.headers, response.code, getEmptyCosmosDiagnostics(), offer);
        }, this.clientContext);
    }
}

/**
 * Operations for creating new databases, and reading/querying all databases
 *
 * @see {@link Database} for reading or deleting an existing database; use `client.database(id)`.
 *
 * Note: all these operations make calls against a fixed budget.
 * You should design your system such that these calls scale sublinearly with your application.
 * For instance, do not call `databases.readAll()` before every single `item.read()` call, to ensure the database exists;
 * do this once on application start up.
 */
class Databases {
    /**
     * @hidden
     * @param client - The parent {@link CosmosClient} for the Database.
     */
    constructor(client, clientContext) {
        this.client = client;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const cb = (diagNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path: "/dbs",
                resourceType: exports.ResourceType.database,
                resourceId: "",
                resultFn: (result) => result.Databases,
                query,
                options: innerOptions,
                diagnosticNode: diagNode,
            });
        };
        return new QueryIterator(this.clientContext, query, options, cb);
    }
    /**
     * Send a request for creating a database.
     *
     * A database manages users, permissions and a set of containers.
     * Each Azure Cosmos DB Database Account is able to support multiple independent named databases,
     * with the database being the logical container for data.
     *
     * Each Database consists of one or more containers, each of which in turn contain one or more
     * documents. Since databases are an administrative resource, the Service Master Key will be
     * required in order to access and successfully complete any action using the User APIs.
     *
     * @param body - The {@link DatabaseDefinition} that represents the {@link Database} to be created.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     */
    async create(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.createInternal(diagnosticNode, body, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async createInternal(diagnosticNode, body, options = {}) {
        const err = {};
        if (!isResourceValid(body, err)) {
            throw err;
        }
        validateOffer(body);
        if (body.maxThroughput) {
            const autoscaleParams = {
                maxThroughput: body.maxThroughput,
            };
            if (body.autoUpgradePolicy) {
                autoscaleParams.autoUpgradePolicy = body.autoUpgradePolicy;
            }
            const autoscaleHeaders = JSON.stringify(autoscaleParams);
            options.initialHeaders = Object.assign({}, options.initialHeaders, {
                [Constants$1.HttpHeaders.AutoscaleSettings]: autoscaleHeaders,
            });
            delete body.maxThroughput;
            delete body.autoUpgradePolicy;
        }
        if (body.throughput) {
            options.initialHeaders = Object.assign({}, options.initialHeaders, {
                [Constants$1.HttpHeaders.OfferThroughput]: body.throughput,
            });
            delete body.throughput;
        }
        const path = "/dbs"; // TODO: constant
        const response = await this.clientContext.create({
            body,
            path,
            resourceType: exports.ResourceType.database,
            resourceId: undefined,
            diagnosticNode,
            options,
        });
        const ref = new Database(this.client, body.id, this.clientContext);
        return new DatabaseResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
    }
    /**
     * Check if a database exists, and if it doesn't, create it.
     * This will make a read operation based on the id in the `body`, then if it is not found, a create operation.
     *
     * A database manages users, permissions and a set of containers.
     * Each Azure Cosmos DB Database Account is able to support multiple independent named databases,
     * with the database being the logical container for data.
     *
     * Each Database consists of one or more containers, each of which in turn contain one or more
     * documents. Since databases are an an administrative resource, the Service Master Key will be
     * required in order to access and successfully complete any action using the User APIs.
     *
     * @param body - The {@link DatabaseDefinition} that represents the {@link Database} to be created.
     * @param options - Additional options for the request
     */
    async createIfNotExists(body, options) {
        if (!body || body.id === null || body.id === undefined) {
            throw new Error("body parameter must be an object with an id property");
        }
        /*
          1. Attempt to read the Database (based on an assumption that most databases will already exist, so its faster)
          2. If it fails with NotFound error, attempt to create the db. Else, return the read results.
        */
        return withDiagnostics(async (diagnosticNode) => {
            try {
                const readResponse = await this.client
                    .database(body.id)
                    .readInternal(diagnosticNode, options);
                return readResponse;
            }
            catch (err) {
                if (err.code === StatusCodes.NotFound) {
                    const createResponse = await this.createInternal(diagnosticNode, body, options);
                    // Must merge the headers to capture RU costskaty
                    mergeHeaders(createResponse.headers, err.headers);
                    return createResponse;
                }
                else {
                    throw err;
                }
            }
        }, this.clientContext);
    }
    // TODO: DatabaseResponse for QueryIterator?
    /**
     * Reads all databases.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     * @returns {@link QueryIterator} Allows you to return all databases in an array or iterate over them one at a time.
     * @example Read all databases to array.
     * ```typescript
     * const {body: databaseList} = await client.databases.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
}

/**
 * Used to specify which type of events to execute this plug in on.
 *
 * @hidden
 */
exports.PluginOn = void 0;
(function (PluginOn) {
    /**
     * Will be executed per network request
     */
    PluginOn["request"] = "request";
    /**
     * Will be executed per API operation
     */
    PluginOn["operation"] = "operation";
})(exports.PluginOn || (exports.PluginOn = {}));
/**
 * @internal
 */
async function executePlugins(diagnosticNode, requestContext, next, on) {
    if (!requestContext.plugins) {
        return next(requestContext, diagnosticNode, undefined);
    }
    let level = 0;
    const _ = (inner) => {
        if (++level >= inner.plugins.length) {
            return next(requestContext, diagnosticNode, undefined);
        }
        else if (inner.plugins[level].on !== on) {
            return _(requestContext);
        }
        else {
            return inner.plugins[level].plugin(inner, diagnosticNode, _);
        }
    };
    if (requestContext.plugins[level].on !== on) {
        return _(requestContext);
    }
    else {
        return requestContext.plugins[level].plugin(requestContext, diagnosticNode, _);
    }
}

/**
 * @hidden
 */
// Windows Socket Error Codes
const WindowsInterruptedFunctionCall = 10004;
/**
 * @hidden
 */
const WindowsFileHandleNotValid = 10009;
/**
 * @hidden
 */
const WindowsPermissionDenied = 10013;
/**
 * @hidden
 */
const WindowsBadAddress = 10014;
/**
 * @hidden
 */
const WindowsInvalidArgumnet = 10022;
/**
 * @hidden
 */
const WindowsResourceTemporarilyUnavailable = 10035;
/**
 * @hidden
 */
const WindowsOperationNowInProgress = 10036;
/**
 * @hidden
 */
const WindowsAddressAlreadyInUse = 10048;
/**
 * @hidden
 */
const WindowsConnectionResetByPeer = 10054;
/**
 * @hidden
 */
const WindowsCannotSendAfterSocketShutdown = 10058;
/**
 * @hidden
 */
const WindowsConnectionTimedOut = 10060;
/**
 * @hidden
 */
const WindowsConnectionRefused = 10061;
/**
 * @hidden
 */
const WindowsNameTooLong = 10063;
/**
 * @hidden
 */
const WindowsHostIsDown = 10064;
/**
 * @hidden
 */
const WindowsNoRouteTohost = 10065;
/**
 * @hidden
 */
// Linux Error Codes
/**
 * @hidden
 */
const LinuxConnectionReset = "ECONNRESET";
// Node Error Codes
/**
 * @hidden
 */
const BrokenPipe = "EPIPE";
/**
 * @hidden
 */
const CONNECTION_ERROR_CODES = [
    WindowsInterruptedFunctionCall,
    WindowsFileHandleNotValid,
    WindowsPermissionDenied,
    WindowsBadAddress,
    WindowsInvalidArgumnet,
    WindowsResourceTemporarilyUnavailable,
    WindowsOperationNowInProgress,
    WindowsAddressAlreadyInUse,
    WindowsConnectionResetByPeer,
    WindowsCannotSendAfterSocketShutdown,
    WindowsConnectionTimedOut,
    WindowsConnectionRefused,
    WindowsNameTooLong,
    WindowsHostIsDown,
    WindowsNoRouteTohost,
    LinuxConnectionReset,
    TimeoutErrorCode,
    BrokenPipe,
];
/**
 * @hidden
 */
function needsRetry(operationType, code) {
    if ((operationType === exports.OperationType.Read || operationType === exports.OperationType.Query) &&
        CONNECTION_ERROR_CODES.indexOf(code) !== -1) {
        return true;
    }
    else {
        return false;
    }
}
/**
 * This class implements the default connection retry policy for requests.
 * @hidden
 */
class DefaultRetryPolicy {
    constructor(operationType) {
        this.operationType = operationType;
        this.maxTries = 10;
        this.currentRetryAttemptCount = 0;
        this.retryAfterInMs = 1000;
    }
    /**
     * Determines whether the request should be retried or not.
     * @param err - Error returned by the request.
     */
    async shouldRetry(err, diagnosticNode) {
        if (err) {
            if (this.currentRetryAttemptCount < this.maxTries &&
                needsRetry(this.operationType, err.code)) {
                diagnosticNode.addData({ successfulRetryPolicy: "default" });
                this.currentRetryAttemptCount++;
                return true;
            }
        }
        return false;
    }
}

/**
 * This class implements the retry policy for endpoint discovery.
 * @hidden
 */
class EndpointDiscoveryRetryPolicy {
    /**
     * @param globalEndpointManager - The GlobalEndpointManager instance.
     */
    constructor(globalEndpointManager, operationType) {
        this.globalEndpointManager = globalEndpointManager;
        this.operationType = operationType;
        this.maxTries = EndpointDiscoveryRetryPolicy.maxTries;
        this.currentRetryAttemptCount = 0;
        this.retryAfterInMs = EndpointDiscoveryRetryPolicy.retryAfterInMs;
    }
    /**
     * Determines whether the request should be retried or not.
     * @param err - Error returned by the request.
     */
    async shouldRetry(err, diagnosticNode, retryContext, locationEndpoint) {
        if (!err) {
            return false;
        }
        if (!retryContext || !locationEndpoint) {
            return false;
        }
        if (!this.globalEndpointManager.enableEndpointDiscovery) {
            return false;
        }
        if (this.currentRetryAttemptCount >= this.maxTries) {
            return false;
        }
        this.currentRetryAttemptCount++;
        if (isReadRequest(this.operationType)) {
            await this.globalEndpointManager.markCurrentLocationUnavailableForRead(diagnosticNode, locationEndpoint);
        }
        else {
            await this.globalEndpointManager.markCurrentLocationUnavailableForWrite(diagnosticNode, locationEndpoint);
        }
        retryContext.retryCount = this.currentRetryAttemptCount;
        retryContext.clearSessionTokenNotAvailable = false;
        retryContext.retryRequestOnPreferredLocations = false;
        diagnosticNode.addData({ successfulRetryPolicy: "endpointDiscovery" });
        return true;
    }
}
EndpointDiscoveryRetryPolicy.maxTries = 120; // TODO: Constant?
EndpointDiscoveryRetryPolicy.retryAfterInMs = 1000;

/**
 * This class implements the resource throttle retry policy for requests.
 * @hidden
 */
class ResourceThrottleRetryPolicy {
    /**
     * @param maxTries - Max number of retries to be performed for a request.
     * @param fixedRetryIntervalInMs - Fixed retry interval in milliseconds to wait between each
     * retry ignoring the retryAfter returned as part of the response.
     * @param timeoutInSeconds - Max wait time in seconds to wait for a request while the
     * retries are happening.
     */
    constructor(maxTries = 9, fixedRetryIntervalInMs = 0, timeoutInSeconds = 30) {
        this.maxTries = maxTries;
        this.fixedRetryIntervalInMs = fixedRetryIntervalInMs;
        /** Current retry attempt count. */
        this.currentRetryAttemptCount = 0;
        /** Cummulative wait time in milliseconds for a request while the retries are happening. */
        this.cummulativeWaitTimeinMs = 0;
        /** Retry interval in milliseconds to wait before the next request will be sent. */
        this.retryAfterInMs = 0;
        this.timeoutInMs = timeoutInSeconds * 1000;
        this.currentRetryAttemptCount = 0;
        this.cummulativeWaitTimeinMs = 0;
    }
    /**
     * Determines whether the request should be retried or not.
     * @param err - Error returned by the request.
     */
    async shouldRetry(err, diagnosticNode) {
        // TODO: any custom error object
        if (err) {
            if (this.currentRetryAttemptCount < this.maxTries) {
                this.currentRetryAttemptCount++;
                this.retryAfterInMs = 0;
                if (this.fixedRetryIntervalInMs) {
                    this.retryAfterInMs = this.fixedRetryIntervalInMs;
                }
                else if (err.retryAfterInMs) {
                    this.retryAfterInMs = err.retryAfterInMs;
                }
                if (this.cummulativeWaitTimeinMs < this.timeoutInMs) {
                    this.cummulativeWaitTimeinMs += this.retryAfterInMs;
                    diagnosticNode.addData({ successfulRetryPolicy: "resourceThrottle" });
                    return true;
                }
            }
        }
        return false;
    }
}

/**
 * This class implements the retry policy for session consistent reads.
 * @hidden
 */
class SessionRetryPolicy {
    /**
     * @param globalEndpointManager - The GlobalEndpointManager instance.
     */
    constructor(globalEndpointManager, resourceType, operationType, connectionPolicy) {
        this.globalEndpointManager = globalEndpointManager;
        this.resourceType = resourceType;
        this.operationType = operationType;
        this.connectionPolicy = connectionPolicy;
        /** Current retry attempt count. */
        this.currentRetryAttemptCount = 0;
        /** Retry interval in milliseconds. */
        this.retryAfterInMs = 0;
    }
    /**
     * Determines whether the request should be retried or not.
     * @param err - Error returned by the request.
     * @param callback - The callback function which takes bool argument which specifies whether the request
     * will be retried or not.
     */
    async shouldRetry(err, diagnosticNode, retryContext) {
        if (!err) {
            return false;
        }
        if (!retryContext) {
            return false;
        }
        if (!this.connectionPolicy.enableEndpointDiscovery) {
            return false;
        }
        if (this.globalEndpointManager.canUseMultipleWriteLocations(this.resourceType, this.operationType)) {
            // If we can write to multiple locations, we should against every write endpoint until we succeed
            const endpoints = isReadRequest(this.operationType)
                ? await this.globalEndpointManager.getReadEndpoints()
                : await this.globalEndpointManager.getWriteEndpoints();
            if (this.currentRetryAttemptCount > endpoints.length) {
                return false;
            }
            else {
                this.currentRetryAttemptCount++;
                retryContext.retryCount++;
                retryContext.retryRequestOnPreferredLocations = this.currentRetryAttemptCount > 1;
                retryContext.clearSessionTokenNotAvailable =
                    this.currentRetryAttemptCount === endpoints.length;
                diagnosticNode.addData({ successfulRetryPolicy: "session" });
                return true;
            }
        }
        else {
            if (this.currentRetryAttemptCount > 1) {
                return false;
            }
            else {
                this.currentRetryAttemptCount++;
                retryContext.retryCount++;
                retryContext.retryRequestOnPreferredLocations = false; // Forces all operations to primary write endpoint
                retryContext.clearSessionTokenNotAvailable = true;
                diagnosticNode.addData({ successfulRetryPolicy: "session" });
                return true;
            }
        }
    }
}

/**
 * This class TimeoutFailoverRetryPolicy handles retries for read operations
 * (including data plane,metadata, and query plan) in case of request timeouts
 * (TimeoutError) or service unavailability (503 status code) by performing failover
 * and retrying on other regions.
 * @hidden
 */
class TimeoutFailoverRetryPolicy {
    constructor(globalEndpointManager, headers, methodType, resourceType, operationType, enableEndPointDiscovery) {
        this.globalEndpointManager = globalEndpointManager;
        this.headers = headers;
        this.methodType = methodType;
        this.resourceType = resourceType;
        this.operationType = operationType;
        this.enableEndPointDiscovery = enableEndPointDiscovery;
        this.maxRetryAttemptCount = 120;
        this.maxServiceUnavailableRetryCount = 1;
        this.retryAfterInMs = 0;
        this.failoverRetryCount = 0;
    }
    /**
     * Checks if a timeout request is valid for the timeout failover retry policy.
     * A valid request should be a data plane, metadata, or query plan request.
     * @returns
     */
    isValidRequestForTimeoutError() {
        const isQuery = Constants$1.HttpHeaders.IsQuery in this.headers;
        const isQueryPlan = Constants$1.HttpHeaders.IsQueryPlan in this.headers;
        if (this.methodType === exports.HTTPMethod.get || isQuery || isQueryPlan) {
            return true;
        }
        return false;
    }
    async shouldRetry(err, diagnosticNode, retryContext, locationEndpoint) {
        if (!err) {
            return false;
        }
        if (!retryContext || !locationEndpoint) {
            return false;
        }
        // Check if the error is a timeout error (TimeoutErrorCode) and if it is not a valid HTTP network timeout request
        if (err.code === TimeoutErrorCode && !this.isValidRequestForTimeoutError()) {
            return false;
        }
        if (!this.enableEndPointDiscovery) {
            return false;
        }
        if (err.code === StatusCodes.ServiceUnavailable &&
            this.failoverRetryCount >= this.maxServiceUnavailableRetryCount) {
            return false;
        }
        if (this.failoverRetryCount >= this.maxRetryAttemptCount) {
            return false;
        }
        const canUseMultipleWriteLocations = this.globalEndpointManager.canUseMultipleWriteLocations(this.resourceType, this.operationType);
        const readRequest = isReadRequest(this.operationType);
        if (!canUseMultipleWriteLocations && !readRequest) {
            // Write requests on single master cannot be retried, no other regions available
            return false;
        }
        this.failoverRetryCount++;
        // Setting the retryLocationIndex to the next available location for retry.
        // The retryLocationIndex is determined based on the failoverRetryCount, starting from zero.
        retryContext.retryLocationServerIndex = await this.findEndpointIndex(this.failoverRetryCount);
        diagnosticNode.addData({ successfulRetryPolicy: "timeout-failover" });
        return true;
    }
    /**
     * Determines index of endpoint to be used for retry based upon failoverRetryCount and avalable locations
     * @param failoverRetryCount - count of failovers
     * @returns
     */
    async findEndpointIndex(failoverRetryCount) {
        // count of preferred locations specified by user
        const preferredLocationsCount = this.globalEndpointManager.preferredLocationsCount;
        const readRequest = isReadRequest(this.operationType);
        let endpointIndex = 0;
        // If preferredLocationsCount is not zero, it indicates that the user has specified preferred locations.
        if (preferredLocationsCount !== 0) {
            // The endpointIndex is set based on the preferred location and the failover retry count.
            endpointIndex = failoverRetryCount % preferredLocationsCount;
        }
        else {
            // In the absence of preferred locations, the endpoint selection is based on the failover count and the number of available locations.
            if (readRequest) {
                const getReadEndpoints = await this.globalEndpointManager.getReadEndpoints();
                if (getReadEndpoints && getReadEndpoints.length > 0) {
                    endpointIndex = failoverRetryCount % getReadEndpoints.length;
                }
            }
            else {
                const getWriteEndpoints = await this.globalEndpointManager.getWriteEndpoints();
                if (getWriteEndpoints && getWriteEndpoints.length > 0) {
                    endpointIndex = failoverRetryCount % getWriteEndpoints.length;
                }
            }
        }
        return endpointIndex;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
async function execute({ diagnosticNode, retryContext = { retryCount: 0 }, retryPolicies, requestContext, executeRequest, }) {
    // TODO: any response
    return addDignosticChild(async (localDiagnosticNode) => {
        localDiagnosticNode.addData({ requestAttempNumber: retryContext.retryCount });
        if (!retryPolicies) {
            retryPolicies = {
                endpointDiscoveryRetryPolicy: new EndpointDiscoveryRetryPolicy(requestContext.globalEndpointManager, requestContext.operationType),
                resourceThrottleRetryPolicy: new ResourceThrottleRetryPolicy(requestContext.connectionPolicy.retryOptions.maxRetryAttemptCount, requestContext.connectionPolicy.retryOptions.fixedRetryIntervalInMilliseconds, requestContext.connectionPolicy.retryOptions.maxWaitTimeInSeconds),
                sessionReadRetryPolicy: new SessionRetryPolicy(requestContext.globalEndpointManager, requestContext.resourceType, requestContext.operationType, requestContext.connectionPolicy),
                defaultRetryPolicy: new DefaultRetryPolicy(requestContext.operationType),
                timeoutFailoverRetryPolicy: new TimeoutFailoverRetryPolicy(requestContext.globalEndpointManager, requestContext.headers, requestContext.method, requestContext.resourceType, requestContext.operationType, requestContext.connectionPolicy.enableEndpointDiscovery),
            };
        }
        if (retryContext && retryContext.clearSessionTokenNotAvailable) {
            requestContext.client.clearSessionToken(requestContext.path);
            delete requestContext.headers["x-ms-session-token"];
        }
        if (retryContext && retryContext.retryLocationServerIndex) {
            requestContext.endpoint = await requestContext.globalEndpointManager.resolveServiceEndpoint(localDiagnosticNode, requestContext.resourceType, requestContext.operationType, retryContext.retryLocationServerIndex);
        }
        else {
            requestContext.endpoint = await requestContext.globalEndpointManager.resolveServiceEndpoint(localDiagnosticNode, requestContext.resourceType, requestContext.operationType);
        }
        const startTimeUTCInMs = getCurrentTimestampInMs();
        try {
            const response = await executeRequest(localDiagnosticNode, requestContext);
            response.headers[Constants$1.ThrottleRetryCount] =
                retryPolicies.resourceThrottleRetryPolicy.currentRetryAttemptCount;
            response.headers[Constants$1.ThrottleRetryWaitTimeInMs] =
                retryPolicies.resourceThrottleRetryPolicy.cummulativeWaitTimeinMs;
            return response;
        }
        catch (err) {
            // TODO: any error
            let retryPolicy = null;
            const headers = err.headers || {};
            if (err.code === StatusCodes.ENOTFOUND ||
                err.code === "REQUEST_SEND_ERROR" ||
                (err.code === StatusCodes.Forbidden &&
                    (err.substatus === SubStatusCodes.DatabaseAccountNotFound ||
                        err.substatus === SubStatusCodes.WriteForbidden))) {
                retryPolicy = retryPolicies.endpointDiscoveryRetryPolicy;
            }
            else if (err.code === StatusCodes.TooManyRequests) {
                retryPolicy = retryPolicies.resourceThrottleRetryPolicy;
            }
            else if (err.code === StatusCodes.NotFound &&
                err.substatus === SubStatusCodes.ReadSessionNotAvailable) {
                retryPolicy = retryPolicies.sessionReadRetryPolicy;
            }
            else if (err.code === StatusCodes.ServiceUnavailable || err.code === TimeoutErrorCode) {
                retryPolicy = retryPolicies.timeoutFailoverRetryPolicy;
            }
            else {
                retryPolicy = retryPolicies.defaultRetryPolicy;
            }
            const results = await retryPolicy.shouldRetry(err, localDiagnosticNode, retryContext, requestContext.endpoint);
            if (!results) {
                headers[Constants$1.ThrottleRetryCount] =
                    retryPolicies.resourceThrottleRetryPolicy.currentRetryAttemptCount;
                headers[Constants$1.ThrottleRetryWaitTimeInMs] =
                    retryPolicies.resourceThrottleRetryPolicy.cummulativeWaitTimeinMs;
                err.headers = Object.assign(Object.assign({}, err.headers), headers);
                throw err;
            }
            else {
                requestContext.retryCount++;
                const newUrl = results[1]; // TODO: any hack
                if (newUrl !== undefined) {
                    requestContext.endpoint = newUrl;
                }
                localDiagnosticNode.recordFailedNetworkCall(startTimeUTCInMs, requestContext, retryContext.retryCount, err.code, err.subsstatusCode, headers);
                await sleep(retryPolicy.retryAfterInMs);
                return execute({
                    diagnosticNode,
                    executeRequest,
                    requestContext,
                    retryContext,
                    retryPolicies,
                });
            }
        }
    }, diagnosticNode, exports.DiagnosticNodeType.HTTP_REQUEST);
}

/**
 * @hidden
 */
let defaultHttpsAgent;
const https = require("https"); // eslint-disable-line @typescript-eslint/no-require-imports
const tls = require("tls"); // eslint-disable-line @typescript-eslint/no-require-imports
// minVersion only available in Node 10+
if (tls.DEFAULT_MIN_VERSION) {
    defaultHttpsAgent = new https.Agent({
        keepAlive: true,
        minVersion: "TLSv1.2",
    });
}
else {
    // Remove when Node 8 support has been dropped
    defaultHttpsAgent = new https.Agent({
        keepAlive: true,
        secureProtocol: "TLSv1_2_method",
    });
}
const http = require("http"); // eslint-disable-line @typescript-eslint/no-require-imports
/**
 * @internal
 */
const defaultHttpAgent = new http.Agent({
    keepAlive: true,
});

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
let cachedHttpClient;
function getCachedDefaultHttpClient() {
    if (!cachedHttpClient) {
        cachedHttpClient = coreRestPipeline.createDefaultHttpClient();
    }
    return cachedHttpClient;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const logger$1 = logger$5.createClientLogger("RequestHandler");
async function executeRequest(diagnosticNode, requestContext) {
    return executePlugins(diagnosticNode, requestContext, httpRequest, exports.PluginOn.request);
}
/**
 * @hidden
 */
async function httpRequest(requestContext, diagnosticNode) {
    const controller = new nodeAbortController.AbortController();
    const signal = controller.signal;
    // Wrap users passed abort events and call our own internal abort()
    const userSignal = requestContext.options && requestContext.options.abortSignal;
    if (userSignal) {
        if (userSignal.aborted) {
            controller.abort();
        }
        else {
            userSignal.addEventListener("abort", () => {
                controller.abort();
            });
        }
    }
    const timeout = setTimeout(() => {
        controller.abort();
    }, requestContext.connectionPolicy.requestTimeout);
    let response;
    if (requestContext.body) {
        requestContext.body = bodyFromData(requestContext.body);
    }
    const httpsClient = getCachedDefaultHttpClient();
    const url = prepareURL(requestContext.endpoint, requestContext.path);
    const reqHeaders = coreRestPipeline.createHttpHeaders(requestContext.headers);
    const pipelineRequest = coreRestPipeline.createPipelineRequest({
        url,
        headers: reqHeaders,
        method: requestContext.method,
        abortSignal: signal,
        body: requestContext.body,
    });
    if (requestContext.requestAgent) {
        pipelineRequest.agent = requestContext.requestAgent;
    }
    else {
        const parsedUrl = new URL(url);
        pipelineRequest.agent = parsedUrl.protocol === "http" ? defaultHttpAgent : defaultHttpsAgent;
    }
    const startTimeUTCInMs = getCurrentTimestampInMs();
    try {
        if (requestContext.pipeline) {
            response = await requestContext.pipeline.sendRequest(httpsClient, pipelineRequest);
        }
        else {
            response = await httpsClient.sendRequest(pipelineRequest);
        }
    }
    catch (error) {
        if (error.name === "AbortError") {
            // If the user passed signal caused the abort, cancel the timeout and rethrow the error
            if (userSignal && userSignal.aborted === true) {
                clearTimeout(timeout);
                throw error;
            }
            // If the user didn't cancel, it must be an abort we called due to timeout
            throw new TimeoutError(`Timeout Error! Request took more than ${requestContext.connectionPolicy.requestTimeout} ms`);
        }
        throw error;
    }
    clearTimeout(timeout);
    const result = response.status === 204 || response.status === 304 || response.bodyAsText === ""
        ? null
        : JSON.parse(response.bodyAsText);
    const responseHeaders = response.headers.toJSON();
    const substatus = responseHeaders[Constants$1.HttpHeaders.SubStatus]
        ? parseInt(responseHeaders[Constants$1.HttpHeaders.SubStatus], 10)
        : undefined;
    diagnosticNode.recordSuccessfulNetworkCall(startTimeUTCInMs, requestContext, response, substatus, url);
    if (response.status >= 400) {
        const errorResponse = new ErrorResponse(result.message);
        logger$1.warning(response.status +
            " " +
            requestContext.endpoint +
            " " +
            requestContext.path +
            " " +
            result.message);
        errorResponse.code = response.status;
        errorResponse.body = result;
        errorResponse.headers = responseHeaders;
        if (Constants$1.HttpHeaders.ActivityId in responseHeaders) {
            errorResponse.activityId = responseHeaders[Constants$1.HttpHeaders.ActivityId];
        }
        if (Constants$1.HttpHeaders.SubStatus in responseHeaders) {
            errorResponse.substatus = substatus;
        }
        if (Constants$1.HttpHeaders.RetryAfterInMs in responseHeaders) {
            errorResponse.retryAfterInMs = parseInt(responseHeaders[Constants$1.HttpHeaders.RetryAfterInMs], 10);
            Object.defineProperty(errorResponse, "retryAfterInMilliseconds", {
                get: () => {
                    return errorResponse.retryAfterInMs;
                },
            });
        }
        throw errorResponse;
    }
    return {
        headers: responseHeaders,
        result,
        code: response.status,
        substatus,
    };
}
/**
 * @hidden
 */
async function request(requestContext, diagnosticNode) {
    if (requestContext.body) {
        requestContext.body = bodyFromData(requestContext.body);
        if (!requestContext.body) {
            throw new Error("parameter data must be a javascript object, string, or Buffer");
        }
    }
    return addDignosticChild(async (childNode) => {
        return execute({
            diagnosticNode: childNode,
            requestContext,
            executeRequest,
        });
    }, diagnosticNode, exports.DiagnosticNodeType.REQUEST_ATTEMPTS);
}
const RequestHandler = {
    request,
};

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function atob(str) {
    return Buffer.from(str, "base64").toString("binary");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Models vector clock bases session token. Session token has the following format:
 * `{Version}#{GlobalLSN}#{RegionId1}={LocalLsn1}#{RegionId2}={LocalLsn2}....#{RegionIdN}={LocalLsnN}`
 * 'Version' captures the configuration number of the partition which returned this session token.
 * 'Version' is incremented everytime topology of the partition is updated (say due to Add/Remove/Failover).
 *
 * The choice of separators '#' and '=' is important. Separators ';' and ',' are used to delimit
 * per-partitionKeyRange session token
 * @hidden
 *
 */
class VectorSessionToken {
    constructor(version, globalLsn, localLsnByregion, sessionToken) {
        this.version = version;
        this.globalLsn = globalLsn;
        this.localLsnByregion = localLsnByregion;
        this.sessionToken = sessionToken;
        if (!this.sessionToken) {
            const regionAndLocalLsn = [];
            for (const [key, value] of this.localLsnByregion.entries()) {
                regionAndLocalLsn.push(`${key}${VectorSessionToken.REGION_PROGRESS_SEPARATOR}${value}`);
            }
            const regionProgress = regionAndLocalLsn.join(VectorSessionToken.SEGMENT_SEPARATOR);
            if (regionProgress === "") {
                this.sessionToken = `${this.version}${VectorSessionToken.SEGMENT_SEPARATOR}${this.globalLsn}`;
            }
            else {
                this.sessionToken = `${this.version}${VectorSessionToken.SEGMENT_SEPARATOR}${this.globalLsn}${VectorSessionToken.SEGMENT_SEPARATOR}${regionProgress}`;
            }
        }
    }
    static create(sessionToken) {
        const [versionStr, globalLsnStr, ...regionSegments] = sessionToken.split(VectorSessionToken.SEGMENT_SEPARATOR);
        const version = parseInt(versionStr, 10);
        const globalLsn = parseFloat(globalLsnStr);
        if (typeof version !== "number" || typeof globalLsn !== "number") {
            return null;
        }
        const lsnByRegion = new Map();
        for (const regionSegment of regionSegments) {
            const [regionIdStr, localLsnStr] = regionSegment.split(VectorSessionToken.REGION_PROGRESS_SEPARATOR);
            if (!regionIdStr || !localLsnStr) {
                return null;
            }
            const regionId = parseInt(regionIdStr, 10);
            let localLsn;
            try {
                localLsn = localLsnStr;
            }
            catch (err) {
                // TODO: log error
                return null;
            }
            if (typeof regionId !== "number") {
                return null;
            }
            lsnByRegion.set(regionId, localLsn);
        }
        return new VectorSessionToken(version, globalLsn, lsnByRegion, sessionToken);
    }
    equals(other) {
        return !other
            ? false
            : this.version === other.version &&
                this.globalLsn === other.globalLsn &&
                this.areRegionProgressEqual(other.localLsnByregion);
    }
    merge(other) {
        if (other == null) {
            throw new Error("other (Vector Session Token) must not be null");
        }
        if (this.version === other.version &&
            this.localLsnByregion.size !== other.localLsnByregion.size) {
            throw new Error(`Compared session tokens ${this.sessionToken} and ${other.sessionToken} have unexpected regions`);
        }
        const [higherVersionSessionToken, lowerVersionSessionToken] = this.version < other.version ? [other, this] : [this, other];
        const highestLocalLsnByRegion = new Map();
        for (const [regionId, highLocalLsn] of higherVersionSessionToken.localLsnByregion.entries()) {
            const lowLocalLsn = lowerVersionSessionToken.localLsnByregion.get(regionId);
            if (lowLocalLsn) {
                highestLocalLsnByRegion.set(regionId, max(highLocalLsn, lowLocalLsn));
            }
            else if (this.version === other.version) {
                throw new Error(`Compared session tokens have unexpected regions. Session 1: ${this.sessionToken} - Session 2: ${this.sessionToken}`);
            }
            else {
                highestLocalLsnByRegion.set(regionId, highLocalLsn);
            }
        }
        return new VectorSessionToken(Math.max(this.version, other.version), Math.max(this.globalLsn, other.globalLsn), highestLocalLsnByRegion);
    }
    toString() {
        return this.sessionToken;
    }
    areRegionProgressEqual(other) {
        if (this.localLsnByregion.size !== other.size) {
            return false;
        }
        for (const [regionId, localLsn] of this.localLsnByregion.entries()) {
            const otherLocalLsn = other.get(regionId);
            if (localLsn !== otherLocalLsn) {
                return false;
            }
        }
        return true;
    }
}
VectorSessionToken.SEGMENT_SEPARATOR = "#";
VectorSessionToken.REGION_PROGRESS_SEPARATOR = "=";
/**
 * @hidden
 */
function max(int1, int2) {
    // NOTE: This only works for positive numbers
    if (int1.length === int2.length) {
        return int1 > int2 ? int1 : int2;
    }
    else if (int1.length > int2.length) {
        return int1;
    }
    else {
        return int2;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/** @hidden */
class SessionContainer {
    constructor(collectionNameToCollectionResourceId = new Map(), collectionResourceIdToSessionTokens = new Map()) {
        this.collectionNameToCollectionResourceId = collectionNameToCollectionResourceId;
        this.collectionResourceIdToSessionTokens = collectionResourceIdToSessionTokens;
    }
    get(request) {
        if (!request) {
            throw new Error("request cannot be null");
        }
        const collectionName = getContainerLink(trimSlashes(request.resourceAddress));
        const rangeIdToTokenMap = this.getPartitionKeyRangeIdToTokenMap(collectionName);
        return SessionContainer.getCombinedSessionTokenString(rangeIdToTokenMap);
    }
    remove(request) {
        let collectionResourceId;
        const resourceAddress = trimSlashes(request.resourceAddress);
        const collectionName = getContainerLink(resourceAddress);
        if (collectionName) {
            collectionResourceId = this.collectionNameToCollectionResourceId.get(collectionName);
            this.collectionNameToCollectionResourceId.delete(collectionName);
        }
        if (collectionResourceId !== undefined) {
            this.collectionResourceIdToSessionTokens.delete(collectionResourceId);
        }
    }
    set(request, resHeaders) {
        // TODO: we check the master logic a few different places. Might not need it.
        if (!resHeaders ||
            SessionContainer.isReadingFromMaster(request.resourceType, request.operationType)) {
            return;
        }
        const sessionTokenString = resHeaders[Constants$1.HttpHeaders.SessionToken];
        if (!sessionTokenString) {
            return;
        }
        const containerName = this.getContainerName(request, resHeaders);
        const ownerId = !request.isNameBased
            ? request.resourceId
            : resHeaders[Constants$1.HttpHeaders.OwnerId] || request.resourceId;
        if (!ownerId) {
            return;
        }
        if (containerName && this.validateOwnerID(ownerId)) {
            if (!this.collectionResourceIdToSessionTokens.has(ownerId)) {
                this.collectionResourceIdToSessionTokens.set(ownerId, new Map());
            }
            if (!this.collectionNameToCollectionResourceId.has(containerName)) {
                this.collectionNameToCollectionResourceId.set(containerName, ownerId);
            }
            const containerSessionContainer = this.collectionResourceIdToSessionTokens.get(ownerId);
            SessionContainer.compareAndSetToken(sessionTokenString, containerSessionContainer);
        }
    }
    validateOwnerID(ownerId) {
        // If ownerId contains exactly 8 bytes it represents a unique database+collection identifier. Otherwise it represents another resource
        // The first 4 bytes are the database. The last 4 bytes are the collection.
        // Cosmos rids potentially contain "-" which is an invalid character in the browser atob implementation
        // See https://en.wikipedia.org/wiki/Base64#Filenames
        return atob(ownerId.replace(/-/g, "/")).length === 8;
    }
    getPartitionKeyRangeIdToTokenMap(collectionName) {
        let rangeIdToTokenMap = null;
        if (collectionName && this.collectionNameToCollectionResourceId.has(collectionName)) {
            rangeIdToTokenMap = this.collectionResourceIdToSessionTokens.get(this.collectionNameToCollectionResourceId.get(collectionName));
        }
        return rangeIdToTokenMap;
    }
    static getCombinedSessionTokenString(tokens) {
        if (!tokens || tokens.size === 0) {
            return SessionContainer.EMPTY_SESSION_TOKEN;
        }
        let result = "";
        for (const [range, token] of tokens.entries()) {
            result +=
                range +
                    SessionContainer.SESSION_TOKEN_PARTITION_SPLITTER +
                    token.toString() +
                    SessionContainer.SESSION_TOKEN_SEPARATOR;
        }
        return result.slice(0, -1);
    }
    static compareAndSetToken(newTokenString, containerSessionTokens) {
        if (!newTokenString) {
            return;
        }
        const partitionsParts = newTokenString.split(SessionContainer.SESSION_TOKEN_SEPARATOR);
        for (const partitionPart of partitionsParts) {
            const newTokenParts = partitionPart.split(SessionContainer.SESSION_TOKEN_PARTITION_SPLITTER);
            if (newTokenParts.length !== 2) {
                return;
            }
            const range = newTokenParts[0];
            const newToken = VectorSessionToken.create(newTokenParts[1]);
            const tokenForRange = !containerSessionTokens.get(range)
                ? newToken
                : containerSessionTokens.get(range).merge(newToken);
            containerSessionTokens.set(range, tokenForRange);
        }
    }
    // TODO: have a assert if the type doesn't mastch known types
    static isReadingFromMaster(resourceType, operationType) {
        if (resourceType === Constants$1.Path.OffersPathSegment ||
            resourceType === Constants$1.Path.DatabasesPathSegment ||
            resourceType === Constants$1.Path.UsersPathSegment ||
            resourceType === Constants$1.Path.PermissionsPathSegment ||
            resourceType === Constants$1.Path.TopologyPathSegment ||
            resourceType === Constants$1.Path.DatabaseAccountPathSegment ||
            resourceType === Constants$1.Path.PartitionKeyRangesPathSegment ||
            (resourceType === Constants$1.Path.CollectionsPathSegment &&
                operationType === exports.OperationType.Query)) {
            return true;
        }
        return false;
    }
    getContainerName(request, headers) {
        let ownerFullName = headers[Constants$1.HttpHeaders.OwnerFullName];
        if (!ownerFullName) {
            ownerFullName = trimSlashes(request.resourceAddress);
        }
        return getContainerLink(ownerFullName);
    }
}
SessionContainer.EMPTY_SESSION_TOKEN = "";
SessionContainer.SESSION_TOKEN_SEPARATOR = ",";
SessionContainer.SESSION_TOKEN_PARTITION_SPLITTER = ":";

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function checkURL(testString) {
    return new URL(testString);
}
function sanitizeEndpoint(url) {
    return new URL(url).href.replace(/\/$/, "");
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function supportedQueryFeaturesBuilder(disableNonStreamingOrderByQuery) {
    if (disableNonStreamingOrderByQuery) {
        return Object.keys(QueryFeature)
            .filter((k) => k !== QueryFeature.NonStreamingOrderBy)
            .join(", ");
    }
    else {
        return Object.keys(QueryFeature).join(", ");
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Implementation of DiagnosticWriter, which uses \@azure/logger to write
 * diagnostics.
 * @hidden
 */
class LogDiagnosticWriter {
    constructor() {
        this.logger = logger$5.createClientLogger("CosmosDBDiagnostics");
    }
    async write(diagnosticsData) {
        this.logger.verbose(diagnosticsData);
    }
}
/**
 * Implementation of a no-op DiagnosticWriter.
 * @hidden
 */
class NoOpDiagnosticWriter {
    async write(_diagnosticsData) {
        // No op
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class DefaultDiagnosticFormatter {
    format(cosmosDiagnostic) {
        return JSON.stringify(cosmosDiagnostic);
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const uuid = uuid$3.v4;
const logger = logger$5.createClientLogger("ClientContext");
const QueryJsonContentType = "application/query+json";
const HttpHeaders = Constants$1.HttpHeaders;
/**
 * @hidden
 * @hidden
 */
class ClientContext {
    constructor(cosmosClientOptions, globalEndpointManager, clientConfig, diagnosticLevel) {
        this.cosmosClientOptions = cosmosClientOptions;
        this.globalEndpointManager = globalEndpointManager;
        this.clientConfig = clientConfig;
        this.diagnosticLevel = diagnosticLevel;
        this.connectionPolicy = cosmosClientOptions.connectionPolicy;
        this.sessionContainer = new SessionContainer();
        this.partitionKeyDefinitionCache = {};
        this.pipeline = null;
        if (cosmosClientOptions.aadCredentials) {
            this.pipeline = coreRestPipeline.createEmptyPipeline();
            const hrefEndpoint = sanitizeEndpoint(cosmosClientOptions.endpoint);
            const scope = `${hrefEndpoint}/.default`;
            this.pipeline.addPolicy(coreRestPipeline.bearerTokenAuthenticationPolicy({
                credential: cosmosClientOptions.aadCredentials,
                scopes: scope,
                challengeCallbacks: {
                    async authorizeRequest({ request, getAccessToken }) {
                        const tokenResponse = await getAccessToken([scope], {});
                        const AUTH_PREFIX = `type=aad&ver=1.0&sig=`;
                        const authorizationToken = `${AUTH_PREFIX}${tokenResponse.token}`;
                        request.headers.set("Authorization", authorizationToken);
                    },
                },
            }));
        }
        this.initializeDiagnosticSettings(diagnosticLevel);
    }
    /** @hidden */
    async read({ path, resourceType, resourceId, options = {}, partitionKey, diagnosticNode, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.get, path, operationType: exports.OperationType.Read, resourceId,
                options,
                resourceType,
                partitionKey });
            diagnosticNode.addData({
                operationType: exports.OperationType.Read,
                resourceType,
            });
            request.headers = await this.buildHeaders(request);
            this.applySessionToken(request);
            // read will use ReadEndpoint since it uses GET operation
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            this.captureSessionToken(undefined, path, exports.OperationType.Read, response.headers);
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    async queryFeed({ path, resourceType, resourceId, resultFn, query, options, diagnosticNode, partitionKeyRangeId, partitionKey, startEpk, endEpk, }) {
        // Query operations will use ReadEndpoint even though it uses
        // GET(for queryFeed) and POST(for regular query operations)
        const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.get, path, operationType: exports.OperationType.Query, partitionKeyRangeId,
            resourceId,
            resourceType,
            options, body: query, partitionKey });
        diagnosticNode.addData({
            operationType: exports.OperationType.Query,
            resourceType,
        });
        const requestId = uuid();
        if (query !== undefined) {
            request.method = exports.HTTPMethod.post;
        }
        request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
        request.headers = await this.buildHeaders(request);
        if (startEpk !== undefined && endEpk !== undefined) {
            request.headers[HttpHeaders.StartEpk] = startEpk;
            request.headers[HttpHeaders.EndEpk] = endEpk;
            request.headers[HttpHeaders.ReadFeedKeyType] = "EffectivePartitionKeyRange";
        }
        if (query !== undefined) {
            request.headers[HttpHeaders.IsQuery] = "true";
            request.headers[HttpHeaders.ContentType] = QueryJsonContentType;
            if (typeof query === "string") {
                request.body = { query }; // Converts query text to query object.
            }
        }
        this.applySessionToken(request);
        logger.info("query " +
            requestId +
            " started" +
            (request.partitionKeyRangeId ? " pkrid: " + request.partitionKeyRangeId : ""));
        logger.verbose(request);
        const start = Date.now();
        const response = await RequestHandler.request(request, diagnosticNode);
        logger.info("query " + requestId + " finished - " + (Date.now() - start) + "ms");
        this.captureSessionToken(undefined, path, exports.OperationType.Query, response.headers);
        return this.processQueryFeedResponse(response, !!query, resultFn);
    }
    async getQueryPlan(path, resourceType, resourceId, query, options = {}, diagnosticNode) {
        const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.post, path, operationType: exports.OperationType.Read, resourceId,
            resourceType,
            options, body: query });
        diagnosticNode.addData({
            operationType: exports.OperationType.Read,
            resourceType,
        });
        request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
        request.headers = await this.buildHeaders(request);
        request.headers[HttpHeaders.IsQueryPlan] = "True";
        request.headers[HttpHeaders.QueryVersion] = "1.4";
        request.headers[HttpHeaders.ContentType] = QueryJsonContentType;
        request.headers[HttpHeaders.SupportedQueryFeatures] = supportedQueryFeaturesBuilder(options.disableNonStreamingOrderByQuery);
        if (typeof query === "string") {
            request.body = { query }; // Converts query text to query object.
        }
        this.applySessionToken(request);
        const response = await RequestHandler.request(request, diagnosticNode);
        this.captureSessionToken(undefined, path, exports.OperationType.Query, response.headers);
        return response;
    }
    queryPartitionKeyRanges(collectionLink, query, options) {
        const path = getPathFromLink(collectionLink, exports.ResourceType.pkranges);
        const id = getIdFromLink(collectionLink);
        const cb = async (diagNode, innerOptions) => {
            const response = await this.queryFeed({
                path,
                resourceType: exports.ResourceType.pkranges,
                resourceId: id,
                resultFn: (result) => result.PartitionKeyRanges,
                query,
                options: innerOptions,
                diagnosticNode: diagNode,
            });
            return response;
        };
        return new QueryIterator(this, query, options, cb);
    }
    async delete({ path, resourceType, resourceId, options = {}, partitionKey, method = exports.HTTPMethod.delete, diagnosticNode, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: method, operationType: exports.OperationType.Delete, path,
                resourceType,
                options,
                resourceId,
                partitionKey });
            diagnosticNode.addData({
                operationType: exports.OperationType.Delete,
                resourceType,
            });
            request.headers = await this.buildHeaders(request);
            this.applySessionToken(request);
            // deleteResource will use WriteEndpoint since it uses DELETE operation
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            if (parseLink(path).type !== "colls") {
                this.captureSessionToken(undefined, path, exports.OperationType.Delete, response.headers);
            }
            else {
                this.clearSessionToken(path);
            }
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    async patch({ body, path, resourceType, resourceId, options = {}, partitionKey, diagnosticNode, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.patch, operationType: exports.OperationType.Patch, path,
                resourceType,
                body,
                resourceId,
                options,
                partitionKey });
            diagnosticNode.addData({
                operationType: exports.OperationType.Patch,
                resourceType,
            });
            request.headers = await this.buildHeaders(request);
            this.applySessionToken(request);
            // patch will use WriteEndpoint
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            this.captureSessionToken(undefined, path, exports.OperationType.Patch, response.headers);
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    async create({ body, path, resourceType, resourceId, diagnosticNode, options = {}, partitionKey, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.post, operationType: exports.OperationType.Create, path,
                resourceType,
                resourceId,
                body,
                options,
                partitionKey });
            diagnosticNode.addData({
                operationType: exports.OperationType.Create,
                resourceType,
            });
            request.headers = await this.buildHeaders(request);
            // create will use WriteEndpoint since it uses POST operation
            this.applySessionToken(request);
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            this.captureSessionToken(undefined, path, exports.OperationType.Create, response.headers);
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    processQueryFeedResponse(res, isQuery, resultFn) {
        if (isQuery) {
            return {
                result: resultFn(res.result),
                headers: res.headers,
                code: res.code,
            };
        }
        else {
            const newResult = resultFn(res.result).map((body) => body);
            return {
                result: newResult,
                headers: res.headers,
                code: res.code,
            };
        }
    }
    applySessionToken(requestContext) {
        const request = this.getSessionParams(requestContext.path);
        if (requestContext.headers && requestContext.headers[HttpHeaders.SessionToken]) {
            return;
        }
        const sessionConsistency = requestContext.headers[HttpHeaders.ConsistencyLevel];
        if (!sessionConsistency) {
            return;
        }
        if (sessionConsistency !== exports.ConsistencyLevel.Session) {
            return;
        }
        if (request.resourceAddress) {
            const sessionToken = this.sessionContainer.get(request);
            if (sessionToken) {
                requestContext.headers[HttpHeaders.SessionToken] = sessionToken;
            }
        }
    }
    async replace({ body, path, resourceType, resourceId, options = {}, partitionKey, diagnosticNode, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.put, operationType: exports.OperationType.Replace, path,
                resourceType,
                body,
                resourceId,
                options,
                partitionKey });
            diagnosticNode.addData({
                operationType: exports.OperationType.Replace,
                resourceType,
            });
            request.headers = await this.buildHeaders(request);
            this.applySessionToken(request);
            // replace will use WriteEndpoint since it uses PUT operation
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            this.captureSessionToken(undefined, path, exports.OperationType.Replace, response.headers);
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    async upsert({ body, path, resourceType, resourceId, options = {}, partitionKey, diagnosticNode, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.post, operationType: exports.OperationType.Upsert, path,
                resourceType,
                body,
                resourceId,
                options,
                partitionKey });
            diagnosticNode.addData({
                operationType: exports.OperationType.Upsert,
                resourceType,
            });
            request.headers = await this.buildHeaders(request);
            request.headers[HttpHeaders.IsUpsert] = true;
            this.applySessionToken(request);
            // upsert will use WriteEndpoint since it uses POST operation
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            this.captureSessionToken(undefined, path, exports.OperationType.Upsert, response.headers);
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    async execute({ sprocLink, params, options = {}, partitionKey, diagnosticNode, }) {
        // Accept a single parameter or an array of parameters.
        // Didn't add type annotation for this because we should legacy this behavior
        if (params !== null && params !== undefined && !Array.isArray(params)) {
            params = [params];
        }
        const path = getPathFromLink(sprocLink);
        const id = getIdFromLink(sprocLink);
        const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.post, operationType: exports.OperationType.Execute, path, resourceType: exports.ResourceType.sproc, options, resourceId: id, body: params, partitionKey });
        diagnosticNode.addData({
            operationType: exports.OperationType.Execute,
            resourceType: exports.ResourceType.sproc,
        });
        request.headers = await this.buildHeaders(request);
        // executeStoredProcedure will use WriteEndpoint since it uses POST operation
        request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
        const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
        return response;
    }
    /**
     * Gets the Database account information.
     * @param options - `urlConnection` in the options is the endpoint url whose database account needs to be retrieved.
     * If not present, current client's url will be used.
     */
    async getDatabaseAccount(diagnosticNode, options = {}) {
        const endpoint = options.urlConnection || this.cosmosClientOptions.endpoint;
        const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { endpoint, method: exports.HTTPMethod.get, operationType: exports.OperationType.Read, path: "", resourceType: exports.ResourceType.none, options });
        diagnosticNode.addData({
            operationType: exports.OperationType.Read,
            resourceType: exports.ResourceType.none,
        });
        request.headers = await this.buildHeaders(request);
        // await options.beforeOperation({ endpoint, request, headers: requestHeaders });
        const { result, headers, code, substatus, diagnostics } = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
        const databaseAccount = new DatabaseAccount(result, headers);
        return {
            result: databaseAccount,
            headers,
            diagnostics,
            code: code,
            substatus: substatus,
        };
    }
    getWriteEndpoint(diagnosticNode) {
        return this.globalEndpointManager.getWriteEndpoint(diagnosticNode);
    }
    getReadEndpoint(diagnosticNode) {
        return this.globalEndpointManager.getReadEndpoint(diagnosticNode);
    }
    getWriteEndpoints() {
        return this.globalEndpointManager.getWriteEndpoints();
    }
    getReadEndpoints() {
        return this.globalEndpointManager.getReadEndpoints();
    }
    async batch({ body, path, partitionKey, resourceId, options = {}, diagnosticNode, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.post, operationType: exports.OperationType.Batch, path,
                body, resourceType: exports.ResourceType.item, resourceId,
                options,
                partitionKey });
            diagnosticNode.addData({
                operationType: exports.OperationType.Batch,
                resourceType: exports.ResourceType.item,
            });
            request.headers = await this.buildHeaders(request);
            request.headers[HttpHeaders.IsBatchRequest] = true;
            request.headers[HttpHeaders.IsBatchAtomic] = true;
            this.applySessionToken(request);
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            this.captureSessionToken(undefined, path, exports.OperationType.Batch, response.headers);
            response.diagnostics = diagnosticNode.toDiagnostic(this.getClientConfig());
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    async bulk({ body, path, partitionKeyRangeId, resourceId, bulkOptions = {}, options = {}, diagnosticNode, }) {
        try {
            const request = Object.assign(Object.assign({}, this.getContextDerivedPropsForRequestCreation()), { method: exports.HTTPMethod.post, operationType: exports.OperationType.Batch, path,
                body, resourceType: exports.ResourceType.item, resourceId,
                options });
            diagnosticNode.addData({
                operationType: exports.OperationType.Batch,
                resourceType: exports.ResourceType.item,
            });
            request.headers = await this.buildHeaders(request);
            request.headers[HttpHeaders.IsBatchRequest] = true;
            request.headers[HttpHeaders.PartitionKeyRangeID] = partitionKeyRangeId;
            request.headers[HttpHeaders.IsBatchAtomic] = false;
            request.headers[HttpHeaders.BatchContinueOnError] = bulkOptions.continueOnError || false;
            this.applySessionToken(request);
            request.endpoint = await this.globalEndpointManager.resolveServiceEndpoint(diagnosticNode, request.resourceType, request.operationType);
            const response = await executePlugins(diagnosticNode, request, RequestHandler.request, exports.PluginOn.operation);
            this.captureSessionToken(undefined, path, exports.OperationType.Batch, response.headers);
            return response;
        }
        catch (err) {
            this.captureSessionToken(err, path, exports.OperationType.Upsert, err.headers);
            throw err;
        }
    }
    captureSessionToken(err, path, operationType, resHeaders) {
        const request = this.getSessionParams(path);
        request.operationType = operationType;
        if (!err ||
            (!this.isMasterResource(request.resourceType) &&
                (err.code === StatusCodes.PreconditionFailed ||
                    err.code === StatusCodes.Conflict ||
                    (err.code === StatusCodes.NotFound &&
                        err.substatus !== SubStatusCodes.ReadSessionNotAvailable)))) {
            this.sessionContainer.set(request, resHeaders);
        }
    }
    clearSessionToken(path) {
        const request = this.getSessionParams(path);
        this.sessionContainer.remove(request);
    }
    recordDiagnostics(diagnostic) {
        const formatted = this.diagnosticFormatter.format(diagnostic);
        this.diagnosticWriter.write(formatted);
    }
    initializeDiagnosticSettings(diagnosticLevel) {
        this.diagnosticFormatter = new DefaultDiagnosticFormatter();
        switch (diagnosticLevel) {
            case exports.CosmosDbDiagnosticLevel.info:
                this.diagnosticWriter = new NoOpDiagnosticWriter();
                break;
            default:
                this.diagnosticWriter = new LogDiagnosticWriter();
        }
    }
    // TODO: move
    getSessionParams(resourceLink) {
        const resourceId = null;
        let resourceAddress = null;
        const parserOutput = parseLink(resourceLink);
        resourceAddress = parserOutput.objectBody.self;
        const resourceType = parserOutput.type;
        return {
            resourceId,
            resourceAddress,
            resourceType,
            isNameBased: true,
        };
    }
    isMasterResource(resourceType) {
        if (resourceType === Constants$1.Path.OffersPathSegment ||
            resourceType === Constants$1.Path.DatabasesPathSegment ||
            resourceType === Constants$1.Path.UsersPathSegment ||
            resourceType === Constants$1.Path.PermissionsPathSegment ||
            resourceType === Constants$1.Path.TopologyPathSegment ||
            resourceType === Constants$1.Path.DatabaseAccountPathSegment ||
            resourceType === Constants$1.Path.PartitionKeyRangesPathSegment ||
            resourceType === Constants$1.Path.CollectionsPathSegment) {
            return true;
        }
        return false;
    }
    buildHeaders(requestContext) {
        return getHeaders({
            clientOptions: this.cosmosClientOptions,
            defaultHeaders: Object.assign(Object.assign({}, this.cosmosClientOptions.defaultHeaders), requestContext.options.initialHeaders),
            verb: requestContext.method,
            path: requestContext.path,
            resourceId: requestContext.resourceId,
            resourceType: requestContext.resourceType,
            options: requestContext.options,
            partitionKeyRangeId: requestContext.partitionKeyRangeId,
            useMultipleWriteLocations: this.connectionPolicy.useMultipleWriteLocations,
            partitionKey: requestContext.partitionKey !== undefined
                ? convertToInternalPartitionKey(requestContext.partitionKey)
                : undefined, // TODO: Move this check from here to PartitionKey
        });
    }
    /**
     * Returns collection of properties which are derived from the context for Request Creation.
     * These properties have client wide scope, as opposed to request specific scope.
     * @returns
     */
    getContextDerivedPropsForRequestCreation() {
        return {
            globalEndpointManager: this.globalEndpointManager,
            requestAgent: this.cosmosClientOptions.agent,
            connectionPolicy: this.connectionPolicy,
            client: this,
            plugins: this.cosmosClientOptions.plugins,
            pipeline: this.pipeline,
        };
    }
    getClientConfig() {
        return this.clientConfig;
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 */
function getUserAgent(suffix) {
    const ua = `${universalUserAgent.getUserAgent()} ${Constants$1.SDKName}/${Constants$1.SDKVersion}`;
    if (suffix) {
        return ua + " " + suffix;
    }
    return ua;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
function isNonEmptyString(variable) {
    return typeof variable === "string" && variable.trim().length > 0;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
const DefaultDiagnosticLevelValue = exports.CosmosDbDiagnosticLevel.info;
const diagnosticLevelFromEnv = (typeof process !== "undefined" &&
    process.env &&
    process.env[Constants$1.CosmosDbDiagnosticLevelEnvVarName]) ||
    undefined;
const acceptableDiagnosticLevelValues = Object.values(exports.CosmosDbDiagnosticLevel).map((x) => x.toString());
let cosmosDiagnosticLevel;
if (isNonEmptyString(diagnosticLevelFromEnv)) {
    // avoid calling setDiagnosticLevel because we don't want a mis-set environment variable to crash
    if (isCosmosDiagnosticLevel(diagnosticLevelFromEnv)) {
        setDiagnosticLevel(diagnosticLevelFromEnv);
    }
    else {
        console.error(`${Constants$1.CosmosDbDiagnosticLevelEnvVarName} set to unknown diagnostic level '${diagnosticLevelFromEnv}'; Setting Cosmos Db diagnostic level to info. Acceptable values: ${acceptableDiagnosticLevelValues.join(", ")}.`);
    }
}
function setDiagnosticLevel(level) {
    if (level && !isCosmosDiagnosticLevel(level)) {
        throw new Error(`Unknown diagnostic level '${level}'. Acceptable values: ${acceptableDiagnosticLevelValues.join(",")}`);
    }
    cosmosDiagnosticLevel = level;
}
function getDiagnosticLevelFromEnvironment() {
    return cosmosDiagnosticLevel;
}
function isCosmosDiagnosticLevel(diagnosticLevel) {
    return acceptableDiagnosticLevelValues.includes(diagnosticLevel);
}
function determineDiagnosticLevel(diagnosticLevelFromClientConfig, diagnosticLevelFromEnvironment) {
    const diagnosticLevelFromEnvOrClient = diagnosticLevelFromEnvironment !== null && diagnosticLevelFromEnvironment !== void 0 ? diagnosticLevelFromEnvironment : diagnosticLevelFromClientConfig; // Diagnostic Setting from environment gets first priority.
    return diagnosticLevelFromEnvOrClient !== null && diagnosticLevelFromEnvOrClient !== void 0 ? diagnosticLevelFromEnvOrClient : DefaultDiagnosticLevelValue; // Diagnostic Setting supplied in Client config gets second priority.
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * This internal class implements the logic for endpoint management for geo-replicated database accounts.
 */
class GlobalEndpointManager {
    /**
     * @param options - The document client instance.
     * @internal
     */
    constructor(options, readDatabaseAccount) {
        this.readDatabaseAccount = readDatabaseAccount;
        this.writeableLocations = [];
        this.readableLocations = [];
        this.unavailableReadableLocations = [];
        this.unavailableWriteableLocations = [];
        this.options = options;
        this.defaultEndpoint = options.endpoint;
        this.enableEndpointDiscovery = options.connectionPolicy.enableEndpointDiscovery;
        this.isRefreshing = false;
        this.preferredLocations = this.options.connectionPolicy.preferredLocations;
        this.preferredLocationsCount = this.preferredLocations ? this.preferredLocations.length : 0;
    }
    /**
     * Gets the current read endpoint from the endpoint cache.
     */
    async getReadEndpoint(diagnosticNode) {
        return this.resolveServiceEndpoint(diagnosticNode, exports.ResourceType.item, exports.OperationType.Read);
    }
    /**
     * Gets the current write endpoint from the endpoint cache.
     */
    async getWriteEndpoint(diagnosticNode) {
        return this.resolveServiceEndpoint(diagnosticNode, exports.ResourceType.item, exports.OperationType.Replace);
    }
    async getReadEndpoints() {
        return this.readableLocations.map((loc) => loc.databaseAccountEndpoint);
    }
    async getWriteEndpoints() {
        return this.writeableLocations.map((loc) => loc.databaseAccountEndpoint);
    }
    async markCurrentLocationUnavailableForRead(diagnosticNode, endpoint) {
        await this.refreshEndpointList(diagnosticNode);
        const location = this.readableLocations.find((loc) => loc.databaseAccountEndpoint === endpoint);
        if (location) {
            location.unavailable = true;
            location.lastUnavailabilityTimestampInMs = Date.now();
            this.unavailableReadableLocations.push(location);
        }
    }
    async markCurrentLocationUnavailableForWrite(diagnosticNode, endpoint) {
        await this.refreshEndpointList(diagnosticNode);
        const location = this.writeableLocations.find((loc) => loc.databaseAccountEndpoint === endpoint);
        if (location) {
            location.unavailable = true;
            location.lastUnavailabilityTimestampInMs = Date.now();
            this.unavailableWriteableLocations.push(location);
        }
    }
    canUseMultipleWriteLocations(resourceType, operationType) {
        let canUse = this.options.connectionPolicy.useMultipleWriteLocations;
        if (resourceType) {
            canUse =
                canUse &&
                    (resourceType === exports.ResourceType.item ||
                        (resourceType === exports.ResourceType.sproc && operationType === exports.OperationType.Execute));
        }
        return canUse;
    }
    async resolveServiceEndpoint(diagnosticNode, resourceType, operationType, startServiceEndpointIndex = 0) {
        // If endpoint discovery is disabled, always use the user provided endpoint
        if (!this.options.connectionPolicy.enableEndpointDiscovery) {
            diagnosticNode.addData({ readFromCache: true }, "default_endpoint");
            diagnosticNode.recordEndpointResolution(this.defaultEndpoint);
            return this.defaultEndpoint;
        }
        // If getting the database account, always use the user provided endpoint
        if (resourceType === exports.ResourceType.none) {
            diagnosticNode.addData({ readFromCache: true }, "none_resource");
            diagnosticNode.recordEndpointResolution(this.defaultEndpoint);
            return this.defaultEndpoint;
        }
        if (this.readableLocations.length === 0 || this.writeableLocations.length === 0) {
            const resourceResponse = await withMetadataDiagnostics(async (metadataNode) => {
                return this.readDatabaseAccount(metadataNode, {
                    urlConnection: this.defaultEndpoint,
                });
            }, diagnosticNode, exports.MetadataLookUpType.DatabaseAccountLookUp);
            this.writeableLocations = resourceResponse.resource.writableLocations;
            this.readableLocations = resourceResponse.resource.readableLocations;
        }
        const locations = isReadRequest(operationType)
            ? this.readableLocations
            : this.writeableLocations;
        let location;
        // If we have preferred locations, try each one in order and use the first available one
        if (this.preferredLocations &&
            this.preferredLocations.length > 0 &&
            startServiceEndpointIndex < this.preferredLocations.length) {
            for (let i = startServiceEndpointIndex; i < this.preferredLocations.length; i++) {
                const preferredLocation = this.preferredLocations[i];
                location = locations.find((loc) => loc.unavailable !== true &&
                    normalizeEndpoint(loc.name) === normalizeEndpoint(preferredLocation));
                if (location) {
                    break;
                }
            }
        }
        // If no preferred locations or one did not match, just grab the first one that is available
        if (!location) {
            const startIndexValid = startServiceEndpointIndex >= 0 && startServiceEndpointIndex < locations.length;
            const locationsToSearch = startIndexValid
                ? locations.slice(startServiceEndpointIndex)
                : locations;
            location = locationsToSearch.find((loc) => {
                return loc.unavailable !== true;
            });
        }
        location = location ? location : { name: "", databaseAccountEndpoint: this.defaultEndpoint };
        diagnosticNode.recordEndpointResolution(location.databaseAccountEndpoint);
        return location.databaseAccountEndpoint;
    }
    /**
     * Refreshes the endpoint list by clearning stale unavailability and then
     *  retrieving the writable and readable locations from the geo-replicated database account
     *  and then updating the locations cache.
     *  We skip the refreshing if enableEndpointDiscovery is set to False
     */
    async refreshEndpointList(diagnosticNode) {
        if (!this.isRefreshing && this.enableEndpointDiscovery) {
            this.isRefreshing = true;
            const databaseAccount = await this.getDatabaseAccountFromAnyEndpoint(diagnosticNode);
            if (databaseAccount) {
                this.refreshStaleUnavailableLocations();
                this.refreshEndpoints(databaseAccount);
            }
            this.isRefreshing = false;
        }
    }
    refreshEndpoints(databaseAccount) {
        for (const location of databaseAccount.writableLocations) {
            const existingLocation = this.writeableLocations.find((loc) => loc.name === location.name);
            if (!existingLocation) {
                this.writeableLocations.push(location);
            }
        }
        for (const location of databaseAccount.readableLocations) {
            const existingLocation = this.readableLocations.find((loc) => loc.name === location.name);
            if (!existingLocation) {
                this.readableLocations.push(location);
            }
        }
    }
    refreshStaleUnavailableLocations() {
        const now = Date.now();
        this.updateLocation(now, this.unavailableReadableLocations, this.readableLocations);
        this.unavailableReadableLocations = this.cleanUnavailableLocationList(now, this.unavailableReadableLocations);
        this.updateLocation(now, this.unavailableWriteableLocations, this.writeableLocations);
        this.unavailableWriteableLocations = this.cleanUnavailableLocationList(now, this.unavailableWriteableLocations);
    }
    /**
     * update the locationUnavailability to undefined if the location is available again
     * @param now - current time
     * @param unavailableLocations - list of unavailable locations
     * @param allLocations - list of all locations
     */
    updateLocation(now, unavailableLocations, allLocations) {
        for (const location of unavailableLocations) {
            const unavaialableLocation = allLocations.find((loc) => loc.name === location.name);
            if (unavaialableLocation &&
                now - unavaialableLocation.lastUnavailabilityTimestampInMs >
                    Constants$1.LocationUnavailableExpirationTimeInMs) {
                unavaialableLocation.unavailable = false;
            }
        }
    }
    cleanUnavailableLocationList(now, unavailableLocations) {
        return unavailableLocations.filter((loc) => {
            if (loc &&
                now - loc.lastUnavailabilityTimestampInMs >= Constants$1.LocationUnavailableExpirationTimeInMs) {
                return false;
            }
            return true;
        });
    }
    /**
     * Gets the database account first by using the default endpoint, and if that doesn't returns
     * use the endpoints for the preferred locations in the order they are specified to get
     * the database account.
     */
    async getDatabaseAccountFromAnyEndpoint(diagnosticNode) {
        try {
            const options = { urlConnection: this.defaultEndpoint };
            const { resource: databaseAccount } = await this.readDatabaseAccount(diagnosticNode, options);
            return databaseAccount;
            // If for any reason(non - globaldb related), we are not able to get the database
            // account from the above call to readDatabaseAccount,
            // we would try to get this information from any of the preferred locations that the user
            // might have specified (by creating a locational endpoint)
            // and keeping eating the exception until we get the database account and return None at the end,
            // if we are not able to get that info from any endpoints
        }
        catch (err) {
            // TODO: Tracing
        }
        if (this.preferredLocations) {
            for (const location of this.preferredLocations) {
                try {
                    const locationalEndpoint = GlobalEndpointManager.getLocationalEndpoint(this.defaultEndpoint, location);
                    const options = { urlConnection: locationalEndpoint };
                    const { resource: databaseAccount } = await this.readDatabaseAccount(diagnosticNode, options);
                    if (databaseAccount) {
                        return databaseAccount;
                    }
                }
                catch (err) {
                    // TODO: Tracing
                }
            }
        }
    }
    /**
     * Gets the locational endpoint using the location name passed to it using the default endpoint.
     *
     * @param defaultEndpoint - The default endpoint to use for the endpoint.
     * @param locationName    - The location name for the azure region like "East US".
     */
    static getLocationalEndpoint(defaultEndpoint, locationName) {
        // For defaultEndpoint like 'https://contoso.documents.azure.com:443/' parse it to generate URL format
        // This defaultEndpoint should be global endpoint(and cannot be a locational endpoint)
        // and we agreed to document that
        const endpointUrl = new URL(defaultEndpoint);
        // hostname attribute in endpointUrl will return 'contoso.documents.azure.com'
        if (endpointUrl.hostname) {
            const hostnameParts = endpointUrl.hostname.toString().toLowerCase().split(".");
            if (hostnameParts) {
                // globalDatabaseAccountName will return 'contoso'
                const globalDatabaseAccountName = hostnameParts[0];
                // Prepare the locationalDatabaseAccountName as contoso-EastUS for location_name 'East US'
                const locationalDatabaseAccountName = globalDatabaseAccountName + "-" + locationName.replace(" ", "");
                // Replace 'contoso' with 'contoso-EastUS' and
                // return locationalEndpoint as https://contoso-EastUS.documents.azure.com:443/
                const locationalEndpoint = defaultEndpoint
                    .toLowerCase()
                    .replace(globalDatabaseAccountName, locationalDatabaseAccountName);
                return locationalEndpoint;
            }
        }
        return null;
    }
}
function normalizeEndpoint(endpoint) {
    return endpoint.split(" ").join("").toLowerCase();
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Provides a client-side logical representation of the Azure Cosmos DB database account.
 * This client is used to configure and execute requests in the Azure Cosmos DB database service.
 * @example Instantiate a client and create a new database
 * ```typescript
 * const client = new CosmosClient({endpoint: "<URL HERE>", auth: {masterKey: "<KEY HERE>"}});
 * await client.databases.create({id: "<datbase name here>"});
 * ```
 * @example Instantiate a client with custom Connection Policy
 * ```typescript
 * const connectionPolicy = new ConnectionPolicy();
 * connectionPolicy.RequestTimeout = 10000;
 * const client = new CosmosClient({
 *    endpoint: "<URL HERE>",
 *    auth: {masterKey: "<KEY HERE>"},
 *    connectionPolicy
 * });
 * ```
 */
class CosmosClient {
    constructor(optionsOrConnectionString) {
        var _a, _b;
        if (typeof optionsOrConnectionString === "string") {
            optionsOrConnectionString = parseConnectionString(optionsOrConnectionString);
        }
        const endpoint = checkURL(optionsOrConnectionString.endpoint);
        if (!endpoint) {
            throw new Error("Invalid endpoint specified");
        }
        const clientConfig = this.initializeClientConfigDiagnostic(optionsOrConnectionString);
        optionsOrConnectionString.connectionPolicy = Object.assign({}, defaultConnectionPolicy, optionsOrConnectionString.connectionPolicy);
        optionsOrConnectionString.defaultHeaders = optionsOrConnectionString.defaultHeaders || {};
        optionsOrConnectionString.defaultHeaders[Constants$1.HttpHeaders.CacheControl] = "no-cache";
        optionsOrConnectionString.defaultHeaders[Constants$1.HttpHeaders.Version] =
            Constants$1.CurrentVersion;
        if (optionsOrConnectionString.consistencyLevel !== undefined) {
            optionsOrConnectionString.defaultHeaders[Constants$1.HttpHeaders.ConsistencyLevel] =
                optionsOrConnectionString.consistencyLevel;
        }
        optionsOrConnectionString.defaultHeaders[Constants$1.HttpHeaders.UserAgent] = getUserAgent(optionsOrConnectionString.userAgentSuffix);
        const globalEndpointManager = new GlobalEndpointManager(optionsOrConnectionString, async (diagnosticNode, opts) => this.getDatabaseAccountInternal(diagnosticNode, opts));
        this.clientContext = new ClientContext(optionsOrConnectionString, globalEndpointManager, clientConfig, determineDiagnosticLevel(optionsOrConnectionString.diagnosticLevel, getDiagnosticLevelFromEnvironment()));
        if (((_a = optionsOrConnectionString.connectionPolicy) === null || _a === void 0 ? void 0 : _a.enableEndpointDiscovery) &&
            ((_b = optionsOrConnectionString.connectionPolicy) === null || _b === void 0 ? void 0 : _b.enableBackgroundEndpointRefreshing)) {
            this.backgroundRefreshEndpointList(globalEndpointManager, optionsOrConnectionString.connectionPolicy.endpointRefreshRateInMs ||
                defaultConnectionPolicy.endpointRefreshRateInMs);
        }
        this.databases = new Databases(this, this.clientContext);
        this.offers = new Offers(this, this.clientContext);
    }
    initializeClientConfigDiagnostic(optionsOrConnectionString) {
        return {
            endpoint: optionsOrConnectionString.endpoint,
            resourceTokensConfigured: optionsOrConnectionString.resourceTokens !== undefined,
            tokenProviderConfigured: optionsOrConnectionString.tokenProvider !== undefined,
            aadCredentialsConfigured: optionsOrConnectionString.aadCredentials !== undefined,
            connectionPolicyConfigured: optionsOrConnectionString.connectionPolicy !== undefined,
            consistencyLevel: optionsOrConnectionString.consistencyLevel,
            defaultHeaders: optionsOrConnectionString.defaultHeaders,
            agentConfigured: optionsOrConnectionString.agent !== undefined,
            userAgentSuffix: optionsOrConnectionString.userAgentSuffix,
            diagnosticLevel: optionsOrConnectionString.diagnosticLevel,
            pluginsConfigured: optionsOrConnectionString.plugins !== undefined,
            sDKVersion: Constants$1.SDKVersion,
        };
    }
    /**
     * Get information about the current {@link DatabaseAccount} (including which regions are supported, etc.)
     */
    async getDatabaseAccount(options) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.getDatabaseAccountInternal(diagnosticNode, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async getDatabaseAccountInternal(diagnosticNode, options) {
        const response = await this.clientContext.getDatabaseAccount(diagnosticNode, options);
        return new ResourceResponse(response.result, response.headers, response.code, getEmptyCosmosDiagnostics(), response.substatus);
    }
    /**
     * Gets the currently used write endpoint url. Useful for troubleshooting purposes.
     *
     * The url may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
     */
    async getWriteEndpoint() {
        return withDiagnostics(async (diagnosticNode) => {
            return this.clientContext.getWriteEndpoint(diagnosticNode);
        }, this.clientContext);
    }
    /**
     * Gets the currently used read endpoint. Useful for troubleshooting purposes.
     *
     * The url may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
     */
    async getReadEndpoint() {
        return withDiagnostics(async (diagnosticNode) => {
            return this.clientContext.getReadEndpoint(diagnosticNode);
        }, this.clientContext);
    }
    /**
     * Gets the known write endpoints. Useful for troubleshooting purposes.
     *
     * The urls may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
     */
    getWriteEndpoints() {
        return this.clientContext.getWriteEndpoints();
    }
    /**
     * Gets the currently used read endpoint. Useful for troubleshooting purposes.
     *
     * The url may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
     */
    getReadEndpoints() {
        return this.clientContext.getReadEndpoints();
    }
    /**
     * Used for reading, updating, or deleting a existing database by id or accessing containers belonging to that database.
     *
     * This does not make a network call. Use `.read` to get info about the database after getting the {@link Database} object.
     *
     * @param id - The id of the database.
     * @example Create a new container off of an existing database
     * ```typescript
     * const container = client.database("<database id>").containers.create("<container id>");
     * ```
     *
     * @example Delete an existing database
     * ```typescript
     * await client.database("<id here>").delete();
     * ```
     */
    database(id) {
        return new Database(this, id, this.clientContext);
    }
    /**
     * Used for reading, or updating a existing offer by id.
     * @param id - The id of the offer.
     */
    offer(id) {
        return new Offer(this, id, this.clientContext);
    }
    /**
     * Clears background endpoint refresher. Use client.dispose() when destroying the CosmosClient within another process.
     */
    dispose() {
        clearTimeout(this.endpointRefresher);
    }
    async backgroundRefreshEndpointList(globalEndpointManager, refreshRate) {
        this.endpointRefresher = setInterval(() => {
            try {
                return withDiagnostics(async (diagnosticNode) => {
                    return globalEndpointManager.refreshEndpointList(diagnosticNode);
                }, this.clientContext, exports.DiagnosticNodeType.BACKGROUND_REFRESH_THREAD);
            }
            catch (e) {
                console.warn("Failed to refresh endpoints", e);
            }
        }, refreshRate);
        if (this.endpointRefresher.unref && typeof this.endpointRefresher.unref === "function") {
            this.endpointRefresher.unref();
        }
    }
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
class SasTokenProperties {
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/// <reference lib="dom"/>
function encodeUTF8(str) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * Experimental internal only
 * Generates the payload representing the permission configuration for the sas token.
 */
async function createAuthorizationSasToken(masterKey, sasTokenProperties) {
    let resourcePrefixPath = "";
    if (typeof sasTokenProperties.databaseName === "string" &&
        sasTokenProperties.databaseName !== "") {
        resourcePrefixPath += `/${Constants$1.Path.DatabasesPathSegment}/${sasTokenProperties.databaseName}`;
    }
    if (typeof sasTokenProperties.containerName === "string" &&
        sasTokenProperties.containerName !== "") {
        if (sasTokenProperties.databaseName === "") {
            throw new Error(`illegalArgumentException : ${sasTokenProperties.databaseName} \
                          is an invalid database name`);
        }
        resourcePrefixPath += `/${Constants$1.Path.CollectionsPathSegment}/${sasTokenProperties.containerName}`;
    }
    if (typeof sasTokenProperties.resourceName === "string" &&
        sasTokenProperties.resourceName !== "") {
        if (sasTokenProperties.containerName === "") {
            throw new Error(`illegalArgumentException : ${sasTokenProperties.containerName} \
                          is an invalid container name`);
        }
        switch (sasTokenProperties.resourceKind) {
            case "ITEM":
                resourcePrefixPath += `${Constants$1.Path.Root}${Constants$1.Path.DocumentsPathSegment}`;
                break;
            case "STORED_PROCEDURE":
                resourcePrefixPath += `${Constants$1.Path.Root}${Constants$1.Path.StoredProceduresPathSegment}`;
                break;
            case "USER_DEFINED_FUNCTION":
                resourcePrefixPath += `${Constants$1.Path.Root}${Constants$1.Path.UserDefinedFunctionsPathSegment}`;
                break;
            case "TRIGGER":
                resourcePrefixPath += `${Constants$1.Path.Root}${Constants$1.Path.TriggersPathSegment}`;
                break;
            default:
                throw new Error(`illegalArgumentException : ${sasTokenProperties.resourceKind} \
                          is an invalid resource kind`);
        }
        resourcePrefixPath += `${Constants$1.Path.Root}${sasTokenProperties.resourceName}${Constants$1.Path.Root}`;
    }
    sasTokenProperties.resourcePath = resourcePrefixPath.toString();
    let partitionRanges = "";
    if (sasTokenProperties.partitionKeyValueRanges !== undefined &&
        sasTokenProperties.partitionKeyValueRanges.length > 0) {
        if (typeof sasTokenProperties.resourceKind !== "string" &&
            sasTokenProperties.resourceKind !== "ITEM") {
            throw new Error(`illegalArgumentException : ${sasTokenProperties.resourceKind} \
                          is an invalid partition key value range`);
        }
        sasTokenProperties.partitionKeyValueRanges.forEach((range) => {
            partitionRanges += `${encodeUTF8(range)},`;
        });
    }
    if (sasTokenProperties.controlPlaneReaderScope === 0) {
        sasTokenProperties.controlPlaneReaderScope += exports.SasTokenPermissionKind.ContainerReadAny;
        sasTokenProperties.controlPlaneWriterScope += exports.SasTokenPermissionKind.ContainerReadAny;
    }
    if (sasTokenProperties.dataPlaneReaderScope === 0 &&
        sasTokenProperties.dataPlaneWriterScope === 0) {
        sasTokenProperties.dataPlaneReaderScope = exports.SasTokenPermissionKind.ContainerFullAccess;
        sasTokenProperties.dataPlaneWriterScope = exports.SasTokenPermissionKind.ContainerFullAccess;
    }
    if (typeof sasTokenProperties.keyType !== "number" ||
        typeof sasTokenProperties.keyType === undefined) {
        switch (sasTokenProperties.keyType) {
            case CosmosKeyType.PrimaryMaster:
                sasTokenProperties.keyType = 1;
                break;
            case CosmosKeyType.SecondaryMaster:
                sasTokenProperties.keyType = 2;
                break;
            case CosmosKeyType.PrimaryReadOnly:
                sasTokenProperties.keyType = 3;
                break;
            case CosmosKeyType.SecondaryReadOnly:
                sasTokenProperties.keyType = 4;
                break;
            default:
                throw new Error(`illegalArgumentException : ${sasTokenProperties.keyType} \
                          is an invalid key type`);
        }
    }
    const payload = sasTokenProperties.user +
        "\n" +
        sasTokenProperties.userTag +
        "\n" +
        sasTokenProperties.resourcePath +
        "\n" +
        partitionRanges +
        "\n" +
        utcsecondsSinceEpoch(sasTokenProperties.startTime).toString(16) +
        "\n" +
        utcsecondsSinceEpoch(sasTokenProperties.expiryTime).toString(16) +
        "\n" +
        sasTokenProperties.keyType +
        "\n" +
        sasTokenProperties.controlPlaneReaderScope.toString(16) +
        "\n" +
        sasTokenProperties.controlPlaneWriterScope.toString(16) +
        "\n" +
        sasTokenProperties.dataPlaneReaderScope.toString(16) +
        "\n" +
        sasTokenProperties.dataPlaneWriterScope.toString(16) +
        "\n";
    const signedPayload = await hmac(masterKey, Buffer.from(payload).toString("base64"));
    return "type=sas&ver=1.0&sig=" + signedPayload + ";" + Buffer.from(payload).toString("base64");
}
/**
 * @hidden
 */
// TODO: utcMilllisecondsSinceEpoch
function utcsecondsSinceEpoch(date) {
    return Math.round(date.getTime() / 1000);
}

Object.defineProperty(exports, "RestError", {
    enumerable: true,
    get: function () { return coreRestPipeline.RestError; }
});
Object.defineProperty(exports, "AbortError", {
    enumerable: true,
    get: function () { return abortController.AbortError; }
});
exports.BulkOperationType = BulkOperationType;
exports.ChangeFeedIterator = ChangeFeedIterator;
exports.ChangeFeedIteratorResponse = ChangeFeedIteratorResponse;
exports.ChangeFeedResponse = ChangeFeedResponse;
exports.ChangeFeedStartFrom = ChangeFeedStartFrom;
exports.ClientContext = ClientContext;
exports.ClientSideMetrics = ClientSideMetrics;
exports.Conflict = Conflict;
exports.ConflictResponse = ConflictResponse;
exports.Conflicts = Conflicts;
exports.Constants = Constants$1;
exports.Container = Container;
exports.ContainerResponse = ContainerResponse;
exports.Containers = Containers;
exports.CosmosClient = CosmosClient;
exports.CosmosDiagnostics = CosmosDiagnostics;
exports.DEFAULT_PARTITION_KEY_PATH = DEFAULT_PARTITION_KEY_PATH;
exports.Database = Database;
exports.DatabaseAccount = DatabaseAccount;
exports.DatabaseResponse = DatabaseResponse;
exports.Databases = Databases;
exports.DiagnosticNodeInternal = DiagnosticNodeInternal;
exports.ErrorResponse = ErrorResponse;
exports.FeedRange = FeedRange;
exports.FeedResponse = FeedResponse;
exports.GlobalEndpointManager = GlobalEndpointManager;
exports.Item = Item;
exports.ItemResponse = ItemResponse;
exports.Items = Items;
exports.Offer = Offer;
exports.OfferResponse = OfferResponse;
exports.Offers = Offers;
exports.PartitionKeyBuilder = PartitionKeyBuilder;
exports.PatchOperationType = PatchOperationType;
exports.Permission = Permission;
exports.PermissionResponse = PermissionResponse;
exports.Permissions = Permissions;
exports.QueryIterator = QueryIterator;
exports.QueryMetrics = QueryMetrics;
exports.QueryMetricsConstants = QueryMetricsConstants;
exports.QueryPreparationTimes = QueryPreparationTimes;
exports.RUCapPerOperationExceededError = RUCapPerOperationExceededError;
exports.ResourceResponse = ResourceResponse;
exports.RuntimeExecutionTimes = RuntimeExecutionTimes;
exports.SasTokenProperties = SasTokenProperties;
exports.Scripts = Scripts;
exports.StatusCodes = StatusCodes;
exports.StoredProcedure = StoredProcedure;
exports.StoredProcedureResponse = StoredProcedureResponse;
exports.StoredProcedures = StoredProcedures;
exports.TimeSpan = TimeSpan;
exports.TimeoutError = TimeoutError;
exports.Trigger = Trigger;
exports.TriggerResponse = TriggerResponse;
exports.Triggers = Triggers;
exports.User = User;
exports.UserDefinedFunction = UserDefinedFunction;
exports.UserDefinedFunctionResponse = UserDefinedFunctionResponse;
exports.UserDefinedFunctions = UserDefinedFunctions;
exports.UserResponse = UserResponse;
exports.Users = Users;
exports.createAuthorizationSasToken = createAuthorizationSasToken;
exports.setAuthorizationTokenHeaderUsingMasterKey = setAuthorizationTokenHeaderUsingMasterKey;
//# sourceMappingURL=index.js.map
