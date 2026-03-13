import {
  DetailsRow,
  ICheckboxStyles,
  IChoiceGroupStyles,
  IDetailsColumnStyles,
  IDetailsListStyles,
  IDetailsRowProps,
  IDetailsRowStyles,
  IDropdownStyles,
  IMessageBarStyles,
  ISeparatorStyles,
  IStackProps,
  IStackStyles,
  IStackTokens,
  ITextFieldStyles,
  ITextStyles,
  Link,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from "@fluentui/react";
import { Keys, t } from "Localization";
import * as React from "react";
import { Urls } from "../../../Common/Constants";
import { StyleConstants } from "../../../Common/StyleConstants";
import { hoursInAMonth } from "../../../Shared/Constants";
import {
  computeRUUsagePriceHourly,
  estimatedCostDisclaimer,
  getAutoscalePricePerRu,
  getCurrencySign,
  getMultimasterMultiplier,
  getPriceCurrency,
  getPricePerRu,
} from "../../../Utils/PricingUtils";
import { isDirty, isDirtyTypes } from "./SettingsUtils";

export interface EstimatedSpendingDisplayProps {
  costType: JSX.Element;
}

export interface ManualEstimatedSpendingDisplayProps extends EstimatedSpendingDisplayProps {
  hourly: JSX.Element;
  daily: JSX.Element;
  monthly: JSX.Element;
}

export interface AutoscaleEstimatedSpendingDisplayProps extends EstimatedSpendingDisplayProps {
  minPerMonth: JSX.Element;
  maxPerMonth: JSX.Element;
}

export interface PriceBreakdown {
  hourlyPrice: number;
  dailyPrice: number;
  monthlyPrice: number;
  pricePerRu: number;
  currency: string;
  currencySign: string;
}

export type editorType = "indexPolicy" | "computedProperties" | "dataMasking";

export const infoAndToolTipTextStyle: ITextStyles = { root: { fontSize: 14, color: "var(--colorNeutralForeground1)" } };

export const noLeftPaddingCheckBoxStyle: ICheckboxStyles = {
  label: {
    margin: 0,
    padding: "2 0 2 0",
  },
  text: {
    fontSize: 12,
  },
};

export const subComponentStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 20 },
};

export const titleAndInputStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 5 },
};

export const mongoWarningStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 5 },
};

export const mongoErrorMessageStyles: Partial<IMessageBarStyles> = { root: { marginLeft: 10 } };

export const createAndAddMongoIndexStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 5 },
};

export const addMongoIndexStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 10 },
};

export const checkBoxAndInputStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 10 },
};

export const relaxedSpacingStackProps: Partial<IStackProps> = {
  tokens: { childrenGap: 20 },
};

export const toolTipLabelStackTokens: IStackTokens = {
  childrenGap: 6,
};

export const accordionStackTokens: IStackTokens = {
  childrenGap: 10,
};

export const addMongoIndexSubElementsTokens: IStackTokens = {
  childrenGap: 20,
};

export const mediumWidthStackStyles: IStackStyles = { root: { width: 600 } };

