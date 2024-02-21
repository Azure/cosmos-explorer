import { JSONObject, OperationResponse } from "@azure/cosmos";
import { CollectionBase } from "../../Contracts/ViewModels";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { ClientOperationType, client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export const bulkCreateDocument = async (
  collection: CollectionBase,
  documents: JSONObject[],
): Promise<OperationResponse[]> => {
  const clearMessage = logConsoleProgress(
    `Executing ${documents.length} bulk operations for container ${collection.id()}`,
  );

  try {
    const response = await client(ClientOperationType.WRITE)
      .database(collection.databaseId)
      .container(collection.id())
      .items.bulk(
        documents.map((doc) => ({ operationType: "Create", resourceBody: doc })),
        { continueOnError: true },
      );

    const successCount = response.filter((r) => r.statusCode === 201).length;
    const throttledCount = response.filter((r) => r.statusCode === 429).length;

    logConsoleInfo(
      `${
        documents.length
      } operations completed for container ${collection.id()}. ${successCount} operations succeeded. ${throttledCount} operations throttled`,
    );
    return response;
  } catch (error) {
    handleError(error, "BulkCreateDocument", `Error bulk creating items for container ${collection.id()}`);
    throw error;
  } finally {
    clearMessage();
  }
};
