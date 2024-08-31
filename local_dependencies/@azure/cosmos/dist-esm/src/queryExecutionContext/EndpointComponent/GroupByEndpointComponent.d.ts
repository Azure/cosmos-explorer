import { QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { QueryInfo } from "../../request/ErrorResponse";
import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { RUConsumedManager } from "../../common";
/** @hidden */
export declare class GroupByEndpointComponent implements ExecutionContext {
    private executionContext;
    private queryInfo;
    constructor(executionContext: ExecutionContext, queryInfo: QueryInfo);
    private readonly groupings;
    private readonly aggregateResultArray;
    private completed;
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
//# sourceMappingURL=GroupByEndpointComponent.d.ts.map