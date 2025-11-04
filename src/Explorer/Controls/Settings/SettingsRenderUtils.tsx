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
      <Text style={{ fontWeight: 600, color: "var(--colorNeutralForeground1)" }}>Cost estimate*</Text>
      {costElement}
      <Text style={{ fontWeight: 600, marginTop: 15, color: "var(--colorNeutralForeground1)" }}>
        How we calculate this
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
          {priceBreakdown.pricePerRu}/RU
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
    The starting autoscale max RU/s will be determined by the system, based on the current manual throughput settings
    and storage of your resource. After autoscale has been enabled, you can change the max RU/s.{" "}
    <Link href={Urls.autoscaleMigration}>Learn more</Link>
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

export const unsavedEditorWarningMessage = (editor: editorType): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle}>
    You have not saved the latest changes made to your{" "}
    {editor === "indexPolicy"
      ? "indexing policy"
      : editor === "dataMasking"
      ? "data masking policy"
      : "computed properties"}
    . Please click save to confirm the changes.
  </Text>
);

export const updateThroughputDelayedApplyWarningMessage: JSX.Element = (
  <Text styles={infoAndToolTipTextStyle} id="updateThroughputDelayedApplyWarningMessage">
    You are about to request an increase in throughput beyond the pre-allocated capacity. This operation will take some
    time to complete.
  </Text>
);

export const getUpdateThroughputBeyondInstantLimitMessage = (instantMaximumThroughput: number): JSX.Element => {
  return (
    <Text id="updateThroughputDelayedApplyWarningMessage">
      Scaling up will take 4-6 hours as it exceeds what Azure Cosmos DB can instantly support currently based on your
      number of physical partitions. You can increase your throughput to {instantMaximumThroughput} instantly or proceed
      with this value and wait until the scale-up is completed.
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
        Your request to increase throughput exceeds the pre-allocated capacity which may take longer than expected.
        There are three options you can choose from to proceed:
      </Text>
      <ol style={{ fontSize: 14, color: "var(--colorNeutralForeground1)", marginTop: "5px" }}>
        <li>You can instantly scale up to {instantMaximumThroughput} RU/s.</li>
        {instantMaximumThroughput < maximumThroughput && (
          <li>You can asynchronously scale up to any value under {maximumThroughput} RU/s in 4-6 hours.</li>
        )}
        <li>
          Your current quota max is {maximumThroughput} RU/s. To go over this limit, you must request a quota increase
          and the Azure Cosmos DB team will review.
          <Link
            href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/create-support-request-quota-increase"
            target="_blank"
          >
            Learn more
          </Link>
        </li>
      </ol>
    </>
  );
};

export const getUpdateThroughputBelowMinimumMessage = (minimum: number): JSX.Element => {
  return (
    <Text styles={infoAndToolTipTextStyle}>
      You are not able to lower throughput below your current minimum of {minimum} RU/s. For more information on this
      limit, please refer to our service quote documentation.
      <Link
        href="https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits#minimum-throughput-limits"
        target="_blank"
      >
        Learn more
      </Link>
    </Text>
  );
};

export const saveThroughputWarningMessage: JSX.Element = (
  <Text>
    Your bill will be affected as you update your throughput settings. Please review the updated cost estimate below
    before saving your changes
  </Text>
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
        ? `, Current autoscale throughput: ${Math.round(
            throughput / 10,
          )} - ${throughput} ${throughputUnit}, Target autoscale throughput: ${Math.round(
            targetThroughput / 10,
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
  requestedThroughput: number,
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
): JSX.Element => (
  <Text styles={infoAndToolTipTextStyle} id="throughputApplyShortDelayMessage">
    A request to increase the throughput is currently in progress. This operation will take some time to complete.
    <br />
    {collectionName ? `Database: ${databaseName}, Container: ${collectionName} ` : `Database: ${databaseName} `}
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
    A request to increase the throughput is currently in progress. This operation will take 1-3 business days to
    complete. View the latest status in Notifications.
    <br />
    {collectionName ? `Database: ${databaseName}, Container: ${collectionName} ` : `Database: ${databaseName} `}
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
  <Text style={{ color: "var(--colorNeutralForeground1)" }}>
    For queries that filter on multiple properties, create multiple single field indexes instead of a compound index.
    <Link
      href="https://docs.microsoft.com/azure/cosmos-db/mongodb-indexing#index-types"
      target="_blank"
      style={{ color: "var(--colorBrandForeground1)" }}
    >
      {` Compound indexes `}
    </Link>
    are only used for sorting query results. If you need to add a compound index, you can create one using the Mongo
    shell.
  </Text>
);

export const mongoCompoundIndexNotSupportedMessage: JSX.Element = (
  <Text style={{ color: "var(--colorNeutralForeground1)" }}>
    Collections with compound indexes are not yet supported in the indexing editor. To modify indexing policy for this
    collection, use the Mongo Shell.
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
    <Text styles={infoAndToolTipTextStyle}>Refreshing index transformation progress</Text>
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
        {"You can make more indexing changes once the current index transformation is complete. "}
        <Link onClick={performRefresh}>{"Refresh to check if it has completed."}</Link>
      </Text>
    );
  } else {
    return (
      <Text styles={infoAndToolTipTextStyle}>
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
