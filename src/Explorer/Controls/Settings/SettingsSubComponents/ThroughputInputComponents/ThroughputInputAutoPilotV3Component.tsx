import React from "react";
import * as AutoPilotUtils from "../../../../../Utils/AutoPilotUtils";
import {
  getTextFieldStyles,
  getToolTipContainer,
  spendAckCheckBoxStyle,
  titleAndInputStackProps,
  checkBoxAndInputStackProps,
  getChoiceGroupStyles,
  messageBarStyles,
  messageContainerStackTokens, messageStackStyle
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
import { isDirty } from "../../SettingsUtils";
import * as SharedConstants from "../../../../../Shared/Constants";

export interface ThroughputInputAutoPilotV3Props {
  throughput: number;
  throughputBaseline: number;
  onThroughputChange: (newThroughput: number) => void;
  minimum: number;
  maximum: number;
  step?: number;
  isEnabled?: boolean;
  requestUnitsUsageCost: JSX.Element;
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
  autoPilotUsageCost: JSX.Element;
  showAutoPilot?: boolean;
  overrideWithAutoPilotSettings: boolean;
  overrideWithProvisionedThroughputSettings: boolean;
  maxAutoPilotThroughput: number;
  maxAutoPilotThroughputBaseline: number;
  onMaxAutoPilotThroughputChange: (newThroughput: number) => void;
  hasProvisioningTypeChanged: () => boolean;
  onScaleSaveableChange: (isScaleSaveable: boolean) => void;
  onScaleDiscardableChange: (isScaleDiscardable: boolean) => void;
  getWarningMessage: () => JSX.Element;
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
  private static readonly zeroThroughput = 0;
  private step: number;
  private choiceGroupFixedStyle = getChoiceGroupStyles(undefined, undefined);
  private options: IChoiceGroupOption[] = [
    { key: "true", text: "Autoscale" },
    { key: "false", text: "Manual" }
  ];

  componentDidMount() {
    this.onComponentUpdate();
  }

  componentDidUpdate() {
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }

    if (this.props.isEnabled) {
      if (this.props.hasProvisioningTypeChanged()) {
        this.props.onScaleSaveableChange(true);
        this.props.onScaleDiscardableChange(true);
      } else if (this.props.isAutoPilotSelected) {
        if (isDirty(this.props.maxAutoPilotThroughput, this.props.maxAutoPilotThroughputBaseline)) {
          this.props.onScaleDiscardableChange(true);
        } else {
          this.props.onScaleDiscardableChange(false);
        }

        if (
          isDirty(this.props.maxAutoPilotThroughput, this.props.maxAutoPilotThroughputBaseline) &&
          AutoPilotUtils.isValidAutoPilotThroughput(this.props.maxAutoPilotThroughput)
        ) {
          this.props.onScaleSaveableChange(true);
        } else {
          this.props.onScaleSaveableChange(false);
        }
      } else {
        if (isDirty(this.props.throughput, this.props.throughputBaseline)) {
          this.props.onScaleDiscardableChange(true);
        } else {
          this.props.onScaleDiscardableChange(false);
        }

        if (
          !this.props.throughput ||
          this.props.throughput < this.props.minimum ||
          (this.props.throughput > this.props.maximum && (this.props.isEmulator || this.props.isFixed)) ||
          (this.props.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
            !this.props.canExceedMaximumValue)
        ) {
          this.props.onScaleSaveableChange(false);
        } else if (isDirty(this.props.throughput, this.props.throughputBaseline)) {
          this.props.onScaleSaveableChange(true);
        } else {
          this.props.onScaleSaveableChange(false);
        }
      }
    }

    this.shouldCheckComponentIsDirty = false;
  };

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
      <Stack horizontal tokens={messageContainerStackTokens}>
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
        {this.props.getWarningMessage() && (
          <Stack styles={messageStackStyle}>
            <MessageBar messageBarType={MessageBarType.warning} styles={messageBarStyles}>
              {this.props.getWarningMessage()}
            </MessageBar>
          </Stack>
        )}
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
        disabled={this.props.overrideWithProvisionedThroughputSettings}
        step={this.step}
        min={AutoPilotUtils.minAutoPilotThroughput}
        value={
          this.props.overrideWithProvisionedThroughputSettings ? "" : this.props.maxAutoPilotThroughput?.toString()
        }
        onChange={this.onAutoPilotThroughputChange}
      />
      {!this.props.overrideWithProvisionedThroughputSettings && this.props.autoPilotUsageCost}
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
        value={
          this.props.overrideWithAutoPilotSettings
            ? this.props.maxAutoPilotThroughputBaseline?.toString()
            : this.props.throughput?.toString()
        }
        onChange={this.onThroughputChange}
      />

      {!this.props.isEmulator && <Text>{this.props.requestUnitsUsageCost}</Text>}

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
