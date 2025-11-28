import {
  Checkbox,
  ChoiceGroup,
  FontIcon,
  IChoiceGroupOption,
  IMessageBarStyles,
  IProgressIndicatorStyles,
  ISeparatorStyles,
  Label,
  Link,
  MessageBar,
  MessageBarType,
  ProgressIndicator,
  Separator,
  Stack,
  Text,
  TextField,
} from "@fluentui/react";
import React from "react";
import * as DataModels from "../../../../../Contracts/DataModels";
import * as SharedConstants from "../../../../../Shared/Constants";
import { Action, ActionModifiers } from "../../../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../../../UserContext";
import * as AutoPilotUtils from "../../../../../Utils/AutoPilotUtils";
import { autoPilotThroughput1K } from "../../../../../Utils/AutoPilotUtils";
import { calculateEstimateNumber } from "../../../../../Utils/PricingUtils";
import { Int32 } from "../../../../Panes/Tables/Validators/EntityPropertyValidationCommon";
import {
  PriceBreakdown,
  checkBoxAndInputStackProps,
  getChoiceGroupStyles,
  getEstimatedSpendingElement,
  getRuPriceBreakdown,
  getTextFieldStyles,
  getToolTipContainer,
  getUpdateThroughputBelowMinimumMessage,
  getUpdateThroughputBeyondInstantLimitMessage,
  getUpdateThroughputBeyondSupportLimitMessage,
  manualToAutoscaleDisclaimerElement,
  noLeftPaddingCheckBoxStyle,
  relaxedSpacingStackProps,
  saveThroughputWarningMessage,
  titleAndInputStackProps,
} from "../../SettingsRenderUtils";
import { IsComponentDirtyResult, getSanitizedInputValue, isDirty } from "../../SettingsUtils";
import { ToolTipLabelComponent } from "../ToolTipLabelComponent";

export interface ThroughputInputAutoPilotV3Props {
  databaseAccount: DataModels.DatabaseAccount;
  databaseName: string;
  collectionName: string;
  throughput: number;
  throughputBaseline: number;
  onThroughputChange: (newThroughput: number) => void;
  minimum: number;
  maximum: number;
  step?: number;
  isEnabled?: boolean;
  spendAckChecked?: boolean;
  spendAckId?: string;
  spendAckText?: string;
  spendAckVisible?: boolean;
  showAsMandatory?: boolean;
  isFixed: boolean;
  isFreeTierAccount: boolean;
  isEmulator: boolean;
  label: string;
  infoBubbleText?: string;
  canExceedMaximumValue?: boolean;
  onAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  maxAutoPilotThroughput: number;
  maxAutoPilotThroughputBaseline: number;
  onMaxAutoPilotThroughputChange: (newThroughput: number) => void;
  onScaleSaveableChange: (isScaleSaveable: boolean) => void;
  onScaleDiscardableChange: (isScaleDiscardable: boolean) => void;
  usageSizeInKB: number;
  throughputError?: string;
  instantMaximumThroughput: number;
  softAllowedMaximumThroughput: number;
  isGlobalSecondaryIndex: boolean;
}

interface ThroughputInputAutoPilotV3State {
  spendAckChecked: boolean;
  exceedFreeTierThroughput: boolean;
}
export class ThroughputInputAutoPilotV3Component extends React.Component<
  ThroughputInputAutoPilotV3Props,
  ThroughputInputAutoPilotV3State
