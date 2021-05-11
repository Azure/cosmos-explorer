import { Checkbox, DirectionalHint, Icon, Link, Stack, Text, TextField, TooltipHost } from "@fluentui/react";
import React from "react";
import * as Constants from "../../../Common/Constants";
import * as SharedConstants from "../../../Shared/Constants";
import { userContext } from "../../../UserContext";
import { getCollectionName } from "../../../Utils/APITypeUtils";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../../Utils/PricingUtils";

export interface ThroughputInputProps {
  isDatabase: boolean;
  isSharded: boolean;
  showFreeTierExceedThroughputTooltip: boolean;
  setThroughputValue: (throughput: number) => void;
  setIsAutoscale: (isAutoscale: boolean) => void;
  onCostAcknowledgeChange: (isAcknowledged: boolean) => void;
}

export interface ThroughputInputState {
  isAutoscaleSelected: boolean;
  throughput: number;
  isCostAcknowledged: boolean;
  throughputError: string;
}

export class ThroughputInput extends React.Component<ThroughputInputProps, ThroughputInputState> {
  constructor(props: ThroughputInputProps) {
    super(props);

    this.state = {
      isAutoscaleSelected: true,
      throughput: AutoPilotUtils.minAutoPilotThroughput,
      isCostAcknowledged: false,
      throughputError: undefined,
    };

    this.props.setThroughputValue(AutoPilotUtils.minAutoPilotThroughput);
    this.props.setIsAutoscale(true);
  }

