import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { deleteSqlUserDefinedFunction } from "../../Utils/arm/generatedClients/cosmos/2021-04-15/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function deleteUserDefinedFunction(databaseId: string, collectionId: string, id: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting user defined function ${id}`);
  try {
    if (userContext.authType === AuthType.AAD && !userContext.useSDKOperations && userContext.apiType === "SQL") {
      await deleteSqlUserDefinedFunction(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        id
      );
    } else {
      await client().database(databaseId).container(collectionId).scripts.userDefinedFunction(id).delete();
    }
  } catch (error) {
    handleError(error, "DeleteUserDefinedFunction", `Error while deleting user defined function ${id}`);
    throw error;
  } finally {
    clearMessage();
  }
}
