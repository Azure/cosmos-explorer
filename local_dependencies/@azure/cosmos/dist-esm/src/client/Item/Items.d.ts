import { ChangeFeedIterator } from "../../ChangeFeedIterator";
import { ChangeFeedOptions } from "../../ChangeFeedOptions";
import { ClientContext } from "../../ClientContext";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions, RequestOptions, Response } from "../../request";
import { Container } from "../Container";
import { ItemDefinition } from "./ItemDefinition";
import { ItemResponse } from "./ItemResponse";
import { OperationResponse, OperationInput, BulkOptions, BulkOperationResponse } from "../../utils/batch";
import { PartitionKey } from "../../documents";
import { ChangeFeedPullModelIterator, ChangeFeedIteratorOptions } from "../../client/ChangeFeed";
/**
 * Operations for creating new items, and reading/querying all items
 *
 * @see {@link Item} for reading, replacing, or deleting an existing container; use `.item(id)`.
 */
export declare class Items {
    readonly container: Container;
    private readonly clientContext;
    private partitionKeyRangeCache;
    /**
     * Create an instance of {@link Items} linked to the parent {@link Container}.
     * @param container - The parent container.
     * @hidden
     */
    constructor(container: Container, clientContext: ClientContext);
    /**
     * Queries all items.
     * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     * @example Read all items to array.
     * ```typescript
     * const querySpec: SqlQuerySpec = {
     *   query: "SELECT * FROM Families f WHERE f.lastName = @lastName",
     *   parameters: [
     *     {name: "@lastName", value: "Hendricks"}
     *   ]
     * };
     * const {result: items} = await items.query(querySpec).fetchAll();
     * ```
     */
    query(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<any>;
    /**
     * Queries all items.
     * @param query - Query configuration for the operation. See {@link SqlQuerySpec} for more info on how to configure a query.
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     * @example Read all items to array.
     * ```typescript
     * const querySpec: SqlQuerySpec = {
     *   query: "SELECT firstname FROM Families f WHERE f.lastName = @lastName",
     *   parameters: [
     *     {name: "@lastName", value: "Hendricks"}
     *   ]
     * };
     * const {result: items} = await items.query<{firstName: string}>(querySpec).fetchAll();
     * ```
     */
    query<T>(query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<T>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     *
     * @deprecated Use `changeFeed` instead.
     *
     * @example Read from the beginning of the change feed.
     * ```javascript
     * const iterator = items.readChangeFeed({ startFromBeginning: true });
     * const firstPage = await iterator.fetchNext();
     * const firstPageResults = firstPage.result
     * const secondPage = await iterator.fetchNext();
     * ```
     */
    readChangeFeed(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     * @deprecated Use `changeFeed` instead.
     *
     */
    readChangeFeed(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     * @deprecated Use `changeFeed` instead.
     */
    readChangeFeed<T>(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     * @deprecated Use `changeFeed` instead.
     */
    readChangeFeed<T>(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     *
     * @example Read from the beginning of the change feed.
     * ```javascript
     * const iterator = items.readChangeFeed({ startFromBeginning: true });
     * const firstPage = await iterator.fetchNext();
     * const firstPageResults = firstPage.result
     * const secondPage = await iterator.fetchNext();
     * ```
     */
    changeFeed(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     */
    changeFeed(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<any>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     */
    changeFeed<T>(partitionKey: PartitionKey, changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
    /**
     * Create a `ChangeFeedIterator` to iterate over pages of changes
     */
    changeFeed<T>(changeFeedOptions?: ChangeFeedOptions): ChangeFeedIterator<T>;
    /**
     * Returns an iterator to iterate over pages of changes. The iterator returned can be used to fetch changes for a single partition key, feed range or an entire container.
     */
    getChangeFeedIterator<T>(changeFeedIteratorOptions?: ChangeFeedIteratorOptions): ChangeFeedPullModelIterator<T>;
    /**
     * Read all items.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     * @example Read all items to array.
     * ```typescript
     * const {body: containerList} = await items.readAll().fetchAll();
     * ```
     */
    readAll(options?: FeedOptions): QueryIterator<ItemDefinition>;
    /**
     * Read all items.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     * @example Read all items to array.
     * ```typescript
     * const {body: containerList} = await items.readAll().fetchAll();
     * ```
     */
    readAll<T extends ItemDefinition>(options?: FeedOptions): QueryIterator<T>;
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
    create<T extends ItemDefinition = any>(body: T, options?: RequestOptions): Promise<ItemResponse<T>>;
    /**
     * Upsert an item.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param body - Represents the body of the item. Can contain any number of user defined properties.
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     */
    upsert(body: unknown, options?: RequestOptions): Promise<ItemResponse<ItemDefinition>>;
    /**
     * Upsert an item.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param body - Represents the body of the item. Can contain any number of user defined properties.
     * @param options - Used for modifying the request (for instance, specifying the partition key).
     */
    upsert<T extends ItemDefinition>(body: T, options?: RequestOptions): Promise<ItemResponse<T>>;
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
    bulk(operations: OperationInput[], bulkOptions?: BulkOptions, options?: RequestOptions): Promise<BulkOperationResponse>;
    /**
     * Function to create batches based of partition key Ranges.
     * @param operations - operations to group
     * @param partitionDefinition - PartitionKey definition of container.
     * @param options - Request options for bulk request.
     * @param batches - Groups to be filled with operations.
     */
    private groupOperationsBasedOnPartitionKey;
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
    batch(operations: OperationInput[], partitionKey?: PartitionKey, options?: RequestOptions): Promise<Response<OperationResponse[]>>;
}
//# sourceMappingURL=Items.d.ts.map