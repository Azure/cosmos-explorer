import { mergeStyleSets } from "@fluentui/merge-styles";
import {
  Checkbox,
  ChoiceGroup,
  FontIcon,
  IChoiceGroupOption,
  IColumn,
  Label,
  Link,
  MessageBar,
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
  AutoscaleEstimatedSpendingDisplayProps,
  checkBoxAndInputStackProps,
  getAutoPilotV3SpendElement,
  getChoiceGroupStyles,
  getEstimatedSpendingElement,
  getRuPriceBreakdown,
  getTextFieldStyles,
  getToolTipContainer,
  ManualEstimatedSpendingDisplayProps,
  manualToAutoscaleDisclaimerElement,
  messageBarStyles,
  noLeftPaddingCheckBoxStyle,
  PriceBreakdown,
  saveThroughputWarningMessage,
  titleAndInputStackProps,
  transparentDetailsHeaderStyle,
} from "../../SettingsRenderUtils";
import { getSanitizedInputValue, IsComponentDirtyResult, isDirty } from "../../SettingsUtils";
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
    const estimatedSpendingColumns: IColumn[] = [
      {
        key: "costType",
        name: "",
        fieldName: "costType",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        styles: transparentDetailsHeaderStyle,
      },
      {
        key: "minPerMonth",
        name: "Min Per Month",
        fieldName: "minPerMonth",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        styles: transparentDetailsHeaderStyle,
      },
      {
        key: "maxPerMonth",
        name: "Max Per Month",
        fieldName: "maxPerMonth",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        styles: transparentDetailsHeaderStyle,
      },
    ];
    const estimatedSpendingItems: AutoscaleEstimatedSpendingDisplayProps[] = [
      {
        costType: <Text>Current Cost</Text>,
        minPerMonth: (
          <Text>
            {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice / 10)}
          </Text>
        ),
        maxPerMonth: (
          <Text>
            {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice)}
          </Text>
        ),
      },
    ];

    if (newThroughput) {
      const newPrices: PriceBreakdown = getRuPriceBreakdown(
        newThroughput,
        serverId,
        numberOfRegions,
        isMultimaster,
        true
      );
      estimatedSpendingItems.unshift({
        costType: (
          <Text>
            <b>Updated Cost</b>
          </Text>
        ),
        minPerMonth: (
          <Text>
            <b>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice / 10)}
            </b>
          </Text>
        ),
        maxPerMonth: (
          <Text>
            <b>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice)}
            </b>
          </Text>
        ),
      });
    }

    return getEstimatedSpendingElement(
      estimatedSpendingColumns,
      estimatedSpendingItems,
      newThroughput ?? throughput,
      numberOfRegions,
      prices,
      true
    );
  };

  private getEstimatedManualSpendElement = (
    throughput: number,
    serverId: string,
    numberOfRegions: number,
    isMultimaster: boolean,
    newThroughput?: number
  ): JSX.Element => {
    const prices: PriceBreakdown = getRuPriceBreakdown(throughput, serverId, numberOfRegions, isMultimaster, false);
    const estimatedSpendingColumns: IColumn[] = [
      {
        key: "costType",
        name: "",
        fieldName: "costType",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        styles: transparentDetailsHeaderStyle,
      },
      {
        key: "hourly",
        name: "Hourly",
        fieldName: "hourly",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        styles: transparentDetailsHeaderStyle,
      },
      {
        key: "daily",
        name: "Daily",
        fieldName: "daily",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        styles: transparentDetailsHeaderStyle,
      },
      {
        key: "monthly",
        name: "Monthly",
        fieldName: "monthly",
        minWidth: 100,
        maxWidth: 200,
        isResizable: true,
        styles: transparentDetailsHeaderStyle,
      },
    ];
    const estimatedSpendingItems: ManualEstimatedSpendingDisplayProps[] = [
      {
        costType: <Text>Current Cost</Text>,
        hourly: (
          <Text>
            {prices.currencySign} {calculateEstimateNumber(prices.hourlyPrice)}
          </Text>
        ),
        daily: (
          <Text>
            {prices.currencySign} {calculateEstimateNumber(prices.dailyPrice)}
          </Text>
        ),
        monthly: (
          <Text>
            {prices.currencySign} {calculateEstimateNumber(prices.monthlyPrice)}
          </Text>
        ),
      },
    ];

    if (newThroughput) {
      const newPrices: PriceBreakdown = getRuPriceBreakdown(
        newThroughput,
        serverId,
        numberOfRegions,
        isMultimaster,
        false
      );
      estimatedSpendingItems.unshift({
        costType: (
          <Text>
            <b>Updated Cost</b>
          </Text>
        ),
        hourly: (
          <Text>
            <b>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.hourlyPrice)}
            </b>
          </Text>
        ),
        daily: (
          <Text>
            <b>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.dailyPrice)}
            </b>
          </Text>
        ),
        monthly: (
          <Text>
            <b>
              {newPrices.currencySign} {calculateEstimateNumber(newPrices.monthlyPrice)}
            </b>
          </Text>
        ),
      });
    }

    return getEstimatedSpendingElement(
      estimatedSpendingColumns,
      estimatedSpendingItems,
      newThroughput ?? throughput,
      numberOfRegions,
      prices,
      false
    );
  };

  private getAutoPilotUsageCost = (): JSX.Element => {
    if (!this.props.maxAutoPilotThroughput) {
      return <></>;
    }
    return getAutoPilotV3SpendElement(
      this.props.maxAutoPilotThroughput,
      false /* isDatabaseThroughput */,
      !this.props.isEmulator ? this.getRequestUnitsUsageCost() : <></>
    );
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
          styles={getChoiceGroupStyles(this.props.wasAutopilotOriginallySet, this.props.isAutoPilotSelected)}
        />
      </Stack>
    );
  };

  private onSpendAckChecked = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void =>
    this.setState({ spendAckChecked: checked });

  private renderAutoPilotInput = (): JSX.Element => (
    <>
      <Text>
        Provision maximum RU/s required by this resource. Estimate your required RU/s with
        <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
          {` capacity calculator`}
        </Link>
      </Text>
      <TextField
        label="Max RU/s"
        required
        type="number"
        id="autopilotInput"
        key="auto pilot throughput input"
        styles={getTextFieldStyles(this.props.maxAutoPilotThroughput, this.props.maxAutoPilotThroughputBaseline)}
        disabled={this.overrideWithProvisionedThroughputSettings()}
        step={AutoPilotUtils.autoPilotIncrementStep}
        value={this.overrideWithProvisionedThroughputSettings() ? "" : this.props.maxAutoPilotThroughput?.toString()}
        onChange={this.onAutoPilotThroughputChange}
        min={autoPilotThroughput1K}
        errorMessage={this.props.throughputError}
      />
      {!this.overrideWithProvisionedThroughputSettings() && this.getAutoPilotUsageCost()}
      {this.minRUperGBSurvey()}
      {this.props.spendAckVisible && (
        <Checkbox
          id="spendAckCheckBox"
          styles={noLeftPaddingCheckBoxStyle}
          label={this.props.spendAckText}
          checked={this.state.spendAckChecked}
          onChange={this.onSpendAckChecked}
        />
      )}
      {this.props.isFixed && <p>When using a collection with fixed storage capacity, you can set up to 10,000 RU/s.</p>}
    </>
  );

  private renderThroughputInput = (): JSX.Element => (
    <Stack {...titleAndInputStackProps}>
      <Text>
        Estimate your required throughput with
        <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
          {` capacity calculator`} <FontIcon iconName="NavigateExternalInline" />
        </Link>
      </Text>
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
      {this.state.exceedFreeTierThroughput && (
        <MessageBar
          messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
          styles={messageBarStyles}
        >
          {`Billing will apply if you provision more than ${SharedConstants.FreeTierLimits.RU} RU/s of manual throughput, or if the resource scales beyond ${SharedConstants.FreeTierLimits.RU} RU/s with autoscale.`}
        </MessageBar>
      )}
      {this.props.getThroughputWarningMessage() && (
        <MessageBar
          messageBarIconProps={{ iconName: "InfoSolid", className: "messageBarInfoIcon" }}
          styles={messageBarStyles}
        >
          {this.props.getThroughputWarningMessage()}
        </MessageBar>
      )}
      {!this.props.isEmulator && this.getRequestUnitsUsageCost()}
      {this.minRUperGBSurvey()}
      {this.props.spendAckVisible && (
        <Checkbox
          id="spendAckCheckBox"
          styles={noLeftPaddingCheckBoxStyle}
          label={this.props.spendAckText}
          checked={this.state.spendAckChecked}
          onChange={this.onSpendAckChecked}
        />
      )}
      <br />
      {this.props.isFixed && <p>When using a collection with fixed storage capacity, you can set up to 10,000 RU/s.</p>}
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
           <MessageBar messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }} role="alert">
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
