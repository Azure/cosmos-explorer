import { RequestOptions } from "@azure/cosmos";
import { Offer } from "../../Contracts/DataModels";
import { HttpHeaders } from "../Constants";
import { client } from "../CosmosClient";
import { parseSDKOfferResponse } from "../OfferUtility";
import { readOffers } from "./readOffers";

export const readOfferWithSDK = async (offerId: string, resourceId: string): Promise<Offer> => {
  if (!offerId) {
    const offers = await readOffers();
    const offer = offers.find((offer) => offer.resource === resourceId);

    if (!offer) {
      return undefined;
    }
    offerId = offer.id;
  }

  const options: RequestOptions = {
    initialHeaders: {
      [HttpHeaders.populateCollectionThroughputInfo]: true,
    },
  };
  const response = await client().offer(offerId).read(options);

  return parseSDKOfferResponse(response);
};
