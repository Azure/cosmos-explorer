import { constructRpOptions } from "Common/dataAccess/createCollection";
import { handleError } from "Common/ErrorHandlingUtils";
import { Collection, CreateMaterializedViewsParams as CreateGlobalSecondaryIndexParams } from "Contracts/DataModels";
import { userContext } from "UserContext";
import { createUpdateSqlContainer } from "Utils/arm/generatedClients/cosmos/sqlResources";
import {
  CreateUpdateOptions,
  SqlContainerResource,
  SqlDatabaseCreateUpdateParameters,
} from "Utils/arm/generatedClients/cosmos/types";
import { logConsoleInfo, logConsoleProgress } from "Utils/NotificationConsoleUtils";

export const createGlobalSecondaryIndex = async (params: CreateGlobalSecondaryIndexParams): Promise<Collection> => {
  const clearMessage = logConsoleProgress(
    `Creating a new global secondary index ${params.materializedViewId} for database ${params.databaseId}`,
  );

  const options: CreateUpdateOptions = constructRpOptions(params);

  const resource: SqlContainerResource = {
    id: params.materializedViewId,
  };
  if (params.materializedViewDefinition) {
    resource.materializedViewDefinition = params.materializedViewDefinition;
  }
  if (params.indexingPolicy) {
    resource.indexingPolicy = params.indexingPolicy;
  }
  if (params.partitionKey) {
    resource.partitionKey = params.partitionKey;
  }
  if (params.uniqueKeyPolicy) {
    resource.uniqueKeyPolicy = params.uniqueKeyPolicy;
  }
  if (params.vectorEmbeddingPolicy) {
    resource.vectorEmbeddingPolicy = params.vectorEmbeddingPolicy;
  }
  if (params.fullTextPolicy) {
    resource.fullTextPolicy = params.fullTextPolicy;
  }

  const rpPayload: SqlDatabaseCreateUpdateParameters = {
    properties: {
      resource,
      options,
    },
  };

  try {
    const createResponse = await createUpdateSqlContainer(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId,
      params.materializedViewId,
      rpPayload,
    );
    logConsoleInfo(`Successfully created global secondary index ${params.materializedViewId}`);

    return createResponse && (createResponse.properties.resource as Collection);
  } catch (error) {
    handleError(
      error,
      "CreateGlobalSecondaryIndex",
      `Error while creating global secondary index ${params.materializedViewId}`,
    );
    throw error;
  } finally {
    clearMessage();
  }
};
