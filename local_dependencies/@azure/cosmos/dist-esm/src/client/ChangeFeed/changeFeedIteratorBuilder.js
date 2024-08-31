import { QueryRange } from "../../routing";
import { ChangeFeedStartFrom } from "./ChangeFeedStartFrom";
import { ChangeFeedStartFromBeginning } from "./ChangeFeedStartFromBeginning";
import { ChangeFeedStartFromContinuation } from "./ChangeFeedStartFromContinuation";
import { ChangeFeedStartFromNow } from "./ChangeFeedStartFromNow";
import { ChangeFeedStartFromTime } from "./ChangeFeedStartFromTime";
import { ChangeFeedResourceType } from "./ChangeFeedEnums";
import { ChangeFeedForPartitionKey } from "./ChangeFeedForPartitionKey";
import { ErrorResponse } from "../../request";
import { ChangeFeedForEpkRange } from "./ChangeFeedForEpkRange";
import { getIdFromLink, getPathFromLink, ResourceType, Constants } from "../../common";
import { buildInternalChangeFeedOptions, fetchStartTime, isEpkRange } from "./changeFeedUtils";
import { isPartitionKey } from "../../utils/typeChecks";
export function changeFeedIteratorBuilder(cfOptions, clientContext, container, partitionKeyRangeCache) {
    const url = container.url;
    const path = getPathFromLink(url, ResourceType.item);
    const id = getIdFromLink(url);
    let changeFeedStartFrom = cfOptions.changeFeedStartFrom;
    if (changeFeedStartFrom === undefined) {
        changeFeedStartFrom = ChangeFeedStartFrom.Now();
    }
    if (changeFeedStartFrom instanceof ChangeFeedStartFromContinuation) {
        const continuationToken = changeFeedStartFrom.getCfResourceJson();
        const resourceType = changeFeedStartFrom.getResourceType();
        const internalCfOptions = buildInternalChangeFeedOptions(cfOptions, changeFeedStartFrom.getCfResource());
        if (resourceType === ChangeFeedResourceType.PartitionKey &&
            isPartitionKey(continuationToken.partitionKey)) {
            return new ChangeFeedForPartitionKey(clientContext, container, id, path, continuationToken.partitionKey, internalCfOptions);
        }
        else if (resourceType === ChangeFeedResourceType.FeedRange) {
            return new ChangeFeedForEpkRange(clientContext, container, partitionKeyRangeCache, id, path, url, internalCfOptions, undefined);
        }
        else {
            throw new ErrorResponse("Invalid continuation token.");
        }
    }
    else if (changeFeedStartFrom instanceof ChangeFeedStartFromNow ||
        changeFeedStartFrom instanceof ChangeFeedStartFromTime ||
        changeFeedStartFrom instanceof ChangeFeedStartFromBeginning) {
        const startTime = fetchStartTime(changeFeedStartFrom);
        const internalCfOptions = buildInternalChangeFeedOptions(cfOptions, undefined, startTime);
        const cfResource = changeFeedStartFrom.getCfResource();
        if (isPartitionKey(cfResource)) {
            return new ChangeFeedForPartitionKey(clientContext, container, id, path, cfResource, internalCfOptions);
        }
        else {
            let internalCfResource;
            if (cfResource === undefined) {
                internalCfResource = new QueryRange(Constants.EffectivePartitionKeyConstants.MinimumInclusiveEffectivePartitionKey, Constants.EffectivePartitionKeyConstants.MaximumExclusiveEffectivePartitionKey, true, false);
            }
            else if (isEpkRange(cfResource)) {
                internalCfResource = new QueryRange(cfResource.minInclusive, cfResource.maxExclusive, true, false);
            }
            else {
                throw new ErrorResponse("Invalid feed range.");
            }
            return new ChangeFeedForEpkRange(clientContext, container, partitionKeyRangeCache, id, path, url, internalCfOptions, internalCfResource);
        }
    }
    else {
        throw new ErrorResponse("Invalid change feed start location.");
    }
}
//# sourceMappingURL=changeFeedIteratorBuilder.js.map