  render(): JSX.Element {
    return (
      <div className="throughputInputContainer throughputInputSpacing">
        <Stack horizontal>
          <span className="mandatoryStar">*&nbsp;</span>
          <Text variant="small" style={{ lineHeight: "20px", fontWeight: 600 }}>
            {this.getThroughputLabelText()}
          </Text>
          <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={PricingUtils.getRuToolTipText()}>
            <Icon iconName="Info" className="panelInfoIcon" />
          </TooltipHost>
        </Stack>

        <Stack horizontal verticalAlign="center">
          <input
            className="throughputInputRadioBtn"
            aria-label="Autoscale mode"
            checked={this.state.isAutoscaleSelected}
            type="radio"
            tabIndex={0}
            onChange={this.onAutoscaleRadioBtnChange.bind(this)}
          />
          <span className="throughputInputRadioBtnLabel">Autoscale</span>

          <input
            className="throughputInputRadioBtn"
            aria-label="Manual mode"
            checked={!this.state.isAutoscaleSelected}
            type="radio"
            tabIndex={0}
            onChange={this.onManualRadioBtnChange.bind(this)}
          />
          <span className="throughputInputRadioBtnLabel">Manual</span>
        </Stack>

        {this.state.isAutoscaleSelected && (
          <Stack className="throughputInputSpacing">
            <Text variant="small">
              Estimate your required RU/s with&nbsp;
              <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
                capacity calculator
              </Link>
              .
            </Text>

            <Stack horizontal>
              <Text variant="small" style={{ lineHeight: "20px", fontWeight: 600 }}>
                {this.props.isDatabase ? "Database" : getCollectionName()} max RU/s
              </Text>
              <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={this.getAutoScaleTooltip()}>
                <Icon iconName="Info" className="panelInfoIcon" />
              </TooltipHost>
            </Stack>

            <TextField
              type="number"
              styles={{
                fieldGroup: { width: 300, height: 27 },
                field: { fontSize: 12 },
              }}
              onChange={(event, newInput?: string) => this.onThroughputValueChange(newInput)}
              step={AutoPilotUtils.autoPilotIncrementStep}
              min={AutoPilotUtils.minAutoPilotThroughput}
              value={this.state.throughput.toString()}
              aria-label="Max request units per second"
              errorMessage={this.state.throughputError}
            />

            <Text variant="small">
              Your {this.props.isDatabase ? "database" : getCollectionName().toLocaleLowerCase()} throughput will
              automatically scale from{" "}
              <b>
                {AutoPilotUtils.getMinRUsBasedOnUserInput(this.state.throughput)} RU/s (10% of max RU/s) -{" "}
                {this.state.throughput} RU/s
              </b>{" "}
              based on usage.
            </Text>
          </Stack>
        )}

        {!this.state.isAutoscaleSelected && (
          <Stack className="throughputInputSpacing">
            <Text variant="small">
              Estimate your required RU/s with&nbsp;
              <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/">
                capacity calculator
              </Link>
              .
            </Text>

            <TooltipHost
              directionalHint={DirectionalHint.topLeftEdge}
              content={
                this.props.showFreeTierExceedThroughputTooltip &&
                this.state.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs400
                  ? "The first 400 RU/s in this account are free. Billing will apply to any throughput beyond 400 RU/s."
                  : undefined
              }
            >
              <TextField
                type="number"
                styles={{
                  fieldGroup: { width: 300, height: 27 },
                  field: { fontSize: 12 },
                }}
                onChange={(event, newInput?: string) => this.onThroughputValueChange(newInput)}
                step={100}
                min={SharedConstants.CollectionCreation.DefaultCollectionRUs400}
                max={userContext.isTryCosmosDBSubscription ? Constants.TryCosmosExperience.maxRU : Infinity}
                value={this.state.throughput.toString()}
                aria-label="Max request units per second"
                required={true}
                errorMessage={this.state.throughputError}
              />
            </TooltipHost>
          </Stack>
        )}

        <CostEstimateText requestUnits={this.state.throughput} isAutoscale={this.state.isAutoscaleSelected} />

        {this.state.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && (
          <Stack horizontal verticalAlign="start">
            <span className="mandatoryStar">*&nbsp;</span>
            <Checkbox
              checked={this.state.isCostAcknowledged}
              styles={{
                checkbox: { width: 12, height: 12 },
                label: { padding: 0, margin: "4px 4px 0 0" },
              }}
              onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
                this.setState({ isCostAcknowledged: isChecked });
                this.props.onCostAcknowledgeChange(isChecked);
              }}
            />
            <Text variant="small" style={{ lineHeight: "20px" }}>
              {this.getCostAcknowledgeText()}
            </Text>
          </Stack>
        )}
      </div>
    );
  }

  private getThroughputLabelText(): string {
    let throughputHeaderText: string;
    if (this.state.isAutoscaleSelected) {
      throughputHeaderText = AutoPilotUtils.getAutoPilotHeaderText().toLocaleLowerCase();
    } else {
      const minRU: string = SharedConstants.CollectionCreation.DefaultCollectionRUs400.toLocaleString();
      const maxRU: string = userContext.isTryCosmosDBSubscription
        ? Constants.TryCosmosExperience.maxRU.toLocaleString()
        : "unlimited";
      throughputHeaderText = `throughput (${minRU} - ${maxRU} RU/s)`;
    }

    return `${this.props.isDatabase ? "Database" : getCollectionName()} ${throughputHeaderText}`;
  }

  private onThroughputValueChange(newInput: string): void {
    const newThroughput = parseInt(newInput);
    this.setState({ throughput: newThroughput });
    this.props.setThroughputValue(newThroughput);

    if (!this.props.isSharded && newThroughput > 10000) {
      this.setState({ throughputError: "Unsharded collections support up to 10,000 RUs" });
    } else {
      this.setState({ throughputError: undefined });
    }
  }

  private getAutoScaleTooltip(): string {
    const collectionName = getCollectionName().toLocaleLowerCase();
    return `Set the max RU/s to the highest RU/s you want your ${collectionName} to scale to. The ${collectionName} will scale between 10% of max RU/s to the max RU/s based on usage.`;
  }

  private getCostAcknowledgeText(): string {
    const { databaseAccount } = userContext;
    if (!databaseAccount || !databaseAccount.properties) {
      return "";
    }

    const numberOfRegions: number = databaseAccount.properties.readLocations?.length || 1;
    const multimasterEnabled: boolean = databaseAccount.properties.enableMultipleWriteLocations;

    return PricingUtils.getEstimatedSpendAcknowledgeString(
      this.state.throughput,
      userContext.portalEnv,
      numberOfRegions,
      multimasterEnabled,
      this.state.isAutoscaleSelected
    );
  }

  private onAutoscaleRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && !this.state.isAutoscaleSelected) {
      this.setState({ isAutoscaleSelected: true, throughput: AutoPilotUtils.minAutoPilotThroughput });
      this.props.setIsAutoscale(true);
    }
  }

  private onManualRadioBtnChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.checked && this.state.isAutoscaleSelected) {
      this.setState({
        isAutoscaleSelected: false,
        throughput: SharedConstants.CollectionCreation.DefaultCollectionRUs400,
      });
      this.props.setIsAutoscale(false);
      this.props.setThroughputValue(SharedConstants.CollectionCreation.DefaultCollectionRUs400);
    }
  }
}

