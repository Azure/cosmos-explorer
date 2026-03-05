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
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function createUserDefinedFunction(
  databaseId: string,
  collectionId: string,
  userDefinedFunction: UserDefinedFunctionDefinition,
): Promise<UserDefinedFunctionDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Creating user defined function ${userDefinedFunction.id}`);
  try {
    let resource: UserDefinedFunctionDefinition & Resource;
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType === "SQL"
    ) {
      try {
        const getResponse = await getSqlUserDefinedFunction(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          userDefinedFunction.id,
        );
        if (getResponse?.properties?.resource) {
          throw new Error(
            `Create user defined function failed: user defined function with id ${userDefinedFunction.id} already exists`,
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
        createUDFParams,
      );

      resource = rpResponse && (rpResponse.properties?.resource as UserDefinedFunctionDefinition & Resource);
    } else {
      const response = await client()
        .database(databaseId)
        .container(collectionId)
        .scripts.userDefinedFunctions.create(userDefinedFunction);
      resource = response.resource;
    }
    logConsoleInfo(`Successfully created user defined function ${userDefinedFunction.id}`);
    return resource;
  } catch (error) {
    handleError(
      error,
      "CreateUserupdateUserDefinedFunction",
      `Error while creating user defined function ${userDefinedFunction.id}`,
    );
    throw error;
  } finally {
    clearMessage();
  }
}
