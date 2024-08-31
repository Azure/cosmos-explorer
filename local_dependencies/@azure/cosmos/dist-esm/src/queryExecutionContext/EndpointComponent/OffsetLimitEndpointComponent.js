import { RUCapPerOperationExceededErrorCode } from "../../request/RUCapPerOperationExceededError";
import { getInitialHeader, mergeHeaders } from "../headerUtils";
/** @hidden */
export class OffsetLimitEndpointComponent {
    constructor(executionContext, offset, limit) {
        this.executionContext = executionContext;
        this.offset = offset;
        this.limit = limit;
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        const aggregateHeaders = getInitialHeader();
        try {
            while (this.offset > 0) {
                // Grab next item but ignore the result. We only need the headers
                const { headers } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
                this.offset--;
                mergeHeaders(aggregateHeaders, headers);
            }
            if (this.limit > 0) {
                const { result, headers } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
                this.limit--;
                mergeHeaders(aggregateHeaders, headers);
                return { result, headers: aggregateHeaders };
            }
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
        // If both limit and offset are 0, return nothing
        return {
            result: undefined,
            headers: getInitialHeader(),
        };
    }
    hasMoreResults() {
        return (this.offset > 0 || this.limit > 0) && this.executionContext.hasMoreResults();
    }
}
//# sourceMappingURL=OffsetLimitEndpointComponent.js.map