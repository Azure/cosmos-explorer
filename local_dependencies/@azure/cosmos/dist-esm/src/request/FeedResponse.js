// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { Constants } from "../common";
import { getRequestChargeIfAny } from "../queryExecutionContext/headerUtils";
import { IndexMetricWriter, IndexUtilizationInfo } from "../indexMetrics";
export class FeedResponse {
    constructor(resources, headers, hasMoreResults, diagnostics) {
        this.resources = resources;
        this.headers = headers;
        this.hasMoreResults = hasMoreResults;
        this.diagnostics = diagnostics;
    }
    get continuation() {
        return this.continuationToken;
    }
    get continuationToken() {
        return this.headers[Constants.HttpHeaders.Continuation];
    }
    get queryMetrics() {
        return this.headers[Constants.HttpHeaders.QueryMetrics];
    }
    get requestCharge() {
        return getRequestChargeIfAny(this.headers);
    }
    get activityId() {
        return this.headers[Constants.HttpHeaders.ActivityId];
    }
    get indexMetrics() {
        const writer = new IndexMetricWriter();
        const indexUtilizationInfo = IndexUtilizationInfo.createFromString(this.headers[Constants.HttpHeaders.IndexUtilization], true);
        return writer.writeIndexMetrics(indexUtilizationInfo);
    }
}
//# sourceMappingURL=FeedResponse.js.map