import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as SharedConstants from "../../../Shared/Constants";
import * as CommonConstants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import { AutopilotTier } from "../../../Contracts/DataModels";
import {
  computeAutoscaleUsagePriceHourly,
  getPriceCurrency,
  getCurrencySign,
  getAutoscalePricePerRu,
  getMultimasterMultiplier,
  computeRUUsagePriceHourly,
  getPricePerRu,
  calculateEstimateNumber
} from "../../../Utils/PricingUtils";

/*
Class used to track baseline and current values of a state object. If both the values differ,
isDirty is set to true. The isDirty value is used to change css of the component and to govern logic
around whether the current value should be persistently saved or not.
*/
export type StatefulValuesType = boolean | string | number | DataModels.IndexingPolicy;

export interface StatefulValue<StatefulValuesType> {
  baseline: StatefulValuesType;
  current: StatefulValuesType;
  isValid: boolean;
}

const getStringValue = (value: StatefulValuesType): string => {
  const type = typeof value;
  switch (type) {
    case "string":
    case "undefined":
    case "number":
    case "boolean":
      return value?.toString();

    default:
      return JSON.stringify(value);
  }
};

export function isDirty(value: StatefulValue<StatefulValuesType>): boolean {
  const current = getStringValue(value.current);
  const baseline = getStringValue(value.baseline);

  if (current !== baseline) {
    return true;
  }

  return false;
}

export function getAutoPilotV3SpendElement(
  maxAutoPilotThroughputSet: number,
  isDatabaseThroughput: boolean
): JSX.Element {
  if (!maxAutoPilotThroughputSet) {
    return <></>;
  }

  const resource: string = isDatabaseThroughput ? "database" : "container";
  return (
    <span>
      Your {resource} throughput will automatically scale from{" "}
      <b>
        {AutoPilotUtils.getMinRUsBasedOnUserInput(maxAutoPilotThroughputSet)} RU/s (10% of max RU/s) -{" "}
        {maxAutoPilotThroughputSet} RU/s
      </b>{" "}
      based on usage. <br />
      <br />
      After the first {AutoPilotUtils.getStorageBasedOnUserInput(maxAutoPilotThroughputSet)} GB of data stored, the max
      RU/s will be automatically upgraded based on the new storage value.
      <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank">
        {" "}
        Learn more
      </a>
      .
    </span>
  );
}

export function getAutoPilotV2SpendElement(autoPilotTier: AutopilotTier, isDatabaseThroughput: boolean): JSX.Element {
  if (!autoPilotTier) {
    return <></>;
  }

  const resource: string = isDatabaseThroughput ? "database" : "container";
  switch (autoPilotTier) {
    case AutopilotTier.Tier1:
      return (
        <span>
          Your {resource} throughput will automatically scale between 400 RU/s and 4,000 RU/s based on the workload
          needs, as long as your storage does not exceed 50GB. If your storage exceeds 50GB, we will upgrade the maximum
          (and minimum) throughput thresholds to the next available value. For more details, see{" "}
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank">
            documentation
          </a>
          .
        </span>
      );
    case AutopilotTier.Tier2:
      return (
        <span>
          Your {resource} throughput will automatically scale between 2,000 RU/s and 20,000 RU/s based on the workload
          needs, as long as your storage does not exceed 200GB. If your storage exceeds 200GB, we will upgrade the
          maximum (and minimum) throughput thresholds to the next available value. For more details, see{" "}
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank">
            documentation
          </a>
          .
        </span>
      );
    case AutopilotTier.Tier3:
      return (
        <span>
          Your {resource} throughput will automatically scale between 10,000 RU/s and 100,000 RU/s based on the workload
          needs, as long as your storage does not exceed 1TB. If your storage exceeds 1TB, we will upgrade the maximum
          (and minimum) throughput thresholds to the next available value. For more details, see{" "}
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank">
            documentation
          </a>
          .
        </span>
      );
    case AutopilotTier.Tier4:
      return (
        <span>
          Your {resource} throughput will automatically scale between 50,000 RU/s and 500,000 RU/s based on the workload
          needs, as long as your storage does not exceed 5TB. If your storage exceeds 5TB, we will upgrade the maximum
          (and minimum) throughput thresholds to the next available value. For more details, see{" "}
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank">
            documentation
          </a>
          .
        </span>
      );
    default:
      return <span>Your {resource} throughput will automatically scale based on the workload needs.</span>;
  }
}

export function getEstimatedAutoscaleSpendElement(
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean
): JSX.Element {
  const hourlyPrice: number = computeAutoscaleUsagePriceHourly(serverId, throughput, regions, multimaster);
  const monthlyPrice: number = hourlyPrice * SharedConstants.hoursInAMonth;
  const currency: string = getPriceCurrency(serverId);
  const currencySign: string = getCurrencySign(serverId);
  const pricePerRu =
    getAutoscalePricePerRu(serverId, getMultimasterMultiplier(regions, multimaster)) *
    getMultimasterMultiplier(regions, multimaster);

  return (
    <span>
      Estimated monthly cost ({currency}):{" "}
      <b>
        {currencySign}
        {calculateEstimateNumber(monthlyPrice / 10)}
        {` - `}
        {currencySign}
        {calculateEstimateNumber(monthlyPrice)}{" "}
      </b>
      ({regions} {regions === 1 ? "region" : "regions"}, {throughput / 10} - {throughput} RU/s, {currencySign}
      {pricePerRu}/RU)
    </span>
  );
}

export function getEstimatedSpendElement(
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean,
  rupmEnabled: boolean
): JSX.Element {
  const hourlyPrice: number = computeRUUsagePriceHourly(serverId, rupmEnabled, throughput, regions, multimaster);
  const dailyPrice: number = hourlyPrice * 24;
  const monthlyPrice: number = hourlyPrice * SharedConstants.hoursInAMonth;
  const currency: string = getPriceCurrency(serverId);
  const currencySign: string = getCurrencySign(serverId);
  const pricePerRu = getPricePerRu(serverId) * getMultimasterMultiplier(regions, multimaster);

  return (
    <span>
      Estimated cost ({currency}):{" "}
      <b>
        {currencySign}
        {calculateEstimateNumber(hourlyPrice)} hourly {` / `}
        {currencySign}
        {calculateEstimateNumber(dailyPrice)} daily {` / `}
        {currencySign}
        {calculateEstimateNumber(monthlyPrice)} monthly{" "}
      </b>
      ({regions} {regions === 1 ? "region" : "regions"}, {throughput}RU/s, {currencySign}
      {pricePerRu}/RU)
    </span>
  );
}

export const manualToAutoscaleDisclaimerElement: JSX.Element = (
  <span>
    The starting autoscale max RU/s will be determined by the system, based on the current manual throughput settings
    and storage of your resource. After autoscale has been enabled, you can change the max RU/s.{" "}
    <a href={CommonConstants.Urls.autoscaleMigration}>Learn more</a>
  </span>
);
