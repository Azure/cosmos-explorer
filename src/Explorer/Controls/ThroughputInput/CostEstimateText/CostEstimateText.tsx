import { Stack, Text } from "@fluentui/react";
import React, { FunctionComponent } from "react";
import { InfoTooltip } from "../../../../Common/Tooltip/InfoTooltip";
import * as SharedConstants from "../../../../Shared/Constants";
import { userContext } from "../../../../UserContext";
import {
  calculateEstimateNumber,
  computeRUUsagePriceHourly,
  estimatedCostDisclaimer,
  getAutoscalePricePerRu,
  getCurrencySign,
  getMultimasterMultiplier,
  getPriceCurrency,
  getPricePerRu,
} from "../../../../Utils/PricingUtils";

interface CostEstimateTextProps {
  requestUnits: number;
  isAutoscale: boolean;
}

export const CostEstimateText: FunctionComponent<CostEstimateTextProps> = ({
  requestUnits,
  isAutoscale,
}: CostEstimateTextProps) => {
  const { databaseAccount } = userContext;
  if (!databaseAccount?.properties) {
    return <></>;
  }

  const serverId: string = userContext.portalEnv;
  const numberOfRegions: number = databaseAccount.properties.readLocations?.length || 1;
  const multimasterEnabled: boolean = databaseAccount.properties.enableMultipleWriteLocations;
  const hourlyPrice: number = computeRUUsagePriceHourly({
    serverId,
    requestUnits,
    numberOfRegions,
    multimasterEnabled,
    isAutoscale,
  });
  const dailyPrice: number = hourlyPrice * 24;
  const monthlyPrice: number = hourlyPrice * SharedConstants.hoursInAMonth;
  const currency: string = getPriceCurrency(serverId);
  const currencySign: string = getCurrencySign(serverId);
  const multiplier = getMultimasterMultiplier(numberOfRegions, multimasterEnabled);
  const pricePerRu = isAutoscale ? getAutoscalePricePerRu(serverId, multiplier) : getPricePerRu(serverId, multiplier);
  const estimatedMonthlyCost = "Estimated monthly cost";

  const iconWithEstimatedCostDisclaimer: JSX.Element = (
    <InfoTooltip ariaLabelForTooltip={`${estimatedMonthlyCost} ${currency} ${estimatedCostDisclaimer}`}>
      {estimatedCostDisclaimer}
    </InfoTooltip>
  );

  if (isAutoscale) {
    return (
      <Stack style={{ marginBottom: 6, color: "var(--colorNeutralForeground1)" }}>
        <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
          {estimatedMonthlyCost} ({currency}){iconWithEstimatedCostDisclaimer}:{" "}
          <b>
            {currencySign + calculateEstimateNumber(monthlyPrice / 10)} -{" "}
            {currencySign + calculateEstimateNumber(monthlyPrice)}{" "}
          </b>
          ({numberOfRegions + (numberOfRegions === 1 ? " region" : " regions")}, {requestUnits / 10} - {requestUnits}{" "}
          RU/s, {currencySign + pricePerRu}/RU)
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ marginBottom: 8 }}>
      <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
        Estimated cost ({currency}){iconWithEstimatedCostDisclaimer}:{" "}
        <b>
          {currencySign + calculateEstimateNumber(hourlyPrice)} hourly /{" "}
          {currencySign + calculateEstimateNumber(dailyPrice)} daily /{" "}
          {currencySign + calculateEstimateNumber(monthlyPrice)} monthly{" "}
        </b>
        ({numberOfRegions + (numberOfRegions === 1 ? " region" : " regions")}, {requestUnits}RU/s,{" "}
        {currencySign + pricePerRu}/RU)
      </Text>
    </Stack>
  );
};
