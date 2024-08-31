import { createPermissionUri, getIdFromLink, getPathFromLink, isResourceValid, ResourceType, } from "../../common";
import { PermissionResponse } from "./PermissionResponse";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
/**
 * Use to read, replace, or delete a given {@link Permission} by id.
 *
 * @see {@link Permissions} to create, upsert, query, or read all Permissions.
 */
export class Permission {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return createPermissionUri(this.user.database.id, this.user.id, this.id);
    }
    /**
     * @hidden
     * @param user - The parent {@link User}.
     * @param id - The id of the given {@link Permission}.
     */
    constructor(user, id, clientContext) {
        this.user = user;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Read the {@link PermissionDefinition} of the given {@link Permission}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.read({
                path,
                resourceType: ResourceType.permission,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new PermissionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Replace the given {@link Permission} with the specified {@link PermissionDefinition}.
     * @param body - The specified {@link PermissionDefinition}.
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.replace({
                body,
                path,
                resourceType: ResourceType.permission,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new PermissionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
    /**
     * Delete the given {@link Permission}.
     */
    async delete(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const path = getPathFromLink(this.url);
            const id = getIdFromLink(this.url);
            const response = await this.clientContext.delete({
                path,
                resourceType: ResourceType.permission,
                resourceId: id,
                options,
                diagnosticNode,
            });
            return new PermissionResponse(response.result, response.headers, response.code, this, getEmptyCosmosDiagnostics());
        }, this.clientContext);
    }
}
//# sourceMappingURL=Permission.js.map