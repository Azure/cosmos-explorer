import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { RUConsumedManager } from "../../common";
/** @hidden */
export declare class OrderByEndpointComponent implements ExecutionContext {
    private executionContext;
    /**
     * Represents an endpoint in handling an order by query. For each processed orderby
     * result it returns 'payload' item of the result
     *
     * @param executionContext - Underlying Execution Context
     * @hidden
     */
    constructor(executionContext: ExecutionContext);
    /**
     * Execute a provided function on the next element in the OrderByEndpointComponent.
     */
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    /**
     * Determine if there are still remaining resources to processs.
     * @returns true if there is other elements to process in the OrderByEndpointComponent.
     */
    hasMoreResults(): boolean;
}
//# sourceMappingURL=OrderByEndpointComponent.d.ts.map