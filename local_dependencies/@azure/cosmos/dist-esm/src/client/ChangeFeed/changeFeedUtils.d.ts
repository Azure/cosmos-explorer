import { ChangeFeedIteratorOptions } from "./ChangeFeedIteratorOptions";
import { PartitionKeyRange } from "../Container";
import { InternalChangeFeedIteratorOptions } from "./InternalChangeFeedOptions";
import { ChangeFeedStartFrom } from "./ChangeFeedStartFrom";
import { QueryRange } from "../../routing";
/**
 * @hidden
 * Validates the change feed options passed by the user
 */
export declare function validateChangeFeedIteratorOptions(options: ChangeFeedIteratorOptions): void;
/**
 * @hidden
 * Checks if pkRange entirely covers the given overLapping range or there is only partial overlap.
 *
 * If no complete overlap, exact range which overlaps is retured which is used to set minEpk and maxEpk headers while quering change feed.
 */
export declare function extractOverlappingRanges(epkRange: QueryRange, overLappingRange: PartitionKeyRange): Promise<[string, string]>;
/**
 * @hidden
 * Checks if the object is a valid EpkRange
 */
export declare function isEpkRange(obj: unknown): boolean;
/**
 * @hidden
 */
export declare function buildInternalChangeFeedOptions(options: ChangeFeedIteratorOptions, continuationToken?: string, startTime?: Date): InternalChangeFeedIteratorOptions;
/**
 * @hidden
 */
export declare function fetchStartTime(changeFeedStartFrom: ChangeFeedStartFrom): Date | undefined;
/**
 * @hidden
 */
export declare function isNullOrEmpty(text: string | null | undefined): boolean;
//# sourceMappingURL=changeFeedUtils.d.ts.map