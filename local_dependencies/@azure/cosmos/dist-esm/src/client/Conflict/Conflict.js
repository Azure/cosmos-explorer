import { Constants, getIdFromLink, getPathFromLink, ResourceType } from "../../common";
import { ConflictResponse } from "./ConflictResponse";
import { undefinedPartitionKey } from "../../extractPartitionKey";
import { readPartitionKeyDefinition } from "../ClientUtils";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
/**
 * Use to read or delete a given {@link Conflict} by id.
 *
 * @see {@link Conflicts} to query or read all conflicts.
 */
export class Conflict {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return `/${this.container.url}/${Constants.Path.ConflictsPathSegment}/${this.id}`;
    }
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     * @param id - The id of the given {@link Conflict}.
     */
    constructor(container, id, clientContext, partitionKey) {
        this.container = container;
        this.id = id;
        this.clientContext = clientContext;
        this.partitionKey = partitionKey;
        this.partitionKey = partitionKey;
    }
    /**
     * Read the {@link ConflictDefinition} for the given {@link Conflict}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url, ResourceType.conflicts);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: ResourceType.user,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new ConflictResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link ConflictDefinition}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (this.partitionKey === undefined) {
                const partitionKeyDefinition = await readPartitionKeyDefinition(diagnosticNode, this.container);
                this.partitionKey = undefinedPartitionKey(partitionKeyDefinition);
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: ResourceType.conflicts,
                resourceId: id,
                options,
                partitionKey: this.partitionKey,
                diagnosticNode,
            });
            return new ConflictResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}
//# sourceMappingURL=Conflict.js.map