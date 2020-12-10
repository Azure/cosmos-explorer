import { Offer, SDKOfferDefinition } from "../Contracts/DataModels";
import { OfferResponse } from "@azure/cosmos";

export const parseSDKOfferResponse = (offerResponse: OfferResponse): Offer => {
  const offerDefinition: SDKOfferDefinition = offerResponse?.resource;
  const offerContent = offerDefinition.content;
  if (!offerContent) {
    return undefined;
  }

  const minimumThroughput = offerContent.collectionThroughputInfo?.minimumRUForCollection;
  const autopilotSettings = offerContent.offerAutopilotSettings;

  if (autopilotSettings) {
    return {
      id: offerDefinition.id,
      autoscaleMaxThroughput: autopilotSettings.maxThroughput,
      manualThroughput: undefined,
      minimumThroughput,
      offerDefinition,
      headers: offerResponse.headers,
    };
  }

  return {
    id: offerDefinition.id,
    autoscaleMaxThroughput: undefined,
    manualThroughput: offerContent.offerThroughput,
    minimumThroughput,
    offerDefinition,
    headers: offerResponse.headers,
  };
};
