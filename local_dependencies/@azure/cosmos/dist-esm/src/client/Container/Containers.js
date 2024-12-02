import { Constants, getIdFromLink, getPathFromLink, isResourceValid, ResourceType, StatusCodes, } from "../../common";
import { DEFAULT_PARTITION_KEY_PATH } from "../../common/partitionKeys";
import { mergeHeaders } from "../../queryExecutionContext";
import { QueryIterator } from "../../queryIterator";
import { Container } from "./Container";
import { ContainerResponse } from "./ContainerResponse";
import { validateOffer } from "../../utils/offers";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
/**
 * Operations for creating new containers, and reading/querying all containers
 *
 * @see {@link Container} for reading, replacing, or deleting an existing container; use `.container(id)`.
 *
 * Note: all these operations make calls against a fixed budget.
 * You should design your system such that these calls scale sublinearly with your application.
 * For instance, do not call `containers.readAll()` before every single `item.read()` call, to ensure the container exists;
 * do this once on application start up.
 */
export class Containers {
    constructor(database, clientContext) {
        this.database = database;
        this.clientContext = clientContext;
    }
    query(query, options) {
        const path = getPathFromLink(this.database.url, ResourceType.container);
        const id = getIdFromLink(this.database.url);
        return new QueryIterator(this.clientContext, query, options, (diagNode, innerOptions) => {
            return this.clientContext.queryFeed({
                path,
                resourceType: ResourceType.container,
                resourceId: id,
                resultFn: (result) => result.DocumentCollections,
                query,
                options: innerOptions,
                diagnosticNode: diagNode,
            });
        });
    }
    /**
     * Creates a container.
     *
     * A container is a named logical container for items.
     *
     * A database may contain zero or more named containers and each container consists of
     * zero or more JSON items.
     *
     * Being schema-free, the items in a container do not need to share the same structure or fields.
     *
     *
     * Since containers are application resources, they can be authorized using either the
     * master key or resource keys.
     *
     * @param body - Represents the body of the container.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     */
    async create(body, options = {}) {
        return withDiagnostics(async (diagnosticNode) => {
            return this.createInternal(diagnosticNode, body, options);
        }, this.clientContext);
    }
    /**
     * @hidden
     */
    async createInternal(diagnosticNode, body, options = {}) {
        const err = {};
        if (!isResourceValid(body, err)) {
            throw err;
        }
        const path = getPathFromLink(this.database.url, ResourceType.container);
        const id = getIdFromLink(this.database.url);
        validateOffer(body);
        if (body.maxThroughput) {
            const autoscaleParams = {
                maxThroughput: body.maxThroughput,
            };
            if (body.autoUpgradePolicy) {
                autoscaleParams.autoUpgradePolicy = body.autoUpgradePolicy;
            }
            const autoscaleHeader = JSON.stringify(autoscaleParams);
            options.initialHeaders = Object.assign({}, options.initialHeaders, {
                [Constants.HttpHeaders.AutoscaleSettings]: autoscaleHeader,
            });
            delete body.maxThroughput;
            delete body.autoUpgradePolicy;
        }
        if (body.throughput) {
            options.initialHeaders = Object.assign({}, options.initialHeaders, {
                [Constants.HttpHeaders.OfferThroughput]: body.throughput,
            });
            delete body.throughput;
        }
        if (typeof body.partitionKey === "string") {
            if (!body.partitionKey.startsWith("/")) {
                throw new Error("Partition key must start with '/'");
            }
            body.partitionKey = {
                paths: [body.partitionKey],
            };
        }
        // If they don't specify a partition key, use the default path
        if (!body.partitionKey || !body.partitionKey.paths) {
            body.partitionKey = {
                paths: [DEFAULT_PARTITION_KEY_PATH],
            };
        }
        const response = await this.clientContext.create({
            body,
            path,
            resourceType: ResourceType.container,
            resourceId: id,
            diagnosticNode,
            options,
        });
        const ref = new Container(this.database, response.result.id, this.clientContext);
        return new ContainerResponse(response.result, response.headers, response.code, ref, getEmptyCosmosDiagnostics());
    }
    /**
     * Checks if a Container exists, and, if it doesn't, creates it.
     * This will make a read operation based on the id in the `body`, then if it is not found, a create operation.
     * You should confirm that the output matches the body you passed in for non-default properties (i.e. indexing policy/etc.)
     *
     * A container is a named logical container for items.
     *
     * A database may contain zero or more named containers and each container consists of
     * zero or more JSON items.
     *
     * Being schema-free, the items in a container do not need to share the same structure or fields.
     *
     *
     * Since containers are application resources, they can be authorized using either the
     * master key or resource keys.
     *
     * @param body - Represents the body of the container.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     */
    async createIfNotExists(body, options) {
        if (!body || body.id === null || body.id === undefined) {
            throw new Error("body parameter must be an object with an id property");
        }
        /*
          1. Attempt to read the Container (based on an assumption that most containers will already exist, so its faster)
          2. If it fails with NotFound error, attempt to create the container. Else, return the read results.
        */
        return withDiagnostics(async (diagnosticNode) => {
            try {
                const readResponse = await this.database
                    .container(body.id)
                    .readInternal(diagnosticNode, options);
                return readResponse;
            }
            catch (err) {
                if (err.code === StatusCodes.NotFound) {
                    const createResponse = await this.createInternal(diagnosticNode, body, options);
                    // Must merge the headers to capture RU costskaty
                    mergeHeaders(createResponse.headers, err.headers);
                    return createResponse;
                }
                else {
                    throw err;
                }
            }
        }, this.clientContext);
    }
    /**
     * Read all containers.
     * @param options - Use to set options like response page size, continuation tokens, etc.
     * @returns {@link QueryIterator} Allows you to return all containers in an array or iterate over them one at a time.
     * @example Read all containers to array.
     * ```typescript
     * const {body: containerList} = await client.database("<db id>").containers.readAll().fetchAll();
     * ```
     */
    readAll(options) {
        return this.query(undefined, options);
    }
}
//# sourceMappingURL=Containers.js.map