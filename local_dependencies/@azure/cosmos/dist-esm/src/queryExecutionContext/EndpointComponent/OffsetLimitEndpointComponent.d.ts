import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { RUConsumedManager } from "../../common";
/** @hidden */
export declare class OffsetLimitEndpointComponent implements ExecutionContext {
    private executionContext;
    private offset;
    private limit;
    constructor(executionContext: ExecutionContext, offset: number, limit: number);
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
//# sourceMappingURL=OffsetLimitEndpointComponent.d.ts.map