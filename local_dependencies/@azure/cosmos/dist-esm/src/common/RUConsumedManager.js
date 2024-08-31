// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import semaphore from "semaphore";
/**
 * @hidden
 * @hidden
 * Specifies Net RUConsumed
 */
export class RUConsumedManager {
    constructor() {
        this.ruConsumed = 0;
        this.semaphore = semaphore(1);
    }
    getRUConsumed() {
        return new Promise((resolve) => {
            this.semaphore.take(() => {
                this.semaphore.leave();
                resolve(this.ruConsumed);
            });
        });
    }
    addToRUConsumed(value) {
        return new Promise((resolve) => {
            this.semaphore.take(() => {
                this.ruConsumed += value;
                this.semaphore.leave();
                resolve();
            });
        });
    }
}
//# sourceMappingURL=RUConsumedManager.js.map