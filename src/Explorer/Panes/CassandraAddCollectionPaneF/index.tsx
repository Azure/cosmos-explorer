import { FunctionComponent, useEffect, useState } from "react";
import * as Constants from "../../../Common/Constants";
import { HashMap } from "../../../Common/HashMap";
import { configContext, Platform } from "../../../ConfigContext";
import * as DataModels from "../../../Contracts/DataModels";
import { SubscriptionType } from "../../../Contracts/SubscriptionType";
import * as ViewModels from "../../../Contracts/ViewModels";
import * as AddCollectionUtility from "../../../Shared/AddCollectionUtility";
import * as SharedConstants from "../../../Shared/Constants";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../../Utils/PricingUtils";
import Explorer from "../../Explorer";


export interface CassandraAddCollectionPaneFProps {
  explorer: Explorer;
  closePanel: () => void;
}

export const CassandraAddCollectionPaneF: FunctionComponent<CassandraAddCollectionPaneFProps> = ({
  explorer: container,
  closePanel,
}: CassandraAddCollectionPaneFProps) => {
  const throughputDefaults = container.collectionCreationDefaults.throughput;
  const [createTableQuery, setCreateTableQuery] = useState<string>("CREATE TABLE ")
  const [keyspaceId, setKeyspaceId] = useState<string>()
  const [maxThroughputRU, setMaxThroughputRU] = useState<number>(throughputDefaults.unlimitedmax)
  const [minThroughputRU, setMinThroughputRU] = useState<number>(throughputDefaults.unlimitedmin)
  const [tableId, setTableId] = useState<string>("");
  const [throughput, setThroughput] = useState<number>(AddCollectionUtility.getMaxThroughput(container.collectionCreationDefaults, container));
  const [throughputRangeText, setThroughputRangeText] = useState<string>(() => {
    if (!isAutoPilotSelected()) {
      return `Throughput (${minThroughputRU().toLocaleString()} - ${maxThroughputRU().toLocaleString()} RU/s)`;
    }
    return AutoPilotUtils.getAutoPilotHeaderText();
  })
  const [sharedThroughputRangeText, setSharedThroughputRangeText] = useState<string>(() => {
    if (isSharedAutoPilotSelected()) {
      return AutoPilotUtils.getAutoPilotHeaderText();
    }
    return `Throughput (${minThroughputRU().toLocaleString()} - ${maxThroughputRU().toLocaleString()} RU/s)`;
  })
  const [userTableQuery, setUserTableQuery] = useState<string>("(userid int, name text, email text, PRIMARY KEY (userid))")
  const [requestUnitsUsageCostDedicated, setRequestUnitsUsageCostDedicated] = useState<string>(() => {
    const account = container.databaseAccount();
    if (!account) {
      return "";
    }

    const regions =
      (account &&
        account.properties &&
        account.properties.readLocations &&
        account.properties.readLocations.length) ||
      1;
    const multimaster = (account && account.properties && account.properties.enableMultipleWriteLocations) || false;
    const offerThroughput: number = throughput;
    let estimatedSpend: string;
    let estimatedDedicatedSpendAcknowledge: string;
    if (!isAutoPilotSelected()) {
      estimatedSpend = PricingUtils.getEstimatedSpendHtml(
        offerThroughput,
        userContext.portalEnv,
        regions,
        multimaster
      );
      estimatedDedicatedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
        offerThroughput,
        userContext.portalEnv,
        regions,
        multimaster,
        isAutoPilotSelected()
      );
    } else {
      estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
        selectedAutoPilotThroughput(),
        userContext.portalEnv,
        regions,
        multimaster
      );
      estimatedDedicatedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
        selectedAutoPilotThroughput(),
        userContext.portalEnv,
        regions,
        multimaster,
        isAutoPilotSelected()
      );
    }
    setThroughputSpendAckText(estimatedDedicatedSpendAcknowledge);
    return estimatedSpend;
  })
  const [requestUnitsUsageCostShared, setRequestUnitsUsageCostShared] = useState<string>(() => {
    const account = container.databaseAccount();
    if (!account) {
      return "";
    }

    const regions =
      (account &&
        account.properties &&
        account.properties.readLocations &&
        account.properties.readLocations.length) ||
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
  })
  const [costsVisible, setCostsVisible] = useState<boolean>(configContext.platform !== Platform.Emulator)
  const [keyspaceHasSharedOffer, setKeyspaceHasSharedOffer] = useState<boolean>(false)
  const [keyspaceIds, setKeyspaceIds] = useState<string>("")
  const [keyspaceThroughput, setKeyspaceThroughput] = useState<number>(throughputDefaults.shared)
  const [keyspaceCreateNew, setKeyspaceCreateNew] = useState<boolean>(true)
  const [dedicateTableThroughput, setDedicateTableThroughput] = useState<boolean>(false)
  const [canRequestSupport, setCanRequestSupport] = useState<boolean>(() => {
    if (configContext.platform !== Platform.Emulator && !userContext.isTryCosmosDBSubscription) {
      const offerThroughput: number = throughput;
      return offerThroughput <= 100000;
    }

    return false;
  })
  const [throughputSpendAckText, setThroughputSpendAckText] = useState<string>();
  const [throughputSpendAck, setThroughputSpendAck] = useState<boolean>(false)
  const [sharedThroughputSpendAck, setSharedThroughputSpendAck] = useState<boolean>(false)
  
  const [sharedThroughputSpendAckText, setSharedThroughputSpendAckText] = useState<string>();
  
  const [isAutoPilotSelected, setIsAutoPilotSelected] = useState<boolean>(container.isAutoscaleDefaultEnabled())
  const [isSharedAutoPilotSelected, setIsSharedAutoPilotSelected] = useState<boolean>(container.isAutoscaleDefaultEnabled())
  
  const [selectedAutoPilotThroughput, setSelectedAutoPilotThroughput] = useState<number>(AutoPilotUtils.minAutoPilotThroughput)
  const [sharedAutoPilotThroughput, setSharedAutoPilotThroughput] = useState<number>(AutoPilotUtils.minAutoPilotThroughput)
  
  
