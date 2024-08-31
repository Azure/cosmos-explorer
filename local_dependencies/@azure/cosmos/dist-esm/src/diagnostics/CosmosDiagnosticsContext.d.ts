import { ClientSideRequestStatistics, GatewayStatistics, MetadataLookUpType } from "../CosmosDiagnostics";
/**
 * @hidden
 * Internal class to hold CosmosDiagnostic aggregate information all through the lifecycle of a request.
 * This object gathers diagnostic information throughout Client operation which may span across multiple
 * Server call, retries etc.
 * Functions - recordFailedAttempt, recordMetaDataQuery, recordEndpointContactEvent are used to ingest
 * data into the context. At the end of operation, getDiagnostics() is used to
 * get final CosmosDiagnostic object.
 */
export declare class CosmosDiagnosticContext {
    private requestStartTimeUTCinMs;
    private failedAttempts;
    private metadataLookups;
    private gaterwayStatistics;
    locationEndpointsContacted: Set<string>;
    constructor();
    recordFailedAttempt(gaterwayStatistics: GatewayStatistics, retryAttemptNumber: number): void;
    recordNetworkCall(gaterwayStatistics: GatewayStatistics): void;
    /**
     * Merge given DiagnosticContext to current node's DiagnosticContext, Treating GatewayRequests of
     * given DiagnosticContext, as metadata requests.
     */
    mergeDiagnostics(childDiagnostics: CosmosDiagnosticContext, metadataType: MetadataLookUpType): void;
    getClientSideStats(endTimeUTCInMs?: number): ClientSideRequestStatistics;
    getTotalRequestPayloadLength(): number;
    getTotalResponsePayloadLength(): number;
    recordEndpointResolution(location: string): void;
}
//# sourceMappingURL=CosmosDiagnosticsContext.d.ts.map