> {
  private shouldCheckComponentIsDirty = true;
  private static readonly defaultStep = 100;
  private step: number;
  private throughputInputMaxValue: number;
  private autoPilotInputMaxValue: number;
  private options: IChoiceGroupOption[] = [
    { key: "true", text: "Autoscale" },
    { key: "false", text: "Manual" },
  ];

  // Style constants for theme-aware colors and layout
  private static readonly TEXT_COLOR_PRIMARY = "var(--colorNeutralForeground1)";
  private static readonly TEXT_COLOR_SECONDARY = "var(--colorNeutralForeground2)";
  private static readonly TEXT_WIDTH_50 = "50%";
  private static readonly TEXT_WIDTH_33 = "33%";
  private static readonly LOCALE_EN_US = "en-US";

  componentDidMount(): void {
    this.onComponentUpdate();
  }

  componentDidUpdate(): void {
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }
    const isComponentDirtyResult = this.IsComponentDirty();
    this.props.onScaleSaveableChange(isComponentDirtyResult.isSaveable);
    this.props.onScaleDiscardableChange(isComponentDirtyResult.isDiscardable);

    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = (): IsComponentDirtyResult => {
    let isSaveable = false;
    let isDiscardable = false;

    if (this.props.isEnabled) {
      if (this.hasProvisioningTypeChanged()) {
        isSaveable = true;
        isDiscardable = true;
      } else if (this.props.isAutoPilotSelected) {
        if (isDirty(this.props.maxAutoPilotThroughput, this.props.maxAutoPilotThroughputBaseline)) {
          isDiscardable = true;
          if (
            this.props.softAllowedMaximumThroughput
              ? this.props.maxAutoPilotThroughput <= this.props.softAllowedMaximumThroughput &&
                AutoPilotUtils.isValidAutoPilotThroughput(this.props.maxAutoPilotThroughput)
              : AutoPilotUtils.isValidAutoPilotThroughput(this.props.maxAutoPilotThroughput)
          ) {
            isSaveable = true;
          }
        }
      } else {
        if (isDirty(this.props.throughput, this.props.throughputBaseline)) {
          isDiscardable = true;
          isSaveable = true;
          if (
            !this.props.throughput ||
            this.props.throughput < this.props.minimum ||
            (this.props.throughput > this.props.maximum && (this.props.isEmulator || this.props.isFixed)) ||
            (this.props.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
              !this.props.canExceedMaximumValue)
          ) {
            isSaveable = false;
          }
        }
      }
    }
    return { isSaveable, isDiscardable };
  };

  public constructor(props: ThroughputInputAutoPilotV3Props) {
    super(props);
    this.state = {
      spendAckChecked: this.props.spendAckChecked,
      exceedFreeTierThroughput:
        this.props.isFreeTierAccount &&
        !this.props.isAutoPilotSelected &&
        this.props.throughput > SharedConstants.FreeTierLimits.RU,
    };

    this.step = this.props.step ?? ThroughputInputAutoPilotV3Component.defaultStep;
    this.throughputInputMaxValue = this.props.canExceedMaximumValue ? Int32.Max : this.props.maximum;
    this.autoPilotInputMaxValue = this.props.isFixed ? this.props.maximum : Int32.Max;
  }

  public hasProvisioningTypeChanged = (): boolean =>
    this.props.wasAutopilotOriginallySet !== this.props.isAutoPilotSelected;

  public overrideWithAutoPilotSettings = (): boolean =>
    this.hasProvisioningTypeChanged() && this.props.wasAutopilotOriginallySet;

  public overrideWithProvisionedThroughputSettings = (): boolean =>
    this.hasProvisioningTypeChanged() && !this.props.wasAutopilotOriginallySet;

  private getRequestUnitsUsageCost = (): JSX.Element => {
    const account = this.props.databaseAccount;
    if (!account) {
      return <></>;
    }

    const isDirty: boolean = this.IsComponentDirty().isDiscardable;
    const regions = account?.properties?.readLocations?.length || 1;
    const multimaster = account?.properties?.enableMultipleWriteLocations || false;

    let estimatedSpend: JSX.Element;

    if (this.props.isAutoPilotSelected) {
      estimatedSpend = this.getEstimatedAutoscaleSpendElement(
        this.props.maxAutoPilotThroughputBaseline,
        userContext.portalEnv,
        regions,
        multimaster,
        isDirty ? this.props.maxAutoPilotThroughput : undefined,
      );
    } else {
      estimatedSpend = this.getEstimatedManualSpendElement(
        // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
        this.overrideWithAutoPilotSettings() ? this.props.maxAutoPilotThroughput : this.props.throughputBaseline,
        userContext.portalEnv,
        regions,
        multimaster,
        isDirty ? this.props.throughput : undefined,
      );
    }
    return estimatedSpend;
  };

  private getEstimatedAutoscaleSpendElement = (
    throughput: number,
    serverId: string,
    numberOfRegions: number,
    isMultimaster: boolean,
    newThroughput?: number,
  ): JSX.Element => {
    const prices: PriceBreakdown = getRuPriceBreakdown(throughput, serverId, numberOfRegions, isMultimaster, true);

    const newThroughputCostElement = (): JSX.Element => {
      const newPrices: PriceBreakdown = getRuPriceBreakdown(
        newThroughput,
        serverId,
        numberOfRegions,
        isMultimaster,
        true,
      );
      return (
        <div>
          <Text style={{ fontWeight: 600, color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY }}>
            Updated cost per month
          </Text>
          <Stack horizontal style={{ marginTop: 5, marginBottom: 10 }}>
            <Text
              style={{
                width: ThroughputInputAutoPilotV3Component.TEXT_WIDTH_50,
                color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY,
              }}
            >
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice / 10)} min
            </Text>
            <Text
              style={{
                width: ThroughputInputAutoPilotV3Component.TEXT_WIDTH_50,
                color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY,
              }}
            >
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice)} max
            </Text>
          </Stack>
        </div>
      );
    };

    const costElement = (): JSX.Element => {
      const prices: PriceBreakdown = getRuPriceBreakdown(throughput, serverId, numberOfRegions, isMultimaster, true);
      return (
        <Stack {...checkBoxAndInputStackProps} style={{ marginTop: 15 }}>
          {newThroughput && newThroughputCostElement()}
          <Text style={{ fontWeight: 600, color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY }}>
            Current cost per month
          </Text>
          <Stack horizontal style={{ marginTop: 5, color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY }}>
            <Text
              style={{
                width: ThroughputInputAutoPilotV3Component.TEXT_WIDTH_50,
                color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY,
              }}
            >
              {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice / 10)} min
            </Text>
            <Text
              style={{
                width: ThroughputInputAutoPilotV3Component.TEXT_WIDTH_50,
                color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY,
              }}
            >
              {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice)} max
            </Text>
          </Stack>
        </Stack>
      );
    };

    return getEstimatedSpendingElement(costElement(), newThroughput ?? throughput, numberOfRegions, prices, true);
  };
  settingsAndScaleStyle = {
    root: {
      width: ThroughputInputAutoPilotV3Component.TEXT_WIDTH_33,
      color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY,
    },
  };
  private getEstimatedManualSpendElement = (
    throughput: number,
    serverId: string,
    numberOfRegions: number,
    isMultimaster: boolean,
    newThroughput?: number,
  ): JSX.Element => {
    const prices: PriceBreakdown = getRuPriceBreakdown(throughput, serverId, numberOfRegions, isMultimaster, false);

    const newThroughputCostElement = (): JSX.Element => {
      const newPrices: PriceBreakdown = getRuPriceBreakdown(
        newThroughput,
        serverId,
        numberOfRegions,
        isMultimaster,
        false,
      );
      return (
        <div>
          <Text style={{ fontWeight: 600, color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY }}>
            Updated cost per month
          </Text>
          <Stack horizontal style={{ marginTop: 5, marginBottom: 10 }}>
            <Text style={this.settingsAndScaleStyle.root}>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.hourlyPrice)}/hr
            </Text>
            <Text style={this.settingsAndScaleStyle.root}>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.dailyPrice)}/day
            </Text>
            <Text style={this.settingsAndScaleStyle.root}>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice)}/mo
            </Text>
          </Stack>
        </div>
      );
    };

    const costElement = (): JSX.Element => {
      const prices: PriceBreakdown = getRuPriceBreakdown(throughput, serverId, numberOfRegions, isMultimaster, false);
      return (
        <Stack {...checkBoxAndInputStackProps} style={{ marginTop: 15 }}>
          {newThroughput && newThroughputCostElement()}
          <Text style={{ fontWeight: 600, color: ThroughputInputAutoPilotV3Component.TEXT_COLOR_PRIMARY }}>
            Current cost per month
          </Text>
          <Stack horizontal style={{ marginTop: 5 }}>
            <Text style={this.settingsAndScaleStyle.root}>
              {prices.currencySign} {calculateEstimateNumber(prices.hourlyPrice)}/hr
            </Text>
            <Text style={this.settingsAndScaleStyle.root}>
              {prices.currencySign} {calculateEstimateNumber(prices.dailyPrice)}/day
            </Text>
            <Text style={this.settingsAndScaleStyle.root}>
              {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice)}/mo
            </Text>
          </Stack>
        </Stack>
      );
    };

    return getEstimatedSpendingElement(costElement(), newThroughput ?? throughput, numberOfRegions, prices, false);
  };

  private onAutoPilotThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    const newThroughput = getSanitizedInputValue(newValue);
    this.props.onMaxAutoPilotThroughputChange(newThroughput);
  };

  private onThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    const newThroughput = getSanitizedInputValue(newValue);
    if (this.overrideWithAutoPilotSettings()) {
      this.props.onMaxAutoPilotThroughputChange(newThroughput);
    } else {
      this.setState({
        exceedFreeTierThroughput: this.props.isFreeTierAccount && newThroughput > SharedConstants.FreeTierLimits.RU,
      });
      this.props.onThroughputChange(newThroughput);
    }
  };

  private onChoiceGroupChange = (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption,
  ): void => {
    this.props.onAutoPilotSelected(option.key === "true");
    TelemetryProcessor.trace(Action.ToggleAutoscaleSetting, ActionModifiers.Mark, {
      changedSelectedValueTo:
        option.key === "true" ? ActionModifiers.ToggleAutoscaleOn : ActionModifiers.ToggleAutoscaleOff,
      databaseName: this.props.databaseName,
      collectionName: this.props.collectionName,
      dataExplorerArea: "Scale Tab V2",
    });
  };

  private renderThroughputModeChoices = (): JSX.Element => {
    const labelId = "settingsV2RadioButtonLabelId";
    return (
      <Stack>
        <Label id={labelId}>
          <ToolTipLabelComponent
            label={this.props.label}
            toolTipElement={getToolTipContainer(this.props.infoBubbleText)}
          />
        </Label>
        {!this.props.isGlobalSecondaryIndex && (
          <>
            {this.overrideWithProvisionedThroughputSettings() && (
              <MessageBar
                messageBarIconProps={{ iconName: "InfoSolid", className: "messageBarInfoIcon" }}
                styles={this.darkThemeMessageBarStyles}
              >
                {manualToAutoscaleDisclaimerElement}
              </MessageBar>
            )}
            <ChoiceGroup
              selectedKey={this.props.isAutoPilotSelected.toString()}
              options={this.options}
              onChange={this.onChoiceGroupChange}
              required={this.props.showAsMandatory}
              ariaLabelledBy={labelId}
              styles={getChoiceGroupStyles(this.props.wasAutopilotOriginallySet, this.props.isAutoPilotSelected, true)}
            />
          </>
        )}
      </Stack>
    );
  };

  private onSpendAckChecked = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void =>
    this.setState({ spendAckChecked: checked });

  private getStorageCapacityTitle = (): JSX.Element => {
    const capacity: string = this.props.isFixed ? "Fixed" : "Unlimited";
    return (
      <Stack {...titleAndInputStackProps}>
        <Label style={{ color: "var(--colorNeutralForeground1)" }}>Storage capacity</Label>
        <Text style={{ color: "var(--colorNeutralForeground1)" }}>{capacity}</Text>
      </Stack>
    );
  };

  private thoughputRangeSeparatorStyles: Partial<ISeparatorStyles> = {
    root: [
      {
        selectors: {
          "::before": {
            backgroundColor: "var(--colorNeutralStroke2)",
            height: "3px",
            marginTop: "-1px",
          },
        },
      },
    ],
  };

  private currentThroughputValue = (): number => {
    return this.props.isAutoPilotSelected
      ? this.props.maxAutoPilotThroughput
      : this.overrideWithAutoPilotSettings()
      ? this.props.maxAutoPilotThroughputBaseline
      : this.props.throughput;
  };

  private getCurrentRuRange = (): "below" | "instant" | "delayed" | "requireSupport" => {
    if (this.currentThroughputValue() < this.props.minimum) {
      return "below";
    }
    if (
      this.currentThroughputValue() >= this.props.minimum &&
      this.currentThroughputValue() <= this.props.instantMaximumThroughput
    ) {
      return "instant";
    }
    if (this.currentThroughputValue() > this.props.softAllowedMaximumThroughput) {
      return "requireSupport";
    }

    return "delayed";
  };

  private getRuThermometerStyles = (): Partial<IProgressIndicatorStyles> => ({
    progressBar: [
      {
        backgroundColor:
          this.getCurrentRuRange() === "instant"
            ? "var(--colorBrandBackground)"
            : this.getCurrentRuRange() === "delayed"
            ? "var(--colorStatusWarningBackground1)"
            : "var(--colorStatusDangerBackground1)",
      },
    ],
  });

  private getRuThermometerPercentValue = (): number => {
    let percentValue: number;
    const currentRus = this.currentThroughputValue();

    switch (this.getCurrentRuRange()) {
      case "below":
        percentValue = 0;
        break;
      case "instant": {
        const percentOfInstantRange: number = currentRus / this.props.instantMaximumThroughput;
        percentValue = percentOfInstantRange * 0.34;
        break;
      }
      case "delayed": {
        const adjustedMax = this.props.softAllowedMaximumThroughput - this.props.instantMaximumThroughput;
        const adjustedRus = currentRus - this.props.instantMaximumThroughput;
        const percentOfDelayedRange = adjustedRus / adjustedMax;
        const adjustedPercent = percentOfDelayedRange * 0.66;
        percentValue = adjustedPercent + 0.34;
        break;
      }
      default:
        // over maximum
        percentValue = 1;
    }
    return percentValue;
  };

  private getRUThermometer = (): JSX.Element => (
    <Stack>
      <Stack horizontal>
        <Stack.Item style={{ width: "34%" }}>
          <span>{this.props.minimum.toLocaleString(ThroughputInputAutoPilotV3Component.LOCALE_EN_US)}</span>
        </Stack.Item>
        <Stack.Item style={{ width: "66%" }}>
          <span style={{ float: "left", transform: "translateX(-50%)" }}>
            {this.props.instantMaximumThroughput.toLocaleString(ThroughputInputAutoPilotV3Component.LOCALE_EN_US)}
          </span>
          <span style={{ float: "right" }}>
            {this.props.softAllowedMaximumThroughput.toLocaleString(ThroughputInputAutoPilotV3Component.LOCALE_EN_US)}
          </span>
        </Stack.Item>
      </Stack>
      <ProgressIndicator
        barHeight={20}
        percentComplete={this.getRuThermometerPercentValue()}
        styles={this.getRuThermometerStyles()}
      />
      <Stack horizontal>
        <Stack.Item style={{ width: "34%", paddingRight: "5px" }}>
          <Separator styles={this.thoughputRangeSeparatorStyles}>Instant</Separator>
        </Stack.Item>
        <Stack.Item style={{ width: "66%", paddingLeft: "5px" }}>
          <Separator styles={this.thoughputRangeSeparatorStyles}>4-6 hrs</Separator>
        </Stack.Item>
      </Stack>
    </Stack>
  );

  private showThroughputWarning = (): boolean => {
    return (
      this.currentThroughputValue() > this.props.instantMaximumThroughput ||
      this.currentThroughputValue() < this.props.minimum
    );
  };

  private getThroughputWarningMessageText = (): JSX.Element => {
    switch (this.getCurrentRuRange()) {
      case "below":
        return getUpdateThroughputBelowMinimumMessage(this.props.minimum);
      case "delayed":
        return getUpdateThroughputBeyondInstantLimitMessage(this.props.instantMaximumThroughput);
      case "requireSupport":
        return getUpdateThroughputBeyondSupportLimitMessage(
          this.props.instantMaximumThroughput,
          this.props.softAllowedMaximumThroughput,
        );
      default:
        return <></>;
    }
  };

  private darkThemeMessageBarStyles: Partial<IMessageBarStyles> = {
    root: {
      marginTop: "5px",
      selectors: {
        "&.ms-MessageBar--severeWarning": {
          backgroundColor: "var(--colorStatusDangerBackground1)",
          border: "1px solid var(--colorStatusDangerBorder1)",
        },
        "&.ms-MessageBar--warning": {
          backgroundColor: "var(--colorStatusWarningBackground1)",
          border: "1px solid var(--colorStatusWarningBorder1)",
        },
        "&.ms-MessageBar--info": {
          backgroundColor: "var(--colorNeutralBackground3)",
          border: "1px solid var(--colorNeutralStroke1)",
        },
        ".ms-MessageBar-icon": {
          color: "var(--colorNeutralForeground1)",
        },
        ".ms-MessageBar-text": {
          color: "var(--colorNeutralForeground1)",
        },
      },
    },
  };

  private getThroughputWarningMessageBar = (): JSX.Element => {
    const isSevereWarning: boolean =
      this.currentThroughputValue() > this.props.softAllowedMaximumThroughput ||
      this.currentThroughputValue() < this.props.minimum;
    return (
      <MessageBar
        messageBarType={isSevereWarning ? MessageBarType.severeWarning : MessageBarType.warning}
        styles={this.darkThemeMessageBarStyles}
      >
        {this.getThroughputWarningMessageText()}
      </MessageBar>
    );
  };

  private getThroughputTextField = (): JSX.Element => (
    <>
      {this.props.isAutoPilotSelected ? (
        <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 8 }}>
          {/* Column 1: Minimum RU/s */}
          <Stack tokens={{ childrenGap: 4 }}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
              <Text
                variant="small"
                style={{ lineHeight: "20px", fontWeight: 600, color: "var(--colorNeutralForeground1)" }}
              >
                Minimum RU/s
              </Text>
              <FontIcon iconName="Info" style={{ fontSize: 12, color: "var(--colorNeutralForeground2)" }} />
            </Stack>
            <Text
              style={{
                fontFamily: "Segoe UI",
                width: 70,
                height: 28,
                border: "none",
                fontSize: 14,
                backgroundColor: "transparent",
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                color: "var(--colorNeutralForeground1)",
              }}
            >
              {AutoPilotUtils.getMinRUsBasedOnUserInput(this.props.maxAutoPilotThroughput)}
            </Text>
          </Stack>

          {/* Column 2: "x 10 =" Text */}
          <Text
            style={{
              fontFamily: "Segoe UI",
              fontSize: 12,
              fontWeight: 400,
              paddingBottom: 6,
              color: "var(--colorNeutralForeground1)",
            }}
          >
            x 10 =
          </Text>

          {/* Column 3: Maximum RU/s */}
          <Stack tokens={{ childrenGap: 4 }}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
              <Text
                variant="small"
                style={{ lineHeight: "20px", fontWeight: 600, color: "var(--colorNeutralForeground1)" }}
              >
                Maximum RU/s
              </Text>
              <FontIcon iconName="Info" style={{ fontSize: 12, color: "var(--colorNeutralForeground2)" }} />
            </Stack>
            <TextField
              required
              type="number"
              id="autopilotInput"
              key="auto pilot throughput input"
              styles={{
                ...getTextFieldStyles(this.props.maxAutoPilotThroughput, this.props.maxAutoPilotThroughputBaseline),
                fieldGroup: {
                  width: 100,
                  height: 28,
                  backgroundColor: "var(--colorNeutralBackground4)",
                },
                field: {
                  fontSize: 14,
                  fontWeight: 400,
                  color: "var(--colorNeutralForeground1)",
                  backgroundColor: "var(--colorNeutralBackground4)",
                },
                root: {
                  selectors: {
                    input: {
                      backgroundColor: "var(--colorNeutralBackground4)",
                      color: "var(--colorNeutralForeground1)",
                    },
                  },
                },
              }}
              disabled={this.overrideWithProvisionedThroughputSettings()}
              step={AutoPilotUtils.autoPilotIncrementStep}
              value={
                this.overrideWithProvisionedThroughputSettings() ? "" : this.props.maxAutoPilotThroughput?.toString()
              }
              onChange={this.onAutoPilotThroughputChange}
              min={autoPilotThroughput1K}
              onGetErrorMessage={(value: string) => {
                const sanitizedValue = getSanitizedInputValue(value);
                return sanitizedValue % 1000
                  ? "Throughput value must be in increments of 1000"
                  : this.props.throughputError;
              }}
              validateOnLoad={false}
            />
          </Stack>
        </Stack>
      ) : (
        <TextField
          required
          type="number"
          id="throughputInput"
          key="provisioned throughput input"
          styles={getTextFieldStyles(this.props.throughput, this.props.throughputBaseline)}
          disabled={this.overrideWithAutoPilotSettings()}
          step={this.step}
          value={
            this.overrideWithAutoPilotSettings()
              ? this.props.maxAutoPilotThroughputBaseline?.toString()
              : this.props.throughput?.toString()
          }
          onChange={this.onThroughputChange}
          min={this.props.minimum}
          errorMessage={this.props.throughputError}
        />
      )}
    </>
  );

  private renderThroughputComponent = (): JSX.Element => (
    <Stack horizontal>
      <Stack.Item style={{ width: "70%", maxWidth: "700px" }}>
        <Stack {...relaxedSpacingStackProps} style={{ paddingRight: "50px" }}>
          {this.getThroughputTextField()}
          {this.props.instantMaximumThroughput && (
            <Stack>
              {this.getRUThermometer()}
              {this.showThroughputWarning() && this.getThroughputWarningMessageBar()}
            </Stack>
          )}
          {this.props.isAutoPilotSelected ? (
            <Text style={{ marginTop: "40px", color: "var(--colorNeutralForeground1)" }}>
              Based on usage, your {this.props.collectionName ? "container" : "database"} throughput will scale from{" "}
              <b>
                {AutoPilotUtils.getMinRUsBasedOnUserInput(this.props.maxAutoPilotThroughput)} RU/s (10% of max RU/s) -{" "}
                {this.props.maxAutoPilotThroughput} RU/s
              </b>
              <br />
            </Text>
          ) : (
            <>
              {this.state.exceedFreeTierThroughput && (
                <MessageBar
                  messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
                  styles={this.darkThemeMessageBarStyles}
                  style={{ marginTop: "40px" }}
                >
                  {`Billing will apply if you provision more than ${SharedConstants.FreeTierLimits.RU} RU/s of manual throughput, or if the resource scales beyond ${SharedConstants.FreeTierLimits.RU} RU/s with autoscale.`}
                </MessageBar>
              )}
            </>
          )}
          {!this.overrideWithProvisionedThroughputSettings() && (
            <Text style={{ color: "var(--colorNeutralForeground1)" }}>
              Estimate your required RU/s with
              <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
                {` capacity calculator`} <FontIcon iconName="NavigateExternalInline" />
              </Link>
            </Text>
          )}
          {this.props.spendAckVisible && (
            <Checkbox
              id="spendAckCheckBox"
              styles={noLeftPaddingCheckBoxStyle}
              label={this.props.spendAckText}
              checked={this.state.spendAckChecked}
              onChange={this.onSpendAckChecked}
            />
          )}
          {this.props.isFixed && (
            <p>When using a collection with fixed storage capacity, you can set up to 10,000 RU/s.</p>
          )}
          {this.props.collectionName && (
            <Stack.Item style={{ marginTop: "40px" }}>{this.getStorageCapacityTitle()}</Stack.Item>
          )}
        </Stack>
      </Stack.Item>
      <Stack.Item style={{ width: "30%", maxWidth: "300px" }}>
        {!this.props.isEmulator ? this.getRequestUnitsUsageCost() : <></>}
      </Stack.Item>
    </Stack>
  );

  private renderWarningMessage = (): JSX.Element => {
    let warningMessage: JSX.Element;
    if (this.IsComponentDirty().isDiscardable) {
      warningMessage = saveThroughputWarningMessage;
    }

    return (
      <>
        {warningMessage && (
          <MessageBar
            messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
            styles={this.darkThemeMessageBarStyles}
            role="alert"
          >
            {warningMessage}
          </MessageBar>
        )}
      </>
    );
  };

  public render(): JSX.Element {
    return (
      <Stack {...checkBoxAndInputStackProps}>
        {this.renderWarningMessage()}
        {this.renderThroughputModeChoices()}

        {this.renderThroughputComponent()}
      </Stack>
    );
  }
}
