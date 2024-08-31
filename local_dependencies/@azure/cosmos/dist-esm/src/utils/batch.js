// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { extractPartitionKeys } from "../extractPartitionKey";
import { NonePartitionKeyLiteral, convertToInternalPartitionKey, } from "../documents";
import { v4 } from "uuid";
import { assertNotUndefined } from "./typeChecks";
import { bodyFromData } from "../request/request";
import { Constants } from "../common/constants";
const uuid = v4;
export function isKeyInRange(min, max, key) {
    const isAfterMinInclusive = key.localeCompare(min) >= 0;
    const isBeforeMax = key.localeCompare(max) < 0;
    return isAfterMinInclusive && isBeforeMax;
}
export const BulkOperationType = {
    Create: "Create",
    Upsert: "Upsert",
    Read: "Read",
    Delete: "Delete",
    Replace: "Replace",
    Patch: "Patch",
};
export function hasResource(operation) {
    return (operation.operationType !== "Patch" &&
        operation.resourceBody !== undefined);
}
/**
 * Maps OperationInput to Operation by
 * - generating Ids if needed.
 * - choosing partitionKey which can be used to choose which batch this
 * operation should be part of. The order is -
 *   1. If the operationInput itself has partitionKey field set it is used.
 *   2. Other wise for create/replace/upsert it is extracted from resource body.
 *   3. For read/delete/patch type operations undefined partitionKey is used.
 * - Here one nuance is that, the partitionKey field inside Operation needs to
 *  be serialized as a JSON string.
 * @param operationInput - OperationInput
 * @param definition - PartitionKeyDefinition
 * @param options - RequestOptions
 * @returns
 */
export function prepareOperations(operationInput, definition, options = {}) {
    populateIdsIfNeeded(operationInput, options);
    let partitionKey;
    if (Object.prototype.hasOwnProperty.call(operationInput, "partitionKey")) {
        if (operationInput.partitionKey === undefined) {
            partitionKey = definition.paths.map(() => NonePartitionKeyLiteral);
        }
        else {
            partitionKey = convertToInternalPartitionKey(operationInput.partitionKey);
        }
    }
    else {
        switch (operationInput.operationType) {
            case BulkOperationType.Create:
            case BulkOperationType.Replace:
            case BulkOperationType.Upsert:
                partitionKey = assertNotUndefined(extractPartitionKeys(operationInput.resourceBody, definition), "Unexpected undefined Partition Key Found.");
                break;
            case BulkOperationType.Read:
            case BulkOperationType.Delete:
            case BulkOperationType.Patch:
                partitionKey = definition.paths.map(() => NonePartitionKeyLiteral);
        }
    }
    return {
        operation: Object.assign(Object.assign({}, operationInput), { partitionKey: JSON.stringify(partitionKey) }),
        partitionKey,
    };
}
/**
 * For operations requiring Id genrate random uuids.
 * @param operationInput - OperationInput to be checked.
 * @param options - RequestOptions
 */
function populateIdsIfNeeded(operationInput, options) {
    if (operationInput.operationType === BulkOperationType.Create ||
        operationInput.operationType === BulkOperationType.Upsert) {
        if ((operationInput.resourceBody.id === undefined || operationInput.resourceBody.id === "") &&
            !options.disableAutomaticIdGeneration) {
            operationInput.resourceBody.id = uuid();
        }
    }
}
/**
 * Splits a batch into array of batches based on cumulative size of its operations by making sure
 * cumulative size of an individual batch is not larger than {@link Constants.DefaultMaxBulkRequestBodySizeInBytes}.
 * If a single operation itself is larger than {@link Constants.DefaultMaxBulkRequestBodySizeInBytes}, that
 * operation would be moved into a batch containing only that operation.
 * @param originalBatch - A batch of operations needed to be checked.
 * @returns
 * @hidden
 */
export function splitBatchBasedOnBodySize(originalBatch) {
    if ((originalBatch === null || originalBatch === void 0 ? void 0 : originalBatch.operations) === undefined || originalBatch.operations.length < 1)
        return [];
    let currentBatchSize = calculateObjectSizeInBytes(originalBatch.operations[0]);
    let currentBatch = Object.assign(Object.assign({}, originalBatch), { operations: [originalBatch.operations[0]], indexes: [originalBatch.indexes[0]] });
    const processedBatches = [];
    processedBatches.push(currentBatch);
    for (let index = 1; index < originalBatch.operations.length; index++) {
        const operation = originalBatch.operations[index];
        const currentOpSize = calculateObjectSizeInBytes(operation);
        if (currentBatchSize + currentOpSize > Constants.DefaultMaxBulkRequestBodySizeInBytes) {
            currentBatch = Object.assign(Object.assign({}, originalBatch), { operations: [], indexes: [] });
            processedBatches.push(currentBatch);
            currentBatchSize = 0;
        }
        currentBatch.operations.push(operation);
        currentBatch.indexes.push(originalBatch.indexes[index]);
        currentBatchSize += currentOpSize;
    }
    return processedBatches;
}
/**
 * Calculates size of an JSON object in bytes with utf-8 encoding.
 * @hidden
 */
export function calculateObjectSizeInBytes(obj) {
    return new TextEncoder().encode(bodyFromData(obj)).length;
}
export function decorateBatchOperation(operation, options = {}) {
    if (operation.operationType === BulkOperationType.Create ||
        operation.operationType === BulkOperationType.Upsert) {
        if ((operation.resourceBody.id === undefined || operation.resourceBody.id === "") &&
            !options.disableAutomaticIdGeneration) {
            operation.resourceBody.id = uuid();
        }
    }
    return operation;
}
//# sourceMappingURL=batch.js.map