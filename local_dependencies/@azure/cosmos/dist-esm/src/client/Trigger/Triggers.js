import { getIdFromLink, getPathFromLink, isResourceValid, ResourceType } from "../../common";
import { QueryIterator } from "../../queryIterator";
import { Trigger } from "./Trigger";
import { TriggerResponse } from "./TriggerResponse";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
/**
 * Operations to create, upsert, query, and read all triggers.
 *
 * Use `container.triggers` to read, replace, or delete a {@link Trigger}.
 */
export class Triggers {
    /**
     * @hidden
     * @param container - The parent {@link Container}.
     */
    constructor(container, clientContext) {
        this.container = container;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.container.url, ResourceType.trigger);
        const id = getIdFromLink(this.container.url);
        return new QueryIterator(this.clientContext, query, options, (diagnosticNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: ResourceType.trigger,
                resourceId: id,
                resultFn: (result) => result.Triggers,
                query,
                options: innerOptions,
                diagnosticNode,
            });
        });
    }
    /**
     * Read all Triggers.
     * @example Read all trigger to array.
     * ```typescript
     * const {body: triggerList} = await container.triggers.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
    /**
     * Create a trigger.
     *
     * Azure Cosmos DB supports pre and post triggers defined in JavaScript to be executed
     * on creates, updates and deletes.
     *
     * For additional details, refer to the server-side JavaScript API documentation.
     */
    async create(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            if (body.body) {
                body.body = body.body.toString();
            }
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.container.url, ResourceType.trigger);
            const id = getIdFromLink(this.container.url);
            const response = await this.clientContext.create({
                body,
                path,
                resourceType: ResourceType.trigger,
                resourceId: id,
                options,
                diagnosticNode,
            });
            const ref = new Trigger(this.container, response.result.id, this.clientContext);
            return new TriggerResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}
//# sourceMappingURL=Triggers.js.map