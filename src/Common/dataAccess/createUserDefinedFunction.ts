import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import {
  SqlUserDefinedFunctionCreateUpdateParameters,
  SqlUserDefinedFunctionResource,
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { client } from "../CosmosClient";
import {
  createUpdateSqlUserDefinedFunction,
  getSqlUserDefinedFunction,
} from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";

export async function createUserDefinedFunction(
  databaseId: string,
  collectionId: string,
  userDefinedFunction: UserDefinedFunctionDefinition
): Promise<UserDefinedFunctionDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Creating user defined function ${userDefinedFunction.id}`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
      try {
        const getResponse = await getSqlUserDefinedFunction(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          userDefinedFunction.id
        );
        if (getResponse?.properties?.resource) {
          throw new Error(
            `Create user defined function failed: user defined function with id ${userDefinedFunction.id} already exists`
          );
        }
      } catch (error) {
        if (error.code !== "NotFound") {
          throw error;
        }
      }

      const createUDFParams: SqlUserDefinedFunctionCreateUpdateParameters = {
        properties: {
          resource: userDefinedFunction as SqlUserDefinedFunctionResource,
          options: {},
        },
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

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunctions.create(userDefinedFunction);
    return response?.resource;
  } catch (error) {
    handleError(
      error,
      "CreateUserupdateUserDefinedFunction",
      `Error while creating user defined function ${userDefinedFunction.id}`
    );
    throw error;
  } finally {
    clearMessage();
  }
}
