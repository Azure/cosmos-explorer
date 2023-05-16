import { AuthType } from "../../AuthType";
import { Offer, ReadDatabaseOfferParams } from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { getCassandraKeyspaceThroughput } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { getGremlinDatabaseThroughput } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { getMongoDBDatabaseThroughput } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { getSqlDatabaseThroughput } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { handleError } from "../ErrorHandlingUtils";
import { readOfferWithSDK } from "./readOfferWithSDK";

export const readDatabaseOffer = async (params: ReadDatabaseOfferParams): Promise<Offer> => {
  const clearMessage = logConsoleProgress(`Querying offer for database ${params.databaseId}`);

  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType !== "Tables"
    ) {
      return await readDatabaseOfferWithARM(params.databaseId);
    }

    return await readOfferWithSDK(params.offerId, params.databaseResourceId);
  } catch (error) {
    handleError(error, "ReadDatabaseOffer", `Error while querying offer for database ${params.databaseId}`);
    throw error;
  } finally {
    clearMessage();
  }
};

const readDatabaseOfferWithARM = async (databaseId: string): Promise<Offer> => {
  const { subscriptionId, resourceGroup, apiType, databaseAccount } = userContext;
  const accountName = databaseAccount.name;

  let rpResponse;
  try {
    switch (apiType) {
      case "SQL":
        rpResponse = await getSqlDatabaseThroughput(subscriptionId, resourceGroup, accountName, databaseId);
        break;
      case "Mongo":
        rpResponse = await getMongoDBDatabaseThroughput(subscriptionId, resourceGroup, accountName, databaseId);
        break;
      case "Cassandra":
        rpResponse = await getCassandraKeyspaceThroughput(subscriptionId, resourceGroup, accountName, databaseId);
        break;
      case "Gremlin":
        rpResponse = await getGremlinDatabaseThroughput(subscriptionId, resourceGroup, accountName, databaseId);
        break;
      default:
        throw new Error(`Unsupported default experience type: ${apiType}`);
    }
  } catch (error) {
    if (error.code !== "NotFound") {
      throw error;
    }

    return undefined;
  }

  const resource = rpResponse?.properties?.resource;
  if (resource) {
    const offerId: string = rpResponse.name;
    const minimumThroughput: number =
      typeof resource.minimumThroughput === "string"
        ? parseInt(resource.minimumThroughput)
        : resource.minimumThroughput;
    const autoscaleSettings = resource.autoscaleSettings;
    const instantMaximumThroughput: number = resource.instantMaximumThroughput;
    const maximumThroughput: number = resource.maximumThroughput;

    if (autoscaleSettings) {
      return {
        id: offerId,
        autoscaleMaxThroughput: autoscaleSettings.maxThroughput,
        manualThroughput: undefined,
        minimumThroughput,
        offerReplacePending: resource.offerReplacePending === "true",
        instantMaximumThroughput,
        maximumThroughput,
      };
    }

    return {
      id: offerId,
      autoscaleMaxThroughput: undefined,
      manualThroughput: resource.throughput,
      minimumThroughput,
      offerReplacePending: resource.offerReplacePending === "true",
      instantMaximumThroughput,
      maximumThroughput,
    };
  }

  return undefined;
};
