import { PartitionKeyRange } from "../client/Container/PartitionKeyRange";
import { ClientContext } from "../ClientContext";
import { DiagnosticNodeInternal } from "../diagnostics/DiagnosticNodeInternal";
import { InMemoryCollectionRoutingMap } from "./inMemoryCollectionRoutingMap";
import { QueryRange } from "./QueryRange";
/** @hidden */
export declare class PartitionKeyRangeCache {
    private clientContext;
    private collectionRoutingMapByCollectionId;
    constructor(clientContext: ClientContext);
    /**
     * Finds or Instantiates the requested Collection Routing Map
     * @param collectionLink - Requested collectionLink
     * @hidden
     */
    onCollectionRoutingMap(collectionLink: string, diagnosticNode: DiagnosticNodeInternal, forceRefresh?: boolean): Promise<InMemoryCollectionRoutingMap>;
    /**
     * Given the query ranges and a collection, invokes the callback on the list of overlapping partition key ranges
     * @hidden
     */
    getOverlappingRanges(collectionLink: string, queryRange: QueryRange, diagnosticNode: DiagnosticNodeInternal, forceRefresh?: boolean): Promise<PartitionKeyRange[]>;
    private requestCollectionRoutingMap;
}
//# sourceMappingURL=partitionKeyRangeCache.d.ts.map