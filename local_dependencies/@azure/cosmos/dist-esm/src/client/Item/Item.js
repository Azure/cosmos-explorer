import { createDocumentUri, getIdFromLink, getPathFromLink, isItemResourceValid, ResourceType, StatusCodes, } from "../../common";
import { convertToInternalPartitionKey } from "../../documents";
import { extractPartitionKeys, undefinedPartitionKey } from "../../extractPartitionKey";
import { readPartitionKeyDefinition } from "../ClientUtils";
import { ItemResponse } from "./ItemResponse";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
/**
 * Used to perform operations on a specific item.
 *
 * @see {@link Items} for operations on all items; see `container.items`.
 */
export class Item {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createDocumentUri(this.container.database.id, this.container.id, this.id);
    }
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link Item}.
     * @param partitionKey - The primary key of the given {@link Item} (only for partitioned containers).
     */
    constructor(container, id, clientContext, partitionKey) {
        this.container = container;
        this.id = id;
        this.clientContext = clientContext;
        this.partitionKey =
            partitionKey === undefined ? undefined : convertToInternalPartitionKey(partitionKey);
    }
    /**
     * Read the item's definition.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     * If the type, T, is a class, it won't pass `typeof` comparisons, because it won't have a match prototype.
     * It's recommended to only use interfaces.
     *
     * There is no set schema for JSON items. They may contain any number of custom properties.
     *
     * @param options - Additional options for the request
     *
     * @example Using custom type for response
     * ```typescript
     * interface TodoItem {
     *   title: string;
     *   done: bool;
     *   id: string;
     * }
     *
     * let item: TodoItem;
     * ({body: item} = await item.read<TodoItem>());
     * ```
     */
    async read(options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = undefinedPartitionKey(partitionKeyDefinition);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            let response;
            try {
                response = await this.clientContext.read({
                    path,
                    resourceType: ResourceType.item,
                    resourceId: id,
                    options,
                    partitionKey: this.partitionKey,
                    diagnosticNode,
                });
            }
            catch (error) {
                if (error.code !== StatusCodes.NotFound) {
                    throw error;
                }
                response = error;
            }
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    async replace(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyResponse = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = extractPartitionKeys(body, partitionKeyResponse);
            }
            const err = {};
            if (!isItemResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: ResourceType.item,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the item.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * @param options - Additional options for the request
     */
    async delete(options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyResponse = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = undefinedPartitionKey(partitionKeyResponse);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: ResourceType.item,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Perform a JSONPatch on the item.
     *
     * Any provided type, T, is not necessarily enforced by the SDK.
     * You may get more or less properties and it's up to your logic to enforce it.
     *
     * @param options - Additional options for the request
     */
    async patch(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyResponse = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = extractPartitionKeys(body, partitionKeyResponse);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.patch({
                body,
                path,
                resourceType: ResourceType.item,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ItemResponse(response.result, response.headers, response.code, response.substatus, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}
//# sourceMappingURL=Item.js.map