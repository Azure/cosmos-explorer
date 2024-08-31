import { ClientContext } from "../ClientContext";
import { Response, FeedOptions, QueryOperationOptions } from "../request";
import { PartitionedQueryExecutionInfo } from "../request/ErrorResponse";
import { ExecutionContext } from "./ExecutionContext";
import { SqlQuerySpec } from "./SqlQuerySpec";
import { DiagnosticNodeInternal } from "../diagnostics/DiagnosticNodeInternal";
import { RUConsumedManager } from "../common";
/** @hidden */
export declare class PipelinedQueryExecutionContext implements ExecutionContext {
    private clientContext;
    private collectionLink;
    private query;
    private options;
    private partitionedQueryExecutionInfo;
    private fetchBuffer;
    private fetchMoreRespHeaders;
    private endpoint;
    private pageSize;
    private vectorSearchBufferSize;
    private static DEFAULT_PAGE_SIZE;
    private static DEFAULT_VECTOR_SEARCH_BUFFER_SIZE;
    private nonStreamingOrderBy;
    constructor(clientContext: ClientContext, collectionLink: string, query: string | SqlQuerySpec, options: FeedOptions, partitionedQueryExecutionInfo: PartitionedQueryExecutionInfo);
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    hasMoreResults(): boolean;
    fetchMore(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    private _fetchMoreImplementation;
    private _nonStreamingFetchMoreImplementation;
    private calculateVectorSearchBufferSize;
}
//# sourceMappingURL=pipelinedQueryExecutionContext.d.ts.map