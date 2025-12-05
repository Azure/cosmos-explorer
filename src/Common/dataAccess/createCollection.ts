import { ContainerRequest, ContainerResponse, DatabaseRequest, DatabaseResponse, RequestOptions } from "@azure/cosmos";
import { sendMessage } from "Common/MessageHandler";
import { FabricMessageTypes } from "Contracts/FabricMessageTypes";
import { isFabricNative } from "Platform/Fabric/FabricUtil";
import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { useDatabases } from "../../Explorer/useDatabases";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { getCollectionName } from "../../Utils/APITypeUtils";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { createUpdateCassandraTable } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { createUpdateGremlinGraph } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { createUpdateMongoDBCollection } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { createUpdateSqlContainer } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { createUpdateTable } from "../../Utils/arm/generatedClients/cosmos/tableResources";
import * as ARMTypes from "../../Utils/arm/generatedClients/cosmos/types";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { createMongoCollectionWithProxy } from "../MongoProxyClient";
import { createDatabase } from "./createDatabase";

export const createCollection = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const clearMessage = logConsoleProgress(
    `Creating a new container ${params.collectionId} for database ${params.databaseId}`,
  );
  try {
    let collection: DataModels.Collection;
    if (!isFabricNative() && userContext.authType === AuthType.AAD && !userContext.features.enableSDKoperations) {
      if (params.createNewDatabase) {
        const createDatabaseParams: DataModels.CreateDatabaseParams = {
          autoPilotMaxThroughput: params.autoPilotMaxThroughput,
          databaseId: params.databaseId,
          databaseLevelThroughput: params.databaseLevelThroughput,
          offerThroughput: params.offerThroughput,
        };
        await createDatabase(createDatabaseParams);
      }
      collection = await createCollectionWithARM(params);
    } else if (userContext.apiType === "Mongo") {
      collection = await createMongoCollectionWithProxy(params);
    } else {
      collection = await createCollectionWithSDK(params);
    }

    logConsoleInfo(`Successfully created container ${params.collectionId}`);

    if (isFabricNative()) {
      sendMessage({
        type: FabricMessageTypes.ContainerUpdated,
        params: { updateType: "created" },
      });
    }

    return collection;
  } catch (error) {
    handleError(error, "CreateCollection", `Error while creating container ${params.collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
};

const createCollectionWithARM = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  if (!params.createNewDatabase) {
    const isValid = await useDatabases.getState().validateCollectionId(params.databaseId, params.collectionId);
    if (!isValid) {
      const collectionName = getCollectionName().toLocaleLowerCase();
      throw new Error(
        `Create ${collectionName} failed: ${collectionName} with id ${params.collectionId} already exists`,
      );
    }
  }

  const { apiType } = userContext;
  switch (apiType) {
    case "SQL":
      return createSqlContainer(params);
    case "Mongo":
      return createMongoCollection(params);
    case "Cassandra":
      return createCassandraTable(params);
    case "Gremlin":
      return createGraph(params);
    case "Tables":
      return createTable(params);
    default:
      throw new Error(`Unsupported default experience type: ${apiType}`);
  }
};

const createSqlContainer = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.SqlContainerResource = {
    id: params.collectionId,
  };
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

  const rpPayload: ARMTypes.SqlDatabaseCreateUpdateParameters = {
    properties: {
      resource,
      options,
    },
  };

  const createResponse = await createUpdateSqlContainer(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload,
  );
  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createMongoCollection = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const mongoWildcardIndexOnAllFields: ARMTypes.MongoIndex[] = [{ key: { keys: ["$**"] } }, { key: { keys: ["_id"] } }];
  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.MongoDBCollectionResource = {
    id: params.collectionId,
  };
  if (params.partitionKey) {
    const partitionKeyPath: string = params.partitionKey.paths[0];
    resource.shardKey = { [partitionKeyPath]: "Hash" };
  }
  if (params.createMongoWildcardIndex) {
    resource.indexes = mongoWildcardIndexOnAllFields;
  }

  const rpPayload: ARMTypes.MongoDBCollectionCreateUpdateParameters = {
    properties: {
      resource,
      options,
    },
  };

  const createResponse = await createUpdateMongoDBCollection(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload,
  );

  if (params.createMongoWildcardIndex) {
    TelemetryProcessor.trace(Action.CreateMongoCollectionWithWildcardIndex, ActionModifiers.Mark, {
      message: "Mongo Collection created with wildcard index on all fields.",
    });
  }

  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createCassandraTable = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.CassandraTableResource = {
    id: params.collectionId,
  };

  const rpPayload: ARMTypes.CassandraTableCreateUpdateParameters = {
    properties: {
      resource,
      options,
    },
  };

  const createResponse = await createUpdateCassandraTable(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload,
  );
  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createGraph = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.GremlinGraphResource = {
    id: params.collectionId,
  };

  if (params.indexingPolicy) {
    resource.indexingPolicy = params.indexingPolicy;
  }
  if (params.partitionKey) {
    resource.partitionKey = params.partitionKey;
  }
  if (params.uniqueKeyPolicy) {
    resource.uniqueKeyPolicy = params.uniqueKeyPolicy;
  }

  const rpPayload: ARMTypes.GremlinGraphCreateUpdateParameters = {
    properties: {
      resource,
      options,
    },
  };

  const createResponse = await createUpdateGremlinGraph(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload,
  );
  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createTable = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.TableResource = {
    id: params.collectionId,
  };

  const rpPayload: ARMTypes.TableCreateUpdateParameters = {
    properties: {
      resource,
      options,
    },
  };

  const createResponse = await createUpdateTable(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.collectionId,
    rpPayload,
  );
  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

export const constructRpOptions = (params: DataModels.CreateDatabaseParams): ARMTypes.CreateUpdateOptions => {
  if (params.databaseLevelThroughput) {
    return {};
  }

  if (params.autoPilotMaxThroughput) {
    return {
      autoscaleSettings: {
        maxThroughput: params.autoPilotMaxThroughput,
      },
    };
  }

  return {
    throughput: params.offerThroughput,
  };
};

const createCollectionWithSDK = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const createCollectionBody: ContainerRequest = {
    id: params.collectionId,
    partitionKey: params.partitionKey || undefined,
    indexingPolicy: params.indexingPolicy || undefined,
    uniqueKeyPolicy: params.uniqueKeyPolicy || undefined,
    vectorEmbeddingPolicy: params.vectorEmbeddingPolicy,
    fullTextPolicy: params.fullTextPolicy,
  } as ContainerRequest; // TODO: remove cast when https://github.com/Azure/azure-cosmos-js/issues/423 is fixed
  const collectionOptions: RequestOptions = {};
  const createDatabaseBody: DatabaseRequest = { id: params.databaseId };

  if (params.databaseLevelThroughput) {
    if (params.autoPilotMaxThroughput) {
      createDatabaseBody.maxThroughput = params.autoPilotMaxThroughput;
    } else {
      createDatabaseBody.throughput = params.offerThroughput;
    }
  } else {
    if (params.autoPilotMaxThroughput) {
      createCollectionBody.maxThroughput = params.autoPilotMaxThroughput;
    } else {
      createCollectionBody.throughput = params.offerThroughput;
    }
  }

  const databaseResponse: DatabaseResponse = await client().databases.createIfNotExists(createDatabaseBody);
  const collectionResponse: ContainerResponse = await databaseResponse?.database.containers.create(
    createCollectionBody,
    collectionOptions,
  );
  return collectionResponse?.resource as DataModels.Collection;
};
