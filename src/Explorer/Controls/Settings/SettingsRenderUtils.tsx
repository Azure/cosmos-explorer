import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import { AutopilotDocumentation, hoursInAMonth } from "../../../Shared/Constants";
import { Urls, StyleConstants } from "../../../Common/Constants";
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
import {
  ITextFieldStyles,
  ICheckboxStyles,
  IStackProps,
  IStackTokens,
  IChoiceGroupStyles,
  Link,
  Text,
  IMessageBarStyles,
  ITextStyles,
  IDetailsRowStyles,
  IStackStyles,
  IIconStyles,
  IDetailsListStyles,
  IDropdownStyles,
  ISeparatorStyles,
  MessageBar,
  MessageBarType,
  Stack,
  Spinner,
  SpinnerSize
} from "office-ui-fabric-react";
import { isDirtyTypes, isDirty } from "./SettingsUtils";

const infoAndToolTipTextStyle: ITextStyles = { root: { fontSize: 12 } };

export const noLeftPaddingCheckBoxStyle: ICheckboxStyles = {
  label: {
    margin: 0,
    padding: "2 0 2 0"
  },
  text: {
    fontSize: 12
  }
};

export const subComponentStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 20 }
};

export const titleAndInputStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 5 }
};

export const mongoWarningStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 5 }
};

export const mongoErrorMessageStyles: Partial<IMessageBarStyles> = { root: { marginLeft: 10 } };

export const createAndAddMongoIndexStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 5 }
};

export const addMongoIndexStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 10 }
};

export const checkBoxAndInputStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 10 }
};

export const toolTipLabelStackTokens: IStackTokens = {
  childrenGap: 6
};

export const accordionStackTokens: IStackTokens = {
  childrenGap: 10
};

export const addMongoIndexSubElementsTokens: IStackTokens = {
  childrenGap: 20
};

export const accordionIconStyles: IIconStyles = { root: { paddingTop: 7 } };

export const mediumWidthStackStyles: IStackStyles = { root: { width: 600 } };

export const shortWidthTextFieldStyles: Partial<ITextFieldStyles> = { root: { paddingLeft: 10, width: 210 } };

export const shortWidthDropDownStyles: Partial<IDropdownStyles> = { dropdown: { paddingleft: 10, width: 202 } };

export const transparentDetailsRowStyles: Partial<IDetailsRowStyles> = {
  root: {
    selectors: {
      ":hover": {
        background: "transparent"
      }
    }
  }
};

export const customDetailsListStyles: Partial<IDetailsListStyles> = {
  root: {
    selectors: {
      ".ms-FocusZone": {
        paddingTop: 0
      }
    }
  }
};

export const separatorStyles: Partial<ISeparatorStyles> = {
  root: [
    {
      selectors: {
        "::before": {
          background: StyleConstants.BaseMedium
        }
      }
    }
  ]
};

export const messageBarStyles: Partial<IMessageBarStyles> = { root: { marginTop: "5px" } };

export const throughputUnit = "RU/s";

export const getAutoPilotV3SpendElement = (
  maxAutoPilotThroughputSet: number,
  isDatabaseThroughput: boolean,
  requestUnitsUsageCostElement?: JSX.Element
): JSX.Element => {
  if (!maxAutoPilotThroughputSet) {
    return <></>;
  }

  const resource: string = isDatabaseThroughput ? "database" : "container";
  return (
    <>
      <Text>
        Your {resource} throughput will automatically scale from{" "}
        <b>
          {AutoPilotUtils.getMinRUsBasedOnUserInput(maxAutoPilotThroughputSet)} RU/s (10% of max RU/s) -{" "}
          {maxAutoPilotThroughputSet} RU/s
        </b>{" "}
        based on usage.
        <br />
      </Text>
      {requestUnitsUsageCostElement}
      <Text>
        After the first {AutoPilotUtils.getStorageBasedOnUserInput(maxAutoPilotThroughputSet)} GB of data stored, the
        max RU/s will be automatically upgraded based on the new storage value.
        <Link href={AutopilotDocumentation.Url} target="_blank">
          {" "}
          Learn more
        </Link>
        .
      </Text>
    </>
  );
};

