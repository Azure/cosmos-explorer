import * as Constants from "../../src/Common/Constants";
import * as DataModels from "../../src/Contracts/DataModels";
import { OfferUtils } from "../../src/Utils/OfferUtils";

describe("OfferUtils tests", () => {
  const offerV1: DataModels.Offer = {
    _rid: "",
    _self: "",
    _ts: 0,
    _etag: "",
    id: "v1",
    offerVersion: Constants.OfferVersions.V1,
    offerType: "Standard",
    offerResourceId: "",
    content: null,
    resource: ""
  };

  const offerV2: DataModels.Offer = {
    _rid: "",
    _self: "",
    _ts: 0,
    _etag: "",
    id: "v1",
    offerVersion: Constants.OfferVersions.V2,
    offerType: "Standard",
    offerResourceId: "",
    content: null,
    resource: ""
  };

  describe("isOfferV1()", () => {
    it("should return true for V1", () => {
      expect(OfferUtils.isOfferV1(offerV1)).toBeTruthy();
    });

    it("should return false for V2", () => {
      expect(OfferUtils.isOfferV1(offerV2)).toBeFalsy();
    });
  });

  describe("isNotOfferV1()", () => {
    it("should return true for V2", () => {
      expect(OfferUtils.isNotOfferV1(offerV2)).toBeTruthy();
    });

    it("should return false for V1", () => {
      expect(OfferUtils.isNotOfferV1(offerV1)).toBeFalsy();
    });
  });
});
