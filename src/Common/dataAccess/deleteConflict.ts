import ConflictId from "../../Explorer/Tree/ConflictId";
import { CollectionBase } from "../../Contracts/ViewModels";
import { RequestOptions } from "@azure/cosmos";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress, logConsoleInfo } from "../../Utils/NotificationConsoleUtils";

export const deleteConflict = async (collection: CollectionBase, conflictId: ConflictId): Promise<void> => {
  const clearMessage = logConsoleProgress(`Deleting conflict ${conflictId.id()}`);

  try {
    const options = {
      partitionKey: getPartitionKeyHeaderForConflict(conflictId)
    };

    await client()
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
