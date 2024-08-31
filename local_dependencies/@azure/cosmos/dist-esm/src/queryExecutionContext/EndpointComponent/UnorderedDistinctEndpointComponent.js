import { hashObject } from "../../utils/hashObject";
import { RUCapPerOperationExceededErrorCode } from "../../request/RUCapPerOperationExceededError";
/** @hidden */
export class UnorderedDistinctEndpointComponent {
    constructor(executionContext) {
        this.executionContext = executionContext;
        this.hashedResults = new Set();
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        try {
            const { headers, result } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
            if (result) {
                const hashedResult = await hashObject(result);
                if (this.hashedResults.has(hashedResult)) {
                    return { result: undefined, headers };
                }
                this.hashedResults.add(hashedResult);
            }
            return { result, headers };
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
    }
    hasMoreResults() {
        return this.executionContext.hasMoreResults();
    }
}
//# sourceMappingURL=UnorderedDistinctEndpointComponent.js.map