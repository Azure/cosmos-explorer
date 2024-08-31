import { PartitionKey } from "../../documents";
import { FeedRange } from "./FeedRange";
/**
 * @hidden
 * Class which specifies the ChangeFeedIterator to start reading changes from beginning of time.
 */
export declare class ChangeFeedStartFromBeginning {
    private cfResource?;
    constructor(cfResource?: PartitionKey | FeedRange);
    getCfResource(): PartitionKey | FeedRange | undefined;
}
//# sourceMappingURL=ChangeFeedStartFromBeginning.d.ts.map