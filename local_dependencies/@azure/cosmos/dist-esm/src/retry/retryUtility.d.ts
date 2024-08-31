import { DiagnosticNodeInternal } from "../diagnostics/DiagnosticNodeInternal";
import { Response } from "../request";
import { RequestContext } from "../request/RequestContext";
import { DefaultRetryPolicy } from "./defaultRetryPolicy";
import { EndpointDiscoveryRetryPolicy } from "./endpointDiscoveryRetryPolicy";
import { ResourceThrottleRetryPolicy } from "./resourceThrottleRetryPolicy";
import { RetryContext } from "./RetryContext";
import { SessionRetryPolicy } from "./sessionRetryPolicy";
import { TimeoutFailoverRetryPolicy } from "./timeoutFailoverRetryPolicy";
/**
 * @hidden
 */
interface ExecuteArgs {
    retryContext?: RetryContext;
    diagnosticNode: DiagnosticNodeInternal;
    retryPolicies?: RetryPolicies;
    requestContext: RequestContext;
    executeRequest: (diagnosticNode: DiagnosticNodeInternal, requestContext: RequestContext) => Promise<Response<any>>;
}
/**
 * @hidden
 */
interface RetryPolicies {
    endpointDiscoveryRetryPolicy: EndpointDiscoveryRetryPolicy;
    resourceThrottleRetryPolicy: ResourceThrottleRetryPolicy;
    sessionReadRetryPolicy: SessionRetryPolicy;
    defaultRetryPolicy: DefaultRetryPolicy;
    timeoutFailoverRetryPolicy: TimeoutFailoverRetryPolicy;
}
/**
 * @hidden
 */
export declare function execute({ diagnosticNode, retryContext, retryPolicies, requestContext, executeRequest, }: ExecuteArgs): Promise<Response<any>>;
export {};
//# sourceMappingURL=retryUtility.d.ts.map