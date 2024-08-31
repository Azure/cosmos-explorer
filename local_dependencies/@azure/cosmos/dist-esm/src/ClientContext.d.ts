import { PartitionKeyRange } from "./client/Container/PartitionKeyRange";
import { Resource } from "./client/Resource";
import { HTTPMethod, ResourceType } from "./common/constants";
import { CosmosClientOptions } from "./CosmosClientOptions";
import { DatabaseAccount, PartitionKey } from "./documents";
import { GlobalEndpointManager } from "./globalEndpointManager";
import { SqlQuerySpec } from "./queryExecutionContext";
import { QueryIterator } from "./queryIterator";
import { FeedOptions, RequestOptions, Response } from "./request";
import { PartitionedQueryExecutionInfo } from "./request/ErrorResponse";
import { BulkOptions } from "./utils/batch";
import { ClientConfigDiagnostic, CosmosDiagnostics } from "./CosmosDiagnostics";
import { DiagnosticNodeInternal } from "./diagnostics/DiagnosticNodeInternal";
import { CosmosDbDiagnosticLevel } from "./diagnostics/CosmosDbDiagnosticLevel";
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
    }): Promise<Response<T & Resource>>;
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
    }): Promise<Response<T & Resource>>;
    getQueryPlan(path: string, resourceType: ResourceType, resourceId: string, query: SqlQuerySpec | string, options: FeedOptions, diagnosticNode: DiagnosticNodeInternal): Promise<Response<PartitionedQueryExecutionInfo>>;
    queryPartitionKeyRanges(collectionLink: string, query?: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<PartitionKeyRange>;
    delete<T>({ path, resourceType, resourceId, options, partitionKey, method, diagnosticNode, }: {
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        method?: HTTPMethod;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response<T & Resource>>;
    patch<T>({ body, path, resourceType, resourceId, options, partitionKey, diagnosticNode, }: {
        body: any;
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response<T & Resource>>;
    create<T, U = T>({ body, path, resourceType, resourceId, diagnosticNode, options, partitionKey, }: {
        body: T;
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        diagnosticNode: DiagnosticNodeInternal;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
    }): Promise<Response<T & U & Resource>>;
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
    }): Promise<Response<T & Resource>>;
    upsert<T, U = T>({ body, path, resourceType, resourceId, options, partitionKey, diagnosticNode, }: {
        body: T;
        path: string;
        resourceType: ResourceType;
        resourceId: string;
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response<T & U & Resource>>;
    execute<T>({ sprocLink, params, options, partitionKey, diagnosticNode, }: {
        sprocLink: string;
        params?: any[];
        options?: RequestOptions;
        partitionKey?: PartitionKey;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response<T>>;
    /**
     * Gets the Database account information.
     * @param options - `urlConnection` in the options is the endpoint url whose database account needs to be retrieved.
     * If not present, current client's url will be used.
     */
    getDatabaseAccount(diagnosticNode: DiagnosticNodeInternal, options?: RequestOptions): Promise<Response<DatabaseAccount>>;
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
    }): Promise<Response<any>>;
    bulk<T>({ body, path, partitionKeyRangeId, resourceId, bulkOptions, options, diagnosticNode, }: {
        body: T;
        path: string;
        partitionKeyRangeId: string;
        resourceId: string;
        bulkOptions?: BulkOptions;
        options?: RequestOptions;
        diagnosticNode: DiagnosticNodeInternal;
    }): Promise<Response<any>>;
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
//# sourceMappingURL=ClientContext.d.ts.map