import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";

export async function createUserDefinedFunction(
  databaseId: string,
  collectionId: string,
  userDefinedFunction: UserDefinedFunctionDefinition,
  options?: unknown
): Promise<UserDefinedFunctionDefinition & Resource> {
  let createdUserDefinedFunction: UserDefinedFunctionDefinition & Resource;
  const clearMessage = logConsoleProgress(`Creating user defined function ${userDefinedFunction.id}`);
  try {
    const repsonse = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunctions.create(userDefinedFunction, options);
    createdUserDefinedFunction = repsonse.resource;
  } catch (error) {
    logConsoleError(`Error while creating user defined function ${userDefinedFunction.id}:\n ${JSON.stringify(error)}`);
    logError(JSON.stringify(error), "CreateUserupdateUserDefinedFunction", error.code);
    sendNotificationForError(error);
  }

  clearMessage();
  return createdUserDefinedFunction;
}
