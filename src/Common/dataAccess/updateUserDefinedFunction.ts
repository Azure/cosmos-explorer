import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
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
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";

export async function updateUserDefinedFunction(
  databaseId: string,
  collectionId: string,
  userDefinedFunction: UserDefinedFunctionDefinition
): Promise<UserDefinedFunctionDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Updating user defined function ${userDefinedFunction.id}`);
  try {
    if (
      window.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
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
    handleError(
      error,
      "UpdateUserupdateUserDefinedFunction",
      `Error while updating user defined function ${userDefinedFunction.id}`
    );
    throw error;
  } finally {
    clearMessage();
  }
}
