import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { deleteSqlStoredProcedure } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function deleteStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedureId: string
): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting stored procedure ${storedProcedureId}`);
  try {
    if (userContext.authType === AuthType.AAD && !userContext.useSDKOperations && userContext.apiType === "SQL") {
      await deleteSqlStoredProcedure(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        storedProcedureId
      );
    } else {
      await client().database(databaseId).container(collectionId).scripts.storedProcedure(storedProcedureId).delete();
    }
  } catch (error) {
    handleError(error, "DeleteStoredProcedure", `Error while deleting stored procedure ${storedProcedureId}`);
    throw error;
  } finally {
    clearMessage();
  }
}
