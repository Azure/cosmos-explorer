import { ChoiceGroup, IChoiceGroupOption, Label, TextField } from "office-ui-fabric-react";
import React, { FunctionComponent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { HashMap } from "../../../Common/HashMap";
import { Tooltip } from "../../../Common/Tooltip/Tooltip";
import { configContext, Platform } from "../../../ConfigContext";
import * as DataModels from "../../../Contracts/DataModels";
import * as AddCollectionUtility from "../../../Shared/AddCollectionUtility";
import * as SharedConstants from "../../../Shared/Constants";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../../Utils/PricingUtils";
import { ThroughputInput } from "../../Controls/ThroughputInput/ThroughputInput";
import Explorer from "../../Explorer";
import { CassandraAPIDataClient } from "../../Tables/TableDataClient";
import {
  GenericRightPaneComponent,
  GenericRightPaneProps,
} from "../GenericRightPaneComponent/GenericRightPaneComponent";

export interface CassandraAddCollectionPaneFProps {
  explorer: Explorer;
  closePanel: () => void;
  cassandraApiClient: CassandraAPIDataClient;
}

export const CassandraAddCollectionPaneF: FunctionComponent<CassandraAddCollectionPaneFProps> = ({
  explorer: container,
  closePanel,
  cassandraApiClient,
}: CassandraAddCollectionPaneFProps) => {
  const throughputDefaults = container.collectionCreationDefaults.throughput;
  const [createTableQuery, setCreateTableQuery] = useState<string>("CREATE TABLE ");
  const [keyspaceId, setKeyspaceId] = useState<string>("");
  const [maxThroughputRU, setMaxThroughputRU] = useState<number>(throughputDefaults.unlimitedmax);
  const [minThroughputRU, setMinThroughputRU] = useState<number>(throughputDefaults.unlimitedmin);
  const [tableId, setTableId] = useState<string>("");
  const [throughput, setThroughput] = useState<number>(
    AddCollectionUtility.getMaxThroughput(container.collectionCreationDefaults, container)
  );

  const [isAutoPilotSelected, setIsAutoPilotSelected] = useState<boolean>(container.isAutoscaleDefaultEnabled());

  const [throughputRangeText, setThroughputRangeText] = useState<string>(() => {
    if (!isAutoPilotSelected) {
      return `Throughput (${minThroughputRU.toLocaleString()} - ${maxThroughputRU.toLocaleString()} RU/s)`;
    }
    return AutoPilotUtils.getAutoPilotHeaderText();
  });
  const [isSharedAutoPilotSelected, setIsSharedAutoPilotSelected] = useState<boolean>(
    container.isAutoscaleDefaultEnabled()
  );
  const [sharedThroughputRangeText, setSharedThroughputRangeText] = useState<string>(() => {
    if (isSharedAutoPilotSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText();
    }
    return `Throughput (${minThroughputRU.toLocaleString()} - ${maxThroughputRU.toLocaleString()} RU/s)`;
  });
  const [userTableQuery, setUserTableQuery] = useState<string>(
    "(userid int, name text, email text, PRIMARY KEY (userid))"
  );

  const [costsVisible, setCostsVisible] = useState<boolean>(configContext.platform !== Platform.Emulator);
  const [keyspaceHasSharedOffer, setKeyspaceHasSharedOffer] = useState<boolean>(false);
  const [keyspaceIds, setKeyspaceIds] = useState<string>("");
  const [keyspaceThroughput, setKeyspaceThroughput] = useState<number>(throughputDefaults.shared);
  const [keyspaceCreateNew, setKeyspaceCreateNew] = useState<boolean>(true);
  const [dedicateTableThroughput, setDedicateTableThroughput] = useState<boolean>(false);
  const [canRequestSupport, setCanRequestSupport] = useState<boolean>(() => {
    if (configContext.platform !== Platform.Emulator && !userContext.isTryCosmosDBSubscription) {
      const offerThroughput: number = throughput;
      return offerThroughput <= 100000;
    }

    return false;
  });
  const [throughputSpendAckText, setThroughputSpendAckText] = useState<string>();
  const [throughputSpendAck, setThroughputSpendAck] = useState<boolean>(false);
  const [sharedThroughputSpendAck, setSharedThroughputSpendAck] = useState<boolean>(false);

  const [sharedThroughputSpendAckText, setSharedThroughputSpendAckText] = useState<string>();

  const [selectedAutoPilotThroughput, setSelectedAutoPilotThroughput] = useState<number>(
    AutoPilotUtils.minAutoPilotThroughput
  );
  const [sharedAutoPilotThroughput, setSharedAutoPilotThroughput] = useState<number>(
    AutoPilotUtils.minAutoPilotThroughput
  );
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
  const [autoPilotUsageCost, setAutoPilotUsageCost] = useState<string>(() => {
    const autoPilot = _getAutoPilot();
    if (!autoPilot) {
      return "";
    }
    const isDatabaseThroughput: boolean = keyspaceCreateNew;
    return PricingUtils.getAutoPilotV3SpendHtml(autoPilot.maxThroughput, isDatabaseThroughput);
  });
  const [sharedThroughputSpendAckVisible, setSharedThroughputSpendAckVisible] = useState<boolean>(() => {
    const autoscaleThroughput = sharedAutoPilotThroughput * 1;
    if (isSharedAutoPilotSelected) {
      return autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
    }

    return keyspaceThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
  });

  const [throughputSpendAckVisible, setThroughputSpendAckVisible] = useState<boolean>(() => {
    const autoscaleThroughput = selectedAutoPilotThroughput * 1;
    if (isAutoPilotSelected) {
      return autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
    }

    return throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
  });

  const [canExceedMaximumValue, setCanExceedMaximumValue] = useState<boolean>(container.canExceedMaximumValue());
  const [isFreeTierAccount, setIsFreeTierAccount] = useState<boolean>(
    userContext.databaseAccount?.properties?.enableFreeTier
  );

  const [ruToolTipText, setRuToolTipText] = useState<string>(PricingUtils.getRuToolTipText());
  const [canConfigureThroughput, setCanConfigureThroughput] = useState<boolean>(!container.isServerlessEnabled());

  const [requestUnitsUsageCostDedicated, setRequestUnitsUsageCostDedicated] = useState<string>(() => {
    const account = container.databaseAccount();
    if (!account) {
      return "";
    }

    const regions =
      (account && account.properties && account.properties.readLocations && account.properties.readLocations.length) ||
      1;
    const multimaster = (account && account.properties && account.properties.enableMultipleWriteLocations) || false;
    const offerThroughput: number = throughput;
    let estimatedSpend: string;
    let estimatedDedicatedSpendAcknowledge: string;
    if (!isAutoPilotSelected) {
      estimatedSpend = PricingUtils.getEstimatedSpendHtml(offerThroughput, userContext.portalEnv, regions, multimaster);
      estimatedDedicatedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
        offerThroughput,
        userContext.portalEnv,
        regions,
        multimaster,
        isAutoPilotSelected
      );
    } else {
      estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
        selectedAutoPilotThroughput,
        userContext.portalEnv,
        regions,
        multimaster
      );
      estimatedDedicatedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
        selectedAutoPilotThroughput,
        userContext.portalEnv,
        regions,
        multimaster,
        isAutoPilotSelected
      );
    }
    setThroughputSpendAckText(estimatedDedicatedSpendAcknowledge);
    return estimatedSpend;
  });
  const [requestUnitsUsageCostShared, setRequestUnitsUsageCostShared] = useState<string>(() => {
    const account = container.databaseAccount();
    if (!account) {
      return "";
    }

    const regions =
      (account && account.properties && account.properties.readLocations && account.properties.readLocations.length) ||
      1;
    const multimaster = (account && account.properties && account.properties.enableMultipleWriteLocations) || false;
    let estimatedSpend: string;
    let estimatedSharedSpendAcknowledge: string;
    if (!isSharedAutoPilotSelected) {
      estimatedSpend = PricingUtils.getEstimatedSpendHtml(
        keyspaceThroughput,
        userContext.portalEnv,
        regions,
        multimaster
      );
      estimatedSharedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
        keyspaceThroughput,
        userContext.portalEnv,
        regions,
        multimaster,
        isSharedAutoPilotSelected
      );
    } else {
      estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
        sharedAutoPilotThroughput,
        userContext.portalEnv,
        regions,
        multimaster
      );
      estimatedSharedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
        sharedAutoPilotThroughput,
        userContext.portalEnv,
        regions,
        multimaster,
        isSharedAutoPilotSelected
      );
    }
    setSharedThroughputSpendAckText(estimatedSharedSpendAcknowledge);
    return estimatedSpend;
  });

  const keyspaceOffers: HashMap<DataModels.Offer> = new HashMap();
  const title = "Add Table";
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

  // constructor(options: ViewModels.PaneOptions) {
  //   this.keyspaceId.extend({ rateLimit: 100 });

  //   if (!!container) {
  //     const updateKeyspaceIds: (keyspaces: ViewModels.Database[]) => void = (
  //       newKeyspaceIds: ViewModels.Database[]
  //     ): void => {
  //       const cachedKeyspaceIdsList = _.map(newKeyspaceIds, (keyspace: ViewModels.Database) => {
  //         if (keyspace && keyspace.offer && !!keyspace.offer()) {
  //           keyspaceOffers.set(keyspace.id(), keyspace.offer());
  //         }
  //         return keyspace.id();
  //       });
  //       setKeyspaceIds(cachedKeyspaceIdsList);
  //     };
  //     container.databases.subscribe((newDatabases: ViewModels.Database[]) => updateKeyspaceIds(newDatabases));
  //     updateKeyspaceIds(container.databases());
  //   }

  // }

  const decreaseThroughput = () => {
    let offerThroughput: number = throughput;

    if (offerThroughput > minThroughputRU) {
      offerThroughput -= 100;
      setThroughput(offerThroughput);
    }
  };

  const increaseThroughput = () => {
    let offerThroughput: number = throughput;

    if (offerThroughput < maxThroughputRU) {
      offerThroughput += 100;
      setThroughput(offerThroughput);
    }
  };

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

  const submit = () => {
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

    let createTableQuery: string;
    const createTableQueryPrefix = `${createTableQuery}${tableId.trim()} ${userTableQuery}`;

    if (canConfigureThroughput && (dedicateTableThroughput || !keyspaceHasSharedOffer)) {
      if (isAutoPilotSelected && selectedAutoPilotThroughput) {
        createTableQuery = `${createTableQueryPrefix} WITH ${autoPilotCommand}=${selectedAutoPilotThroughput};`;
      } else {
        createTableQuery = `${createTableQueryPrefix} WITH cosmosdb_provisioned_throughput=${throughput};`;
      }
    } else {
      createTableQuery = `${createTableQueryPrefix};`;
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
      createTableQuery: createTableQuery,
    };

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, addCollectionPaneStartMessage);

    console.log(
      "abc",
      startKey,
      container.databaseAccount().properties.cassandraEndpoint,
      container.databaseAccount().id,
      container,
      createTableQuery,
      createKeyspaceQuery
    );
    let createTableAndKeyspacePromise: Q.Promise<any>;
    if (toCreateKeyspace) {
      createTableAndKeyspacePromise = cassandraApiClient.createTableAndKeyspace(
        container.databaseAccount().properties.cassandraEndpoint,
        container.databaseAccount().id,
        container,
        createTableQuery,
        createKeyspaceQuery
      );
    } else {
      createTableAndKeyspacePromise = cassandraApiClient.createTableAndKeyspace(
        container.databaseAccount().properties.cassandraEndpoint,
        container.databaseAccount().id,
        container,
        createTableQuery
      );
    }
    createTableAndKeyspacePromise.then(
      () => {
        container.refreshAllDatabases();
        setIsExecuting(false);
        closePanel();
        // const addCollectionPaneSuccessMessage = {
        //   collection: {
        //     id: tableId,
        //     storage: Constants.BackendDefaults.multiPartitionStorageInGb,
        //     offerThroughput: throughput,
        //     partitionKey: "",
        //     databaseId: keyspaceId,
        //     hasDedicatedThroughput: dedicateTableThroughput,
        //   },
        //   keyspaceHasSharedOffer: keyspaceHasSharedOffer(),
        //   subscriptionType: SubscriptionType[container.subscriptionType()],
        //   subscriptionQuotaId: userContext.quotaId,
        //   defaultsCheck: {
        //     storage: "u",
        //     throughput: throughput(),
        //     flight: container.flight(),
        //   },
        //   dataExplorerArea: Constants.Areas.ContextualPane,
        //   toCreateKeyspace: toCreateKeyspace,
        //   createKeyspaceQuery: createKeyspaceQuery,
        //   createTableQuery: createTableQuery,
        // };
        // TelemetryProcessor.traceSuccess(Action.CreateCollection, addCollectionPaneSuccessMessage, startKey);
      },
      (error) => {
        console.log("errror", error);
        // const errorMessage = getErrorMessage(error);
        // this.formErrors(errorMessage);
        // this.isExecuting(false);
        // const addCollectionPaneFailedMessage = {
        //   collection: {
        //     id: this.tableId(),
        //     storage: Constants.BackendDefaults.multiPartitionStorageInGb,
        //     offerThroughput: this.throughput(),
        //     partitionKey: "",
        //     databaseId: this.keyspaceId(),
        //     hasDedicatedThroughput: this.dedicateTableThroughput(),
        //   },
        //   keyspaceHasSharedOffer: this.keyspaceHasSharedOffer(),
        //   subscriptionType: SubscriptionType[container.subscriptionType()],
        //   subscriptionQuotaId: userContext.quotaId,
        //   defaultsCheck: {
        //     storage: "u",
        //     throughput: this.throughput(),
        //     flight: container.flight(),
        //   },
        //   dataExplorerArea: Constants.Areas.ContextualPane,
        //   toCreateKeyspace: toCreateKeyspace,
        //   createKeyspaceQuery: createKeyspaceQuery,
        //   createTableQuery: createTableQuery,
        //   error: errorMessage,
        //   errorStack: getErrorStack(error),
        // };
        // TelemetryProcessor.traceFailure(Action.CreateCollection, addCollectionPaneFailedMessage, startKey);
      }
    );
  };
  const handleOnChangeKeyspaceType = (ev: React.FormEvent<HTMLInputElement>, option: IChoiceGroupOption): void => {
    setKeyspaceCreateNew(option.key === "true");
  };
  const optionList: IChoiceGroupOption[] = [
    { key: "true", text: "Create new" },
    { key: "false", text: "Use existing" },
  ];
  const genericPaneProps: GenericRightPaneProps = {
    container,
    formError: formErrors,
    formErrorDetail: "",
    id: "cassandraaddcollectionpane",
    isExecuting,
    title: "Add Table",
    submitButtonText: "Apply",
    onClose: closePanel,
    onSubmit: submit,
  };
  return (
    <GenericRightPaneComponent {...genericPaneProps}>
      <div className="paneMainContent">
        <div className="seconddivpadding">
          <p>
            <Label required>
              Keyspace name <Tooltip>Select an existing keyspace or enter a new keyspace id.</Tooltip>
            </Label>
          </p>

          <div className="createNewDatabaseOrUseExisting">
            <ChoiceGroup
              selectedKey={"" + keyspaceCreateNew}
              options={optionList}
              onChange={handleOnChangeKeyspaceType}
              aria-label="Create new keyspace | Use existing keyspace"
            />
          </div>

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
            aria-label="Keyspace id"
            autoFocus
          />
          {/* <datalist id="keyspacesList">
            {container.databases &&
              container.databases.map((data: { id: number }, index: number) => <option key={index}>{data.id}</option>)}
          </datalist> */}
          {canConfigureThroughput && keyspaceCreateNew && (
            <div className="databaseProvision" aria-label="New database provision support">
              <input
                tabIndex={0}
                type="checkbox"
                id="keyspaceSharedThroughput"
                title="Provision shared throughput"
                checked={keyspaceHasSharedOffer}
                onChange={(e) => setKeyspaceHasSharedOffer(e.target.checked)}
              />
              <span className="databaseProvisionText">Provision keyspace throughput</span>
              <Tooltip>
                Provisioned throughput at the keyspace level will be shared across unlimited number of tables within the
                keyspace
              </Tooltip>
            </div>
          )}
          {canConfigureThroughput && keyspaceCreateNew && keyspaceHasSharedOffer && (
            <div>
              <ThroughputInput
                showFreeTierExceedThroughputTooltip={isFreeTierAccount && !container.isFirstResourceCreated()}
                isDatabase={false}
                isAutoscaleSelected={isAutoPilotSelected}
                throughput={throughput}
                setThroughputValue={(throughput: number) => setThroughput(throughput)}
                setIsAutoscale={(isAutoscale: boolean) => setIsAutoPilotSelected(isAutoscale)}
                onCostAcknowledgeChange={(isAcknowledge: boolean) => {}}
              />
            </div>
          )}
        </div>
        <div className="seconddivpadding">
          <p>
            <Label required>
              Enter CQL command to create the table.
              <a href="https://aka.ms/cassandra-create-table" target="_blank">
                Learn More
              </a>
            </Label>
          </p>
          <div style={{ float: "left", paddingTop: "3px", paddingRight: "3px" }}>{createTableQuery}</div>
          <TextField
            data-test="addCollection-tableId"
            aria-required="true"
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
            <Tooltip>
              You can optionally provision dedicated throughput for a table within a keyspace that has throughput
              provisioned. This dedicated throughput amount will not be shared with other tables in the keyspace and
              does not count towards the throughput you provisioned for the keyspace. This throughput amount will be
              billed in addition to the throughput amount you provisioned at the keyspace level.
            </Tooltip>
          </div>
        )}
        {canConfigureThroughput && (!keyspaceHasSharedOffer || dedicateTableThroughput) && (
          <div>
            <ThroughputInput
              showFreeTierExceedThroughputTooltip={isFreeTierAccount && !container.isFirstResourceCreated()}
              isDatabase={false}
              isSharded
              isAutoscaleSelected={isAutoPilotSelected}
              throughput={throughput}
              setThroughputValue={(throughput: number) => setThroughput(throughput)}
              setIsAutoscale={(isAutoscale: boolean) => setIsAutoPilotSelected(isAutoscale)}
              onCostAcknowledgeChange={(isAcknowledge: boolean) => {}}
            />
          </div>
        )}
      </div>
    </GenericRightPaneComponent>
  );
};