export const shortWidthTextFieldStyles: Partial<ITextFieldStyles> = {
  root: { paddingLeft: 10, width: 210 },
  fieldGroup: {
    backgroundColor: "var(--colorNeutralBackground2)",
    borderColor: "var(--colorNeutralStroke1)",
  },
  field: {
    color: "var(--colorNeutralForeground1)",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
};

export const shortWidthDropDownStyles: Partial<IDropdownStyles> = {
  dropdown: { paddingLeft: 10, width: 202 },
  title: {
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground1)",
    borderColor: "var(--colorNeutralStroke1)",
  },
  caretDown: {
    color: "var(--colorNeutralForeground1)",
  },
  callout: {
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  dropdownItems: {
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  dropdownItem: {
    backgroundColor: "transparent",
    color: "var(--colorNeutralForeground1)",
    selectors: {
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "var(--colorNeutralForeground1)",
      },
      "&:focus": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "var(--colorNeutralForeground1)",
    selectors: {
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  dropdownOptionText: {
    color: "var(--colorNeutralForeground1)",
  },
};

export const transparentDetailsRowStyles: Partial<IDetailsRowStyles> = {
  root: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    selectors: {
      ":hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },
      ":hover .ms-DetailsRow-cell": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },
      "&.ms-DetailsRow": {
        backgroundColor: "var(--colorNeutralBackground1)",
      },
    },
  },
  cell: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    selectors: {
      ":hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
};

export const transparentDetailsHeaderStyle: Partial<IDetailsColumnStyles> = {
  root: {
    color: "var(--colorNeutralForeground1)",
    selectors: {
      ":hover": {
        background: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
};

export const customDetailsListStyles: Partial<IDetailsListStyles> = {
  root: {
    selectors: {
      ".ms-FocusZone": {
        paddingTop: 0,
      },
      ".ms-DetailsHeader": {
        backgroundColor: "var(--colorNeutralBackground1)",
      },
      ".ms-DetailsHeader-cell": {
        color: "var(--colorNeutralForeground1)",
        backgroundColor: "var(--colorNeutralBackground1)",
        selectors: {
          ":hover": {
            backgroundColor: "var(--colorNeutralBackground1Hover)",
            color: "var(--colorNeutralForeground1)",
          },
        },
      },
      ".ms-DetailsHeader-cellTitle": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-DetailsRow": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-DetailsRow-cell": {
        color: "var(--colorNeutralForeground1)",
      },
      // Tooltip styling for cells
      ".ms-TooltipHost": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-DetailsRow-cell .ms-TooltipHost": {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
};

export const separatorStyles: Partial<ISeparatorStyles> = {
  root: [
    {
      selectors: {
        "::before": {
          background: StyleConstants.BaseMedium,
        },
      },
    },
  ],
};

export const messageBarStyles: Partial<IMessageBarStyles> = {
  root: {
    marginTop: "5px",
    backgroundColor: "var(--colorNeutralBackground1)",
    selectors: {
      "&.ms-MessageBar--severeWarning": {
        backgroundColor: "var(--colorNeutralBackground4)",
      },
      "&.ms-MessageBar--warning": {
        backgroundColor: "var(--colorNeutralBackground3)",
      },
    },
  },
  text: { fontSize: 14 },
};

export const unsavedEditorMessageBarStyles: Partial<IMessageBarStyles> = {
  root: {
    marginTop: "5px",
    padding: "8px 12px",
  },
  text: { fontSize: 14 },
};

export const throughputUnit = "RU/s";

export function onRenderRow(props: IDetailsRowProps): JSX.Element {
  return <DetailsRow {...props} styles={transparentDetailsRowStyles} />;
}

export const getRuPriceBreakdown = (
  throughput: number,
  serverId: string,
  numberOfRegions: number,
  isMultimaster: boolean,
  isAutoscale: boolean,
): PriceBreakdown => {
  const hourlyPrice: number = computeRUUsagePriceHourly({
    serverId: serverId,
    requestUnits: throughput,
    numberOfRegions: numberOfRegions,
    multimasterEnabled: isMultimaster,
    isAutoscale: isAutoscale,
  });
  const multimasterMultiplier = getMultimasterMultiplier(numberOfRegions, isMultimaster);
  const pricePerRu: number = isAutoscale
    ? getAutoscalePricePerRu(serverId, multimasterMultiplier)
    : getPricePerRu(serverId, multimasterMultiplier);
  return {
    hourlyPrice,
    dailyPrice: hourlyPrice * 24,
    monthlyPrice: hourlyPrice * hoursInAMonth,
    pricePerRu,
    currency: getPriceCurrency(serverId),
    currencySign: getCurrencySign(serverId),
  };
};

export const getEstimatedSpendingElement = (
  costElement: JSX.Element,
  throughput: number,
  numberOfRegions: number,
  priceBreakdown: PriceBreakdown,
  isAutoscale: boolean,
): JSX.Element => {
  const ruRange: string = isAutoscale ? throughput / 10 + " RU/s - " : "";
  return (
    <Stack>
      <Text style={{ fontWeight: 600, color: "var(--colorNeutralForeground1)" }}>
        {t(Keys.controls.settings.costEstimate.title)}
      </Text>
      {costElement}
      <Text style={{ fontWeight: 600, marginTop: 15, color: "var(--colorNeutralForeground1)" }}>
        {t(Keys.controls.settings.costEstimate.howWeCalculate)}
      </Text>
      <Stack id="throughputSpendElement" style={{ marginTop: 5 }}>
        <span>
          {numberOfRegions} region{numberOfRegions > 1 && <span>s</span>}
        </span>
        <span>
          {ruRange}
          {throughput} RU/s
        </span>
        <span>
          {priceBreakdown.currencySign}
          {priceBreakdown.pricePerRu}
          {t(Keys.controls.settings.costEstimate.perRu)}
        </span>
      </Stack>
      <Text style={{ marginTop: 15, color: "var(--colorNeutralForeground1)" }}>
        <em>*{estimatedCostDisclaimer}</em>
      </Text>
    </Stack>
  );
};

export const manualToAutoscaleDisclaimerElement: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle} id="manualToAutoscaleDisclaimerElement">
    {t(Keys.controls.settings.throughput.manualToAutoscaleDisclaimer)}{" "}
    <Link href={Urls.autoscaleMigration}>{t(Keys.common.learnMore)}</Link>
  </Text>
);

export const ttlWarning: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>
    {t(Keys.controls.settings.throughput.ttlWarningText)}{" "}
    <Link target="_blank" href="https://aka.ms/cosmos-db-ttl">
      {t(Keys.controls.settings.throughput.ttlWarningLinkText)}
    </Link>
    .
  </Text>
);

export const unsavedEditorWarningMessage = (editor: editorType): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle}>
    {t(Keys.controls.settings.throughput.unsavedEditorWarningPrefix)}{" "}
    {editor === "indexPolicy"
      ? t(Keys.controls.settings.throughput.unsavedIndexingPolicy)
      : editor === "dataMasking"
      ? t(Keys.controls.settings.throughput.unsavedDataMaskingPolicy)
      : t(Keys.controls.settings.throughput.unsavedComputedProperties)}
    {t(Keys.controls.settings.throughput.unsavedEditorWarningSuffix)}
  </Text>
);

export const updateThroughputDelayedApplyWarningMessage: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle} id="updateThroughputDelayedApplyWarningMessage">
    {t(Keys.controls.settings.throughput.updateDelayedApplyWarning)}
  </Text>
);

export const getUpdateThroughputBeyondInstantLimitMessage = (instantMaximumThroughput: number): JSX.Element => {
  return (
    <Text id="updateThroughputDelayedApplyWarningMessage">
      {t(Keys.controls.settings.throughput.scalingUpDelayMessage, {
        instantMaximumThroughput: String(instantMaximumThroughput),
      })}
    </Text>
  );
};

export const getUpdateThroughputBeyondSupportLimitMessage = (
  instantMaximumThroughput: number,
  maximumThroughput: number,
): JSX.Element => {
  return (
    <>
      <Text styles={infoAndToolTipTextStyle} id="updateThroughputDelayedApplyWarningMessage">
        {t(Keys.controls.settings.throughput.exceedPreAllocatedMessage)}
      </Text>
      <ol style={{ fontSize: 14, color: "var(--colorNeutralForeground1)", marginTop: "5px" }}>
        <li>
          {t(Keys.controls.settings.throughput.instantScaleOption, {
            instantMaximumThroughput: String(instantMaximumThroughput),
          })}
        </li>
        {instantMaximumThroughput < maximumThroughput && (
          <li>
            {t(Keys.controls.settings.throughput.asyncScaleOption, { maximumThroughput: String(maximumThroughput) })}
          </li>
        )}
        <li>
          {t(Keys.controls.settings.throughput.quotaMaxOption, { maximumThroughput: String(maximumThroughput) })}
          <Link
            href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/create-support-request-quota-increase"
            target="_blank"
          >
            {t(Keys.common.learnMore)}
          </Link>
        </li>
      </ol>
    </>
  );
};

export const getUpdateThroughputBelowMinimumMessage = (minimum: number): JSX.Element => {
  return (
    <Text styles={infoAndToolTipTextStyle}>
      {t(Keys.controls.settings.throughput.belowMinimumMessage, { minimum: String(minimum) })}
      <Link
        href="https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits#minimum-throughput-limits"
        target="_blank"
      >
        {t(Keys.common.learnMore)}
      </Link>
    </Text>
  );
};

export const saveThroughputWarningMessage: JSX.Element = (
  <Text>{t(Keys.controls.settings.throughput.saveThroughputWarning)}</Text>
);

const getCurrentThroughput = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  targetThroughput?: number,
): string => {
  if (targetThroughput) {
    if (throughput) {
      return isAutoscale
        ? `, ${t(Keys.controls.settings.throughput.currentAutoscaleThroughput)} ${Math.round(
            throughput / 10,
          )} - ${throughput} ${throughputUnit}, ${t(
            Keys.controls.settings.throughput.targetAutoscaleThroughput,
          )} ${Math.round(targetThroughput / 10)} - ${targetThroughput} ${throughputUnit}`
        : `, ${t(Keys.controls.settings.throughput.currentManualThroughput)} ${throughput} ${throughputUnit}, ${t(
            Keys.controls.settings.throughput.targetManualThroughput,
          )} ${targetThroughput}`;
    } else {
      return isAutoscale
        ? `, ${t(Keys.controls.settings.throughput.targetAutoscaleThroughput)} ${Math.round(
            targetThroughput / 10,
          )} - ${targetThroughput} ${throughputUnit}`
        : `, ${t(Keys.controls.settings.throughput.targetManualThroughput)} ${targetThroughput} ${throughputUnit}`;
    }
  }

  if (!targetThroughput && throughput) {
    return isAutoscale
      ? `, ${t(Keys.controls.settings.throughput.currentAutoscaleThroughput)} ${Math.round(
          throughput / 10,
        )} - ${throughput} ${throughputUnit}`
      : `, ${t(Keys.controls.settings.throughput.currentManualThroughput)} ${throughput} ${throughputUnit}`;
  }

  return "";
};

export const getThroughputApplyDelayedMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  requestedThroughput: number,
): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle}>
    {t(Keys.controls.settings.throughput.applyDelayedMessage)}
    <br />
    {t(Keys.controls.settings.throughput.databaseLabel)} {databaseName},{" "}
    {t(Keys.controls.settings.throughput.containerLabel)} {collectionName}{" "}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
  </Text>
);

export const getThroughputApplyShortDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle} id="throughputApplyShortDelayMessage">
    {t(Keys.controls.settings.throughput.applyShortDelayMessage)}
    <br />
    {collectionName
      ? `${t(Keys.controls.settings.throughput.databaseLabel)} ${databaseName}, ${t(
          Keys.controls.settings.throughput.containerLabel,
        )} ${collectionName} `
      : `${t(Keys.controls.settings.throughput.databaseLabel)} ${databaseName} `}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit)}
  </Text>
);

export const getThroughputApplyLongDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  requestedThroughput: number,
): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle} id="throughputApplyLongDelayMessage">
    {t(Keys.controls.settings.throughput.applyLongDelayMessage)}
    <br />
    {collectionName
      ? `${t(Keys.controls.settings.throughput.databaseLabel)} ${databaseName}, ${t(
          Keys.controls.settings.throughput.containerLabel,
        )} ${collectionName} `
      : `${t(Keys.controls.settings.throughput.databaseLabel)} ${databaseName} `}
    {getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
  </Text>
);

