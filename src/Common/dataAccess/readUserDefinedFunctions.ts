import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function readUserDefinedFunctions(
  databaseId: string,
  collectionId: string
): Promise<(UserDefinedFunctionDefinition & Resource)[]> {
  let udfs: (UserDefinedFunctionDefinition & Resource)[];
  const clearMessage = logConsoleProgress(`Querying user defined functions for container ${collectionId}`);
  try {
    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunctions.readAll()
      .fetchAll();
    udfs = response.resources;
  } catch (error) {
    logConsoleError(`Failed to query user defined functions for container ${collectionId}: ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadUserDefinedFunctions", error.code);
    sendNotificationForError(error);
  }
  clearMessage();
  return udfs;
}