export const getEstimatedAutoscaleSpendElement = (
  throughput: number,
  serverId: string,
  regions: number,
  multimaster: boolean
): JSX.Element => {
  const hourlyPrice: number = computeAutoscaleUsagePriceHourly(serverId, throughput, regions, multimaster);
  const monthlyPrice: number = hourlyPrice * hoursInAMonth;
  const currency: string = getPriceCurrency(serverId);
  const currencySign: string = getCurrencySign(serverId);
  const pricePerRu =
    getAutoscalePricePerRu(serverId, getMultimasterMultiplier(regions, multimaster)) *
    getMultimasterMultiplier(regions, multimaster);

  return (
    <Text id="autoscaleSpendElement">
      Estimated monthly cost ({currency}) is{" "}
      <b>
        {currencySign}
        {calculateEstimateNumber(monthlyPrice / 10)}
        {` - `}
        {currencySign}
        {calculateEstimateNumber(monthlyPrice)}{" "}
      </b>
      ({"regions: "} {regions}, {throughput / 10} - {throughput} RU/s, {currencySign}
      {pricePerRu}/RU)
    </Text>
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
  const monthlyPrice: number = hourlyPrice * hoursInAMonth;
  const currency: string = getPriceCurrency(serverId);
  const currencySign: string = getCurrencySign(serverId);
  const pricePerRu = getPricePerRu(serverId) * getMultimasterMultiplier(regions, multimaster);

  return (
    <Text id="throughputSpendElement">
      Estimated cost ({currency}):{" "}
      <b>
        {currencySign}
        {calculateEstimateNumber(hourlyPrice)} hourly {` / `}
        {currencySign}
        {calculateEstimateNumber(dailyPrice)} daily {` / `}
        {currencySign}
        {calculateEstimateNumber(monthlyPrice)} monthly{" "}
      </b>
      ({"regions: "} {regions}, {throughput}RU/s, {currencySign}
      {pricePerRu}/RU)
    </Text>
  );
};

export const manualToAutoscaleDisclaimerElement: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle} id="manualToAutoscaleDisclaimerElement">
    The starting autoscale max RU/s will be determined by the system, based on the current manual throughput settings
    and storage of your resource. After autoscale has been enabled, you can change the max RU/s.{" "}
    <a href={Urls.autoscaleMigration}>Learn more</a>
  </Text>
);

export const ttlWarning: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>
    The system will automatically delete items based on the TTL value (in seconds) you provide, without needing a delete
    operation explicitly issued by a client application. For more information see,{" "}
    <Link target="_blank" href="https://aka.ms/cosmos-db-ttl">
      Time to Live (TTL) in Azure Cosmos DB
    </Link>
    .
  </Text>
);

export const indexingPolicyTTLWarningMessage: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>
    Changing the Indexing Policy impacts query results while the index transformation occurs. When a change is made and
    the indexing mode is set to consistent or lazy, queries return eventual results until the operation completes. For
    more information see,{" "}
    <Link target="_blank" href="https://aka.ms/cosmosdb/modify-index-policy">
      Modifying Indexing Policies
    </Link>
    .
  </Text>
);

export const updateThroughputBeyondLimitWarningMessage: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle} id="updateThroughputBeyondLimitWarningMessage">
    You are about to request an increase in throughput beyond the pre-allocated capacity. The service will scale out and
    increase throughput for the selected container. This operation will take 1-3 business days to complete. You can
    track the status of this request in Notifications.
  </Text>
);

export const updateThroughputDelayedApplyWarningMessage: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle} id="updateThroughputDelayedApplyWarningMessage">
    You are about to request an increase in throughput beyond the pre-allocated capacity. This operation will take some
    time to complete.
  </Text>
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
  <Text styles={infoAndToolTipTextStyle}>
    The request to increase the throughput has successfully been submitted. This operation will take 1-3 business days
    to complete. View the latest status in Notifications.
    <br />
    Database: {databaseName}, Container: {collectionName}{" "}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
  </Text>
);

export const getThroughputApplyShortDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  targetThroughput: number
): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle} id="throughputApplyShortDelayMessage">
    A request to increase the throughput is currently in progress. This operation will take some time to complete.
    <br />
    Database: {databaseName}, Container: {collectionName}{" "}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, targetThroughput)}
  </Text>
);

export const getThroughputApplyLongDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  requestedThroughput: number
): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle} id="throughputApplyLongDelayMessage">
    A request to increase the throughput is currently in progress. This operation will take 1-3 business days to
    complete. View the latest status in Notifications.
    <br />
    Database: {databaseName}, Container: {collectionName}{" "}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
  </Text>
);

