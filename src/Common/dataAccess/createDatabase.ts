import { DatabaseResponse } from "@azure/cosmos";
import { DatabaseRequest } from "@azure/cosmos/dist-esm/client/Database/DatabaseRequest";
import { AuthType } from "../../AuthType";
import * as DataModels from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { userContext } from "../../UserContext";
import {
  createUpdateCassandraKeyspace,
  getCassandraKeyspace,
} from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import {
  createUpdateGremlinDatabase,
  getGremlinDatabase,
} from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import {
  createUpdateMongoDBDatabase,
  getMongoDBDatabase,
} from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { createUpdateSqlDatabase, getSqlDatabase } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import {
  CassandraKeyspaceCreateUpdateParameters,
  CreateUpdateOptions,
  GremlinDatabaseCreateUpdateParameters,
  MongoDBDatabaseCreateUpdateParameters,
  SqlDatabaseCreateUpdateParameters,
} from "../../Utils/arm/generatedClients/2020-04-01/types";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";

export async function createDatabase(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  const clearMessage = logConsoleProgress(`Creating a new database ${params.databaseId}`);
  try {
    if (userContext.apiType === DefaultAccountExperienceType.Table) {
      throw new Error("Creating database resources is not allowed for tables accounts");
    }
    const database: DataModels.Database = await (userContext.authType === AuthType.AAD && !userContext.useSDKOperations
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
  const defaultExperience = userContext.apiType;
  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      return createSqlDatabase(params);
    case DefaultAccountExperienceType.MongoDB:
      return createMongoDatabase(params);
    case DefaultAccountExperienceType.Cassandra:
      return createCassandraKeyspace(params);
    case DefaultAccountExperienceType.Graph:
      return createGremlineDatabase(params);
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }
}

async function createSqlDatabase(params: DataModels.CreateDatabaseParams): Promise<DataModels.Database> {
  try {
    const getResponse = await getSqlDatabase(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create database failed: database with id ${params.databaseId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

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
  try {
    const getResponse = await getMongoDBDatabase(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create database failed: database with id ${params.databaseId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

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
  try {
    const getResponse = await getCassandraKeyspace(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create database failed: database with id ${params.databaseId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

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
  try {
    const getResponse = await getGremlinDatabase(
      userContext.subscriptionId,
      userContext.resourceGroup,
      userContext.databaseAccount.name,
      params.databaseId
    );
    if (getResponse?.properties?.resource) {
      throw new Error(`Create database failed: database with id ${params.databaseId} already exists`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }
  }

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
