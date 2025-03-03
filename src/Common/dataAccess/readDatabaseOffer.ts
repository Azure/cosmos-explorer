import { isFabric, isFabricMirroredKey } from "Platform/Fabric/FabricUtil";
import { AuthType } from "../../AuthType";
import { Offer, ReadDatabaseOfferParams } from "../../Contracts/DataModels";
import { userContext } from "../../UserContext";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { getCassandraKeyspaceThroughput } from "../../Utils/arm/generatedClients/cosmos/cassandraResources";
import { getGremlinDatabaseThroughput } from "../../Utils/arm/generatedClients/cosmos/gremlinResources";
import { getMongoDBDatabaseThroughput } from "../../Utils/arm/generatedClients/cosmos/mongoDBResources";
import { getSqlDatabaseThroughput } from "../../Utils/arm/generatedClients/cosmos/sqlResources";
import { handleError } from "../ErrorHandlingUtils";
import { readOfferWithSDK } from "./readOfferWithSDK";

export const readDatabaseOffer = async (params: ReadDatabaseOfferParams): Promise<Offer> => {
  if (isFabricMirroredKey()) {
    // TODO This works, but is very slow, because it requests the token, so we skip for now
    console.error("Skiping readDatabaseOffer for Fabric");
    return undefined;
  }

  const clearMessage = logConsoleProgress(`Querying offer for database ${params.databaseId}`);

  try {
    if (
      userContext.authType === AuthType.AAD &&
      !userContext.features.enableSDKoperations &&
      userContext.apiType !== "Tables" &&
      !isFabric()
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
    const instantMaximumThroughput: number =
      typeof resource.instantMaximumThroughput === "string"
        ? parseInt(resource.instantMaximumThroughput)
        : resource.instantMaximumThroughput;
    const softAllowedMaximumThroughput: number =
      typeof resource.softAllowedMaximumThroughput === "string"
        ? parseInt(resource.softAllowedMaximumThroughput)
        : resource.softAllowedMaximumThroughput;

    if (autoscaleSettings) {
      return {
        id: offerId,
        autoscaleMaxThroughput: autoscaleSettings.maxThroughput,
        manualThroughput: undefined,
        minimumThroughput,
        offerReplacePending: resource.offerReplacePending === "true",
        instantMaximumThroughput,
        softAllowedMaximumThroughput,
      };
    }

    return {
      id: offerId,
      autoscaleMaxThroughput: undefined,
      manualThroughput: resource.throughput,
      minimumThroughput,
      offerReplacePending: resource.offerReplacePending === "true",
      instantMaximumThroughput,
      softAllowedMaximumThroughput,
    };
  }

  return undefined;
};