export const getToolTipContainer = (content: string | JSX.Element): JSX.Element =>
  content ? <Text styles={infoAndToolTipTextStyle}>{content}</Text> : undefined;

export const conflictResolutionLwwTooltip: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>
    Gets or sets the name of a integer property in your documents which is used for the Last Write Wins (LWW) based
    conflict resolution scheme. By default, the system uses the system defined timestamp property, _ts to decide the
    winner for the conflicting versions of the document. Specify your own integer property if you want to override the
    default timestamp based conflict resolution.
  </Text>
);

export const conflictResolutionCustomToolTip: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>
    Gets or sets the name of a stored procedure (aka merge procedure) for resolving the conflicts. You can write
    application defined logic to determine the winner of the conflicting versions of a document. The stored procedure
    will get executed transactionally, exactly once, on the server side. If you do not provide a stored procedure, the
    conflicts will be populated in the
    <Link className="linkDarkBackground" href="https://aka.ms/dataexplorerconflics" target="_blank">
      {` conflicts feed`}
    </Link>
    . You can update/re-register the stored procedure at any time.
  </Text>
);

export const changeFeedPolicyToolTip: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>
    Enable change feed log retention policy to retain last 10 minutes of history for items in the container by default.
    To support this, the request unit (RU) charge for this container will be multiplied by a factor of two for writes.
    Reads are unaffected.
  </Text>
);

export const mongoIndexingPolicyDisclaimer: JSX.Element = (
  <Text>
    For queries that filter on multiple properties, create multiple single field indexes instead of a compound index.
    <Link href="https://docs.microsoft.com/azure/cosmos-db/mongodb-indexing#index-types" target="_blank">
      {` Compound indexes `}
    </Link>
    are only used for sorting query results. If you need to add a compound index, you can create one using the Mongo
    shell.
  </Text>
);

export const mongoIndexingPolicyAADError: JSX.Element = (
  <MessageBar messageBarType={MessageBarType.error}>
    <Text>
      To use the indexing policy editor, please login to the
      <Link target="_blank" href="https://portal.azure.com">
        {"azure portal."}
      </Link>
    </Text>
  </MessageBar>
);

export const mongoIndexTransformationRefreshingMessage: JSX.Element = (
  <Stack horizontal {...mongoWarningStackProps}>
    <Text>Refreshing index transformation progress</Text>
    <Spinner size={SpinnerSize.medium} />
  </Stack>
);

export const renderMongoIndexTransformationRefreshMessage = (
  progress: number,
  performRefresh: () => void
): JSX.Element => {
  if (progress === 0) {
    return (
      <Text>
        {"You can make more indexing changes once the current index transformation is complete. "}
        <Link onClick={performRefresh}>{"Refresh to check if it has completed."}</Link>
      </Text>
    );
  } else {
    return (
      <Text>
        {`You can make more indexing changes once the current index transformation has completed. It is ${progress}% complete. `}
        <Link onClick={performRefresh}>{"Refresh to check the progress."}</Link>
      </Text>
    );
  }
};

export const getTextFieldStyles = (current: isDirtyTypes, baseline: isDirtyTypes): Partial<ITextFieldStyles> => ({
  fieldGroup: {
    height: 25,
    width: 300,
    borderColor: isDirty(current, baseline) ? StyleConstants.Dirty : "",
    selectors: {
      ":disabled": {
        backgroundColor: StyleConstants.BaseMedium,
        borderColor: StyleConstants.BaseMediumHigh
      }
    }
  }
});

export const getChoiceGroupStyles = (current: isDirtyTypes, baseline: isDirtyTypes): Partial<IChoiceGroupStyles> => ({
  flexContainer: [
    {
      selectors: {
        ".ms-ChoiceField-field.is-checked::before": {
          borderColor: isDirty(current, baseline) ? StyleConstants.Dirty : ""
        },
        ".ms-ChoiceField-field.is-checked::after": {
          borderColor: isDirty(current, baseline) ? StyleConstants.Dirty : ""
        },
        ".ms-ChoiceField-wrapper label": {
          whiteSpace: "nowrap",
          fontSize: 14,
          fontFamily: StyleConstants.DataExplorerFont,
          padding: "2px 5px"
        }
      }
    }
  ]
});
