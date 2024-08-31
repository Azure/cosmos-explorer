import { PartitionKey } from "../../documents";
import { FeedRange } from "./FeedRange";
import { ChangeFeedStartFromNow } from "./ChangeFeedStartFromNow";
import { ChangeFeedStartFromBeginning } from "./ChangeFeedStartFromBeginning";
import { ChangeFeedStartFromTime } from "./ChangeFeedStartFromTime";
import { ChangeFeedStartFromContinuation } from "./ChangeFeedStartFromContinuation";
/**
 * Base class for where to start a ChangeFeedIterator.
 */
export declare abstract class ChangeFeedStartFrom {
    /**
     * Returns an object that tells the ChangeFeedIterator to start from the beginning of time.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     */
    static Beginning(cfResource?: PartitionKey | FeedRange): ChangeFeedStartFromBeginning;
    /**
     *  Returns an object that tells the ChangeFeedIterator to start reading changes from this moment onward.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     **/
    static Now(cfResource?: PartitionKey | FeedRange): ChangeFeedStartFromNow;
    /**
     * Returns an object that tells the ChangeFeedIterator to start reading changes from some point in time onward.
     * @param startTime - Date object specfiying the time to start reading changes from.
     * @param cfResource - PartitionKey or FeedRange for which changes are to be fetched. Leave blank for fetching changes for entire container.
     */
    static Time(startTime: Date, cfResource?: PartitionKey | FeedRange): ChangeFeedStartFromTime;
    /**
     * Returns an object that tells the ChangeFeedIterator to start reading changes from a save point.
     * @param continuation - The continuation to resume from.
     */
    static Continuation(continuationToken: string): ChangeFeedStartFromContinuation;
}
//# sourceMappingURL=ChangeFeedStartFrom.d.ts.map