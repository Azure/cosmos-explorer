import { ResourceResponse } from "../../request";
export class UserResponse extends ResourceResponse {
    constructor(resource, headers, statusCode, user, diagnostics) {
        super(resource, headers, statusCode, diagnostics);
        this.user = user;
    }
}
//# sourceMappingURL=UserResponse.js.map