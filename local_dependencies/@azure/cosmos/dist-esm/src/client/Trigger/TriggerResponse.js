import { ResourceResponse } from "../../request";
export class TriggerResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, trigger, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.trigger = trigger;
    }
}
//# sourceMappingURL=TriggerResponse.js.map