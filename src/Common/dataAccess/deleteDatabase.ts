import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { deleteSqlDatabase } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { deleteCassandraKeyspace } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { deleteMongoDBDatabase } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { deleteGremlinDatabase } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { userContext } from "../../UserContext";
import { client } from "../CosmosClient";

export async function deleteDatabase(databaseId: string): Promise<void> {
  const clearMessage = logConsoleProgress(`Deleting database ${databaseId}`);

  try {
    if (userContext.defaultExperience === DefaultAccountExperienceType.Table) {
      throw new Error("Deleting database resources is not allowed for tables accounts");
    }
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
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
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.defaultExperience;

  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      return deleteSqlDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    case DefaultAccountExperienceType.MongoDB:
      return deleteMongoDBDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    case DefaultAccountExperienceType.Cassandra:
      return deleteCassandraKeyspace(subscriptionId, resourceGroup, accountName, databaseId);
    case DefaultAccountExperienceType.Graph:
      return deleteGremlinDatabase(subscriptionId, resourceGroup, accountName, databaseId);
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }
}
