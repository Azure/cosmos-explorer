import * as AutoPilotUtils from "../Utils/AutoPilotUtils";
import * as Constants from "../Shared/Constants";
import { AutopilotTier } from "../Contracts/DataModels";

/**
 * Anything that is not a number should return 0
 * Otherwise, return numberOfRegions
 * @param number
 */
export function normalizeNumber(number: any): number {
  const normalizedNumber: number = number === null ? 0 : isNaN(number) ? 0 : parseInt(number);

  return normalizedNumber;
}

export function getRuToolTipText(isV2AutoPilot: boolean): string {
  if (isV2AutoPilot) {
    return "Provisioned throughput is measured in Request Units per second (RU/s). 1 RU corresponds to the throughput of a read of a 1 KB document.";
  }
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
  rupmEnabled: boolean,
  requestUnits: number,
  numberOfRegions: number,
  multimasterEnabled: boolean
): number {
  const regionMultiplier: number = getRegionMultiplier(numberOfRegions, multimasterEnabled);
  const multimasterMultiplier: number = getMultimasterMultiplier(numberOfRegions, multimasterEnabled);

  const pricePerRu = getPricePerRu(serverId);
  const pricePerRuPm = getPricePerRuPm(serverId);

  const ruCharge = requestUnits * pricePerRu * multimasterMultiplier * regionMultiplier;
  const rupmCharge = rupmEnabled ? requestUnits * pricePerRuPm : 0;

  return Number((ruCharge + rupmCharge).toFixed(5));
}

export function getPriceCurrency(serverId: string): string {
  if (serverId === "mooncake") {
    return Constants.OfferPricing.HourlyPricing.mooncake.Currency;
  }

  return Constants.OfferPricing.HourlyPricing.default.Currency;
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

export function calculateEstimateNumber(n: number): string {
  return n >= 1 ? n.toFixed(2) : n.toPrecision(2);
}

export function numberWithCommasFormatter(n: number) {
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

export function getPricePerRuPm(serverId: string): number {
  if (serverId === "mooncake") {
    return Constants.OfferPricing.HourlyPricing.mooncake.Standard.PricePerRUPM;
  }

  return Constants.OfferPricing.HourlyPricing.default.Standard.PricePerRUPM;
}

export function getAutoPilotV2SpendHtml(autoPilotTier: AutopilotTier, isDatabaseThroughput: boolean): string {
  if (!autoPilotTier) {
    return "";
  }

  const resource: string = isDatabaseThroughput ? "database" : "container";
  switch (autoPilotTier) {
    case AutopilotTier.Tier1:
      return `Your ${resource} throughput will automatically scale between 400 RU/s and 4,000 RU/s based on the workload needs, as long as your storage does not exceed 50GB. If your storage exceeds 50GB, we will upgrade the maximum (and minimum) throughput thresholds to the next available value. For more details, see <a href='${Constants.AutopilotDocumentation.Url}' target='_blank'>documentation</a>.`;
    case AutopilotTier.Tier2:
      return `Your ${resource} throughput will automatically scale between 2,000 RU/s and 20,000 RU/s based on the workload needs, as long as your storage does not exceed 200GB. If your storage exceeds 200GB, we will upgrade the maximum (and minimum) throughput thresholds to the next available value. For more details, see <a href='${Constants.AutopilotDocumentation.Url}' target='_blank'>documentation</a>.`;
    case AutopilotTier.Tier3:
      return `Your ${resource} throughput will automatically scale between 10,000 RU/s and 100,000 RU/s based on the workload needs, as long as your storage does not exceed 1TB. If your storage exceeds 1TB, we will upgrade the maximum (and minimum) throughput thresholds to the next available value. For more details, see <a href='${Constants.AutopilotDocumentation.Url}' target='_blank'>documentation</a>.`;
    case AutopilotTier.Tier4:
      return `Your ${resource} throughput will automatically scale between 50,000 RU/s and 500,000 RU/s based on the workload needs, as long as your storage does not exceed 5TB. If your storage exceeds 5TB, we will upgrade the maximum (and minimum) throughput thresholds to the next available value. For more details, see <a href='${Constants.AutopilotDocumentation.Url}' target='_blank'>documentation</a>.`;
    default:
      return `Your ${resource} throughput will automatically scale based on the workload needs.`;
  }
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
  }' target='_blank'>Learn more</a>.`;
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
    `(${regions} ${regions === 1 ? "region" : "regions"}, ${throughput /
      10} - ${throughput} RU/s, ${currencySign}${pricePerRu}/RU)`
  );
}

export function getEstimatedSpendHtml(
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean,
  rupmEnabled: boolean
): string {
  const hourlyPrice: number = computeRUUsagePriceHourly(serverId, rupmEnabled, throughput, regions, multimaster);
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
  rupmEnabled: boolean,
  isAutoscale: boolean
): string {
  const hourlyPrice: number = isAutoscale
    ? computeAutoscaleUsagePriceHourly(serverId, throughput, regions, multimaster)
    : computeRUUsagePriceHourly(serverId, rupmEnabled, throughput, regions, multimaster);
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

export function getUpsellMessage(serverId: string = "default", isFreeTier: boolean = false): string {
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
