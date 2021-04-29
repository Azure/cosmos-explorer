import { AuthType } from "../../AuthType";
import { Offer, ReadCollectionOfferParams } from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { getCassandraTableThroughput } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { getGremlinGraphThroughput } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { getMongoDBCollectionThroughput } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { getSqlContainerThroughput } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { getTableThroughput } from "../../Utils/arm/generatedClients/2020-04-01/tableResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { handleError } from "../ErrorHandlingUtils";
import { readOfferWithSDK } from "./readOfferWithSDK";

export const readCollectionOffer = async (params: ReadCollectionOfferParams): Promise<Offer> => {
  const clearMessage = logConsoleProgress(`Querying offer for collection ${params.collectionId}`);

  try {
    if (userContext.authType === AuthType.AAD && !userContext.useSDKOperations && userContext.apiType !== "Tables") {
      return await readCollectionOfferWithARM(params.databaseId, params.collectionId);
    }

    return await readOfferWithSDK(params.offerId, params.collectionResourceId);
  } catch (error) {
    handleError(error, "ReadCollectionOffer", `Error while querying offer for collection ${params.collectionId}`);
    throw error;
  } finally {
    clearMessage();
  }
};

const readCollectionOfferWithARM = async (databaseId: string, collectionId: string): Promise<Offer> => {
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.apiType;

  let rpResponse;
  try {
    switch (defaultExperience) {
      case "SQL":
        rpResponse = await getSqlContainerThroughput(
          subscriptionId,
          resourceGroup,
          accountName,
          databaseId,
          collectionId
        );
        break;
      case "Mongo":
        rpResponse = await getMongoDBCollectionThroughput(
          subscriptionId,
          resourceGroup,
          accountName,
          databaseId,
          collectionId
        );
        break;
      case "Cassandra":
        rpResponse = await getCassandraTableThroughput(
          subscriptionId,
          resourceGroup,
          accountName,
          databaseId,
          collectionId
        );
        break;
      case "Gremlin":
        rpResponse = await getGremlinGraphThroughput(
          subscriptionId,
          resourceGroup,
          accountName,
          databaseId,
          collectionId
        );
        break;
      case "Tables":
        rpResponse = await getTableThroughput(subscriptionId, resourceGroup, accountName, collectionId);
        break;
      default:
        throw new Error(`Unsupported default experience type: ${defaultExperience}`);
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

    if (autoscaleSettings) {
      return {
        id: offerId,
        autoscaleMaxThroughput: autoscaleSettings.maxThroughput,
        manualThroughput: undefined,
        minimumThroughput,
        offerReplacePending: resource.offerReplacePending === "true",
      };
    }

    return {
      id: offerId,
      autoscaleMaxThroughput: undefined,
      manualThroughput: resource.throughput,
      minimumThroughput,
      offerReplacePending: resource.offerReplacePending === "true",
    };
  }

  return undefined;
};
