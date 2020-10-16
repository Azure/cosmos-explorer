import { AuthType } from "../../AuthType";
import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import {
  SqlUserDefinedFunctionCreateUpdateParameters,
  SqlUserDefinedFunctionResource
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { client } from "../CosmosClient";
import {
  createUpdateSqlUserDefinedFunction,
  getSqlUserDefinedFunction
} from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleError, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";

export async function updateUserDefinedFunction(
  databaseId: string,
  collectionId: string,
  userDefinedFunction: UserDefinedFunctionDefinition
): Promise<UserDefinedFunctionDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Updating user defined function ${userDefinedFunction.id}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      const getResponse = await getSqlUserDefinedFunction(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        userDefinedFunction.id
      );

      if (getResponse?.properties?.resource) {
        const createUDFParams: SqlUserDefinedFunctionCreateUpdateParameters = {
          properties: {
            resource: userDefinedFunction as SqlUserDefinedFunctionResource,
            options: {}
          }
        };
        const rpResponse = await createUpdateSqlUserDefinedFunction(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          userDefinedFunction.id,
          createUDFParams
        );
        return rpResponse && (rpResponse.properties?.resource as UserDefinedFunctionDefinition & Resource);
      }

      throw new Error(`Failed to update user defined function: ${userDefinedFunction.id} does not exist.`);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunction(userDefinedFunction.id)
      .replace(userDefinedFunction);
    return response?.resource;
  } catch (error) {
    const errorMessage =
      error.code === "NotFound" ? `${userDefinedFunction.id} does not exist.` : JSON.stringify(error);
    logConsoleError(`Error while updating user defined function ${userDefinedFunction.id}:\n ${errorMessage}`);
    logError(errorMessage, "UpdateUserupdateUserDefinedFunction", error.code);
    sendNotificationForError(error);
    throw error;
  } finally {
    clearMessage();
  }
}
