import { __asyncGenerator, __await } from "tslib";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { ChangeFeedRange } from "./ChangeFeedRange";
import { ChangeFeedIteratorResponse } from "./ChangeFeedIteratorResponse";
import { QueryRange } from "../../routing";
import { FeedRangeQueue } from "./FeedRangeQueue";
import { Constants, SubStatusCodes, StatusCodes, ResourceType } from "../../common";
import { ErrorResponse } from "../../request";
import { CompositeContinuationToken } from "./CompositeContinuationToken";
import { extractOverlappingRanges } from "./changeFeedUtils";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
/**
 * @hidden
 * Provides iterator for change feed for entire container or an epk range.
 *
 * Use `Items.getChangeFeedIterator()` to get an instance of the iterator.
 */
export class ChangeFeedForEpkRange {
    /**
     * @internal
     */
    constructor(clientContext, container, partitionKeyRangeCache, resourceId, resourceLink, url, changeFeedOptions, epkRange) {
        this.clientContext = clientContext;
        this.container = container;
        this.partitionKeyRangeCache = partitionKeyRangeCache;
        this.resourceId = resourceId;
        this.resourceLink = resourceLink;
        this.url = url;
        this.changeFeedOptions = changeFeedOptions;
        this.epkRange = epkRange;
        this.generateContinuationToken = () => {
            return JSON.stringify(new CompositeContinuationToken(this.rId, this.queue.returnSnapshot()));
        };
        this.queue = new FeedRangeQueue();
        this.continuationToken = changeFeedOptions.continuationToken
            ? JSON.parse(changeFeedOptions.continuationToken)
            : undefined;
        this.startTime = changeFeedOptions.startTime
            ? changeFeedOptions.startTime.toUTCString()
            : undefined;
        this.isInstantiated = false;
    }
    async setIteratorRid(diagnosticNode) {
        const { resource } = await this.container.readInternal(diagnosticNode);
        this.rId = resource._rid;
    }
    continuationTokenRidMatchContainerRid() {
        if (this.continuationToken.rid !== this.rId) {
            return false;
        }
        return true;
    }
    async fillChangeFeedQueue(diagnosticNode) {
        if (this.continuationToken) {
            // fill the queue with feed ranges in continuation token.
            await this.fetchContinuationTokenFeedRanges(diagnosticNode);
        }
        else {
            // fill the queue with feed ranges overlapping the given epk range.
            await this.fetchOverLappingFeedRanges(diagnosticNode);
        }
        this.isInstantiated = true;
    }
    /**
     * Fill the queue with the feed ranges overlapping with the given epk range.
     */
    async fetchOverLappingFeedRanges(diagnosticNode) {
        try {
            const overLappingRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, this.epkRange, diagnosticNode);
            for (const overLappingRange of overLappingRanges) {
                const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(this.epkRange, overLappingRange);
                const feedRange = new ChangeFeedRange(overLappingRange.minInclusive, overLappingRange.maxExclusive, "", epkMinHeader, epkMaxHeader);
                this.queue.enqueue(feedRange);
            }
        }
        catch (err) {
            throw new ErrorResponse(err.message);
        }
    }
    /**
     * Fill the queue with feed ranges from continuation token
     */
    async fetchContinuationTokenFeedRanges(diagnosticNode) {
        const contToken = this.continuationToken;
        if (!this.continuationTokenRidMatchContainerRid()) {
            throw new ErrorResponse("The continuation token is not for the current container definition");
        }
        else {
            for (const cToken of contToken.Continuation) {
                const queryRange = new QueryRange(cToken.minInclusive, cToken.maxExclusive, true, false);
                try {
                    const overLappingRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, queryRange, diagnosticNode);
                    for (const overLappingRange of overLappingRanges) {
                        // check if the epk range present in continuation token entirely covers the overlapping range.
                        // If yes, minInclusive and maxExclusive of the overlapping range will be set.
                        // If no, i.e. there is only partial overlap, epkMinHeader and epkMaxHeader are set as min and max of overlap.
                        // This will be used when we make a call to fetch change feed.
                        const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(queryRange, overLappingRange);
                        const feedRange = new ChangeFeedRange(overLappingRange.minInclusive, overLappingRange.maxExclusive, cToken.continuationToken, epkMinHeader, epkMaxHeader);
                        this.queue.enqueue(feedRange);
                    }
                }
                catch (err) {
                    throw new ErrorResponse(err.message);
                }
            }
        }
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
     * Gets an async iterator which will yield pages of results from Azure Cosmos DB.
     *
     * Keeps iterating over the feedranges and checks if any feed range has new result. Keeps note of the last feed range which returned non 304 result.
     *
     * When same feed range is reached and no new changes are found, a 304 (not Modified) is returned to the end user. Then starts process all over again.
     */
    async readNext() {
        return withDiagnostics(async (diagnosticNode) => {
            // validate if the internal queue is filled up with feed ranges.
            if (!this.isInstantiated) {
                await this.setIteratorRid(diagnosticNode);
                await this.fillChangeFeedQueue(diagnosticNode);
            }
            // stores the last feedRange for which statusCode is not 304 i.e. there were new changes in that feed range.
            let firstNotModifiedFeedRange = undefined;
            let result;
            do {
                const [processedFeedRange, response] = await this.fetchNext(diagnosticNode);
                result = response;
                if (result !== undefined) {
                    {
                        if (firstNotModifiedFeedRange === undefined) {
                            firstNotModifiedFeedRange = processedFeedRange;
                        }
                        // move current feed range to end of queue to fetch result of next feed range.
                        // This is done to fetch changes in breadth first manner and avoid starvation.
                        this.queue.moveFirstElementToTheEnd();
                        // check if there are new results for the given feed range.
                        if (result.statusCode === StatusCodes.Ok) {
                            result.headers[Constants.HttpHeaders.ContinuationToken] =
                                this.generateContinuationToken();
                            return result;
                        }
                    }
                }
            } while (!this.checkedAllFeedRanges(firstNotModifiedFeedRange));
            // set the continuation token after processing.
            result.headers[Constants.HttpHeaders.ContinuationToken] = this.generateContinuationToken();
            return result;
        }, this.clientContext);
    }
    /**
     * Read feed and retrieves the next page of results in Azure Cosmos DB.
     */
    async fetchNext(diagnosticNode) {
        const feedRange = this.queue.peek();
        if (feedRange) {
            // fetch results for feed range at the beginning of the queue.
            const result = await this.getFeedResponse(feedRange, diagnosticNode);
            // check if results need to be fetched again depending on status code returned.
            // Eg. in case of paritionSplit, results need to be fetched for the child partitions.
            const shouldRetry = await this.shouldRetryOnFailure(feedRange, result, diagnosticNode);
            if (shouldRetry) {
                this.queue.dequeue();
                return this.fetchNext(diagnosticNode);
            }
            else {
                // update the continuation value for the current feed range.
                const continuationValueForFeedRange = result.headers[Constants.HttpHeaders.ETag];
                const newFeedRange = this.queue.peek();
                newFeedRange.continuationToken = continuationValueForFeedRange;
                return [[newFeedRange.minInclusive, newFeedRange.maxExclusive], result];
            }
        }
        else {
            return [[undefined, undefined], undefined];
        }
    }
    checkedAllFeedRanges(firstNotModifiedFeedRange) {
        if (firstNotModifiedFeedRange === undefined) {
            return false;
        }
        const feedRangeQueueFirstElement = this.queue.peek();
        return (firstNotModifiedFeedRange[0] === (feedRangeQueueFirstElement === null || feedRangeQueueFirstElement === void 0 ? void 0 : feedRangeQueueFirstElement.minInclusive) &&
            firstNotModifiedFeedRange[1] === (feedRangeQueueFirstElement === null || feedRangeQueueFirstElement === void 0 ? void 0 : feedRangeQueueFirstElement.maxExclusive));
    }
    /**
     * Checks whether the current EpkRange is split into multiple ranges or not.
     *
     * If yes, it force refreshes the partitionKeyRange cache and enqueue children epk ranges.
     */
    async shouldRetryOnFailure(feedRange, response, diagnosticNode) {
        if (response.statusCode === StatusCodes.Ok || response.statusCode === StatusCodes.NotModified) {
            return false;
        }
        const partitionSplit = response.statusCode === StatusCodes.Gone &&
            (response.subStatusCode === SubStatusCodes.PartitionKeyRangeGone ||
                response.subStatusCode === SubStatusCodes.CompletingSplit);
        if (partitionSplit) {
            const queryRange = new QueryRange(feedRange.minInclusive, feedRange.maxExclusive, true, false);
            const resolvedRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, queryRange, diagnosticNode, true);
            if (resolvedRanges.length < 1) {
                throw new ErrorResponse("Partition split/merge detected but no overlapping ranges found.");
            }
            // This covers both cases of merge and split.
            // resolvedRanges.length > 1 in case of split.
            // resolvedRanges.length === 1 in case of merge. EpkRange headers will be added in this case.
            if (resolvedRanges.length >= 1) {
                await this.handleSplit(false, resolvedRanges, queryRange, feedRange.continuationToken);
            }
            return true;
        }
        return false;
    }
    /*
     * Enqueues all the children feed ranges for the given feed range.
     */
    async handleSplit(shiftLeft, resolvedRanges, oldFeedRange, continuationToken) {
        let flag = 0;
        if (shiftLeft) {
            // This section is only applicable when handleSplit is called by getPartitionRangeId().
            // used only when existing partition key range cache is used to check for any overlapping ranges.
            // Modifies the first element with the first overlapping range.
            const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(oldFeedRange, resolvedRanges[0]);
            const newFeedRange = new ChangeFeedRange(resolvedRanges[0].minInclusive, resolvedRanges[0].maxExclusive, continuationToken, epkMinHeader, epkMaxHeader);
            this.queue.modifyFirstElement(newFeedRange);
            flag = 1;
        }
        // Enqueue the overlapping ranges.
        for (let i = flag; i < resolvedRanges.length; i++) {
            const [epkMinHeader, epkMaxHeader] = await extractOverlappingRanges(oldFeedRange, resolvedRanges[i]);
            const newFeedRange = new ChangeFeedRange(resolvedRanges[i].minInclusive, resolvedRanges[i].maxExclusive, continuationToken, epkMinHeader, epkMaxHeader);
            this.queue.enqueue(newFeedRange);
        }
    }
    /**
     * Fetch the partitionKeyRangeId for the given feed range.
     *
     * This partitionKeyRangeId is passed to queryFeed to fetch the results.
     */
    async getPartitionRangeId(feedRange, diagnosticNode) {
        const min = feedRange.epkMinHeader ? feedRange.epkMinHeader : feedRange.minInclusive;
        const max = feedRange.epkMaxHeader ? feedRange.epkMaxHeader : feedRange.maxExclusive;
        const queryRange = new QueryRange(min, max, true, false);
        const resolvedRanges = await this.partitionKeyRangeCache.getOverlappingRanges(this.url, queryRange, diagnosticNode, false);
        if (resolvedRanges.length < 1) {
            throw new ErrorResponse("No overlapping ranges found.");
        }
        const firstResolvedRange = resolvedRanges[0];
        if (resolvedRanges.length > 1) {
            await this.handleSplit(true, resolvedRanges, queryRange, feedRange.continuationToken);
        }
        return firstResolvedRange.id;
    }
    async getFeedResponse(feedRange, diagnosticNode) {
        const feedOptions = { initialHeaders: {}, useIncrementalFeed: true };
        if (typeof this.changeFeedOptions.maxItemCount === "number") {
            feedOptions.maxItemCount = this.changeFeedOptions.maxItemCount;
        }
        if (this.changeFeedOptions.sessionToken) {
            feedOptions.sessionToken = this.changeFeedOptions.sessionToken;
        }
        if (feedRange.continuationToken) {
            feedOptions.accessCondition = {
                type: Constants.HttpHeaders.IfNoneMatch,
                condition: feedRange.continuationToken,
            };
        }
        if (this.startTime) {
            feedOptions.initialHeaders[Constants.HttpHeaders.IfModifiedSince] = this.startTime;
        }
        const rangeId = await this.getPartitionRangeId(feedRange, diagnosticNode);
        try {
            // startEpk and endEpk are only valid in case we want to fetch result for a part of partition and not the entire partition.
            const response = await this.clientContext.queryFeed({
                path: this.resourceLink,
                resourceType: ResourceType.item,
                resourceId: this.resourceId,
                resultFn: (result) => (result ? result.Documents : []),
                query: undefined,
                options: feedOptions,
                diagnosticNode,
                partitionKey: undefined,
                partitionKeyRangeId: rangeId,
                startEpk: feedRange.epkMinHeader,
                endEpk: feedRange.epkMaxHeader,
            });
            return new ChangeFeedIteratorResponse(response.result, response.result ? response.result.length : 0, response.code, response.headers, getEmptyCosmosDiagnostics());
        }
        catch (err) {
            // If any errors are encountered, eg. partition split or gone, handle it based on error code and not break the flow.
            return new ChangeFeedIteratorResponse([], 0, err.code, err.headers, getEmptyCosmosDiagnostics(), err.substatus);
        }
    }
}
//# sourceMappingURL=ChangeFeedForEpkRange.js.map