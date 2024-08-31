import { __asyncGenerator, __await } from "tslib";
import { ChangeFeedIteratorResponse } from "./ChangeFeedIteratorResponse";
import { Constants, ResourceType } from "../../common";
import { ErrorResponse } from "../../request";
import { ContinuationTokenForPartitionKey } from "./ContinuationTokenForPartitionKey";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
/**
 * @hidden
 * Provides iterator for change feed for one partition key.
 *
 * Use `Items.getChangeFeedIterator()` to get an instance of the iterator.
 */
export class ChangeFeedForPartitionKey {
    /**
     * @internal
     */
    constructor(clientContext, container, resourceId, resourceLink, partitionKey, changeFeedOptions) {
        this.clientContext = clientContext;
        this.container = container;
        this.resourceId = resourceId;
        this.resourceLink = resourceLink;
        this.partitionKey = partitionKey;
        this.changeFeedOptions = changeFeedOptions;
        this.continuationToken = changeFeedOptions.continuationToken
            ? JSON.parse(changeFeedOptions.continuationToken)
            : undefined;
        this.isInstantiated = false;
        if (changeFeedOptions.startTime) {
            this.startTime = changeFeedOptions.startTime.toUTCString();
        }
    }
    async instantiateIterator(diagnosticNode) {
        await this.setIteratorRid(diagnosticNode);
        if (this.continuationToken) {
            if (!this.continuationTokenRidMatchContainerRid()) {
                throw new ErrorResponse("The continuation is not for the current container definition.");
            }
        }
        else {
            this.continuationToken = new ContinuationTokenForPartitionKey(this.rId, this.partitionKey, "");
        }
        this.isInstantiated = true;
    }
    continuationTokenRidMatchContainerRid() {
        if (this.continuationToken.rid !== this.rId) {
            return false;
        }
        return true;
    }
    async setIteratorRid(diagnosticNode) {
        const { resource } = await this.container.readInternal(diagnosticNode);
        this.rId = resource._rid;
    }
    /**
     * Change feed is an infinite feed. hasMoreResults is always true.
     */
    get hasMoreResults() {
        return true;
    }
    /**
     * Gets an async iterator which will yield change feed results.
     */
    getAsyncIterator() {
        return __asyncGenerator(this, arguments, function* getAsyncIterator_1() {
            do {
                const result = yield __await(this.readNext());
                yield yield __await(result);
            } while (this.hasMoreResults);
        });
    }
    /**
     * Returns the result of change feed from Azure Cosmos DB.
     */
    async readNext() {
        return withDiagnostics(async (diagnosticNode) => {
            if (!this.isInstantiated) {
                await this.instantiateIterator(diagnosticNode);
            }
            const result = await this.fetchNext(diagnosticNode);
            return result;
        }, this.clientContext);
    }
    /**
     * Read feed and retrieves the next set of results in Azure Cosmos DB.
     */
    async fetchNext(diagnosticNode) {
        const response = await this.getFeedResponse(diagnosticNode);
        this.continuationToken.Continuation = response.headers[Constants.HttpHeaders.ETag];
        response.headers[Constants.HttpHeaders.ContinuationToken] = JSON.stringify(this.continuationToken);
        return response;
    }
    async getFeedResponse(diagnosticNode) {
        const feedOptions = { initialHeaders: {}, useIncrementalFeed: true };
        if (typeof this.changeFeedOptions.maxItemCount === "number") {
            feedOptions.maxItemCount = this.changeFeedOptions.maxItemCount;
        }
        if (this.changeFeedOptions.sessionToken) {
            feedOptions.sessionToken = this.changeFeedOptions.sessionToken;
        }
        const continuation = this.continuationToken.Continuation;
        if (continuation) {
            feedOptions.accessCondition = {
                type: Constants.HttpHeaders.IfNoneMatch,
                condition: continuation,
            };
        }
        if (this.startTime) {
            feedOptions.initialHeaders[Constants.HttpHeaders.IfModifiedSince] = this.startTime;
        }
        const response = await this.clientContext.queryFeed({
            path: this.resourceLink,
            resourceType: ResourceType.item,
            resourceId: this.resourceId,
            resultFn: (result) => (result ? result.Documents : []),
            diagnosticNode,
            query: undefined,
            options: feedOptions,
            partitionKey: this.partitionKey,
        });
        return new ChangeFeedIteratorResponse(response.result, response.result ? response.result.length : 0, response.code, response.headers, getEmptyCosmosDiagnostics());
    }
}
//# sourceMappingURL=ChangeFeedForPartitionKey.js.map