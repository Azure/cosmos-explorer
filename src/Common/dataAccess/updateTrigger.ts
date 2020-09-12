import { TriggerDefinition } from "@azure/cosmos";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function updateTrigger(
  databaseId: string,
  collectionId: string,
  trigger: TriggerDefinition,
  options?: unknown
): Promise<TriggerDefinition> {
  let updatedTrigger: TriggerDefinition;
  const clearMessage = logConsoleProgress(`Updating trigger ${trigger.id}`);
  try {
    const repsonse = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.trigger(trigger.id)
      .replace(trigger, options);
    updatedTrigger = repsonse.resource;
  } catch (error) {
    logConsoleError(`Error while updating trigger ${trigger.id}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "UpdateTrigger", error.code);
    sendNotificationForError(error);
  }

  clearMessage();
  return updatedTrigger;
}
