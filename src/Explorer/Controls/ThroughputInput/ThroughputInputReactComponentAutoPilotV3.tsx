import React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import { StatefulValue, isDirty } from "../Settings/SettingsUtils";

export interface ThroughputInputAutoPilotV3Props {
  throughput: StatefulValue<number>;
  setThroughput: (newThroughput: number) => void;
  testId: string;
  ariaLabel?: string;
  minimum: number;
  maximum: number;
  step?: number;
  isEnabled?: boolean;
  costsVisible: boolean;
  requestUnitsUsageCost: string;
  spendAckChecked?: boolean;
  spendAckId?: string;
  spendAckText?: string;
  spendAckVisible?: boolean;
  showAsMandatory?: boolean;
  isFixed?: boolean;
  label: string;
  infoBubbleText?: string;
  canExceedMaximumValue?: boolean;
  cssClass?: string;
  setAutoPilotSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAutoPilotSelected: boolean;
  throughputAutoPilotRadioId: string;
  throughputProvisionedRadioId: string;
  throughputModeRadioName: string;
  autoPilotUsageCost: string;
  showAutoPilot?: boolean;
  overrideWithAutoPilotSettings: boolean;
  overrideWithProvisionedThroughputSettings: boolean;
  maxAutoPilotThroughput: number;
  setMaxAutoPilotThroughput: (newThroughput: number) => void;
}

interface ThroughputInputState {
  spendAckChecked: boolean;
  step: number;
}

export class ThroughputInputAutoPilotV3Component extends React.Component<
  ThroughputInputAutoPilotV3Props,
  ThroughputInputState
> {
  private defaultStep = 100;

  public constructor(props: ThroughputInputAutoPilotV3Props) {
    super(props);
    this.state = {
      spendAckChecked: this.props.spendAckChecked,
      step: this.props.step ? this.props.step : this.defaultStep
    };
  }

  private onAutoPilotThroughputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let newThroughput = parseInt(e.currentTarget.value);
    newThroughput = isNaN(newThroughput) ? 0 : newThroughput;
    this.props.setMaxAutoPilotThroughput(newThroughput);
  };

  private onThroughputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let newThroughput = parseInt(e.currentTarget.value);
    newThroughput = isNaN(newThroughput) ? 0 : newThroughput;

    if (this.props.overrideWithAutoPilotSettings) {
      this.props.setMaxAutoPilotThroughput(newThroughput);
    } else {
      this.props.setThroughput(newThroughput);
    }
  };

  public render(): JSX.Element {
    return (
      <div>
        <div>
          <p className="pkPadding">
            {this.props.showAsMandatory && <span className="mandatoryStar">*</span>}

            <span>{this.props.label}</span>

            {this.props.infoBubbleText && (
              <span className="infoTooltip" role="tooltip" tabIndex={0}>
                <img className="infoImg" src="../../../../images/info-bubble.svg" alt="More information" />
                <span className="tooltiptext throughputRuInfo">{this.props.infoBubbleText}</span>
              </span>
            )}
          </p>
        </div>

        {!this.props.isFixed && this.props.showAutoPilot && (
          <div className="throughputModeContainer">
            <input
              className="throughputModeRadio"
              aria-label="Autopilot mode"
              type="radio"
              role="radio"
              tabIndex={0}
              value="true"
              checked={this.props.isAutoPilotSelected}
              onChange={this.props.setAutoPilotSelected}
              id={this.props.throughputAutoPilotRadioId}
              name={this.props.throughputModeRadioName}
              aria-checked={this.props.isAutoPilotSelected}
            />
            <label className="throughputModeSpace" htmlFor={this.props.throughputAutoPilotRadioId}>
              Autoscale
            </label>

            <input
              className="throughputModeRadio nonFirstRadio"
              aria-label="Provisioned Throughput mode"
              type="radio"
              role="radio"
              value="false"
              checked={!this.props.isAutoPilotSelected}
              tabIndex={0}
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
            <p>
              <span>
                Provision maximum RU/s required by this resource. Estimate your required RU/s with
                {/* eslint-disable-next-line react/jsx-no-target-blank*/}
                <a target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
                  {` capacity calculator`}
                </a>
                .
              </span>
            </p>
            <p>
              <span>Max RU/s</span>
            </p>
            <input
              key="auto pilot throughput input"
              value={
                this.props.overrideWithProvisionedThroughputSettings
                  ? ""
                  : this.props.maxAutoPilotThroughput === 0
                  ? ""
                  : this.props.maxAutoPilotThroughput
              }
              onChange={this.onAutoPilotThroughputChange}
              disabled={this.props.overrideWithProvisionedThroughputSettings}
              className={`migration collid select-font-size`}
              step={this.state.step}
              type="number"
              required
              min={AutoPilotUtils.minAutoPilotThroughput}
              aria-label={this.props.ariaLabel}
            />
            {!this.props.overrideWithProvisionedThroughputSettings && (
              <p>
                <span dangerouslySetInnerHTML={{ __html: this.props.autoPilotUsageCost }}></span>
              </p>
            )}
            {this.props.costsVisible && !this.props.overrideWithProvisionedThroughputSettings && (
              <p>
                <span dangerouslySetInnerHTML={{ __html: this.props.requestUnitsUsageCost }}></span>
              </p>
            )}

            {this.props.spendAckVisible && (
              <p className="pkPadding">
                <input
                  type="checkbox"
                  aria-label="acknowledge spend throughput"
                  title={this.props.spendAckText}
                  id={this.props.spendAckId}
                  checked={this.props.spendAckChecked}
                  onChange={e => {
                    this.setState({ spendAckChecked: e.currentTarget.value === "true" });
                  }}
                />
                <label htmlFor={this.props.spendAckId}>{this.props.spendAckText}</label>
              </p>
            )}
          </>
        )}

        {!this.props.isAutoPilotSelected && (
          <>
            <input
              key="provisioned throughput input"
              onChange={this.onThroughputChange}
              value={this.props.throughput.current === 0 ? "" : this.props.throughput.current}
              className={`${this.props.cssClass} ${isDirty(this.props.throughput) ? "dirty" : ""}`}
              disabled={this.props.overrideWithAutoPilotSettings}
              type="number"
              required
              data-test={this.props.testId}
              step={this.state.step}
              min={this.props.minimum}
              max={this.props.canExceedMaximumValue ? undefined : this.props.maximum}
              aria-label={this.props.ariaLabel}
            />

            {this.props.costsVisible && (
              <p>
                <span dangerouslySetInnerHTML={{ __html: this.props.requestUnitsUsageCost }}></span>
              </p>
            )}

            {this.props.spendAckVisible && (
              <p className="pkPadding">
                <input
                  type="checkbox"
                  aria-label="acknowledge spend throughput"
                  title={this.props.spendAckText}
                  id={this.props.spendAckId}
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
