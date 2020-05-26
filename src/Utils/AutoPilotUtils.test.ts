import * as AutoPilotUtils from "./AutoPilotUtils";
import * as Constants from "../Common/Constants";
import { AutopilotTier, Offer } from "../Contracts/DataModels";

describe("AutoPilotUtils", () => {
  describe("isAutoPilotOfferUpgradedToV3", () => {
    const legacyAutopilotOffer = {
      tier: 1,
      maximumTierThroughput: 20000,
      maxThroughput: 20000
    };

    const v3AutopilotOffer = {
      maximumTierThroughput: 20000,
      maxThroughput: 20000
    };

    const v3AutopilotOfferDuringTransitionPhase = {
      tier: 0,
      maximumTierThroughput: 20000,
      maxThroughput: 20000
    };

    it("should return false if the offer has a tier level and the tier level >= 1", () => {
      expect(AutoPilotUtils.isAutoPilotOfferUpgradedToV3(legacyAutopilotOffer)).toEqual(false);
    });

    it("should return true if the autopilot offer does not have a tier level", () => {
      expect(AutoPilotUtils.isAutoPilotOfferUpgradedToV3(v3AutopilotOffer)).toEqual(true);
    });

    it("should return true if the autopilot offer has a tier level and the tier level is === 0", () => {
      expect(AutoPilotUtils.isAutoPilotOfferUpgradedToV3(v3AutopilotOfferDuringTransitionPhase)).toEqual(true);
    });
  });

  describe("isValidAutoPilotOffer", () => {
    function getOffer(): Offer {
      const commonOffer: Offer = {
        _etag: "_etag",
        _rid: "_rid",
        _self: "_self",
        _ts: "_ts",
        id: "id",
        content: {
          offerThroughput: 0,
          offerIsRUPerMinuteThroughputEnabled: false,
          offerAutopilotSettings: undefined
        }
      };
      return commonOffer;
    }

    it("offer with autopilot", () => {
      let offer = getOffer();
      offer.content.offerAutopilotSettings = {
        tier: 1
      };
      const isValid = AutoPilotUtils.isValidV2AutoPilotOffer(offer);
      expect(isValid).toBe(true);
    });

    it("offer without autopilot", () => {
      let offer = getOffer();
      const isValid = AutoPilotUtils.isValidV2AutoPilotOffer(offer);
      expect(isValid).toBe(false);
    });
  });

  describe("isValidAutoPilotTier", () => {
    it("invalid input, should return false", () => {
      const isValid1 = AutoPilotUtils.isValidAutoPilotTier(0);
      expect(isValid1).toBe(false);
      const isValid2 = AutoPilotUtils.isValidAutoPilotTier(5);
      expect(isValid2).toBe(false);
      const isValid3 = AutoPilotUtils.isValidAutoPilotTier(undefined);
      expect(isValid3).toBe(false);
    });

    it("valid input, should return true", () => {
      const isValid1 = AutoPilotUtils.isValidAutoPilotTier(1);
      expect(isValid1).toBe(true);
      const isValid3 = AutoPilotUtils.isValidAutoPilotTier(AutopilotTier.Tier3);
      expect(isValid3).toBe(true);
    });
  });

  describe("getAutoPilotTextWithTier", () => {
    it("invalid input, should return undefined", () => {
      const text1 = AutoPilotUtils.getAutoPilotTextWithTier(0);
      expect(text1).toBe(undefined);
      const text2 = AutoPilotUtils.getAutoPilotTextWithTier(undefined);
      expect(text2).toBe(undefined);
    });

    it("valid input, should return coreponding text", () => {
      const text1 = AutoPilotUtils.getAutoPilotTextWithTier(1);
      expect(text1).toBe(Constants.AutoPilot.tier1Text);
      const text4 = AutoPilotUtils.getAutoPilotTextWithTier(AutopilotTier.Tier4);
      expect(text4).toBe(Constants.AutoPilot.tier4Text);
    });
  });

  describe("getAvailableAutoPilotTiersOptions", () => {
    it("invalid input should return all options", () => {
      const option1 = AutoPilotUtils.getAvailableAutoPilotTiersOptions(undefined);
      expect(option1.length).toBe(4);
      const option2 = AutoPilotUtils.getAvailableAutoPilotTiersOptions(5);
      expect(option2.length).toBe(4);
    });

    it("valid input should return all available options", () => {
      const option1 = AutoPilotUtils.getAvailableAutoPilotTiersOptions();
      expect(option1.length).toBe(4);
      const option2 = AutoPilotUtils.getAvailableAutoPilotTiersOptions(AutopilotTier.Tier3);
      expect(option2.length).toBe(4);
    });
  });
});
