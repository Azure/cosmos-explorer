import { Checkbox, Dropdown, IDropdownOption, Link, Stack, Text, TextField } from "@fluentui/react";
import * as Constants from "Common/Constants";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { InfoTooltip } from "Common/Tooltip/InfoTooltip";
import * as SharedConstants from "Shared/Constants";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "Shared/Telemetry/TelemetryProcessor";
import { userContext } from "UserContext";
import { isServerlessAccount } from "Utils/CapabilityUtils";
import { ValidCosmosDbIdDescription, ValidCosmosDbIdInputPattern } from "Utils/ValidationUtils";
import { useSidePanel } from "hooks/useSidePanel";
import React, { FunctionComponent, useState } from "react";
import { ThroughputInput } from "../../Controls/ThroughputInput/ThroughputInput";
import Explorer from "../../Explorer";
import { CassandraAPIDataClient } from "../../Tables/TableDataClient";
import { useDatabases } from "../../useDatabases";
import { getTextFieldStyles } from "../PanelStyles";
import { RightPaneForm, RightPaneFormProps } from "../RightPaneForm/RightPaneForm";

export interface CassandraAddCollectionPaneProps {
  explorer: Explorer;
  cassandraApiClient: CassandraAPIDataClient;
}

export const CassandraAddCollectionPane: FunctionComponent<CassandraAddCollectionPaneProps> = ({
  explorer: container,
  cassandraApiClient,
}: CassandraAddCollectionPaneProps) => {
  let newKeySpaceThroughput: number;
  let isNewKeySpaceAutoscale: boolean;
  let tableThroughput: number;
  let isTableAutoscale: boolean;
  let isCostAcknowledged: boolean;

  const closeSidePanel = useSidePanel((state) => state.closeSidePanel);
  const [newKeyspaceId, setNewKeyspaceId] = useState<string>("");
  const [existingKeyspaceId, setExistingKeyspaceId] = useState<string>("");
  const [tableId, setTableId] = useState<string>("");
  const [userTableQuery, setUserTableQuery] = useState<string>(
    "(userid int, name text, email text, PRIMARY KEY (userid))",
  );
  const [isKeyspaceShared, setIsKeyspaceShared] = useState<boolean>(false);
  const [keyspaceCreateNew, setKeyspaceCreateNew] = useState<boolean>(true);
  const [dedicateTableThroughput, setDedicateTableThroughput] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>();
  const [formError, setFormError] = useState<string>("");
  const [isThroughputCapExceeded, setIsThroughputCapExceeded] = useState<boolean>(false);
  const isFreeTierAccount: boolean = userContext.databaseAccount?.properties?.enableFreeTier;

  const addCollectionPaneOpenMessage = {
    collection: {
      id: tableId,
      storage: Constants.BackendDefaults.multiPartitionStorageInGb,
      offerThroughput: newKeySpaceThroughput || tableThroughput,
      partitionKey: "",
      databaseId: keyspaceCreateNew ? newKeyspaceId : existingKeyspaceId,
    },
    subscriptionType: userContext.subscriptionType,
    subscriptionQuotaId: userContext.quotaId,
    defaultsCheck: {
      storage: "u",
      throughput: newKeySpaceThroughput || tableThroughput,
    },
    dataExplorerArea: Constants.Areas.ContextualPane,
  };

  const onSubmit = async () => {
    const throughput = keyspaceCreateNew ? newKeySpaceThroughput : tableThroughput;
    const keyspaceId = keyspaceCreateNew ? newKeyspaceId : existingKeyspaceId;

    if (throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && !isCostAcknowledged) {
      const errorMessage =
        isNewKeySpaceAutoscale || isTableAutoscale
          ? "Please acknowledge the estimated monthly spend."
          : "Please acknowledge the estimated daily spend.";
      setFormError(errorMessage);
      return;
    }

    setIsExecuting(true);
    const autoPilotCommand = `cosmosdb_autoscale_max_throughput`;
    const createKeyspaceQueryPrefix = `CREATE KEYSPACE ${keyspaceId.trim()} WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 3 }`;
    const createKeyspaceQuery: string = isKeyspaceShared
      ? isNewKeySpaceAutoscale
        ? `${createKeyspaceQueryPrefix} AND ${autoPilotCommand}=${newKeySpaceThroughput};`
        : `${createKeyspaceQueryPrefix} AND cosmosdb_provisioned_throughput=${newKeySpaceThroughput};`
      : `${createKeyspaceQueryPrefix};`;
    let tableQuery: string;
    const createTableQueryPrefix = `CREATE TABLE ${keyspaceId}.${tableId.trim()} ${userTableQuery}`;

    if (tableThroughput) {
      if (isTableAutoscale) {
        tableQuery = `${createTableQueryPrefix} WITH ${autoPilotCommand}=${tableThroughput};`;
      } else {
        tableQuery = `${createTableQueryPrefix} WITH cosmosdb_provisioned_throughput=${tableThroughput};`;
      }
    } else {
      tableQuery = `${createTableQueryPrefix};`;
    }

    const addCollectionPaneStartMessage = {
      ...addCollectionPaneOpenMessage,
      collection: {
        ...addCollectionPaneOpenMessage.collection,
        hasDedicatedThroughput: dedicateTableThroughput,
      },
      isKeyspaceShared,
      keyspaceCreateNew,
      createKeyspaceQuery,
      createTableQuery: tableQuery,
    };

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, addCollectionPaneStartMessage);
    try {
      if (keyspaceCreateNew) {
        await cassandraApiClient.createTableAndKeyspace(
          userContext?.databaseAccount?.properties?.cassandraEndpoint,
          userContext?.databaseAccount?.id,
          container,
          tableQuery,
          createKeyspaceQuery,
        );
      } else {
        await cassandraApiClient.createTableAndKeyspace(
          userContext?.databaseAccount?.properties?.cassandraEndpoint,
          userContext?.databaseAccount?.id,
          container,
          tableQuery,
        );
      }
      container.refreshAllDatabases();
      setIsExecuting(false);
      closeSidePanel();

      TelemetryProcessor.traceSuccess(Action.CreateCollection, addCollectionPaneStartMessage, startKey);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setFormError(errorMessage);
      setIsExecuting(false);
      const addCollectionPaneFailedMessage = {
        ...addCollectionPaneStartMessage,
        error: errorMessage,
        errorStack: getErrorStack(error),
      };
      TelemetryProcessor.traceFailure(Action.CreateCollection, addCollectionPaneFailedMessage, startKey);
    }
  };

  const props: RightPaneFormProps = {
    formError,
    isExecuting,
    submitButtonText: "OK",
    isSubmitButtonDisabled: isThroughputCapExceeded,
    onSubmit,
  };

  return (
    <RightPaneForm {...props}>
      <div className="panelMainContent">
        <Stack>
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Keyspace name <InfoTooltip>Select an existing keyspace or enter a new keyspace id.</InfoTooltip>
            </Text>
          </Stack>

          <Stack horizontal verticalAlign="center">
            <input
              className="panelRadioBtn"
              aria-label="Create new keyspace"
              checked={keyspaceCreateNew}
              type="radio"
              role="radio"
              tabIndex={0}
              onChange={() => {
                setKeyspaceCreateNew(true);
                setIsKeyspaceShared(false);
                setExistingKeyspaceId("");
              }}
            />
            <span className="panelRadioBtnLabel">Create new</span>

            <input
              className="panelRadioBtn"
              aria-label="Use existing keyspace"
              checked={!keyspaceCreateNew}
              type="radio"
              role="radio"
              tabIndex={0}
              onChange={() => {
                setKeyspaceCreateNew(false);
                setIsKeyspaceShared(false);
              }}
            />
            <span className="panelRadioBtnLabel">Use existing</span>
          </Stack>

          {keyspaceCreateNew && (
            <Stack className="panelGroupSpacing">
              <TextField
                data-test="AddCollectionPanel/DatabaseId"
                aria-required="true"
                required={true}
                autoComplete="off"
                styles={getTextFieldStyles()}
                pattern={ValidCosmosDbIdInputPattern.source}
                title={ValidCosmosDbIdDescription}
                placeholder="Type a new keyspace id"
                size={40}
                value={newKeyspaceId}
                onChange={(e, newValue) => setNewKeyspaceId(newValue)}
                ariaLabel="Keyspace id"
                autoFocus
              />

              {!isServerlessAccount() && (
                <Stack horizontal>
                  <div data-test="AddCollectionPanel/SharedThroughputCheckbox">
                    <Checkbox
                      label="Provision shared throughput"
                      checked={isKeyspaceShared}
                      styles={{
                        text: { fontSize: 12 },
                        checkbox: { width: 12, height: 12 },
                        label: { padding: 0, alignItems: "center" },
                      }}
                      onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean) =>
                        setIsKeyspaceShared(isChecked)
                      }
                    />
                  </div>
                  <InfoTooltip>
                    Provisioned throughput at the keyspace level will be shared across unlimited number of tables within
                    the keyspace
                  </InfoTooltip>
                </Stack>
              )}
            </Stack>
          )}

          {!keyspaceCreateNew && (
            <Dropdown
              ariaLabel="Choose existing keyspace id"
              styles={{ root: { width: 300 }, title: { fontSize: 12 }, dropdownItem: { fontSize: 12 } }}
              placeholder="Choose existing keyspace id"
              defaultSelectedKey={existingKeyspaceId}
              options={useDatabases.getState().databases?.map((keyspace) => ({
                key: keyspace.id(),
                text: keyspace.id(),
                data: {
                  isShared: !!keyspace.offer(),
                },
              }))}
              onChange={(event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) => {
                setExistingKeyspaceId(option.key as string);
                setIsKeyspaceShared(option.data.isShared);
              }}
              responsiveMode={999}
            />
          )}

          {!isServerlessAccount() && keyspaceCreateNew && isKeyspaceShared && (
            <ThroughputInput
              showFreeTierExceedThroughputTooltip={
                isFreeTierAccount && !useDatabases.getState().isFirstResourceCreated()
              }
              isDatabase
              isSharded
              isFreeTier={isFreeTierAccount}
              setThroughputValue={(throughput: number) => (newKeySpaceThroughput = throughput)}
              setIsAutoscale={(isAutoscale: boolean) => (isNewKeySpaceAutoscale = isAutoscale)}
              setIsThroughputCapExceeded={(isCapExceeded: boolean) => setIsThroughputCapExceeded(isCapExceeded)}
              onCostAcknowledgeChange={(isAcknowledged: boolean) => (isCostAcknowledged = isAcknowledged)}
            />
          )}
        </Stack>

        <Stack>
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Enter CQL command to create the table.{" "}
              <Link className="underlinedLink" href="https://aka.ms/cassandra-create-table" target="_blank">
                Learn More
              </Link>
            </Text>
          </Stack>

          <Stack horizontal verticalAlign="center">
            <Text variant="small" style={{ marginRight: 4 }}>
              {`CREATE TABLE ${keyspaceCreateNew ? newKeyspaceId : existingKeyspaceId}.`}
            </Text>
            <TextField
              data-test="AddCollectionPanel/CollectionId"
              underlined
              styles={getTextFieldStyles({ fontSize: 12, width: 150 })}
              aria-required="true"
              required={true}
              ariaLabel="addCollection-table Id Create table"
              autoComplete="off"
              pattern={ValidCosmosDbIdInputPattern.source}
              title={ValidCosmosDbIdDescription}
              placeholder="Enter table Id"
              size={20}
              value={tableId}
              onChange={(e, newValue) => setTableId(newValue)}
            />
          </Stack>

          <TextField
            styles={getTextFieldStyles()}
            multiline
            id="editor-area"
            rows={5}
            ariaLabel="Table schema"
            value={userTableQuery}
            onChange={(e, newValue) => setUserTableQuery(newValue)}
          />
        </Stack>

        {!isServerlessAccount() && isKeyspaceShared && !keyspaceCreateNew && (
          <Stack horizontal verticalAlign="center">
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
          </Stack>
        )}
        {!isServerlessAccount() && (!isKeyspaceShared || dedicateTableThroughput) && (
          <ThroughputInput
            showFreeTierExceedThroughputTooltip={isFreeTierAccount && !useDatabases.getState().isFirstResourceCreated()}
            isDatabase={false}
            isSharded
            isFreeTier={isFreeTierAccount}
            setThroughputValue={(throughput: number) => (tableThroughput = throughput)}
            setIsAutoscale={(isAutoscale: boolean) => (isTableAutoscale = isAutoscale)}
            setIsThroughputCapExceeded={(isCapExceeded: boolean) => setIsThroughputCapExceeded(isCapExceeded)}
            onCostAcknowledgeChange={(isAcknowledged: boolean) => (isCostAcknowledged = isAcknowledged)}
          />
        )}
      </div>
    </RightPaneForm>
  );
};
