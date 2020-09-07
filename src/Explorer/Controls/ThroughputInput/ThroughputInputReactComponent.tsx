import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import React from "react";
import { StatefulValue } from "../StatefulValue";
import {
  Text,
  TextField,
  IChoiceGroupOption,
  ChoiceGroup,
  Checkbox,
  Dropdown,
  IDropdownStyles,
  IDropdownOption,
  DropdownMenuItemType,
  Stack,
  Label
} from "office-ui-fabric-react";
import {
  getTextFieldStyles,
  getToolTipContainer,
  spendAckCheckBoxStyle,
  checkBoxAndInputStackProps,
  titleAndInputStackProps
} from "../Settings/SettingsRenderUtils";
import { ToolTipLabelComponent } from "../Settings/SettingsSubComponents/ToolTipLabelComponent";

export interface ThroughputInputProps {
  throughput: StatefulValue<number>;
  setThroughput: (newThroughput: number) => void;
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
  showAsMandatory: boolean;
  isFixed: boolean;
  label: string;
  infoBubbleText?: string;
  canExceedMaximumValue?: boolean;
  cssClass?: string;
  setAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  isAutoPilotSelected: boolean;
  autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  selectedAutoPilotTier: DataModels.AutopilotTier;
  setAutoPilotTier: (setAutoPilotTier: DataModels.AutopilotTier) => void;
  autoPilotUsageCost: JSX.Element;
  showAutoPilot?: boolean;
}

interface ThroughputInputState {
  spendAckChecked: boolean;
  autoPilotTierOptions: IDropdownOption[];
}

export class ThroughputInputComponent extends React.Component<ThroughputInputProps, ThroughputInputState> {
  private static readonly defaultStep = 100;
  private static readonly zeroThroughput = 0;
  private step: number;
  private throughputChoiceOptions: IChoiceGroupOption[] = [
    { key: "true", text: "Autoscale" },
    { key: "false", text: "Manual" }
  ];
  private dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 300 } };

  public constructor(props: ThroughputInputProps) {
    super(props);
    this.state = {
      spendAckChecked: this.props.spendAckChecked,
      autoPilotTierOptions: undefined
    };
    this.step = this.props.step ?? ThroughputInputComponent.defaultStep;
  }

  componentDidMount(): void {
    this.updateAutoPilotTierOptions();
  }

  componentDidUpdate(): void {
    this.updateAutoPilotTierOptions();
  }

  private updateAutoPilotTierOptions = (): void => {
    if (this.state.autoPilotTierOptions === undefined && this.props.autoPilotTiersList) {
      const autoPilotTierOptions = [];
      autoPilotTierOptions.push({
        key: "Default",
        text: "Choose Max RU/s",
        itemType: DropdownMenuItemType.Header
      });
      this.props.autoPilotTiersList.map(autoPilotTier => {
        autoPilotTierOptions.push({ key: autoPilotTier.value, text: autoPilotTier.text });
      });
      this.setState({ autoPilotTierOptions: autoPilotTierOptions });
    }
  };

  private onThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    let newThroughput = parseInt(newValue);
    newThroughput = isNaN(newThroughput) ? ThroughputInputComponent.zeroThroughput : newThroughput;
    this.props.setThroughput(newThroughput);
  };

  private onChoiceGroupChange = (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void => {
    this.props.setAutoPilotSelected(option.key === "true");
  };

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
          className="settingsV2RadioButton"
          tabIndex={0}
          selectedKey={this.props.isAutoPilotSelected.toString()}
          options={this.throughputChoiceOptions}
          onChange={this.onChoiceGroupChange}
          required={this.props.showAsMandatory}
          ariaLabelledBy={labelId}
        />
      </div>
    );
  };

  private onAutoPilotTierChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    this.props.setAutoPilotTier(option.key as number);
  };

  private renderAutoPilotSelector = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <Dropdown
          id="autopilotSelector"
          className="autoPilotSelector"
          defaultSelectedKey={this.props.selectedAutoPilotTier}
          onChange={this.onAutoPilotTierChange}
          options={this.state.autoPilotTierOptions}
          styles={this.dropdownStyles}
        />
        <Text>{this.props.selectedAutoPilotTier && this.props.autoPilotUsageCost}</Text>
      </Stack>
    );
  };

  private onSpendAckChecked = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void => {
    this.setState({ spendAckChecked: checked });
  };

  private renderThroughputInput = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <TextField
          required
          type="number"
          id="throughputInput"
          key="provisioned throughput input"
          styles={getTextFieldStyles(this.props.throughput)}
          disabled={!this.props.isEnabled}
          step={this.step}
          min={this.props.minimum}
          max={this.props.canExceedMaximumValue ? undefined : this.props.maximum}
          value={this.props.throughput.current?.toString()}
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

        {this.props.isFixed && <Text>Choose unlimited storage capacity for more than 10,000 RU/s.</Text>}
      </Stack>
    );
  };

  public render(): JSX.Element {
    return (
      <Stack {...checkBoxAndInputStackProps}>
        {!this.props.isFixed && this.props.showAutoPilot && this.renderThroughputModeChoices()}

        {this.props.isAutoPilotSelected ? this.renderAutoPilotSelector() : this.renderThroughputInput()}
      </Stack>
    );
  }
}
