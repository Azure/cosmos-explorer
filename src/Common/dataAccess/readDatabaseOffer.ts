import { AuthType } from "../../AuthType";
import { Offer, ReadDatabaseOfferParams } from "../../Contracts/DataModels";
import { DefaultAccountExperienceType } from "../../DefaultAccountExperienceType";
import { userContext } from "../../UserContext";
import { getCassandraKeyspaceThroughput } from "../../Utils/arm/generatedClients/2020-04-01/cassandraResources";
import { getGremlinDatabaseThroughput } from "../../Utils/arm/generatedClients/2020-04-01/gremlinResources";
import { getMongoDBDatabaseThroughput } from "../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";
import { getSqlDatabaseThroughput } from "../../Utils/arm/generatedClients/2020-04-01/sqlResources";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { handleError } from "../ErrorHandlingUtils";
import { readOfferWithSDK } from "./readOfferWithSDK";

export const readDatabaseOffer = async (params: ReadDatabaseOfferParams): Promise<Offer> => {
  const clearMessage = logConsoleProgress(`Querying offer for database ${params.databaseId}`);

  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.useSDKOperations &&
      userContext.defaultExperience !== DefaultAccountExperienceType.Table
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
  const subscriptionId = userContext.subscriptionId;
  const resourceGroup = userContext.resourceGroup;
  const accountName = userContext.databaseAccount.name;
  const defaultExperience = userContext.defaultExperience;

  let rpResponse;
  try {
    switch (defaultExperience) {
      case DefaultAccountExperienceType.DocumentDB:
        rpResponse = await getSqlDatabaseThroughput(subscriptionId, resourceGroup, accountName, databaseId);
        break;
      case DefaultAccountExperienceType.MongoDB:
        rpResponse = await getMongoDBDatabaseThroughput(subscriptionId, resourceGroup, accountName, databaseId);
        break;
      case DefaultAccountExperienceType.Cassandra:
        rpResponse = await getCassandraKeyspaceThroughput(subscriptionId, resourceGroup, accountName, databaseId);
        break;
      case DefaultAccountExperienceType.Graph:
        rpResponse = await getGremlinDatabaseThroughput(subscriptionId, resourceGroup, accountName, databaseId);
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
