import * as AutoPilotUtils from "../Utils/AutoPilotUtils";
import * as Constants from "../Shared/Constants";

/**
 * Anything that is not a number should return 0
 * Otherwise, return numberOfRegions
 * @param number
 */
export function normalizeNumber(number: null | undefined | string | number): number {
  if (!number) {
    return 0;
  }
  return Math.floor(Number(number));
}

export function getRuToolTipText(): string {
  return `Set the throughput — Request Units per second (RU/s) — required for the workload. A read of a 1 KB document uses 1 RU. Select manual if you plan to scale RU/s yourself. Select autoscale to allow the system to scale RU/s based on usage.`;
}

/**
 * For anything other than a numbers or numbers <= 0, should return 0
 * Otherwise, return numberOfRegions
 * @param numberOfRegions
 */
export function getRegionMultiplier(numberOfRegions: number, multimasterEnabled: boolean): number {
  const normalizedNumberOfRegions: number = normalizeNumber(numberOfRegions);

  if (normalizedNumberOfRegions <= 0) {
    return 0;
  }

  if (numberOfRegions === 1) {
    return numberOfRegions;
  }

  if (multimasterEnabled) {
    return numberOfRegions + 1;
  }

  return numberOfRegions;
}

export function getMultimasterMultiplier(numberOfRegions: number, multimasterEnabled: boolean): number {
  const regionMultiplier: number = getRegionMultiplier(numberOfRegions, multimasterEnabled);
  const multimasterMultiplier: number = !multimasterEnabled ? 1 : regionMultiplier > 1 ? 2 : 1;

  return multimasterMultiplier;
}

export function computeRUUsagePriceHourly(
  serverId: string,
  requestUnits: number,
  numberOfRegions: number,
  multimasterEnabled: boolean
): number {
  const regionMultiplier: number = getRegionMultiplier(numberOfRegions, multimasterEnabled);
  const multimasterMultiplier: number = getMultimasterMultiplier(numberOfRegions, multimasterEnabled);
  const pricePerRu = getPricePerRu(serverId);
  const ruCharge = requestUnits * pricePerRu * multimasterMultiplier * regionMultiplier;

  return Number(ruCharge.toFixed(5));
}

export function getPriceCurrency(serverId: string): string {
  if (serverId === "mooncake") {
    return Constants.OfferPricing.HourlyPricing.mooncake.Currency;
  }

  return Constants.OfferPricing.HourlyPricing.default.Currency;
}

export function computeStorageUsagePrice(serverId: string, storageUsedRoundUpToGB: number): string {
  if (serverId === "mooncake") {
    const storageCharge = storageUsedRoundUpToGB * Constants.OfferPricing.HourlyPricing.mooncake.Standard.PricePerGB;
    return calculateEstimateNumber(storageCharge) + " " + Constants.OfferPricing.HourlyPricing.mooncake.Currency;
  }

  const storageCharge = storageUsedRoundUpToGB * Constants.OfferPricing.HourlyPricing.default.Standard.PricePerGB;
  return calculateEstimateNumber(storageCharge) + " " + Constants.OfferPricing.HourlyPricing.default.Currency;
}

export function computeDisplayUsageString(usageInKB: number): string {
  const usageInMB = usageInKB / 1024,
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
  const usageInMB = usageInKB / 1024,
    usageInGB = usageInMB / 1024;
  return Math.ceil(usageInGB);
}

export function calculateEstimateNumber(n: number): string {
  return n >= 1 ? n.toFixed(2) : n.toPrecision(2);
}

