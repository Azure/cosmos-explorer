import React from "react";
import * as AutoPilotUtils from "../../../../../Utils/AutoPilotUtils";
import {
  getTextFieldStyles,
  getToolTipContainer,
  spendAckCheckBoxStyle,
  titleAndInputStackProps,
  checkBoxAndInputStackProps,
  getChoiceGroupStyles
} from "../../SettingsRenderUtils";
import { Text, TextField, ChoiceGroup, IChoiceGroupOption, Checkbox, Stack, Label, Link } from "office-ui-fabric-react";
import { ToolTipLabelComponent } from "../ToolTipLabelComponent";

export interface ThroughputInputAutoPilotV3Props {
  throughput: number;
  throughputBaseline: number;
  onThroughputChange: (newThroughput: number) => void;
  minimum: number;
  maximum: number;
  step?: number;
  isEnabled?: boolean;
  costsVisible: boolean;
  requestUnitsUsageCost: JSX.Element;
  spendAckChecked?: boolean;
  spendAckId?: string;
  spendAckText?: string;
  spendAckVisible?: boolean;
  showAsMandatory?: boolean;
  isFixed?: boolean;
  label: string;
  infoBubbleText?: string;
  canExceedMaximumValue?: boolean;
  onAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  isAutoPilotSelected: boolean;
  autoPilotUsageCost: JSX.Element;
  showAutoPilot?: boolean;
  overrideWithAutoPilotSettings: boolean;
  overrideWithProvisionedThroughputSettings: boolean;
  maxAutoPilotThroughput: number;
  maxAutoPilotThroughputBaseline: number;
  onMaxAutoPilotThroughputChange: (newThroughput: number) => void;
}

interface ThroughputInputAutoPilotV3State {
  spendAckChecked: boolean;
}

export class ThroughputInputAutoPilotV3Component extends React.Component<
  ThroughputInputAutoPilotV3Props,
  ThroughputInputAutoPilotV3State
> {
  private static readonly defaultStep = 100;
  private static readonly zeroThroughput = 0;
  private step: number;
  private choiceGroupFixedStyle = getChoiceGroupStyles(undefined, undefined);
  private options: IChoiceGroupOption[] = [
    { key: "true", text: "Autoscale" },
    { key: "false", text: "Manual" }
  ];

  public constructor(props: ThroughputInputAutoPilotV3Props) {
    super(props);
    this.state = {
      spendAckChecked: this.props.spendAckChecked
    };

    this.step = this.props.step ?? ThroughputInputAutoPilotV3Component.defaultStep;
  }

  private onAutoPilotThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    let newThroughput = parseInt(newValue);
    newThroughput = isNaN(newThroughput) ? ThroughputInputAutoPilotV3Component.zeroThroughput : newThroughput;
    this.props.onMaxAutoPilotThroughputChange(newThroughput);
  };

  private onThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    let newThroughput = parseInt(newValue);
    newThroughput = isNaN(newThroughput) ? ThroughputInputAutoPilotV3Component.zeroThroughput : newThroughput;

    if (this.props.overrideWithAutoPilotSettings) {
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
      <div>
        <Label id={labelId}>
          <ToolTipLabelComponent
            label={this.props.label}
            toolTipElement={getToolTipContainer(this.props.infoBubbleText)}
          />
        </Label>
        <ChoiceGroup
          tabIndex={0}
          selectedKey={this.props.isAutoPilotSelected.toString()}
          options={this.options}
          onChange={this.onChoiceGroupChange}
          required={this.props.showAsMandatory}
          ariaLabelledBy={labelId}
          styles={this.choiceGroupFixedStyle}
        />
      </div>
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
        disabled={this.props.overrideWithProvisionedThroughputSettings}
        step={this.step}
        min={AutoPilotUtils.minAutoPilotThroughput}
        value={
          this.props.overrideWithProvisionedThroughputSettings ? "" : this.props.maxAutoPilotThroughput?.toString()
        }
        onChange={this.onAutoPilotThroughputChange}
      />
      {!this.props.overrideWithProvisionedThroughputSettings && <Text>{this.props.autoPilotUsageCost}</Text>}
      {this.props.costsVisible && !this.props.overrideWithProvisionedThroughputSettings && (
        <Text>{this.props.requestUnitsUsageCost}</Text>
      )}

      {this.props.spendAckVisible && (
        <Checkbox
          id="spendAckCheckBox"
          styles={spendAckCheckBoxStyle}
          label={this.props.spendAckText}
          checked={this.state.spendAckChecked}
          onChange={this.onSpendAckChecked}
        />
      )}
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
        disabled={this.props.overrideWithAutoPilotSettings}
        step={this.step}
        min={this.props.minimum}
        max={this.props.canExceedMaximumValue ? undefined : this.props.maximum}
        value={this.props.throughput?.toString()}
        onChange={this.onThroughputChange}
      />

      {this.props.costsVisible && <Text>{this.props.requestUnitsUsageCost}</Text>}

      {this.props.spendAckVisible && (
        <Checkbox
          id="spendAckCheckBox"
          styles={spendAckCheckBoxStyle}
          label={this.props.spendAckText}
          checked={this.state.spendAckChecked}
          onChange={this.onSpendAckChecked}
        />
      )}

      {this.props.isFixed && <p>Choose unlimited storage capacity for more than 10,000 RU/s.</p>}
    </Stack>
  );

  public render(): JSX.Element {
    return (
      <Stack {...checkBoxAndInputStackProps}>
        {!this.props.isFixed && this.props.showAutoPilot && this.renderThroughputModeChoices()}

        {this.props.isAutoPilotSelected ? this.renderAutoPilotInput() : this.renderThroughputInput()}
      </Stack>
    );
  }
}
