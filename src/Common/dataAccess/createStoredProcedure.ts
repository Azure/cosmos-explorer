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
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function createStoredProcedure(
  databaseId: string,
  collectionId: string,
  storedProcedure: StoredProcedureDefinition,
): Promise<StoredProcedureDefinition & Resource> {
  const clearMessage = logConsoleProgress(`Creating stored procedure ${storedProcedure.id}`);
  try {
    let resource: StoredProcedureDefinition & Resource;
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType === "SQL"
    ) {
      try {
        const getResponse = await getSqlStoredProcedure(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name,
          databaseId,
          collectionId,
          storedProcedure.id,
        );
        if (getResponse?.properties?.resource) {
          throw new Error(
            `Create stored procedure failed: stored procedure with id ${storedProcedure.id} already exists`,
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
          options: {},
        },
      };
      const rpResponse = await createUpdateSqlStoredProcedure(
        userContext.subscriptionId,
        userContext.resourceGroup,
        userContext.databaseAccount.name,
        databaseId,
        collectionId,
        storedProcedure.id,
        createSprocParams,
      );
      resource = rpResponse && (rpResponse.properties?.resource as StoredProcedureDefinition & Resource);
    } else {
      const response = await client()
        .database(databaseId)
        .container(collectionId)
        .scripts.storedProcedures.create(storedProcedure);
      resource = response.resource;
    }
    logConsoleInfo(`Successfully created stored procedure ${storedProcedure.id}`);
    return resource;
  } catch (error) {
    handleError(error, "CreateStoredProcedure", `Error while creating stored procedure ${storedProcedure.id}`);
    throw error;
  } finally {
    clearMessage();
  }
}