export const getToolTipContainer = (content: string | JSX.Element): JSX.Element =>
  content ? <Text styles={infoAndToolTipTextStyle}>{content}</Text> : undefined;

export const conflictResolutionLwwTooltip: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>{t(Keys.controls.settings.conflictResolution.lwwTooltip)}</Text>
);

export const conflictResolutionCustomToolTip: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>
    {t(Keys.controls.settings.conflictResolution.customTooltip)}
    <Link className="linkDarkBackground" href="https://aka.ms/dataexplorerconflics" target="_blank">
      {t(Keys.controls.settings.conflictResolution.customTooltipConflictsFeed)}
    </Link>
    {t(Keys.controls.settings.conflictResolution.customTooltipSuffix)}
  </Text>
);

export const changeFeedPolicyToolTip: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle}>{t(Keys.controls.settings.changeFeed.tooltip)}</Text>
);

export const mongoIndexingPolicyDisclaimer: JSX.Element = (
  <Text style={{ color: "var(--colorNeutralForeground1)" }}>
    {t(Keys.controls.settings.mongoIndexing.disclaimer)}
    <Link
      href="https://docs.microsoft.com/azure/cosmos-db/mongodb-indexing#index-types"
      target="_blank"
      style={{ color: "var(--colorBrandForeground1)" }}
    >
      {t(Keys.controls.settings.mongoIndexing.disclaimerCompoundIndexesLink)}
    </Link>
    {t(Keys.controls.settings.mongoIndexing.disclaimerSuffix)}
  </Text>
);

export const mongoCompoundIndexNotSupportedMessage: JSX.Element = (
  <Text style={{ color: "var(--colorNeutralForeground1)" }}>
    {t(Keys.controls.settings.mongoIndexing.compoundNotSupported)}
  </Text>
);

