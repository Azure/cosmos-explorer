import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import React from "react";
import { StatefulValue, isDirty } from "../Settings/SettingsUtils";

export interface ThroughputInputProps {
  throughput: StatefulValue<number>;
  setThroughput: (newThroughput: number) => void;
  testId: string;
  ariaLabel?: string;
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
  setAutoPilotSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAutoPilotSelected: boolean;
  throughputAutoPilotRadioId: string;
  throughputProvisionedRadioId: string;
  throughputModeRadioName: string;
  autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  selectedAutoPilotTier: DataModels.AutopilotTier;
  setAutoPilotTier: (setAutoPilotTier: DataModels.AutopilotTier) => void;
  autoPilotUsageCost: JSX.Element;
  showAutoPilot?: boolean;
}

interface ThroughputInputState {
  spendAckChecked: boolean;
}

export class ThroughputInputComponent extends React.Component<ThroughputInputProps, ThroughputInputState> {
  private static readonly defaultStep = 100;
  private static readonly zeroThroughput = 0;
  private cssClass: string;
  private step: number;

  public constructor(props: ThroughputInputProps) {
    super(props);
    this.state = {
      spendAckChecked: this.props.spendAckChecked
    };
    this.step = this.props.step ?? ThroughputInputComponent.defaultStep;
    this.cssClass = this.props.cssClass || "textfontclr collid";
  }

  private onThroughputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let newThroughput = parseInt(e.currentTarget.value);
    newThroughput = isNaN(newThroughput) ? ThroughputInputComponent.zeroThroughput : newThroughput;
    this.props.setThroughput(newThroughput);
  };

  public render(): JSX.Element {
    return (
      <div>
        <p className="pkPadding">
          {this.props.showAsMandatory && <span className="mandatoryStar">*</span>}

          <span className="addCollectionLabel">{this.props.label}</span>

          {this.props.infoBubbleText && (
            <span className="infoTooltip" role="tooltip" tabIndex={0}>
              <img className="infoImg" src="../../../../images/info-bubble.svg" alt="More information" />
              <span className="tooltiptext throughputRuInfo">{this.props.infoBubbleText}</span>
            </span>
          )}
        </p>

        {!this.props.isFixed && this.props.showAutoPilot && (
          <div className="throughputModeContainer">
            <input
              className="throughputModeRadio"
              aria-label="Autopilot mode"
              data-test="throughput-autoPilot"
              type="radio"
              role="radio"
              value="true"
              tabIndex={0}
              checked={this.props.isAutoPilotSelected}
              onChange={this.props.setAutoPilotSelected}
              id={this.props.throughputAutoPilotRadioId}
              name={this.props.throughputModeRadioName}
              aria-checked={this.props.isAutoPilotSelected}
            />
            <label className="throughputModeSpace" htmlFor={this.props.throughputAutoPilotRadioId}>
              Autopilot (preview)
            </label>

            <input
              className="throughputModeRadio nonFirstRadio"
              aria-label="Provisioned Throughput mode"
              type="radio"
              role="radio"
              value="false"
              tabIndex={0}
              checked={!this.props.isAutoPilotSelected}
              onChange={this.props.setAutoPilotSelected}
              id={this.props.throughputProvisionedRadioId}
              name={this.props.throughputModeRadioName}
              aria-checked={!this.props.isAutoPilotSelected}
            />
            <label className="throughputModeSpace" htmlFor={this.props.throughputProvisionedRadioId}>
              Manual
            </label>
          </div>
        )}

        {this.props.isAutoPilotSelected && (
          <>
            <select
              id="autopilotSelector"
              name="autoPilotTiers"
              className="collid select-font-size"
              aria-label="Autopilot Max RU/s"
              value={this.props.selectedAutoPilotTier.toString()}
              onChange={e => {
                this.props.setAutoPilotTier(parseInt(e.currentTarget.value));
              }}
            >
              <option value="default" disabled>
                Choose Max RU/s
              </option>
              {this.props.autoPilotTiersList.map(autoPilotTier => {
                return (
                  <option key={autoPilotTier.value} value={autoPilotTier.value}>
                    {autoPilotTier.text}
                  </option>
                );
              })}
            </select>
            <p>{this.props.selectedAutoPilotTier && this.props.autoPilotUsageCost}</p>
          </>
        )}

        {!this.props.isAutoPilotSelected && (
          <>
            <p className="addContainerThroughputInput">
              <input
                id="throughputInput"
                type="number"
                required
                key="provisioned throughput input"
                onChange={this.onThroughputChange}
                value={this.props.throughput.current === 0 ? "" : this.props.throughput.current}
                className={`${this.cssClass} ${isDirty(this.props.throughput) ? "dirty" : ""}`}
                disabled={!this.props.isEnabled}
                data-test={this.props.testId}
                step={this.step}
                min={this.props.minimum}
                max={this.props.canExceedMaximumValue ? undefined : this.props.maximum}
                aria-label={this.props.ariaLabel}
              />
            </p>

            {this.props.costsVisible && <p>{this.props.requestUnitsUsageCost}</p>}

            {this.props.spendAckVisible && (
              <p className="pkPadding">
                <input
                  checked={this.props.spendAckChecked}
                  onChange={e => {
                    this.setState({ spendAckChecked: e.currentTarget.value === "true" });
                  }}
                />
                <label htmlFor={this.props.spendAckId}>{this.props.spendAckText}</label>
              </p>
            )}

            {this.props.isFixed && <p>Choose unlimited storage capacity for more than 10,000 RU/s.</p>}
          </>
        )}
      </div>
    );
  }
}
