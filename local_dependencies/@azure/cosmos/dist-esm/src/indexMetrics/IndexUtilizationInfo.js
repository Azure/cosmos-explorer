// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
export class IndexUtilizationInfo {
    constructor(UtilizedSingleIndexes, PotentialSingleIndexes, UtilizedCompositeIndexes, PotentialCompositeIndexes) {
        this.UtilizedSingleIndexes = UtilizedSingleIndexes;
        this.PotentialSingleIndexes = PotentialSingleIndexes;
        this.UtilizedCompositeIndexes = UtilizedCompositeIndexes;
        this.PotentialCompositeIndexes = PotentialCompositeIndexes;
    }
    static tryCreateFromDelimitedBase64String(delimitedString, out) {
        if (delimitedString == null) {
            out.result = IndexUtilizationInfo.Empty;
            return false;
        }
        return IndexUtilizationInfo.tryCreateFromDelimitedString(Buffer.from(delimitedString, "base64").toString(), out);
    }
    static tryCreateFromDelimitedString(delimitedString, out) {
        if (delimitedString == null) {
            out.result = IndexUtilizationInfo.Empty;
            return false;
        }
        try {
            out.result = JSON.parse(delimitedString) || IndexUtilizationInfo.Empty;
            return true;
        }
        catch (error) {
            out.result = IndexUtilizationInfo.Empty;
            return false;
        }
    }
    static createFromString(delimitedString, isBase64Encoded) {
        var _a;
        const result = { result: undefined };
        if (isBase64Encoded) {
            IndexUtilizationInfo.tryCreateFromDelimitedBase64String(delimitedString, result);
        }
        else {
            IndexUtilizationInfo.tryCreateFromDelimitedString(delimitedString, result);
        }
        return (_a = result.result) !== null && _a !== void 0 ? _a : IndexUtilizationInfo.Empty;
    }
}
IndexUtilizationInfo.Empty = new IndexUtilizationInfo([], [], [], []);
//# sourceMappingURL=IndexUtilizationInfo.js.map