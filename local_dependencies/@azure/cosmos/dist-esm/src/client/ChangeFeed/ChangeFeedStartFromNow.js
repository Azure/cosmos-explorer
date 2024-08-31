// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from this moment in time.
 */
export class ChangeFeedStartFromNow {
    constructor(cfResource) {
        this.cfResource = cfResource;
    }
    getCfResource() {
        return this.cfResource;
    }
}
//# sourceMappingURL=ChangeFeedStartFromNow.js.map