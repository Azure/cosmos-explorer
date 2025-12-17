import { Checkbox, DirectionalHint, Link, Separator, Stack, Text, TextField, TooltipHost } from "@fluentui/react";
import { getWorkloadType } from "Common/DatabaseAccountUtility";
import { CostEstimateText } from "Explorer/Controls/ThroughputInput/CostEstimateText/CostEstimateText";
import { useDatabases } from "Explorer/useDatabases";
import React, { FunctionComponent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { InfoTooltip } from "../../../Common/Tooltip/InfoTooltip";
import { isFabricNative } from "../../../Platform/Fabric/FabricUtil";
import * as SharedConstants from "../../../Shared/Constants";
import { userContext } from "../../../UserContext";
import { getCollectionName } from "../../../Utils/APITypeUtils";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../../Utils/PricingUtils";
import "./ThroughputInput.less";

export interface ThroughputInputProps {
  isDatabase: boolean;
  isSharded: boolean;
  isFreeTier: boolean;
  showFreeTierExceedThroughputTooltip: boolean;
  isQuickstart?: boolean;
  isGlobalSecondaryIndex?: boolean;
  setThroughputValue: (throughput: number) => void;
  setIsAutoscale: (isAutoscale: boolean) => void;
  setIsThroughputCapExceeded: (isThroughputCapExceeded: boolean) => void;
  onCostAcknowledgeChange: (isAcknowledged: boolean) => void;
}

export const ThroughputInput: FunctionComponent<ThroughputInputProps> = ({
  isDatabase,
  isSharded,
  isFreeTier,
  showFreeTierExceedThroughputTooltip,
  isQuickstart,
  isGlobalSecondaryIndex,
  setThroughputValue,
  setIsAutoscale,
  setIsThroughputCapExceeded,
  onCostAcknowledgeChange,
}: ThroughputInputProps) => {
  let defaultThroughput: number;
  const workloadType: Constants.WorkloadType = getWorkloadType();

  if (isFabricNative()) {
    defaultThroughput = AutoPilotUtils.autoPilotThroughput5K;
  } else if (
    isFreeTier ||
    isQuickstart ||
    [Constants.WorkloadType.Learning, Constants.WorkloadType.DevelopmentTesting].includes(workloadType)
  ) {
    defaultThroughput = AutoPilotUtils.autoPilotThroughput1K;
  } else if (workloadType === Constants.WorkloadType.Production) {
    defaultThroughput = AutoPilotUtils.autoPilotThroughput10K;
  } else {
    defaultThroughput = AutoPilotUtils.autoPilotThroughput4K;
  }

  const [isAutoscaleSelected, setIsAutoScaleSelected] = useState<boolean>(true);
  const [throughput, setThroughput] = useState<number>(defaultThroughput);
  const [isCostAcknowledged, setIsCostAcknowledged] = useState<boolean>(false);
  const [throughputError, setThroughputError] = useState<string>("");
  const [totalThroughputUsed, setTotalThroughputUsed] = useState<number>(0);

  setIsAutoscale(isAutoscaleSelected);
  setThroughputValue(throughput);

  const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
  const numberOfRegions = userContext.databaseAccount?.properties.locations?.length || 1;
  useEffect(() => {
    // throughput cap check for the initial state
    let totalThroughput = 0;
    (useDatabases.getState().databases || []).forEach((database) => {
      if (database.offer()) {
        const dbThroughput = database.offer().autoscaleMaxThroughput || database.offer().manualThroughput;
        totalThroughput += dbThroughput;
      }

      (database.collections() || []).forEach((collection) => {
        if (collection.offer()) {
          const colThroughput = collection.offer().autoscaleMaxThroughput || collection.offer().manualThroughput;
          totalThroughput += colThroughput;
        }
      });
    });
    totalThroughput *= numberOfRegions;
    setTotalThroughputUsed(totalThroughput);

    if (throughputCap && throughputCap !== -1 && throughputCap - totalThroughput < throughput) {
      setThroughputError(
        `Your account is currently configured with a total throughput limit of ${throughputCap} RU/s. This update isn't possible because it would increase the total throughput to ${
          totalThroughput + throughput * numberOfRegions
        } RU/s. Change total throughput limit in cost management.`,
      );

      setIsThroughputCapExceeded(true);
    }
  }, []);

  const checkThroughputCap = (newThroughput: number): boolean => {
    if (throughputCap && throughputCap !== -1 && throughputCap - totalThroughputUsed < newThroughput) {
      setThroughputError(
        `Your account is currently configured with a total throughput limit of ${throughputCap} RU/s. This update isn't possible because it would increase the total throughput to ${
          totalThroughputUsed + newThroughput * numberOfRegions
        } RU/s. Change total throughput limit in cost management.`,
      );
      setIsThroughputCapExceeded(true);
      return false;
    }

    setThroughputError("");
    setIsThroughputCapExceeded(false);
    return true;
  };

  const getThroughputLabelText = (): string => {
    let throughputHeaderText: string;
    if (isAutoscaleSelected) {
      throughputHeaderText = AutoPilotUtils.getAutoPilotHeaderText().toLocaleLowerCase();
    } else {
      const minRU: string = SharedConstants.CollectionCreation.DefaultCollectionRUs400.toLocaleString();

      let maxRU: string;
      if (userContext.isTryCosmosDBSubscription) {
        maxRU = Constants.TryCosmosExperience.maxRU.toLocaleString();
      } else if (!isSharded) {
        maxRU = "10000";
      } else {
        maxRU = "unlimited";
      }

      throughputHeaderText = `throughput (${minRU} - ${maxRU} RU/s)`;
    }
    return `${isDatabase ? "Database" : getCollectionName()} ${throughputHeaderText}`;
  };

  const onThroughputValueChange = (newInput: string): void => {
    const newThroughput = parseInt(newInput);
    setThroughput(newThroughput);
    setThroughputValue(newThroughput);

    if (!isSharded && newThroughput > 10000) {
      setThroughputError("Unsharded collections support up to 10,000 RUs");
      return;
    }

    if (!checkThroughputCap(newThroughput)) {
      return;
    }

    setThroughputError("");
  };

  const getAutoScaleTooltip = (): string => {
    const collectionName = getCollectionName().toLocaleLowerCase();
    return `Set the max RU/s to the highest RU/s you want your ${collectionName} to scale to. The ${collectionName} will scale between 10% of max RU/s to the max RU/s based on usage.`;
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
      isAutoscaleSelected,
    );
  };

  const handleOnChangeMode = (event: React.ChangeEvent<HTMLInputElement>, mode: string): void => {
    if (mode === "Autoscale") {
      setThroughput(defaultThroughput);
      setIsAutoScaleSelected(true);
      setThroughputValue(defaultThroughput);
      setIsAutoscale(true);
      checkThroughputCap(defaultThroughput);
    } else {
      setThroughput(SharedConstants.CollectionCreation.DefaultCollectionRUs400);
      setIsAutoScaleSelected(false);
      setThroughputValue(SharedConstants.CollectionCreation.DefaultCollectionRUs400);
      setIsAutoscale(false);
      checkThroughputCap(SharedConstants.CollectionCreation.DefaultCollectionRUs400);
    }
  };

  return (
    <div className="throughputInputContainer throughputInputSpacing">
      <Stack horizontal>
        <span className="mandatoryStar">*&nbsp;</span>
        <Text
          aria-label="Throughput header"
          variant="small"
          style={{ lineHeight: "20px", fontWeight: 600, color: "var(--colorNeutralForeground1)" }}
        >
          {getThroughputLabelText()}
        </Text>
        <InfoTooltip>{PricingUtils.getRuToolTipText()}</InfoTooltip>
      </Stack>
      {!isGlobalSecondaryIndex && (
        <Stack horizontal verticalAlign="center">
          <div role="radiogroup">
            <input
              id="Autoscale-input"
              className="throughputInputRadioBtn"
              aria-label={`${getThroughputLabelText()} Autoscale`}
              aria-required={true}
              checked={isAutoscaleSelected}
              type="radio"
              role="radio"
              tabIndex={0}
              onChange={(e) => handleOnChangeMode(e, "Autoscale")}
            />
            <label htmlFor="Autoscale-input" className="throughputInputRadioBtnLabel">
              Autoscale
            </label>

            <input
              id="Manual-input"
              className="throughputInputRadioBtn"
              aria-label={`${getThroughputLabelText()} Manual`}
              checked={!isAutoscaleSelected}
              type="radio"
              aria-required={true}
              role="radio"
              tabIndex={0}
              onChange={(e) => handleOnChangeMode(e, "Manual")}
            />
            <label className="throughputInputRadioBtnLabel" htmlFor="Manual-input">
              Manual
            </label>
          </div>
        </Stack>
      )}

      {isAutoscaleSelected && (
        <Stack className="throughputInputSpacing">
          <Text style={{ marginTop: -2, fontSize: 12, color: "var(--colorNeutralForeground1)" }}>
            Your container throughput will automatically scale up to the maximum value you select, from a minimum of 10%
            of that value.
          </Text>
          <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 8 }}>
            <Stack tokens={{ childrenGap: 4 }}>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                <Text
                  variant="small"
                  style={{ lineHeight: "20px", fontWeight: 600, color: "var(--colorNeutralForeground1)" }}
                >
                  Minimum RU/s
                </Text>
                <InfoTooltip>The minimum RU/s your container will scale to</InfoTooltip>
              </Stack>
              <Text
                style={{
                  fontFamily: "Segoe UI",
                  width: 70,
                  height: 27,
                  border: "none",
                  fontSize: 14,
                  backgroundColor: "transparent",
                  fontWeight: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--colorNeutralForeground1)",
                }}
              >
                {Math.round(throughput / 10).toString()}
              </Text>
            </Stack>

            <Text
              style={{
                fontFamily: "Segoe UI",
                fontSize: 12,
                fontWeight: 400,
                paddingBottom: 6,
                color: "var(--colorNeutralForeground1)",
              }}
            >
              x 10 =
            </Text>

            <Stack tokens={{ childrenGap: 4 }}>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                <Text
                  variant="small"
                  style={{ lineHeight: "20px", fontWeight: 600, color: "var(--colorNeutralForeground1)" }}
                >
                  Maximum RU/s
                </Text>
                <InfoTooltip>{getAutoScaleTooltip()}</InfoTooltip>
              </Stack>
              <TextField
                id="autoscaleRUValueField"
                data-test="autoscaleRUInput"
                type="number"
                styles={{
                  fieldGroup: { width: 100, height: 27, flexShrink: 0 },
                  field: { fontSize: 14, fontWeight: 400, color: "var(--colorNeutralForeground1)" },
                }}
                onChange={(_event, newInput?: string) => onThroughputValueChange(newInput)}
                step={AutoPilotUtils.autoPilotIncrementStep}
                min={AutoPilotUtils.autoPilotThroughput1K}
                max={isSharded ? Number.MAX_SAFE_INTEGER.toString() : "10000"}
                value={throughput.toString()}
                ariaLabel={`${isDatabase ? "Database" : getCollectionName()} max RU/s`}
                required={true}
                errorMessage={throughputError}
              />
            </Stack>
          </Stack>

          <CostEstimateText requestUnits={throughput} isAutoscale={isAutoscaleSelected} />
          <Stack className="throughputInputSpacing">
            <Text variant="small" aria-label="ruDescription" style={{ color: "var(--colorNeutralForeground1)" }}>
              Estimate your required RU/s with&nbsp;
              <Link
                className="underlinedLink"
                target="_blank"
                href="https://cosmos.azure.com/capacitycalculator/"
                aria-label="Capacity calculator"
              >
                capacity calculator
              </Link>
              .
            </Text>
          </Stack>
          <Separator className="panelSeparator" style={{ paddingTop: -8, paddingBottom: -8 }} />
        </Stack>
      )}

      {!isAutoscaleSelected && (
        <Stack className="throughputInputSpacing">
          <Text variant="small" aria-label="ruDescription" style={{ color: "var(--colorNeutralForeground1)" }}>
            Estimate your required RU/s with&nbsp;
            <Link
              className="underlinedLink"
              target="_blank"
              href="https://cosmos.azure.com/capacitycalculator/"
              aria-label="Capacity calculator"
            >
              capacity calculator
            </Link>
            .
          </Text>
          <Stack horizontal>
            <Text
              variant="small"
              style={{ lineHeight: "20px", fontWeight: 600, color: "var(--colorNeutralForeground1)" }}
              aria-label="maxRUDescription"
            >
              {isDatabase ? "Database" : getCollectionName()} Required RU/s
            </Text>
            <InfoTooltip>{getAutoScaleTooltip()}</InfoTooltip>
          </Stack>
          <TooltipHost
            directionalHint={DirectionalHint.topLeftEdge}
            content={
              showFreeTierExceedThroughputTooltip && throughput > SharedConstants.FreeTierLimits.RU
                ? `The first ${SharedConstants.FreeTierLimits.RU} RU/s in this account are free. Billing will apply to any throughput beyond ${SharedConstants.FreeTierLimits.RU} RU/s.`
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
              ariaLabel={`${isDatabase ? "Database" : getCollectionName()} Required RU/s`}
              required={true}
              errorMessage={throughputError}
            />
          </TooltipHost>
          <CostEstimateText requestUnits={throughput} isAutoscale={isAutoscaleSelected} />
        </Stack>
      )}

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
