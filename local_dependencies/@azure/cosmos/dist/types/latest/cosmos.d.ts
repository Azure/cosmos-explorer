/// <reference lib="dom" />
/// <reference lib="esnext.asynciterable" />

import { AbortError } from '@azure/abort-controller';
import { AbortSignal as AbortSignal_2 } from 'node-abort-controller';
import { Pipeline } from '@azure/core-rest-pipeline';
import { RestError } from '@azure/core-rest-pipeline';
import { TokenCredential } from '@azure/core-auth';

export { AbortError }

export declare interface Agent {
    maxFreeSockets: number;
    maxSockets: number;
    sockets: any;
    requests: any;
    destroy(): void;
}

export declare type AggregateType = "Average" | "Count" | "Max" | "Min" | "Sum";

export declare type BulkOperationResponse = OperationResponse[] & {
    diagnostics: CosmosDiagnostics;
};

export declare const BulkOperationType: {
    readonly Create: "Create";
    readonly Upsert: "Upsert";
    readonly Read: "Read";
    readonly Delete: "Delete";
    readonly Replace: "Replace";
    readonly Patch: "Patch";
};

/**
 * Options object used to modify bulk execution.
 * continueOnError (Default value: false) - Continues bulk execution when an operation fails ** NOTE THIS WILL DEFAULT TO TRUE IN the 4.0 RELEASE
 */
export declare interface BulkOptions {
    continueOnError?: boolean;
}

export declare type BulkPatchOperation = OperationBase & {
    operationType: typeof BulkOperationType.Patch;
    id: string;
};

/**
 * Provides iterator for change feed.
 *
 * Use `Items.changeFeed()` to get an instance of the iterator.
 */
export declare class ChangeFeedIterator<T> {
    private clientContext;
    private resourceId;
    private resourceLink;
    private partitionKey;
    private changeFeedOptions;
    private static readonly IfNoneMatchAllHeaderValue;
    private nextIfNoneMatch;
    private ifModifiedSince;
    private lastStatusCode;
    private isPartitionSpecified;
    /**
     * Gets a value indicating whether there are potentially additional results that can be retrieved.
     *
     * Initially returns true. This value is set based on whether the last execution returned a continuation token.
     *
     * @returns Boolean value representing if whether there are potentially additional results that can be retrieved.
     */
    get hasMoreResults(): boolean;
    /**
     * Gets an async iterator which will yield pages of results from Azure Cosmos DB.
     */
    getAsyncIterator(): AsyncIterable<ChangeFeedResponse<Array<T & Resource>>>;
    /**
     * Read feed and retrieves the next page of results in Azure Cosmos DB.
     */
    fetchNext(): Promise<ChangeFeedResponse<Array<T & Resource>>>;
    private getFeedResponse;
}

/**
 * Specifies options for the change feed
 *
 * If none of those options are set, it will start reading changes from now for the entire container.
 */
export declare interface ChangeFeedIteratorOptions {
    /**
     * Max amount of items to return per page
     */
    maxItemCount?: number;
    /**
     * The session token to use. If not specified, will use the most recent captured session token to start with.
     */
    sessionToken?: string;
    /**
     * Signals where to start from in the change feed.
     */
    changeFeedStartFrom?: ChangeFeedStartFrom;
}

/**
 * A single response page from the Azure Cosmos DB Change Feed
 */
export declare class ChangeFeedIteratorResponse<T> {
    /**
     * Gets the items returned in the response from Azure Cosmos DB
     */
    readonly result: T;
    /**
     * Gets the number of items returned in the response from Azure Cosmos DB
     */
    readonly count: number;
    /**
     * Gets the status code of the response from Azure Cosmos DB
     */
    readonly statusCode: number;
    /**
     * Cosmos Diagnostic Object.
     */
    readonly diagnostics: CosmosDiagnostics;
    /**
     * Gets the subStatusCodes of the response from Azure Cosmos DB. Useful in partition split or partition gone.
     */
    readonly subStatusCode?: number;
    /**
     * Gets the request charge for this request from the Azure Cosmos DB service.
     */
    get requestCharge(): number;
    /**
     * Gets the activity ID for the request from the Azure Cosmos DB service.
     */
    get activityId(): string;
    /**
     * Gets the continuation token to be used for continuing enumeration of the Azure Cosmos DB service.
     */
    get continuationToken(): string;
    /**
     * Gets the session token for use in session consistency reads from the Azure Cosmos DB service.
     */
    get sessionToken(): string;
    /**
     * Response headers of the response from Azure Cosmos DB
     */
    headers: CosmosHeaders;
}

/**
 * Specifies options for the change feed
 *
 * Some of these options control where and when to start reading from the change feed. The order of precedence is:
 * - continuation
 * - startTime
 * - startFromBeginning
 *
 * If none of those options are set, it will start reading changes from the first `ChangeFeedIterator.fetchNext()` call.
 */
export declare interface ChangeFeedOptions {
    /**
     * Max amount of items to return per page
     */
    maxItemCount?: number;
    /**
     * The continuation token to start from.
     *
     * This is equivalent to the etag and continuation value from the `ChangeFeedResponse`
     */
    continuation?: string;
    /**
     * The session token to use. If not specified, will use the most recent captured session token to start with.
     */
    sessionToken?: string;
    /**
     * Signals whether to start from the beginning or not.
     */
    startFromBeginning?: boolean;
    /**
     * Specified the start time to start reading changes from.
     */
    startTime?: Date;
}

/**
 * Use `Items.getChangeFeedIterator()` to return an iterator that can iterate over all the changes for a partition key, feed range or an entire container.
 */
export declare interface ChangeFeedPullModelIterator<T> {
    /**
     * Always returns true, changefeed is an infinite stream.
     */
    readonly hasMoreResults: boolean;
    /**
     * Returns next set of results for the change feed.
     */
    readNext(): Promise<ChangeFeedIteratorResponse<Array<T & Resource>>>;
    /**
     * Gets an async iterator which will yield change feed results.
     * @example Get changefeed for an entire container from now
     * ```typescript
     * const options = { changeFeedStartFrom: ChangeFeedStartFrom.Now() };
     * for await(const res of container.items.getChangeFeedIterator(options).getAsyncIterator()) {
     *   //process res
     * }
     * ```
     */
    getAsyncIterator(): AsyncIterable<ChangeFeedIteratorResponse<Array<T & Resource>>>;
}

/**
 * A single response page from the Azure Cosmos DB Change Feed
 */
export declare class ChangeFeedResponse<T> {
    /**
     * Gets the items returned in the response from Azure Cosmos DB
     */
    readonly result: T;
    /**
     * Gets the number of items returned in the response from Azure Cosmos DB
     */
    readonly count: number;
    /**
     * Gets the status code of the response from Azure Cosmos DB
     */
    readonly statusCode: number;
    readonly diagnostics: CosmosDiagnostics;
    /**
     * Gets the request charge for this request from the Azure Cosmos DB service.
     */
    get requestCharge(): number;
    /**
     * Gets the activity ID for the request from the Azure Cosmos DB service.
     */
    get activityId(): string;
    /**
     * Gets the continuation token to be used for continuing enumeration of the Azure Cosmos DB service.
     *
     * This is equivalent to the `etag` property.
     */
    get continuation(): string;
    /**
     * Gets the session token for use in session consistency reads from the Azure Cosmos DB service.
     */
    get sessionToken(): string;
    /**
     * Gets the entity tag associated with last transaction in the Azure Cosmos DB service,
     * which can be used as If-Non-Match Access condition for ReadFeed REST request or
     * `continuation` property of `ChangeFeedOptions` parameter for
     * `Items.changeFeed()`
     * to get feed changes since the transaction specified by this entity tag.
     *
     * This is equivalent to the `continuation` property.
     */
    get etag(): string;
    /**
     * Response headers of the response from Azure Cosmos DB
     */
    headers: CosmosHeaders;
}

/**
 * Base class for where to start a ChangeFeedIterator.
 */
export declare abstract class ChangeFeedStartFrom {
    /**
     * Returns an object that tells the ChangeFeedIterator to start from the beginning of time.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     */
    static Beginning(cfResource?: PartitionKey | FeedRange): ChangeFeedStartFromBeginning;
    /**
     *  Returns an object that tells the ChangeFeedIterator to start reading changes from this moment onward.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     **/
    static Now(cfResource?: PartitionKey | FeedRange): ChangeFeedStartFromNow;
    /**
     * Returns an object that tells the ChangeFeedIterator to start reading changes from some point in time onward.
     * @param startTime - Date object specfiying the time to start reading changes from.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     */
    static Time(startTime: Date, cfResource?: PartitionKey | FeedRange): ChangeFeedStartFromTime;
    /**
     * Returns an object that tells the ChangeFeedIterator to start reading changes from a save point.
     * @param continuation - The continuation to resume from.
     */
    static Continuation(continuationToken: string): ChangeFeedStartFromContinuation;
}

/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from beginning of time.
 */
declare class ChangeFeedStartFromBeginning {
    private cfResource?;
    constructor(cfResource?: PartitionKey | FeedRange);
    getCfResource(): PartitionKey | FeedRange | undefined;
}

/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from a saved point.
 */
declare class ChangeFeedStartFromContinuation {
    private continuationToken;
    constructor(continuation: string);
    getCfResource(): string;
    getCfResourceJson(): any;
    getResourceType(): any;
}

/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from this moment in time.
 */
declare class ChangeFeedStartFromNow {
    cfResource?: PartitionKey | FeedRange;
    constructor(cfResource?: PartitionKey | FeedRange);
    getCfResource(): PartitionKey | FeedRange | undefined;
}

/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from a particular point of time.
 */
declare class ChangeFeedStartFromTime {
    private cfResource?;
    private startTime;
    constructor(startTime: Date, cfResource?: PartitionKey | FeedRange);
    getCfResource(): PartitionKey | FeedRange | undefined;
    getStartTime(): Date;
}

/**
 * This type holds information related to initialization of `CosmosClient`
 */
export declare type ClientConfigDiagnostic = {
    /**
     * End point configured during client initialization.
     */
    endpoint: string;
    /**
     * True if `resourceTokens` was supplied during client initialization.
     */
    resourceTokensConfigured: boolean;
    /**
     * True if `tokenProvider` was supplied during client initialization.
     */
    tokenProviderConfigured: boolean;
    /**
     * True if `aadCredentials` was supplied during client initialization.
     */
    aadCredentialsConfigured: boolean;
    /**
     * True if `connectionPolicy` was supplied during client initialization.
     */
    connectionPolicyConfigured: boolean;
    /**
     * `consistencyLevel` supplied during client initialization.
     */
    consistencyLevel?: keyof typeof ConsistencyLevel;
    /**
     * `defaultHeaders` supplied during client initialization.
     */
    defaultHeaders?: {
        [key: string]: any;
    };
    /**
     * True if `connectionPolicy` were supplied during client initialization.
     */
    agentConfigured: boolean;
    /**
     * `userAgentSuffix` supplied during client initialization.
     */
    userAgentSuffix: string;
    /**
     * `diagnosticLevel` supplied during client initialization.
     */
    diagnosticLevel?: CosmosDbDiagnosticLevel;
    /**
     * True if `plugins` were supplied during client initialization.
     */
    pluginsConfigured: boolean;
    /**
     * SDK version
     */
    sDKVersion: string;
};

/**
 * @hidden
 * @hidden
 */
