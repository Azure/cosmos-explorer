import { RequestContext } from "./RequestContext";
import { Response as CosmosResponse } from "./Response";
import { DiagnosticNodeInternal } from "../diagnostics/DiagnosticNodeInternal";
/**
 * @hidden
 */
declare function request<T>(requestContext: RequestContext, diagnosticNode: DiagnosticNodeInternal): Promise<CosmosResponse<T>>;
export declare const RequestHandler: {
    request: typeof request;
};
export {};
//# sourceMappingURL=RequestHandler.d.ts.map