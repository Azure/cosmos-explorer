import { Resource, UserDefinedFunctionDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { listSqlUserDefinedFunctions } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readUserDefinedFunctions(
  databaseId: string,
  collectionId: string,
): Promise<(UserDefinedFunctionDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying user defined functions for container ${collectionId}`);
  const { authType, apiType, subscriptionId, resourceGroup, databaseAccount } = userContext;
  try {
    if (authType === AuthType.AAD && !userContext.features.enableSDKoperations && apiType === "SQL") {
      const rpResponse = await listSqlUserDefinedFunctions(
        subscriptionId,
        resourceGroup,
        databaseAccount.name,
        databaseId,
        collectionId,
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
      `Failed to query user defined functions for container ${collectionId}`,
    );
    throw error;
  } finally {
    clearMessage();
  }
}
