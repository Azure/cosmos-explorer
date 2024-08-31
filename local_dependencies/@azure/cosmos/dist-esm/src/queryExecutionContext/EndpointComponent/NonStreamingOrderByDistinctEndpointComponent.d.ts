import { QueryInfo, QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { RUConsumedManager } from "../../common";
/** @hidden */
export declare class NonStreamingOrderByDistinctEndpointComponent implements ExecutionContext {
    private executionContext;
    private queryInfo;
    private priorityQueueBufferSize;
    private aggregateMap;
    private nonStreamingOrderByPQ;
    private finalResultArray;
    private sortOrders;
    private isCompleted;
    constructor(executionContext: ExecutionContext, queryInfo: QueryInfo, priorityQueueBufferSize: number);
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    /**
     * Build final sorted result array from which responses will be served.
     */
    private buildFinalResultArray;
    hasMoreResults(): boolean;
}
//# sourceMappingURL=NonStreamingOrderByDistinctEndpointComponent.d.ts.map