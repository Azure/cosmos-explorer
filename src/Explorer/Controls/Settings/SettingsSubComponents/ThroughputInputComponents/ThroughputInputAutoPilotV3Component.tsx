import {
  Checkbox,
  ChoiceGroup,
  IChoiceGroupOption,
  Label,
  Link,
  MessageBar,
  MessageBarType,
  Stack,
  Text,
  TextField
} from "office-ui-fabric-react";
import React from "react";
import * as DataModels from "../../../../../Contracts/DataModels";
import * as AutoPilotUtils from "../../../../../Utils/AutoPilotUtils";
import {
  checkBoxAndInputStackProps,
  getAutoPilotV3SpendElement,
  getChoiceGroupStyles,
  getEstimatedAutoscaleSpendElement,
  getEstimatedSpendElement,
  getTextFieldStyles,
  getToolTipContainer,
  manualToAutoscaleDisclaimerElement,
  messageBarStyles,
  noLeftPaddingCheckBoxStyle,
  titleAndInputStackProps
} from "../../SettingsRenderUtils";
import { getSanitizedInputValue, IsComponentDirtyResult, isDirty } from "../../SettingsUtils";
import { ToolTipLabelComponent } from "../ToolTipLabelComponent";

export interface ThroughputInputAutoPilotV3Props {
  databaseAccount: DataModels.DatabaseAccount;
  serverId: string;
  throughput: number;
  throughputBaseline: number;
  onThroughputChange: (newThroughput: number) => void;
  minimum: number;
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
          if (!this.props.throughput || this.props.throughput < this.props.minimum) {
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
    this.throughputInputMaxValue = Number.MAX_SAFE_INTEGER;
    this.autoPilotInputMaxValue = Number.MAX_SAFE_INTEGER;
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

      {!this.props.isEmulator && this.getRequestUnitsUsageCost()}

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
