import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function updateUserDefinedFunction(
  databaseId: string,
  collectionId: string,
  userDefinedFunction: UserDefinedFunctionDefinition
): Promise<UserDefinedFunctionDefinition & Resource> {
  let updatedUserDefinedFunction: UserDefinedFunctionDefinition & Resource;
  const clearMessage = logConsoleProgress(`Updating user defined function ${userDefinedFunction.id}`);
  try {
    const repsonse = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunction(userDefinedFunction.id)
      .replace(userDefinedFunction);
    updatedUserDefinedFunction = repsonse.resource;
  } catch (error) {
    logConsoleError(`Error while updating user defined function ${userDefinedFunction.id}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "UpdateUserupdateUserDefinedFunction", error.code);
    sendNotificationForError(error);
  }

  clearMessage();
  return updatedUserDefinedFunction;
}
