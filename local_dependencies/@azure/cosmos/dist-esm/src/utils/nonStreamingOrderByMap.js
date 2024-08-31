// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
export class NonStreamingOrderByMap {
    constructor(compareFn) {
        this.compareFn = compareFn;
        this.map = new Map();
    }
    set(key, value) {
        if (!this.map.has(key)) {
            this.map.set(key, value);
        }
        else {
            const oldValue = this.map.get(key);
            if (this.replaceResults(oldValue, value)) {
                this.map.set(key, value);
            }
        }
    }
    get(key) {
        if (!this.map.has(key))
            return undefined;
        return this.map.get(key);
    }
    getAllValues() {
        const res = [];
        for (const [key, value] of this.map) {
            res.push(value);
            this.map.delete(key);
        }
        return res;
    }
    replaceResults(res1, res2) {
        const res = this.compareFn(res1, res2);
        if (res < 0)
            return true;
        return false;
    }
    size() {
        return this.map.size;
    }
}
//# sourceMappingURL=nonStreamingOrderByMap.js.map