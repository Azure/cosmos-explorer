import { Offer } from "../../Contracts/DataModels";
import { ClientDefaults } from "../Constants";
import { MessageTypes } from "../../Contracts/ExplorerContracts";
import { Platform, configContext } from "../../ConfigContext";
import { client } from "../CosmosClient";
import { sendCachedDataMessage } from "../MessageHandler";
import { userContext } from "../../UserContext";

export const readOffers = async (isServerless?: boolean): Promise<Offer[]> => {
  if (isServerless) {
    return []; // Reading offers is not supported for serverless accounts
  }

  try {
    if (configContext.platform === Platform.Portal) {
      return sendCachedDataMessage<Offer[]>(MessageTypes.AllOffers, [
        userContext.databaseAccount.id,
        ClientDefaults.portalCacheTimeoutMs
      ]);
    }
  } catch (error) {
    // If error getting cached Offers, continue on and read via SDK
  }

  return client()
    .offers.readAll()
    .fetchAll()
    .then(response => response.resources)
    .catch(error => {
      // This should be removed when we can correctly identify if an account is serverless when connected using connection string too.
      if (error.message.includes("Reading or replacing offers is not supported for serverless accounts")) {
        return [];
      }
      throw error;
    });
};
