import * as Constants from "./Constants";

export function computeRUUsagePrice(serverId: string, rupmEnabled: boolean, requestUnits: number): string {
  if (serverId === "mooncake") {
    let ruCharge = requestUnits * Constants.OfferPricing.HourlyPricing.mooncake.Standard.PricePerRU,
      rupmCharge = rupmEnabled ? requestUnits * Constants.OfferPricing.HourlyPricing.mooncake.Standard.PricePerRUPM : 0;
    return (
      calculateEstimateNumber(ruCharge + rupmCharge) + " " + Constants.OfferPricing.HourlyPricing.mooncake.Currency
    );
  }

  let ruCharge = requestUnits * Constants.OfferPricing.HourlyPricing.default.Standard.PricePerRU,
    rupmCharge = rupmEnabled ? requestUnits * Constants.OfferPricing.HourlyPricing.default.Standard.PricePerRUPM : 0;
  return calculateEstimateNumber(ruCharge + rupmCharge) + " " + Constants.OfferPricing.HourlyPricing.default.Currency;
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
