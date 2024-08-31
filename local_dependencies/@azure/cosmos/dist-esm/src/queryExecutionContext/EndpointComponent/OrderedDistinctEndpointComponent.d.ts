import { QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { RUConsumedManager } from "../../common";
/** @hidden */
export declare class OrderedDistinctEndpointComponent implements ExecutionContext {
    private executionContext;
    private hashedLastResult;
    constructor(executionContext: ExecutionContext);
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
//# sourceMappingURL=OrderedDistinctEndpointComponent.d.ts.map