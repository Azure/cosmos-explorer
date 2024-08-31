// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { PartitionKeyDefinitionVersion, PartitionKeyKind, } from "../../documents";
import { hashMultiHashPartitionKey } from "./multiHash";
import { hashV1PartitionKey } from "./v1";
import { hashV2PartitionKey } from "./v2";
/**
 * Generate hash of a PartitonKey based on it PartitionKeyDefinition.
 * @param partitionKey - to be hashed.
 * @param partitionDefinition - container's partitionKey definition
 * @returns
 */
export function hashPartitionKey(partitionKey, partitionDefinition) {
    const kind = (partitionDefinition === null || partitionDefinition === void 0 ? void 0 : partitionDefinition.kind) || PartitionKeyKind.Hash; // Default value.
    const isV2 = partitionDefinition &&
        partitionDefinition.version &&
        partitionDefinition.version === PartitionKeyDefinitionVersion.V2;
    switch (kind) {
        case PartitionKeyKind.Hash:
            return isV2 ? hashV2PartitionKey(partitionKey) : hashV1PartitionKey(partitionKey);
        case PartitionKeyKind.MultiHash:
            return hashMultiHashPartitionKey(partitionKey);
    }
}
//# sourceMappingURL=hash.js.map