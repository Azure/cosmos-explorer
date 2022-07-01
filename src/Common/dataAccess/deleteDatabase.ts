import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { deleteCassandraKeyspace } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { deleteGremlinDatabase } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { deleteMongoDBDatabase } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { deleteSqlDatabase } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function deleteDatabase(databaseId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting database ${databaseId}`);

  try {
    if (userContext.authType === AuthType.AAD && !userContext.features.enableSDKoperations) {
      await deleteDatabaseWithARM(databaseId);
    } else {
      await client().database(databaseId).delete();
    }
    logConsoleInfo(`Successfully deleted database ${databaseId}`);
  } catch (error) {
    handleError(error, "DeleteDatabase", `Error while deleting database ${databaseId}`);
    throw error;
  } finally {
    clearMessage();
  }
}

function deleteDatabaseWithARM(databaseId: string): Promise<void> {
  const { subscriptionId, resourceGroup, apiType, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  switch (apiType) {
    case "SQL":
      return deleteSqlDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    case "Mongo":
      return deleteMongoDBDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    case "Cassandra":
      return deleteCassandraKeyspace(subscriptionId, resourceGroup, accountName, databaseId);
    case "Gremlin":
      return deleteGremlinDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    default:
      throw new Error(`Unsupported default experience type: ${apiType}`);
  }
}
