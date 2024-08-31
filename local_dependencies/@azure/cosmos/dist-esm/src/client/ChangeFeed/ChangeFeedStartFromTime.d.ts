import { PartitionKey } from "../../documents";
import { FeedRange } from "./FeedRange";
/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from a particular point of time.
 */
export declare class ChangeFeedStartFromTime {
    private cfResource?;
    private startTime;
    constructor(startTime: Date, cfResource?: PartitionKey | FeedRange);
    getCfResource(): PartitionKey | FeedRange | undefined;
    getStartTime(): Date;
}
//# sourceMappingURL=ChangeFeedStartFromTime.d.ts.map