import { Label, Stack, TextField } from "@fluentui/react";
import React, { FunctionComponent, useEffect, useState } from "react";
import * as _ from "underscore";
import * as Constants from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { InfoTooltip } from "../../../Common/Tooltip/InfoTooltip";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import * as AddCollectionUtility from "../../../Shared/AddCollectionUtility";
import * as SharedConstants from "../../../Shared/Constants";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import { ThroughputInput } from "../../Controls/ThroughputInput/ThroughputInput";
import Explorer from "../../Explorer";
import { CassandraAPIDataClient } from "../../Tables/TableDataClient";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface CassandraAddCollectionPaneProps {
  explorer: Explorer;
  closePanel: () => void;
  cassandraApiClient: CassandraAPIDataClient;
}

export const CassandraAddCollectionPane: FunctionComponent<CassandraAddCollectionPaneProps> = ({
  explorer: container,
  closePanel,
  cassandraApiClient,
}: CassandraAddCollectionPaneProps) => {
  const throughputDefaults = container.collectionCreationDefaults.throughput;
  const [createTableQuery, setCreateTableQuery] = useState<string>("CREATE TABLE ");
  const [keyspaceId, setKeyspaceId] = useState<string>("");
  const [tableId, setTableId] = useState<string>("");
  const [throughput, setThroughput] = useState<number>(
    AddCollectionUtility.getMaxThroughput(container.collectionCreationDefaults, container)
  );

  const [isAutoPilotSelected, setIsAutoPilotSelected] = useState<boolean>(container.isAutoscaleDefaultEnabled());

  const [isSharedAutoPilotSelected, setIsSharedAutoPilotSelected] = useState<boolean>(
    container.isAutoscaleDefaultEnabled()
  );

  const [userTableQuery, setUserTableQuery] = useState<string>(
    "(userid int, name text, email text, PRIMARY KEY (userid))"
  );

  const [keyspaceHasSharedOffer, setKeyspaceHasSharedOffer] = useState<boolean>(false);
  const [keyspaceIds, setKeyspaceIds] = useState<string[]>([]);
  const [keyspaceThroughput, setKeyspaceThroughput] = useState<number>(throughputDefaults.shared);
  const [keyspaceCreateNew, setKeyspaceCreateNew] = useState<boolean>(true);
  const [dedicateTableThroughput, setDedicateTableThroughput] = useState<boolean>(false);
  const [throughputSpendAck, setThroughputSpendAck] = useState<boolean>(false);
  const [sharedThroughputSpendAck, setSharedThroughputSpendAck] = useState<boolean>(false);

  const { minAutoPilotThroughput: selectedAutoPilotThroughput } = AutoPilotUtils;
  const { minAutoPilotThroughput: sharedAutoPilotThroughput } = AutoPilotUtils;

  const _getAutoPilot = (): DataModels.AutoPilotCreationSettings => {
    if (keyspaceCreateNew && keyspaceHasSharedOffer && isSharedAutoPilotSelected && sharedAutoPilotThroughput) {
      return {
        maxThroughput: sharedAutoPilotThroughput * 1,
      };
    }

    if (selectedAutoPilotThroughput) {
      return {
        maxThroughput: selectedAutoPilotThroughput * 1,
      };
    }

    return undefined;
  };

  const isFreeTierAccount: boolean = userContext.databaseAccount?.properties?.enableFreeTier;

  const canConfigureThroughput = !container.isServerlessEnabled();

  const keyspaceOffers = new Map();
  const [isExecuting, setIsExecuting] = useState<boolean>();
  const [formErrors, setFormErrors] = useState<string>("");

  useEffect(() => {
    if (keyspaceIds.indexOf(keyspaceId) >= 0) {
      setKeyspaceHasSharedOffer(keyspaceOffers.has(keyspaceId));
    }
    setCreateTableQuery(`CREATE TABLE ${keyspaceId}.`);
  }, [keyspaceId]);

  useEffect(() => {
    if (!container.isServerlessEnabled()) {
      setIsAutoPilotSelected(container.isAutoscaleDefaultEnabled());
    }
    const addCollectionPaneOpenMessage = {
      collection: {
        id: tableId,
        storage: Constants.BackendDefaults.multiPartitionStorageInGb,
        offerThroughput: throughput,
        partitionKey: "",
        databaseId: keyspaceId,
      },
      subscriptionType: userContext.subscriptionType,
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        storage: "u",
        throughput: throughput,
        flight: userContext.addCollectionFlight,
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
    };
    TelemetryProcessor.trace(Action.CreateCollection, ActionModifiers.Open, addCollectionPaneOpenMessage);
  }, []);

  useEffect(() => {
    if (container) {
      const updateKeyspaceIds: (keyspaces: ViewModels.Database[]) => void = (
        newKeyspaceIds: ViewModels.Database[]
      ): void => {
        const cachedKeyspaceIdsList = _.map(newKeyspaceIds, (keyspace: ViewModels.Database) => {
          if (keyspace && keyspace.offer && !!keyspace.offer()) {
            keyspaceOffers.set(keyspace.id(), keyspace.offer());
          }
          return keyspace.id();
        });
        setKeyspaceIds(cachedKeyspaceIdsList);
      };
      container.databases.subscribe((newDatabases: ViewModels.Database[]) => updateKeyspaceIds(newDatabases));
      updateKeyspaceIds(container.databases());
    }
  }, []);

  const _isValid = () => {
    const sharedAutoscaleThroughput = sharedAutoPilotThroughput * 1;
    if (
      isSharedAutoPilotSelected &&
      sharedAutoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K &&
      !sharedThroughputSpendAck
    ) {
      setFormErrors(`Please acknowledge the estimated monthly spend.`);
      return false;
    }

    const dedicatedAutoscaleThroughput = selectedAutoPilotThroughput * 1;
    if (
      isAutoPilotSelected &&
      dedicatedAutoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K &&
      !throughputSpendAck
    ) {
      setFormErrors(`Please acknowledge the estimated monthly spend.`);
      return false;
    }

    if ((keyspaceCreateNew && keyspaceHasSharedOffer && isSharedAutoPilotSelected) || isAutoPilotSelected) {
      const autoPilot = _getAutoPilot();
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
      return true;
    }

    if (throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && !throughputSpendAck) {
      setFormErrors(`Please acknowledge the estimated daily spend.`);
      return false;
    }

    if (
      keyspaceHasSharedOffer &&
      keyspaceCreateNew &&
      keyspaceThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K &&
      !sharedThroughputSpendAck
    ) {
      setFormErrors("Please acknowledge the estimated daily spend");
      return false;
    }

    return true;
  };

  const onSubmit = async () => {
    if (!_isValid()) {
      return;
    }
    setIsExecuting(true);
    const autoPilotCommand = `cosmosdb_autoscale_max_throughput`;

    const toCreateKeyspace: boolean = keyspaceCreateNew;
    const useAutoPilotForKeyspace: boolean = isSharedAutoPilotSelected && !!sharedAutoPilotThroughput;
    const createKeyspaceQueryPrefix = `CREATE KEYSPACE ${keyspaceId.trim()} WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 3 }`;
    const createKeyspaceQuery: string = keyspaceHasSharedOffer
      ? useAutoPilotForKeyspace
        ? `${createKeyspaceQueryPrefix} AND ${autoPilotCommand}=${sharedAutoPilotThroughput};`
        : `${createKeyspaceQueryPrefix} AND cosmosdb_provisioned_throughput=${keyspaceThroughput};`
      : `${createKeyspaceQueryPrefix};`;

    let tableQuery: string;
    const createTableQueryPrefix = `${createTableQuery}${tableId.trim()} ${userTableQuery}`;

    if (canConfigureThroughput && (dedicateTableThroughput || !keyspaceHasSharedOffer)) {
      if (isAutoPilotSelected && selectedAutoPilotThroughput) {
        tableQuery = `${createTableQueryPrefix} WITH ${autoPilotCommand}=${throughput};`;
      } else {
        tableQuery = `${createTableQueryPrefix} WITH cosmosdb_provisioned_throughput=${throughput};`;
      }
    } else {
      tableQuery = `${createTableQueryPrefix};`;
    }

    const addCollectionPaneStartMessage = {
      collection: {
        id: tableId,
        storage: Constants.BackendDefaults.multiPartitionStorageInGb,
        offerThroughput: throughput,
        partitionKey: "",
        databaseId: keyspaceId,
        hasDedicatedThroughput: dedicateTableThroughput,
      },
      keyspaceHasSharedOffer: keyspaceHasSharedOffer,
      subscriptionType: userContext.subscriptionType,
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        storage: "u",
        throughput: throughput,
        flight: userContext.addCollectionFlight,
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
      toCreateKeyspace: toCreateKeyspace,
      createKeyspaceQuery: createKeyspaceQuery,
      createTableQuery: tableQuery,
    };

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, addCollectionPaneStartMessage);
    try {
      if (toCreateKeyspace) {
        await cassandraApiClient.createTableAndKeyspace(
          userContext?.databaseAccount?.properties?.cassandraEndpoint,
          userContext?.databaseAccount?.id,
          container,
          tableQuery,
          createKeyspaceQuery
        );
      } else {
        await cassandraApiClient.createTableAndKeyspace(
          userContext?.databaseAccount?.properties?.cassandraEndpoint,
          userContext?.databaseAccount?.id,
          container,
          tableQuery
        );
      }
      container.refreshAllDatabases();
      setIsExecuting(false);
      closePanel();

      TelemetryProcessor.traceSuccess(Action.CreateCollection, addCollectionPaneStartMessage, startKey);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setFormErrors(errorMessage);
      setIsExecuting(false);
      const addCollectionPaneFailedMessage = {
        ...addCollectionPaneStartMessage,
        error: errorMessage,
        errorStack: getErrorStack(error),
      };
      TelemetryProcessor.traceFailure(Action.CreateCollection, addCollectionPaneFailedMessage, startKey);
    }
  };
  const handleOnChangeKeyspaceType = (ev: React.FormEvent<HTMLInputElement>, mode: string): void => {
    setKeyspaceCreateNew(mode === "Create new");
  };

  const props: RightPaneFormProps = {
    expandConsole: () => container.expandConsole(),
    formError: formErrors,
    isExecuting,
    submitButtonText: "Apply",
    onSubmit,
  };
  return (
    <RightPaneForm {...props}>
      <div className="paneMainContent">
        <div className="seconddivpadding">
          <p>
            <Label required>
              Keyspace name <InfoTooltip>Select an existing keyspace or enter a new keyspace id.</InfoTooltip>
            </Label>
          </p>

          <Stack horizontal verticalAlign="center">
            <input
              className="throughputInputRadioBtn"
              aria-label="Create new keyspace"
              checked={keyspaceCreateNew}
              type="radio"
              role="radio"
              tabIndex={0}
              onChange={(e) => handleOnChangeKeyspaceType(e, "Create new")}
            />
            <span className="throughputInputRadioBtnLabel">Create new</span>

            <input
              className="throughputInputRadioBtn"
              aria-label="Use existing keyspace"
              checked={!keyspaceCreateNew}
              type="radio"
              role="radio"
              tabIndex={0}
              onChange={(e) => handleOnChangeKeyspaceType(e, "Use existing")}
            />
            <span className="throughputInputRadioBtnLabel">Use existing</span>
          </Stack>

          <TextField
            aria-required="true"
            autoComplete="off"
            pattern="[^/?#\\]*[^/?# \\]"
            title="May not end with space nor contain characters '\' '/' '#' '?'"
            list={keyspaceCreateNew ? "" : "keyspacesList"}
            placeholder={keyspaceCreateNew ? "Type a new keyspace id" : "Choose existing keyspace id"}
            size={40}
            value={keyspaceId}
            onChange={(e, newValue) => setKeyspaceId(newValue)}
            ariaLabel="Keyspace id"
            autoFocus
          />
          <datalist id="keyspacesList">
            {keyspaceIds?.map((id: string, index: number) => (
              <option key={index}>{id}</option>
            ))}
          </datalist>
          {canConfigureThroughput && keyspaceCreateNew && (
            <div className="databaseProvision">
              <input
                tabIndex={0}
                type="checkbox"
                id="keyspaceSharedThroughput"
                title="Provision shared throughput"
                checked={keyspaceHasSharedOffer}
                onChange={(e) => setKeyspaceHasSharedOffer(e.target.checked)}
              />
              <span className="databaseProvisionText" aria-label="Provision keyspace throughput">
                Provision keyspace throughput
              </span>
              <InfoTooltip>
                Provisioned throughput at the keyspace level will be shared across unlimited number of tables within the
                keyspace
              </InfoTooltip>
            </div>
          )}
          {canConfigureThroughput && keyspaceCreateNew && keyspaceHasSharedOffer && (
            <div>
              <ThroughputInput
                showFreeTierExceedThroughputTooltip={isFreeTierAccount && !container.isFirstResourceCreated()}
                isDatabase
                isSharded
                setThroughputValue={(throughput: number) => setKeyspaceThroughput(throughput)}
                setIsAutoscale={(isAutoscale: boolean) => setIsSharedAutoPilotSelected(isAutoscale)}
                onCostAcknowledgeChange={(isAcknowledge: boolean) => {
                  setSharedThroughputSpendAck(isAcknowledge);
                }}
              />
            </div>
          )}
        </div>
        <div className="seconddivpadding">
          <p>
            <Label required>
              Enter CQL command to create the table.
              <a href="https://aka.ms/cassandra-create-table" target="_blank" rel="noreferrer">
                Learn More
              </a>
            </Label>
          </p>
          <div aria-label={createTableQuery} style={{ float: "left", paddingTop: "3px", paddingRight: "3px" }}>
            {createTableQuery}
          </div>
          <TextField
            aria-required="true"
            ariaLabel="addCollection-tableId"
            autoComplete="off"
            pattern="[^/?#\\]*[^/?# \\]"
            title="May not end with space nor contain characters '\' '/' '#' '?'"
            placeholder="Enter tableId"
            size={20}
            className="textfontclr"
            value={tableId}
            onChange={(e, newValue) => setTableId(newValue)}
            style={{ marginBottom: "5px" }}
          />
          <TextField
            multiline
            id="editor-area"
            rows={5}
            aria-label="Table Schema"
            value={userTableQuery}
            onChange={(e, newValue) => setUserTableQuery(newValue)}
          />
        </div>

        {canConfigureThroughput && keyspaceHasSharedOffer && !keyspaceCreateNew && (
          <div className="seconddivpadding">
            <input
              type="checkbox"
              id="tableSharedThroughput"
              title="Provision dedicated throughput for this table"
              checked={dedicateTableThroughput}
              onChange={(e) => setDedicateTableThroughput(e.target.checked)}
            />
            <span>Provision dedicated throughput for this table</span>
            <InfoTooltip>
              You can optionally provision dedicated throughput for a table within a keyspace that has throughput
              provisioned. This dedicated throughput amount will not be shared with other tables in the keyspace and
              does not count towards the throughput you provisioned for the keyspace. This throughput amount will be
              billed in addition to the throughput amount you provisioned at the keyspace level.
            </InfoTooltip>
          </div>
        )}
        {canConfigureThroughput && (!keyspaceHasSharedOffer || dedicateTableThroughput) && (
          <div>
            <ThroughputInput
              showFreeTierExceedThroughputTooltip={isFreeTierAccount && !container.isFirstResourceCreated()}
              isDatabase={false}
              isSharded={false}
              setThroughputValue={(throughput: number) => setThroughput(throughput)}
              setIsAutoscale={(isAutoscale: boolean) => setIsAutoPilotSelected(isAutoscale)}
              onCostAcknowledgeChange={(isAcknowledge: boolean) => {
                setThroughputSpendAck(isAcknowledge);
              }}
            />
          </div>
        )}
      </div>
    </RightPaneForm>
  );
};
