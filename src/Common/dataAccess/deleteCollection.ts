import { isFabric } from "Platform/Fabric/FabricUtil";
import { AuthType } from "../../AuthType";
import { userContext } from "../../UserContext";
import { deleteCassandraTable } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { deleteGremlinGraph } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { deleteMongoDBCollection } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { deleteSqlContainer } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { deleteTable } from "../../Utils/arm/generatedClients/cosmos/tableResources";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function deleteCollection(databaseId: string, collectionId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting container ${collectionId}`);
  try {
    if (userContext.authType === AuthType.AAD && !userContext.features.enableSDKoperations && !isFabric()) {
      await deleteCollectionWithARM(databaseId, collectionId);
    } else {
      await client().database(databaseId).container(collectionId).delete();
    }
    logConsoleInfo(`Successfully deleted container ${collectionId}`);
  } catch (error) {
    handleError(error, "DeleteCollection", `Error while deleting container ${collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
}

function deleteCollectionWithARM(databaseId: string, collectionId: string): Promise<void> {
  const { subscriptionId, resourceGroup, apiType, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  switch (apiType) {
    case "SQL":
      return deleteSqlContainer(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
    case "Mongo":
      return deleteMongoDBCollection(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
    case "Cassandra":
      return deleteCassandraTable(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
    case "Gremlin":
      return deleteGremlinGraph(subscriptionId, resourceGroup, accountName, databaseId, collectionId);
    case "Tables":
      return deleteTable(subscriptionId, resourceGroup, accountName, collectionId);
    default:
      throw new Error(`Unsupported default experience type: ${apiType}`);
  }
}
