import * as Constants from "./Constants";

export function computeRUUsagePrice(serverId: string, requestUnits: number): string {
  if (serverId === "mooncake") {
    let ruCharge = requestUnits * Constants.OfferPricing.HourlyPricing.mooncake.Standard.PricePerRU;
    return calculateEstimateNumber(ruCharge) + " " + Constants.OfferPricing.HourlyPricing.mooncake.Currency;
  }

  let ruCharge = requestUnits * Constants.OfferPricing.HourlyPricing.default.Standard.PricePerRU;
  return calculateEstimateNumber(ruCharge) + " " + Constants.OfferPricing.HourlyPricing.default.Currency;
}

export function computeStorageUsagePrice(serverId: string, storageUsedRoundUpToGB: number): string {
  if (serverId === "mooncake") {
    let storageCharge = storageUsedRoundUpToGB * Constants.OfferPricing.HourlyPricing.mooncake.Standard.PricePerGB;
    return calculateEstimateNumber(storageCharge) + " " + Constants.OfferPricing.HourlyPricing.mooncake.Currency;
  }

  let storageCharge = storageUsedRoundUpToGB * Constants.OfferPricing.HourlyPricing.default.Standard.PricePerGB;
  return calculateEstimateNumber(storageCharge) + " " + Constants.OfferPricing.HourlyPricing.default.Currency;
}

export function computeDisplayUsageString(usageInKB: number): string {
  let usageInMB = usageInKB / 1024,
    usageInGB = usageInMB / 1024,
    displayUsageString =
      usageInGB > 0.1
        ? usageInGB.toFixed(2) + " GB"
        : usageInMB > 0.1
        ? usageInMB.toFixed(2) + " MB"
        : usageInKB.toFixed(2) + " KB";
  return displayUsageString;
}

export function usageInGB(usageInKB: number): number {
  let usageInMB = usageInKB / 1024,
    usageInGB = usageInMB / 1024;
  return Math.ceil(usageInGB);
}

function calculateEstimateNumber(n: number): string {
  return n >= 1 ? n.toFixed(2) : n.toPrecision(2);
}
