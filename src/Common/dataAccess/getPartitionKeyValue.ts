import DocumentId from "../../Explorer/Tree/DocumentId";

export const getPartitionKeyValue = (documentId: DocumentId): any => {
    if (documentId.partitionKeyProperties === undefined && documentId.partitionKeyValue?.length === 0) {
        return "";
    }
    if (documentId.partitionKeyValue?.length === 0) {
        return undefined;
    }
    return documentId.partitionKeyValue;
}