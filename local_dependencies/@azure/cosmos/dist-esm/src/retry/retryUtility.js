// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { Constants } from "../common/constants";
import { sleep } from "../common/helper";
import { StatusCodes, SubStatusCodes } from "../common/statusCodes";
import { DiagnosticNodeType } from "../diagnostics/DiagnosticNodeInternal";
import { TimeoutErrorCode } from "../request/TimeoutError";
import { addDignosticChild } from "../utils/diagnostics";
import { getCurrentTimestampInMs } from "../utils/time";
import { DefaultRetryPolicy } from "./defaultRetryPolicy";
import { EndpointDiscoveryRetryPolicy } from "./endpointDiscoveryRetryPolicy";
import { ResourceThrottleRetryPolicy } from "./resourceThrottleRetryPolicy";
import { SessionRetryPolicy } from "./sessionRetryPolicy";
import { TimeoutFailoverRetryPolicy } from "./timeoutFailoverRetryPolicy";
/**
 * @hidden
 */
export async function execute({ diagnosticNode, retryContext = { retryCount: 0 }, retryPolicies, requestContext, executeRequest, }) {
    // TODO: any response
    return addDignosticChild(async (localDiagnosticNode) => {
        localDiagnosticNode.addData({ requestAttempNumber: retryContext.retryCount });
        if (!retryPolicies) {
            retryPolicies = {
                endpointDiscoveryRetryPolicy: new EndpointDiscoveryRetryPolicy(requestContext.globalEndpointManager, requestContext.operationType),
                resourceThrottleRetryPolicy: new ResourceThrottleRetryPolicy(requestContext.connectionPolicy.retryOptions.maxRetryAttemptCount, requestContext.connectionPolicy.retryOptions.fixedRetryIntervalInMilliseconds, requestContext.connectionPolicy.retryOptions.maxWaitTimeInSeconds),
                sessionReadRetryPolicy: new SessionRetryPolicy(requestContext.globalEndpointManager, requestContext.resourceType, requestContext.operationType, requestContext.connectionPolicy),
                defaultRetryPolicy: new DefaultRetryPolicy(requestContext.operationType),
                timeoutFailoverRetryPolicy: new TimeoutFailoverRetryPolicy(requestContext.globalEndpointManager, requestContext.headers, requestContext.method, requestContext.resourceType, requestContext.operationType, requestContext.connectionPolicy.enableEndpointDiscovery),
            };
        }
        if (retryContext && retryContext.clearSessionTokenNotAvailable) {
            requestContext.client.clearSessionToken(requestContext.path);
            delete requestContext.headers["x-ms-session-token"];
        }
        if (retryContext && retryContext.retryLocationServerIndex) {
            requestContext.endpoint = await requestContext.globalEndpointManager.resolveServiceEndpoint(localDiagnosticNode, requestContext.resourceType, requestContext.operationType, retryContext.retryLocationServerIndex);
        }
        else {
            requestContext.endpoint = await requestContext.globalEndpointManager.resolveServiceEndpoint(localDiagnosticNode, requestContext.resourceType, requestContext.operationType);
        }
        const startTimeUTCInMs = getCurrentTimestampInMs();
        try {
            const response = await executeRequest(localDiagnosticNode, requestContext);
            response.headers[Constants.ThrottleRetryCount] =
                retryPolicies.resourceThrottleRetryPolicy.currentRetryAttemptCount;
            response.headers[Constants.ThrottleRetryWaitTimeInMs] =
                retryPolicies.resourceThrottleRetryPolicy.cummulativeWaitTimeinMs;
            return response;
        }
        catch (err) {
            // TODO: any error
            let retryPolicy = null;
            const headers = err.headers || {};
            if (err.code === StatusCodes.ENOTFOUND ||
                err.code === "REQUEST_SEND_ERROR" ||
                (err.code === StatusCodes.Forbidden &&
                    (err.substatus === SubStatusCodes.DatabaseAccountNotFound ||
                        err.substatus === SubStatusCodes.WriteForbidden))) {
                retryPolicy = retryPolicies.endpointDiscoveryRetryPolicy;
            }
            else if (err.code === StatusCodes.TooManyRequests) {
                retryPolicy = retryPolicies.resourceThrottleRetryPolicy;
            }
            else if (err.code === StatusCodes.NotFound &&
                err.substatus === SubStatusCodes.ReadSessionNotAvailable) {
                retryPolicy = retryPolicies.sessionReadRetryPolicy;
            }
            else if (err.code === StatusCodes.ServiceUnavailable || err.code === TimeoutErrorCode) {
                retryPolicy = retryPolicies.timeoutFailoverRetryPolicy;
            }
            else {
                retryPolicy = retryPolicies.defaultRetryPolicy;
            }
            const results = await retryPolicy.shouldRetry(err, localDiagnosticNode, retryContext, requestContext.endpoint);
            if (!results) {
                headers[Constants.ThrottleRetryCount] =
                    retryPolicies.resourceThrottleRetryPolicy.currentRetryAttemptCount;
                headers[Constants.ThrottleRetryWaitTimeInMs] =
                    retryPolicies.resourceThrottleRetryPolicy.cummulativeWaitTimeinMs;
                err.headers = Object.assign(Object.assign({}, err.headers), headers);
                throw err;
            }
            else {
                requestContext.retryCount++;
                const newUrl = results[1]; // TODO: any hack
                if (newUrl !== undefined) {
                    requestContext.endpoint = newUrl;
                }
                localDiagnosticNode.recordFailedNetworkCall(startTimeUTCInMs, requestContext, retryContext.retryCount, err.code, err.subsstatusCode, headers);
                await sleep(retryPolicy.retryAfterInMs);
                return execute({
                    diagnosticNode,
                    executeRequest,
                    requestContext,
                    retryContext,
                    retryPolicies,
                });
            }
        }
    }, diagnosticNode, DiagnosticNodeType.HTTP_REQUEST);
}
//# sourceMappingURL=retryUtility.js.map