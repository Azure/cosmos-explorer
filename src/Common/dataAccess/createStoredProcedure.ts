import { AuthType } from "../../AuthType";
import { Resource, StoredProcedureDefinition } from "@azure/cosmos";
import {
  SqlStoredProcedureCreateUpdateParameters,
  SqlStoredProcedureResource
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { client } from "../CosmosClient";
import {
  createUpdateSqlStoredProcedure,
  getSqlStoredProcedure
} from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";

export async function createStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedure: StoredProcedureDefinition
): Promise<StoredProcedureDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Creating stored procedure ${storedProcedure.id}`);
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      try {
        const getResponse = await getSqlStoredProcedure(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          storedProcedure.id
        );
        if (getResponse?.properties?.resource) {
          throw new Error(
            `Create stored procedure failed: stored procedure with id ${storedProcedure.id} already exists`
          );
        }
      } catch (error) {
        if (error.code !== "NotFound") {
          throw error;
        }
      }

      const createSprocParams: SqlStoredProcedureCreateUpdateParameters = {
        properties: {
          resource: storedProcedure as SqlStoredProcedureResource,
          options: {}
        }
      };
      const rpResponse = await createUpdateSqlStoredProcedure(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        storedProcedure.id,
        createSprocParams
      );
      return rpResponse && (rpResponse.properties?.resource as StoredProcedureDefinition & Resource);
    }

    const response = await client()
      .database(databaseId)
      .container(collectionId)
      .scripts.storedProcedures.create(storedProcedure);
    return response?.resource;
  } catch (error) {
    handleError(error, `Error while creating stored procedure ${storedProcedure.id}`, "CreateStoredProcedure");
    throw error;
  } finally {
    clearMessage();
  }
}
