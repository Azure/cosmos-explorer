import { OfferResponse } from "@azure/cosmos";
import { Offer, SDKOfferDefinition } from "../Contracts/DataModels";
import * as OfferUtility from "./OfferUtility";

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

  it("Test OfferContent not defined", () => {
    const mockOfferDefinition = {
      id: "test",
    } as SDKOfferDefinition;

    const mockResponse = {
      resource: mockOfferDefinition,
    } as OfferResponse;

    expect(OfferUtility.parseSDKOfferResponse(mockResponse)).toEqual(undefined);
  });

  it("Test OfferDefinition when null", () => {
    const mockResponse = {
      resource: undefined,
    } as OfferResponse;

    expect(OfferUtility.parseSDKOfferResponse(mockResponse)).toEqual(undefined);
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
