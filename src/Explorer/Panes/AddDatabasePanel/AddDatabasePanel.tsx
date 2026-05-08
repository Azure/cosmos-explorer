import { Stack, Text, TextField } from "@fluentui/react";
import { Keys, t } from "Localization";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import React, { FunctionComponent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { InfoTooltip } from "../../../Common/Tooltip/InfoTooltip";
import { createDatabase } from "../../../Common/dataAccess/createDatabase";
import * as DataModels from "../../../Contracts/DataModels";
import { SubscriptionType } from "../../../Contracts/SubscriptionType";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import { getUpsellMessage } from "../../../Utils/PricingUtils";
import { useSidePanel } from "../../../hooks/useSidePanel";
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
  const { subscriptionType } = userContext;
  const isCassandraAccount: boolean = userContext.apiType === "Cassandra";
  const databaseLabel: string = isCassandraAccount ? "keyspace" : "database";
  const collectionsLabel: string = isCassandraAccount ? "tables" : "collections";
  const databaseIdLabel: string = isCassandraAccount
    ? t(Keys.panes.addDatabase.keyspaceIdLabel)
    : t(Keys.panes.addDatabase.databaseIdLabel);
  const databaseIdPlaceHolder: string = t(Keys.panes.addDatabase.databaseIdPlaceholder, { databaseLabel });

  const [databaseId, setDatabaseId] = useState<string>("");
  const databaseIdTooltipText = t(Keys.panes.addDatabase.databaseTooltip, { databaseLabel, collectionsLabel });

  const [formErrors, setFormErrors] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const isFreeTierAccount: boolean = userContext.databaseAccount?.properties?.enableFreeTier;

  const addDatabasePaneMessage = {
    database: {
      id: databaseId,
      shared: false,
    },
    subscriptionType: SubscriptionType[subscriptionType],
    subscriptionQuotaId: userContext.quotaId,
    dataExplorerArea: Constants.Areas.ContextualPane,
  };

  useEffect(() => {
    const addDatabasePaneOpenMessage = {
      subscriptionType: SubscriptionType[subscriptionType],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {},
      dataExplorerArea: Constants.Areas.ContextualPane,
    };
    TelemetryProcessor.trace(Action.CreateDatabase, ActionModifiers.Open, addDatabasePaneOpenMessage);
    if (buttonElement) {
      buttonElement.focus();
    }
  }, []);

  const onSubmit = () => {
    const addDatabasePaneStartMessage = {
      ...addDatabasePaneMessage,
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDatabase, addDatabasePaneStartMessage);
    setFormErrors("");
    setIsExecuting(true);

    const createDatabaseParams: DataModels.CreateDatabaseParams = {
      databaseId: addDatabasePaneStartMessage.database.id,
      databaseLevelThroughput: false,
    };

    createDatabase(createDatabaseParams).then(
      () => {
        _onCreateDatabaseSuccess(startKey);
      },
      (error: string) => {
        _onCreateDatabaseFailure(error, startKey);
      },
    );
  };

  const _onCreateDatabaseSuccess = (startKey: number): void => {
    setIsExecuting(false);
    closeSidePanel();
    container.refreshAllDatabases();
    const addDatabasePaneSuccessMessage = {
      ...addDatabasePaneMessage,
    };
    TelemetryProcessor.traceSuccess(Action.CreateDatabase, addDatabasePaneSuccessMessage, startKey);
  };

  const _onCreateDatabaseFailure = (error: string, startKey: number): void => {
    setIsExecuting(false);
    const errorMessage = getErrorMessage(error);
    setFormErrors(errorMessage);
    const addDatabasePaneFailedMessage = {
      ...addDatabasePaneMessage,
      error: errorMessage,
      errorStack: getErrorStack(error),
    };
    TelemetryProcessor.traceFailure(Action.CreateDatabase, addDatabasePaneFailedMessage, startKey);
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
    submitButtonText: t(Keys.common.ok),
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
          linkText={t(Keys.common.learnMore)}
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
        </Stack>
      </div>
    </RightPaneForm>
  );
};
