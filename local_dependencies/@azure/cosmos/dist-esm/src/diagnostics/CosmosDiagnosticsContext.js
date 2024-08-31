// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { getCurrentTimestampInMs } from "../utils/time";
/**
 * @hidden
 * Internal class to hold CosmosDiagnostic aggregate information all through the lifecycle of a request.
 * This object gathers diagnostic information throughout Client operation which may span across multiple
 * Server call, retries etc.
 * Functions - recordFailedAttempt, recordMetaDataQuery, recordEndpointContactEvent are used to ingest
 * data into the context. At the end of operation, getDiagnostics() is used to
 * get final CosmosDiagnostic object.
 */
export class CosmosDiagnosticContext {
    constructor() {
        this.failedAttempts = [];
        this.metadataLookups = [];
        this.gaterwayStatistics = [];
        this.locationEndpointsContacted = new Set();
        this.requestStartTimeUTCinMs = getCurrentTimestampInMs();
    }
    recordFailedAttempt(gaterwayStatistics, retryAttemptNumber) {
        const attempt = {
            attemptNumber: retryAttemptNumber,
            startTimeUTCInMs: gaterwayStatistics.startTimeUTCInMs,
            durationInMs: gaterwayStatistics.durationInMs,
            statusCode: gaterwayStatistics.statusCode,
            substatusCode: gaterwayStatistics.subStatusCode,
            requestPayloadLengthInBytes: gaterwayStatistics.requestPayloadLengthInBytes,
            responsePayloadLengthInBytes: gaterwayStatistics.responsePayloadLengthInBytes,
            activityId: gaterwayStatistics.activityId,
            operationType: gaterwayStatistics.operationType,
            resourceType: gaterwayStatistics.resourceType,
        };
        this.failedAttempts.push(attempt);
    }
    recordNetworkCall(gaterwayStatistics) {
        this.gaterwayStatistics.push(gaterwayStatistics);
    }
    /**
     * Merge given DiagnosticContext to current node's DiagnosticContext, Treating GatewayRequests of
     * given DiagnosticContext, as metadata requests.
     */
    mergeDiagnostics(childDiagnostics, metadataType) {
        // Copy Location endpoints contacted.
        childDiagnostics.locationEndpointsContacted.forEach((endpoint) => this.locationEndpointsContacted.add(endpoint));
        // Copy child nodes's GatewayStatistics to parent's metadata lookups.
        childDiagnostics.gaterwayStatistics.forEach((gateway) => this.metadataLookups.push({
            activityId: gateway.activityId,
            requestPayloadLengthInBytes: gateway.requestPayloadLengthInBytes,
            responsePayloadLengthInBytes: gateway.responsePayloadLengthInBytes,
            startTimeUTCInMs: gateway.startTimeUTCInMs,
            operationType: gateway.operationType,
            resourceType: gateway.resourceType,
            durationInMs: gateway.durationInMs,
            metaDataType: metadataType,
        }));
        // Copy child nodes's metadata lookups to parent's metadata lookups.
        childDiagnostics.metadataLookups.forEach((lookup) => this.metadataLookups.push(lookup));
        // Copy child nodes's failed attempts to parent's failed attempts.
        childDiagnostics.failedAttempts.forEach((lookup) => this.failedAttempts.push(lookup));
    }
    getClientSideStats(endTimeUTCInMs = getCurrentTimestampInMs()) {
        return {
            requestStartTimeUTCInMs: this.requestStartTimeUTCinMs,
            requestDurationInMs: endTimeUTCInMs - this.requestStartTimeUTCinMs,
            totalRequestPayloadLengthInBytes: this.getTotalRequestPayloadLength(),
            totalResponsePayloadLengthInBytes: this.getTotalResponsePayloadLength(),
            locationEndpointsContacted: [...this.locationEndpointsContacted.values()],
            metadataDiagnostics: {
                metadataLookups: [...this.metadataLookups],
            },
            retryDiagnostics: {
                failedAttempts: [...this.failedAttempts],
            },
            gatewayStatistics: this.gaterwayStatistics,
        };
    }
    getTotalRequestPayloadLength() {
        let totalRequestPayloadLength = 0;
        this.gaterwayStatistics.forEach((req) => (totalRequestPayloadLength += req.requestPayloadLengthInBytes));
        this.metadataLookups.forEach((req) => (totalRequestPayloadLength += req.requestPayloadLengthInBytes));
        this.failedAttempts.forEach((req) => (totalRequestPayloadLength += req.requestPayloadLengthInBytes));
        return totalRequestPayloadLength;
    }
    getTotalResponsePayloadLength() {
        let totalResponsePayloadLength = 0;
        this.gaterwayStatistics.forEach((req) => (totalResponsePayloadLength += req.responsePayloadLengthInBytes));
        this.metadataLookups.forEach((req) => (totalResponsePayloadLength += req.responsePayloadLengthInBytes));
        this.failedAttempts.forEach((req) => (totalResponsePayloadLength += req.responsePayloadLengthInBytes));
        return totalResponsePayloadLength;
    }
    recordEndpointResolution(location) {
        this.locationEndpointsContacted.add(location);
    }
}
//# sourceMappingURL=CosmosDiagnosticsContext.js.map