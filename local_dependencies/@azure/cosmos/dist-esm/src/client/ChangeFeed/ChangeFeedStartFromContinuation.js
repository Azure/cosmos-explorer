// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { ErrorResponse } from "../../request";
import { ChangeFeedResourceType } from "./ChangeFeedEnums";
/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from a saved point.
 */
export class ChangeFeedStartFromContinuation {
    constructor(continuation) {
        this.continuationToken = continuation;
    }
    getCfResource() {
        return this.continuationToken;
    }
    getCfResourceJson() {
        return JSON.parse(this.continuationToken);
    }
    getResourceType() {
        const cToken = this.getCfResourceJson();
        if (Object.prototype.hasOwnProperty.call(cToken, "partitionKey") &&
            Object.prototype.hasOwnProperty.call(cToken, "Continuation") &&
            typeof cToken.Continuation === "string") {
            return ChangeFeedResourceType.PartitionKey;
        }
        else if (Object.prototype.hasOwnProperty.call(cToken, "Continuation") &&
            Array.isArray(cToken.Continuation) &&
            cToken.Continuation.length > 0) {
            return ChangeFeedResourceType.FeedRange;
        }
        else {
            throw new ErrorResponse("Invalid continuation token.");
        }
    }
}
//# sourceMappingURL=ChangeFeedStartFromContinuation.js.map