// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
export async function readPartitionKeyDefinition(diagnosticNode, container) {
    const partitionKeyDefinition = await container.readPartitionKeyDefinition(diagnosticNode);
    return partitionKeyDefinition.resource;
}
//# sourceMappingURL=ClientUtils.js.map