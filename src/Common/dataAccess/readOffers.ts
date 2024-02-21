import { SDKOfferDefinition } from "../../Contracts/DataModels";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { ClientOperationType, client } from "../CosmosClient";
import { getErrorMessage, handleError } from "../ErrorHandlingUtils";

export const readOffers = async (): Promise<SDKOfferDefinition[]> => {
  const clearMessage = logConsoleProgress(`Querying offers`);

  try {
    const response = await client(ClientOperationType.READ).offers.readAll().fetchAll();
    return response?.resources;
  } catch (error) {
    // This should be removed when we can correctly identify if an account is serverless when connected using connection string too.
    if (getErrorMessage(error)?.includes("Reading or replacing offers is not supported for serverless accounts")) {
      return [];
    }

    handleError(error, "ReadOffers", `Error while querying offers`);
    throw error;
  } finally {
    clearMessage();
  }
};
