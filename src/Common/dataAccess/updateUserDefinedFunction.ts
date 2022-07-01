import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import {
  createUpdateSqlUserDefinedFunction,
  getSqlUserDefinedFunction,
} from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import {
  SqlUserDefinedFunctionCreateUpdateParameters,
  SqlUserDefinedFunctionResource,
} from "../../Utils/arm/generatedClients/cosmos/types";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function updateUserDefinedFunction(
  databaseId: string,
  collectionId: string,
  userDefinedFunction: UserDefinedFunctionDefinition
): Promise<UserDefinedFunctionDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Updating user defined function ${userDefinedFunction.id}`);
  const { authType, apiType, subscriptionId, resourceGroup, databaseAccount } = userContext;
  try {
    if (authType === AuthType.AAD && !userContext.features.enableSDKoperations && apiType === "SQL") {
      const getResponse = await getSqlUserDefinedFunction(
        subscriptionId,
        resourceGroup,
        databaseAccount.name,
        databaseId,
        collectionId,
        userDefinedFunction.id
      );

      if (getResponse?.properties?.resource) {
        const createUDFParams: SqlUserDefinedFunctionCreateUpdateParameters = {
          properties: {
            resource: userDefinedFunction as SqlUserDefinedFunctionResource,
            options: {},
          },
        };
        const rpResponse = await createUpdateSqlUserDefinedFunction(
          subscriptionId,
          resourceGroup,
          databaseAccount.name,
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
