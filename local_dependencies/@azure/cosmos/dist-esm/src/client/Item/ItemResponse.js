import { ResourceResponse } from "../../request/ResourceResponse";
export class ItemResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, subsstatusCode, item, diagnostics) {
        super(resource, headers, statusCode, diagnostics, subsstatusCode);
        this.item = item;
    }
}
//# sourceMappingURL=ItemResponse.js.map