import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import {
  createUpdateSqlStoredProcedure,
  getSqlStoredProcedure,
} from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import {
  SqlStoredProcedureCreateUpdateParameters,
  SqlStoredProcedureResource,
} from "../../Utils/arm/generatedClients/cosmos/types";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function updateStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedure: StoredProcedureDefinition
): Promise<StoredProcedureDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Updating stored procedure ${storedProcedure.id}`);
  try {
    const { authType, apiType, subscriptionId, resourceGroup, databaseAccount } = userContext;

    if (authType === AuthType.AAD && !userContext.features.enableSDKoperations && apiType === "SQL") {
      const getResponse = await getSqlStoredProcedure(
        subscriptionId,
        resourceGroup,
        databaseAccount.name,
        databaseId,
        collectionId,
        storedProcedure.id
      );

      if (getResponse?.properties?.resource) {
        const createSprocParams: SqlStoredProcedureCreateUpdateParameters = {
          properties: {
            resource: storedProcedure as SqlStoredProcedureResource,
            options: {},
          },
        };
        const rpResponse = await createUpdateSqlStoredProcedure(
          subscriptionId,
          resourceGroup,
          databaseAccount.name,
          databaseId,
          collectionId,
          storedProcedure.id,
          createSprocParams
        );
        return rpResponse && (rpResponse.properties?.resource as StoredProcedureDefinition & Resource);
      }

      throw new Error(`Failed to update stored procedure: ${storedProcedure.id} does not exist.`);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedure(storedProcedure.id)
      .replace(storedProcedure);
    return response?.resource;
  } catch (error) {
    handleError(error, "UpdateStoredProcedure", `Error while updating stored procedure ${storedProcedure.id}`);
    throw error;
  } finally {
    clearMessage();
  }
}
