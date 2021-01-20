import * as OfferUtility from "./OfferUtility";
import { SDKOfferDefinition, Offer } from "../Contracts/DataModels";
import { OfferResponse } from "@azure/cosmos";

describe("parseSDKOfferResponse", () => {
  it("manual throughput", () => {
    const mockOfferDefinition = {
      content: {
        offerThroughput: 500,
        collectionThroughputInfo: {
          minimumRUForCollection: 400,
          numPhysicalPartitions: 1,
        },
      },
      id: "test",
    } as SDKOfferDefinition;

    const mockResponse = {
      resource: mockOfferDefinition,
    } as OfferResponse;

    const expectedResult: Offer = {
      manualThroughput: 500,
      autoscaleMaxThroughput: undefined,
      minimumThroughput: 400,
      id: "test",
      offerDefinition: mockOfferDefinition,
      offerReplacePending: false,
    };

    expect(OfferUtility.parseSDKOfferResponse(mockResponse)).toEqual(expectedResult);
  });

  it("autoscale throughput", () => {
    const mockOfferDefinition = {
      content: {
        offerThroughput: 400,
        collectionThroughputInfo: {
          minimumRUForCollection: 400,
          numPhysicalPartitions: 1,
        },
        offerAutopilotSettings: {
          maxThroughput: 5000,
        },
      },
      id: "test",
    } as SDKOfferDefinition;

    const mockResponse = {
      resource: mockOfferDefinition,
    } as OfferResponse;

    const expectedResult: Offer = {
      manualThroughput: undefined,
      autoscaleMaxThroughput: 5000,
      minimumThroughput: 400,
      id: "test",
      offerDefinition: mockOfferDefinition,
      offerReplacePending: false,
    };

    expect(OfferUtility.parseSDKOfferResponse(mockResponse)).toEqual(expectedResult);
  });
});
