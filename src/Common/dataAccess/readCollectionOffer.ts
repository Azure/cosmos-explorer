import * as DataModels from "../../Contracts/DataModels";
import { AuthType } from "../../AuthType";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { HttpHeaders } from "../Constants";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { getSqlContainerThroughput } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { getMongoDBCollectionThroughput } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { getCassandraTableThroughput } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { getGremlinGraphThroughput } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { getTableThroughput } from "../../Utils/arm/generatedClients/2020-04-01/tableResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { readOffers } from "./readOffers";
import { userContext } from "../../UserContext";

export const readCollectionOffer = async (
  params: DataModels.ReadCollectionOfferParams
): Promise<DataModels.OfferWithHeaders> => {
  const clearMessage = logConsoleProgress(`Querying offer for collection ${params.collectionId}`);
  let offerId = params.offerId;
  if (!offerId) {
    if (window.authType === AuthType.AAD && !userContext.useSDKOperations) {
      try {
        offerId = await getCollectionOfferIdWithARM(params.databaseId, params.collectionId);
      } catch (error) {
        clearMessage();
        if (error.code !== "NotFound") {
          throw error;
        }
        return undefined;
      }
    } else {
      offerId = await getCollectionOfferIdWithSDK(params.collectionResourceId);
      if (!offerId) {
        clearMessage();
        return undefined;
      }
    }
  }

  const options: RequestOptions = {
    initialHeaders: {
      [HttpHeaders.populateCollectionThroughputInfo]: true
    }
  };

  try {
    const response = await client()
      .offer(offerId)
      .read(options);
    return (
      response && {
        ...response.resource,
        headers: response.headers
      }
    );
  } catch (error) {
    handleError(error, `Error while querying offer for collection ${params.collectionId}`, "ReadCollectionOffer");
    throw error;
  } finally {
    clearMessage();
  }
};

const getCollectionOfferIdWithARM = async (databaseId: string, collectionId: string): Promise<string> => {
  let rpResponse;
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.defaultExperience;
  switch (defaultExperience) {
    case DefaultAccountExperienceType.DocumentDB:
      rpResponse = await getSqlContainerThroughput(
        subscriptionId,
        resourceGroup,
        accountName,
        databaseId,
        collectionId
      );
      break;
    case DefaultAccountExperienceType.MongoDB:
      rpResponse = await getMongoDBCollectionThroughput(
        subscriptionId,
        resourceGroup,
        accountName,
        databaseId,
        collectionId
      );
      break;
    case DefaultAccountExperienceType.Cassandra:
      rpResponse = await getCassandraTableThroughput(
        subscriptionId,
        resourceGroup,
        accountName,
        databaseId,
        collectionId
      );
      break;
    case DefaultAccountExperienceType.Graph:
      rpResponse = await getGremlinGraphThroughput(
        subscriptionId,
        resourceGroup,
        accountName,
        databaseId,
        collectionId
      );
      break;
    case DefaultAccountExperienceType.Table:
      rpResponse = await getTableThroughput(subscriptionId, resourceGroup, accountName, collectionId);
      break;
    default:
      throw new Error(`Unsupported default experience type: ${defaultExperience}`);
  }

  return rpResponse?.name;
};

const getCollectionOfferIdWithSDK = async (collectionResourceId: string): Promise<string> => {
  const offers = await readOffers();
  const offer = offers.find(offer => offer.resource === collectionResourceId);
  return offer?.id;
};
