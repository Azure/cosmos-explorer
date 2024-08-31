import { ErrorResponse } from "../../request";
import { isPrimitivePartitionKeyValue } from "../../utils/typeChecks";
import { ChangeFeedStartFromBeginning } from "./ChangeFeedStartFromBeginning";
import { ChangeFeedStartFromNow } from "./ChangeFeedStartFromNow";
import { Constants } from "../../common";
import { ChangeFeedStartFromTime } from "./ChangeFeedStartFromTime";
import { FeedRangeInternal } from "./FeedRange";
/**
 * @hidden
 * Validates the change feed options passed by the user
 */
export function validateChangeFeedIteratorOptions(options) {
    if (!isChangeFeedIteratorOptions(options)) {
        throw new ErrorResponse("Invalid Changefeed Iterator Options.");
    }
    if ((options === null || options === void 0 ? void 0 : options.maxItemCount) && typeof (options === null || options === void 0 ? void 0 : options.maxItemCount) !== "number") {
        throw new ErrorResponse("maxItemCount must be number");
    }
    if ((options === null || options === void 0 ? void 0 : options.maxItemCount) !== undefined && (options === null || options === void 0 ? void 0 : options.maxItemCount) < 1) {
        throw new ErrorResponse("maxItemCount must be a positive number");
    }
}
function isChangeFeedIteratorOptions(options) {
    if (typeof options !== "object") {
        return false;
    }
    if (Object.keys(options).length === 0 && JSON.stringify(options) === "{}") {
        return true;
    }
    return options && !(isPrimitivePartitionKeyValue(options) || Array.isArray(options));
}
/**
 * @hidden
 * Checks if pkRange entirely covers the given overLapping range or there is only partial overlap.
 *
 * If no complete overlap, exact range which overlaps is retured which is used to set minEpk and maxEpk headers while quering change feed.
 */
export async function extractOverlappingRanges(epkRange, overLappingRange) {
    if (overLappingRange.minInclusive >= epkRange.min &&
        overLappingRange.maxExclusive <= epkRange.max) {
        return [undefined, undefined];
    }
    else if (overLappingRange.minInclusive <= epkRange.min &&
        overLappingRange.maxExclusive >= epkRange.max) {
        return [epkRange.min, epkRange.max];
    }
    // Right Side of overlapping range is covered
    else if (overLappingRange.minInclusive <= epkRange.min &&
        overLappingRange.maxExclusive <= epkRange.max &&
        overLappingRange.maxExclusive >= epkRange.min) {
        return [epkRange.min, overLappingRange.maxExclusive];
    }
    // Left Side of overlapping range is covered
    else {
        return [overLappingRange.minInclusive, epkRange.max];
    }
}
/**
 * @hidden
 * Checks if the object is a valid EpkRange
 */
export function isEpkRange(obj) {
    return (obj instanceof FeedRangeInternal &&
        typeof obj.minInclusive === "string" &&
        typeof obj.maxExclusive === "string" &&
        obj.minInclusive >=
            Constants.EffectivePartitionKeyConstants.MinimumInclusiveEffectivePartitionKey &&
        obj.maxExclusive <=
            Constants.EffectivePartitionKeyConstants.MaximumExclusiveEffectivePartitionKey &&
        obj.maxExclusive > obj.minInclusive);
}
/**
 * @hidden
 */
export function buildInternalChangeFeedOptions(options, continuationToken, startTime) {
    const internalCfOptions = {};
    internalCfOptions.maxItemCount = options === null || options === void 0 ? void 0 : options.maxItemCount;
    internalCfOptions.sessionToken = options === null || options === void 0 ? void 0 : options.sessionToken;
    internalCfOptions.continuationToken = continuationToken;
    // Default option of changefeed is to start from now.
    internalCfOptions.startTime = startTime;
    return internalCfOptions;
}
/**
 * @hidden
 */
export function fetchStartTime(changeFeedStartFrom) {
    if (changeFeedStartFrom instanceof ChangeFeedStartFromBeginning) {
        return undefined;
    }
    else if (changeFeedStartFrom instanceof ChangeFeedStartFromNow) {
        return new Date();
    }
    else if (changeFeedStartFrom instanceof ChangeFeedStartFromTime) {
        return changeFeedStartFrom.getStartTime();
    }
}
/**
 * @hidden
 */
export function isNullOrEmpty(text) {
    return text === null || text === undefined || text.trim() === "";
}
//# sourceMappingURL=changeFeedUtils.js.map