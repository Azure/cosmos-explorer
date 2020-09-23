import * as DataModels from "../../../../../Contracts/DataModels";
import * as ViewModels from "../../../../../Contracts/ViewModels";
import React from "react";
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
  Label,
  MessageBar,
  MessageBarType
} from "office-ui-fabric-react";
import {
  getTextFieldStyles,
  getToolTipContainer,
  spendAckCheckBoxStyle,
  checkBoxAndInputStackProps,
  titleAndInputStackProps,
  getChoiceGroupStyles,
  messageBarStyles,
  messageContainerStackTokens, messageStackStyle
} from "../../SettingsRenderUtils";
import { ToolTipLabelComponent } from "../ToolTipLabelComponent";
import { isDirty } from "../../SettingsUtils";
import * as AutoPilotUtils from "../../../../../Utils/AutoPilotUtils";
import * as SharedConstants from "../../../../../Shared/Constants";

export interface ThroughputInputProps {
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
  showAsMandatory: boolean;
  isFixed: boolean;
  isEmulator: boolean;
  label: string;
  infoBubbleText?: string;
  canExceedMaximumValue?: boolean;
  cssClass?: string;
  onAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  isAutoPilotSelected: boolean;
  autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  selectedAutoPilotTier: DataModels.AutopilotTier;
  selectedAutoPilotTierBaseline: DataModels.AutopilotTier;
  onAutoPilotTierChange: (setAutoPilotTier: DataModels.AutopilotTier) => void;
  autoPilotUsageCost: JSX.Element;
  showAutoPilot?: boolean;
  hasProvisioningTypeChanged: () => boolean;
  onScaleSaveableChange: (isScaleSaveable: boolean) => void;
  onScaleDiscardableChange: (isScaleDiscardable: boolean) => void;
  getWarningMessage: () => JSX.Element;
}

interface ThroughputInputState {
  spendAckChecked: boolean;
  autoPilotTierOptions: IDropdownOption[];
}

export class ThroughputInputComponent extends React.Component<ThroughputInputProps, ThroughputInputState> {
  private shouldCheckComponentIsDirty = true;
  private static readonly defaultStep = 100;
  private static readonly zeroThroughput = 0;
  private step: number;
  private choiceGroupFixedStyle = getChoiceGroupStyles(undefined, undefined);
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

  componentDidMount() {
    this.onComponentUpdate();
  }

  componentDidUpdate() {
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
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

    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }

    if (this.props.isEnabled) {
      if (this.props.hasProvisioningTypeChanged()) {
        this.props.onScaleSaveableChange(true);
        this.props.onScaleDiscardableChange(true);
      } else if (this.props.isAutoPilotSelected) {
        if (isDirty(this.props.selectedAutoPilotTier, this.props.selectedAutoPilotTierBaseline)) {
          this.props.onScaleDiscardableChange(true);
        } else {
          this.props.onScaleDiscardableChange(false);
        }

        if (
          isDirty(this.props.selectedAutoPilotTier, this.props.selectedAutoPilotTierBaseline) &&
          AutoPilotUtils.isValidAutoPilotTier(this.props.selectedAutoPilotTier)
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

  private onThroughputChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    let newThroughput = parseInt(newValue);
    newThroughput = isNaN(newThroughput) ? ThroughputInputComponent.zeroThroughput : newThroughput;
    this.props.onThroughputChange(newThroughput);
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
            options={this.throughputChoiceOptions}
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

  private onAutoPilotTierChange = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void =>
    this.props.onAutoPilotTierChange(option.key as number);

  private renderAutoPilotSelector = (): JSX.Element => (
    <Stack {...titleAndInputStackProps}>
      <Dropdown
        id="autopilotSelector"
        className="autoPilotSelector"
        selectedKey={this.props.selectedAutoPilotTier}
        onChange={this.onAutoPilotTierChange}
        options={this.state.autoPilotTierOptions}
        styles={this.dropdownStyles}
      />
      <Text>{this.props.selectedAutoPilotTier && this.props.autoPilotUsageCost}</Text>
    </Stack>
  );

  private onSpendAckChecked = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void =>
    this.setState({ spendAckChecked: checked });

  private renderThroughputInput = (): JSX.Element => (
    <Stack {...titleAndInputStackProps}>
      <TextField
        required
        type="number"
        id="throughputInput"
        key="provisioned throughput input"
        styles={getTextFieldStyles(this.props.throughput, this.props.throughputBaseline)}
        disabled={!this.props.isEnabled}
        step={this.step}
        min={this.props.minimum}
        max={this.props.canExceedMaximumValue ? undefined : this.props.maximum}
        value={this.props.throughput?.toString()}
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

      {this.props.isFixed && <Text>Choose unlimited storage capacity for more than 10,000 RU/s.</Text>}
    </Stack>
  );

  public render(): JSX.Element {
    return (
      <Stack {...checkBoxAndInputStackProps}>
        {!this.props.isFixed && this.props.showAutoPilot && this.renderThroughputModeChoices()}

        {this.props.isAutoPilotSelected ? this.renderAutoPilotSelector() : this.renderThroughputInput()}
      </Stack>
    );
  }
}
