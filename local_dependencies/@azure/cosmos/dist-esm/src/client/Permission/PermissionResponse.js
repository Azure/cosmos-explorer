import { ResourceResponse } from "../../request";
export class PermissionResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, permission, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.permission = permission;
    }
}
//# sourceMappingURL=PermissionResponse.js.map