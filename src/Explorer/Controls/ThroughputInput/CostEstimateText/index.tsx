import { Text } from "office-ui-fabric-react";
import React, { FunctionComponent } from "react";
import * as SharedConstants from "../../../../Shared/Constants";
import { userContext } from "../../../../UserContext";
import * as PricingUtils from "../../../../Utils/PricingUtils";

interface CostEstimateTextProps {
  requestUnits: number;
  isAutoscale: boolean;
}

export const CostEstimateText: FunctionComponent<CostEstimateTextProps> = ({
  requestUnits,
  isAutoscale,
}: CostEstimateTextProps) => {
  const databaseAccount = userContext.databaseAccount;
  if (!databaseAccount || !databaseAccount.properties) {
    return <></>;
  }

  const serverId: string = userContext.portalEnv;
  const numberOfRegions: number = databaseAccount.properties.readLocations?.length || 1;
  const multimasterEnabled: boolean = databaseAccount.properties.enableMultipleWriteLocations;
  const hourlyPrice: number = PricingUtils.computeRUUsagePriceHourly({
    serverId,
    requestUnits,
    numberOfRegions,
    multimasterEnabled,
    isAutoscale,
  });
  const dailyPrice: number = hourlyPrice * 24;
  const monthlyPrice: number = hourlyPrice * SharedConstants.hoursInAMonth;
  const currency: string = PricingUtils.getPriceCurrency(serverId);
  const currencySign: string = PricingUtils.getCurrencySign(serverId);
  const multiplier = PricingUtils.getMultimasterMultiplier(numberOfRegions, multimasterEnabled);
  const pricePerRu = isAutoscale
    ? PricingUtils.getAutoscalePricePerRu(serverId, multiplier) * multiplier
    : PricingUtils.getPricePerRu(serverId) * multiplier;

  if (isAutoscale) {
    return (
      <Text variant="small">
        Estimated monthly cost ({currency}):{" "}
        <b>
          {currencySign + PricingUtils.calculateEstimateNumber(monthlyPrice / 10)} -{" "}
          {currencySign + PricingUtils.calculateEstimateNumber(monthlyPrice)}{" "}
        </b>
        ({numberOfRegions + (numberOfRegions === 1 ? " region" : " regions")}, {requestUnits / 10} - {requestUnits}{" "}
        RU/s, {currencySign + pricePerRu}/RU)
      </Text>
    );
  }

  return (
    <Text variant="small">
      Cost ({currency}):{" "}
      <b>
        {currencySign + PricingUtils.calculateEstimateNumber(hourlyPrice)} hourly /{" "}
        {currencySign + PricingUtils.calculateEstimateNumber(dailyPrice)} daily /{" "}
        {currencySign + PricingUtils.calculateEstimateNumber(monthlyPrice)} monthly{" "}
      </b>
      ({numberOfRegions + (numberOfRegions === 1 ? " region" : " regions")}, {requestUnits}RU/s,{" "}
      {currencySign + pricePerRu}/RU)
      <br />
      <em>{PricingUtils.estimatedCostDisclaimer}</em>
    </Text>
  );
};
