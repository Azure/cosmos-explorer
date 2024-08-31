import { PartitionKey } from "../../documents";
import { FeedRange } from "./FeedRange";
/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from this moment in time.
 */
export declare class ChangeFeedStartFromNow {
    cfResource?: PartitionKey | FeedRange;
    constructor(cfResource?: PartitionKey | FeedRange);
    getCfResource(): PartitionKey | FeedRange | undefined;
}
//# sourceMappingURL=ChangeFeedStartFromNow.d.ts.map