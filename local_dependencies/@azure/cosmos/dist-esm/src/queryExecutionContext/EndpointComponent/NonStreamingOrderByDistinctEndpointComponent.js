import { getInitialHeader } from "../headerUtils";
import { hashObject } from "../../utils/hashObject";
import { NonStreamingOrderByPriorityQueue } from "../../utils/nonStreamingOrderByPriorityQueue";
import { NonStreamingOrderByMap } from "../../utils/nonStreamingOrderByMap";
import { OrderByComparator } from "../orderByComparator";
/** @hidden */
export class NonStreamingOrderByDistinctEndpointComponent {
    constructor(executionContext, queryInfo, priorityQueueBufferSize) {
        this.executionContext = executionContext;
        this.queryInfo = queryInfo;
        this.priorityQueueBufferSize = priorityQueueBufferSize;
        this.isCompleted = false;
        this.sortOrders = this.queryInfo.orderBy;
        const comparator = new OrderByComparator(this.sortOrders);
        this.aggregateMap = new NonStreamingOrderByMap((a, b) => {
            return comparator.compareItems(a, b);
        });
        this.nonStreamingOrderByPQ = new NonStreamingOrderByPriorityQueue((a, b) => {
            return comparator.compareItems(b, a);
        }, this.priorityQueueBufferSize);
    }
    async nextItem(diagnosticNode, operationOptions, ruConsumedManager) {
        // if size is 0, just return undefined. Valid if query is TOP 0 or LIMIT 0
        if (this.priorityQueueBufferSize === 0) {
            return {
                result: undefined,
                headers: getInitialHeader(),
            };
        }
        let resHeaders = getInitialHeader();
        if (!this.isCompleted && this.executionContext.hasMoreResults()) {
            // Grab the next result
            const { result, headers } = (await this.executionContext.nextItem(diagnosticNode, operationOptions, ruConsumedManager));
            resHeaders = headers;
            if (result) {
                // make hash of result object and update the map if required.
                const key = await hashObject(result === null || result === void 0 ? void 0 : result.payload);
                this.aggregateMap.set(key, result);
            }
            if (!this.executionContext.hasMoreResults()) {
                this.isCompleted = true;
                await this.buildFinalResultArray();
            }
        }
        if (this.isCompleted) {
            // start returning the results if final result is computed.
            if (this.finalResultArray.length > 0) {
                return {
                    result: this.finalResultArray.shift(),
                    headers: resHeaders,
                };
            }
            else {
                return {
                    result: undefined,
                    headers: getInitialHeader(),
                };
            }
        }
        else {
            // keep returning empty till final results are getting computed.
            return {
                result: {},
                headers: resHeaders,
            };
        }
    }
    /**
     * Build final sorted result array from which responses will be served.
     */
    async buildFinalResultArray() {
        var _a;
        const allValues = this.aggregateMap.getAllValues();
        for (const value of allValues) {
            this.nonStreamingOrderByPQ.enqueue(value);
        }
        const offSet = this.queryInfo.offset ? this.queryInfo.offset : 0;
        const queueSize = this.nonStreamingOrderByPQ.size();
        const finalArraySize = queueSize - offSet;
        if (finalArraySize <= 0) {
            this.finalResultArray = [];
        }
        else {
            this.finalResultArray = new Array(finalArraySize);
            for (let count = finalArraySize - 1; count >= 0; count--) {
                this.finalResultArray[count] = (_a = this.nonStreamingOrderByPQ.dequeue()) === null || _a === void 0 ? void 0 : _a.payload;
            }
        }
    }
    hasMoreResults() {
        if (this.priorityQueueBufferSize === 0)
            return false;
        return this.executionContext.hasMoreResults() || this.finalResultArray.length > 0;
    }
}
//# sourceMappingURL=NonStreamingOrderByDistinctEndpointComponent.js.map