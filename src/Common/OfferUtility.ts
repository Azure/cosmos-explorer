import { Offer, SDKOfferDefinition } from "../Contracts/DataModels";
import { OfferResponse } from "@azure/cosmos";
import { HttpHeaders } from "./Constants";

export const parseSDKOfferResponse = (offerResponse: OfferResponse): Offer | undefined => {
  const offerDefinition: SDKOfferDefinition | undefined = offerResponse.resource;
  if (offerDefinition == undefined) return undefined;
  const offerContent = offerDefinition.content ? offerDefinition.content : undefined;
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
      offerReplacePending: offerResponse.headers?.[HttpHeaders.offerReplacePending] === "true"
    };
  }

  return {
    id: offerDefinition.id,
    autoscaleMaxThroughput: undefined,
    manualThroughput: offerContent.offerThroughput,
    minimumThroughput,
    offerDefinition,
    offerReplacePending: offerResponse.headers?.[HttpHeaders.offerReplacePending] === "true"
  };
};
