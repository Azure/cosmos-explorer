// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { v4 } from "uuid";
const uuid = v4;
import { ChangeFeedIterator } from "../../ChangeFeedIterator";
import { getIdFromLink, getPathFromLink, isItemResourceValid, ResourceType } from "../../common";
import { extractPartitionKeys } from "../../extractPartitionKey";
import { QueryIterator } from "../../queryIterator";
import { Item } from "./Item";
import { ItemResponse } from "./ItemResponse";
import { isKeyInRange, prepareOperations, decorateBatchOperation, splitBatchBasedOnBodySize, } from "../../utils/batch";
import { readPartitionKeyDefinition } from "../ClientUtils";
import { assertNotUndefined, isPrimitivePartitionKeyValue } from "../../utils/typeChecks";
import { hashPartitionKey } from "../../utils/hashing/hash";
import { PartitionKeyRangeCache } from "../../routing";
import { changeFeedIteratorBuilder, } from "../../client/ChangeFeed";
import { validateChangeFeedIteratorOptions } from "../../client/ChangeFeed/changeFeedUtils";
import { DiagnosticNodeType, } from "../../diagnostics/DiagnosticNodeInternal";
import { getEmptyCosmosDiagnostics, withDiagnostics, addDignosticChild, } from "../../utils/diagnostics";
/**
 * @hidden
 */
function isChangeFeedOptions(options) {
    return options && !(isPrimitivePartitionKeyValue(options) || Array.isArray(options));
}
/**
 * Operations for creating new items, and reading/querying all items
 *
 * @see {@link Item} for reading, replacing, or deleting an existing container; use `.item(id)`.
 */
