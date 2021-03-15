import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { userContext } from "../../UserContext";
import { listSqlUserDefinedFunctions } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readUserDefinedFunctions(
  databaseId: string,
  collectionId: string
): Promise<(UserDefinedFunctionDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying user defined functions for container ${collectionId}`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
      const rpResponse = await listSqlUserDefinedFunctions(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId
      );
      return rpResponse?.value?.map((udf) => udf.properties?.resource as UserDefinedFunctionDefinition & Resource);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.userDefinedFunctions.readAll()
      .fetchAll();
    return response?.resources;
  } catch (error) {
    handleError(
      error,
      "ReadUserDefinedFunctions",
      `Failed to query user defined functions for container ${collectionId}`
    );
    throw error;
  } finally {
    clearMessage();
  }
}
