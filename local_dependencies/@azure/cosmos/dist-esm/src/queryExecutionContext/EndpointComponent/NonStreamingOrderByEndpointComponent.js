import { OrderByComparator } from "../orderByComparator";
import { NonStreamingOrderByPriorityQueue } from "../../utils/nonStreamingOrderByPriorityQueue";
import { getInitialHeader } from "../headerUtils";
import { RUCapPerOperationExceededErrorCode } from "../../request/RUCapPerOperationExceededError";
export class NonStreamingOrderByEndpointComponent {
    /**
     * Represents an endpoint in handling an non-streaming order by query. For each processed orderby
     * result it returns 'payload' item of the result
     *
     * @param executionContext - Underlying Execution Context
     * @hidden
     */
    constructor(executionContext, sortOrders, priorityQueueBufferSize = 2000, offset = 0) {
        this.executionContext = executionContext;
        this.sortOrders = sortOrders;
        this.priorityQueueBufferSize = priorityQueueBufferSize;
        this.offset = offset;
        this.isCompleted = false;
        const comparator = new OrderByComparator(this.sortOrders);
        this.nonStreamingOrderByPQ = new NonStreamingOrderByPriorityQueue((a, b) => {
            return comparator.compareItems(b, a);
        }, this.priorityQueueBufferSize);
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        var _a, _b;
        if (this.priorityQueueBufferSize <= 0 ||
            (this.isCompleted && this.nonStreamingOrderByPQ.isEmpty())) {
            return {
                result: undefined,
                headers: getInitialHeader(),
            };
        }
        if (this.isCompleted && !this.nonStreamingOrderByPQ.isEmpty()) {
            const item = (_a = this.nonStreamingOrderByPQ.dequeue()) === null || _a === void 0 ? void 0 : _a.payload;
            return {
                result: item,
                headers: getInitialHeader(),
            };
        }
        try {
            if (this.executionContext.hasMoreResults()) {
                const { result: item, headers } = await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager);
                if (item !== undefined) {
                    this.nonStreamingOrderByPQ.enqueue(item);
                }
                return {
                    result: {},
                    headers,
                };
            }
            else {
                this.isCompleted = true;
                // Reverse the priority queue to get the results in the correct order
                this.nonStreamingOrderByPQ = this.nonStreamingOrderByPQ.reverse();
                // For offset limit case we set the size of priority queue to offset + limit
                // and we drain offset number of items from the priority queue
                while (this.offset < this.priorityQueueBufferSize && this.offset > 0) {
                    this.nonStreamingOrderByPQ.dequeue();
                    this.offset--;
                }
                if (this.nonStreamingOrderByPQ.size() !== 0) {
                    const item = (_b = this.nonStreamingOrderByPQ.dequeue()) === null || _b === void 0 ? void 0 : _b.payload;
                    return {
                        result: item,
                        headers: getInitialHeader(),
                    };
                }
                else {
                    return {
                        result: undefined,
                        headers: getInitialHeader(),
                    };
                }
            }
        }
        catch (err) {
            if (err.code === RUCapPerOperationExceededErrorCode) {
                err.fetchedResults = undefined;
            }
            throw err;
        }
    }
    /**
     * Determine if there are still remaining resources to processs.
     * @returns true if there is other elements to process in the NonStreamingOrderByEndpointComponent.
     */
    hasMoreResults() {
        return (this.priorityQueueBufferSize > 0 &&
            (this.executionContext.hasMoreResults() || this.nonStreamingOrderByPQ.size() !== 0));
    }
}
//# sourceMappingURL=NonStreamingOrderByEndpointComponent.js.map