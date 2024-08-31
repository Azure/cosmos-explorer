import { RUConsumedManager } from "../../common/RUConsumedManager";
import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
export declare class NonStreamingOrderByEndpointComponent implements ExecutionContext {
    private executionContext;
    private sortOrders;
    private priorityQueueBufferSize;
    private offset;
    private nonStreamingOrderByPQ;
    private isCompleted;
    /**
     * Represents an endpoint in handling an non-streaming order by query. For each processed orderby
     * result it returns 'payload' item of the result
     *
     * @param executionContext - Underlying Execution Context
     * @hidden
     */
    constructor(executionContext: ExecutionContext, sortOrders: any[], priorityQueueBufferSize?: number, offset?: number);
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    /**
     * Determine if there are still remaining resources to processs.
     * @returns true if there is other elements to process in the NonStreamingOrderByEndpointComponent.
     */
    hasMoreResults(): boolean;
}
//# sourceMappingURL=NonStreamingOrderByEndpointComponent.d.ts.map