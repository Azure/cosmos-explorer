import { QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { RUConsumedManager } from "../../common";
/** @hidden */
export declare class UnorderedDistinctEndpointComponent implements ExecutionContext {
    private executionContext;
    private hashedResults;
    constructor(executionContext: ExecutionContext);
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
//# sourceMappingURL=UnorderedDistinctEndpointComponent.d.ts.map