export class Items {
    /**
     * Create an instance of {@link Items} linked to the parent {@link Container}.
     * @param container - The parent container.
     * @hidden
     */
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
        this.partitionKeyRangeCache = new PartitionKeyRangeCache(this.clientContext);
    }
    query(query, options = {}) {
        const path = getPathFromLink(this.container.url, ResourceType.item);
        const id = getIdFromLink(this.container.url);
        const fetchFunction = async (diagnosticNode, innerOptions) => {
            const response = await this.clientContext.queryFeed({
                path,
                resourceType: ResourceType.item,
                resourceId: id,
                resultFn: (result) => (result ? result.Documents : []),
                query,
                options: innerOptions,
                partitionKey: options.partitionKey,
                diagnosticNode,
            });
            return response;
        };
        return new QueryIterator(this.clientContext, query, options, fetchFunction, this.container.url, ResourceType.item);
    }
    readChangeFeed(partitionKeyOrChangeFeedOptions, changeFeedOptions) {
        if (isChangeFeedOptions(partitionKeyOrChangeFeedOptions)) {
            return this.changeFeed(partitionKeyOrChangeFeedOptions);
        }
        else {
            return this.changeFeed(partitionKeyOrChangeFeedOptions, changeFeedOptions);
        }
    }
    changeFeed(partitionKeyOrChangeFeedOptions, changeFeedOptions) {
        let partitionKey;
        if (!changeFeedOptions && isChangeFeedOptions(partitionKeyOrChangeFeedOptions)) {
            partitionKey = undefined;
            changeFeedOptions = partitionKeyOrChangeFeedOptions;
        }
        else if (partitionKeyOrChangeFeedOptions !== undefined &&
            !isChangeFeedOptions(partitionKeyOrChangeFeedOptions)) {
            partitionKey = partitionKeyOrChangeFeedOptions;
        }
        if (!changeFeedOptions) {
            changeFeedOptions = {};
        }
        const path = getPathFromLink(this.container.url, ResourceType.item);
        const id = getIdFromLink(this.container.url);
        return new ChangeFeedIterator(this.clientContext, id, path, partitionKey, changeFeedOptions);
    }
    /**
     * Returns an iterator to iterate over pages of changes. The iterator returned can be used to fetch changes for a single partition key, feed range or an entire container.
     */
    getChangeFeedIterator(changeFeedIteratorOptions) {
        const cfOptions = changeFeedIteratorOptions !== undefined ? changeFeedIteratorOptions : {};
        validateChangeFeedIteratorOptions(cfOptions);
        const iterator = changeFeedIteratorBuilder(cfOptions, this.clientContext, this.container, this.partitionKeyRangeCache);
        return iterator;
    }
    readAll(options) {
        return this.query("SELECT * from c", options);
    }
    /**
     * Create an item.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param body - Represents the body of the item. Can contain any number of user defined properties.
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     */
    async create(body, options = {}) {
        // Generate random document id if the id is missing in the payload and
        // options.disableAutomaticIdGeneration != true
        return withDiagnostics(async (diagnosticNode) => {
            if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                body.id = uuid();
            }
            const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
            const partitionKey = extractPartitionKeys(body, partitionKeyDefinition);
            const err = {};
            if (!isItemResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, ResourceType.item);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: ResourceType.item,
                resourceId: id,
                diagnosticNode,
                options,
                partitionKey,
            });
            const ref = new Item(this.container, response.result.id, this.clientContext, partitionKey);
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    async upsert(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            // Generate random document id if the id is missing in the payload and
            // options.disableAutomaticIdGeneration != true
            if ((body.id === undefined || body.id === "") && !options.disableAutomaticIdGeneration) {
                body.id = uuid();
            }
            const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
            const partitionKey = extractPartitionKeys(body, partitionKeyDefinition);
            const err = {};
            if (!isItemResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, ResourceType.item);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.upsert({
                body,
                path,
                resourceType: ResourceType.item,
                resourceId: id,
                options,
                partitionKey,
                diagnosticNode,
            });
            const ref = new Item(this.container, response.result.id, this.clientContext, partitionKey);
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Execute bulk operations on items.
     *
     * Bulk takes an array of Operations which are typed based on what the operation does.
     * The choices are: Create, Upsert, Read, Replace, and Delete
     *
     * Usage example:
     * ```typescript
     * // partitionKey is optional at the top level if present in the resourceBody
     * const operations: OperationInput[] = [
     *    {
     *       operationType: "Create",
     *       resourceBody: { id: "doc1", name: "sample", key: "A" }
     *    },
     *    {
     *       operationType: "Upsert",
     *       partitionKey: 'A',
     *       resourceBody: { id: "doc2", name: "other", key: "A" }
     *    }
     * ]
     *
     * await database.container.items.bulk(operations)
     * ```
     *
     * @param operations - List of operations. Limit 100
     * @param bulkOptions - Optional options object to modify bulk behavior. Pass \{ continueOnError: true \} to continue executing operations when one fails. (Defaults to false) ** NOTE: THIS WILL DEFAULT TO TRUE IN THE 4.0 RELEASE
     * @param options - Used for modifying the request.
     */
    async bulk(operations, bulkOptions, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const { resources: partitionKeyRanges } = await this.container
                .readPartitionKeyRanges()
                .fetchAll();
            const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
            const batches = partitionKeyRanges.map((keyRange) => {
                return {
                    min: keyRange.minInclusive,
                    max: keyRange.maxExclusive,
                    rangeId: keyRange.id,
                    indexes: [],
                    operations: [],
                };
            });
            this.groupOperationsBasedOnPartitionKey(operations, partitionKeyDefinition, options, batches);
            const path = getPathFromLink(this.container.url, ResourceType.item);
            const orderedResponses = [];
            await Promise.all(batches
                .filter((batch) => batch.operations.length)
                .flatMap((batch) => splitBatchBasedOnBodySize(batch))
                .map(async (batch) => {
                if (batch.operations.length > 100) {
                    throw new Error("Cannot run bulk request with more than 100 operations per partition");
                }
                try {
                    const response = await addDignosticChild(async (childNode) => this.clientContext.bulk({
                        body: batch.operations,
                        partitionKeyRangeId: batch.rangeId,
                        path,
                        resourceId: this.container.url,
                        bulkOptions,
                        options,
                        diagnosticNode: childNode,
                    }), diagnosticNode, DiagnosticNodeType.BATCH_REQUEST);
                    response.result.forEach((operationResponse, index) => {
                        orderedResponses[batch.indexes[index]] = operationResponse;
                    });
                }
                catch (err) {
                    // In the case of 410 errors, we need to recompute the partition key ranges
                    // and redo the batch request, however, 410 errors occur for unsupported
                    // partition key types as well since we don't support them, so for now we throw
                    if (err.code === 410) {
                        throw new Error("Partition key error. Either the partitions have split or an operation has an unsupported partitionKey type" +
                            err.message);
                    }
                    throw new Error(`Bulk request errored with: ${err.message}`);
                }
            }));
            const response = orderedResponses;
            response.diagnostics = diagnosticNode.toDiagnostic(this.clientContext.getClientConfig());
            return response;
        }, this.clientContext);
    }
    /**
     * Function to create batches based of partition key Ranges.
     * @param operations - operations to group
     * @param partitionDefinition - PartitionKey definition of container.
     * @param options - Request options for bulk request.
     * @param batches - Groups to be filled with operations.
     */
    groupOperationsBasedOnPartitionKey(operations, partitionDefinition, options, batches) {
        operations.forEach((operationInput, index) => {
            const { operation, partitionKey } = prepareOperations(operationInput, partitionDefinition, options);
            const hashed = hashPartitionKey(assertNotUndefined(partitionKey, "undefined value for PartitionKey is not expected during grouping of bulk operations."), partitionDefinition);
            const batchForKey = assertNotUndefined(batches.find((batch) => {
                return isKeyInRange(batch.min, batch.max, hashed);
            }), "No suitable Batch found.");
            batchForKey.operations.push(operation);
            batchForKey.indexes.push(index);
        });
    }
    /**
     * Execute transactional batch operations on items.
     *
     * Batch takes an array of Operations which are typed based on what the operation does. Batch is transactional and will rollback all operations if one fails.
     * The choices are: Create, Upsert, Read, Replace, and Delete
     *
     * Usage example:
     * ```typescript
     * // partitionKey is required as a second argument to batch, but defaults to the default partition key
     * const operations: OperationInput[] = [
     *    {
     *       operationType: "Create",
     *       resourceBody: { id: "doc1", name: "sample", key: "A" }
     *    },
     *    {
     *       operationType: "Upsert",
     *       partitionKey: 'A',
     *       resourceBody: { id: "doc2", name: "other", key: "A" }
     *    }
     * ]
     *
     * await database.container.items.batch(operations)
     * ```
     *
     * @param operations - List of operations. Limit 100
     * @param options - Used for modifying the request
     */
    async batch(operations, partitionKey, options) {
        return withDiagnostics(async (diagnosticNode) => {
            operations.map((operation) => decorateBatchOperation(operation, options));
            const path = getPathFromLink(this.container.url, ResourceType.item);
            if (operations.length > 100) {
                throw new Error("Cannot run batch request with more than 100 operations per partition");
            }
            try {
                const response = await this.clientContext.batch({
                    body: operations,
                    partitionKey,
                    path,
                    resourceId: this.container.url,
                    options,
                    diagnosticNode,
                });
                return response;
            }
            catch (err) {
                throw new Error(`Batch request error: ${err.message}`);
            }
        }, this.clientContext);
    }
}
//# sourceMappingURL=Items.js.map