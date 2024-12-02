import { ClientContext } from "../../ClientContext";
import { PartitionKey, PartitionKeyDefinition } from "../../documents";
import { SqlQuerySpec } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { FeedOptions, RequestOptions, ResourceResponse, Response } from "../../request";
import { PartitionedQueryExecutionInfo } from "../../request/ErrorResponse";
import { Conflict, Conflicts } from "../Conflict";
import { Database } from "../Database";
import { Item, Items } from "../Item";
import { Scripts } from "../Script/Scripts";
import { ContainerDefinition } from "./ContainerDefinition";
import { ContainerResponse } from "./ContainerResponse";
import { PartitionKeyRange } from "./PartitionKeyRange";
import { OfferResponse } from "../Offer/OfferResponse";
import { FeedRange } from "../ChangeFeed";
import { DiagnosticNodeInternal } from "../../diagnostics/DiagnosticNodeInternal";
/**
 * Operations for reading, replacing, or deleting a specific, existing container by id.
 *
 * @see {@link Containers} for creating new containers, and reading/querying all containers; use `.containers`.
 *
 * Note: all these operations make calls against a fixed budget.
 * You should design your system such that these calls scale sublinearly with your application.
 * For instance, do not call `container(id).read()` before every single `item.read()` call, to ensure the container exists;
 * do this once on application start up.
 */
export declare class Container {
    readonly database: Database;
    readonly id: string;
    private readonly clientContext;
    private $items;
    /**
     * Operations for creating new items, and reading/querying all items
     *
     * For reading, replacing, or deleting an existing item, use `.item(id)`.
     *
     * @example Create a new item
     * ```typescript
     * const {body: createdItem} = await container.items.create({id: "<item id>", properties: {}});
     * ```
     */
    get items(): Items;
    private $scripts;
    /**
     * All operations for Stored Procedures, Triggers, and User Defined Functions
     */
    get scripts(): Scripts;
    private $conflicts;
    /**
     * Operations for reading and querying conflicts for the given container.
     *
     * For reading or deleting a specific conflict, use `.conflict(id)`.
     */
    get conflicts(): Conflicts;
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url(): string;
    /**
     * Returns a container instance. Note: You should get this from `database.container(id)`, rather than creating your own object.
     * @param database - The parent {@link Database}.
     * @param id - The id of the given container.
     * @hidden
     */
    constructor(database: Database, id: string, clientContext: ClientContext);
    /**
     * Used to read, replace, or delete a specific, existing {@link Item} by id.
     *
     * Use `.items` for creating new items, or querying/reading all items.
     *
     * @param id - The id of the {@link Item}.
     * @param partitionKeyValue - The value of the {@link Item} partition key
     * @example Replace an item
     * `const {body: replacedItem} = await container.item("<item id>", "<partition key value>").replace({id: "<item id>", title: "Updated post", authorID: 5});`
     */
    item(id: string, partitionKeyValue?: PartitionKey): Item;
    /**
     * Used to read, replace, or delete a specific, existing {@link Conflict} by id.
     *
     * Use `.conflicts` for creating new conflicts, or querying/reading all conflicts.
     * @param id - The id of the {@link Conflict}.
     */
    conflict(id: string, partitionKey?: PartitionKey): Conflict;
    /** Read the container's definition */
    read(options?: RequestOptions): Promise<ContainerResponse>;
    /**
     * @hidden
     */
    readInternal(diagnosticNode: DiagnosticNodeInternal, options?: RequestOptions): Promise<ContainerResponse>;
    /** Replace the container's definition */
    replace(body: ContainerDefinition, options?: RequestOptions): Promise<ContainerResponse>;
    /** Delete the container */
    delete(options?: RequestOptions): Promise<ContainerResponse>;
    /**
     * Gets the partition key definition first by looking into the cache otherwise by reading the collection.
     * @deprecated This method has been renamed to readPartitionKeyDefinition.
     */
    getPartitionKeyDefinition(): Promise<ResourceResponse<PartitionKeyDefinition>>;
    /**
     * Gets the partition key definition first by looking into the cache otherwise by reading the collection.
     * @hidden
     */
    readPartitionKeyDefinition(diagnosticNode: DiagnosticNodeInternal): Promise<ResourceResponse<PartitionKeyDefinition>>;
    /**
     * Gets offer on container. If none exists, returns an OfferResponse with undefined.
     */
    readOffer(options?: RequestOptions): Promise<OfferResponse>;
    getQueryPlan(query: string | SqlQuerySpec): Promise<Response<PartitionedQueryExecutionInfo>>;
    readPartitionKeyRanges(feedOptions?: FeedOptions): QueryIterator<PartitionKeyRange>;
    /**
     *
     * @returns all the feed ranges for which changefeed could be fetched.
     */
    getFeedRanges(): Promise<ReadonlyArray<FeedRange>>;
    /**
     * Delete all documents belong to the container for the provided partition key value
     * @param partitionKey - The partition key value of the items to be deleted
     */
    deleteAllItemsForPartitionKey(partitionKey: PartitionKey, options?: RequestOptions): Promise<ContainerResponse>;
}
//# sourceMappingURL=Container.d.ts.map