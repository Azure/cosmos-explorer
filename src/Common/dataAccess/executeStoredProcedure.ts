import { Collection } from "../../Contracts/ViewModels";
import { ClientDefaults, HttpHeaders } from "../Constants";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress, logConsoleInfo } from "../../Utils/NotificationConsoleUtils";
import StoredProcedure from "../../Explorer/Tree/StoredProcedure";

export interface ExecuteSprocResult {
  result: StoredProcedure;
  scriptLogs: string;
}

export const executeStoredProcedure = async (
  collection: Collection,
  storedProcedure: StoredProcedure,
  partitionKeyValue: string,
  params: string[],
): Promise<ExecuteSprocResult> => {
  const clearMessage = logConsoleProgress(`Executing stored procedure ${storedProcedure.id()}`);
  const timeout = setTimeout(() => {
    throw Error(`Request timed out while executing stored procedure ${storedProcedure.id()}`);
  }, ClientDefaults.requestTimeoutMs);

  try {
    const response = await client()
      .database(collection.databaseId)
      .container(collection.id())
      .scripts.storedProcedure(storedProcedure.id())
      .execute(partitionKeyValue, params, { enableScriptLogging: true });
    clearTimeout(timeout);
    logConsoleInfo(
      `Finished executing stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}`,
    );
    return {
      result: response.resource,
      scriptLogs: response.headers[HttpHeaders.scriptLogResults] as string,
    };
  } catch (error) {
    handleError(
      error,
      "ExecuteStoredProcedure",
      `Failed to execute stored procedure ${storedProcedure.id()} for container ${storedProcedure.collection.id()}`,
    );
    throw error;
  } finally {
    clearMessage();
  }
};
