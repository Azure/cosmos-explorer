import * as DataModels from "../../Contracts/DataModels";
import * as ErrorParserUtility from "../ErrorParserUtility";
import { AuthType } from "../../AuthType";
import { ContainerResponse, DatabaseResponse } from "@azure/cosmos";
import { ContainerRequest } from "@azure/cosmos/dist-esm/client/Container/ContainerRequest";
import { DatabaseRequest } from "@azure/cosmos/dist-esm/client/Database/DatabaseRequest";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import * as ARMTypes from "../../Utils/arm/generatedClients/2020-04-01/types";
import { client } from "../CosmosClient";
import { createMongoCollectionWithProxy } from "../MongoProxyClient";
import { createUpdateSqlContainer, getSqlContainer } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import {
  createUpdateCassandraTable,
  getCassandraTable
} from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import {
  createUpdateMongoDBCollection,
  getMongoDBCollection
} from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import {
  createUpdateGremlinGraph,
  getGremlinGraph
} from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { createUpdateTable, getTable } from "../../Utils/arm/generatedClients/2020-04-01/tableResources";
import { logConsoleProgress, logConsoleError, logConsoleInfo } from "../../Utils/NotificationConsoleUtils";
import { logError } from "../Logger";
import { refreshCachedResources } from "../DataAccessUtilityBase";
import { sendNotificationForError } from "./sendNotificationForError";
import { userContext } from "../../UserContext";
import { createDatabase } from "./createDatabase";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";

export const createCollection = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  let collection: DataModels.Collection;
  const clearMessage = logConsoleProgress(
    `Creating a new container ${params.collectionId} for database ${params.databaseId}`
  );
  try {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      if (params.createNewDatabase) {
        const createDatabaseParams: DataModels.CreateDatabaseParams = {
          autoPilotMaxThroughput: params.autoPilotMaxThroughput,
          databaseId: params.databaseId,
          databaseLevelThroughput: params.databaseLevelThroughput,
          offerThroughput: params.offerThroughput
        };
        await createDatabase(createDatabaseParams);
      }
      collection = await createCollectionWithARM(params);
    } else if (userContext.defaultExperience === DefaultAccountExperienceType.MongoDB) {
      collection = await createMongoCollectionWithProxy(params);
    } else {
      collection = await createCollectionWithSDK(params);
    }
  } catch (error) {
    const sanitizedError = ErrorParserUtility.replaceKnownError(JSON.stringify(error));
    logConsoleError(`Error while creating container ${params.collectionId}:\n ${sanitizedError}`);
    logError(JSON.stringify(error), "CreateCollection", error.code);
    sendNotificationForError(error);
    clearMessage();
    throw error;
  }
  logConsoleInfo(`Successfully created container ${params.collectionId}`);
  await refreshCachedResources();
  clearMessage();
  return collection;
};

const createCollectionWithARM = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const defaultExperience = userContext.defaultExperience;
  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      return createSqlContainer(params);
    case DefaultAccountExperienceType.MongoDB:
      return createMongoCollection(params);
    case DefaultAccountExperienceType.Cassandra:
      return createCassandraTable(params);
    case DefaultAccountExperienceType.Graph:
      return createGraph(params);
    case DefaultAccountExperienceType.Table:
      return createTable(params);
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }
};

const createSqlContainer = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  try {
    const getResponse = await getSqlContainer(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId,
      params.collectionId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create container failed: container with id ${params.collectionId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.SqlContainerResource = {
    id: params.collectionId
  };
  if (params.analyticalStorageTtl) {
    resource.analyticalStorageTtl = params.analyticalStorageTtl;
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

  const rpPayload: ARMTypes.SqlDatabaseCreateUpdateParameters = {
    properties: {
      resource,
      options
    }
  };

  const createResponse = await createUpdateSqlContainer(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload
  );
  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createMongoCollection = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const mongoWildcardIndexOnAllFields: ARMTypes.MongoIndex[] = [{ key: { keys: ["$**"] } }, { key: { keys: ["_id"] } }];
  try {
    const getResponse = await getMongoDBCollection(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId,
      params.collectionId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create collection failed: collection with id ${params.collectionId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.MongoDBCollectionResource = {
    id: params.collectionId
  };
  if (params.analyticalStorageTtl) {
    resource.analyticalStorageTtl = params.analyticalStorageTtl;
  }
  if (params.partitionKey) {
    const partitionKeyPath: string = params.partitionKey.paths[0];
    resource.shardKey = { [partitionKeyPath]: "Hash" };
  }
  if (params.createMongoWildcardIndexOnAllFields) {
    resource.indexes = mongoWildcardIndexOnAllFields;
  }

  const rpPayload: ARMTypes.MongoDBCollectionCreateUpdateParameters = {
    properties: {
      resource,
      options
    }
  };

  const createResponse = await createUpdateMongoDBCollection(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload
  );

  TelemetryProcessor.trace(Action.CreateMongoCollectionWithWildcardIndex, ActionModifiers.Mark, {
    message: "Mongo Collection created with wildcard index on all fields."
  });

  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createCassandraTable = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  try {
    const getResponse = await getCassandraTable(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId,
      params.collectionId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create table failed: table with id ${params.collectionId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.CassandraTableResource = {
    id: params.collectionId
  };
  if (params.analyticalStorageTtl) {
    resource.analyticalStorageTtl = params.analyticalStorageTtl;
  }

  const rpPayload: ARMTypes.CassandraTableCreateUpdateParameters = {
    properties: {
      resource,
      options
    }
  };

  const createResponse = await createUpdateCassandraTable(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload
  );
  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createGraph = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  try {
    const getResponse = await getGremlinGraph(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId,
      params.collectionId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create graph failed: graph with id ${params.collectionId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.GremlinGraphResource = {
    id: params.collectionId
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
      options
    }
  };

  const createResponse = await createUpdateGremlinGraph(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    params.collectionId,
    rpPayload
  );
  return createResponse && (createResponse.properties.resource as DataModels.Collection);
};

const createTable = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  try {
    const getResponse = await getTable(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.collectionId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create table failed: table with id ${params.collectionId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

  const options: ARMTypes.CreateUpdateOptions = constructRpOptions(params);
  const resource: ARMTypes.TableResource = {
    id: params.collectionId
  };

  const rpPayload: ARMTypes.TableCreateUpdateParameters = {
    properties: {
      resource,
      options
    }
  };

  const createResponse = await createUpdateTable(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.collectionId,
    rpPayload
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
        maxThroughput: params.autoPilotMaxThroughput
      }
    };
  }

  return {
    throughput: params.offerThroughput
  };
};

const createCollectionWithSDK = async (params: DataModels.CreateCollectionParams): Promise<DataModels.Collection> => {
  const createCollectionBody: ContainerRequest = {
    id: params.collectionId,
    partitionKey: params.partitionKey || undefined,
    indexingPolicy: params.indexingPolicy || undefined,
    uniqueKeyPolicy: params.uniqueKeyPolicy || undefined,
    analyticalStorageTtl: params.analyticalStorageTtl
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
    collectionOptions
  );
  return collectionResponse?.resource as DataModels.Collection;
};
