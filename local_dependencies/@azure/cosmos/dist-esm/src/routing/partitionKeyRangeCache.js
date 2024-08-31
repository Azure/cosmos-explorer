// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { MetadataLookUpType } from "../CosmosDiagnostics";
import { getIdFromLink } from "../common/helper";
import { withMetadataDiagnostics } from "../utils/diagnostics";
import { createCompleteRoutingMap } from "./CollectionRoutingMapFactory";
/** @hidden */
export class PartitionKeyRangeCache {
    constructor(clientContext) {
        this.clientContext = clientContext;
        this.collectionRoutingMapByCollectionId = {};
    }
    /**
     * Finds or Instantiates the requested Collection Routing Map
     * @param collectionLink - Requested collectionLink
     * @hidden
     */
    async onCollectionRoutingMap(collectionLink, diagnosticNode, forceRefresh = false) {
        const collectionId = getIdFromLink(collectionLink);
        if (this.collectionRoutingMapByCollectionId[collectionId] === undefined || forceRefresh) {
            this.collectionRoutingMapByCollectionId[collectionId] = this.requestCollectionRoutingMap(collectionLink, diagnosticNode);
        }
        return this.collectionRoutingMapByCollectionId[collectionId];
    }
    /**
     * Given the query ranges and a collection, invokes the callback on the list of overlapping partition key ranges
     * @hidden
     */
    async getOverlappingRanges(collectionLink, queryRange, diagnosticNode, forceRefresh = false) {
        const crm = await this.onCollectionRoutingMap(collectionLink, diagnosticNode, forceRefresh);
        return crm.getOverlappingRanges(queryRange);
    }
    async requestCollectionRoutingMap(collectionLink, diagnosticNode) {
        const { resources } = await withMetadataDiagnostics(async (metadataDiagnostics) => {
            return this.clientContext
                .queryPartitionKeyRanges(collectionLink)
                .fetchAllInternal(metadataDiagnostics);
        }, diagnosticNode, MetadataLookUpType.PartitionKeyRangeLookUp);
        return createCompleteRoutingMap(resources.map((r) => [r, true]));
    }
}
//# sourceMappingURL=partitionKeyRangeCache.js.map