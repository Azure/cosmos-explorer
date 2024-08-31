// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { ErrorResponse } from "./ErrorResponse";
/**
 * @hidden
 */
export const RUCapPerOperationExceededErrorCode = "OPERATION_RU_LIMIT_EXCEEDED";
export class RUCapPerOperationExceededError extends ErrorResponse {
    constructor(message = "Request Unit limit per Operation call exceeded", fetchedResults = []) {
        super(message);
        this.code = RUCapPerOperationExceededErrorCode;
        this.code = RUCapPerOperationExceededErrorCode;
        this.body = {
            code: RUCapPerOperationExceededErrorCode,
            message,
        };
        this.fetchedResults = fetchedResults;
    }
}
//# sourceMappingURL=RUCapPerOperationExceededError.js.map