import { Offer } from "../../Contracts/DataModels";
import { ClientDefaults } from "../Constants";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { Platform, configContext } from "../../ConfigContext";
import { client } from "../CosmosClient";
import { handleError } from "../ErrorHandlingUtils";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { sendCachedDataMessage } from "../MessageHandler";
import { userContext } from "../../UserContext";

export const readOffers = async (): Promise<Offer[]> => {
  const clearMessage = logConsoleProgress(`Querying offers`);
  try {
    if (configContext.platform === Platform.Portal) {
      const offers = sendCachedDataMessage<Offer[]>(MessageTypes.AllOffers, [
        userContext.databaseAccount.id,
        ClientDefaults.portalCacheTimeoutMs
      ]);
      clearMessage();

      return offers;
    }
  } catch (error) {
    // If error getting cached Offers, continue on and read via SDK
  }

  try {
    const response = await client()
      .offers.readAll()
      .fetchAll();
    return response?.resources;
  } catch (error) {
    // This should be removed when we can correctly identify if an account is serverless when connected using connection string too.
    if (error.message.includes("Reading or replacing offers is not supported for serverless accounts")) {
      return [];
    }

    handleError(error, `Error while querying offers`, "ReadOffers");
    throw error;
  } finally {
    clearMessage();
  }
};
