import { Offer } from "../../Contracts/DataModels";
import { logConsoleProgress } from "../../Utils/NotificationConsoleUtils";
import { client } from "../CosmosClient";
import { handleError, getErrorMessage } from "../ErrorHandlingUtils";

export const readOffers = async (): Promise<Offer[]> => {
  const clearMessage = logConsoleProgress(`Querying offers`);

  try {
    const response = await client()
      .offers.readAll()
      .fetchAll();
    return response?.resources;
  } catch (error) {
    // This should be removed when we can correctly identify if an account is serverless when connected using connection string too.
    if (getErrorMessage(error)?.includes("Reading or replacing offers is not supported for serverless accounts")) {
      return [];
    }

    handleError(error, `Error while querying offers`, "ReadOffers");
    throw error;
  } finally {
    clearMessage();
  }
};
