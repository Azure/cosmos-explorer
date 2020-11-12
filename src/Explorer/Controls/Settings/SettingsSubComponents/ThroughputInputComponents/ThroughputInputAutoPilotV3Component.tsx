import React from "react";
import * as AutoPilotUtils from "../../../../../Utils/AutoPilotUtils";
import {
  getTextFieldStyles,
  getToolTipContainer,
  noLeftPaddingCheckBoxStyle,
  titleAndInputStackProps,
  checkBoxAndInputStackProps,
  getChoiceGroupStyles,
  messageBarStyles,
  getEstimatedSpendElement,
  getEstimatedAutoscaleSpendElement,
  getAutoPilotV3SpendElement,
  manualToAutoscaleDisclaimerElement
} from "../../SettingsRenderUtils";
import {
  Text,
  TextField,
  ChoiceGroup,
  IChoiceGroupOption,
  Checkbox,
  Stack,
  Label,
  Link,
  MessageBar,
  MessageBarType
} from "office-ui-fabric-react";
import { ToolTipLabelComponent } from "../ToolTipLabelComponent";
import { getSanitizedInputValue, IsComponentDirtyResult, isDirty } from "../../SettingsUtils";
import * as SharedConstants from "../../../../../Shared/Constants";
import * as DataModels from "../../../../../Contracts/DataModels";
import { Int32 } from "../../../../Panes/Tables/Validators/EntityPropertyValidationCommon";
import { userContext } from "../../../../../UserContext";
import { SubscriptionType } from "../../../../../Contracts/SubscriptionType";
import { usageInGB } from "../../../../../Utils/PricingUtils";
import { Features } from "../../../../../Common/Constants";

export interface ThroughputInputAutoPilotV3Props {
  databaseAccount: DataModels.DatabaseAccount;
  serverId: string;
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
}

interface ThroughputInputAutoPilotV3State {
  spendAckChecked: boolean;
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
    { key: "false", text: "Manual" }
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
      spendAckChecked: this.props.spendAckChecked
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

    const serverId: string = this.props.serverId;
    const offerThroughput: number = this.props.throughput;

    const regions = account?.properties?.readLocations?.length || 1;
    const multimaster = account?.properties?.enableMultipleWriteLocations || false;

    let estimatedSpend: JSX.Element;

    if (!this.props.isAutoPilotSelected) {
      estimatedSpend = getEstimatedSpendElement(
        // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
        this.overrideWithAutoPilotSettings() ? this.props.maxAutoPilotThroughput : offerThroughput,
        serverId,
        regions,
        multimaster,
        false
      );
    } else {
      estimatedSpend = getEstimatedAutoscaleSpendElement(
        this.props.maxAutoPilotThroughput,
        serverId,
        regions,
        multimaster
      );
    }
    return estimatedSpend;
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
    const newThroughput = getSanitizedInputValue(newValue, this.autoPilotInputMaxValue);
    this.props.onMaxAutoPilotThroughputChange(newThroughput);
  };

  private onThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    const newThroughput = getSanitizedInputValue(newValue, this.throughputInputMaxValue);
    if (this.overrideWithAutoPilotSettings()) {
      this.props.onMaxAutoPilotThroughputChange(newThroughput);
    } else {
      this.props.onThroughputChange(newThroughput);
    }
  };

  private onChoiceGroupChange = (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void => this.props.onAutoPilotSelected(option.key === "true");

  private minRUperGBSurvey = (): JSX.Element => {
    const href = `https://ncv.microsoft.com/vRBTO37jmO?ctx={"AzureSubscriptionId":"${userContext.subscriptionId}","CosmosDBAccountName":"${userContext.databaseAccount?.name}"}`;
    const oneTBinKB = 1000000000;
    const minRUperGB = 10;
    const featureFlagEnabled = window.dataExplorer?.isFeatureEnabled(Features.showMinRUSurvey);
    const collectionIsEligable =
      userContext.subscriptionType !== SubscriptionType.Internal &&
      this.props.usageSizeInKB > oneTBinKB &&
      this.props.minimum >= usageInGB(this.props.usageSizeInKB) * minRUperGB;
    if (featureFlagEnabled || collectionIsEligable) {
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
          <MessageBar messageBarType={MessageBarType.warning} styles={messageBarStyles}>
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
      />
      {this.props.getThroughputWarningMessage() && (
        <MessageBar messageBarType={MessageBarType.warning} styles={messageBarStyles}>
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
      {this.props.isFixed && <p>When using a collection with fixed storage capacity, you can set up to 10,000 RU/s.</p>}
    </Stack>
  );

  public render(): JSX.Element {
    return (
      <Stack {...checkBoxAndInputStackProps}>
        {this.renderThroughputModeChoices()}

        {this.props.isAutoPilotSelected ? this.renderAutoPilotInput() : this.renderThroughputInput()}
      </Stack>
    );
  }
}
