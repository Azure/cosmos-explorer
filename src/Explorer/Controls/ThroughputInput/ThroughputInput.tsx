import {
  Checkbox,
  ChoiceGroup,
  DirectionalHint,
  IChoiceGroupOption,
  Link,
  Stack,
  Text,
  TextField,
  TooltipHost,
} from "office-ui-fabric-react";
import React, { FunctionComponent, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { Tooltip } from "../../../Common/Tooltip/Tooltip";
import * as SharedConstants from "../../../Shared/Constants";
import { userContext } from "../../../UserContext";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../../Utils/PricingUtils";
import { CostEstimateText } from "./CostEstimateText";
import "./styles.less";

export interface ThroughputInputProps {
  isDatabase: boolean;
  showFreeTierExceedThroughputTooltip: boolean;
  setThroughputValue: (throughput: number) => void;
  setIsAutoscale: (isAutoscale: boolean) => void;
  onCostAcknowledgeChange: (isAcknowledged: boolean) => void;
  isAutoscaleSelected?: boolean;
  throughput?: number;
}

export const ThroughputInput: FunctionComponent<ThroughputInputProps> = ({
  isDatabase,
  showFreeTierExceedThroughputTooltip,
  setThroughputValue,
  setIsAutoscale,
  isAutoscaleSelected = true,
  throughput = AutoPilotUtils.minAutoPilotThroughput,
  onCostAcknowledgeChange,
}: ThroughputInputProps) => {
  const [isCostAcknowledged, setIsCostAcknowledged] = useState<boolean>(false);

  const getThroughputLabelText = (): string => {
    if (isAutoscaleSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText();
    }
    const minRU: string = SharedConstants.CollectionCreation.DefaultCollectionRUs400.toLocaleString();
    const maxRU: string = userContext.isTryCosmosDBSubscription
      ? Constants.TryCosmosExperience.maxRU.toLocaleString()
      : "unlimited";
    return isAutoscaleSelected ? AutoPilotUtils.getAutoPilotHeaderText() : `Throughput (${minRU} - ${maxRU} RU/s)`;
  };

  const onThroughputValueChange = (newInput: string): void => {
    const newThroughput = parseInt(newInput);
    setThroughputValue(newThroughput);
    setIsAutoscale(isAutoscaleSelected);
  };

  const getAutoScaleTooltip = (): string => {
    return `After the first ${AutoPilotUtils.getStorageBasedOnUserInput(throughput)} GB of data stored, the max
    RU/s will be automatically upgraded based on the new storage value.`;
  };

  const getCostAcknowledgeText = (): string => {
    const databaseAccount = userContext.databaseAccount;
    if (!databaseAccount || !databaseAccount.properties) {
      return "";
    }

    const numberOfRegions: number = databaseAccount.properties.readLocations?.length || 1;
    const multimasterEnabled: boolean = databaseAccount.properties.enableMultipleWriteLocations;

    return PricingUtils.getEstimatedSpendAcknowledgeString(
      throughput,
      userContext.portalEnv,
      numberOfRegions,
      multimasterEnabled,
      isAutoscaleSelected
    );
  };

  const handleOnChangeMode = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    if (option.key === "true") {
      setThroughputValue(AutoPilotUtils.minAutoPilotThroughput);
      setIsAutoscale(true);
    } else {
      setThroughputValue(SharedConstants.CollectionCreation.DefaultCollectionRUs400);
      setIsAutoscale(false);
    }
  };

  const optionList: IChoiceGroupOption[] = [
    { key: "true", text: "Autoscale" },
    { key: "false", text: "Manual" },
  ];
  return (
    <div className="throughputInputContainer throughputInputSpacing">
      <Stack horizontal>
        <span className="mandatoryStar">*&nbsp;</span>
        <Text variant="small" style={{ lineHeight: "20px" }}>
          {getThroughputLabelText()}
        </Text>
        <Tooltip>{PricingUtils.getRuToolTipText()}</Tooltip>
      </Stack>

      <Stack>
        <ChoiceGroup
          selectedKey={"" + isAutoscaleSelected}
          options={optionList}
          onChange={handleOnChangeMode}
          aria-label="mode"
        />
      </Stack>

      {isAutoscaleSelected && (
        <Stack className="throughputInputSpacing">
          <Text variant="small" data-testid="ruDescription">
            Provision maximum RU/s required by this resource. Estimate your required RU/s with&nbsp;
            <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/" data-testid="ruDescription">
              capacity calculator
            </Link>
            .
          </Text>

          <Stack horizontal>
            <Text variant="small" style={{ lineHeight: "20px" }} data-testid="maxRUDescription">
              Max RU/s
            </Text>
            <Tooltip>{getAutoScaleTooltip()}</Tooltip>
          </Stack>

          <TextField
            type="number"
            styles={{
              fieldGroup: { width: 300, height: 27 },
              field: { fontSize: 12 },
            }}
            onChange={(event, newInput?: string) => onThroughputValueChange(newInput)}
            step={AutoPilotUtils.autoPilotIncrementStep}
            min={AutoPilotUtils.minAutoPilotThroughput}
            value={throughput.toString()}
            aria-label="Max request units per second"
            required={true}
          />

          <Text variant="small">
            Your {isDatabase ? "database" : "container"} throughput will automatically scale from{" "}
            <b>
              {AutoPilotUtils.getMinRUsBasedOnUserInput(throughput)} RU/s (10% of max RU/s) - {throughput} RU/s
            </b>{" "}
            based on usage.
          </Text>
        </Stack>
      )}

      {!isAutoscaleSelected && (
        <Stack className="throughputInputSpacing">
          <Text variant="small" data-testid="ruDescription">
            Estimate your required RU/s with&nbsp;
            <Link target="_blank" href="https://cosmos.azure.com/capacitycalculator/" data-testid="capacityLink">
              capacity calculator
            </Link>
            .
          </Text>

          <TooltipHost
            directionalHint={DirectionalHint.topLeftEdge}
            content={
              showFreeTierExceedThroughputTooltip &&
              throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs400
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
              onChange={(event, newInput?: string) => onThroughputValueChange(newInput)}
              step={100}
              min={SharedConstants.CollectionCreation.DefaultCollectionRUs400}
              max={userContext.isTryCosmosDBSubscription ? Constants.TryCosmosExperience.maxRU : Infinity}
              value={throughput.toString()}
              aria-label="Max request units per second"
              required={true}
            />
          </TooltipHost>
        </Stack>
      )}

      <CostEstimateText requestUnits={throughput} isAutoscale={isAutoscaleSelected} />

      {throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && (
        <Stack horizontal verticalAlign="start">
          <Checkbox
            checked={isCostAcknowledged}
            styles={{
              checkbox: { width: 12, height: 12 },
              label: { padding: 0, margin: "4px 4px 0 0" },
            }}
            onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
              setIsCostAcknowledged(isChecked);
              onCostAcknowledgeChange(isChecked);
            }}
          />
          <Text variant="small" style={{ lineHeight: "20px" }}>
            {getCostAcknowledgeText()}
          </Text>
        </Stack>
      )}
    </div>
  );
};
