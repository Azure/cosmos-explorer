import { Checkbox, Text, TextField } from "office-ui-fabric-react";
import React, { FunctionComponent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { createDatabase } from "../../../Common/dataAccess/createDatabase";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { Tooltip } from "../../../Common/Tooltip";
import { configContext, Platform } from "../../../ConfigContext";
import * as DataModels from "../../../Contracts/DataModels";
import { SubscriptionType } from "../../../Contracts/SubscriptionType";
import * as SharedConstants from "../../../Shared/Constants";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../../Utils/PricingUtils";
import { ThroughputInput } from "../../Controls/ThroughputInput/ThroughputInput";
import Explorer from "../../Explorer";
import { GenericRightPaneComponent, GenericRightPaneProps } from "../GenericRightPaneComponent";
import { PanelInfoErrorComponent } from "../PanelInfoErrorComponent";

export interface AddDatabasePaneProps {
  explorer: Explorer;
  closePanel: () => void;
  openNotificationConsole: () => void;
}

export const AddDatabasePane: FunctionComponent<AddDatabasePaneProps> = ({
  explorer: container,
  closePanel,
  openNotificationConsole,
}: AddDatabasePaneProps) => {
  const getSharedThroughputDefault = (): boolean => {
    const { subscriptionType } = userContext;
    if (subscriptionType === SubscriptionType.EA || container.isServerlessEnabled()) {
      return false;
    }
    return true;
  };
  const _isAutoPilotSelectedAndWhatTier = (): DataModels.AutoPilotCreationSettings => {
    if (isAutoPilotSelected && maxAutoPilotThroughputSet) {
      return {
        maxThroughput: maxAutoPilotThroughputSet * 1,
      };
    }
    return undefined;
  };

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
  const [databaseCreateNewShared, setDatabaseCreateNewShared] = useState<boolean>(getSharedThroughputDefault());
  const [formErrorsDetails, setFormErrorsDetails] = useState<string>();
  const [formErrors, setFormErrors] = useState<string>("");

  const throughputDefaults = container.collectionCreationDefaults.throughput;

  const [throughput, setThroughput] = useState<number>(throughputDefaults.shared);

  const [maxThroughputRU, setMaxThroughputRU] = useState<number>(throughputDefaults.unlimitedmax);
  const maxThroughputRUText: string = maxThroughputRU?.toLocaleString();
  const [isAutoPilotSelected, setIsAutoPilotSelected] = useState<boolean>(container.isAutoscaleDefaultEnabled());

  const [throughputSpendAck, setThroughputSpendAck] = useState<boolean>(false);

  const canRequestSupport = () => {
    if (
      configContext.platform !== Platform.Emulator &&
      !userContext.isTryCosmosDBSubscription &&
      configContext.platform !== Platform.Portal
    ) {
      const offerThroughput: number = throughput;
      return offerThroughput <= 100000;
    }

    return false;
  };
  const isFreeTierAccount: boolean = userContext.databaseAccount?.properties?.enableFreeTier;
  const upsellMessage: string = PricingUtils.getUpsellMessage(
    userContext.portalEnv,
    isFreeTierAccount,
    container.isFirstResourceCreated(),
    userContext.defaultExperience,
    false
  );

  const upsellAnchorUrl: string = isFreeTierAccount ? Constants.Urls.freeTierInformation : Constants.Urls.cosmosPricing;

  const upsellAnchorText: string = isFreeTierAccount ? "Learn more" : "More details";
  const [maxAutoPilotThroughputSet, setMaxAutoPilotThroughputSet] = useState<number>(
    AutoPilotUtils.minAutoPilotThroughput
  );

  const canConfigureThroughput = !container.isServerlessEnabled();
  const showUpsellMessage = () => {
    if (container.isServerlessEnabled()) {
      return false;
    }

    if (isFreeTierAccount) {
      return databaseCreateNewShared;
    }

    return true;
  };
  const title: string = container?.addDatabaseText() || "New Database";
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const _updateThroughputLimitByDatabase = () => {
    const throughputDefaults = container.collectionCreationDefaults.throughput;
    setThroughput(throughputDefaults.shared);
    setMaxThroughputRU(throughputDefaults.unlimitedmax);
  };
  useEffect(() => {
    _updateThroughputLimitByDatabase();
  }, [databaseCreateNewShared]);

  useEffect(() => {
    setDatabaseCreateNewShared(getSharedThroughputDefault());
  }, [userContext.subscriptionType]);

  useEffect(() => {
    setDatabaseId("");
    setDatabaseCreateNewShared(getSharedThroughputDefault());
    setIsAutoPilotSelected(container.isAutoscaleDefaultEnabled());
    setMaxAutoPilotThroughputSet(AutoPilotUtils.minAutoPilotThroughput);
    _updateThroughputLimitByDatabase();
    setThroughputSpendAck(false);
  }, [container.flight]);

  useEffect(() => {
    const addDatabasePaneOpenMessage = {
      subscriptionType: SubscriptionType[userContext.subscriptionType],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        throughput: throughput,
        flight: container.flight(),
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
    };
    TelemetryProcessor.trace(Action.CreateDatabase, ActionModifiers.Open, addDatabasePaneOpenMessage);
  }, []);

  const submit = () => {
    if (!_isValid()) {
      return;
    }

    const offerThroughput: number = _computeOfferThroughput();

    const addDatabasePaneStartMessage = {
      database: {
        id: databaseId,
        shared: databaseCreateNewShared,
      },
      offerThroughput,
      subscriptionType: SubscriptionType[userContext.subscriptionType],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        flight: container.flight(),
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDatabase, addDatabasePaneStartMessage);
    setFormErrors("");
    setIsExecuting(true);

    const createDatabaseParams: DataModels.CreateDatabaseParams = {
      databaseId: addDatabasePaneStartMessage.database.id,
      databaseLevelThroughput: addDatabasePaneStartMessage.database.shared,
    };

    if (isAutoPilotSelected) {
      createDatabaseParams.autoPilotMaxThroughput = maxAutoPilotThroughputSet;
    } else {
      createDatabaseParams.offerThroughput = addDatabasePaneStartMessage.offerThroughput;
    }

    createDatabase(createDatabaseParams).then(
      () => {
        _onCreateDatabaseSuccess(offerThroughput, startKey);
      },
      (error: string) => {
        _onCreateDatabaseFailure(error, offerThroughput, startKey);
      }
    );
  };

  const _onCreateDatabaseSuccess = (offerThroughput: number, startKey: number): void => {
    setIsExecuting(false);
    closePanel();
    container.refreshAllDatabases();
    const addDatabasePaneSuccessMessage = {
      database: {
        id: databaseId,
        shared: databaseCreateNewShared,
      },
      offerThroughput: offerThroughput,
      subscriptionType: SubscriptionType[userContext.subscriptionType],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        flight: container.flight(),
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
    };
    TelemetryProcessor.traceSuccess(Action.CreateDatabase, addDatabasePaneSuccessMessage, startKey);
  };

  const _onCreateDatabaseFailure = (error: string, offerThroughput: number, startKey: number): void => {
    setIsExecuting(false);
    const errorMessage = getErrorMessage(error);
    setFormErrors(errorMessage);
    setFormErrorsDetails(errorMessage);
    const addDatabasePaneFailedMessage = {
      database: {
        id: databaseId,
        shared: databaseCreateNewShared,
      },
      offerThroughput: offerThroughput,
      subscriptionType: SubscriptionType[userContext.subscriptionType],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        flight: container.flight(),
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
      error: errorMessage,
      errorStack: getErrorStack(error),
    };
    TelemetryProcessor.traceFailure(Action.CreateDatabase, addDatabasePaneFailedMessage, startKey);
  };

  const _getThroughput = (): number => {
    return isNaN(throughput) ? 0 : Number(throughput);
  };

  const _computeOfferThroughput = (): number => {
    if (!canConfigureThroughput) {
      return undefined;
    }

    if (isAutoPilotSelected) {
      return undefined;
    }

    return _getThroughput();
  };

  const _isValid = (): boolean => {
    // TODO add feature flag that disables validation for customers with custom accounts
    if (isAutoPilotSelected) {
      const autoPilot = _isAutoPilotSelectedAndWhatTier();
      if (
        !autoPilot ||
        !autoPilot.maxThroughput ||
        !AutoPilotUtils.isValidAutoPilotThroughput(autoPilot.maxThroughput)
      ) {
        setFormErrors(
          `Please enter a value greater than ${AutoPilotUtils.minAutoPilotThroughput} for autopilot throughput`
        );
        return false;
      }
    }
    const throughput = _getThroughput();

    if (throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && !throughputSpendAck) {
      setFormErrors(`Please acknowledge the estimated daily spend.`);
      return false;
    }

    const autoscaleThroughput = maxAutoPilotThroughputSet * 1;

    if (
      isAutoPilotSelected &&
      autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K &&
      !throughputSpendAck
    ) {
      setFormErrors(`Please acknowledge the estimated monthly spend.`);
      return false;
    }

    return true;
  };

  const handleonChangeDBId = React.useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      setDatabaseId(newValue || "");
    },
    []
  );

  const genericPaneProps: GenericRightPaneProps = {
    container,
    formError: formErrors,
    formErrorDetail: formErrorsDetails,
    id: "copynotebookpane",
    isExecuting,
    title,
    submitButtonText: "OK",
    onClose: closePanel,
    onSubmit: submit,
  };

  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <form style={{ height: "100%" }}>
        <div className="paneContentContainer" role="dialog" aria-labelledby="databaseTitle">
          {showUpsellMessage && formErrors === "" && (
            <PanelInfoErrorComponent
              message={upsellMessage}
              messageType="info"
              showErrorDetails={false}
              openNotificationConsole={openNotificationConsole}
              link={upsellAnchorUrl}
              linkText={upsellAnchorText}
            />
          )}

          <div className="paneMainContent">
            <div>
              <p>
                <span className="mandatoryStar">*</span>
                <Text variant="small">{databaseIdLabel}</Text>
                <Tooltip>{databaseIdTooltipText}</Tooltip>
              </p>

              <TextField
                id="database-id"
                type="text"
                aria-required="true"
                autoComplete="off"
                pattern="[^/?#\\]*[^/?# \\]"
                title="May not end with space nor contain characters '\' '/' '#' '?'"
                size={40}
                aria-label={databaseIdLabel}
                placeholder={databaseIdPlaceHolder}
                value={databaseId}
                onChange={handleonChangeDBId}
                autoFocus
              />

              <div
                className="databaseProvision"
                aria-label="New database provision support"
                style={{ display: "block ruby" }}
              >
                <Checkbox
                  title="Provision shared throughput"
                  styles={{
                    checkbox: { width: 12, height: 12 },
                    label: { padding: 0, alignItems: "center" },
                  }}
                  tabIndex={0}
                  label="Provision throughput"
                  checked={databaseCreateNewShared}
                  onChange={() => setDatabaseCreateNewShared(!databaseCreateNewShared)}
                />{" "}
                <Tooltip>{databaseLevelThroughputTooltipText}</Tooltip>
              </div>
              {databaseCreateNewShared && (
                <div>
                  <ThroughputInput
                    showFreeTierExceedThroughputTooltip={isFreeTierAccount && !container?.isFirstResourceCreated()}
                    isDatabase={true}
                    setThroughputValue={(throughput: number) => setThroughput(throughput)}
                    setIsAutoscale={(isAutoscale: boolean) => setIsAutoPilotSelected(isAutoscale)}
                    onCostAcknowledgeChange={(isAcknowledged: boolean) => setThroughputSpendAck(isAcknowledged)}
                  />

                  {canRequestSupport && (
                    <p>
                      <a href="https://aka.ms/cosmosdbfeedback?subject=Cosmos%20DB%20More%20Throughput%20Request">
                        Contact support{" "}
                      </a>
                      for more than <span>{maxThroughputRUText} </span> RU/s.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </GenericRightPaneComponent>
  );
};
