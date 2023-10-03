import * as PricingUtils from "./PricingUtils";

describe("PricingUtils Tests", () => {
  describe("isLargerThanDefaultMinRU()", () => {
    it("should return true if passed number is larger than default min RU", () => {
      const value = PricingUtils.isLargerThanDefaultMinRU(2000);
      expect(value).toBe(true);
    });

    it("should return false if passed number is smaller than default min RU", () => {
      const value = PricingUtils.isLargerThanDefaultMinRU(200);
      expect(value).toBe(false);
    });

    it("should return false if passed number is negative", () => {
      const value = PricingUtils.isLargerThanDefaultMinRU(-1);
      expect(value).toBe(false);
    });

    it("should return false if passed number is not number", () => {
      const value = PricingUtils.isLargerThanDefaultMinRU(undefined);
      expect(value).toBe(false);
    });
  });

  describe("computeRUUsagePriceHourly()", () => {
    it("should return 0 for NaN regions default cloud", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: undefined,
        multimasterEnabled: false,
        isAutoscale: false,
      });
      expect(value).toBe(0);
    });
    it("should return 0 for NaN regions default cloud, autoscale", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: undefined,
        multimasterEnabled: false,
        isAutoscale: true,
      });
      expect(value).toBe(0);
    });

    it("should return 0 for -1 regions", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: -1,
        multimasterEnabled: false,
        isAutoscale: false,
      });
      expect(value).toBe(0);
    });
    it("should return 0 for -1 regions, autoscale", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: -1,
        multimasterEnabled: false,
        isAutoscale: true,
      });
      expect(value).toBe(0);
    });

    it("should return 0.00008 for default cloud, 1RU, 1 region, multimaster disabled", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 1,
        multimasterEnabled: false,
        isAutoscale: false,
      });
      expect(value).toBe(0.00008);
    });
    it("should return 0.00008 for default cloud, 1RU, 1 region, multimaster disabled, autoscale", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 1,
        multimasterEnabled: false,
        isAutoscale: true,
      });
      expect(value).toBe(0.00012);
    });

    it("should return 0.00051 for Mooncake cloud, 1RU, 1 region, multimaster disabled", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "mooncake",
        requestUnits: 1,
        numberOfRegions: 1,
        multimasterEnabled: false,
        isAutoscale: false,
      });
      expect(value).toBe(0.00051);
    });
    it("should return 0.00051 for Mooncake cloud, 1RU, 1 region, multimaster disabled, autoscale", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "mooncake",
        requestUnits: 1,
        numberOfRegions: 1,
        multimasterEnabled: false,
        isAutoscale: true,
      });
      expect(value).toBe(0.00076);
    });

    it("should return 0.00016 for default cloud, 1RU, 2 regions, multimaster disabled", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 2,
        multimasterEnabled: false,
        isAutoscale: false,
      });
      expect(value).toBe(0.00016);
    });
    it("should return 0.00016 for default cloud, 1RU, 2 regions, multimaster disabled, autoscale", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 2,
        multimasterEnabled: false,
        isAutoscale: true,
      });
      expect(value).toBe(0.00024);
    });

    it("should return 0.00008 for default cloud, 1RU, 1 region, multimaster enabled", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 1,
        multimasterEnabled: true,
        isAutoscale: false,
      });
      expect(value).toBe(0.00008);
    });
    it("should return 0.00008 for default cloud, 1RU, 1 region, multimaster enabled, autoscale", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 1,
        multimasterEnabled: true,
        isAutoscale: true,
      });
      expect(value).toBe(0.00012);
    });

    it("should return 0.00032 for default cloud, 1RU, 2 region, multimaster enabled", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 2,
        multimasterEnabled: true,
        isAutoscale: false,
      });
      expect(value).toBe(0.00032);
    });
    it("should return 0.00032 for default cloud, 1RU, 2 region, multimaster enabled, autoscale", () => {
      const value = PricingUtils.computeRUUsagePriceHourly({
        serverId: "default",
        requestUnits: 1,
        numberOfRegions: 2,
        multimasterEnabled: true,
        isAutoscale: true,
      });
      expect(value).toBe(0.00032);
    });
  });

  describe("getPriceCurrency()", () => {
    it("should return USD by default", () => {
      const value = PricingUtils.getPriceCurrency("default");
      expect(value).toBe("USD");
    });

    it("should return RMB for Mooncake", () => {
      const value = PricingUtils.getPriceCurrency("mooncake");
      expect(value).toBe("RMB");
    });
  });

  describe("computeStorageUsagePrice()", () => {
    it("should return 0.0 USD for default, 0Gib", () => {
      const value = PricingUtils.computeStorageUsagePrice("default", 0);
      expect(value).toBe("0.0 USD");
    });

    it("should return 0.0 USD for default cloud, 1Gib", () => {
      const value = PricingUtils.computeStorageUsagePrice("default", 1);
      expect(value).toBe("0.00034 USD");
    });

    it("should return 0.0 RMB for Mooncake, 0", () => {
      const value = PricingUtils.computeStorageUsagePrice("mooncake", 0);
      expect(value).toBe("0.0 RMB");
    });

    it("should return 0.035 RMB for Mooncake, 1", () => {
      const value = PricingUtils.computeStorageUsagePrice("mooncake", 1);
      expect(value).toBe("0.0035 RMB");
    });
  });

  describe("calculateEstimateNumber()", () => {
    it("should return '0.0060' for 0.006", () => {
      const value = PricingUtils.calculateEstimateNumber(0.006);
      expect(value).toBe("0.0060");
    });

    it("should return '0.010' for 0.01", () => {
      const value = PricingUtils.calculateEstimateNumber(0.01);
      expect(value).toBe("0.010");
    });

    it("should return '0.10' for 0.1", () => {
      const value = PricingUtils.calculateEstimateNumber(0.1);
      expect(value).toBe("0.10");
    });

    it("should return '1.00' for 1", () => {
      const value = PricingUtils.calculateEstimateNumber(1);
      expect(value).toBe("1.00");
    });

    it("should return '11.00' for 11", () => {
      const value = PricingUtils.calculateEstimateNumber(11);
      expect(value).toBe("11.00");
    });

    it("should return '1.10' for 1.1", () => {
      const value = PricingUtils.calculateEstimateNumber(1.1);
      expect(value).toBe("1.10");
    });
  });

  describe("getCurrencySign()", () => {
    it("should return '$' for default clouds", () => {
      const value = PricingUtils.getCurrencySign("default");
      expect(value).toBe("$");
    });

    it("should return '¥' for mooncake", () => {
      const value = PricingUtils.getCurrencySign("mooncake");
      expect(value).toBe("¥");
    });
  });

  describe("getPricePerRu()", () => {
    it("should return 0.00008 for single master default clouds", () => {
      const value = PricingUtils.getPricePerRu("default", 1);
      expect(value).toBe(0.00008);
    });

    it("should return 0.00016 for multi master default clouds", () => {
      const value = PricingUtils.getPricePerRu("default", 2);
      expect(value).toBe(0.00016);
    });

    it("should return 0.00051 for single master mooncake", () => {
      const value = PricingUtils.getPricePerRu("mooncake", 1);
      expect(value).toBe(0.00051);
    });

    it("should return 0.00102 for multi master mooncake", () => {
      const value = PricingUtils.getPricePerRu("mooncake", 2);
      expect(value).toBe(0.00102);
    });
  });

  describe("getRegionMultiplier()", () => {
    it("should return 0 for undefined", () => {
      const value = PricingUtils.getRegionMultiplier(undefined);
      expect(value).toBe(0);
    });
    it("should return 0 for -1", () => {
      const value = PricingUtils.getRegionMultiplier(-1);
      expect(value).toBe(0);
    });
    it("should return 0 for 0", () => {
      const value = PricingUtils.getRegionMultiplier(0);
      expect(value).toBe(0);
    });
    it("should return 1 for 1", () => {
      const value = PricingUtils.getRegionMultiplier(1);
      expect(value).toBe(1);
    });
    it("should return 2 for 2", () => {
      const value = PricingUtils.getRegionMultiplier(2);
      expect(value).toBe(2);
    });
  });

  describe("getMultimasterMultiplier()", () => {
    it("should return 1 for multimaster disabled", () => {
      const value = PricingUtils.getMultimasterMultiplier(1, false);
      expect(value).toBe(1);

      const value2 = PricingUtils.getMultimasterMultiplier(2, false);
      expect(value2).toBe(1);
    });

    it("should return 1 for multimaster enabled with 1 region", () => {
      const value = PricingUtils.getMultimasterMultiplier(1, true);
      expect(value).toBe(1);
    });

    it("should return 2 for multimaster enabled with 2 regions", () => {
      const value = PricingUtils.getMultimasterMultiplier(2, true);
      expect(value).toBe(2);
    });

    it("should return 2 for multimaster enabled with 3 regions", () => {
      const value = PricingUtils.getMultimasterMultiplier(3, true);
      expect(value).toBe(2);
    });
  });

  describe("getEstimatedSpendHtml()", () => {
    it("should return 'Cost (USD): <b>$0.000080 hourly / $0.0019 daily / $0.058 monthly </b> (1 region, 1RU/s, $0.00008/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>' for 1RU/s on default cloud, 1 region, with multimaster", () => {
      const value = PricingUtils.getEstimatedSpendHtml(
        1 /*RU/s*/,
        "default" /* cloud */,
        1 /* region */,
        true /* multimaster */,
      );
      expect(value).toBe(
        "Cost (USD): <b>$0.000080 hourly / $0.0019 daily / $0.058 monthly </b> (1 region, 1RU/s, $0.00008/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>",
      );
    });

    it("should return 'Cost (RMB): <b>¥0.00051 hourly / ¥0.012 daily / ¥0.37 monthly </b> (1 region, 1RU/s, ¥0.00051/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>' for 1RU/s on mooncake, 1 region, with multimaster", () => {
      const value = PricingUtils.getEstimatedSpendHtml(
        1 /*RU/s*/,
        "mooncake" /* cloud */,
        1 /* region */,
        true /* multimaster */,
      );
      expect(value).toBe(
        "Cost (RMB): <b>¥0.00051 hourly / ¥0.012 daily / ¥0.37 monthly </b> (1 region, 1RU/s, ¥0.00051/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>",
      );
    });

    it("should return 'Cost (USD): <b>$0.13 hourly / $3.07 daily / $140.16 monthly </b> (2 regions, 400RU/s, $0.00016/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>' for 400RU/s on default cloud, 2 region, with multimaster", () => {
      const value = PricingUtils.getEstimatedSpendHtml(
        400 /*RU/s*/,
        "default" /* cloud */,
        2 /* region */,
        true /* multimaster */,
      );
      expect(value).toBe(
        "Cost (USD): <b>$0.13 hourly / $3.07 daily / $93.44 monthly </b> (2 regions, 400RU/s, $0.00016/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>",
      );
    });

    it("should return 'Cost (USD): <b>$0.064 hourly / $1.54 daily / $46.72 monthly </b> (2 regions, 400RU/s, $0.00008/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>' for 400RU/s on default cloud, 2 region, without multimaster", () => {
      const value = PricingUtils.getEstimatedSpendHtml(
        400 /*RU/s*/,
        "default" /* cloud */,
        2 /* region */,
        false /* multimaster */,
      );
      expect(value).toBe(
        "Cost (USD): <b>$0.064 hourly / $1.54 daily / $46.72 monthly </b> (2 regions, 400RU/s, $0.00008/RU)<p style='padding: 10px 0px 0px 0px;'><em>*This cost is an estimate and may vary based on the regions where your account is deployed and potential discounts applied to your account</em></p>",
      );
    });
  });

  describe("getEstimatedSpendAcknowledgeString()", () => {
    it("should return 'I acknowledge the estimated $0.0019 daily cost for the throughput above.' for 1RU/s on default cloud, 1 region, with multimaster", () => {
      const value = PricingUtils.getEstimatedSpendAcknowledgeString(
        1 /*RU/s*/,
        "default" /* cloud */,
        1 /* region */,
        true /* multimaster */,
        false,
      );
      expect(value).toBe("I acknowledge the estimated $0.0019 daily cost for the throughput above.");
    });

    it("should return 'I acknowledge the estimated ¥0.012 daily cost for the throughput above.' for 1RU/s on mooncake, 1 region, with multimaster", () => {
      const value = PricingUtils.getEstimatedSpendAcknowledgeString(
        1 /*RU/s*/,
        "mooncake" /* cloud */,
        1 /* region */,
        true /* multimaster */,
        false,
      );
      expect(value).toBe("I acknowledge the estimated ¥0.012 daily cost for the throughput above.");
    });

    it("should return 'I acknowledge the estimated $3.07 daily cost for the throughput above.' for 400RU/s on default cloud, 2 region, with multimaster", () => {
      const value = PricingUtils.getEstimatedSpendAcknowledgeString(
        400 /*RU/s*/,
        "default" /* cloud */,
        2 /* region */,
        true /* multimaster */,
        false,
      );
      expect(value).toBe("I acknowledge the estimated $3.07 daily cost for the throughput above.");
    });

    it("should return 'I acknowledge the estimated $1.54 daily cost for the throughput above.' for 400RU/s on default cloud, 2 region, without multimaster", () => {
      const value = PricingUtils.getEstimatedSpendAcknowledgeString(
        400 /*RU/s*/,
        "default" /* cloud */,
        2 /* region */,
        false /* multimaster */,
        false,
      );
      expect(value).toBe("I acknowledge the estimated $1.54 daily cost for the throughput above.");
    });
  });

  describe("normalizeNumberOfRegions()", () => {
    it("should return 0 for undefined", () => {
      const value = PricingUtils.normalizeNumber(undefined);
      expect(value).toBe(0);
    });

    it("should return 1 for '1'", () => {
      const value = PricingUtils.normalizeNumber("1");
      expect(value).toBe(1);
    });

    it("should return -1 for -1", () => {
      const value = PricingUtils.normalizeNumber(-1);
      expect(value).toBe(-1);
    });

    it("should return 0 for 0.1", () => {
      const value = PricingUtils.normalizeNumber(0.1);
      expect(value).toBe(0);
    });
  });
});
