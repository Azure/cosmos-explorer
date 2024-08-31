import { DiagnosticNode, MetadataLookUpType } from "../CosmosDiagnostics";
import { CosmosDbDiagnosticLevel } from "./CosmosDbDiagnosticLevel";
import { CosmosHeaders } from "../queryExecutionContext/CosmosHeaders";
import { OperationType, ResourceType } from "../common";
/**
 * @hidden
 * This is Internal Representation for DiagnosticNode. It contains useful helper functions to collect
 * diagnostic information throughout the lifetime of Diagnostic session.
 * The functions toDiagnosticNode() & toDiagnostic() are given to convert it to public facing counterpart.
 */
export declare class DiagnosticNodeInternal implements DiagnosticNode {
    id: string;
    nodeType: DiagnosticNodeType;
    parent: DiagnosticNodeInternal;
    children: DiagnosticNodeInternal[];
    data: Partial<DiagnosticDataValue>;
    startTimeUTCInMs: number;
    durationInMs: number;
    diagnosticLevel: CosmosDbDiagnosticLevel;
    private diagnosticCtx;
}
/**
 * @hidden
 */
export type DiagnosticDataValue = {
    selectedLocation: string;
    activityId: string;
    requestAttempNumber: number;
    requestPayloadLengthInBytes: number;
    responsePayloadLengthInBytes: number;
    responseStatus: number;
    readFromCache: boolean;
    operationType: OperationType;
    metadatOperationType: MetadataLookUpType;
    resourceType: ResourceType;
    failedAttempty: boolean;
    successfulRetryPolicy: string;
    partitionKeyRangeId: string;
    stateful: boolean;
    queryRecordsRead: number;
    queryMethodIdentifier: string;
    log: string[];
    failure: boolean;
    startTimeUTCInMs: number;
    durationInMs: number;
    requestData: Partial<{
        requestPayloadLengthInBytes: number;
        responsePayloadLengthInBytes: number;
        operationType: OperationType;
        resourceType: ResourceType;
        headers: CosmosHeaders;
        requestBody: any;
        responseBody: any;
        url: string;
    }>;
};
/**
 * @hidden
 */
export declare enum DiagnosticNodeType {
    CLIENT_REQUEST_NODE = "CLIENT_REQUEST_NODE",
    METADATA_REQUEST_NODE = "METADATA_REQUEST_NODE",
    HTTP_REQUEST = "HTTP_REQUEST",
    BATCH_REQUEST = "BATCH_REQUEST",
    PARALLEL_QUERY_NODE = "PARALLEL_QUERY_NODE",
    DEFAULT_QUERY_NODE = "DEFAULT_QUERY_NODE",
    QUERY_REPAIR_NODE = "QUERY_REPAIR_NODE",
    BACKGROUND_REFRESH_THREAD = "BACKGROUND_REFRESH_THREAD",
    REQUEST_ATTEMPTS = "REQUEST_ATTEMPTS"
}
//# sourceMappingURL=DiagnosticNodeInternal.d.ts.map