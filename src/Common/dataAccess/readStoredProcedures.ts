import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import { CloudError, SqlStoredProcedureListResult } from "Utils/arm/generatedClients/cosmos/types";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { listSqlStoredProcedures } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function readStoredProcedures(
  databaseId: string,
  collectionId: string
): Promise<(StoredProcedureDefinition & Resource)[]> {
  const clearMessage = logConsoleProgress(`Querying stored procedures for container ${collectionId}`);
  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType === "SQL"
    ) {
      const rpResponse = await listSqlStoredProcedures(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId
      );
      const listResult = rpResponse as SqlStoredProcedureListResult;
      if (listResult) {
        return listResult?.value?.map((sproc) => sproc.properties?.resource as StoredProcedureDefinition & Resource);
      }

      const cloudError = rpResponse as CloudError;
      throw new Error(cloudError?.error?.message);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedures.readAll()
      .fetchAll();
    return response?.resources;
  } catch (error) {
    handleError(error, "ReadStoredProcedures", `Failed to query stored procedures for container ${collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
}