export function numberWithCommasFormatter(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function isLargerThanDefaultMinRU(ru: number): boolean {
  if (typeof ru === "number" && ru > Constants.CollectionCreation.DefaultCollectionRUs400) {
    return true;
  }
  return false;
}

export function getCurrencySign(serverId: string): string {
  if (serverId === "mooncake") {
    return Constants.OfferPricing.HourlyPricing.mooncake.CurrencySign;
  }

  return Constants.OfferPricing.HourlyPricing.default.CurrencySign;
}

export function getAutoscalePricePerRu(serverId: string, mmMultiplier: number): number {
  if (serverId === "mooncake") {
    if (mmMultiplier > 1) {
      return Constants.AutoscalePricing.HourlyPricing.mooncake.multiMaster.Standard.PricePerRU;
    } else {
      return Constants.AutoscalePricing.HourlyPricing.mooncake.singleMaster.Standard.PricePerRU;
    }
  }

  if (mmMultiplier > 1) {
    return Constants.AutoscalePricing.HourlyPricing.default.multiMaster.Standard.PricePerRU;
  } else {
    return Constants.AutoscalePricing.HourlyPricing.default.singleMaster.Standard.PricePerRU;
  }
}

export function getPricePerRu(serverId: string): number {
  if (serverId === "mooncake") {
    return Constants.OfferPricing.HourlyPricing.mooncake.Standard.PricePerRU;
  }

  return Constants.OfferPricing.HourlyPricing.default.Standard.PricePerRU;
}

export function getAutoPilotV3SpendHtml(maxAutoPilotThroughputSet: number, isDatabaseThroughput: boolean): string {
  if (!maxAutoPilotThroughputSet) {
    return "";
  }

  const resource: string = isDatabaseThroughput ? "database" : "container";
  return `Your ${resource} throughput will automatically scale from <b>${AutoPilotUtils.getMinRUsBasedOnUserInput(
    maxAutoPilotThroughputSet
  )} RU/s (10% of max RU/s) - ${maxAutoPilotThroughputSet} RU/s</b> based on usage. <br /><br />After the first ${AutoPilotUtils.getStorageBasedOnUserInput(
    maxAutoPilotThroughputSet
  )} GB of data stored, the max RU/s will be automatically upgraded based on the new storage value. <a href='${
    Constants.AutopilotDocumentation.Url
  }' target='_blank' aria-label='Learn more about autoscale throughput'>Learn more</a>.`;
}

export function computeAutoscaleUsagePriceHourly(
  serverId: string,
  requestUnits: number,
  numberOfRegions: number,
  multimasterEnabled: boolean
): number {
  const regionMultiplier: number = getRegionMultiplier(numberOfRegions, multimasterEnabled);
  const multimasterMultiplier: number = getMultimasterMultiplier(numberOfRegions, multimasterEnabled);

  const pricePerRu = getAutoscalePricePerRu(serverId, multimasterMultiplier);
  const ruCharge = requestUnits * pricePerRu * multimasterMultiplier * regionMultiplier;

  return Number(ruCharge.toFixed(5));
}

export function getEstimatedAutoscaleSpendHtml(
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean
): string {
  const hourlyPrice: number = computeAutoscaleUsagePriceHourly(serverId, throughput, regions, multimaster);
  const monthlyPrice: number = hourlyPrice * Constants.hoursInAMonth;
  const currency: string = getPriceCurrency(serverId);
  const currencySign: string = getCurrencySign(serverId);
  const pricePerRu =
    getAutoscalePricePerRu(serverId, getMultimasterMultiplier(regions, multimaster)) *
    getMultimasterMultiplier(regions, multimaster);

  return (
    `Estimated monthly cost (${currency}): <b>` +
    `${currencySign}${calculateEstimateNumber(monthlyPrice / 10)} - ` +
    `${currencySign}${calculateEstimateNumber(monthlyPrice)} </b> ` +
    `(${regions} ${regions === 1 ? "region" : "regions"}, ${
      throughput / 10
    } - ${throughput} RU/s, ${currencySign}${pricePerRu}/RU)`
  );
}

export function getEstimatedSpendHtml(
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean
): string {
  const hourlyPrice: number = computeRUUsagePriceHourly(serverId, throughput, regions, multimaster);
  const dailyPrice: number = hourlyPrice * 24;
  const monthlyPrice: number = hourlyPrice * Constants.hoursInAMonth;
  const currency: string = getPriceCurrency(serverId);
  const currencySign: string = getCurrencySign(serverId);
  const pricePerRu = getPricePerRu(serverId) * getMultimasterMultiplier(regions, multimaster);

  return (
    `Estimated cost (${currency}): <b>` +
    `${currencySign}${calculateEstimateNumber(hourlyPrice)} hourly / ` +
    `${currencySign}${calculateEstimateNumber(dailyPrice)} daily / ` +
    `${currencySign}${calculateEstimateNumber(monthlyPrice)} monthly </b> ` +
    `(${regions} ${regions === 1 ? "region" : "regions"}, ${throughput}RU/s, ${currencySign}${pricePerRu}/RU)`
  );
}

export function getEstimatedSpendAcknowledgeString(
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean,
  isAutoscale: boolean
): string {
  const hourlyPrice: number = isAutoscale
    ? computeAutoscaleUsagePriceHourly(serverId, throughput, regions, multimaster)
    : computeRUUsagePriceHourly(serverId, throughput, regions, multimaster);
  const dailyPrice: number = hourlyPrice * 24;
  const monthlyPrice: number = hourlyPrice * Constants.hoursInAMonth;
  const currencySign: string = getCurrencySign(serverId);
  return !isAutoscale
    ? `I acknowledge the estimated ${currencySign}${calculateEstimateNumber(
        dailyPrice
      )} daily cost for the throughput above.`
    : `I acknowledge the estimated ${currencySign}${calculateEstimateNumber(
        monthlyPrice / 10
      )} - ${currencySign}${calculateEstimateNumber(monthlyPrice)} monthly cost for the throughput above.`;
}

export function getUpsellMessage(serverId = "default", isFreeTier = false): string {
  if (isFreeTier) {
    return "With free tier discount, you'll get the first 400 RU/s and 5 GB of storage in this account for free. Charges will apply if your resource throughput exceeds 400 RU/s.";
  } else {
    let price: number = Constants.OfferPricing.MonthlyPricing.default.Standard.StartingPrice;

    if (serverId === "mooncake") {
      price = Constants.OfferPricing.MonthlyPricing.mooncake.Standard.StartingPrice;
    }

    return `Start at ${getCurrencySign(serverId)}${price}/mo per database, multiple containers included`;
  }
}