const [autoPilotUsageCost, setAutoPilotUsageCost] = useState  <string>(() => {
    const autoPilot = _getAutoPilot();
    if (!autoPilot) {
      return "";
    }
    const isDatabaseThroughput: boolean = keyspaceCreateNew();
    return PricingUtils.getAutoPilotV3SpendHtml(autoPilot.maxThroughput, isDatabaseThroughput);
  })
const [sharedThroughputSpendAckVisible, setSharedThroughputSpendAckVisible] = useState<boolean>(() => {
  const autoscaleThroughput = sharedAutoPilotThroughput * 1;
  if (isSharedAutoPilotSelected) {
    return autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
  }

  return keyspaceThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
})

const [throughputSpendAckVisible, setThroughputSpendAckVisible] = useState<boolean>(() => {
  const autoscaleThroughput = selectedAutoPilotThroughput * 1;
  if (isAutoPilotSelected) {
    return autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
  }

  return throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
})
  
  const [canExceedMaximumValue, setCanExceedMaximumValue] = useState<boolean>(container.canExceedMaximumValue())
  const [isFreeTierAccount, setIsFreeTierAccount] = useState<boolean>( userContext.databaseAccount?.properties?.enableFreeTier)
  
  const [ruToolTipText, setRuToolTipText] = useState<string>(PricingUtils.getRuToolTipText())
  const [canConfigureThroughput, setCanConfigureThroughput] = useState<boolean>( !container.isServerlessEnabled())
  
  let keyspaceOffers: HashMap<DataModels.Offer>;
  let title = ("Add Table");
  const [isExecuting, setIsExecuting] = useState<boolean>();
  const [formErrors, setFormErrors] = useState<string>("")
  
  useEffect(() => {
    
      if (keyspaceIds.indexOf(keyspaceId) >= 0) {
        keyspaceHasSharedOffer(keyspaceOffers.has(keyspaceId));
      }
      createTableQuery(`CREATE TABLE ${keyspaceId}.`);
  }, [keyspaceId])

  
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
      subscriptionType: SubscriptionType[container.subscriptionType()],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        storage: "u",
        throughput: throughput(),
        flight: container.flight(),
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
    };
    const focusElement = document.getElementById("keyspace-id");
    focusElement && focusElement.focus();
    TelemetryProcessor.trace(Action.CreateCollection, ActionModifiers.Open, addCollectionPaneOpenMessage);
  }, [])
 

 
  constructor(options: ViewModels.PaneOptions) {
    this.keyspaceId.extend({ rateLimit: 100 });


    if (!!container) {
      const updateKeyspaceIds: (keyspaces: ViewModels.Database[]) => void = (
        newKeyspaceIds: ViewModels.Database[]
      ): void => {
        const cachedKeyspaceIdsList = _.map(newKeyspaceIds, (keyspace: ViewModels.Database) => {
          if (keyspace && keyspace.offer && !!keyspace.offer()) {
            this.keyspaceOffers.set(keyspace.id(), keyspace.offer());
          }
          return keyspace.id();
        });
        keyspaceIds(cachedKeyspaceIdsList);
      };
      container.databases.subscribe((newDatabases: ViewModels.Database[]) => updateKeyspaceIds(newDatabases));
      updateKeyspaceIds(container.databases());
    }

  }










  const decreaseThroughput = () => {
    let offerThroughput: number = throughput;

    if (offerThroughput > minThroughputRU) {
      offerThroughput -= 100;
      setThroughput(offerThroughput);
    }
  }

  const  increaseThroughput = () => {
    let offerThroughput: number = throughput;

    if (offerThroughput < maxThroughputRU) {
      offerThroughput += 100;
      setThroughput(offerThroughput);
    }
  }
  
  const _getAutoPilot = (): DataModels.AutoPilotCreationSettings => {
    if (
      keyspaceCreateNew &&
      keyspaceHasSharedOffer &&
      isSharedAutoPilotSelected &&
      sharedAutoPilotThroughput
    ) {
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
  }





  const _isValid : boolean = () =>{

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

    if (
      (keyspaceCreateNew && keyspaceHasSharedOffer && isSharedAutoPilotSelected) ||
      isAutoPilotSelected
    ) {
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

    if (throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && !this.throughputSpendAck()) {
      setFormErrors(`Please acknowledge the estimated daily spend.`);
      return false;
    }

    if (
      keyspaceHasSharedOffer&&
      keyspaceCreateNew &&
      keyspaceThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K &&
      !sharedThroughputSpendAck
    ) {
      setFormErrors("Please acknowledge the estimated daily spend");
      return false;
    }

    return true;
  }


  const submit = () => {
    if (!_isValid()) {
      return;
    }
    setIsExecuting(true);
    const autoPilotCommand = `cosmosdb_autoscale_max_throughput`;
    let createTableAndKeyspacePromise: Q.Promise<any>;
    const toCreateKeyspace: boolean = keyspaceCreateNew;
    const useAutoPilotForKeyspace: boolean = isSharedAutoPilotSelected && !!sharedAutoPilotThroughput;
    const createKeyspaceQueryPrefix: string = `CREATE KEYSPACE ${keyspaceId.trim()} WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 3 }`;
    const createKeyspaceQuery: string = keyspaceHasSharedOffer
      ? useAutoPilotForKeyspace
        ? `${createKeyspaceQueryPrefix} AND ${autoPilotCommand}=${sharedAutoPilotThroughput};`
        : `${createKeyspaceQueryPrefix} AND cosmosdb_provisioned_throughput=${keyspaceThroughput)};`
      : `${createKeyspaceQueryPrefix};`;
    const createTableQueryPrefix: string = `${createTableQuery}${tableId.trim()} ${userTableQuery}`;
    let createTableQuery: string;

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
      subscriptionType: SubscriptionType[container.subscriptionType()],
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        storage: "u",
        throughput: throughput,
        flight: container.flight(),
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
      toCreateKeyspace: toCreateKeyspace,
      createKeyspaceQuery: createKeyspaceQuery,
      createTableQuery: createTableQuery,
    };

    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, addCollectionPaneStartMessage);
    if (toCreateKeyspace) {
      createTableAndKeyspacePromise = (<CassandraAPIDataClient>container.tableDataClient).createTableAndKeyspace(
        container.databaseAccount().properties.cassandraEndpoint,
        container.databaseAccount().id,
        container,
        createTableQuery,
        createKeyspaceQuery
      );
    } else {
      createTableAndKeyspacePromise = (<CassandraAPIDataClient>container.tableDataClient).createTableAndKeyspace(
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
        const addCollectionPaneSuccessMessage = {
          collection: {
            id: tableId,
            storage: Constants.BackendDefaults.multiPartitionStorageInGb,
            offerThroughput: throughput,
            partitionKey: "",
            databaseId: keyspaceId,
            hasDedicatedThroughput: dedicateTableThroughput,
          },
          keyspaceHasSharedOffer: keyspaceHasSharedOffer(),
          subscriptionType: SubscriptionType[container.subscriptionType()],
          subscriptionQuotaId: userContext.quotaId,
          defaultsCheck: {
            storage: "u",
            throughput: throughput(),
            flight: container.flight(),
          },
          dataExplorerArea: Constants.Areas.ContextualPane,
          toCreateKeyspace: toCreateKeyspace,
          createKeyspaceQuery: createKeyspaceQuery,
          createTableQuery: createTableQuery,
        };
        TelemetryProcessor.traceSuccess(Action.CreateCollection, addCollectionPaneSuccessMessage, startKey);
      },
      (error) => {
        const errorMessage = getErrorMessage(error);
        this.formErrors(errorMessage);
        this.isExecuting(false);
        const addCollectionPaneFailedMessage = {
          collection: {
            id: this.tableId(),
            storage: Constants.BackendDefaults.multiPartitionStorageInGb,
            offerThroughput: this.throughput(),
            partitionKey: "",
            databaseId: this.keyspaceId(),
            hasDedicatedThroughput: this.dedicateTableThroughput(),
          },
          keyspaceHasSharedOffer: this.keyspaceHasSharedOffer(),
          subscriptionType: SubscriptionType[container.subscriptionType()],
          subscriptionQuotaId: userContext.quotaId,
          defaultsCheck: {
            storage: "u",
            throughput: this.throughput(),
            flight: container.flight(),
          },
          dataExplorerArea: Constants.Areas.ContextualPane,
          toCreateKeyspace: toCreateKeyspace,
          createKeyspaceQuery: createKeyspaceQuery,
          createTableQuery: createTableQuery,
          error: errorMessage,
          errorStack: getErrorStack(error),
        };
        TelemetryProcessor.traceFailure(Action.CreateCollection, addCollectionPaneFailedMessage, startKey);
      }
    );
  }

 

  
  return (
    <div data-bind="visible: visible, event: { keydown: onPaneKeyDown }">
      <div
        className="contextual-pane-out"
        data-bind="
    click: cancel,
    clickBubble: false"
      ></div>
      <div className="contextual-pane" id="cassandraaddcollectionpane">
        {/* Add Cassandra collection form - Start */}
        <div className="contextual-pane-in">
          <form
            className="paneContentContainer"
            role="dialog"
            aria-label="Add Table"
            data-bind="
            submit: submit"
          >
            {/* Add Cassandra collection header - Start */}
            <div className="firstdivbg headerline">
              <span role="heading" aria-level="2" data-bind="text: title"></span>
              <div
                className="closeImg"
                role="button"
                aria-label="Close pane"
                tabindex="0"
                data-bind="
                    click: cancel, event: { keypress: onCloseKeyPress }"
              >
                <img src="../../../images/close-black.svg" title="Close" alt="Close" />
              </div>
            </div>
            {/* Add Cassandra collection header - End */}
            {/* Add Cassandra collection errors - Start */}
            <div
              className="warningErrorContainer"
              aria-live="assertive"
              data-bind="visible: formErrors() && formErrors() !== ''"
            >
              <div className="warningErrorContent">
                <span>
                  <img className="paneErrorIcon" src="/error_red.svg" alt="Error" />
                </span>
                <span className="warningErrorDetailsLinkContainer">
                  <span className="formErrors" data-bind="text: formErrors, attr: { title: formErrors }"></span>
                </span>
              </div>
            </div>
            {/* Add Cassandra collection errors - End */}
            <div className="paneMainContent">
              <div className="seconddivpadding">
                <p>
                  <span className="mandatoryStar">*</span> Keyspace name
                  <span className="infoTooltip" role="tooltip" tabindex="0">
                    <img className="infoImg" src="/info-bubble.svg" alt="More information" />
                    <span className="tooltiptext infoTooltipWidth">
                      Select an existing keyspace or enter a new keyspace id.
                    </span>
                  </span>
                </p>

                <div className="createNewDatabaseOrUseExisting">
                  <input
                    className="createNewDatabaseOrUseExistingRadio"
                    aria-label="Create new keyspace"
                    name="databaseType"
                    type="radio"
                    role="radio"
                    id="keyspaceCreateNew"
                    data-test="addCollection-newDatabase"
                    tabindex="0"
                    data-bind="checked: keyspaceCreateNew, checkedValue: true, attr: { 'aria-checked': keyspaceCreateNew() ? 'true' : 'false' }"
                  />
                  <span className="createNewDatabaseOrUseExistingSpace" for="keyspaceCreateNew">
                    Create new
                  </span>

                  <input
                    className="createNewDatabaseOrUseExistingRadio"
                    aria-label="Use existing keyspace"
                    name="databaseType"
                    type="radio"
                    role="radio"
                    id="keyspaceUseExisting"
                    data-test="addCollection-existingDatabase"
                    tabindex="0"
                    data-bind="checked: keyspaceCreateNew, checkedValue: false, attr: { 'aria-checked': !keyspaceCreateNew() ? 'true' : 'false' }"
                  />
                  <span className="createNewDatabaseOrUseExistingSpace" for="keyspaceUseExisting">
                    Use existing
                  </span>
                </div>

                <input
                  id="keyspace-id"
                  data-test="addCollection-keyspaceId"
                  type="text"
                  autocomplete="off"
                  pattern="[^/?#\\]*[^/?# \\]"
                  title="May not end with space nor contain characters '\' '/' '#' '?'"
                  placeholder="Type a new keyspace id"
                  size="40"
                  className="collid"
                  data-bind="visible: keyspaceCreateNew, textInput: keyspaceId, hasFocus: firstFieldHasFocus"
                  aria-label="Keyspace id"
                  aria-required="true"
                  autofocus
                />

                <input
                  type="text"
                  aria-required="true"
                  autocomplete="off"
                  pattern="[^/?#\\]*[^/?# \\]"
                  title="May not end with space nor contain characters '\' '/' '#' '?'"
                  list="keyspacesList"
                  placeholder="Choose existing keyspace id"
                  size="40"
                  className="collid"
                  data-bind="visible: !keyspaceCreateNew(), textInput: keyspaceId, hasFocus: firstFieldHasFocus"
                  aria-label="Keyspace id"
                />

                <datalist id="keyspacesList" data-bind="foreach: container.databases">
                  <option data-bind="value: $data.id"></option>
                </datalist>

                {/* Database provisioned throughput - Start */}
                {/* ko if: canConfigureThroughput */}
                <div
                  className="databaseProvision"
                  aria-label="New database provision support"
                  data-bind="visible: keyspaceCreateNew"
                >
                  <input
                    tabindex="0"
                    type="checkbox"
                    id="keyspaceSharedThroughput"
                    title="Provision shared throughput"
                    data-bind="checked: keyspaceHasSharedOffer"
                  />
                  <span className="databaseProvisionText" for="keyspaceSharedThroughput">
                    Provision keyspace throughput
                  </span>
                  <span className="infoTooltip" role="tooltip" tabindex="0">
                    <img className="infoImg" src="/info-bubble.svg" alt="More information" />
                    <span className="tooltiptext provisionDatabaseThroughput">
                      Provisioned throughput at the keyspace level will be shared across unlimited number of tables
                      within the keyspace
                    </span>
                  </span>
                </div>
                {/* 1 */}
                <div data-bind="visible: keyspaceCreateNew() && keyspaceHasSharedOffer()">
                  <throughput-input-autopilot-v3
                    params="{ 
                                    testId: 'cassandraThroughputValue-v3-shared',
                                    value: keyspaceThroughput, 
                                    minimum: minThroughputRU, 
                                    maximum: maxThroughputRU, 
                                    isEnabled: keyspaceCreateNew() && keyspaceHasSharedOffer(), 
                                    label: sharedThroughputRangeText,
                                    ariaLabel: sharedThroughputRangeText,
                                    requestUnitsUsageCost: requestUnitsUsageCostShared,
                                    spendAckChecked: sharedThroughputSpendAck,
                                    spendAckId: 'sharedThroughputSpendAck-v3-shared',
                                    spendAckText: sharedThroughputSpendAckText,
                                    spendAckVisible: sharedThroughputSpendAckVisible,
                                    showAsMandatory: true,
                                    infoBubbleText: ruToolTipText,
                                    throughputAutoPilotRadioId: 'newKeyspace-databaseThroughput-autoPilotRadio-v3-shared',
                                    throughputProvisionedRadioId: 'newKeyspace-databaseThroughput-manualRadio-v3-shared',
                                    isAutoPilotSelected: isSharedAutoPilotSelected,
                                    maxAutoPilotThroughputSet: sharedAutoPilotThroughput,
                                    autoPilotUsageCost: autoPilotUsageCost,
                                    canExceedMaximumValue: canExceedMaximumValue,
                            costsVisible: costsVisible,
                                    }"
                  ></throughput-input-autopilot-v3>
                </div>
                {/* /ko */}
                {/* Database provisioned throughput - End */}
              </div>
              <div className="seconddivpadding">
                <p>
                  <span className="mandatoryStar">*</span> Enter CQL command to create the table.
                  <a href="https://aka.ms/cassandra-create-table" target="_blank">
                    Learn More
                  </a>
                </p>
                <div data-bind="text: createTableQuery" style="float: left; padding-top: 3px; padding-right: 3px"></div>
                <input
                  type="text"
                  data-test="addCollection-tableId"
                  aria-required="true"
                  autocomplete="off"
                  pattern="[^/?#\\]*[^/?# \\]"
                  title="May not end with space nor contain characters '\' '/' '#' '?'"
                  data-test="addCollection-tableId"
                  placeholder="Enter tableId"
                  size="20"
                  className="textfontclr"
                  data-bind="value: tableId"
                  style="margin-bottom: 5px"
                />
                <textarea
                  id="editor-area"
                  rows="15"
                  aria-label="Table Schema"
                  data-bind="value: userTableQuery"
                  style="height: 125px; width: calc(100% - 80px); resize: vertical"
                ></textarea>
              </div>

              {/* Provision table throughput - start */}
              {/* ko if: canConfigureThroughput */}
              <div className="seconddivpadding" data-bind="visible: keyspaceHasSharedOffer() && !keyspaceCreateNew()">
                <input
                  type="checkbox"
                  id="tableSharedThroughput"
                  title="Provision dedicated throughput for this table"
                  data-bind="checked: dedicateTableThroughput"
                />
                <span for="tableSharedThroughput">Provision dedicated throughput for this table</span>
                <span className="leftAlignInfoTooltip" role="tooltip" tabindex="0">
                  <img className="infoImg" src="/info-bubble.svg" alt="More information" />
                  <span className="tooltiptext sharedCollectionThroughputTooltipWidth">
                    You can optionally provision dedicated throughput for a table within a keyspace that has throughput
                    provisioned. This dedicated throughput amount will not be shared with other tables in the keyspace
                    and does not count towards the throughput you provisioned for the keyspace. This throughput amount
                    will be billed in addition to the throughput amount you provisioned at the keyspace level.
                  </span>
                </span>
              </div>
              {/* 2 */}
              <div data-bind="visible: !keyspaceHasSharedOffer() || dedicateTableThroughput()">
                <throughput-input-autopilot-v3
                  params="{ 
                            testId: 'cassandraSharedThroughputValue-v3-dedicated',
                            value: throughput, 
                            minimum: minThroughputRU, 
                            maximum: maxThroughputRU, 
                            isEnabled: !keyspaceHasSharedOffer() || dedicateTableThroughput(), 
                            label: throughputRangeText,
                            ariaLabel: throughputRangeText,
                            costsVisible: costsVisible,
                            requestUnitsUsageCost: requestUnitsUsageCostDedicated,
                            spendAckChecked: throughputSpendAck,
                            spendAckId: 'throughputSpendAckCassandra-v3-dedicated',
                            spendAckText: throughputSpendAckText,
                            spendAckVisible: throughputSpendAckVisible,
                            showAsMandatory: true,
                            infoBubbleText: ruToolTipText,
                            throughputAutoPilotRadioId: 'newKeyspace-containerThroughput-autoPilotRadio-v3-dedicated',
                            throughputProvisionedRadioId: 'newKeyspace-containerThroughput-manualRadio-v3-dedicated',
                            isAutoPilotSelected: isAutoPilotSelected,
                            maxAutoPilotThroughputSet: selectedAutoPilotThroughput,
                            autoPilotUsageCost: autoPilotUsageCost,
                            canExceedMaximumValue: canExceedMaximumValue,
                            overrideWithAutoPilotSettings: false,
                        overrideWithProvisionedThroughputSettings: false
                        }"
                ></throughput-input-autopilot-v3>
              </div>
              {/* /ko */}
              {/* Provision table throughput - end */}
            </div>
            <div className="paneFooter">
              <div className="leftpanel-okbut">
                <input type="submit" data-test="addCollection-createCollection" value="OK" className="btncreatecoll1" />
              </div>
            </div>
          </form>
          {/* Add Cassandra collection form - End */}
          {/* Loader - Start */}
          <div className="dataExplorerLoaderContainer dataExplorerPaneLoaderContainer" data-bind="visible: isExecuting">
            <img className="dataExplorerLoader" src="/LoadingIndicator_3Squares.gif" alt="loading indicator" />
          </div>
          {/* Loader - End */}
        </div>
      </div>
    </div>
  );
};
