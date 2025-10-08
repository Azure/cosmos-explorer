import { Checkbox, Stack, Text, TextField } from "@fluentui/react";
import { getNewDatabaseSharedThroughputDefault } from "Common/DatabaseUtility";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import React, { FunctionComponent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { InfoTooltip } from "../../../Common/Tooltip/InfoTooltip";
import { createDatabase } from "../../../Common/dataAccess/createDatabase";
import * as DataModels from "../../../Contracts/DataModels";
import { SubscriptionType } from "../../../Contracts/SubscriptionType";
import * as SharedConstants from "../../../Shared/Constants";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import { isServerlessAccount } from "../../../Utils/CapabilityUtils";
import { getUpsellMessage } from "../../../Utils/PricingUtils";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { ThroughputInput } from "../../Controls/ThroughputInput/ThroughputInput";
import Explorer from "../../Explorer";
import { useDatabases } from "../../useDatabases";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";
import { getTextFieldStyles } from "../PanelStyles";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface AddDatabasePaneProps {
  explorer: Explorer;
  buttonElement?: HTMLElement;
}

export const AddDatabasePanel: FunctionComponent<AddDatabasePaneProps> = ({
  explorer: container,
  buttonElement,
}: AddDatabasePaneProps) => {
  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  let throughput: number;
  let isAutoscaleSelected: boolean;
  let isCostAcknowledged: boolean;
  const { subscriptionType } = userContext;
  const isCassandraAccount: boolean = userContext.apiType === "Cassandra";
  const databaseLabel: string = isCassandraAccount ? "keyspace" : "database";
  const collectionsLabel: string = isCassandraAccount ? "tables" : "collections";
  const databaseIdLabel: string = isCassandraAccount ? "Keyspace id" : "Database id";
  const databaseIdPlaceHolder: string = isCassandraAccount ? "Type a new keyspace id" : "Type a new database id";

  const [databaseId, setDatabaseId] = useState<string>("");
  const databaseIdTooltipText = `A ${
    isCassandraAccount ? "keyspace" : "database"
  } is a logical container of one or more ${isCassandraAccount ? "tables" : "collections"}`;

  const databaseLevelThroughputTooltipText = `Provisioned throughput at the ${databaseLabel} level will be shared across all ${collectionsLabel} within the ${databaseLabel}.`;
  const [databaseCreateNewShared, setDatabaseCreateNewShared] = useState<boolean>(
    getNewDatabaseSharedThroughputDefault(),
  );
  const [formErrors, setFormErrors] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isThroughputCapExceeded, setIsThroughputCapExceeded] = useState<boolean>(false);

  const isFreeTierAccount: boolean = userContext.databaseAccount?.properties?.enableFreeTier;

  const addDatabasePaneMessage = {
    database: {
      id: databaseId,
      shared: databaseCreateNewShared,
    },
    subscriptionType: SubscriptionType[subscriptionType],
    subscriptionQuotaId: userContext.quotaId,
    dataExplorerArea: Constants.Areas.ContextualPane,
  };

  useEffect(() => {
    const addDatabasePaneOpenMessage = {
      subscriptionType: SubscriptionType[subscriptionType],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        throughput,
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
    };
    TelemetryProcessor.trace(Action.CreateDatabase, ActionModifiers.Open, addDatabasePaneOpenMessage);
    if (buttonElement) {
      buttonElement.focus();
    }
  }, []);

  const onSubmit = () => {
    if (!_isValid()) {
      return;
    }

    const addDatabasePaneStartMessage = {
      ...addDatabasePaneMessage,
      throughput,
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDatabase, addDatabasePaneStartMessage);
    setFormErrors("");
    setIsExecuting(true);

    const createDatabaseParams: DataModels.CreateDatabaseParams = {
      databaseId: addDatabasePaneStartMessage.database.id,
      databaseLevelThroughput: addDatabasePaneStartMessage.database.shared,
    };
    if (isAutoscaleSelected) {
      createDatabaseParams.autoPilotMaxThroughput = addDatabasePaneStartMessage.throughput;
    } else {
      createDatabaseParams.offerThroughput = addDatabasePaneStartMessage.throughput;
    }

    createDatabase(createDatabaseParams).then(
      () => {
        _onCreateDatabaseSuccess(throughput, startKey);
      },
      (error: string) => {
        _onCreateDatabaseFailure(error, throughput, startKey);
      },
    );
  };

  const _onCreateDatabaseSuccess = (offerThroughput: number, startKey: number): void => {
    setIsExecuting(false);
    closeSidePanel();
    container.refreshAllDatabases();
    const addDatabasePaneSuccessMessage = {
      ...addDatabasePaneMessage,
      offerThroughput,
    };
    TelemetryProcessor.traceSuccess(Action.CreateDatabase, addDatabasePaneSuccessMessage, startKey);
  };

  const _onCreateDatabaseFailure = (error: string, offerThroughput: number, startKey: number): void => {
    setIsExecuting(false);
    const errorMessage = getErrorMessage(error);
    setFormErrors(errorMessage);
    const addDatabasePaneFailedMessage = {
      ...addDatabasePaneMessage,
      offerThroughput,
      error: errorMessage,
      errorStack: getErrorStack(error),
    };
    TelemetryProcessor.traceFailure(Action.CreateDatabase, addDatabasePaneFailedMessage, startKey);
  };

  const _isValid = (): boolean => {
    // TODO add feature flag that disables validation for customers with custom accounts
    if (isAutoscaleSelected) {
      if (!AutoPilotUtils.isValidAutoPilotThroughput(throughput)) {
        setFormErrors(
          `Please enter a value greater than ${AutoPilotUtils.autoPilotThroughput1K} for autopilot throughput`,
        );
        return false;
      }
    }

    if (throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && !isCostAcknowledged) {
      setFormErrors(`Please acknowledge the estimated ${isAutoscaleSelected ? "monthly" : "daily"} spend.`);
      return false;
    }

    return true;
  };

  const handleonChangeDBId = React.useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      setDatabaseId(newValue || "");
    },
    [],
  );

  const props: RightPaneFormProps = {
    formError: formErrors,
    isExecuting,
    submitButtonText: "OK",
    isSubmitButtonDisabled: isThroughputCapExceeded,
    onSubmit,
  };

  return (
    <RightPaneForm {...props}>
      {!formErrors && isFreeTierAccount && (
        <PanelInfoErrorComponent
          message={getUpsellMessage(
            userContext.portalEnv,
            true,
            useDatabases.getState().isFirstResourceCreated(),
            true,
          )}
          messageType="info"
          showErrorDetails={false}
          link={Constants.Urls.freeTierInformation}
          linkText="Learn more"
        />
      )}
      <div className="panelMainContent">
        <Stack>
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              {databaseIdLabel}
            </Text>
            <InfoTooltip>{databaseIdTooltipText}</InfoTooltip>
          </Stack>

          <TextField
            id="database-id"
            type="text"
            aria-required="true"
            autoComplete="off"
            pattern={ValidCosmosDbIdInputPattern.source}
            title={ValidCosmosDbIdDescription}
            size={40}
            aria-label={databaseIdLabel}
            placeholder={databaseIdPlaceHolder}
            value={databaseId}
            onChange={handleonChangeDBId}
            autoFocus
            styles={getTextFieldStyles()}
            // We've seen password managers prompt to autofill this field, which is not desired.
            data-lpignore={true}
            data-1p-ignore={true}
          />

          {!isServerlessAccount() && (
            <Stack horizontal>
              <Checkbox
                title="Provision shared throughput"
                styles={{
                  text: { fontSize: 12, color: "var(--colorNeutralForeground1)" },
                  checkbox: { width: 12, height: 12 },
                  label: { padding: 0, alignItems: "center" },
                  root: {
                    selectors: {
                      ":hover .ms-Checkbox-text": { color: "var(--colorNeutralForeground1)" },
                    },
                  },
                }}
                label="Provision throughput"
                checked={databaseCreateNewShared}
                onChange={() => setDatabaseCreateNewShared(!databaseCreateNewShared)}
              />
              <InfoTooltip>{databaseLevelThroughputTooltipText}</InfoTooltip>
            </Stack>
          )}
        </Stack>

        {!isServerlessAccount() && databaseCreateNewShared && (
          <ThroughputInput
            showFreeTierExceedThroughputTooltip={isFreeTierAccount && !useDatabases.getState().isFirstResourceCreated()}
            isDatabase={true}
            isSharded={databaseCreateNewShared}
            isFreeTier={isFreeTierAccount}
            setThroughputValue={(newThroughput: number) => (throughput = newThroughput)}
            setIsAutoscale={(isAutoscale: boolean) => (isAutoscaleSelected = isAutoscale)}
            setIsThroughputCapExceeded={(isCapExceeded: boolean) => setIsThroughputCapExceeded(isCapExceeded)}
            onCostAcknowledgeChange={(isAcknowledged: boolean) => (isCostAcknowledged = isAcknowledged)}
          />
        )}
      </div>
    </RightPaneForm>
  );
};
