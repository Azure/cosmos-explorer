import { DatabaseRequest, DatabaseResponse } from "@azure/cosmos";
import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { useDatabases } from "../../Explorer/useDatabases";
import { userContext } from "../../UserContext";
import { getDatabaseName } from "../../Utils/APITypeUtils";
import { createUpdateCassandraKeyspace } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { createUpdateGremlinDatabase } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { createUpdateMongoDBDatabase } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { createUpdateSqlDatabase } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import {
  CassandraKeyspaceCreateUpdateParameters,
  CreateUpdateOptions,
  GremlinDatabaseCreateUpdateParameters,
  MongoDBDatabaseCreateUpdateParameters,
  SqlDatabaseCreateUpdateParameters,
} from "../../Utils/arm/generatedClients/cosmos/types";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function createDatabase(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  const clearMessage = logConsoleProgress(`Creating a new database ${params.databaseId}`);
  try {
    if (userContext.apiType === "Tables") {
      throw new Error("Creating database resources is not allowed for tables accounts");
    }
    const database: DataModels.Database = await (userContext.authType === AuthType.AAD &&
    !userContext.features.enableSDKoperations
      ? createDatabaseWithARM(params)
      : createDatabaseWithSDK(params));

    logConsoleInfo(`Successfully created database ${params.databaseId}`);
    return database;
  } catch (error) {
    handleError(error, "CreateDatabase", `Error while creating database ${params.databaseId}`);
    throw error;
  } finally {
    clearMessage();
  }
}

async function createDatabaseWithARM(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  if (!useDatabases.getState().validateDatabaseId(params.databaseId)) {
    const databaseName = getDatabaseName().toLocaleLowerCase();
    throw new Error(`Create ${databaseName} failed: ${databaseName} with id ${params.databaseId} already exists`);
  }

  const { apiType } = userContext;

  switch (apiType) {
    case "SQL":
      return createSqlDatabase(params);
    case "Mongo":
      return createMongoDatabase(params);
    case "Cassandra":
      return createCassandraKeyspace(params);
    case "Gremlin":
      return createGremlineDatabase(params);
    default:
      throw new Error(`Unsupported default experience type: ${apiType}`);
  }
}

async function createSqlDatabase(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  const options: CreateUpdateOptions = constructRpOptions(params);
  const rpPayload: SqlDatabaseCreateUpdateParameters = {
    properties: {
      resource: {
        id: params.databaseId,
      },
      options,
    },
  };
  const createResponse = await createUpdateSqlDatabase(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    rpPayload
  );
  return createResponse && (createResponse.properties.resource as DataModels.Database);
}

async function createMongoDatabase(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  const options: CreateUpdateOptions = constructRpOptions(params);
  const rpPayload: MongoDBDatabaseCreateUpdateParameters = {
    properties: {
      resource: {
        id: params.databaseId,
      },
      options,
    },
  };
  const createResponse = await createUpdateMongoDBDatabase(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    rpPayload
  );
  return createResponse && (createResponse.properties.resource as DataModels.Database);
}

async function createCassandraKeyspace(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  const options: CreateUpdateOptions = constructRpOptions(params);
  const rpPayload: CassandraKeyspaceCreateUpdateParameters = {
    properties: {
      resource: {
        id: params.databaseId,
      },
      options,
    },
  };
  const createResponse = await createUpdateCassandraKeyspace(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    rpPayload
  );
  return createResponse && (createResponse.properties.resource as DataModels.Database);
}

async function createGremlineDatabase(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  const options: CreateUpdateOptions = constructRpOptions(params);
  const rpPayload: GremlinDatabaseCreateUpdateParameters = {
    properties: {
      resource: {
        id: params.databaseId,
      },
      options,
    },
  };
  const createResponse = await createUpdateGremlinDatabase(
    userContext.subscriptionId,
    userContext.resourceGroup,
    userContext.databaseAccount.name,
    params.databaseId,
    rpPayload
  );
  return createResponse && (createResponse.properties.resource as DataModels.Database);
}

async function createDatabaseWithSDK(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  const createBody: DatabaseRequest = { id: params.databaseId };

  if (params.databaseLevelThroughput) {
    if (params.autoPilotMaxThroughput) {
      createBody.maxThroughput = params.autoPilotMaxThroughput;
    } else {
      createBody.throughput = params.offerThroughput;
    }
  }

  const response: DatabaseResponse = await client().databases.create(createBody);
  return response.resource;
}

function constructRpOptions(params: DataModels.CreateDatabaseParams): CreateUpdateOptions {
  if (!params.databaseLevelThroughput) {
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
}
