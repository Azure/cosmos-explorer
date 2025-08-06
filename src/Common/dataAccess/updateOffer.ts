import { OfferDefinition, RequestOptions } from "@azure/cosmos";
import { isFabric } from "Platform/Fabric/FabricUtil";
import { AuthType } from "../../AuthType";
import { Offer, SDKOfferDefinition, ThroughputBucket, UpdateOfferParams } from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import {
  migrateCassandraKeyspaceToAutoscale,
  migrateCassandraKeyspaceToManualThroughput,
  migrateCassandraTableToAutoscale,
  migrateCassandraTableToManualThroughput,
  updateCassandraKeyspaceThroughput,
  updateCassandraTableThroughput,
} from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import {
  migrateGremlinDatabaseToAutoscale,
  migrateGremlinDatabaseToManualThroughput,
  migrateGremlinGraphToAutoscale,
  migrateGremlinGraphToManualThroughput,
  updateGremlinDatabaseThroughput,
  updateGremlinGraphThroughput,
} from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import {
  migrateMongoDBCollectionToAutoscale,
  migrateMongoDBCollectionToManualThroughput,
  migrateMongoDBDatabaseToAutoscale,
  migrateMongoDBDatabaseToManualThroughput,
  updateMongoDBCollectionThroughput,
  updateMongoDBDatabaseThroughput,
} from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import {
  migrateSqlContainerToAutoscale,
  migrateSqlContainerToManualThroughput,
  migrateSqlDatabaseToAutoscale,
  migrateSqlDatabaseToManualThroughput,
  updateSqlContainerThroughput,
  updateSqlDatabaseThroughput,
} from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import {
  migrateTableToAutoscale,
  migrateTableToManualThroughput,
  updateTableThroughput,
} from "../../Utils/arm/generatedClients/cosmos/tableResources";
import { ThroughputSettingsUpdateParameters } from "../../Utils/arm/generatedClients/cosmos/types";
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
    if (userContext.authType === AuthType.AAD && !userContext.features.enableSDKoperations && !isFabric()) {
      if (params.collectionId) {
        updatedOffer = await updateCollectionOfferWithARM(params);
      } else if (userContext.apiType === "Tables") {
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
    switch (userContext.apiType) {
      case "SQL":
        await updateSqlContainerOffer(params);
        break;
      case "Mongo":
        await updateMongoCollectionOffer(params);
        break;
      case "Cassandra":
        await updateCassandraTableOffer(params);
        break;
      case "Gremlin":
        await updateGremlinGraphOffer(params);
        break;
      case "Tables":
        await updateTableOffer(params);
        break;
      default:
        throw new Error(`Unsupported default experience type: ${userContext.apiType}`);
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
    switch (userContext.apiType) {
      case "SQL":
        await updateSqlDatabaseOffer(params);
        break;
      case "Mongo":
        await updateMongoDatabaseOffer(params);
        break;
      case "Cassandra":
        await updateCassandraKeyspaceOffer(params);
        break;
      case "Gremlin":
        await updateGremlinDatabaseOffer(params);
        break;
      default:
        throw new Error(`Unsupported default experience type: ${userContext.apiType}`);
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
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateSqlContainerToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else if (params.migrateToManual) {
    await migrateSqlContainerToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateSqlContainerThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body,
    );
  }
};

const updateMongoCollectionOffer = async (params: UpdateOfferParams): Promise<void> => {
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateMongoDBCollectionToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else if (params.migrateToManual) {
    await migrateMongoDBCollectionToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateMongoDBCollectionThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body,
    );
  }
};

const updateCassandraTableOffer = async (params: UpdateOfferParams): Promise<void> => {
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateCassandraTableToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else if (params.migrateToManual) {
    await migrateCassandraTableToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateCassandraTableThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body,
    );
  }
};

const updateGremlinGraphOffer = async (params: UpdateOfferParams): Promise<void> => {
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  if (params.migrateToAutoPilot) {
    await migrateGremlinGraphToAutoscale(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else if (params.migrateToManual) {
    await migrateGremlinGraphToManualThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
    );
  } else {
    const body: ThroughputSettingsUpdateParameters = createUpdateOfferBody(params);
    await updateGremlinGraphThroughput(
      subscriptionId,
      resourceGroup,
      accountName,
      params.databaseId,
      params.collectionId,
      body,
    );
  }
};

const updateTableOffer = async (params: UpdateOfferParams): Promise<void> => {
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

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
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

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
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

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
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

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
  const { subscriptionId, resourceGroup, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

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

  if (params.throughputBuckets) {
    const throughputBuckets = params.throughputBuckets.filter(
      (bucket: ThroughputBucket) => bucket.maxThroughputPercentage !== 100,
    );
    body.properties.resource.throughputBuckets = throughputBuckets;
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
    .replace(newOffer as unknown as OfferDefinition, options);

  return parseSDKOfferResponse(sdkResponse);
};
