import { QueryOperationOptions, Response } from "../../request";
import { ExecutionContext } from "../ExecutionContext";
import { QueryInfo } from "../../request/ErrorResponse";
import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
import { RUConsumedManager } from "../../common";
/** @hidden */
export declare class GroupByValueEndpointComponent implements ExecutionContext {
    private executionContext;
    private queryInfo;
    private readonly aggregators;
    private readonly aggregateResultArray;
    private aggregateType;
    private completed;
    constructor(executionContext: ExecutionContext, queryInfo: QueryInfo);
    nextItem(diagnosticNode: DiagnosticNodeInternal, operationOptions?: QueryOperationOptions, ruConsumedManager?: RUConsumedManager): Promise<Response<any>>;
    hasMoreResults(): boolean;
}
//# sourceMappingURL=GroupByValueEndpointComponent.d.ts.map