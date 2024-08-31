import { ErrorResponse } from "./ErrorResponse";
/**
 * @hidden
 */
export declare const RUCapPerOperationExceededErrorCode = "OPERATION_RU_LIMIT_EXCEEDED";
export declare class RUCapPerOperationExceededError extends ErrorResponse {
    readonly code: string;
    fetchedResults: any[];
    constructor(message?: string, fetchedResults?: any[]);
}
//# sourceMappingURL=RUCapPerOperationExceededError.d.ts.map