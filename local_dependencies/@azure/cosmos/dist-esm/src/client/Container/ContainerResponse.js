import { ResourceResponse } from "../../request/ResourceResponse";
/** Response object for Container operations */
export class ContainerResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, container, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.container = container;
    }
}
//# sourceMappingURL=ContainerResponse.js.map