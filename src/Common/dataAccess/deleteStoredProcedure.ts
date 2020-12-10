import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { client } from "../CosmosClient";
import { deleteSqlStoredProcedure } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";

export async function deleteStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedureId: string
): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting stored procedure ${storedProcedureId}`);
  try {
    if (
      window.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience === DefaultAccountExperienceType.DocumentDB
    ) {
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
