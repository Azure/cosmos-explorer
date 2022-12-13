import { userContext } from "UserContext";
import DocumentId from "../../Explorer/Tree/DocumentId";

export const getPartitionKeyValue = (documentId: DocumentId) => {
  if (userContext.apiType === "Tables" && documentId.partitionKeyValue?.length === 0) {
    return "";
  }
  if (documentId.partitionKeyValue?.length === 0) {
    return undefined;
  }
  return documentId.partitionKeyValue;
};
