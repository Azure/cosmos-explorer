import { Resource, TriggerDefinition } from "@azure/cosmos";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function readTriggers(
  databaseId: string,
  collectionId: string
): Promise<(TriggerDefinition & Resource)[]> {
  let triggers: (TriggerDefinition & Resource)[];
  const clearMessage = logConsoleProgress(`Querying triggers for container ${collectionId}`);
  try {
    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.triggers.readAll()
      .fetchAll();
    triggers = response.resources;
  } catch (error) {
    logConsoleError(`Failed to query triggers for container ${collectionId}: ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "ReadTriggers", error.code);
    sendNotificationForError(error);
  }
  clearMessage();
  return triggers;
}
