import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function readStoredProcedures(
  databaseId: string,
  collectionId: string
): Promise<(StoredProcedureDefinition & Resource)[]> {
  let sprocs: (StoredProcedureDefinition & Resource)[];
  const clearMessage = logConsoleProgress(`Querying stored procedures for container ${collectionId}`);
  try {
    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedures.readAll()
      .fetchAll();
    sprocs = response.resources;
  } catch (error) {
    logConsoleError(`Failed to query stored procedures for container ${collectionId}: ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadStoredProcedures", error.code);
    sendNotificationForError(error);
  }
  clearMessage();
  return sprocs;
}
