import { hashObject } from "../../utils/hashObject";
import { RUCapPerOperationExceededErrorCode } from "../../request/RUCapPerOperationExceededError";
/** @hidden */
export class OrderedDistinctEndpointComponent {
    constructor(executionContext) {
        this.executionContext = executionContext;
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        try {
            const { headers, result } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
            if (result) {
                const hashedResult = await hashObject(result);
                if (hashedResult === this.hashedLastResult) {
                    return { result: undefined, headers };
                }
                this.hashedLastResult = hashedResult;
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
//# sourceMappingURL=OrderedDistinctEndpointComponent.js.map