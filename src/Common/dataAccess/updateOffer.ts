import { OfferDefinition } from "@azure/cosmos";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import { AuthType } from "../../AuthType";
import { Offer, SDKOfferDefinition, UpdateOfferParams } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { userContext } from "../../UserContext";
import {
  migrateCassandraKeyspaceToAutoscale,
  migrateCassandraKeyspaceToManualThroughput,
  migrateCassandraTableToAutoscale,
  migrateCassandraTableToManualThroughput,
  updateCassandraKeyspaceThroughput,
  updateCassandraTableThroughput,
} from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import {
  migrateGremlinDatabaseToAutoscale,
  migrateGremlinDatabaseToManualThroughput,
  migrateGremlinGraphToAutoscale,
  migrateGremlinGraphToManualThroughput,
  updateGremlinDatabaseThroughput,
  updateGremlinGraphThroughput,
} from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import {
  migrateMongoDBCollectionToAutoscale,
  migrateMongoDBCollectionToManualThroughput,
  migrateMongoDBDatabaseToAutoscale,
  migrateMongoDBDatabaseToManualThroughput,
  updateMongoDBCollectionThroughput,
  updateMongoDBDatabaseThroughput,
} from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import {
  migrateSqlContainerToAutoscale,
  migrateSqlContainerToManualThroughput,
  migrateSqlDatabaseToAutoscale,
  migrateSqlDatabaseToManualThroughput,
  updateSqlContainerThroughput,
  updateSqlDatabaseThroughput,
} from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import {
  migrateTableToAutoscale,
  migrateTableToManualThroughput,
  updateTableThroughput,
} from "../../Utils/arm/generatedClients/2020-04-01/tableResources";
import { ThroughputSettingsUpdateParameters } from "../../Utils/arm/generatedClients/2020-04-01/types";
import { logConsoleInfo, logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { HttpHeaders } from "../Constants";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { parseSDKOfferResponse } from "../OfferUtility";
import { readCollectionOffer } from "./readCollectionOffer";
import { readDatabaseOffer } from "./readDatabaseOffer";

export const updateOffer = async (params: UpdateOfferParams): Promise<Offer> => {
  let updatedOffer: Offer;
  const offerResourceText: string = params.collectionId
    ? `collection ${params.collectionId}`
    : `database ${params.databaseId}`;
  const clearMessage = logConsoleProgress(`Updating offer for ${offerResourceText}`);

  try {
    if (userContext.authType === AuthType.AAD && !userContext.useSDKOperations) {
      if (params.collectionId) {
        updatedOffer = await updateCollectionOfferWithARM(params);
      } else if (userContext.defaultExperience === DefaultAccountExperienceType.Table) {
        // update table's database offer with SDK since RP doesn't support it
        updatedOffer = await updateOfferWithSDK(params);
      } else {
        updatedOffer = await updateDatabaseOfferWithARM(params);
      }
    } else {
      updatedOffer = await updateOfferWithSDK(params);
    }
    logConsoleInfo(`Successfully updated offer for ${offerResourceText}`);
    return updatedOffer;
  } catch (error) {
    handleError(error, "UpdateCollection", `Error updating offer for ${offerResourceText}`);
    throw error;
  } finally {
    clearMessage();
  }
};

const updateCollectionOfferWithARM = async (params: UpdateOfferParams): Promise<Offer> => {
  try {
    switch (userContext.defaultExperience) {
      case DefaultAccountExperienceType.DocumentDB:
        await updateSqlContainerOffer(params);
        break;
      case DefaultAccountExperienceType.MongoDB:
        await updateMongoCollectionOffer(params);
        break;
      case DefaultAccountExperienceType.Cassandra:
        await updateCassandraTableOffer(params);
        break;
      case DefaultAccountExperienceType.Graph:
        await updateGremlinGraphOffer(params);
        break;
      case DefaultAccountExperienceType.Table:
        await updateTableOffer(params);
        break;
      default:
        throw new Error(`Unsupported default experience type: ${userContext.defaultExperience}`);
    }
  } catch (error) {
    if (error.code !== "MethodNotAllowed") {
      throw error;
    }
  }

  return await readCollectionOffer({
    collectionId: params.collectionId,
    databaseId: params.databaseId,
    offerId: params.currentOffer.id,
  });
};

const updateDatabaseOfferWithARM = async (params: UpdateOfferParams): Promise<Offer> => {
  try {
    switch (userContext.defaultExperience) {
      case DefaultAccountExperienceType.DocumentDB:
        await updateSqlDatabaseOffer(params);
        break;
      case DefaultAccountExperienceType.MongoDB:
        await updateMongoDatabaseOffer(params);
        break;
      case DefaultAccountExperienceType.Cassandra:
        await updateCassandraKeyspaceOffer(params);
        break;
      case DefaultAccountExperienceType.Graph:
        await updateGremlinDatabaseOffer(params);
        break;
      default:
        throw new Error(`Unsupported default experience type: ${userContext.defaultExperience}`);
    }
  } catch (error) {
    if (error.code !== "MethodNotAllowed") {
      throw error;
    }
  }

  return await readDatabaseOffer({
    databaseId: params.databaseId,
    offerId: params.currentOffer.id,
  });
};

const updateSqlContainerOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateSqlContainerToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else if (params.migrateToManual) {
    await migrateSqlContainerToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateSqlContainerThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body
    );
  }
};

const updateMongoCollectionOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateMongoDBCollectionToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else if (params.migrateToManual) {
    await migrateMongoDBCollectionToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateMongoDBCollectionThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body
    );
  }
};

const updateCassandraTableOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateCassandraTableToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else if (params.migrateToManual) {
    await migrateCassandraTableToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateCassandraTableThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body
    );
  }
};

const updateGremlinGraphOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateGremlinGraphToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else if (params.migrateToManual) {
    await migrateGremlinGraphToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateGremlinGraphThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body
    );
  }
};

const updateTableOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateTableToAutoscale(subscriptionId, resourceGroup, accountName, params.collectionId);
  } else if (params.migrateToManual) {
    await migrateTableToManualThroughput(subscriptionId, resourceGroup, accountName, params.collectionId);
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateTableThroughput(subscriptionId, resourceGroup, accountName, params.collectionId, body);
  }
};

const updateSqlDatabaseOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateSqlDatabaseToAutoscale(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else if (params.migrateToManual) {
    await migrateSqlDatabaseToManualThroughput(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateSqlDatabaseThroughput(subscriptionId, resourceGroup, accountName, params.databaseId, body);
  }
};

const updateMongoDatabaseOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateMongoDBDatabaseToAutoscale(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else if (params.migrateToManual) {
    await migrateMongoDBDatabaseToManualThroughput(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateMongoDBDatabaseThroughput(subscriptionId, resourceGroup, accountName, params.databaseId, body);
  }
};

const updateCassandraKeyspaceOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateCassandraKeyspaceToAutoscale(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else if (params.migrateToManual) {
    await migrateCassandraKeyspaceToManualThroughput(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateCassandraKeyspaceThroughput(subscriptionId, resourceGroup, accountName, params.databaseId, body);
  }
};

const updateGremlinDatabaseOffer = async (params: UpdateOfferParams): Promise<void> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateGremlinDatabaseToAutoscale(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else if (params.migrateToManual) {
    await migrateGremlinDatabaseToManualThroughput(subscriptionId, resourceGroup, accountName, params.databaseId);
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateGremlinDatabaseThroughput(subscriptionId, resourceGroup, accountName, params.databaseId, body);
  }
};

const createUpdateOfferBody = (params: UpdateOfferParams): ThroughputSettingsUpdateParameters => {
  const body: ThroughputSettingsUpdateParameters = {
    properties: {
      resource: {},
    },
  };

  if (params.autopilotThroughput) {
    body.properties.resource.autoscaleSettings = {
      maxThroughput: params.autopilotThroughput,
    };
  } else {
    body.properties.resource.throughput = params.manualThroughput;
  }

  return body;
};

const updateOfferWithSDK = async (params: UpdateOfferParams): Promise<Offer> => {
  const sdkOfferDefinition = params.currentOffer.offerDefinition;
  const newOffer: SDKOfferDefinition = {
    content: {
      offerThroughput: undefined,
      offerIsRUPerMinuteThroughputEnabled: false,
    },
    _etag: undefined,
    _ts: undefined,
    _rid: sdkOfferDefinition._rid,
    _self: sdkOfferDefinition._self,
    id: sdkOfferDefinition.id,
    offerResourceId: sdkOfferDefinition.offerResourceId,
    offerVersion: sdkOfferDefinition.offerVersion,
    offerType: sdkOfferDefinition.offerType,
    resource: sdkOfferDefinition.resource,
  };

  if (params.autopilotThroughput) {
    newOffer.content.offerAutopilotSettings = {
      maxThroughput: params.autopilotThroughput,
    };
  } else {
    newOffer.content.offerThroughput = params.manualThroughput;
  }

  const options: RequestOptions = {};
  if (params.migrateToAutoPilot) {
    options.initialHeaders = {
      [HttpHeaders.migrateOfferToAutopilot]: "true",
    };
    delete newOffer.content.offerAutopilotSettings;
  } else if (params.migrateToManual) {
    options.initialHeaders = {
      [HttpHeaders.migrateOfferToManualThroughput]: "true",
    };
    newOffer.content.offerAutopilotSettings = { maxThroughput: 0 };
  }

  const sdkResponse = await client()
    .offer(params.currentOffer.id)
    // TODO Remove casting when SDK types are fixed (https://github.com/Azure/azure-sdk-for-js/issues/10660)
    .replace((newOffer as unknown) as OfferDefinition, options);

  return parseSDKOfferResponse(sdkResponse);
};