interface CostEstimateTextProps {
  requestUnits: number;
  isAutoscale: boolean;
}

const CostEstimateText: React.FunctionComponent<CostEstimateTextProps> = (props: CostEstimateTextProps) => {
  const { requestUnits, isAutoscale } = props;
  const { databaseAccount } = userContext;
  if (!databaseAccount?.properties) {
    return <></>;
  }

  const serverId: string = userContext.portalEnv;
  const numberOfRegions: number = databaseAccount.properties.readLocations?.length || 1;
  const multimasterEnabled: boolean = databaseAccount.properties.enableMultipleWriteLocations;
  const hourlyPrice: number = PricingUtils.computeRUUsagePriceHourly({
    serverId,
    requestUnits,
    numberOfRegions,
    multimasterEnabled,
    isAutoscale,
  });
  const dailyPrice: number = hourlyPrice * 24;
  const monthlyPrice: number = hourlyPrice * SharedConstants.hoursInAMonth;
  const currency: string = PricingUtils.getPriceCurrency(serverId);
  const currencySign: string = PricingUtils.getCurrencySign(serverId);
  const multiplier = PricingUtils.getMultimasterMultiplier(numberOfRegions, multimasterEnabled);
  const pricePerRu = isAutoscale
    ? PricingUtils.getAutoscalePricePerRu(serverId, multiplier) * multiplier
    : PricingUtils.getPricePerRu(serverId) * multiplier;

  const iconWithEstimatedCostDisclaimer: JSX.Element = (
    <TooltipHost
      directionalHint={DirectionalHint.bottomLeftEdge}
      content={PricingUtils.estimatedCostDisclaimer}
      styles={{ root: { verticalAlign: "bottom" } }}
    >
      <Icon iconName="Info" className="panelInfoIcon" />
    </TooltipHost>
  );

  if (isAutoscale) {
    return (
      <Text variant="small">
        Estimated monthly cost ({currency}){iconWithEstimatedCostDisclaimer}:{" "}
        <b>
          {currencySign + PricingUtils.calculateEstimateNumber(monthlyPrice / 10)} -{" "}
          {currencySign + PricingUtils.calculateEstimateNumber(monthlyPrice)}{" "}
        </b>
        ({numberOfRegions + (numberOfRegions === 1 ? " region" : " regions")}, {requestUnits / 10} - {requestUnits}{" "}
        RU/s, {currencySign + pricePerRu}/RU)
      </Text>
    );
  }

  return (
    <Text variant="small">
      Estimated cost ({currency}){iconWithEstimatedCostDisclaimer}:{" "}
      <b>
        {currencySign + PricingUtils.calculateEstimateNumber(hourlyPrice)} hourly /{" "}
        {currencySign + PricingUtils.calculateEstimateNumber(dailyPrice)} daily /{" "}
        {currencySign + PricingUtils.calculateEstimateNumber(monthlyPrice)} monthly{" "}
      </b>
      ({numberOfRegions + (numberOfRegions === 1 ? " region" : " regions")}, {requestUnits}RU/s,{" "}
      {currencySign + pricePerRu}/RU)
    </Text>
  );
};
