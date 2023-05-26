import {
  Checkbox,
  ChoiceGroup,
  FontIcon,
  IChoiceGroupOption,
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
import { SubscriptionType } from "../../../../../Contracts/SubscriptionType";
import * as SharedConstants from "../../../../../Shared/Constants";
import { Action, ActionModifiers } from "../../../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../../../UserContext";
import * as AutoPilotUtils from "../../../../../Utils/AutoPilotUtils";
import { autoPilotThroughput1K } from "../../../../../Utils/AutoPilotUtils";
import { calculateEstimateNumber, usageInGB } from "../../../../../Utils/PricingUtils";
import { Int32 } from "../../../../Panes/Tables/Validators/EntityPropertyValidationCommon";
import {
  PriceBreakdown,
  checkBoxAndInputStackProps,
  getChoiceGroupStyles,
  getEstimatedSpendingElement,
  getRuPriceBreakdown,
  getTextFieldStyles,
  getToolTipContainer,
  getUpdateThroughputBeyondInstantLimitMessage,
  getUpdateThroughputBeyondSupportLimitMessage,
  manualToAutoscaleDisclaimerElement,
  messageBarStyles,
  noLeftPaddingCheckBoxStyle,
  relaxedSpacingStackProps,
  saveThroughputWarningMessage,
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
  getThroughputWarningMessage: () => JSX.Element;
  usageSizeInKB: number;
  throughputError?: string;
  instantMaximumThroughput: number;
  maximumThroughput: number;
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
          if (AutoPilotUtils.isValidAutoPilotThroughput(this.props.maxAutoPilotThroughput)) {
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

    if (!this.props.isAutoPilotSelected) {
      estimatedSpend = this.getEstimatedManualSpendElement(
        // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
        this.overrideWithAutoPilotSettings() ? this.props.maxAutoPilotThroughput : this.props.throughputBaseline,
        userContext.portalEnv,
        regions,
        multimaster,
        isDirty ? this.props.throughput : undefined
      );
    } else {
      estimatedSpend = this.getEstimatedAutoscaleSpendElement(
        this.props.maxAutoPilotThroughputBaseline,
        userContext.portalEnv,
        regions,
        multimaster,
        isDirty ? this.props.maxAutoPilotThroughput : undefined
      );
    }
    return estimatedSpend;
  };

  private getEstimatedAutoscaleSpendElement = (
    throughput: number,
    serverId: string,
    numberOfRegions: number,
    isMultimaster: boolean,
    newThroughput?: number
  ): JSX.Element => {
    const prices: PriceBreakdown = getRuPriceBreakdown(throughput, serverId, numberOfRegions, isMultimaster, true);

    const newThroughputCostElement = (): JSX.Element => {
      const newPrices: PriceBreakdown = getRuPriceBreakdown(
        newThroughput,
        serverId,
        numberOfRegions,
        isMultimaster,
        true
      );
      return (
        <div>
          <Text style={{ fontWeight: 600 }}>Updated cost per month</Text>
          <Stack horizontal style={{ marginTop: 5, marginBottom: 10 }}>
            <Text style={{ width: "50%" }}>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice / 10)} min
            </Text>
            <Text style={{ width: "50%" }}>
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
          <Text style={{ fontWeight: 600 }}>Current cost per month</Text>
          <Stack horizontal style={{ marginTop: 5 }}>
            <Text style={{ width: "50%" }}>
              {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice / 10)} min
            </Text>
            <Text style={{ width: "50%" }}>
              {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice)} max
            </Text>
          </Stack>
        </Stack>
      );
    };

    return getEstimatedSpendingElement(costElement(), newThroughput ?? throughput, numberOfRegions, prices, true);
  };

  private getEstimatedManualSpendElement = (
    throughput: number,
    serverId: string,
    numberOfRegions: number,
    isMultimaster: boolean,
    newThroughput?: number
  ): JSX.Element => {
    const prices: PriceBreakdown = getRuPriceBreakdown(throughput, serverId, numberOfRegions, isMultimaster, false);

    const newThroughputCostElement = (): JSX.Element => {
      const newPrices: PriceBreakdown = getRuPriceBreakdown(
        newThroughput,
        serverId,
        numberOfRegions,
        isMultimaster,
        true
      );
      return (
        <div>
          <Text style={{ fontWeight: 600 }}>Updated cost per month</Text>
          <Stack horizontal style={{ marginTop: 5, marginBottom: 10 }}>
            <Text style={{ width: "33%" }}>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.hourlyPrice)}/hr
            </Text>
            <Text style={{ width: "33%" }}>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.dailyPrice)}/day
            </Text>
            <Text style={{ width: "33%" }}>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice)}/mo
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
          <Text style={{ fontWeight: 600 }}>Current cost per month</Text>
          <Stack horizontal style={{ marginTop: 5 }}>
            <Text style={{ width: "33%" }}>
              {prices.currencySign} {calculateEstimateNumber(prices.hourlyPrice)}/hr
            </Text>
            <Text style={{ width: "33%" }}>
              {prices.currencySign} {calculateEstimateNumber(prices.dailyPrice)}/day
            </Text>
            <Text style={{ width: "33%" }}>
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
    newValue?: string
  ): void => {
    const newThroughput = getSanitizedInputValue(newValue);
    this.props.onMaxAutoPilotThroughputChange(newThroughput);
  };

  private onThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
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
    option?: IChoiceGroupOption
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

  private minRUperGBSurvey = (): JSX.Element => {
    const href = `https://ncv.microsoft.com/vRBTO37jmO?ctx={"AzureSubscriptionId":"${userContext.subscriptionId}","CosmosDBAccountName":"${userContext.databaseAccount?.name}"}`;
    const oneTBinKB = 1000000000;
    const minRUperGB = 10;
    const featureFlagEnabled = userContext.features.showMinRUSurvey;
    const collectionIsEligible =
      userContext.subscriptionType !== SubscriptionType.Internal &&
      this.props.usageSizeInKB > oneTBinKB &&
      this.props.minimum >= usageInGB(this.props.usageSizeInKB) * minRUperGB;
    if (featureFlagEnabled || collectionIsEligible) {
      return (
        <Text>
          Need to scale below {this.props.minimum} RU/s? Reach out by filling{" "}
          <a target="_blank" rel="noreferrer" href={href}>
            this questionnaire
          </a>
          .
        </Text>
      );
    }
    return undefined;
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
        {this.overrideWithProvisionedThroughputSettings() && (
          <MessageBar
            messageBarIconProps={{ iconName: "InfoSolid", className: "messageBarInfoIcon" }}
            styles={messageBarStyles}
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
      </Stack>
    );
  };

  private onSpendAckChecked = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void =>
    this.setState({ spendAckChecked: checked });

  private thoughputRangeSeparatorStyles: Partial<ISeparatorStyles> = {
    root: [
      {
        selectors: {
          "::before": {
            backgroundColor: "rgb(200, 200, 200)",
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
    if (this.currentThroughputValue() > this.props.maximumThroughput) {
      return "requireSupport";
    }

    return "delayed";
  };

  private getRuThermometerStyles = (): Partial<IProgressIndicatorStyles> => ({
    progressBar: [
      {
        backgroundColor:
          this.getCurrentRuRange() === "instant"
            ? "rgb(0, 120, 212)"
            : this.getCurrentRuRange() === "delayed"
            ? "rgb(255 216 109)"
            : "rgb(251, 217, 203)",
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
        const adjustedMax = this.props.maximumThroughput - this.props.instantMaximumThroughput;
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
          <span>{this.props.minimum}</span>
        </Stack.Item>
        <Stack.Item style={{ width: "66%" }}>
          <span style={{ float: "left", transform: "translateX(-50%)" }}>{this.props.instantMaximumThroughput}</span>
          <span style={{ float: "right" }}>{this.props.maximumThroughput}</span>
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
        return (
          <Text style={{ fontSize: 14, color: "windowtext" }}>
            You are not able to lower throughput below your current minimum of {this.props.minimum} RU/s.
          </Text>
        );
      case "delayed":
        return getUpdateThroughputBeyondInstantLimitMessage(this.props.instantMaximumThroughput);
      case "requireSupport":
        return getUpdateThroughputBeyondSupportLimitMessage(
          this.props.instantMaximumThroughput,
          this.props.maximumThroughput
        );
      default:
        return <></>;
    }
  };

  private getThroughputWarningMessageBar = (): JSX.Element => {
    const isSevereWarning: boolean =
      this.currentThroughputValue() > this.props.maximumThroughput ||
      this.currentThroughputValue() < this.props.minimum;
    return (
      <MessageBar messageBarType={isSevereWarning ? MessageBarType.severeWarning : MessageBarType.warning}>
        {this.getThroughputWarningMessageText()}
      </MessageBar>
    );
  };

  private renderAutoPilotInput = (): JSX.Element => (
    <Stack horizontal>
      <Stack.Item style={{ width: "70%", maxWidth: "700px" }}>
        <Stack {...relaxedSpacingStackProps} style={{ paddingRight: "50px" }}>
          <Stack.Item>
            <TextField
              label="Maximum RU/s required by this resource"
              required
              type="number"
              id="autopilotInput"
              key="auto pilot throughput input"
              styles={getTextFieldStyles(this.props.maxAutoPilotThroughput, this.props.maxAutoPilotThroughputBaseline)}
              disabled={this.overrideWithProvisionedThroughputSettings()}
              step={AutoPilotUtils.autoPilotIncrementStep}
              value={
                this.overrideWithProvisionedThroughputSettings() ? "" : this.props.maxAutoPilotThroughput?.toString()
              }
              onChange={this.onAutoPilotThroughputChange}
              min={autoPilotThroughput1K}
              //errorMessage={this.props.throughputError}
              onGetErrorMessage={(value: string) => {
                const sanitizedValue = getSanitizedInputValue(value);
                return sanitizedValue % 1000
                  ? "Throughput value must be in increments of 1000"
                  : this.props.throughputError;
              }}
              validateOnLoad={false}
            />
          </Stack.Item>
          <Stack.Item>{this.getRUThermometer()}</Stack.Item>
          <Stack.Item>{this.showThroughputWarning() && this.getThroughputWarningMessageBar()}</Stack.Item>
          <Stack.Item>
            {/* CTODO: determine whether the component is for db vs container. Use appropriate name based on type and API. */}
            <Text>
              Based on usage, your container throughput will scale from{" "}
              <b>
                {AutoPilotUtils.getMinRUsBasedOnUserInput(this.props.maxAutoPilotThroughput)} RU/s (10% of max RU/s) -{" "}
                {this.props.maxAutoPilotThroughput} RU/s
              </b>
              <br />
            </Text>
          </Stack.Item>
          {!this.overrideWithProvisionedThroughputSettings() && (
            <Stack.Item>
              <Text>
                Estimate your required RU/s with
                <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
                  {` capacity calculator`} <FontIcon iconName="NavigateExternalInline" />
                </Link>
              </Text>
            </Stack.Item>
          )}
          <Stack.Item>{this.minRUperGBSurvey()}</Stack.Item>
          <Stack.Item>
            {this.props.spendAckVisible && (
              <Checkbox
                id="spendAckCheckBox"
                styles={noLeftPaddingCheckBoxStyle}
                label={this.props.spendAckText}
                checked={this.state.spendAckChecked}
                onChange={this.onSpendAckChecked}
              />
            )}
          </Stack.Item>
          <Stack.Item>
            {this.props.isFixed && (
              <p>When using a collection with fixed storage capacity, you can set up to 10,000 RU/s.</p>
            )}
          </Stack.Item>
        </Stack>
      </Stack.Item>
      <Stack.Item style={{ width: "30%", maxWidth: "300px" }}>
        {!this.props.isEmulator ? this.getRequestUnitsUsageCost() : <></>}
      </Stack.Item>
    </Stack>
  );

  private renderThroughputInput = (): JSX.Element => (
    <Stack horizontal>
      <Stack.Item style={{ width: "70%", maxWidth: "700px" }}>
        <Stack {...relaxedSpacingStackProps} style={{ paddingRight: "50px" }}>
          <Stack.Item>
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
          </Stack.Item>
          <Stack.Item>{this.getRUThermometer()}</Stack.Item>
          <Stack.Item>{this.showThroughputWarning() && this.getThroughputWarningMessageBar()}</Stack.Item>
          {this.state.exceedFreeTierThroughput && (
            <Stack.Item>
              <MessageBar
                messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
                styles={messageBarStyles}
              >
                {`Billing will apply if you provision more than ${SharedConstants.FreeTierLimits.RU} RU/s of manual throughput, or if the resource scales beyond ${SharedConstants.FreeTierLimits.RU} RU/s with autoscale.`}
              </MessageBar>
            </Stack.Item>
          )}
          {/* {this.props.getThroughputWarningMessage() && (
          <MessageBar
            messageBarIconProps={{ iconName: "InfoSolid", className: "messageBarInfoIcon" }}
            styles={messageBarStyles}
          >
            {this.props.getThroughputWarningMessage()}
          </MessageBar>
        )} */}
          <Stack.Item>
            <Text>
              Estimate your required throughput with
              <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
                {` capacity calculator`} <FontIcon iconName="NavigateExternalInline" />
              </Link>
            </Text>
          </Stack.Item>
          <Stack.Item>{this.minRUperGBSurvey()}</Stack.Item>
          {this.props.spendAckVisible && (
            <Stack.Item>
              <Checkbox
                id="spendAckCheckBox"
                styles={noLeftPaddingCheckBoxStyle}
                label={this.props.spendAckText}
                checked={this.state.spendAckChecked}
                onChange={this.onSpendAckChecked}
              />
            </Stack.Item>
          )}
          <Stack.Item>
            {this.props.isFixed && (
              <p>When using a collection with fixed storage capacity, you can set up to 10,000 RU/s.</p>
            )}
          </Stack.Item>
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

        {this.props.isAutoPilotSelected ? this.renderAutoPilotInput() : this.renderThroughputInput()}
      </Stack>
    );
  }
}