export const mongoIndexingPolicyAADError: JSX.Element = (
  <MessageBar messageBarType={MessageBarType.error}>
    <Text>
      {t(Keys.controls.settings.mongoIndexing.aadError)}
      <Link target="_blank" href="https://portal.azure.com">
        {t(Keys.controls.settings.mongoIndexing.aadErrorLink)}
      </Link>
    </Text>
  </MessageBar>
);

export const mongoIndexTransformationRefreshingMessage: JSX.Element = (
  <Stack horizontal {...mongoWarningStackProps}>
    <Text styles={infoAndToolTipTextStyle}>{t(Keys.controls.settings.mongoIndexing.refreshingProgress)}</Text>
    <Spinner size={SpinnerSize.small} />
  </Stack>
);

export const renderMongoIndexTransformationRefreshMessage = (
  progress: number,
  performRefresh: () => void,
): JSX.Element => {
  if (progress === 0) {
    return (
      <Text styles={infoAndToolTipTextStyle}>
        {t(Keys.controls.settings.mongoIndexing.canMakeMoreChangesZero)}
        <Link onClick={performRefresh}>{t(Keys.controls.settings.mongoIndexing.refreshToCheck)}</Link>
      </Text>
    );
  } else {
    return (
      <Text styles={infoAndToolTipTextStyle}>
        {`${t(Keys.controls.settings.mongoIndexing.canMakeMoreChangesProgress).replace(
          "{{progress}}",
          String(progress),
        )} `}
        <Link onClick={performRefresh}>{t(Keys.controls.settings.mongoIndexing.refreshToCheckProgress)}</Link>
      </Text>
    );
  }
};

export const getTextFieldStyles = (current: isDirtyTypes, baseline: isDirtyTypes): Partial<ITextFieldStyles> => ({
  fieldGroup: {
    height: 25,
    width: 300,
    backgroundColor: "var(--colorNeutralBackground2)",
    borderColor: isDirty(current, baseline) ? StyleConstants.Dirty : "var(--colorNeutralStroke1)",
    selectors: {
      ":disabled": {
        backgroundColor: "var(--colorNeutralBackground2)",
        borderColor: "var(--colorNeutralStroke1)",
        color: "var(--colorNeutralForeground2)",
      },
      input: {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground1)",
      },
      "input:disabled": {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground2)",
      },
      "input#autopilotInput": {
        backgroundColor: "var(--colorNeutralBackground4)",
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  field: {
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground1)",
    selectors: {
      ":disabled": {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground2)",
      },
    },
  },
  subComponentStyles: {
    label: {
      root: {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  suffix: {
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground1)",
    border: "1px solid var(--colorNeutralStroke1)",
  },
});

export const getChoiceGroupStyles = (
  current: isDirtyTypes,
  baseline: isDirtyTypes,
  isHorizontal?: boolean,
): Partial<IChoiceGroupStyles> => ({
  label: {
    color: "var(--colorNeutralForeground1)",
  },
  root: {
    selectors: {
      ".ms-ChoiceFieldLabel": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-ChoiceField-field:hover .ms-ChoiceFieldLabel": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-ChoiceField:hover .ms-ChoiceFieldLabel": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-ChoiceField:hover .ms-ChoiceField-innerField": {
        color: "var(--colorNeutralForeground1)",
      },
      ".ms-ChoiceField-innerField": {
        color: "var(--colorNeutralForeground1)",
      },
    },
  },
  flexContainer: [
    {
      selectors: {
        ".ms-ChoiceField-field.is-checked::before": {
          borderColor: isDirty(current, baseline) ? StyleConstants.Dirty : "",
        },
        ".ms-ChoiceField-field.is-checked::after": {
          borderColor: isDirty(current, baseline) ? StyleConstants.Dirty : "",
        },
        ".ms-ChoiceField-wrapper label": {
          whiteSpace: "nowrap",
          fontSize: 14,
          fontFamily: StyleConstants.DataExplorerFont,
          padding: "2px 5px",
          color: "var(--colorNeutralForeground1)",
        },
        ".ms-ChoiceFieldLabel": {
          color: "var(--colorNeutralForeground1)",
        },
        ".ms-ChoiceFieldLabel:hover": {
          color: "var(--colorNeutralForeground1)",
        },
        ".ms-ChoiceField-field:hover .ms-ChoiceFieldLabel": {
          color: "var(--colorNeutralForeground1)",
        },
      },
      display: isHorizontal ? "inline-flex" : "default",
      columnGap: isHorizontal ? "30px" : "default",
    },
  ],
});
