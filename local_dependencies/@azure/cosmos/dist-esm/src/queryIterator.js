// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { __asyncGenerator, __await } from "tslib";
import { getPathFromLink, ResourceType, RUConsumedManager, StatusCodes } from "./common";
import { MetadataLookUpType } from "./CosmosDiagnostics";
import { DiagnosticNodeInternal, DiagnosticNodeType } from "./diagnostics/DiagnosticNodeInternal";
import { DefaultQueryExecutionContext, getInitialHeader, mergeHeaders, PipelinedQueryExecutionContext, } from "./queryExecutionContext";
import { FeedResponse } from "./request/FeedResponse";
import { RUCapPerOperationExceededErrorCode } from "./request/RUCapPerOperationExceededError";
import { getEmptyCosmosDiagnostics, withDiagnostics, withMetadataDiagnostics, } from "./utils/diagnostics";
/**
 * Represents a QueryIterator Object, an implementation of feed or query response that enables
 * traversal and iterating over the response
 * in the Azure Cosmos DB database service.
 */
export class QueryIterator {
    /**
     * @hidden
     */
    constructor(clientContext, query, options, fetchFunctions, resourceLink, resourceType) {
        this.clientContext = clientContext;
        this.query = query;
        this.options = options;
        this.fetchFunctions = fetchFunctions;
        this.resourceLink = resourceLink;
        this.resourceType = resourceType;
        this.nonStreamingOrderBy = false;
        this.query = query;
        this.fetchFunctions = fetchFunctions;
        this.options = options || {};
        this.resourceLink = resourceLink;
        this.fetchAllLastResHeaders = getInitialHeader();
        this.reset();
        this.isInitialized = false;
    }
    /**
     * Gets an async iterator that will yield results until completion.
     *
     * NOTE: AsyncIterators are a very new feature and you might need to
     * use polyfils/etc. in order to use them in your code.
     *
     * If you're using TypeScript, you can use the following polyfill as long
     * as you target ES6 or higher and are running on Node 6 or higher.
     *
     * ```typescript
     * if (!Symbol || !Symbol.asyncIterator) {
     *   (Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator");
     * }
     * ```
     *
     * @example Iterate over all databases
     * ```typescript
     * for await(const { resources: db } of client.databases.readAll().getAsyncIterator()) {
     *   console.log(`Got ${db} from AsyncIterator`);
     * }
     * ```
     */
    getAsyncIterator(options) {
        return __asyncGenerator(this, arguments, function* getAsyncIterator_1() {
            this.reset();
            let diagnosticNode = new DiagnosticNodeInternal(this.clientContext.diagnosticLevel, DiagnosticNodeType.CLIENT_REQUEST_NODE, null);
            this.queryPlanPromise = this.fetchQueryPlan(diagnosticNode);
            let ruConsumedManager;
            if (options && options.ruCapPerOperation) {
                ruConsumedManager = new RUConsumedManager();
            }
            while (this.queryExecutionContext.hasMoreResults()) {
                let response;
                try {
                    response = yield __await(this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager));
                }
                catch (error) {
                    if (this.needsQueryPlan(error)) {
                        yield __await(this.createPipelinedExecutionContext());
                        try {
                            response = yield __await(this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager));
                        }
                        catch (queryError) {
                            this.handleSplitError(queryError);
                        }
                    }
                    else {
                        throw error;
                    }
                }
                const feedResponse = new FeedResponse(response.result, response.headers, this.queryExecutionContext.hasMoreResults(), diagnosticNode.toDiagnostic(this.clientContext.getClientConfig()));
                diagnosticNode = new DiagnosticNodeInternal(this.clientContext.diagnosticLevel, DiagnosticNodeType.CLIENT_REQUEST_NODE, null);
                if (response.result !== undefined) {
                    yield yield __await(feedResponse);
                }
            }
        });
    }
    /**
     * Determine if there are still remaining resources to process based on the value of the continuation token or the
     * elements remaining on the current batch in the QueryIterator.
     * @returns true if there is other elements to process in the QueryIterator.
     */
    hasMoreResults() {
        return this.queryExecutionContext.hasMoreResults();
    }
    /**
     * Fetch all pages for the query and return a single FeedResponse.
     */
    async fetchAll(options) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.fetchAllInternal(diagnosticNode, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async fetchAllInternal(diagnosticNode, options) {
        this.reset();
        let response;
        try {
            response = await this.toArrayImplementation(diagnosticNode, options);
        }
        catch (error) {
            this.handleSplitError(error);
        }
        return response;
    }
    /**
     * Retrieve the next batch from the feed.
     *
     * This may or may not fetch more pages from the backend depending on your settings
     * and the type of query. Aggregate queries will generally fetch all backend pages
     * before returning the first batch of responses.
     */
    async fetchNext(options) {
        return withDiagnostics(async (diagnosticNode) => {
            // Enabling RU metrics for all the fetchNext operations
            const ruConsumedManager = new RUConsumedManager();
            this.queryPlanPromise = withMetadataDiagnostics(async (metadataNode) => {
                return this.fetchQueryPlan(metadataNode);
            }, diagnosticNode, MetadataLookUpType.QueryPlanLookUp);
            if (!this.isInitialized) {
                await this.init();
            }
            let response;
            try {
                response = await this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager);
            }
            catch (error) {
                if (this.needsQueryPlan(error)) {
                    await this.createPipelinedExecutionContext();
                    try {
                        response = await this.queryExecutionContext.fetchMore(diagnosticNode, options, ruConsumedManager);
                    }
                    catch (queryError) {
                        this.handleSplitError(queryError);
                    }
                }
                else {
                    throw error;
                }
            }
            return new FeedResponse(response.result, response.headers, this.queryExecutionContext.hasMoreResults(), getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Reset the QueryIterator to the beginning and clear all the resources inside it
     */
    reset() {
        this.queryPlanPromise = undefined;
        this.fetchAllLastResHeaders = getInitialHeader();
        this.fetchAllTempResources = [];
        this.queryExecutionContext = new DefaultQueryExecutionContext(this.options, this.fetchFunctions);
    }
    async toArrayImplementation(diagnosticNode, options) {
        let ruConsumedManager;
        if (options && options.ruCapPerOperation) {
            ruConsumedManager = new RUConsumedManager();
        }
        this.queryPlanPromise = withMetadataDiagnostics(async (metadataNode) => {
            return this.fetchQueryPlan(metadataNode);
        }, diagnosticNode, MetadataLookUpType.QueryPlanLookUp);
        // this.queryPlanPromise = this.fetchQueryPlan(diagnosticNode);
        if (!this.isInitialized) {
            await this.init();
        }
        while (this.queryExecutionContext.hasMoreResults()) {
            let response;
            try {
                response = await this.queryExecutionContext.nextItem(diagnosticNode, options, ruConsumedManager);
            }
            catch (error) {
                if (this.needsQueryPlan(error)) {
                    await this.createPipelinedExecutionContext();
                    response = await this.queryExecutionContext.nextItem(diagnosticNode, options, ruConsumedManager);
                }
                else if (error.code === RUCapPerOperationExceededErrorCode && error.fetchedResults) {
                    error.fetchedResults.forEach((item) => {
                        this.fetchAllTempResources.push(item);
                    });
                    error.fetchedResults = this.fetchAllTempResources;
                    throw error;
                }
                else {
                    throw error;
                }
            }
            const { result, headers } = response;
            // concatenate the results and fetch more
            mergeHeaders(this.fetchAllLastResHeaders, headers);
            if (result !== undefined) {
                if (this.nonStreamingOrderBy &&
                    typeof result === "object" &&
                    Object.keys(result).length === 0) {
                    // ignore empty results from NonStreamingOrderBy Endpoint components.
                }
                else
                    this.fetchAllTempResources.push(result);
            }
        }
        return new FeedResponse(this.fetchAllTempResources, this.fetchAllLastResHeaders, this.queryExecutionContext.hasMoreResults(), getEmptyCosmosDiagnostics());
    }
    async createPipelinedExecutionContext() {
        const queryPlanResponse = await this.queryPlanPromise;
        // We always coerce queryPlanPromise to resolved. So if it errored, we need to manually inspect the resolved value
        if (queryPlanResponse instanceof Error) {
            throw queryPlanResponse;
        }
        const queryPlan = queryPlanResponse.result;
        const queryInfo = queryPlan.queryInfo;
        this.nonStreamingOrderBy = queryInfo.hasNonStreamingOrderBy ? true : false;
        if (queryInfo.aggregates.length > 0 && queryInfo.hasSelectValue === false) {
            throw new Error("Aggregate queries must use the VALUE keyword");
        }
        this.queryExecutionContext = new PipelinedQueryExecutionContext(this.clientContext, this.resourceLink, this.query, this.options, queryPlan);
    }
    async fetchQueryPlan(diagnosticNode) {
        if (!this.queryPlanPromise && this.resourceType === ResourceType.item) {
            return this.clientContext
                .getQueryPlan(getPathFromLink(this.resourceLink) + "/docs", ResourceType.item, this.resourceLink, this.query, this.options, diagnosticNode)
                .catch((error) => error); // Without this catch, node reports an unhandled rejection. So we stash the promise as resolved even if it errored.
        }
        return this.queryPlanPromise;
    }
    needsQueryPlan(error) {
        var _a;
        let needsQueryPlanValue = false;
        if (((_a = error.body) === null || _a === void 0 ? void 0 : _a.additionalErrorInfo) ||
            error.message.includes("Cross partition query only supports")) {
            needsQueryPlanValue =
                error.code === StatusCodes.BadRequest && this.resourceType === ResourceType.item;
        }
        return needsQueryPlanValue;
    }
    async init() {
        if (this.isInitialized === true) {
            return;
        }
        if (this.initPromise === undefined) {
            this.initPromise = this._init();
        }
        return this.initPromise;
    }
    async _init() {
        if (this.options.forceQueryPlan === true && this.resourceType === ResourceType.item) {
            await this.createPipelinedExecutionContext();
        }
        this.isInitialized = true;
    }
    handleSplitError(err) {
        if (err.code === 410) {
            const error = new Error("Encountered partition split and could not recover. This request is retryable");
            error.code = 503;
            error.originalError = err;
            throw error;
        }
        else {
            throw err;
        }
    }
}
//# sourceMappingURL=queryIterator.js.map