export declare class ClientContext {
    private cosmosClientOptions;
    private globalEndpointManager;
    private clientConfig;
    diagnosticLevel: CosmosDbDiagnosticLevel;
    private readonly sessionContainer;
    private connectionPolicy;
    private pipeline;
    private diagnosticWriter;
    private diagnosticFormatter;
    partitionKeyDefinitionCache: {
        [containerUrl: string]: any;
    };
    constructor(cosmosClientOptions: CosmosClientOptions, globalEndpointManager: GlobalEndpointManager, clientConfig: ClientConfigDiagnostic, diagnosticLevel: CosmosDbDiagnosticLevel);
    /** @hidden */
    read<T>({ path, resourceType, resourceId, options, partitionKey, diagnosticNode, }: {
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<T & Resource>>;
    queryFeed<T>({ path, resourceType, resourceId, resultFn, query, options, diagnosticNode, partitionKeyRangeId, partitionKey, startEpk, endEpk, }: {
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        resultFn: (result: {
            [key: string]: any;
        }) => any[];
        query: SqlQuerySpec | string;
        options: FeedOptions;
        diagnosticNode: DiagnosticNodeInternal;
        partitionKeyRangeId?: string;
        partitionKey?: PartitionKey;
        startEpk?: string | undefined;
        endEpk?: string | undefined;
    }): Promise<Response_2<T & Resource>>;
    getQueryPlan(path: string, resourceType: ResourceType, resourceId: string, query: SqlQuerySpec | string, options: FeedOptions, diagnosticNode: DiagnosticNodeInternal): Promise<Response_2<PartitionedQueryExecutionInfo>>;
    queryPartitionKeyRanges(collectionLink: string, query?: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<PartitionKeyRange>;
    delete<T>({ path, resourceType, resourceId, options, partitionKey, method, diagnosticNode, }: {
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        method?: HTTPMethod;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<T & Resource>>;
    patch<T>({ body, path, resourceType, resourceId, options, partitionKey, diagnosticNode, }: {
        body: any;
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<T & Resource>>;
    create<T, U = T>({ body, path, resourceType, resourceId, diagnosticNode, options, partitionKey, }: {
        body: T;
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        diagnosticNode: DiagnosticNodeInternal;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
    }): Promise<Response_2<T & U & Resource>>;
    private processQueryFeedResponse;
    private applySessionToken;
    replace<T>({ body, path, resourceType, resourceId, options, partitionKey, diagnosticNode, }: {
        body: any;
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<T & Resource>>;
    upsert<T, U = T>({ body, path, resourceType, resourceId, options, partitionKey, diagnosticNode, }: {
        body: T;
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<T & U & Resource>>;
    execute<T>({ sprocLink, params, options, partitionKey, diagnosticNode, }: {
        sprocLink: string;
        params?: any[];
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<T>>;
    /**
     * Gets the Database account information.
     * @param options - `urlConnection` in the options is the endpoint url whose database account needs to be retrieved.
     * If not present, current client's url will be used.
     */
    getDatabaseAccount(diagnosticNode: DiagnosticNodeInternal, options?: RequestOptions): Promise<Response_2<DatabaseAccount>>;
    getWriteEndpoint(diagnosticNode: DiagnosticNodeInternal): Promise<string>;
    getReadEndpoint(diagnosticNode: DiagnosticNodeInternal): Promise<string>;
    getWriteEndpoints(): Promise<readonly string[]>;
    getReadEndpoints(): Promise<readonly string[]>;
    batch<T>({ body, path, partitionKey, resourceId, options, diagnosticNode, }: {
        body: T;
        path: string;
        partitionKey: PartitionKey;
        resourceId: string;
        options?: RequestOptions;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<any>>;
    bulk<T>({ body, path, partitionKeyRangeId, resourceId, bulkOptions, options, diagnosticNode, }: {
        body: T;
        path: string;
        partitionKeyRangeId: string;
        resourceId: string;
        bulkOptions?: BulkOptions;
        options?: RequestOptions;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response_2<any>>;
    private captureSessionToken;
    clearSessionToken(path: string): void;
    recordDiagnostics(diagnostic: CosmosDiagnostics): void;
    initializeDiagnosticSettings(diagnosticLevel: CosmosDbDiagnosticLevel): void;
    private getSessionParams;
    private isMasterResource;
    private buildHeaders;
    /**
     * Returns collection of properties which are derived from the context for Request Creation.
     * These properties have client wide scope, as opposed to request specific scope.
     * @returns
     */
    private getContextDerivedPropsForRequestCreation;
    getClientConfig(): ClientConfigDiagnostic;
}

export declare class ClientSideMetrics {
    readonly requestCharge: number;
    constructor(requestCharge: number);
    /**
     * Adds one or more ClientSideMetrics to a copy of this instance and returns the result.
     */
    add(...clientSideMetricsArray: ClientSideMetrics[]): ClientSideMetrics;
    static readonly zero: ClientSideMetrics;
    static createFromArray(...clientSideMetricsArray: ClientSideMetrics[]): ClientSideMetrics;
}

/**
 * This is a collection type for all client side diagnostic information.
 */
export declare type ClientSideRequestStatistics = {
    /**
     * This is the UTC timestamp for start of client operation.
     */
    requestStartTimeUTCInMs: number;
    /**
     * This is the duration in milli seconds taken by client operation.
     */
    requestDurationInMs: number;
    /**
     * This is the list of Location Endpoints contacted during the client operation.
     */
    locationEndpointsContacted: string[];
    /**
     * This field captures diagnostic information for retries happened during client operation.
     */
    retryDiagnostics: RetryDiagnostics;
    /**
     * This field captures diagnostic information for meta data lookups happened during client operation.
     */
    metadataDiagnostics: MetadataLookUpDiagnostics;
    /**
     * These are the statistics for main point look operation.
     */
    gatewayStatistics: GatewayStatistics[];
    /**
     * This is the cumulated Request Payload Length n bytes, this includes metadata calls along with the main operation.
     */
    totalRequestPayloadLengthInBytes: number;
    /**
     * This is the cumulated Response Payload Length n bytes, this includes metadata calls along with the main operation.
     */
    totalResponsePayloadLengthInBytes: number;
};

/**
 * Use to read or delete a given {@link Conflict} by id.
 *
 * @see {@link Conflicts} to query or read all conflicts.
 */
export declare class Conflict {
    readonly container: Container;
    readonly id: string;
    private readonly clientContext;
    private partitionKey?;
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url(): string;
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link Conflict}.
     */
    constructor(container: Container, id: string, clientContext: ClientContext, partitionKey?: PartitionKey);
    /**
     * Read the {@link ConflictDefinition} for the given {@link Conflict}.
     */
    read(options?: RequestOptions): Promise<ConflictResponse>;
    /**
     * Delete the given {@link ConflictDefinition}.
     */
    delete(options?: RequestOptions): Promise<ConflictResponse>;
}

export declare interface ConflictDefinition {
    /** The id of the conflict */
    id?: string;
    /** Source resource id */
    resourceId?: string;
    resourceType?: ResourceType;
    operationType?: OperationType;
    content?: string;
}

export declare enum ConflictResolutionMode {
    Custom = "Custom",
    LastWriterWins = "LastWriterWins"
}

/**
 * Represents the conflict resolution policy configuration for specifying how to resolve conflicts
 *  in case writes from different regions result in conflicts on documents in the collection in the Azure Cosmos DB service.
 */
export declare interface ConflictResolutionPolicy {
    /**
     * Gets or sets the <see cref="ConflictResolutionMode"/> in the Azure Cosmos DB service. By default it is {@link ConflictResolutionMode.LastWriterWins}.
     */
    mode?: keyof typeof ConflictResolutionMode;
    /**
     * Gets or sets the path which is present in each document in the Azure Cosmos DB service for last writer wins conflict-resolution.
     * This path must be present in each document and must be an integer value.
     * In case of a conflict occurring on a document, the document with the higher integer value in the specified path will be picked.
     * If the path is unspecified, by default the timestamp path will be used.
     *
     * This value should only be set when using {@link ConflictResolutionMode.LastWriterWins}.
     *
     * ```typescript
     * conflictResolutionPolicy.ConflictResolutionPath = "/name/first";
     * ```
     *
     */
    conflictResolutionPath?: string;
    /**
     * Gets or sets the {@link StoredProcedure} which is used for conflict resolution in the Azure Cosmos DB service.
     * This stored procedure may be created after the {@link Container} is created and can be changed as required.
     *
     * 1. This value should only be set when using {@link ConflictResolutionMode.Custom}.
     * 2. In case the stored procedure fails or throws an exception, the conflict resolution will default to registering conflicts in the conflicts feed.
     *
     * ```typescript
     * conflictResolutionPolicy.ConflictResolutionProcedure = "resolveConflict"
     * ```
     */
    conflictResolutionProcedure?: string;
}

export declare class ConflictResponse extends ResourceResponse<ConflictDefinition & Resource> {
    constructor(resource: ConflictDefinition & Resource, headers: CosmosHeaders, statusCode: number, conflict: Conflict, diagnostics: CosmosDiagnostics);
    /** A reference to the {@link Conflict} corresponding to the returned {@link ConflictDefinition}. */
    readonly conflict: Conflict;
}

/**
 * Use to query or read all conflicts.
 *
 * @see {@link Conflict} to read or delete a given {@link Conflict} by id.
 */
export declare class Conflicts {
    readonly container: Container;
    private readonly clientContext;
    constructor(container: Container, clientContext: ClientContext);
    /**
     * Queries all conflicts.
     * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     * @returns {@link QueryIterator} Allows you to return results in an array or iterate over them one at a time.
         */
     query(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
     /**
      * Queries all conflicts.
      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
      * @param options - Use to set options like response page size, continuation tokens, etc.
      * @returns {@link QueryIterator} Allows you to return results in an array or iterate over them one at a time.
          */
      query<T>(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
      /**
       * Reads all conflicts
       * @param options - Use to set options like response page size, continuation tokens, etc.
       */
      readAll(options?: FeedOptions): QueryIterator<ConflictDefinition & Resource>;
     }

     /** Determines the connection behavior of the CosmosClient. Note, we currently only support Gateway Mode. */
     export declare enum ConnectionMode {
         /** Gateway mode talks to an intermediate gateway which handles the direct communication with your individual partitions. */
         Gateway = 0
     }

     /**
      * Represents the Connection policy associated with a CosmosClient in the Azure Cosmos DB database service.
      */
     export declare interface ConnectionPolicy {
         /** Determines which mode to connect to Cosmos with. (Currently only supports Gateway option) */
         connectionMode?: ConnectionMode;
         /** Request timeout (time to wait for response from network peer). Represented in milliseconds. */
         requestTimeout?: number;
         /**
          * Flag to enable/disable automatic redirecting of requests based on read/write operations. Default true.
          * Required to call client.dispose() when this is set to true after destroying the CosmosClient inside another process or in the browser.
          */
         enableEndpointDiscovery?: boolean;
         /** List of azure regions to be used as preferred locations for read requests. */
         preferredLocations?: string[];
         /** RetryOptions object which defines several configurable properties used during retry. */
         retryOptions?: RetryOptions;
         /**
          * The flag that enables writes on any locations (regions) for geo-replicated database accounts in the Azure Cosmos DB service.
          * Default is `false`.
          */
         useMultipleWriteLocations?: boolean;
         /** Rate in milliseconds at which the client will refresh the endpoints list in the background */
         endpointRefreshRateInMs?: number;
         /** Flag to enable/disable background refreshing of endpoints. Defaults to false.
          * Endpoint discovery using `enableEndpointsDiscovery` will still work for failed requests. */
         enableBackgroundEndpointRefreshing?: boolean;
     }

     /**
      * Represents the consistency levels supported for Azure Cosmos DB client operations.<br>
      * The requested ConsistencyLevel must match or be weaker than that provisioned for the database account.
      * Consistency levels.
      *
      * Consistency levels by order of strength are Strong, BoundedStaleness, Session, Consistent Prefix, and Eventual.
      *
      * See https://aka.ms/cosmos-consistency for more detailed documentation on Consistency Levels.
      */
     export declare enum ConsistencyLevel {
         /**
          * Strong Consistency guarantees that read operations always return the value that was last written.
          */
         Strong = "Strong",
         /**
          * Bounded Staleness guarantees that reads are not too out-of-date.
          * This can be configured based on number of operations (MaxStalenessPrefix) or time (MaxStalenessIntervalInSeconds).
          */
         BoundedStaleness = "BoundedStaleness",
         /**
          * Session Consistency guarantees monotonic reads (you never read old data, then new, then old again),
          * monotonic writes (writes are ordered) and read your writes (your writes are immediately visible to your reads)
          * within any single session.
          */
         Session = "Session",
         /**
          * Eventual Consistency guarantees that reads will return a subset of writes.
          * All writes will be eventually be available for reads.
          */
         Eventual = "Eventual",
         /**
          * ConsistentPrefix Consistency guarantees that reads will return some prefix of all writes with no gaps.
          * All writes will be eventually be available for reads.
          */
         ConsistentPrefix = "ConsistentPrefix"
     }

     /**
      * @hidden
      */
     export declare const Constants: {
         HttpHeaders: {
             Authorization: string;
             ETag: string;
             MethodOverride: string;
             Slug: string;
             ContentType: string;
             LastModified: string;
             ContentEncoding: string;
             CharacterSet: string;
             UserAgent: string;
             IfModifiedSince: string;
             IfMatch: string;
             IfNoneMatch: string;
             ContentLength: string;
             AcceptEncoding: string;
             KeepAlive: string;
             CacheControl: string;
             TransferEncoding: string;
             ContentLanguage: string;
             ContentLocation: string;
             ContentMd5: string;
             ContentRange: string;
             Accept: string;
             AcceptCharset: string;
             AcceptLanguage: string;
             IfRange: string;
             IfUnmodifiedSince: string;
             MaxForwards: string;
             ProxyAuthorization: string;
             AcceptRanges: string;
             ProxyAuthenticate: string;
             RetryAfter: string;
             SetCookie: string;
             WwwAuthenticate: string;
             Origin: string;
             Host: string;
             AccessControlAllowOrigin: string;
             AccessControlAllowHeaders: string;
             KeyValueEncodingFormat: string;
             WrapAssertionFormat: string;
             WrapAssertion: string;
             WrapScope: string;
             SimpleToken: string;
             HttpDate: string;
             Prefer: string;
             Location: string;
             Referer: string;
             A_IM: string;
             Query: string;
             IsQuery: string;
             IsQueryPlan: string;
             SupportedQueryFeatures: string;
             QueryVersion: string;
             Continuation: string;
             ContinuationToken: string;
             PageSize: string;
             ItemCount: string;
             ActivityId: string;
             PreTriggerInclude: string;
             PreTriggerExclude: string;
             PostTriggerInclude: string;
             PostTriggerExclude: string;
             IndexingDirective: string;
             SessionToken: string;
             ConsistencyLevel: string;
             XDate: string;
             CollectionPartitionInfo: string;
             CollectionServiceInfo: string;
             RetryAfterInMilliseconds: string;
             RetryAfterInMs: string;
             IsFeedUnfiltered: string;
             ResourceTokenExpiry: string;
             EnableScanInQuery: string;
             EmitVerboseTracesInQuery: string;
             EnableCrossPartitionQuery: string;
             ParallelizeCrossPartitionQuery: string;
             ResponseContinuationTokenLimitInKB: string;
             PopulateQueryMetrics: string;
             QueryMetrics: string;
             PopulateIndexMetrics: string;
             IndexUtilization: string;
             Version: string;
             OwnerFullName: string;
             OwnerId: string;
             PartitionKey: string;
             PartitionKeyRangeID: string;
             StartEpk: string;
             EndEpk: string;
             ReadFeedKeyType: string;
             MaxEntityCount: string;
             CurrentEntityCount: string;
             CollectionQuotaInMb: string;
             CollectionCurrentUsageInMb: string;
             MaxMediaStorageUsageInMB: string;
             CurrentMediaStorageUsageInMB: string;
             RequestCharge: string;
             PopulateQuotaInfo: string;
             MaxResourceQuota: string;
             OfferType: string;
             OfferThroughput: string;
             AutoscaleSettings: string;
             DisableRUPerMinuteUsage: string;
             IsRUPerMinuteUsed: string;
             OfferIsRUPerMinuteThroughputEnabled: string;
             IndexTransformationProgress: string;
             LazyIndexingProgress: string;
             IsUpsert: string;
             SubStatus: string;
             EnableScriptLogging: string;
             ScriptLogResults: string;
             ALLOW_MULTIPLE_WRITES: string;
             IsBatchRequest: string;
             IsBatchAtomic: string;
             BatchContinueOnError: string;
             DedicatedGatewayPerRequestCacheStaleness: string;
             ForceRefresh: string;
             PriorityLevel: string;
         };
         WritableLocations: string;
         ReadableLocations: string;
         LocationUnavailableExpirationTimeInMs: number;
         ENABLE_MULTIPLE_WRITABLE_LOCATIONS: string;
         DefaultUnavailableLocationExpirationTimeMS: number;
         ThrottleRetryCount: string;
         ThrottleRetryWaitTimeInMs: string;
         CurrentVersion: string;
         AzureNamespace: string;
         AzurePackageName: string;
         SDKName: string;
         SDKVersion: string;
         CosmosDbDiagnosticLevelEnvVarName: string;
         DefaultMaxBulkRequestBodySizeInBytes: number;
         Quota: {
             CollectionSize: string;
         };
         Path: {
             Root: string;
             DatabasesPathSegment: string;
             CollectionsPathSegment: string;
             UsersPathSegment: string;
             DocumentsPathSegment: string;
             PermissionsPathSegment: string;
             StoredProceduresPathSegment: string;
             TriggersPathSegment: string;
             UserDefinedFunctionsPathSegment: string;
             ConflictsPathSegment: string;
             AttachmentsPathSegment: string;
             PartitionKeyRangesPathSegment: string;
             SchemasPathSegment: string;
             OffersPathSegment: string;
             TopologyPathSegment: string;
             DatabaseAccountPathSegment: string;
         };
         PartitionKeyRange: PartitionKeyRangePropertiesNames;
         QueryRangeConstants: {
             MinInclusive: string;
             MaxExclusive: string;
             min: string;
         };
         /**
          * @deprecated Use EffectivePartitionKeyConstants instead
          */
         EffectiveParitionKeyConstants: {
             MinimumInclusiveEffectivePartitionKey: string;
             MaximumExclusiveEffectivePartitionKey: string;
         };
         EffectivePartitionKeyConstants: {
             MinimumInclusiveEffectivePartitionKey: string;
             MaximumExclusiveEffectivePartitionKey: string;
         };
         NonStreamingQueryDefaultRUThreshold: number;
     };

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
     export declare class Container {
         readonly database: Database;
         readonly id: string;
         private readonly clientContext;
         private $items;
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
         get items(): Items;
         private $scripts;
         /**
          * All operations for Stored Procedures, Triggers, and User Defined Functions
          */
         get scripts(): Scripts;
         private $conflicts;
         /**
          * Operations for reading and querying conflicts for the given container.
          *
          * For reading or deleting a specific conflict, use `.conflict(id)`.
          */
         get conflicts(): Conflicts;
         /**
          * Returns a reference URL to the resource. Used for linking in Permissions.
          */
         get url(): string;
         /**
          * Returns a container instance. Note: You should get this from `database.container(id)`, rather than creating your own object.
          * @param database - The parent {@link Database}.
          * @param id - The id of the given container.
          * @hidden
          */
         constructor(database: Database, id: string, clientContext: ClientContext);
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
         item(id: string, partitionKeyValue?: PartitionKey): Item;
         /**
          * Used to read, replace, or delete a specific, existing {@link Conflict} by id.
          *
          * Use `.conflicts` for creating new conflicts, or querying/reading all conflicts.
          * @param id - The id of the {@link Conflict}.
          */
         conflict(id: string, partitionKey?: PartitionKey): Conflict;
         /** Read the container's definition */
         read(options?: RequestOptions): Promise<ContainerResponse>;
         /**
          * @hidden
          */
         readInternal(diagnosticNode: DiagnosticNodeInternal, options?: RequestOptions): Promise<ContainerResponse>;
         /** Replace the container's definition */
         replace(body: ContainerDefinition, options?: RequestOptions): Promise<ContainerResponse>;
         /** Delete the container */
         delete(options?: RequestOptions): Promise<ContainerResponse>;
         /**
          * Gets the partition key definition first by looking into the cache otherwise by reading the collection.
          * @deprecated This method has been renamed to readPartitionKeyDefinition.
          */
         getPartitionKeyDefinition(): Promise<ResourceResponse<PartitionKeyDefinition>>;
         /**
          * Gets the partition key definition first by looking into the cache otherwise by reading the collection.
          * @hidden
          */
         readPartitionKeyDefinition(diagnosticNode: DiagnosticNodeInternal): Promise<ResourceResponse<PartitionKeyDefinition>>;
         /**
          * Gets offer on container. If none exists, returns an OfferResponse with undefined.
          */
         readOffer(options?: RequestOptions): Promise<OfferResponse>;
         getQueryPlan(query: string | SqlQuerySpec): Promise<Response_2<PartitionedQueryExecutionInfo>>;
         readPartitionKeyRanges(feedOptions?: FeedOptions): QueryIterator<PartitionKeyRange>;
         /**
          *
          * @returns all the feed ranges for which changefeed could be fetched.
          */
         getFeedRanges(): Promise<ReadonlyArray<FeedRange>>;
         /**
          * Delete all documents belong to the container for the provided partition key value
          * @param partitionKey - The partition key value of the items to be deleted
          */
         deleteAllItemsForPartitionKey(partitionKey: PartitionKey, options?: RequestOptions): Promise<ContainerResponse>;
     }

     export declare interface ContainerDefinition {
         /** The id of the container. */
         id?: string;
         /** The partition key for the container. */
         partitionKey?: PartitionKeyDefinition;
         /** The indexing policy associated with the container. */
         indexingPolicy?: IndexingPolicy;
         /** The default time to live in seconds for items in a container. */
         defaultTtl?: number;
         /** The conflict resolution policy used to resolve conflicts in a container. */
         conflictResolutionPolicy?: ConflictResolutionPolicy;
         /** Policy for additional keys that must be unique per partition key */
         uniqueKeyPolicy?: UniqueKeyPolicy;
         /** Geospatial configuration for a collection. Type is set to Geography by default */
         geospatialConfig?: {
             type: GeospatialType;
         };
         /** The vector embedding policy information for storing items in a container. */
         vectorEmbeddingPolicy?: VectorEmbeddingPolicy;
     }

     export declare interface ContainerRequest extends VerboseOmit<ContainerDefinition, "partitionKey"> {
         throughput?: number;
         maxThroughput?: number;
         autoUpgradePolicy?: {
             throughputPolicy: {
                 incrementPercent: number;
             };
         };
         partitionKey?: string | PartitionKeyDefinition;
     }

     /** Response object for Container operations */
     export declare class ContainerResponse extends ResourceResponse<ContainerDefinition & Resource> {
         constructor(resource: ContainerDefinition & Resource, headers: CosmosHeaders, statusCode: number, container: Container, diagnostics: CosmosDiagnostics);
         /** A reference to the {@link Container} that the returned {@link ContainerDefinition} corresponds to. */
         readonly container: Container;
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
     export declare class Containers {
         readonly database: Database;
         private readonly clientContext;
         constructor(database: Database, clientContext: ClientContext);
         /**
          * Queries all containers.
          * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
          * @param options - Use to set options like response page size, continuation tokens, etc.
          * @returns {@link QueryIterator} Allows you to return specific containers in an array or iterate over them one at a time.
              * @example Read all containers to array.
              * ```typescript
              * const querySpec: SqlQuerySpec = {
              *   query: "SELECT * FROM root r WHERE r.id = @container",
              *   parameters: [
              *     {name: "@container", value: "Todo"}
              *   ]
              * };
              * const {body: containerList} = await client.database("<db id>").containers.query(querySpec).fetchAll();
              * ```
              */
          query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
          /**
           * Queries all containers.
           * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
           * @param options - Use to set options like response page size, continuation tokens, etc.
           * @returns {@link QueryIterator} Allows you to return specific containers in an array or iterate over them one at a time.
               * @example Read all containers to array.
               * ```typescript
               * const querySpec: SqlQuerySpec = {
               *   query: "SELECT * FROM root r WHERE r.id = @container",
               *   parameters: [
               *     {name: "@container", value: "Todo"}
               *   ]
               * };
               * const {body: containerList} = await client.database("<db id>").containers.query(querySpec).fetchAll();
               * ```
               */
           query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
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
           create(body: ContainerRequest, options?: RequestOptions): Promise<ContainerResponse>;
           /**
            * @hidden
            */
           createInternal(diagnosticNode: DiagnosticNodeInternal, body: ContainerRequest, options?: RequestOptions): Promise<ContainerResponse>;
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
           createIfNotExists(body: ContainerRequest, options?: RequestOptions): Promise<ContainerResponse>;
           /**
            * Read all containers.
            * @param options - Use to set options like response page size, continuation tokens, etc.
            * @returns {@link QueryIterator} Allows you to return all containers in an array or iterate over them one at a time.
                * @example Read all containers to array.
                * ```typescript
                * const {body: containerList} = await client.database("<db id>").containers.readAll().fetchAll();
                * ```
                */
            readAll(options?: FeedOptions): QueryIterator<ContainerDefinition & Resource>;
           }

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
           export declare class CosmosClient {
               /**
                * Used for creating new databases, or querying/reading all databases.
                *
                * Use `.database(id)` to read, replace, or delete a specific, existing database by id.
                *
                * @example Create a new database
                * ```typescript
                * const {resource: databaseDefinition, database} = await client.databases.create({id: "<name here>"});
                * ```
                */
               readonly databases: Databases;
               /**
                * Used for querying & reading all offers.
                *
                * Use `.offer(id)` to read, or replace existing offers.
                */
               readonly offers: Offers;
               private clientContext;
               private endpointRefresher;
               /**
                * Creates a new {@link CosmosClient} object from a connection string. Your database connection string can be found in the Azure Portal
                */
               constructor(connectionString: string);
               /**
                * Creates a new {@link CosmosClient} object. See {@link CosmosClientOptions} for more details on what options you can use.
                * @param options - bag of options; require at least endpoint and auth to be configured
                */
               constructor(options: CosmosClientOptions);
               private initializeClientConfigDiagnostic;
               /**
                * Get information about the current {@link DatabaseAccount} (including which regions are supported, etc.)
                */
               getDatabaseAccount(options?: RequestOptions): Promise<ResourceResponse<DatabaseAccount>>;
               /**
                * @hidden
                */
               getDatabaseAccountInternal(diagnosticNode: DiagnosticNodeInternal, options?: RequestOptions): Promise<ResourceResponse<DatabaseAccount>>;
               /**
                * Gets the currently used write endpoint url. Useful for troubleshooting purposes.
                *
                * The url may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
                */
               getWriteEndpoint(): Promise<string>;
               /**
                * Gets the currently used read endpoint. Useful for troubleshooting purposes.
                *
                * The url may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
                */
               getReadEndpoint(): Promise<string>;
               /**
                * Gets the known write endpoints. Useful for troubleshooting purposes.
                *
                * The urls may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
                */
               getWriteEndpoints(): Promise<readonly string[]>;
               /**
                * Gets the currently used read endpoint. Useful for troubleshooting purposes.
                *
                * The url may contain a region suffix (e.g. "-eastus") if we're using location specific endpoints.
                */
               getReadEndpoints(): Promise<readonly string[]>;
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
               database(id: string): Database;
               /**
                * Used for reading, or updating a existing offer by id.
                * @param id - The id of the offer.
                */
               offer(id: string): Offer;
               /**
                * Clears background endpoint refresher. Use client.dispose() when destroying the CosmosClient within another process.
                */
               dispose(): void;
               private backgroundRefreshEndpointList;
           }

           export declare interface CosmosClientOptions {
               /** The service endpoint to use to create the client. */
               endpoint: string;
               /** The account master or readonly key */
               key?: string;
               /** An object that contains resources tokens.
                * Keys for the object are resource Ids and values are the resource tokens.
                */
               resourceTokens?: {
                   [resourcePath: string]: string;
               };
               /** A user supplied function for resolving header authorization tokens.
                * Allows users to generating their own auth tokens, potentially using a separate service
                */
               tokenProvider?: TokenProvider;
               /** AAD token from `@azure/identity`
                * Obtain a credential object by creating an `@azure/identity` credential object
                * We will then use your credential object and a scope URL (your cosmos db endpoint)
                * to authenticate requests to Cosmos
                */
               aadCredentials?: TokenCredential;
               /** An array of {@link Permission} objects. */
               permissionFeed?: PermissionDefinition[];
               /** An instance of {@link ConnectionPolicy} class.
                * This parameter is optional and the default connectionPolicy will be used if omitted.
                */
               connectionPolicy?: ConnectionPolicy;
               /** An optional parameter that represents the consistency level.
                * It can take any value from {@link ConsistencyLevel}.
                */
               consistencyLevel?: keyof typeof ConsistencyLevel;
               defaultHeaders?: CosmosHeaders_2;
               /** An optional custom http(s) Agent to be used in NodeJS enironments
                * Use an agent such as https://github.com/TooTallNate/node-proxy-agent if you need to connect to Cosmos via a proxy
                */
               agent?: Agent;
               /** A custom string to append to the default SDK user agent. */
               userAgentSuffix?: string;
               diagnosticLevel?: CosmosDbDiagnosticLevel;
           }

           /**
            * @hidden
            */
           declare enum CosmosContainerChildResourceKind {
               Item = "ITEM",
               StoredProcedure = "STORED_PROCEDURE",
               UserDefinedFunction = "USER_DEFINED_FUNCTION",
               Trigger = "TRIGGER"
           }

           /**
            * Cosmos DB Diagnostic Level
            */
           export declare enum CosmosDbDiagnosticLevel {
               info = "info",
               debug = "debug",
               debugUnsafe = "debug-unsafe"
           }

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
           export declare class CosmosDiagnostics {
               readonly clientSideRequestStatistics: ClientSideRequestStatistics;
               readonly diagnosticNode: DiagnosticNode;
               readonly clientConfig?: ClientConfigDiagnostic;
           }

           export declare interface CosmosHeaders {
               [key: string]: any;
           }

           declare interface CosmosHeaders_2 {
               [key: string]: string | boolean | number;
           }

           /**
            * @hidden
            */
           declare enum CosmosKeyType {
               PrimaryMaster = "PRIMARY_MASTER",
               SecondaryMaster = "SECONDARY_MASTER",
               PrimaryReadOnly = "PRIMARY_READONLY",
               SecondaryReadOnly = "SECONDARY_READONLY"
           }

           /**
            * Experimental internal only
            * Generates the payload representing the permission configuration for the sas token.
            */
           export declare function createAuthorizationSasToken(masterKey: string, sasTokenProperties: SasTokenProperties): Promise<string>;

           export declare type CreateOperation = OperationWithItem & {
               operationType: typeof BulkOperationType.Create;
           };

           export declare interface CreateOperationInput {
               partitionKey?: PartitionKey;
               ifMatch?: string;
               ifNoneMatch?: string;
               operationType: typeof BulkOperationType.Create;
               resourceBody: JSONObject;
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
           export declare class Database {
               readonly client: CosmosClient;
               readonly id: string;
               private clientContext;
               /**
                * Used for creating new containers, or querying/reading all containers.
                *
                * Use `.database(id)` to read, replace, or delete a specific, existing {@link Database} by id.
                *
                * @example Create a new container
                * ```typescript
                * const {body: containerDefinition, container} = await client.database("<db id>").containers.create({id: "<container id>"});
                * ```
                */
               readonly containers: Containers;
               /**
                * Used for creating new users, or querying/reading all users.
                *
                * Use `.user(id)` to read, replace, or delete a specific, existing {@link User} by id.
                */
               readonly users: Users;
               /**
                * Returns a reference URL to the resource. Used for linking in Permissions.
                */
               get url(): string;
               /** Returns a new {@link Database} instance.
                *
                * Note: the intention is to get this object from {@link CosmosClient} via `client.database(id)`, not to instantiate it yourself.
                */
               constructor(client: CosmosClient, id: string, clientContext: ClientContext);
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
               container(id: string): Container;
               /**
                * Used to read, replace, or delete a specific, existing {@link User} by id.
                *
                * Use `.users` for creating new users, or querying/reading all users.
                */
               user(id: string): User;
               /** Read the definition of the given Database. */
               read(options?: RequestOptions): Promise<DatabaseResponse>;
               /**
                * @hidden
                */
               readInternal(diagnosticNode: DiagnosticNodeInternal, options?: RequestOptions): Promise<DatabaseResponse>;
               /** Delete the given Database. */
               delete(options?: RequestOptions): Promise<DatabaseResponse>;
               /**
                * Gets offer on database. If none exists, returns an OfferResponse with undefined.
                */
               readOffer(options?: RequestOptions): Promise<OfferResponse>;
           }

           /**
            * Represents a DatabaseAccount in the Azure Cosmos DB database service.
            */
           export declare class DatabaseAccount {
               /** The list of writable locations for a geo-replicated database account. */
               readonly writableLocations: Location_2[];
               /** The list of readable locations for a geo-replicated database account. */
               readonly readableLocations: Location_2[];
               /**
                * The self-link for Databases in the databaseAccount.
                * @deprecated Use `databasesLink`
                */
               get DatabasesLink(): string;
               /** The self-link for Databases in the databaseAccount. */
               readonly databasesLink: string;
               /**
                * The self-link for Media in the databaseAccount.
                * @deprecated Use `mediaLink`
                */
               get MediaLink(): string;
               /** The self-link for Media in the databaseAccount. */
               readonly mediaLink: string;
               /**
                * Attachment content (media) storage quota in MBs ( Retrieved from gateway ).
                * @deprecated use `maxMediaStorageUsageInMB`
                */
               get MaxMediaStorageUsageInMB(): number;
               /** Attachment content (media) storage quota in MBs ( Retrieved from gateway ). */
               readonly maxMediaStorageUsageInMB: number;
               /**
                * Current attachment content (media) usage in MBs (Retrieved from gateway )
                *
                * Value is returned from cached information updated periodically and is not guaranteed
                * to be real time.
                *
                * @deprecated use `currentMediaStorageUsageInMB`
                */
               get CurrentMediaStorageUsageInMB(): number;
               /**
                * Current attachment content (media) usage in MBs (Retrieved from gateway )
                *
                * Value is returned from cached information updated periodically and is not guaranteed
                * to be real time.
                */
               readonly currentMediaStorageUsageInMB: number;
               /**
                * Gets the UserConsistencyPolicy settings.
                * @deprecated use `consistencyPolicy`
                */
               get ConsistencyPolicy(): ConsistencyLevel;
               /** Gets the UserConsistencyPolicy settings. */
               readonly consistencyPolicy: ConsistencyLevel;
               readonly enableMultipleWritableLocations: boolean;
               constructor(body: {
                   [key: string]: any;
               }, headers: CosmosHeaders);
           }

           export declare interface DatabaseDefinition {
               /** The id of the database. */
               id?: string;
           }

           export declare interface DatabaseRequest extends DatabaseDefinition {
               /** Throughput for this database. */
               throughput?: number;
               maxThroughput?: number;
               autoUpgradePolicy?: {
                   throughputPolicy: {
                       incrementPercent: number;
                   };
               };
           }

           /** Response object for Database operations */
           export declare class DatabaseResponse extends ResourceResponse<DatabaseDefinition & Resource> {
               constructor(resource: DatabaseDefinition & Resource, headers: CosmosHeaders, statusCode: number, database: Database, diagnostics: CosmosDiagnostics);
               /** A reference to the {@link Database} that the returned {@link DatabaseDefinition} corresponds to. */
               readonly database: Database;
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
           export declare class Databases {
               readonly client: CosmosClient;
               private readonly clientContext;
               /**
                * @hidden
                * @param client - The parent {@link CosmosClient} for the Database.
                */
               constructor(client: CosmosClient, clientContext: ClientContext);
               /**
                * Queries all databases.
                * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                * @param options - Use to set options like response page size, continuation tokens, etc.
                * @returns {@link QueryIterator} Allows you to return all databases in an array or iterate over them one at a time.
                    * @example Read all databases to array.
                    * ```typescript
                    * const querySpec: SqlQuerySpec = {
                    *   query: "SELECT * FROM root r WHERE r.id = @db",
                    *   parameters: [
                    *     {name: "@db", value: "Todo"}
                    *   ]
                    * };
                    * const {body: databaseList} = await client.databases.query(querySpec).fetchAll();
                    * ```
                    */
                query(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                /**
                 * Queries all databases.
                 * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                 * @param options - Use to set options like response page size, continuation tokens, etc.
                 * @returns {@link QueryIterator} Allows you to return all databases in an array or iterate over them one at a time.
                     * @example Read all databases to array.
                     * ```typescript
                     * const querySpec: SqlQuerySpec = {
                     *   query: "SELECT * FROM root r WHERE r.id = @db",
                     *   parameters: [
                     *     {name: "@db", value: "Todo"}
                     *   ]
                     * };
                     * const {body: databaseList} = await client.databases.query(querySpec).fetchAll();
                     * ```
                     */
                 query<T>(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
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
                 create(body: DatabaseRequest, options?: RequestOptions): Promise<DatabaseResponse>;
                 /**
                  * @hidden
                  */
                 createInternal(diagnosticNode: DiagnosticNodeInternal, body: DatabaseRequest, options?: RequestOptions): Promise<DatabaseResponse>;
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
                 createIfNotExists(body: DatabaseRequest, options?: RequestOptions): Promise<DatabaseResponse>;
                 /**
                  * Reads all databases.
                  * @param options - Use to set options like response page size, continuation tokens, etc.
                  * @returns {@link QueryIterator} Allows you to return all databases in an array or iterate over them one at a time.
                      * @example Read all databases to array.
                      * ```typescript
                      * const {body: databaseList} = await client.databases.readAll().fetchAll();
                      * ```
                      */
                  readAll(options?: FeedOptions): QueryIterator<DatabaseDefinition & Resource>;
                 }

                 /** Defines a target data type of an index path specification in the Azure Cosmos DB service. */
                 export declare enum DataType {
                     /** Represents a numeric data type. */
                     Number = "Number",
                     /** Represents a string data type. */
                     String = "String",
                     /** Represents a point data type. */
                     Point = "Point",
                     /** Represents a line string data type. */
                     LineString = "LineString",
                     /** Represents a polygon data type. */
                     Polygon = "Polygon",
                     /** Represents a multi-polygon data type. */
                     MultiPolygon = "MultiPolygon"
                 }

                 export declare const DEFAULT_PARTITION_KEY_PATH: "/_partitionKey";

                 export declare type DeleteOperation = OperationBase & {
                     operationType: typeof BulkOperationType.Delete;
                     id: string;
                 };

                 export declare interface DeleteOperationInput {
                     partitionKey?: PartitionKey;
                     operationType: typeof BulkOperationType.Delete;
                     id: string;
                 }

                 /**
                  * @hidden
                  */
                 export declare type DiagnosticDataValue = {
                     selectedLocation: string;
                     activityId: string;
                     requestAttempNumber: number;
                     requestPayloadLengthInBytes: number;
                     responsePayloadLengthInBytes: number;
                     responseStatus: number;
                     readFromCache: boolean;
                     operationType: OperationType;
                     metadatOperationType: MetadataLookUpType;
                     resourceType: ResourceType;
                     failedAttempty: boolean;
                     successfulRetryPolicy: string;
                     partitionKeyRangeId: string;
                     stateful: boolean;
                     queryRecordsRead: number;
                     queryMethodIdentifier: string;
                     log: string[];
                     failure: boolean;
                     startTimeUTCInMs: number;
                     durationInMs: number;
                     requestData: Partial<{
                         requestPayloadLengthInBytes: number;
                         responsePayloadLengthInBytes: number;
                         operationType: OperationType;
                         resourceType: ResourceType;
                         headers: CosmosHeaders_2;
                         requestBody: any;
                         responseBody: any;
                         url: string;
                     }>;
                 };

                 /**
                  * Represents a tree like structure, for capturing diagnostic information.
                  */
                 export declare interface DiagnosticNode {
                     id: string;
                     nodeType: string;
                     children: DiagnosticNode[];
                     data: {
                         [key: string]: any;
                     };
                     startTimeUTCInMs: number;
                     durationInMs: number;
                 }

                 /**
                  * @hidden
                  * This is Internal Representation for DiagnosticNode. It contains useful helper functions to collect
                  * diagnostic information throughout the lifetime of Diagnostic session.
                  * The functions toDiagnosticNode() & toDiagnostic() are given to convert it to public facing counterpart.
                  */
                 export declare class DiagnosticNodeInternal implements DiagnosticNode {
                     id: string;
                     nodeType: DiagnosticNodeType;
                     parent: DiagnosticNodeInternal;
                     children: DiagnosticNodeInternal[];
                     data: Partial<DiagnosticDataValue>;
                     startTimeUTCInMs: number;
                     durationInMs: number;
                     diagnosticLevel: CosmosDbDiagnosticLevel;
                     private diagnosticCtx;
                 }

                 /**
                  * @hidden
                  */
                 export declare enum DiagnosticNodeType {
                     CLIENT_REQUEST_NODE = "CLIENT_REQUEST_NODE",
                     METADATA_REQUEST_NODE = "METADATA_REQUEST_NODE",
                     HTTP_REQUEST = "HTTP_REQUEST",
                     BATCH_REQUEST = "BATCH_REQUEST",
                     PARALLEL_QUERY_NODE = "PARALLEL_QUERY_NODE",
                     DEFAULT_QUERY_NODE = "DEFAULT_QUERY_NODE",
                     QUERY_REPAIR_NODE = "QUERY_REPAIR_NODE",
                     BACKGROUND_REFRESH_THREAD = "BACKGROUND_REFRESH_THREAD",
                     REQUEST_ATTEMPTS = "REQUEST_ATTEMPTS"
                 }

                 export declare interface ErrorBody {
                     code: string;
                     message: string;
                     /**
                      * @hidden
                      */
                     additionalErrorInfo?: PartitionedQueryExecutionInfo;
                 }

                 export declare class ErrorResponse extends Error {
                     code?: number | string;
                     substatus?: number;
                     body?: ErrorBody;
                     headers?: CosmosHeaders;
                     activityId?: string;
                     retryAfterInMs?: number;
                     retryAfterInMilliseconds?: number;
                     [key: string]: any;
                     diagnostics?: CosmosDiagnostics;
                 }

                 export declare type ExistingKeyOperation = {
                     op: keyof typeof PatchOperationType;
                     value: any;
                     path: string;
                 };

                 /**
                  * This type captures diagnostic information regarding a failed request to server api.
                  */
                 export declare interface FailedRequestAttemptDiagnostic {
                     attemptNumber: number;
                     activityId: string;
                     startTimeUTCInMs: number;
                     durationInMs: number;
                     operationType?: OperationType;
                     resourceType?: ResourceType;
                     statusCode: number;
                     substatusCode?: number;
                     requestPayloadLengthInBytes: number;
                     responsePayloadLengthInBytes: number;
                 }

                 /**
                  * The feed options and query methods.
                  */
                 export declare interface FeedOptions extends SharedOptions {
                     /** Opaque token for continuing the enumeration. Default: undefined
                      * @deprecated Use continuationToken instead.
                      */
                     continuation?: string;
                     /** Opaque token for continuing the enumeration. Default: undefined */
                     continuationToken?: string;
                     /**
                      * Limits the size of the continuation token in the response. Default: undefined
                      *
                      * Continuation Tokens contain optional data that can be removed from the serialization before writing it out to a header.
                      * By default we are capping this to 1kb to avoid long headers (Node.js has a global header size limit).
                      * A user may set this field to allow for longer headers, which can help the backend optimize query execution."
                      */
                     continuationTokenLimitInKB?: number;
                     /**
                      * Allow scan on the queries which couldn't be served as indexing was opted out on the requested paths. Default: false
                      *
                      * In general, it is best to avoid using this setting. Scans are relatively expensive and take a long time to serve.
                      */
                     enableScanInQuery?: boolean;
                     /**
                      * The maximum number of concurrent operations that run client side during parallel query execution in the
                      * Azure Cosmos DB database service. Negative values make the system automatically decides the number of
                      * concurrent operations to run. Default: 0 (no parallelism)
                      */
                     maxDegreeOfParallelism?: number;
                     /**
                      * Max number of items to be returned in the enumeration operation. Default: undefined (server will defined payload)
                      *
                      * Expirimenting with this value can usually result in the biggest performance changes to the query.
                      *
                      * The smaller the item count, the faster the first result will be delivered (for non-aggregates). For larger amounts,
                      * it will take longer to serve the request, but you'll usually get better throughput for large queries (i.e. if you need 1000 items
                      * before you can do any other actions, set `maxItemCount` to 1000. If you can start doing work after the first 100, set `maxItemCount` to 100.)
                      */
                     maxItemCount?: number;
                     /**
                      * Note: consider using changeFeed instead.
                      *
                      * Indicates a change feed request. Must be set to "Incremental feed", or omitted otherwise. Default: false
                      */
                     useIncrementalFeed?: boolean;
                     /** Conditions Associated with the request. */
                     accessCondition?: {
                         /** Conditional HTTP method header type (IfMatch or IfNoneMatch). */
                         type: string;
                         /** Conditional HTTP method header value (the _etag field from the last version you read). */
                         condition: string;
                     };
                     /**
                      * Enable returning query metrics in response headers. Default: false
                      *
                      * Used for debugging slow or expensive queries. Also increases response size and if you're using a low max header size in Node.js,
                      * you can run into issues faster.
                      */
                     populateQueryMetrics?: boolean;
                     /**
                      * Enable buffering additional items during queries. Default: false
                      *
                      * This will buffer an additional page at a time (multiplied by maxDegreeOfParallelism) from the server in the background.
                      * This improves latency by fetching pages before they are needed by the client. If you're draining all of the results from the
                      * server, like `.fetchAll`, you should usually enable this. If you're only fetching one page at a time via continuation token,
                      * you should avoid this. If you're draining more than one page, but not the entire result set, it may help improve latency, but
                      * it will increase the total amount of RU/s use to serve the entire query (as some pages will be fetched more than once).
                      */
                     bufferItems?: boolean;
                     /**
                      * This setting forces the query to use a query plan. Default: false
                      *
                      * Note: this will disable continuation token support, even for single partition queries.
                      *
                      * For queries like aggregates and most cross partition queries, this happens anyway.
                      * However, since the library doesn't know what type of query it is until we get back the first response,
                      * some optimization can't happen until later.
                      *
                      * If this setting is enabled, it will force query plan for the query, which will save some network requests
                      * and ensure parallelism can happen. Useful for when you know you're doing cross-partition or aggregate queries.
                      */
                     forceQueryPlan?: boolean;
                     /** Limits the query to a specific partition key. Default: undefined
                      *
                      *  Scoping a query to a single partition can be accomplished two ways:
                      *
                      * `container.items.query('SELECT * from c', { partitionKey: "foo" }).toArray()`
                      * `container.items.query('SELECT * from c WHERE c.yourPartitionKey = "foo"').toArray()`
                      *
                      * The former is useful when the query body is out of your control
                      * but you still want to restrict it to a single partition. Example: an end user specified query.
                      */
                     partitionKey?: PartitionKey;
                     /**
                      * Enable returning index metrics in response headers. Default: false
                      */
                     populateIndexMetrics?: boolean;
                     /**
                      * Specifies a custom maximum buffer size for storing final results for nonStreamingOrderBy queries.
                      * This value is ignored if the query includes top/offset+limit clauses.
                      */
                     vectorSearchBufferSize?: number;
                     /**
                      * Disable the nonStreamingOrderBy query feature in supported query features.
                      * Default: false. Set to true to avoid error from an old gateway that doesn't support this feature.
                      */
                     disableNonStreamingOrderByQuery?: boolean;
                 }

                 /**
                  * Specifies a feed range for the changefeed.
                  */
                 export declare abstract class FeedRange {
                     /**
                      * Min value for the feed range.
                      */
                     readonly minInclusive: string;
                     /**
                      * Max value for the feed range.
                      */
                     readonly maxExclusive: string;
                 }

                 export declare class FeedResponse<TResource> {
                     readonly resources: TResource[];
                     private readonly headers;
                     readonly hasMoreResults: boolean;
                     readonly diagnostics: CosmosDiagnostics;
                     constructor(resources: TResource[], headers: CosmosHeaders, hasMoreResults: boolean, diagnostics: CosmosDiagnostics);
                     get continuation(): string;
                     get continuationToken(): string;
                     get queryMetrics(): string;
                     get requestCharge(): number;
                     get activityId(): string;
                     get indexMetrics(): string;
                 }

                 /** @hidden */
                 declare type FetchFunctionCallback = (diagnosticNode: DiagnosticNodeInternal, options: FeedOptions) => Promise<Response_2<any>>;

                 export declare type GatewayStatistics = {
                     /**
                      * This is the activityId for request, made to server for fetching the requested resource. (As opposed to other potential meta data requests)
                      */
                     activityId?: string;
                     startTimeUTCInMs: number;
                     durationInMs: number;
                     operationType?: OperationType;
                     resourceType?: ResourceType;
                     statusCode?: number;
                     subStatusCode?: number;
                     requestCharge?: number;
                     requestPayloadLengthInBytes: number;
                     responsePayloadLengthInBytes: number;
                 };

                 export declare enum GeospatialType {
                     /** Represents data in round-earth coordinate system. */
                     Geography = "Geography",
                     /** Represents data in Eucledian(flat) coordinate system. */
                     Geometry = "Geometry"
                 }

                 /**
                  * @hidden
                  * This internal class implements the logic for endpoint management for geo-replicated database accounts.
                  */
                 export declare class GlobalEndpointManager {
                     private readDatabaseAccount;
                     /**
                      * The endpoint used to create the client instance.
                      */
                     private defaultEndpoint;
                     /**
                      * Flag to enable/disable automatic redirecting of requests based on read/write operations.
                      */
                     enableEndpointDiscovery: boolean;
                     private isRefreshing;
                     private options;
                     /**
                      * List of azure regions to be used as preferred locations for read requests.
                      */
                     private preferredLocations;
                     private writeableLocations;
                     private readableLocations;
                     private unavailableReadableLocations;
                     private unavailableWriteableLocations;
                     preferredLocationsCount: number;
                     /**
                      * Gets the current read endpoint from the endpoint cache.
                      */
                     getReadEndpoint(diagnosticNode: DiagnosticNodeInternal): Promise<string>;
                     /**
                      * Gets the current write endpoint from the endpoint cache.
                      */
                     getWriteEndpoint(diagnosticNode: DiagnosticNodeInternal): Promise<string>;
                     getReadEndpoints(): Promise<ReadonlyArray<string>>;
                     getWriteEndpoints(): Promise<ReadonlyArray<string>>;
                     markCurrentLocationUnavailableForRead(diagnosticNode: DiagnosticNodeInternal, endpoint: string): Promise<void>;
                     markCurrentLocationUnavailableForWrite(diagnosticNode: DiagnosticNodeInternal, endpoint: string): Promise<void>;
                     canUseMultipleWriteLocations(resourceType?: ResourceType, operationType?: OperationType): boolean;
                     resolveServiceEndpoint(diagnosticNode: DiagnosticNodeInternal, resourceType: ResourceType, operationType: OperationType, startServiceEndpointIndex?: number): Promise<string>;
                     /**
                      * Refreshes the endpoint list by clearning stale unavailability and then
                      *  retrieving the writable and readable locations from the geo-replicated database account
                      *  and then updating the locations cache.
                      *  We skip the refreshing if enableEndpointDiscovery is set to False
                      */
                     refreshEndpointList(diagnosticNode: DiagnosticNodeInternal): Promise<void>;
                     private refreshEndpoints;
                     private refreshStaleUnavailableLocations;
                     /**
                      * update the locationUnavailability to undefined if the location is available again
                      * @param now - current time
                      * @param unavailableLocations - list of unavailable locations
                      * @param allLocations - list of all locations
                      */
                     private updateLocation;
                     private cleanUnavailableLocationList;
                     /**
                      * Gets the database account first by using the default endpoint, and if that doesn't returns
                      * use the endpoints for the preferred locations in the order they are specified to get
                      * the database account.
                      */
                     private getDatabaseAccountFromAnyEndpoint;
                     /**
                      * Gets the locational endpoint using the location name passed to it using the default endpoint.
                      *
                      * @param defaultEndpoint - The default endpoint to use for the endpoint.
                      * @param locationName    - The location name for the azure region like "East US".
                      */
                     private static getLocationalEndpoint;
                 }

                 export declare interface GroupByAliasToAggregateType {
                     [key: string]: AggregateType;
                 }

                 export declare type GroupByExpressions = string[];

                 /**
                  * @hidden
                  */
                 export declare enum HTTPMethod {
                     get = "GET",
                     patch = "PATCH",
                     post = "POST",
                     put = "PUT",
                     delete = "DELETE"
                 }

                 export declare interface Index {
                     kind: keyof typeof IndexKind;
                     dataType: keyof typeof DataType;
                     precision?: number;
                 }

                 export declare interface IndexedPath {
                     path: string;
                     indexes?: Index[];
                 }

                 /**
                  * Specifies the supported indexing modes.
                  */
                 export declare enum IndexingMode {
                     /**
                      * Index is updated synchronously with a create or update operation.
                      *
                      * With consistent indexing, query behavior is the same as the default consistency level for the container.
                      * The index is always kept up to date with the data.
                      */
                     consistent = "consistent",
                     /**
                      * Index is updated asynchronously with respect to a create or update operation.
                      *
                      * With lazy indexing, queries are eventually consistent. The index is updated when the container is idle.
                      */
                     lazy = "lazy",
                     /** No Index is provided. */
                     none = "none"
                 }

                 export declare interface IndexingPolicy {
                     /** The indexing mode (consistent or lazy) {@link IndexingMode}. */
                     indexingMode?: keyof typeof IndexingMode;
                     automatic?: boolean;
                     /** An array of {@link IncludedPath} represents the paths to be included for indexing. */
                     includedPaths?: IndexedPath[];
                     /** An array of {@link IncludedPath} represents the paths to be excluded for indexing. */
                     excludedPaths?: IndexedPath[];
                     spatialIndexes?: SpatialIndex[];
                     /** An array of {@link VectorIndex} represents the vector index paths to be included for indexing. */
                     vectorIndexes?: VectorIndex[];
                 }

                 /**
                  * Specifies the supported Index types.
                  */
                 export declare enum IndexKind {
                     /**
                      * This is supplied for a path which requires sorting.
                      */
                     Range = "Range",
                     /**
                      * This is supplied for a path which requires geospatial indexing.
                      */
                     Spatial = "Spatial"
                 }

                 /**
                  * Used to perform operations on a specific item.
                  *
                  * @see {@link Items} for operations on all items; see `container.items`.
                  */
                 export declare class Item {
                     readonly container: Container;
                     readonly id: string;
                     private readonly clientContext;
                     private partitionKey;
                     /**
                      * Returns a reference URL to the resource. Used for linking in Permissions.
                      */
                     get url(): string;
                     /**
                      * @hidden
                      * @param container - The parent {@link Container}.
                      * @param id - The id of the given {@link Item}.
                      * @param partitionKey - The primary key of the given {@link Item} (only for partitioned containers).
                      */
                     constructor(container: Container, id: string, clientContext: ClientContext, partitionKey?: PartitionKey);
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
                     read<T extends ItemDefinition = any>(options?: RequestOptions): Promise<ItemResponse<T>>;
                     /**
                      * Replace the item's definition.
                      *
                      * There is no set schema for JSON items. They may contain any number of custom properties.
                      *
                      * @param body - The definition to replace the existing {@link Item}'s definition with.
                      * @param options - Additional options for the request
                      */
                     replace(body: ItemDefinition, options?: RequestOptions): Promise<ItemResponse<ItemDefinition>>;
                     /**
                      * Replace the item's definition.
                      *
                      * Any provided type, T, is not necessarily enforced by the SDK.
                      * You may get more or less properties and it's up to your logic to enforce it.
                      *
                      * There is no set schema for JSON items. They may contain any number of custom properties.
                      *
                      * @param body - The definition to replace the existing {@link Item}'s definition with.
                      * @param options - Additional options for the request
                      */
                     replace<T extends ItemDefinition>(body: T, options?: RequestOptions): Promise<ItemResponse<T>>;
                     /**
                      * Delete the item.
                      *
                      * Any provided type, T, is not necessarily enforced by the SDK.
                      * You may get more or less properties and it's up to your logic to enforce it.
                      *
                      * @param options - Additional options for the request
                      */
                     delete<T extends ItemDefinition = any>(options?: RequestOptions): Promise<ItemResponse<T>>;
                     /**
                      * Perform a JSONPatch on the item.
                      *
                      * Any provided type, T, is not necessarily enforced by the SDK.
                      * You may get more or less properties and it's up to your logic to enforce it.
                      *
                      * @param options - Additional options for the request
                      */
                     patch<T extends ItemDefinition = any>(body: PatchRequestBody, options?: RequestOptions): Promise<ItemResponse<T>>;
                 }

                 /**
                  * Items in Cosmos DB are simply JSON objects.
                  * Most of the Item operations allow for your to provide your own type
                  * that extends the very simple ItemDefinition.
                  *
                  * You cannot use any reserved keys. You can see the reserved key list
                  * in {@link ItemBody}
                  */
                 export declare interface ItemDefinition {
                     /** The id of the item. User settable property. Uniquely identifies the item along with the partition key */
                     id?: string;
                     /** Time to live in seconds for collections with TTL enabled */
                     ttl?: number;
                     [key: string]: any;
                 }

                 export declare class ItemResponse<T extends ItemDefinition> extends ResourceResponse<T & Resource> {
                     constructor(resource: T & Resource, headers: CosmosHeaders, statusCode: number, subsstatusCode: number, item: Item, diagnostics: CosmosDiagnostics);
                     /** Reference to the {@link Item} the response corresponds to. */
                     readonly item: Item;
                 }

                 /**
                  * Operations for creating new items, and reading/querying all items
                  *
                  * @see {@link Item} for reading, replacing, or deleting an existing container; use `.item(id)`.
                  */
                 export declare class Items {
                     readonly container: Container;
                     private readonly clientContext;
                     private partitionKeyRangeCache;
                     /**
                      * Create an instance of {@link Items} linked to the parent {@link Container}.
                      * @param container - The parent container.
                      * @hidden
                      */
                     constructor(container: Container, clientContext: ClientContext);
                     /**
                      * Queries all items.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      * @param options - Used for modifying the request (for instance, specifying the partition key).
                      * @example Read all items to array.
                      * ```typescript
                      * const querySpec: SqlQuerySpec = {
                      *   query: "SELECT * FROM Families f WHERE f.lastName = @lastName",
                      *   parameters: [
                      *     {name: "@lastName", value: "Hendricks"}
                      *   ]
                      * };
                      * const {result: items} = await items.query(querySpec).fetchAll();
                      * ```
                      */
                     query(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                     /**
                      * Queries all items.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      * @param options - Used for modifying the request (for instance, specifying the partition key).
                      * @example Read all items to array.
                      * ```typescript
                      * const querySpec: SqlQuerySpec = {
                      *   query: "SELECT firstname FROM Families f WHERE f.lastName = @lastName",
                      *   parameters: [
                      *     {name: "@lastName", value: "Hendricks"}
                      *   ]
                      * };
                      * const {result: items} = await items.query<{firstName: string}>(querySpec).fetchAll();
                      * ```
                      */
                     query<T>(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      *
                      * @deprecated Use `changeFeed` instead.
                      *
                      * @example Read from the beginning of the change feed.
                      * ```javascript
                      * const iterator = items.readChangeFeed({ startFromBeginning: true });
                      * const firstPage = await iterator.fetchNext();
                      * const firstPageResults = firstPage.result
                      * const secondPage = await iterator.fetchNext();
                      * ```
                      */
                     readChangeFeed(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      * @deprecated Use `changeFeed` instead.
                      *
                      */
                     readChangeFeed(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      * @deprecated Use `changeFeed` instead.
                      */
                     readChangeFeed<T>(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      * @deprecated Use `changeFeed` instead.
                      */
                     readChangeFeed<T>(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      *
                      * @example Read from the beginning of the change feed.
                      * ```javascript
                      * const iterator = items.readChangeFeed({ startFromBeginning: true });
                      * const firstPage = await iterator.fetchNext();
                      * const firstPageResults = firstPage.result
                      * const secondPage = await iterator.fetchNext();
                      * ```
                      */
                     changeFeed(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      */
                     changeFeed(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      */
                     changeFeed<T>(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
                     /**
                      * Create a `ChangeFeedIterator` to iterate over pages of changes
                      */
                     changeFeed<T>(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
                     /**
                      * Returns an iterator to iterate over pages of changes. The iterator returned can be used to fetch changes for a single partition key, feed range or an entire container.
                      */
                     getChangeFeedIterator<T>(changeFeedIteratorOptions?: ChangeFeedIteratorOptions): ChangeFeedPullModelIterator<T>;
                     /**
                      * Read all items.
                      *
                      * There is no set schema for JSON items. They may contain any number of custom properties.
                      *
                      * @param options - Used for modifying the request (for instance, specifying the partition key).
                      * @example Read all items to array.
                      * ```typescript
                      * const {body: containerList} = await items.readAll().fetchAll();
                      * ```
                      */
                     readAll(options?: FeedOptions): QueryIterator<ItemDefinition>;
                     /**
                      * Read all items.
                      *
                      * Any provided type, T, is not necessarily enforced by the SDK.
                      * You may get more or less properties and it's up to your logic to enforce it.
                      *
                      * There is no set schema for JSON items. They may contain any number of custom properties.
                      *
                      * @param options - Used for modifying the request (for instance, specifying the partition key).
                      * @example Read all items to array.
                      * ```typescript
                      * const {body: containerList} = await items.readAll().fetchAll();
                      * ```
                      */
                     readAll<T extends ItemDefinition>(options?: FeedOptions): QueryIterator<T>;
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
                     create<T extends ItemDefinition = any>(body: T, options?: RequestOptions): Promise<ItemResponse<T>>;
                     /**
                      * Upsert an item.
                      *
                      * There is no set schema for JSON items. They may contain any number of custom properties.
                      *
                      * @param body - Represents the body of the item. Can contain any number of user defined properties.
                      * @param options - Used for modifying the request (for instance, specifying the partition key).
                      */
                     upsert(body: unknown, options?: RequestOptions): Promise<ItemResponse<ItemDefinition>>;
                     /**
                      * Upsert an item.
                      *
                      * Any provided type, T, is not necessarily enforced by the SDK.
                      * You may get more or less properties and it's up to your logic to enforce it.
                      *
                      * There is no set schema for JSON items. They may contain any number of custom properties.
                      *
                      * @param body - Represents the body of the item. Can contain any number of user defined properties.
                      * @param options - Used for modifying the request (for instance, specifying the partition key).
                      */
                     upsert<T extends ItemDefinition>(body: T, options?: RequestOptions): Promise<ItemResponse<T>>;
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
                     bulk(operations: OperationInput[], bulkOptions?: BulkOptions, options?: RequestOptions): Promise<BulkOperationResponse>;
                     /**
                      * Function to create batches based of partition key Ranges.
                      * @param operations - operations to group
                      * @param partitionDefinition - PartitionKey definition of container.
                      * @param options - Request options for bulk request.
                      * @param batches - Groups to be filled with operations.
                      */
                     private groupOperationsBasedOnPartitionKey;
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
                     batch(operations: OperationInput[], partitionKey?: PartitionKey, options?: RequestOptions): Promise<Response_2<OperationResponse[]>>;
                 }

                 export declare interface JSONArray extends ArrayLike<JSONValue> {
                 }

                 export declare interface JSONObject {
                     [key: string]: JSONValue;
                 }

                 export declare type JSONValue = boolean | number | string | null | JSONArray | JSONObject;

                 /**
                  * Used to specify the locations that are available, read is index 1 and write is index 0.
                  */
                 declare interface Location_2 {
                     name: string;
                     databaseAccountEndpoint: string;
                     unavailable?: boolean;
                     lastUnavailabilityTimestampInMs?: number;
                 }
                 export { Location_2 as Location }

                 /**
                  * This type contains diagnostic information regarding a single metadata request to server.
                  */
                 export declare interface MetadataLookUpDiagnostic {
                     activityId: string;
                     startTimeUTCInMs: number;
                     durationInMs: number;
                     operationType?: OperationType;
                     resourceType?: ResourceType;
                     metaDataType: MetadataLookUpType;
                     requestPayloadLengthInBytes: number;
                     responsePayloadLengthInBytes: number;
                 }

                 /**
                  * This type contains diagnostic information regarding all metadata request to server during an CosmosDB client operation.
                  */
                 export declare type MetadataLookUpDiagnostics = {
                     metadataLookups: MetadataLookUpDiagnostic[];
                 };

                 /**
                  * This is enum for Type of Metadata lookups possible.
                  */
                 export declare enum MetadataLookUpType {
                     PartitionKeyRangeLookUp = "PARTITION_KEY_RANGE_LOOK_UP",
                     DatabaseAccountLookUp = "DATABASE_ACCOUNT_LOOK_UP",
                     QueryPlanLookUp = "QUERY_PLAN_LOOK_UP",
                     DatabaseLookUp = "DATABASE_LOOK_UP",
                     ContainerLookUp = "CONTAINER_LOOK_UP"
                 }

                 /**
                  * Next is a function which takes in requestContext returns a promise. You must await/then that promise which will contain the response from further plugins,
                  * allowing you to log those results or handle errors.
                  * @hidden
                  */
                 export declare type Next<T> = (context: RequestContext) => Promise<Response_2<T>>;

                 /**
                  * The returned object represents a partition key value that allows creating and accessing items
                  * without a value for partition key
                  */
                 export declare type NonePartitionKeyType = {
                     [K in any]: never;
                 };

                 /**
                  * The returned object represents a partition key value that allows creating and accessing items
                  * with a null value for the partition key.
                  */
                 export declare type NullPartitionKeyType = null;

                 /**
                  * Use to read or replace an existing {@link Offer} by id.
                  *
                  * @see {@link Offers} to query or read all offers.
                  */
                 export declare class Offer {
                     readonly client: CosmosClient;
                     readonly id: string;
                     private readonly clientContext;
                     /**
                      * Returns a reference URL to the resource. Used for linking in Permissions.
                      */
                     get url(): string;
                     /**
                      * @hidden
                      * @param client - The parent {@link CosmosClient} for the Database Account.
                      * @param id - The id of the given {@link Offer}.
                      */
                     constructor(client: CosmosClient, id: string, clientContext: ClientContext);
                     /**
                      * Read the {@link OfferDefinition} for the given {@link Offer}.
                      */
                     read(options?: RequestOptions): Promise<OfferResponse>;
                     /**
                      * Replace the given {@link Offer} with the specified {@link OfferDefinition}.
                      * @param body - The specified {@link OfferDefinition}
                      */
                     replace(body: OfferDefinition, options?: RequestOptions): Promise<OfferResponse>;
                 }

                 export declare interface OfferDefinition {
                     id?: string;
                     offerType?: string;
                     offerVersion?: string;
                     resource?: string;
                     offerResourceId?: string;
                     content?: {
                         offerThroughput: number;
                         offerIsRUPerMinuteThroughputEnabled: boolean;
                         offerMinimumThroughputParameters?: {
                             maxThroughputEverProvisioned: number;
                             maxConsumedStorageEverInKB: number;
                         };
                         offerAutopilotSettings?: {
                             tier: number;
                             maximumTierThroughput: number;
                             autoUpgrade: boolean;
                             maxThroughput: number;
                         };
                     };
                 }

                 export declare class OfferResponse extends ResourceResponse<OfferDefinition & Resource> {
                     constructor(resource: OfferDefinition & Resource, headers: CosmosHeaders, statusCode: number, diagnostics: CosmosDiagnostics, offer?: Offer);
                     /** A reference to the {@link Offer} corresponding to the returned {@link OfferDefinition}. */
                     readonly offer: Offer;
                 }

                 /**
                  * Use to query or read all Offers.
                  *
                  * @see {@link Offer} to read or replace an existing {@link Offer} by id.
                  */
                 export declare class Offers {
                     readonly client: CosmosClient;
                     private readonly clientContext;
                     /**
                      * @hidden
                      * @param client - The parent {@link CosmosClient} for the offers.
                      */
                     constructor(client: CosmosClient, clientContext: ClientContext);
                     /**
                      * Query all offers.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                     /**
                      * Query all offers.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
                     /**
                      * Read all offers.
                      * @example Read all offers to array.
                      * ```typescript
                      * const {body: offerList} = await client.offers.readAll().fetchAll();
                      * ```
                      */
                     readAll(options?: FeedOptions): QueryIterator<OfferDefinition & Resource>;
                 }

                 export declare type Operation = CreateOperation | UpsertOperation | ReadOperation | DeleteOperation | ReplaceOperation | BulkPatchOperation;

                 export declare interface OperationBase {
                     partitionKey?: string;
                     ifMatch?: string;
                     ifNoneMatch?: string;
                 }

                 export declare type OperationInput = CreateOperationInput | UpsertOperationInput | ReadOperationInput | DeleteOperationInput | ReplaceOperationInput | PatchOperationInput;

                 export declare interface OperationResponse {
                     statusCode: number;
                     requestCharge: number;
                     eTag?: string;
                     resourceBody?: JSONObject;
                 }

                 /**
                  * @hidden
                  */
                 export declare enum OperationType {
                     Create = "create",
                     Replace = "replace",
                     Upsert = "upsert",
                     Delete = "delete",
                     Read = "read",
                     Query = "query",
                     Execute = "execute",
                     Batch = "batch",
                     Patch = "patch"
                 }

                 export declare type OperationWithItem = OperationBase & {
                     resourceBody: JSONObject;
                 };

                 /**
                  * @hidden
                  */
                 export declare interface PartitionedQueryExecutionInfo {
                     partitionedQueryExecutionInfoVersion: number;
                     queryInfo: QueryInfo;
                     queryRanges: QueryRange[];
                 }

                 /**
                  * PartitionKey of a container.
                  * @remarks
                  * - PartitionKeyDefinition is no longer part of PartitionKey. So please use PartitionKeyDefinition
                  * type directly where appropriate.
                  */
                 export declare type PartitionKey = PrimitivePartitionKeyValue | PrimitivePartitionKeyValue[];

                 /**
                  * Builder class for building PartitionKey.
                  */
                 export declare class PartitionKeyBuilder {
                     readonly values: PrimitivePartitionKeyValue[];
                     addValue(value: string | boolean | number): PartitionKeyBuilder;
                     addNullValue(): PartitionKeyBuilder;
                     addNoneValue(): PartitionKeyBuilder;
                     build(): PartitionKey;
                 }

                 export declare interface PartitionKeyDefinition {
                     /**
                      * An array of paths for which data within the collection can be partitioned. Paths must not contain a wildcard or
                      * a trailing slash. For example, the JSON property “AccountNumber” is specified as “/AccountNumber”. The array must
                      * contain only a single value.
                      */
                     paths: string[];
                     /**
                      * An optional field, if not specified the default value is 1. To use the large partition key set the version to 2.
                      * To learn about large partition keys, see [how to create containers with large partition key](https://docs.microsoft.com/en-us/azure/cosmos-db/large-partition-keys) article.
                      */
                     version?: PartitionKeyDefinitionVersion;
                     systemKey?: boolean;
                     /**
                      * What kind of partition key is being defined (default: "Hash")
                      */
                     kind?: PartitionKeyKind;
                 }

                 /**
                  * PartitionKey Definition Version
                  */
                 export declare enum PartitionKeyDefinitionVersion {
                     V1 = 1,
                     V2 = 2
                 }

                 /**
                  * Type of PartitionKey i.e. Hash, MultiHash
                  */
                 export declare enum PartitionKeyKind {
                     Hash = "Hash",
                     MultiHash = "MultiHash"
                 }

                 /**
                  * @hidden
                  */
                 export declare interface PartitionKeyRange {
                     id: string;
                     minInclusive: string;
                     maxExclusive: string;
                     ridPrefix: number;
                     throughputFraction: number;
                     status: string;
                     parents: string[];
                 }

                 export declare interface PartitionKeyRangePropertiesNames {
                     MinInclusive: "minInclusive";
                     MaxExclusive: "maxExclusive";
                     Id: "id";
                 }

                 export declare type PatchOperation = ExistingKeyOperation | RemoveOperation;

                 export declare interface PatchOperationInput {
                     partitionKey?: PartitionKey;
                     ifMatch?: string;
                     ifNoneMatch?: string;
                     operationType: typeof BulkOperationType.Patch;
                     resourceBody: PatchRequestBody;
                     id: string;
                 }

                 export declare const PatchOperationType: {
                     readonly add: "add";
                     readonly replace: "replace";
                     readonly remove: "remove";
                     readonly set: "set";
                     readonly incr: "incr";
                 };

                 export declare type PatchRequestBody = {
                     operations: PatchOperation[];
                     condition?: string;
                 } | PatchOperation[];

                 /**
                  * Use to read, replace, or delete a given {@link Permission} by id.
                  *
                  * @see {@link Permissions} to create, upsert, query, or read all Permissions.
                  */
                 export declare class Permission {
                     readonly user: User;
                     readonly id: string;
                     private readonly clientContext;
                     /**
                      * Returns a reference URL to the resource. Used for linking in Permissions.
                      */
                     get url(): string;
                     /**
                      * @hidden
                      * @param user - The parent {@link User}.
                      * @param id - The id of the given {@link Permission}.
                      */
                     constructor(user: User, id: string, clientContext: ClientContext);
                     /**
                      * Read the {@link PermissionDefinition} of the given {@link Permission}.
                      */
                     read(options?: RequestOptions): Promise<PermissionResponse>;
                     /**
                      * Replace the given {@link Permission} with the specified {@link PermissionDefinition}.
                      * @param body - The specified {@link PermissionDefinition}.
                      */
                     replace(body: PermissionDefinition, options?: RequestOptions): Promise<PermissionResponse>;
                     /**
                      * Delete the given {@link Permission}.
                      */
                     delete(options?: RequestOptions): Promise<PermissionResponse>;
                 }

                 export declare interface PermissionBody {
                     /** System generated resource token for the particular resource and user */
                     _token: string;
                 }

                 export declare interface PermissionDefinition {
                     /** The id of the permission */
                     id: string;
                     /** The mode of the permission, must be a value of {@link PermissionMode} */
                     permissionMode: PermissionMode;
                     /** The link of the resource that the permission will be applied to. */
                     resource: string;
                     resourcePartitionKey?: string | any[];
                 }

                 /**
                  * Enum for permission mode values.
                  */
                 export declare enum PermissionMode {
                     /** Permission not valid. */
                     None = "none",
                     /** Permission applicable for read operations only. */
                     Read = "read",
                     /** Permission applicable for all operations. */
                     All = "all"
                 }

                 export declare class PermissionResponse extends ResourceResponse<PermissionDefinition & PermissionBody & Resource> {
                     constructor(resource: PermissionDefinition & PermissionBody & Resource, headers: CosmosHeaders, statusCode: number, permission: Permission, diagnostics: CosmosDiagnostics);
                     /** A reference to the {@link Permission} corresponding to the returned {@link PermissionDefinition}. */
                     readonly permission: Permission;
                 }

                 /**
                  * Use to create, replace, query, and read all Permissions.
                  *
                  * @see {@link Permission} to read, replace, or delete a specific permission by id.
                  */
                 declare class Permissions_2 {
                     readonly user: User;
                     private readonly clientContext;
                     /**
                      * @hidden
                      * @param user - The parent {@link User}.
                      */
                     constructor(user: User, clientContext: ClientContext);
                     /**
                      * Query all permissions.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                     /**
                      * Query all permissions.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
                     /**
                      * Read all permissions.
                      * @example Read all permissions to array.
                      * ```typescript
                      * const {body: permissionList} = await user.permissions.readAll().fetchAll();
                      * ```
                      */
                     readAll(options?: FeedOptions): QueryIterator<PermissionDefinition & Resource>;
                     /**
                      * Create a permission.
                      *
                      * A permission represents a per-User Permission to access a specific resource
                      * e.g. Item or Container.
                      * @param body - Represents the body of the permission.
                      */
                     create(body: PermissionDefinition, options?: RequestOptions): Promise<PermissionResponse>;
                     /**
                      * Upsert a permission.
                      *
                      * A permission represents a per-User Permission to access a
                      * specific resource e.g. Item or Container.
                      */
                     upsert(body: PermissionDefinition, options?: RequestOptions): Promise<PermissionResponse>;
                 }
                 export { Permissions_2 as Permissions }

                 /**
                  * Plugins allow you to customize the behavior of the SDk with additional logging, retry, or additional functionality.
                  *
                  * A plugin is a function which returns a `Promise<Response<T>>`, and is passed a RequestContext and Next object.
                  *
                  * Next is a function which takes in requestContext returns a promise. You must await/then that promise which will contain the response from further plugins,
                  * allowing you to log those results or handle errors.
                  *
                  * RequestContext is an object which controls what operation is happening, against which endpoint, and more. Modifying this and passing it along via next is how
                  * you modify future SDK behavior.
                  *
                  * @hidden
                  */
                 declare type Plugin_2<T> = (context: RequestContext, diagnosticNode: DiagnosticNodeInternal, next: Next<T>) => Promise<Response_2<T>>;
                 export { Plugin_2 as Plugin }

                 /**
                  * Specifies which event to run for the specified plugin
                  *
                  * @hidden
                  */
                 export declare interface PluginConfig {
                     /**
                      * The event to run the plugin on
                      */
                     on: keyof typeof PluginOn;
                     /**
                      * The plugin to run
                      */
                     plugin: Plugin_2<any>;
                 }

                 /**
                  * Used to specify which type of events to execute this plug in on.
                  *
                  * @hidden
                  */
                 export declare enum PluginOn {
                     /**
                      * Will be executed per network request
                      */
                     request = "request",
                     /**
                      * Will be executed per API operation
                      */
                     operation = "operation"
                 }

                 /**
                  * A primitive Partition Key value.
                  */
                 export declare type PrimitivePartitionKeyValue = string | number | boolean | NullPartitionKeyType | NonePartitionKeyType;

                 /**
                  * Represents Priority Level associated with each Azure Cosmos DB client requests.<br>
                  * The Low priority requests are always throttled before any High priority requests.
                  *
                  * By default all requests are considered as High priority requests.
                  *
                  * See https://aka.ms/CosmosDB/PriorityBasedExecution for more detailed documentation on Priority based throttling.
                  */
                 export declare enum PriorityLevel {
                     /**
                      * High Priority requests are throttled after Low priority requests.
                      */
                     High = "High",
                     /**
                      * Low Priority requests are throttled before High priority requests.
                      */
                     Low = "Low"
                 }

                 /**
                  * @hidden
                  */
                 export declare interface QueryInfo {
                     top?: any;
                     orderBy?: any[];
                     orderByExpressions?: any[];
                     offset?: number;
                     limit?: number;
                     aggregates?: AggregateType[];
                     groupByExpressions?: GroupByExpressions;
                     groupByAliasToAggregateType: GroupByAliasToAggregateType;
                     rewrittenQuery?: any;
                     distinctType: string;
                     hasSelectValue: boolean;
                     /**
                      * determines whether the query is of non streaming orderby type.
                      */
                     hasNonStreamingOrderBy: boolean;
                 }

                 /**
                  * Represents a QueryIterator Object, an implementation of feed or query response that enables
                  * traversal and iterating over the response
                  * in the Azure Cosmos DB database service.
                  */
                 export declare class QueryIterator<T> {
                     private clientContext;
                     private query;
                     private options;
                     private fetchFunctions;
                     private resourceLink?;
                     private resourceType?;
                     private fetchAllTempResources;
                     private fetchAllLastResHeaders;
                     private queryExecutionContext;
                     private queryPlanPromise;
                     private isInitialized;
                     private nonStreamingOrderBy;
                     /**
                      * @hidden
                      */
                     constructor(clientContext: ClientContext, query: SqlQuerySpec | string, options: FeedOptions, fetchFunctions: FetchFunctionCallback | FetchFunctionCallback[], resourceLink?: string, resourceType?: ResourceType);
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
                     getAsyncIterator(options?: QueryOperationOptions): AsyncIterable<FeedResponse<T>>;
                     /**
                      * Determine if there are still remaining resources to process based on the value of the continuation token or the
                      * elements remaining on the current batch in the QueryIterator.
                      * @returns true if there is other elements to process in the QueryIterator.
                      */
                     hasMoreResults(): boolean;
                     /**
                      * Fetch all pages for the query and return a single FeedResponse.
                      */
                     fetchAll(options?: QueryOperationOptions): Promise<FeedResponse<T>>;
                     /**
                      * @hidden
                      */
                     fetchAllInternal(diagnosticNode: DiagnosticNodeInternal, options?: QueryOperationOptions): Promise<FeedResponse<T>>;
                     /**
                      * Retrieve the next batch from the feed.
                      *
                      * This may or may not fetch more pages from the backend depending on your settings
                      * and the type of query. Aggregate queries will generally fetch all backend pages
                      * before returning the first batch of responses.
                      */
                     fetchNext(options?: QueryOperationOptions): Promise<FeedResponse<T>>;
                     /**
                      * Reset the QueryIterator to the beginning and clear all the resources inside it
                      */
                     reset(): void;
                     private toArrayImplementation;
                     private createPipelinedExecutionContext;
                     private fetchQueryPlan;
                     private needsQueryPlan;
                     private initPromise;
                     private init;
                     private _init;
                     private handleSplitError;
                 }

                 export declare class QueryMetrics {
                     readonly retrievedDocumentCount: number;
                     readonly retrievedDocumentSize: number;
                     readonly outputDocumentCount: number;
                     readonly outputDocumentSize: number;
                     readonly indexHitDocumentCount: number;
                     readonly totalQueryExecutionTime: TimeSpan;
                     readonly queryPreparationTimes: QueryPreparationTimes;
                     readonly indexLookupTime: TimeSpan;
                     readonly documentLoadTime: TimeSpan;
                     readonly vmExecutionTime: TimeSpan;
                     readonly runtimeExecutionTimes: RuntimeExecutionTimes;
                     readonly documentWriteTime: TimeSpan;
                     readonly clientSideMetrics: ClientSideMetrics;
                     constructor(retrievedDocumentCount: number, retrievedDocumentSize: number, outputDocumentCount: number, outputDocumentSize: number, indexHitDocumentCount: number, totalQueryExecutionTime: TimeSpan, queryPreparationTimes: QueryPreparationTimes, indexLookupTime: TimeSpan, documentLoadTime: TimeSpan, vmExecutionTime: TimeSpan, runtimeExecutionTimes: RuntimeExecutionTimes, documentWriteTime: TimeSpan, clientSideMetrics: ClientSideMetrics);
                     /**
                      * Gets the IndexHitRatio
                      * @hidden
                      */
                     get indexHitRatio(): number;
                     /**
                      * returns a new QueryMetrics instance that is the addition of this and the arguments.
                      */
                     add(queryMetricsArray: QueryMetrics[]): QueryMetrics;
                     /**
                      * Output the QueryMetrics as a delimited string.
                      * @hidden
                      */
                     toDelimitedString(): string;
                     static readonly zero: QueryMetrics;
                     /**
                      * Returns a new instance of the QueryMetrics class that is the aggregation of an array of query metrics.
                      */
                     static createFromArray(queryMetricsArray: QueryMetrics[]): QueryMetrics;
                     /**
                      * Returns a new instance of the QueryMetrics class this is deserialized from a delimited string.
                      */
                     static createFromDelimitedString(delimitedString: string, clientSideMetrics?: ClientSideMetrics): QueryMetrics;
                 }

                 export declare const QueryMetricsConstants: {
                     RetrievedDocumentCount: string;
                     RetrievedDocumentSize: string;
                     OutputDocumentCount: string;
                     OutputDocumentSize: string;
                     IndexHitRatio: string;
                     IndexHitDocumentCount: string;
                     TotalQueryExecutionTimeInMs: string;
                     QueryCompileTimeInMs: string;
                     LogicalPlanBuildTimeInMs: string;
                     PhysicalPlanBuildTimeInMs: string;
                     QueryOptimizationTimeInMs: string;
                     IndexLookupTimeInMs: string;
                     DocumentLoadTimeInMs: string;
                     VMExecutionTimeInMs: string;
                     DocumentWriteTimeInMs: string;
                     QueryEngineTimes: string;
                     SystemFunctionExecuteTimeInMs: string;
                     UserDefinedFunctionExecutionTimeInMs: string;
                     RetrievedDocumentCountText: string;
                     RetrievedDocumentSizeText: string;
                     OutputDocumentCountText: string;
                     OutputDocumentSizeText: string;
                     IndexUtilizationText: string;
                     TotalQueryExecutionTimeText: string;
                     QueryPreparationTimesText: string;
                     QueryCompileTimeText: string;
                     LogicalPlanBuildTimeText: string;
                     PhysicalPlanBuildTimeText: string;
                     QueryOptimizationTimeText: string;
                     QueryEngineTimesText: string;
                     IndexLookupTimeText: string;
                     DocumentLoadTimeText: string;
                     WriteOutputTimeText: string;
                     RuntimeExecutionTimesText: string;
                     TotalExecutionTimeText: string;
                     SystemFunctionExecuteTimeText: string;
                     UserDefinedFunctionExecutionTimeText: string;
                     ClientSideQueryMetricsText: string;
                     RetriesText: string;
                     RequestChargeText: string;
                     FetchExecutionRangesText: string;
                     SchedulingMetricsText: string;
                 };

                 export declare interface QueryOperationOptions {
                     /**
                      * Request Units(RU) Cap for a given request. Default: Undefined
                      */
                     ruCapPerOperation?: number;
                 }

                 export declare class QueryPreparationTimes {
                     readonly queryCompilationTime: TimeSpan;
                     readonly logicalPlanBuildTime: TimeSpan;
                     readonly physicalPlanBuildTime: TimeSpan;
                     readonly queryOptimizationTime: TimeSpan;
                     constructor(queryCompilationTime: TimeSpan, logicalPlanBuildTime: TimeSpan, physicalPlanBuildTime: TimeSpan, queryOptimizationTime: TimeSpan);
                     /**
                      * returns a new QueryPreparationTimes instance that is the addition of this and the arguments.
                      */
                     add(...queryPreparationTimesArray: QueryPreparationTimes[]): QueryPreparationTimes;
                     /**
                      * Output the QueryPreparationTimes as a delimited string.
                      */
                     toDelimitedString(): string;
                     static readonly zero: QueryPreparationTimes;
                     /**
                      * Returns a new instance of the QueryPreparationTimes class that is the
                      * aggregation of an array of QueryPreparationTimes.
                      */
                     static createFromArray(queryPreparationTimesArray: QueryPreparationTimes[]): QueryPreparationTimes;
                     /**
                      * Returns a new instance of the QueryPreparationTimes class this is deserialized from a delimited string.
                      */
                     static createFromDelimitedString(delimitedString: string): QueryPreparationTimes;
                 }

                 /**
                  * @hidden
                  */
                 export declare interface QueryRange {
                     min: string;
                     max: string;
                     isMinInclusive: boolean;
                     isMaxInclusive: boolean;
                 }

                 export declare type ReadOperation = OperationBase & {
                     operationType: typeof BulkOperationType.Read;
                     id: string;
                 };

                 export declare interface ReadOperationInput {
                     partitionKey?: PartitionKey;
                     operationType: typeof BulkOperationType.Read;
                     id: string;
                 }

                 export declare type RemoveOperation = {
                     op: "remove";
                     path: string;
                 };

                 export declare type ReplaceOperation = OperationWithItem & {
                     operationType: typeof BulkOperationType.Replace;
                     id: string;
                 };

                 export declare interface ReplaceOperationInput {
                     partitionKey?: PartitionKey;
                     ifMatch?: string;
                     ifNoneMatch?: string;
                     operationType: typeof BulkOperationType.Replace;
                     resourceBody: JSONObject;
                     id: string;
                 }

                 /**
                  * @hidden
                  */
                 export declare interface RequestContext {
                     path?: string;
                     operationType?: OperationType;
                     client?: ClientContext;
                     retryCount?: number;
                     resourceType?: ResourceType;
                     resourceId?: string;
                     globalEndpointManager: GlobalEndpointManager;
                     connectionPolicy: ConnectionPolicy;
                     requestAgent: Agent;
                     body?: any;
                     headers?: CosmosHeaders_2;
                     endpoint?: string;
                     method: HTTPMethod;
                     partitionKeyRangeId?: string;
                     options: FeedOptions | RequestOptions;
                     plugins: PluginConfig[];
                     partitionKey?: PartitionKey;
                     pipeline?: Pipeline;
                 }

                 /** @hidden */
                 declare interface RequestInfo_2 {
                     verb: HTTPMethod;
                     path: string;
                     resourceId: string;
                     resourceType: ResourceType;
                     headers: CosmosHeaders;
                 }
                 export { RequestInfo_2 as RequestInfo }

                 /**
                  * Options that can be specified for a requested issued to the Azure Cosmos DB servers.=
                  */
                 export declare interface RequestOptions extends SharedOptions {
                     /** Conditions Associated with the request. */
                     accessCondition?: {
                         /** Conditional HTTP method header type (IfMatch or IfNoneMatch). */
                         type: string;
                         /** Conditional HTTP method header value (the _etag field from the last version you read). */
                         condition: string;
                     };
                     /** Consistency level required by the client. */
                     consistencyLevel?: string;
                     /**
                      * DisableRUPerMinuteUsage is used to enable/disable Request Units(RUs)/minute capacity
                      * to serve the request if regular provisioned RUs/second is exhausted.
                      */
                     disableRUPerMinuteUsage?: boolean;
                     /** Enables or disables logging in JavaScript stored procedures. */
                     enableScriptLogging?: boolean;
                     /** Specifies indexing directives (index, do not index .. etc). */
                     indexingDirective?: string;
                     /** The offer throughput provisioned for a container in measurement of Requests-per-Unit. */
                     offerThroughput?: number;
                     /**
                      * Offer type when creating document containers.
                      *
                      * This option is only valid when creating a document container.
                      */
                     offerType?: string;
                     /** Enables/disables getting document container quota related stats for document container read requests. */
                     populateQuotaInfo?: boolean;
                     /** Indicates what is the post trigger to be invoked after the operation. */
                     postTriggerInclude?: string | string[];
                     /** Indicates what is the pre trigger to be invoked before the operation. */
                     preTriggerInclude?: string | string[];
                     /** Expiry time (in seconds) for resource token associated with permission (applicable only for requests on permissions). */
                     resourceTokenExpirySeconds?: number;
                     /** (Advanced use case) The url to connect to. */
                     urlConnection?: string;
                     /** Disable automatic id generation (will cause creates to fail if id isn't on the definition) */
                     disableAutomaticIdGeneration?: boolean;
                 }

                 export declare interface Resource {
                     /** Required. User settable property. Unique name that identifies the item, that is, no two items share the same ID within a database. The id must not exceed 255 characters. */
                     id: string;
                     /** System generated property. The resource ID (_rid) is a unique identifier that is also hierarchical per the resource stack on the resource model. It is used internally for placement and navigation of the item resource. */
                     _rid: string;
                     /** System generated property. Specifies the last updated timestamp of the resource. The value is a timestamp. */
                     _ts: number;
                     /** System generated property. The unique addressable URI for the resource. */
                     _self: string;
                     /** System generated property. Represents the resource etag required for optimistic concurrency control. */
                     _etag: string;
                 }

                 export declare class ResourceResponse<TResource> {
                     readonly resource: TResource | undefined;
                     readonly headers: CosmosHeaders_2;
                     readonly statusCode: StatusCode;
                     readonly diagnostics: CosmosDiagnostics;
                     readonly substatus?: SubStatusCode;
                     constructor(resource: TResource | undefined, headers: CosmosHeaders_2, statusCode: StatusCode, diagnostics: CosmosDiagnostics, substatus?: SubStatusCode);
                     get requestCharge(): number;
                     get activityId(): string;
                     get etag(): string;
                 }

                 /**
                  * @hidden
                  */
                 export declare enum ResourceType {
                     none = "",
                     database = "dbs",
                     offer = "offers",
                     user = "users",
                     permission = "permissions",
                     container = "colls",
                     conflicts = "conflicts",
                     sproc = "sprocs",
                     udf = "udfs",
                     trigger = "triggers",
                     item = "docs",
                     pkranges = "pkranges",
                     partitionkey = "partitionKey"
                 }

                 /**
                  * @hidden
                  */
                 declare interface Response_2<T> {
                     headers: CosmosHeaders;
                     result?: T;
                     code?: number;
                     substatus?: number;
                     diagnostics?: CosmosDiagnostics;
                 }
                 export { Response_2 as Response }

                 export { RestError }

                 /**
                  * This type captures diagnostic information regarding retries attempt during an CosmosDB client operation.
                  */
                 export declare type RetryDiagnostics = {
                     failedAttempts: FailedRequestAttemptDiagnostic[];
                 };

                 /**
                  * Represents the Retry policy assocated with throttled requests in the Azure Cosmos DB database service.
                  */
                 export declare interface RetryOptions {
                     /** Max number of retries to be performed for a request. Default value 9. */
                     maxRetryAttemptCount: number;
                     /** Fixed retry interval in milliseconds to wait between each retry ignoring the retryAfter returned as part of the response. */
                     fixedRetryIntervalInMilliseconds: number;
                     /** Max wait time in seconds to wait for a request while the retries are happening. Default value 30 seconds. */
                     maxWaitTimeInSeconds: number;
                 }

                 export declare class RUCapPerOperationExceededError extends ErrorResponse {
                     readonly code: string;
                     fetchedResults: any[];
                     constructor(message?: string, fetchedResults?: any[]);
                 }

                 export declare class RuntimeExecutionTimes {
                     readonly queryEngineExecutionTime: TimeSpan;
                     readonly systemFunctionExecutionTime: TimeSpan;
                     readonly userDefinedFunctionExecutionTime: TimeSpan;
                     constructor(queryEngineExecutionTime: TimeSpan, systemFunctionExecutionTime: TimeSpan, userDefinedFunctionExecutionTime: TimeSpan);
                     /**
                      * returns a new RuntimeExecutionTimes instance that is the addition of this and the arguments.
                      */
                     add(...runtimeExecutionTimesArray: RuntimeExecutionTimes[]): RuntimeExecutionTimes;
                     /**
                      * Output the RuntimeExecutionTimes as a delimited string.
                      */
                     toDelimitedString(): string;
                     static readonly zero: RuntimeExecutionTimes;
                     /**
                      * Returns a new instance of the RuntimeExecutionTimes class that is
                      *  the aggregation of an array of RuntimeExecutionTimes.
                      */
                     static createFromArray(runtimeExecutionTimesArray: RuntimeExecutionTimes[]): RuntimeExecutionTimes;
                     /**
                      * Returns a new instance of the RuntimeExecutionTimes class this is deserialized from a delimited string.
                      */
                     static createFromDelimitedString(delimitedString: string): RuntimeExecutionTimes;
                 }

                 /**
                  * @hidden
                  */
                 export declare enum SasTokenPermissionKind {
                     ContainerCreateItems = 1,
                     ContainerReplaceItems = 2,
                     ContainerUpsertItems = 4,
                     ContainerDeleteItems = 128,
                     ContainerExecuteQueries = 1,
                     ContainerReadFeeds = 2,
                     ContainerCreateStoreProcedure = 16,
                     ContainerReadStoreProcedure = 4,
                     ContainerReplaceStoreProcedure = 32,
                     ContainerDeleteStoreProcedure = 64,
                     ContainerCreateTriggers = 256,
                     ContainerReadTriggers = 16,
                     ContainerReplaceTriggers = 512,
                     ContainerDeleteTriggers = 1024,
                     ContainerCreateUserDefinedFunctions = 2048,
                     ContainerReadUserDefinedFunctions = 8,
                     ContainerReplaceUserDefinedFunctions = 4096,
                     ContainerDeleteUserDefinedFunctions = 8192,
                     ContainerExecuteStoredProcedure = 128,
                     ContainerReadConflicts = 32,
                     ContainerDeleteConflicts = 16384,
                     ContainerReadAny = 64,
                     ContainerFullAccess = 4294967295,
                     ItemReadAny = 65536,
                     ItemFullAccess = 65,
                     ItemRead = 64,
                     ItemReplace = 65536,
                     ItemUpsert = 131072,
                     ItemDelete = 262144,
                     StoreProcedureRead = 128,
                     StoreProcedureReplace = 1048576,
                     StoreProcedureDelete = 2097152,
                     StoreProcedureExecute = 4194304,
                     UserDefinedFuntionRead = 256,
                     UserDefinedFuntionReplace = 8388608,
                     UserDefinedFuntionDelete = 16777216,
                     TriggerRead = 512,
                     TriggerReplace = 33554432,
                     TriggerDelete = 67108864
                 }

                 export declare class SasTokenProperties {
                     user: string;
                     userTag: string;
                     databaseName: string;
                     containerName: string;
                     resourceName: string;
                     resourcePath: string;
                     resourceKind: CosmosContainerChildResourceKind;
                     partitionKeyValueRanges: string[];
                     startTime: Date;
                     expiryTime: Date;
                     keyType: CosmosKeyType | number;
                     controlPlaneReaderScope: number;
                     controlPlaneWriterScope: number;
                     dataPlaneReaderScope: number;
                     dataPlaneWriterScope: number;
                     cosmosContainerChildResourceKind: CosmosContainerChildResourceKind;
                     cosmosKeyType: CosmosKeyType;
                 }

                 export declare class Scripts {
                     readonly container: Container;
                     private readonly clientContext;
                     /**
                      * @param container - The parent {@link Container}.
                      * @hidden
                      */
                     constructor(container: Container, clientContext: ClientContext);
                     /**
                      * Used to read, replace, or delete a specific, existing {@link StoredProcedure} by id.
                      *
                      * Use `.storedProcedures` for creating new stored procedures, or querying/reading all stored procedures.
                      * @param id - The id of the {@link StoredProcedure}.
                      */
                     storedProcedure(id: string): StoredProcedure;
                     /**
                      * Used to read, replace, or delete a specific, existing {@link Trigger} by id.
                      *
                      * Use `.triggers` for creating new triggers, or querying/reading all triggers.
                      * @param id - The id of the {@link Trigger}.
                      */
                     trigger(id: string): Trigger;
                     /**
                      * Used to read, replace, or delete a specific, existing {@link UserDefinedFunction} by id.
                      *
                      * Use `.userDefinedFunctions` for creating new user defined functions, or querying/reading all user defined functions.
                      * @param id - The id of the {@link UserDefinedFunction}.
                      */
                     userDefinedFunction(id: string): UserDefinedFunction;
                     private $sprocs;
                     /**
                      * Operations for creating new stored procedures, and reading/querying all stored procedures.
                      *
                      * For reading, replacing, or deleting an existing stored procedure, use `.storedProcedure(id)`.
                      */
                     get storedProcedures(): StoredProcedures;
                     private $triggers;
                     /**
                      * Operations for creating new triggers, and reading/querying all triggers.
                      *
                      * For reading, replacing, or deleting an existing trigger, use `.trigger(id)`.
                      */
                     get triggers(): Triggers;
                     private $udfs;
                     /**
                      * Operations for creating new user defined functions, and reading/querying all user defined functions.
                      *
                      * For reading, replacing, or deleting an existing user defined function, use `.userDefinedFunction(id)`.
                      */
                     get userDefinedFunctions(): UserDefinedFunctions;
                 }

                 /**
                  * The default function for setting header token using the masterKey
                  * @hidden
                  */
                 export declare function setAuthorizationTokenHeaderUsingMasterKey(verb: HTTPMethod, resourceId: string, resourceType: ResourceType, headers: CosmosHeaders, masterKey: string): Promise<void>;

                 /**
                  * Options that can be specified for a requested issued to the Azure Cosmos DB servers.=
                  */
                 export declare interface SharedOptions {
                     /** Enables/disables getting document container quota related stats for document container read requests. */
                     sessionToken?: string;
                     /** (Advanced use case) Initial headers to start with when sending requests to Cosmos */
                     initialHeaders?: CosmosHeaders;
                     /**
                      * abortSignal to pass to all underlying network requests created by this method call. See https://developer.mozilla.org/en-US/docs/Web/API/AbortController
                      * @example Cancel a read request
                      * ```typescript
                      * const controller = new AbortController()
                      * const {result: item} = await items.query('SELECT * from c', { abortSignal: controller.signal});
                      * controller.abort()
                      * ```
                      */
                     abortSignal?: AbortSignal_2;
                     /**
                      * Sets the staleness value associated with the request in the Azure CosmosDB service. For requests where the {@link
                      * com.azure.cosmos.ConsistencyLevel} is {@link com.azure.cosmos.ConsistencyLevel#EVENTUAL}  or {@link com.azure.cosmos.ConsistencyLevel#SESSION}, responses from the
                      * integrated cache are guaranteed to be no staler than value indicated by this maxIntegratedCacheStaleness. When the
                      * consistency level is not set, this property is ignored.
                      *
                      * <p>Default value is null</p>
                      *
                      * <p>Cache Staleness is supported in milliseconds granularity. Anything smaller than milliseconds will be ignored.</p>
                      */
                     maxIntegratedCacheStalenessInMs?: number;
                     /**
                      * Priority Level (Low/High) for each request.
                      * Low priority requests are always throttled before any high priority requests.
                      *
                      * <p>Default value is null. By default all requests are of High priority</p>
                      */
                     priorityLevel?: PriorityLevel;
                 }

                 export declare interface SpatialIndex {
                     path: string;
                     types: SpatialType[];
                     boundingBox: {
                         xmin: number;
                         ymin: number;
                         xmax: number;
                         ymax: number;
                     };
                 }

                 export declare enum SpatialType {
                     LineString = "LineString",
                     MultiPolygon = "MultiPolygon",
                     Point = "Point",
                     Polygon = "Polygon"
                 }

                 /**
                  * Represents a parameter in a Parameterized SQL query, specified in {@link SqlQuerySpec}
                  */
                 export declare interface SqlParameter {
                     /** Name of the parameter. (i.e. `@lastName`) */
                     name: string;
                     /** Value of the parameter (this is safe to come from users, assuming they are authorized) */
                     value: JSONValue;
                 }

                 /**
                  * Represents a SQL query in the Azure Cosmos DB service.
                  *
                  * Queries with inputs should be parameterized to protect against SQL injection.
                  *
                  * @example Parameterized SQL Query
                  * ```typescript
                  * const query: SqlQuerySpec = {
                  *   query: "SELECT * FROM Families f where f.lastName = @lastName",
                  *   parameters: [
                  *     {name: "@lastName", value: "Wakefield"}
                  *   ]
                  * };
                  * ```
                  */
                 export declare interface SqlQuerySpec {
                     /** The text of the SQL query */
                     query: string;
                     /** The parameters you provide in the query */
                     parameters?: SqlParameter[];
                 }

                 /**
                  * @hidden
                  */
                 export declare type StatusCode = number;

                 /**
                  * @hidden
                  */
                 export declare const StatusCodes: StatusCodesType;

                 /**
                  * @hidden
                  */
                 export declare interface StatusCodesType {
                     Ok: 200;
                     Created: 201;
                     Accepted: 202;
                     NoContent: 204;
                     NotModified: 304;
                     BadRequest: 400;
                     Unauthorized: 401;
                     Forbidden: 403;
                     NotFound: 404;
                     MethodNotAllowed: 405;
                     RequestTimeout: 408;
                     Conflict: 409;
                     Gone: 410;
                     PreconditionFailed: 412;
                     RequestEntityTooLarge: 413;
                     TooManyRequests: 429;
                     RetryWith: 449;
                     InternalServerError: 500;
                     ServiceUnavailable: 503;
                     ENOTFOUND: "ENOTFOUND";
                     OperationPaused: 1200;
                     OperationCancelled: 1201;
                 }

                 /**
                  * Operations for reading, replacing, deleting, or executing a specific, existing stored procedure by id.
                  *
                  * For operations to create, read all, or query Stored Procedures,
                  */
                 export declare class StoredProcedure {
                     readonly container: Container;
                     readonly id: string;
                     private readonly clientContext;
                     /**
                      * Returns a reference URL to the resource. Used for linking in Permissions.
                      */
                     get url(): string;
                     /**
                      * Creates a new instance of {@link StoredProcedure} linked to the parent {@link Container}.
                      * @param container - The parent {@link Container}.
                      * @param id - The id of the given {@link StoredProcedure}.
                      * @hidden
                      */
                     constructor(container: Container, id: string, clientContext: ClientContext);
                     /**
                      * Read the {@link StoredProcedureDefinition} for the given {@link StoredProcedure}.
                      */
                     read(options?: RequestOptions): Promise<StoredProcedureResponse>;
                     /**
                      * Replace the given {@link StoredProcedure} with the specified {@link StoredProcedureDefinition}.
                      * @param body - The specified {@link StoredProcedureDefinition} to replace the existing definition.
                      */
                     replace(body: StoredProcedureDefinition, options?: RequestOptions): Promise<StoredProcedureResponse>;
                     /**
                      * Delete the given {@link StoredProcedure}.
                      */
                     delete(options?: RequestOptions): Promise<StoredProcedureResponse>;
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
                     execute<T = any>(partitionKey: PartitionKey, params?: any[], options?: RequestOptions): Promise<ResourceResponse<T>>;
                 }

                 export declare interface StoredProcedureDefinition {
                     /**
                      * The id of the {@link StoredProcedure}.
                      */
                     id?: string;
                     /**
                      * The body of the {@link StoredProcedure}. This is a JavaScript function.
                      */
                     body?: string | ((...inputs: any[]) => void);
                 }

                 export declare class StoredProcedureResponse extends ResourceResponse<StoredProcedureDefinition & Resource> {
                     constructor(resource: StoredProcedureDefinition & Resource, headers: CosmosHeaders, statusCode: number, storedProcedure: StoredProcedure, diagnostics: CosmosDiagnostics);
                     /**
                      * A reference to the {@link StoredProcedure} which the {@link StoredProcedureDefinition} corresponds to.
                      */
                     readonly storedProcedure: StoredProcedure;
                     /**
                      * Alias for storedProcedure.
                      *
                      * A reference to the {@link StoredProcedure} which the {@link StoredProcedureDefinition} corresponds to.
                      */
                     get sproc(): StoredProcedure;
                 }

                 /**
                  * Operations for creating, upserting, or reading/querying all Stored Procedures.
                  *
                  * For operations to read, replace, delete, or execute a specific, existing stored procedure by id, see `container.storedProcedure()`.
                  */
                 export declare class StoredProcedures {
                     readonly container: Container;
                     private readonly clientContext;
                     /**
                      * @param container - The parent {@link Container}.
                      * @hidden
                      */
                     constructor(container: Container, clientContext: ClientContext);
                     /**
                      * Query all Stored Procedures.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      * @example Read all stored procedures to array.
                      * ```typescript
                      * const querySpec: SqlQuerySpec = {
                      *   query: "SELECT * FROM root r WHERE r.id = @sproc",
                      *   parameters: [
                      *     {name: "@sproc", value: "Todo"}
                      *   ]
                      * };
                      * const {body: sprocList} = await containers.storedProcedures.query(querySpec).fetchAll();
                      * ```
                      */
                     query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                     /**
                      * Query all Stored Procedures.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      * @example Read all stored procedures to array.
                      * ```typescript
                      * const querySpec: SqlQuerySpec = {
                      *   query: "SELECT * FROM root r WHERE r.id = @sproc",
                      *   parameters: [
                      *     {name: "@sproc", value: "Todo"}
                      *   ]
                      * };
                      * const {body: sprocList} = await containers.storedProcedures.query(querySpec).fetchAll();
                      * ```
                      */
                     query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
                     /**
                      * Read all stored procedures.
                      * @example Read all stored procedures to array.
                      * ```typescript
                      * const {body: sprocList} = await containers.storedProcedures.readAll().fetchAll();
                      * ```
                      */
                     readAll(options?: FeedOptions): QueryIterator<StoredProcedureDefinition & Resource>;
                     /**
                      * Create a StoredProcedure.
                      *
                      * Azure Cosmos DB allows stored procedures to be executed in the storage tier,
                      * directly against an item container. The script
                      * gets executed under ACID transactions on the primary storage partition of the
                      * specified container. For additional details,
                      * refer to the server-side JavaScript API documentation.
                      */
                     create(body: StoredProcedureDefinition, options?: RequestOptions): Promise<StoredProcedureResponse>;
                 }

                 /**
                  * @hidden
                  */
                 export declare type SubStatusCode = number;

                 export declare class TimeoutError extends Error {
                     readonly code: string;
                     constructor(message?: string);
                 }

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
                 export declare class TimeSpan {
                     protected _ticks: number;
                     constructor(days: number, hours: number, minutes: number, seconds: number, milliseconds: number);
                     /**
                      * Returns a new TimeSpan object whose value is the sum of the specified TimeSpan object and this instance.
                      * @param ts - The time interval to add.
                      */
                     add(ts: TimeSpan): TimeSpan;
                     /**
                      * Returns a new TimeSpan object whose value is the difference of the specified TimeSpan object and this instance.
                      * @param ts - The time interval to subtract.
                      */
                     subtract(ts: TimeSpan): TimeSpan;
                     /**
                      * Compares this instance to a specified object and returns an integer that indicates whether this
                      * instance is shorter than, equal to, or longer than the specified object.
                      * @param value - The time interval to add.
                      */
                     compareTo(value: TimeSpan): 1 | -1 | 0;
                     /**
                      * Returns a new TimeSpan object whose value is the absolute value of the current TimeSpan object.
                      */
                     duration(): TimeSpan;
                     /**
                      * Returns a value indicating whether this instance is equal to a specified object.
                      * @param value - The time interval to check for equality.
                      */
                     equals(value: TimeSpan): boolean;
                     /**
                      * Returns a new TimeSpan object whose value is the negated value of this instance.
                      * @param value - The time interval to check for equality.
                      */
                     negate(): TimeSpan;
                     days(): number;
                     hours(): number;
                     milliseconds(): number;
                     seconds(): number;
                     ticks(): number;
                     totalDays(): number;
                     totalHours(): number;
                     totalMilliseconds(): number;
                     totalMinutes(): number;
                     totalSeconds(): number;
                     static fromTicks(value: number): TimeSpan;
                     static readonly zero: TimeSpan;
                     static readonly maxValue: TimeSpan;
                     static readonly minValue: TimeSpan;
                     static isTimeSpan(timespan: TimeSpan): number;
                     static additionDoesOverflow(a: number, b: number): boolean;
                     static subtractionDoesUnderflow(a: number, b: number): boolean;
                     static compare(t1: TimeSpan, t2: TimeSpan): 1 | 0 | -1;
                     static interval(value: number, scale: number): TimeSpan;
                     static fromMilliseconds(value: number): TimeSpan;
                     static fromSeconds(value: number): TimeSpan;
                     static fromMinutes(value: number): TimeSpan;
                     static fromHours(value: number): TimeSpan;
                     static fromDays(value: number): TimeSpan;
                 }

                 export declare type TokenProvider = (requestInfo: RequestInfo_2) => Promise<string>;

                 /**
                  * Operations to read, replace, or delete a {@link Trigger}.
                  *
                  * Use `container.triggers` to create, upsert, query, or read all.
                  */
                 export declare class Trigger {
                     readonly container: Container;
                     readonly id: string;
                     private readonly clientContext;
                     /**
                      * Returns a reference URL to the resource. Used for linking in Permissions.
                      */
                     get url(): string;
                     /**
                      * @hidden
                      * @param container - The parent {@link Container}.
                      * @param id - The id of the given {@link Trigger}.
                      */
                     constructor(container: Container, id: string, clientContext: ClientContext);
                     /**
                      * Read the {@link TriggerDefinition} for the given {@link Trigger}.
                      */
                     read(options?: RequestOptions): Promise<TriggerResponse>;
                     /**
                      * Replace the given {@link Trigger} with the specified {@link TriggerDefinition}.
                      * @param body - The specified {@link TriggerDefinition} to replace the existing definition with.
                      */
                     replace(body: TriggerDefinition, options?: RequestOptions): Promise<TriggerResponse>;
                     /**
                      * Delete the given {@link Trigger}.
                      */
                     delete(options?: RequestOptions): Promise<TriggerResponse>;
                 }

                 export declare interface TriggerDefinition {
                     /** The id of the trigger. */
                     id?: string;
                     /** The body of the trigger, it can also be passed as a stringifed function */
                     body: (() => void) | string;
                     /** The type of the trigger, should be one of the values of {@link TriggerType}. */
                     triggerType: TriggerType;
                     /** The trigger operation, should be one of the values of {@link TriggerOperation}. */
                     triggerOperation: TriggerOperation;
                 }

                 /**
                  * Enum for trigger operation values.
                  * specifies the operations on which a trigger should be executed.
                  */
                 export declare enum TriggerOperation {
                     /** All operations. */
                     All = "all",
                     /** Create operations only. */
                     Create = "create",
                     /** Update operations only. */
                     Update = "update",
                     /** Delete operations only. */
                     Delete = "delete",
                     /** Replace operations only. */
                     Replace = "replace"
                 }

                 export declare class TriggerResponse extends ResourceResponse<TriggerDefinition & Resource> {
                     constructor(resource: TriggerDefinition & Resource, headers: CosmosHeaders, statusCode: number, trigger: Trigger, diagnostics: CosmosDiagnostics);
                     /** A reference to the {@link Trigger} corresponding to the returned {@link TriggerDefinition}. */
                     readonly trigger: Trigger;
                 }

                 /**
                  * Operations to create, upsert, query, and read all triggers.
                  *
                  * Use `container.triggers` to read, replace, or delete a {@link Trigger}.
                  */
                 export declare class Triggers {
                     readonly container: Container;
                     private readonly clientContext;
                     /**
                      * @hidden
                      * @param container - The parent {@link Container}.
                      */
                     constructor(container: Container, clientContext: ClientContext);
                     /**
                      * Query all Triggers.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                     /**
                      * Query all Triggers.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
                     /**
                      * Read all Triggers.
                      * @example Read all trigger to array.
                      * ```typescript
                      * const {body: triggerList} = await container.triggers.readAll().fetchAll();
                      * ```
                      */
                     readAll(options?: FeedOptions): QueryIterator<TriggerDefinition & Resource>;
                     /**
                      * Create a trigger.
                      *
                      * Azure Cosmos DB supports pre and post triggers defined in JavaScript to be executed
                      * on creates, updates and deletes.
                      *
                      * For additional details, refer to the server-side JavaScript API documentation.
                      */
                     create(body: TriggerDefinition, options?: RequestOptions): Promise<TriggerResponse>;
                 }

                 /**
                  * Enum for trigger type values.
                  * Specifies the type of the trigger.
                  */
                 export declare enum TriggerType {
                     /** Trigger should be executed before the associated operation(s). */
                     Pre = "pre",
                     /** Trigger should be executed after the associated operation(s). */
                     Post = "post"
                 }

                 /** Interface for a single unique key passed as part of UniqueKeyPolicy */
                 export declare interface UniqueKey {
                     paths: string[];
                 }

                 /** Interface for setting unique keys on container creation */
                 export declare interface UniqueKeyPolicy {
                     uniqueKeys: UniqueKey[];
                 }

                 export declare type UpsertOperation = OperationWithItem & {
                     operationType: typeof BulkOperationType.Upsert;
                 };

                 export declare interface UpsertOperationInput {
                     partitionKey?: PartitionKey;
                     ifMatch?: string;
                     ifNoneMatch?: string;
                     operationType: typeof BulkOperationType.Upsert;
                     resourceBody: JSONObject;
                 }

                 /**
                  * Used to read, replace, and delete Users.
                  *
                  * Additionally, you can access the permissions for a given user via `user.permission` and `user.permissions`.
                  *
                  * @see {@link Users} to create, upsert, query, or read all.
                  */
                 export declare class User {
                     readonly database: Database;
                     readonly id: string;
                     private readonly clientContext;
                     /**
                      * Operations for creating, upserting, querying, or reading all operations.
                      *
                      * See `client.permission(id)` to read, replace, or delete a specific Permission by id.
                      */
                     readonly permissions: Permissions_2;
                     /**
                      * Returns a reference URL to the resource. Used for linking in Permissions.
                      */
                     get url(): string;
                     /**
                      * @hidden
                      * @param database - The parent {@link Database}.
                      */
                     constructor(database: Database, id: string, clientContext: ClientContext);
                     /**
                      * Operations to read, replace, or delete a specific Permission by id.
                      *
                      * See `client.permissions` for creating, upserting, querying, or reading all operations.
                      */
                     permission(id: string): Permission;
                     /**
                      * Read the {@link UserDefinition} for the given {@link User}.
                      */
                     read(options?: RequestOptions): Promise<UserResponse>;
                     /**
                      * Replace the given {@link User}'s definition with the specified {@link UserDefinition}.
                      * @param body - The specified {@link UserDefinition} to replace the definition.
                      */
                     replace(body: UserDefinition, options?: RequestOptions): Promise<UserResponse>;
                     /**
                      * Delete the given {@link User}.
                      */
                     delete(options?: RequestOptions): Promise<UserResponse>;
                 }

                 /**
                  * Used to read, replace, or delete a specified User Definied Function by id.
                  *
                  * @see {@link UserDefinedFunction} to create, upsert, query, read all User Defined Functions.
                  */
                 export declare class UserDefinedFunction {
                     readonly container: Container;
                     readonly id: string;
                     private readonly clientContext;
                     /**
                      * Returns a reference URL to the resource. Used for linking in Permissions.
                      */
                     get url(): string;
                     /**
                      * @hidden
                      * @param container - The parent {@link Container}.
                      * @param id - The id of the given {@link UserDefinedFunction}.
                      */
                     constructor(container: Container, id: string, clientContext: ClientContext);
                     /**
                      * Read the {@link UserDefinedFunctionDefinition} for the given {@link UserDefinedFunction}.
                      */
                     read(options?: RequestOptions): Promise<UserDefinedFunctionResponse>;
                     /**
                      * Replace the given {@link UserDefinedFunction} with the specified {@link UserDefinedFunctionDefinition}.
                      * @param options -
                      */
                     replace(body: UserDefinedFunctionDefinition, options?: RequestOptions): Promise<UserDefinedFunctionResponse>;
                     /**
                      * Delete the given {@link UserDefined}.
                      */
                     delete(options?: RequestOptions): Promise<UserDefinedFunctionResponse>;
                 }

                 export declare interface UserDefinedFunctionDefinition {
                     /** The id of the {@link UserDefinedFunction} */
                     id?: string;
                     /** The body of the user defined function, it can also be passed as a stringifed function */
                     body?: string | (() => void);
                 }

                 export declare class UserDefinedFunctionResponse extends ResourceResponse<UserDefinedFunctionDefinition & Resource> {
                     constructor(resource: UserDefinedFunctionDefinition & Resource, headers: CosmosHeaders, statusCode: number, udf: UserDefinedFunction, diagnostics: CosmosDiagnostics);
                     /** A reference to the {@link UserDefinedFunction} corresponding to the returned {@link UserDefinedFunctionDefinition}. */
                     readonly userDefinedFunction: UserDefinedFunction;
                     /**
                      * Alias for `userDefinedFunction(id)`.
                      *
                      * A reference to the {@link UserDefinedFunction} corresponding to the returned {@link UserDefinedFunctionDefinition}.
                      */
                     get udf(): UserDefinedFunction;
                 }

                 /**
                  * Used to create, upsert, query, or read all User Defined Functions.
                  *
                  * @see {@link UserDefinedFunction} to read, replace, or delete a given User Defined Function by id.
                  */
                 export declare class UserDefinedFunctions {
                     readonly container: Container;
                     private readonly clientContext;
                     /**
                      * @hidden
                      * @param container - The parent {@link Container}.
                      */
                     constructor(container: Container, clientContext: ClientContext);
                     /**
                      * Query all User Defined Functions.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                     /**
                      * Query all User Defined Functions.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
                     /**
                      * Read all User Defined Functions.
                      * @example Read all User Defined Functions to array.
                      * ```typescript
                      * const {body: udfList} = await container.userDefinedFunctions.readAll().fetchAll();
                      * ```
                      */
                     readAll(options?: FeedOptions): QueryIterator<UserDefinedFunctionDefinition & Resource>;
                     /**
                      * Create a UserDefinedFunction.
                      *
                      * Azure Cosmos DB supports JavaScript UDFs which can be used inside queries, stored procedures and triggers.
                      *
                      * For additional details, refer to the server-side JavaScript API documentation.
                      *
                      */
                     create(body: UserDefinedFunctionDefinition, options?: RequestOptions): Promise<UserDefinedFunctionResponse>;
                 }

                 /**
                  * Enum for udf type values.
                  * Specifies the types of user defined functions.
                  */
                 export declare enum UserDefinedFunctionType {
                     /** The User Defined Function is written in JavaScript. This is currently the only option. */
                     Javascript = "Javascript"
                 }

                 export declare interface UserDefinition {
                     /** The id of the user. */
                     id?: string;
                 }

                 export declare class UserResponse extends ResourceResponse<UserDefinition & Resource> {
                     constructor(resource: UserDefinition & Resource, headers: CosmosHeaders, statusCode: number, user: User, diagnostics: CosmosDiagnostics);
                     /** A reference to the {@link User} corresponding to the returned {@link UserDefinition}. */
                     readonly user: User;
                 }

                 /**
                  * Used to create, upsert, query, and read all users.
                  *
                  * @see {@link User} to read, replace, or delete a specific User by id.
                  */
                 export declare class Users {
                     readonly database: Database;
                     private readonly clientContext;
                     /**
                      * @hidden
                      * @param database - The parent {@link Database}.
                      */
                     constructor(database: Database, clientContext: ClientContext);
                     /**
                      * Query all users.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
                     /**
                      * Query all users.
                      * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
                      */
                     query<T>(query: SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
                     /**
                      * Read all users.-
                      * @example Read all users to array.
                      * ```typescript
                      * const {body: usersList} = await database.users.readAll().fetchAll();
                      * ```
                      */
                     readAll(options?: FeedOptions): QueryIterator<UserDefinition & Resource>;
                     /**
                      * Create a database user with the specified {@link UserDefinition}.
                      * @param body - The specified {@link UserDefinition}.
                      */
                     create(body: UserDefinition, options?: RequestOptions): Promise<UserResponse>;
                     /**
                      * Upsert a database user with a specified {@link UserDefinition}.
                      * @param body - The specified {@link UserDefinition}.
                      */
                     upsert(body: UserDefinition, options?: RequestOptions): Promise<UserResponse>;
                 }

                 /**
                  * Represents a vector embedding.
                  * A vector embedding is used to define a vector field in the documents.
                  */
                 export declare interface VectorEmbedding {
                     /**
                      * The path to the vector field in the document.
                      */
                     path: string;
                     /**
                      * The number of dimensions in the vector.
                      */
                     dimensions: number;
                     /**
                      * The data type of the vector.
                      */
                     dataType: "float16" | "float32" | "uint8" | "int8";
                     /**
                      * The distance function to use for distance calculation in between vectors.
                      */
                     distanceFunction: "euclidean" | "cosine" | "dotproduct";
                 }

                 /**
                  * Represents the policy configuration for vector embeddings in the Azure Cosmos DB service.
                  */
                 export declare interface VectorEmbeddingPolicy {
                     /**
                      * The vector embeddings to be configured.
                      */
                     vectorEmbeddings: VectorEmbedding[];
                 }

                 /**
                  * Represents a vector index in the Azure Cosmos DB service.
                  * A vector index is used to index vector fields in the documents.
                  */
                 export declare interface VectorIndex {
                     /**
                      * The path to the vector field in the document.
                      * for example, path: "/path/to/vector".
                      */
                     path: string;
                     /**
                      * The index type of the vector.
                      * Currently, flat, diskANN, and quantizedFlat are supported.
                      */
                     type: "flat" | "diskANN" | "quantizedFlat";
                 }

                 declare type VerboseOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

                 export { }
