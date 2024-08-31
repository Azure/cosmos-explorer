import { ClientContext } from "../ClientContext";
import { RUConsumedManager } from "../common";
import { FeedOptions, QueryOperationOptions, Response } from "../request";
import { PartitionedQueryExecutionInfo } from "../request/ErrorResponse";
import { DocumentProducer } from "./documentProducer";
import { ExecutionContext } from "./ExecutionContext";
import { SqlQuerySpec } from "./SqlQuerySpec";
import { DiagnosticNodeInternal } from "../diagnostics/DiagnosticNodeInternal";
/** @hidden */
export declare enum ParallelQueryExecutionContextBaseStates {
    started = "started",
    inProgress = "inProgress",
    ended = "ended"
}
/** @hidden */
export declare abstract class ParallelQueryExecutionContextBase implements ExecutionContext {
    private clientContext;
    private collectionLink;
    private query;
    private options;
    private partitionedQueryExecutionInfo;
    private err;
    private state;
    private static STATES;
    private routingProvider;
    protected sortOrders: any;
    private requestContinuation;
    private respHeaders;
    private orderByPQ;
    private diagnosticNodeWrapper;
    private initializedPriorityQueue;
    private ruCapExceededError;
    /**
     * Semaphore for Controlling Concurrent Access to the `nextItem` Method
     *
     * serializes access to the `nextItem` method,
     * preventing concurrent issues during initialization, document producer
     * handling, diagnostic node updates, and error propagation.
     */
    private nextItemfetchSemaphore;
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
    constructor(clientContext: ClientContext, collectionLink: string, query: string | SqlQuerySpec, options: FeedOptions, partitionedQueryExecutionInfo: PartitionedQueryExecutionInfo);
    protected abstract documentProducerComparator(dp1: DocumentProducer, dp2: DocumentProducer): number;
    private _mergeWithActiveResponseHeaders;
    private _getAndResetActiveResponseHeaders;
    private getDiagnosticNode;
    private _onTargetPartitionRanges;
    /**
     * Gets the replacement ranges for a partitionkeyrange that has been split
     */
    private _getReplacementPartitionKeyRanges;
    /**
     * Removes the current document producer from the priqueue,
     * replaces that document producer with child document producers,
     * then reexecutes the originFunction with the corrrected executionContext
     */
    private _repairExecutionContext;
    private static _needPartitionKeyRangeCacheRefresh;
    /**
     * Checks to see if the executionContext needs to be repaired.
     * if so it repairs the execution context and executes the ifCallback,
     * else it continues with the current execution context and executes the elseCallback
     */
    private _repairExecutionContextIfNeeded;
    /**
     * Fetches the next element in the ParallelQueryExecutionContextBase.
     */
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    private _updateErrorObjectWithBufferedData;
    /**
     * Determine if there are still remaining resources to processs based on the value of the continuation
     * token or the elements remaining on the current batch in the QueryIterator.
     * @returns true if there is other elements to process in the ParallelQueryExecutionContextBase.
     */
    hasMoreResults(): boolean;
    /**
     * Creates document producers
     */
    private _createTargetPartitionQueryExecutionContext;
    private _createDocumentProducersAndFillUpPriorityQueue;
    private _processAndEnqueueDocumentProducer;
}
//# sourceMappingURL=parallelQueryExecutionContextBase.d.ts.map