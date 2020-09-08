import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as SharedConstants from "../../../Shared/Constants";
import * as CommonConstants from "../../../Common/Constants";
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
import { StatefulValue } from "../StatefulValue/StatefulValue";
import { ITextFieldStyles, ICheckboxStyles, IStackProps, IStackTokens } from "office-ui-fabric-react";

export const getAutoPilotV3SpendElement = (
  maxAutoPilotThroughputSet: number,
  isDatabaseThroughput: boolean
): JSX.Element => {
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
      <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank" rel="noreferrer">
        {" "}
        Learn more
      </a>
      .
    </span>
  );
};

export const getAutoPilotV2SpendElement = (
  autoPilotTier: AutopilotTier,
  isDatabaseThroughput: boolean
): JSX.Element => {
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
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank" rel="noreferrer">
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
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank" rel="noreferrer">
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
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank" rel="noreferrer">
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
          <a href={SharedConstants.AutopilotDocumentation.Url} target="_blank" rel="noreferrer">
            documentation
          </a>
          .
        </span>
      );
    default:
      return <span>Your {resource} throughput will automatically scale based on the workload needs.</span>;
  }
};

export const getEstimatedAutoscaleSpendElement = (
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean
): JSX.Element => {
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
};

export const getEstimatedSpendElement = (
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean,
  rupmEnabled: boolean
): JSX.Element => {
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
};

export const manualToAutoscaleDisclaimerElement: JSX.Element = (
  <span>
    The starting autoscale max RU/s will be determined by the system, based on the current manual throughput settings
    and storage of your resource. After autoscale has been enabled, you can change the max RU/s.{" "}
    <a href={CommonConstants.Urls.autoscaleMigration}>Learn more</a>
  </span>
);

export const ttlWarning: JSX.Element = (
  <span>
    The system will automatically delete items based on the TTL value (in seconds) you provide, without needing a delete
    operation explicitly issued by a client application. For more information see,{" "}
    <a target="_blank" href="https://aka.ms/cosmos-db-ttl" rel="noreferrer">
      Time to Live (TTL) in Azure Cosmos DB
    </a>
    .
  </span>
);

export const indexingPolicyTTLWarningMessage: JSX.Element = (
  <span>
    Changing the Indexing Policy impacts query results while the index transformation occurs. When a change is made and
    the indexing mode is set to consistent or lazy, queries return eventual results until the operation completes. For
    more information see,{" "}
    <a target="_blank" href="https://aka.ms/cosmosdb/modify-index-policy" rel="noreferrer">
      Modifying Indexing Policies
    </a>
    .
  </span>
);

export const updateThroughputBeyondLimitWarningMessage: JSX.Element = (
  <span>
    You are about to request an increase in throughput beyond the pre-allocated capacity. The service will scale out and
    increase throughput for the selected container. This operation will take 1-3 business days to complete. You can
    track the status of this request in Notifications.
  </span>
);

export const updateThroughputDelayedApplyWarningMessage: JSX.Element = (
  <span>
    You are about to request an increase in throughput beyond the pre-allocated capacity. This operation will take some
    time to complete.
  </span>
);

const getCurrentThroughput = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  targetThroughput?: number
): string => {
  if (targetThroughput) {
    if (throughput) {
      return isAutoscale
        ? `, Current autoscale throughput: ${Math.round(
            throughput / 10
          )} - ${throughput} ${throughputUnit}, Target autoscale throughput: ${Math.round(
            targetThroughput / 10
          )} - ${targetThroughput} ${throughputUnit}`
        : `, Current manual throughput: ${throughput} ${throughputUnit}, Target manual throughput: ${targetThroughput}`;
    } else {
      return isAutoscale
        ? `, Target autoscale throughput: ${Math.round(targetThroughput / 10)} - ${targetThroughput} ${throughputUnit}`
        : `, Target manual throughput: ${targetThroughput} ${throughputUnit}`;
    }
  }

  if (!targetThroughput && throughput) {
    return isAutoscale
      ? `, Current autoscale throughput: ${Math.round(throughput / 10)} - ${throughput} ${throughputUnit}`
      : `, Current manual throughput: ${throughput} ${throughputUnit}`;
  }

  return "";
};

export const getThroughputApplyDelayedMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  requestedThroughput: number
): JSX.Element => (
  <span>
    The request to increase the throughput has successfully been submitted. This operation will take 1-3 business days
    to complete. View the latest status in Notifications.
    <br />
    Database: {databaseName}, Container: {collectionName}{" "}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
  </span>
);

export const getThroughputApplyShortDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  targetThroughput: number
): JSX.Element => (
  <span>
    A request to increase the throughput is currently in progress. This operation will take some time to complete.
    <br />
    Database: {databaseName}, Container: {collectionName}{" "}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, targetThroughput)}
  </span>
);

export const getThroughputApplyLongDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  requestedThroughput: number
): JSX.Element => (
  <span>
    A request to increase the throughput is currently in progress. This operation will take 1-3 business days to
    complete. View the latest status in Notifications.
    <br />
    Database: {databaseName}, Container: {collectionName}{" "}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
  </span>
);

export const getToolTipContainer = (content: string | JSX.Element): JSX.Element =>
  content ? <span>{content}</span> : undefined;

export const conflictResolutionLwwTooltip: JSX.Element = (
  <span>
    Gets or sets the name of a integer property in your documents which is used for the Last Write Wins (LWW) based
    conflict resolution scheme. By default, the system uses the system defined timestamp property, _ts to decide the
    winner for the conflicting versions of the document. Specify your own integer property if you want to override the
    default timestamp based conflict resolution.
  </span>
);

export const conflictResolutionCustomToolTip: JSX.Element = (
  <span>
    Gets or sets the name of a stored procedure (aka merge procedure) for resolving the conflicts. You can write
    application defined logic to determine the winner of the conflicting versions of a document. The stored procedure
    will get executed transactionally, exactly once, on the server side. If you do not provide a stored procedure, the
    conflicts will be populated in the
    <a className="linkDarkBackground" href="https://aka.ms/dataexplorerconflics" rel="noreferrer" target="_blank">
      {` conflicts feed`}
    </a>
    . You can update/re-register the stored procedure at any time.
  </span>
);

export const changeFeedPolicyToolTip: JSX.Element = (
  <span>
    Enable change feed log retention policy to retain last 10 minutes of history for items in the container by default.
    To support this, the request unit (RU) charge for this container will be multiplied by a factor of two for writes.
    Reads are unaffected.
  </span>
);

const dirtyTextFieldColor = "#9b4f96";

export const getTextFieldStyles = (statefulValue?: StatefulValue<unknown>): Partial<ITextFieldStyles> => ({
  fieldGroup: {
    height: 25,
    width: 300,
    borderColor: `${statefulValue?.isDirty() ? dirtyTextFieldColor : ""}`,
    selectors: {
      ":disabled": {
        backgroundColor: "#ddd",
        borderColor: "#969696"
      }
    }
  }
});

export const spendAckCheckBoxStyle: ICheckboxStyles = {
  label: {
    margin: 0,
    padding: "2 0 2 0"
  },
  text: {
    fontSize: 12
  }
};

export const subComponentStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 30 }
};

export const titleAndInputStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 5 }
};

export const checkBoxAndInputStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 10 }
};

export const horizontalStackTokens: IStackTokens = {
  childrenGap: 6,
  padding: "0px 0px 5px"
};
