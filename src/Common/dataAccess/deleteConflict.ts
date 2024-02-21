import { RequestOptions } from "@azure/cosmos";
import { CollectionBase } from "../../Contracts/ViewModels";
import ConflictId from "../../Explorer/Tree/ConflictId";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { ClientOperationType, client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export const deleteConflict = async (collection: CollectionBase, conflictId: ConflictId): Promise<void> => {
  const clearMessage = logConsoleProgress(`Deleting conflict ${conflictId.id()}`);

  try {
    const options = {
      partitionKey: getPartitionKeyHeaderForConflict(conflictId),
    };

    await client(ClientOperationType.WRITE)
      .database(collection.databaseId)
      .container(collection.id())
      .conflict(conflictId.id())
      .delete(options as RequestOptions);
    logConsoleInfo(`Successfully deleted conflict ${conflictId.id()}`);
  } catch (error) {
    handleError(error, "DeleteConflict", `Error while deleting conflict ${conflictId.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};

const getPartitionKeyHeaderForConflict = (conflictId: ConflictId): unknown => {
  if (!conflictId.partitionKey) {
    return undefined;
  }

  return conflictId.partitionKeyValue === undefined ? [{}] : [conflictId.partitionKeyValue];
};
