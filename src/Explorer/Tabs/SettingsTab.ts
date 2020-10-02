import * as _ from "underscore";
import * as AutoPilotUtils from "../../Utils/AutoPilotUtils";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ko from "knockout";
import * as monaco from "monaco-editor";
import * as PricingUtils from "../../Utils/PricingUtils";
import * as SharedConstants from "../../Shared/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import DiscardIcon from "../../../images/discard.svg";
import editable from "../../Common/EditableUtility";
import Q from "q";
import SaveIcon from "../../../images/save-cosmos.svg";
import TabsBase from "./TabsBase";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { PlatformType } from "../../PlatformType";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import Explorer from "../Explorer";
import { updateOffer } from "../../Common/DocumentClientUtilityBase";
import { updateCollection } from "../../Common/dataAccess/updateCollection";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { userContext } from "../../UserContext";
import { updateOfferThroughputBeyondLimit } from "../../Common/dataAccess/updateOfferThroughputBeyondLimit";

const ttlWarning: string = `
The system will automatically delete items based on the TTL value (in seconds) you provide, without needing a delete operation explicitly issued by a client application. 
For more information see, <a target="_blank" href="https://aka.ms/cosmos-db-ttl">Time to Live (TTL) in Azure Cosmos DB</a>.`;

const indexingPolicyTTLWarningMessage: string = `
Changing the Indexing Policy impacts query results while the index transformation occurs. 
When a change is made and the indexing mode is set to consistent or lazy, queries return eventual results until the operation completes. 
For more information see, <a target="_blank" href="https://aka.ms/cosmosdb/modify-index-policy">Modifying Indexing Policies</a>.`;

const updateThroughputBeyondLimitWarningMessage: string = `
You are about to request an increase in throughput beyond the pre-allocated capacity. 
The service will scale out and increase throughput for the selected container. 
This operation will take 1-3 business days to complete. You can track the status of this request in Notifications.`;

const updateThroughputDelayedApplyWarningMessage: string = `
You are about to request an increase in throughput beyond the pre-allocated capacity. 
This operation will take some time to complete.`;

// TODO: move to a utility classs and add unit tests

const currentThroughput = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  targetThroughput?: number
): string => {
  if (targetThroughput && throughput) {
    return isAutoscale
      ? `, Current autoscale throughput: ${Math.round(
          throughput / 10
        )} - ${throughput} ${throughputUnit}, Target autoscale throughput: ${Math.round(
          targetThroughput / 10
        )} - ${targetThroughput} ${throughputUnit}`
      : `, Current manual throughput: ${throughput} ${throughputUnit}, Target manual throughput: ${targetThroughput}`;
  }

  if (targetThroughput && !throughput) {
    return isAutoscale
      ? `, Target autoscale throughput: ${Math.round(targetThroughput / 10)} - ${targetThroughput} ${throughputUnit}`
      : `, Target manual throughput: ${targetThroughput} ${throughputUnit}`;
  }

  if (!targetThroughput && throughput) {
    return isAutoscale
      ? `, Current autoscale throughput: ${Math.round(throughput / 10)} - ${throughput} ${throughputUnit}`
      : `, Current manual throughput: ${throughput} ${throughputUnit}`;
  }

  return "";
};

const throughputApplyDelayedMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  requestedThroughput: number
): string => `
The request to increase the throughput has successfully been submitted. 
This operation will take 1-3 business days to complete. View the latest status in Notifications.<br />
Database: ${databaseName}, Container: ${collectionName} ${currentThroughput(
  isAutoscale,
  throughput,
  throughputUnit,
  requestedThroughput
)}`;

const throughputApplyShortDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  targetThroughput: number
): string => `
A request to increase the throughput is currently in progress. This operation will take some time to complete.<br />
Database: ${databaseName}, Container: ${collectionName} ${currentThroughput(
  isAutoscale,
  throughput,
  throughputUnit,
  targetThroughput
)}`;

const throughputApplyLongDelayMessage = (
  isAutoscale: boolean,
  throughput: number,
  throughputUnit: string,
  databaseName: string,
  collectionName: string,
  requestedThroughput: number
): string => `
A request to increase the throughput is currently in progress. 
This operation will take 1-3 business days to complete. View the latest status in Notifications.<br />
Database: ${databaseName}, Container: ${collectionName} ${currentThroughput(
  isAutoscale,
  throughput,
  throughputUnit,
  requestedThroughput
)}`;

enum ChangeFeedPolicyToggledState {
  Off = "Off",
  On = "On"
}

export default class SettingsTab extends TabsBase implements ViewModels.WaitsForTemplate {
  public GEOGRAPHY: string = "Geography";
  public GEOMETRY: string = "Geometry";

  public collection: ViewModels.Collection;

  // editable
  public throughput: ViewModels.Editable<number>;
  public timeToLive: ViewModels.Editable<string>;
  public timeToLiveSeconds: ViewModels.Editable<number>;
  public geospatialConfigType: ViewModels.Editable<string>;
  public geospatialVisible: ko.Computed<boolean>;
  public indexingPolicyContent: ViewModels.Editable<any>;
  public isIndexingPolicyEditorInitializing: ko.Observable<boolean>;
  public rupm: ViewModels.Editable<string>;
  public conflictResolutionPolicyMode: ViewModels.Editable<string>;
  public conflictResolutionPolicyPath: ViewModels.Editable<string>;
  public conflictResolutionPolicyProcedure: ViewModels.Editable<string>;
  public hasAutoPilotV2FeatureFlag: ko.PureComputed<boolean>;

  public saveSettingsButton: ViewModels.Button;
  public discardSettingsChangesButton: ViewModels.Button;

  public canRequestSupport: ko.Computed<boolean>;
  public canThroughputExceedMaximumValue: ko.Computed<boolean>;
  public changeFeedPolicyOffId: string;
  public changeFeedPolicyOnId: string;
  public changeFeedPolicyToggled: ViewModels.Editable<ChangeFeedPolicyToggledState>;
  public changeFeedPolicyVisible: ko.Computed<boolean>;
  public conflictResolutionExpanded: ko.Observable<boolean>;
  public conflictResolutionPolicyModeCustom: string;
  public conflictResolutionPolicyModeCRDT: string;
  public conflictResolutionPolicyModeLWW: string;
  public costsVisible: ko.Computed<boolean>;
  public hasConflictResolution: ko.Computed<boolean>;
  public lowerCasePartitionKeyName: ko.Computed<string>;
  public hasDatabaseSharedThroughput: ko.Computed<boolean>;
  public isAutoScaleEnabled: ko.Computed<boolean>;
  public isTemplateReady: ko.Observable<boolean>;
  public isTryCosmosDBSubscription: ko.Computed<boolean>;
  public indexingPolicyEditor: ko.Observable<monaco.editor.IStandaloneCodeEditor>;
  public indexingPolicyEditorId: string;
  public indexingPolicyElementFocused: ko.Observable<boolean>;
  public minRUs: ko.Computed<number>;
  public minRUAnotationVisible: ko.Computed<boolean>;
  public maxRUs: ko.Computed<number>;
  public maxRUThroughputInputLimit: ko.Computed<number>;
  public maxRUsText: ko.PureComputed<string>;
  public notificationStatusInfo: ko.Observable<string>;
  public partitionKeyName: ko.Computed<string>;
  public partitionKeyVisible: ko.PureComputed<boolean>;
  public partitionKeyValue: ko.Observable<string>;
  public isLargePartitionKeyEnabled: ko.Computed<boolean>;
  public pendingNotification: ko.Observable<DataModels.Notification>;
  public requestUnitsUsageCost: ko.Computed<string>;
  public rupmOnId: string;
  public rupmOffId: string;
  public rupmVisible: ko.Computed<boolean>;
  public scaleExpanded: ko.Observable<boolean>;
  public settingsExpanded: ko.Observable<boolean>;
  public shouldDisplayPortalUsePrompt: ko.Computed<boolean>;
  public shouldShowIndexingPolicyEditor: ko.Computed<boolean>;
  public shouldShowNotificationStatusPrompt: ko.Computed<boolean>;
  public shouldShowStatusBar: ko.Computed<boolean>;
  public storageCapacityTitle: ko.PureComputed<string>;
  public throughputTitle: ko.PureComputed<string>;
  public throughputAriaLabel: ko.PureComputed<string>;
  public ttlOffFocused: ko.Observable<boolean>;
  public ttlOffId: string;
  public ttlOnDefaultFocused: ko.Observable<boolean>;
  public ttlOnFocused: ko.Observable<boolean>;
  public ttlOnId: string;
  public ttlOnNoDefaultId: string;
  public ttlVisible: ko.Computed<boolean>;
  public userCanChangeProvisioningTypes: ko.Observable<boolean>;
  public warningMessage: ko.Computed<string>;
  public shouldShowKeyspaceSharedThroughputMessage: ko.Computed<boolean>;
  public autoPilotTiersList: ko.ObservableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>;
  public selectedAutoPilotTier: ko.Observable<DataModels.AutopilotTier>;
  public isAutoPilotSelected: ko.Observable<boolean>;
  public autoPilotThroughput: ko.Observable<number>;
  public autoPilotUsageCost: ko.Computed<string>;
  public isAnalyticalStorageEnabled: boolean;
  public analyticalStorageTtlSelection: ViewModels.Editable<string>;
  public analyticalStorageTtlSeconds: ViewModels.Editable<number>;
  public canExceedMaximumValue: ko.PureComputed<boolean>;
  public overrideWithAutoPilotSettings: ko.Computed<boolean>;
  public overrideWithProvisionedThroughputSettings: ko.Computed<boolean>;
  public testId: string;
  public throughputAutoPilotRadioId: string;
  public throughputProvisionedRadioId: string;
  public throughputModeRadioName: string;

  private _offerReplacePending: ko.PureComputed<boolean>;
  private container: Explorer;
  private _wasAutopilotOriginallySet: ko.Observable<boolean>;
  private _isAutoPilotDirty: ko.Computed<boolean>;
  private _hasProvisioningTypeChanged: ko.Computed<boolean>;
  private _isFixedContainer: ko.Computed<boolean>;

  constructor(options: ViewModels.TabOptions) {
    super(options);
    this.container = options.collection && options.collection.container;
    this.isIndexingPolicyEditorInitializing = ko.observable<boolean>(false);
    this.hasAutoPilotV2FeatureFlag = ko.pureComputed(() => this.container.hasAutoPilotV2FeatureFlag());

    this.canExceedMaximumValue = ko.pureComputed(() => this.container.canExceedMaximumValue());

    this.geospatialVisible = ko.pureComputed(() => this.container.isPreferredApiDocumentDB());

    // html element ids
    this.indexingPolicyEditorId = `indexingpolicyeditor${this.tabId}`;
    this.ttlOffId = `ttlOffId${this.tabId}`;
    this.ttlOnNoDefaultId = `ttlOnNoDefault${this.tabId}`;
    this.ttlOnId = `ttlOn${this.tabId}`;
    this.changeFeedPolicyOffId = `changeFeedOff${this.tabId}`;
    this.changeFeedPolicyOnId = `changeFeedOn${this.tabId}`;
    this.rupmOnId = `rupmOn${this.tabId}`;
    this.rupmOffId = `rupmOff${this.tabId}`;
    this.conflictResolutionPolicyModeCustom = `conflictResolutionPolicyModeCustom${this.tabId}`;
    this.conflictResolutionPolicyModeLWW = `conflictResolutionPolicyModeLWW${this.tabId}`;
    this.conflictResolutionPolicyModeCRDT = `conflictResolutionPolicyModeCRDT${this.tabId}`;
    this.testId = `settingsThroughputValue${this.tabId}`;
    this.throughputAutoPilotRadioId = `editDatabaseThroughput-autoPilotRadio${this.tabId}`;
    this.throughputProvisionedRadioId = `editDatabaseThroughput-manualRadio${this.tabId}`;
    this.throughputModeRadioName = `throughputModeRadio${this.tabId}`;

    this.changeFeedPolicyToggled = editable.observable<ChangeFeedPolicyToggledState>(
      this.collection.rawDataModel?.changeFeedPolicy != null
        ? ChangeFeedPolicyToggledState.On
        : ChangeFeedPolicyToggledState.Off
    );
    this.changeFeedPolicyVisible = ko.computed<boolean>(
      () => this.collection && this.collection.container.isFeatureEnabled(Constants.Features.enableChangeFeedPolicy)
    );
    this.scaleExpanded = ko.observable<boolean>(true);
    this.settingsExpanded = ko.observable<boolean>(true);
    this.conflictResolutionExpanded = ko.observable<boolean>(true);

    this.throughput = editable.observable<number>();
    this.conflictResolutionPolicyMode = editable.observable<string>();
    this.conflictResolutionPolicyPath = editable.observable<string>();
    this.conflictResolutionPolicyProcedure = editable.observable<string>();
    this.timeToLive = editable.observable<string>();
    this.timeToLiveSeconds = editable.observable<number>();
    this.geospatialConfigType = editable.observable<string>();
    this.isAnalyticalStorageEnabled = this.collection && !!this.collection.analyticalStorageTtl();
    this.analyticalStorageTtlSelection = editable.observable<string>();
    this.analyticalStorageTtlSeconds = editable.observable<number>();
    this.indexingPolicyContent = editable.observable<any>();
    this.rupm = editable.observable<string>();
    // Mongo container with system partition key still treat as "Fixed"
    this._isFixedContainer = ko.pureComputed(
      () =>
        !this.collection.partitionKey ||
        (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey)
    );

    this.isAutoPilotSelected = ko.observable(false);
    this._wasAutopilotOriginallySet = ko.observable(false);
    this.selectedAutoPilotTier = ko.observable<DataModels.AutopilotTier>();
    this.autoPilotTiersList = ko.observableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>();
    this.autoPilotThroughput = ko.observable<number>(AutoPilotUtils.minAutoPilotThroughput);
    const offer = this.collection && this.collection.offer && this.collection.offer();
    const offerAutopilotSettings = offer && offer.content && offer.content.offerAutopilotSettings;

    this.userCanChangeProvisioningTypes = ko.observable(!!offerAutopilotSettings || !this.hasAutoPilotV2FeatureFlag());

    if (!this.hasAutoPilotV2FeatureFlag()) {
      if (offerAutopilotSettings && offerAutopilotSettings.maxThroughput) {
        if (AutoPilotUtils.isValidAutoPilotThroughput(offerAutopilotSettings.maxThroughput)) {
          this.isAutoPilotSelected(true);
          this._wasAutopilotOriginallySet(true);
          this.autoPilotThroughput(offerAutopilotSettings.maxThroughput);
        }
      }
    } else {
      if (offerAutopilotSettings && offerAutopilotSettings.tier) {
        if (AutoPilotUtils.isValidAutoPilotTier(offerAutopilotSettings.tier)) {
          this.isAutoPilotSelected(true);
          this._wasAutopilotOriginallySet(true);
          this.selectedAutoPilotTier(offerAutopilotSettings.tier);
          const availableAutoPilotTiers = AutoPilotUtils.getAvailableAutoPilotTiersOptions(offerAutopilotSettings.tier);
          this.autoPilotTiersList(availableAutoPilotTiers);
        }
      }
    }

    this._hasProvisioningTypeChanged = ko.pureComputed<boolean>(() => {
      if (!this.userCanChangeProvisioningTypes()) {
        return false;
      }
      if (this._wasAutopilotOriginallySet() !== this.isAutoPilotSelected()) {
        return true;
      }
      return false;
    });

    this.overrideWithAutoPilotSettings = ko.pureComputed(() => {
      if (this.hasAutoPilotV2FeatureFlag()) {
        return false;
      }
      return this._hasProvisioningTypeChanged() && this._wasAutopilotOriginallySet();
    });

    this.overrideWithProvisionedThroughputSettings = ko.pureComputed(() => {
      if (this.hasAutoPilotV2FeatureFlag()) {
        return false;
      }
      return this._hasProvisioningTypeChanged() && !this._wasAutopilotOriginallySet();
    });

    this._isAutoPilotDirty = ko.pureComputed<boolean>(() => {
      if (!this.isAutoPilotSelected()) {
        return false;
      }
      const originalAutoPilotSettings = this.collection?.offer()?.content?.offerAutopilotSettings;
      if (!originalAutoPilotSettings) {
        return false;
      }
      const originalAutoPilotSetting = !this.hasAutoPilotV2FeatureFlag()
        ? originalAutoPilotSettings && originalAutoPilotSettings.maxThroughput
        : originalAutoPilotSettings && originalAutoPilotSettings.tier;
      if (
        (!this.hasAutoPilotV2FeatureFlag() && this.autoPilotThroughput() != originalAutoPilotSetting) ||
        (this.hasAutoPilotV2FeatureFlag() && this.selectedAutoPilotTier() !== originalAutoPilotSetting)
      ) {
        return true;
      }
      return false;
    });
    this.autoPilotUsageCost = ko.pureComputed<string>(() => {
      const autoPilot = !this.hasAutoPilotV2FeatureFlag() ? this.autoPilotThroughput() : this.selectedAutoPilotTier();
      if (!autoPilot) {
        return "";
      }
      return !this.hasAutoPilotV2FeatureFlag()
        ? PricingUtils.getAutoPilotV3SpendHtml(autoPilot, false /* isDatabaseThroughput */)
        : PricingUtils.getAutoPilotV2SpendHtml(autoPilot, false /* isDatabaseThroughput */);
    });

    this.requestUnitsUsageCost = ko.pureComputed(() => {
      const account = this.container.databaseAccount();
      if (!account) {
        return "";
      }

      const serverId: string = this.container.serverId();
      const offerThroughput: number = this.throughput();
      const rupmEnabled = this.rupm() === Constants.RUPMStates.on;

      const regions =
        (account &&
          account.properties &&
          account.properties.readLocations &&
          account.properties.readLocations.length) ||
        1;
      const multimaster = (account && account.properties && account.properties.enableMultipleWriteLocations) || false;

      let estimatedSpend: string;

      if (!this.isAutoPilotSelected()) {
        estimatedSpend = PricingUtils.getEstimatedSpendHtml(
          // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
          this.overrideWithAutoPilotSettings() ? this.autoPilotThroughput() : offerThroughput,
          serverId,
          regions,
          multimaster,
          rupmEnabled
        );
      } else {
        estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
          this.autoPilotThroughput(),
          serverId,
          regions,
          multimaster
        );
      }
      return estimatedSpend;
    });

    this.isAutoScaleEnabled = ko.pureComputed<boolean>(() => {
      const accountCapabilities: DataModels.Capability[] =
        this.container &&
        this.container.databaseAccount() &&
        this.container.databaseAccount().properties &&
        this.container.databaseAccount().properties.capabilities;
      const enableAutoScaleCapability =
        accountCapabilities &&
        _.find(accountCapabilities, capability => {
          return (
            capability &&
            capability.name &&
            capability.name.toLowerCase() === Constants.CapabilityNames.EnableAutoScale.toLowerCase()
          );
        });

      return !!enableAutoScaleCapability;
    });

    this.hasDatabaseSharedThroughput = ko.pureComputed(() => {
      const database: ViewModels.Database = this.collection.getDatabase();
      return database && database.isDatabaseShared && !this.collection.offer();
    });

    this.shouldShowKeyspaceSharedThroughputMessage = ko.pureComputed<boolean>(() => {
      if (!this.container || !this.container.isPreferredApiCassandra() || !this.hasDatabaseSharedThroughput()) {
        return false;
      }
      return true;
    });

    this.hasConflictResolution = ko.pureComputed(() => {
      return (
        (this.container &&
          this.container.databaseAccount &&
          this.container.databaseAccount() &&
          this.container.databaseAccount().properties &&
          this.container.databaseAccount().properties.enableMultipleWriteLocations &&
          this.collection.conflictResolutionPolicy &&
          !!this.collection.conflictResolutionPolicy()) ||
        false
      );
    });

    this.rupmVisible = ko.computed(() => {
      if (this.container.isEmulator) {
        return false;
      }
      if (this.container.isFeatureEnabled(Constants.Features.enableRupm)) {
        return true;
      }
      for (let i = 0, len = this.container.databases().length; i < len; i++) {
        for (let j = 0, len2 = this.container.databases()[i].collections().length; j < len2; j++) {
          const collectionOffer = this.container
            .databases()
            [i].collections()
            [j].offer();
          if (
            collectionOffer &&
            collectionOffer.content &&
            collectionOffer.content.offerIsRUPerMinuteThroughputEnabled
          ) {
            return true;
          }
        }
      }

      return false;
    });

    this.ttlVisible = ko.computed(() => {
      return (this.container && !this.container.isPreferredApiCassandra()) || false;
    });

    this.costsVisible = ko.computed(() => {
      return !this.container.isEmulator;
    });

    this.isTryCosmosDBSubscription = ko.computed<boolean>(() => {
      return (this.container && this.container.isTryCosmosDBSubscription()) || false;
    });

    this.canThroughputExceedMaximumValue = ko.pureComputed<boolean>(() => {
      const isPublicAzurePortal: boolean =
        this.container.getPlatformType() === PlatformType.Portal && !this.container.isRunningOnNationalCloud();
      const hasPartitionKey = !!this.collection.partitionKey;

      return isPublicAzurePortal && hasPartitionKey;
    });

    this.canRequestSupport = ko.pureComputed(() => {
      if (this.container.isEmulator) {
        return false;
      }

      if (this.isTryCosmosDBSubscription()) {
        return false;
      }

      if (this.canThroughputExceedMaximumValue()) {
        return false;
      }

      if (this.container.getPlatformType() === PlatformType.Hosted) {
        return false;
      }

      if (this.container.isServerlessEnabled()) {
        return false;
      }

      const numPartitions = this.collection.quotaInfo().numPartitions;
      return !!this.collection.partitionKeyProperty || numPartitions > 1;
    });

    this.shouldDisplayPortalUsePrompt = ko.pureComputed<boolean>(
      () => this.container.getPlatformType() === PlatformType.Hosted && !!this.collection.partitionKey
    );

    this.minRUs = ko.computed<number>(() => {
      if (this.isTryCosmosDBSubscription() || this.container.isServerlessEnabled()) {
        return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
      }

      const offerContent =
        this.collection && this.collection.offer && this.collection.offer() && this.collection.offer().content;

      if (offerContent && offerContent.offerAutopilotSettings) {
        return 400;
      }

      const collectionThroughputInfo: DataModels.OfferThroughputInfo =
        offerContent && offerContent.collectionThroughputInfo;

      if (
        collectionThroughputInfo &&
        collectionThroughputInfo.minimumRUForCollection &&
        collectionThroughputInfo.minimumRUForCollection > 0
      ) {
        return collectionThroughputInfo.minimumRUForCollection;
      }

      const numPartitions =
        (collectionThroughputInfo && collectionThroughputInfo.numPhysicalPartitions) ||
        this.collection.quotaInfo().numPartitions;

      if (!numPartitions || numPartitions === 1) {
        return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
      }

      let baseRU = SharedConstants.CollectionCreation.DefaultCollectionRUs400;

      const quotaInKb = this.collection.quotaInfo().collectionSize;
      const quotaInGb = PricingUtils.usageInGB(quotaInKb);

      const perPartitionGBQuota: number = Math.max(10, quotaInGb / numPartitions);
      const baseRUbyPartitions: number = ((numPartitions * perPartitionGBQuota) / 10) * 100;

      return Math.max(baseRU, baseRUbyPartitions);
    });

    this.minRUAnotationVisible = ko.computed<boolean>(() => {
      return PricingUtils.isLargerThanDefaultMinRU(this.minRUs());
    });

    this.maxRUs = ko.computed<number>(() => {
      const isTryCosmosDBSubscription = this.isTryCosmosDBSubscription();
      if (isTryCosmosDBSubscription || this.container.isServerlessEnabled()) {
        return Constants.TryCosmosExperience.maxRU;
      }

      const numPartitionsFromOffer: number =
        this.collection &&
        this.collection.offer &&
        this.collection.offer() &&
        this.collection.offer().content &&
        this.collection.offer().content.collectionThroughputInfo &&
        this.collection.offer().content.collectionThroughputInfo.numPhysicalPartitions;

      const numPartitionsFromQuotaInfo: number = this.collection && this.collection.quotaInfo().numPartitions;

      const numPartitions = numPartitionsFromOffer || numPartitionsFromQuotaInfo || 1;

      return SharedConstants.CollectionCreation.MaxRUPerPartition * numPartitions;
    });

    this.maxRUThroughputInputLimit = ko.pureComputed<number>(() => {
      if (this.container && this.container.getPlatformType() === PlatformType.Hosted && this.collection.partitionKey) {
        return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
      }

      return this.maxRUs();
    });

    this.maxRUsText = ko.pureComputed(() => {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million.toLocaleString();
    });

    this.throughputTitle = ko.pureComputed<string>(() => {
      if (this.isAutoPilotSelected()) {
        return AutoPilotUtils.getAutoPilotHeaderText(this.hasAutoPilotV2FeatureFlag());
      }

      const minThroughput: string = this.minRUs().toLocaleString();
      const maxThroughput: string =
        this.canThroughputExceedMaximumValue() && !this._isFixedContainer()
          ? "unlimited"
          : this.maxRUs().toLocaleString();
      return `Throughput (${minThroughput} - ${maxThroughput} RU/s)`;
    });

    this.throughputAriaLabel = ko.pureComputed<string>(() => {
      return this.throughputTitle() + this.requestUnitsUsageCost();
    });

    this.storageCapacityTitle = ko.pureComputed(() => {
      // Mongo container with system partition key still treat as "Fixed"
      const isFixed =
        !this.collection.partitionKey ||
        (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey);
      const capacity: string = isFixed ? "Fixed" : "Unlimited";
      return `Storage capacity <br /><b>${capacity}</b>`;
    });

    this.partitionKeyVisible = ko.computed<boolean>(() => {
      if (this.container.isPreferredApiCassandra() || this.container.isPreferredApiTable()) {
        return false;
      }

      if (!this.collection.partitionKeyProperty) {
        return false;
      }

      if (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey) {
        return false;
      }

      return true;
    });

    this.partitionKeyValue = ko.observable<string>("/" + this.collection.partitionKeyProperty);

    this.partitionKeyName = ko.computed<string>(() => {
      if (this.container.isPreferredApiMongoDB()) {
        return "Shard key";
      }

      return "Partition key";
    });

    this.lowerCasePartitionKeyName = ko.computed<string>(() => this.partitionKeyName().toLowerCase());

    this.isLargePartitionKeyEnabled = ko.computed<boolean>(() => {
      return (
        !!this.collection.partitionKey &&
        !!this.collection.partitionKey.version &&
        this.collection.partitionKey.version >= 2
      );
    });

    this.indexingPolicyEditor = ko.observable<monaco.editor.IStandaloneCodeEditor>();

    this.shouldShowIndexingPolicyEditor = ko.computed<boolean>(
      () => this.container && !this.container.isPreferredApiCassandra() && !this.container.isPreferredApiMongoDB()
    );

    this._setBaseline();

    this.saveSettingsButton = {
      enabled: ko.computed<boolean>(() => {
        // TODO: move validations to editables and display validation errors
        if (this._offerReplacePending && this._offerReplacePending()) {
          return false;
        }

        const isCollectionThroughput: boolean = !this.hasDatabaseSharedThroughput();
        if (isCollectionThroughput) {
          if (this._hasProvisioningTypeChanged()) {
            return true;
          } else if (this.isAutoPilotSelected()) {
            const validAutopilotChange =
              (!this.hasAutoPilotV2FeatureFlag() &&
                this._isAutoPilotDirty() &&
                AutoPilotUtils.isValidAutoPilotThroughput(this.autoPilotThroughput())) ||
              (this.hasAutoPilotV2FeatureFlag() &&
                this._isAutoPilotDirty() &&
                AutoPilotUtils.isValidAutoPilotTier(this.selectedAutoPilotTier()));
            if (validAutopilotChange) {
              return true;
            }
          } else {
            const isMissingThroughput = !this.throughput();
            if (isMissingThroughput) {
              return false;
            }

            const isThroughputLessThanMinRus = this.throughput() < this.minRUs();
            if (isThroughputLessThanMinRus) {
              return false;
            }

            const isThroughputGreaterThanMaxRus = this.throughput() > this.maxRUs();
            const isEmulator = this.container.isEmulator;
            if (isThroughputGreaterThanMaxRus && isEmulator) {
              return false;
            }

            if (isThroughputGreaterThanMaxRus && this._isFixedContainer()) {
              return false;
            }

            const isThroughputMoreThan1Million =
              this.throughput() > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
            if (!this.canThroughputExceedMaximumValue() && isThroughputMoreThan1Million) {
              return false;
            }

            if (this.throughput.editableIsDirty()) {
              return true;
            }
          }
        }

        if (
          this.hasConflictResolution() &&
          (this.conflictResolutionPolicyMode.editableIsDirty() ||
            this.conflictResolutionPolicyPath.editableIsDirty() ||
            this.conflictResolutionPolicyProcedure.editableIsDirty())
        ) {
          return true;
        }

        if (this.timeToLive() === "on" && !this.timeToLiveSeconds()) {
          return false;
        }

        if (this.analyticalStorageTtlSelection() === "on" && !this.analyticalStorageTtlSeconds()) {
          return false;
        }

        if (
          this.rupm() === Constants.RUPMStates.on &&
          this.throughput() >
            SharedConstants.CollectionCreation.MaxRUPMPerPartition * this.collection.quotaInfo()?.numPartitions
        ) {
          return false;
        }

        if (this.timeToLive.editableIsDirty()) {
          return true;
        }

        if (this.geospatialConfigType.editableIsDirty()) {
          return true;
        }

        if (this.analyticalStorageTtlSelection.editableIsDirty()) {
          return true;
        }

        if (this.changeFeedPolicyToggled.editableIsDirty()) {
          return true;
        }

        if (this.timeToLive() === "on" && this.timeToLiveSeconds.editableIsDirty()) {
          return true;
        }

        if (this.analyticalStorageTtlSelection() === "on" && this.analyticalStorageTtlSeconds.editableIsDirty()) {
          return true;
        }

        if (this.indexingPolicyContent.editableIsDirty() && this.indexingPolicyContent.editableIsValid()) {
          return true;
        }

        if (this.rupm.editableIsDirty()) {
          return true;
        }

        return false;
      }),

      visible: ko.pureComputed<boolean>(() => {
        return true;
      })
    };

    this.discardSettingsChangesButton = {
      enabled: ko.computed<boolean>(() => {
        if (this._hasProvisioningTypeChanged()) {
          return true;
        }
        if (this.isAutoPilotSelected() && this._isAutoPilotDirty()) {
          return true;
        }

        if (this.throughput.editableIsDirty()) {
          return true;
        }

        if (this.timeToLive.editableIsDirty()) {
          return true;
        }

        if (this.geospatialConfigType.editableIsDirty()) {
          return true;
        }

        if (this.analyticalStorageTtlSelection.editableIsDirty()) {
          return true;
        }

        if (this.timeToLive() === "on" && this.timeToLiveSeconds.editableIsDirty()) {
          return true;
        }

        if (this.analyticalStorageTtlSelection() === "on" && this.analyticalStorageTtlSeconds.editableIsDirty()) {
          return true;
        }

        if (this.changeFeedPolicyToggled.editableIsDirty()) {
          return true;
        }

        if (this.indexingPolicyContent.editableIsDirty()) {
          return true;
        }

        if (this.rupm.editableIsDirty()) {
          return true;
        }

        if (
          this.conflictResolutionPolicyMode.editableIsDirty() ||
          this.conflictResolutionPolicyPath.editableIsDirty() ||
          this.conflictResolutionPolicyProcedure.editableIsDirty()
        ) {
          return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      })
    };

    this.ttlOffFocused = ko.observable<boolean>(false);
    this.ttlOnDefaultFocused = ko.observable<boolean>(false);
    this.ttlOnFocused = ko.observable<boolean>(false);
    this.indexingPolicyElementFocused = ko.observable<boolean>(false);
    this.pendingNotification = ko.observable<DataModels.Notification>(undefined);

    this._offerReplacePending = ko.pureComputed<boolean>(() => {
      const offer = this.collection && this.collection.offer && this.collection.offer();
      return (
        offer &&
        offer.hasOwnProperty("headers") &&
        !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
      );
    });

    this.notificationStatusInfo = ko.observable<string>("");
    this.shouldShowNotificationStatusPrompt = ko.computed<boolean>(() => this.notificationStatusInfo().length > 0);

    this.warningMessage = ko.computed<string>(() => {
      const throughputExceedsBackendLimits: boolean =
        this.canThroughputExceedMaximumValue() &&
        this.maxRUs() <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
        this.throughput() > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;

      const throughputExceedsMaxValue: boolean = !this.container.isEmulator && this.throughput() > this.maxRUs();

      const ttlOptionDirty: boolean = this.timeToLive.editableIsDirty();
      const ttlOrIndexingPolicyFieldsDirty: boolean =
        this.timeToLive.editableIsDirty() ||
        this.indexingPolicyContent.editableIsDirty() ||
        this.timeToLiveSeconds.editableIsDirty();
      const ttlFieldFocused: boolean = this.ttlOffFocused() || this.ttlOnDefaultFocused() || this.ttlOnFocused();
      const offer = this.collection && this.collection.offer && this.collection.offer();

      if (ttlOptionDirty && this.timeToLive() === "on") {
        return ttlWarning;
      }

      if (
        offer &&
        offer.hasOwnProperty("headers") &&
        !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
      ) {
        if (AutoPilotUtils.isValidV2AutoPilotOffer(offer)) {
          return "Tier upgrade will take some time to complete.";
        }

        const throughput = offer.content.offerAutopilotSettings
          ? !this.hasAutoPilotV2FeatureFlag()
            ? offer.content.offerAutopilotSettings.maxThroughput
            : offer.content.offerAutopilotSettings.maximumTierThroughput
          : undefined;

        const targetThroughput =
          offer &&
          offer.content &&
          ((offer.content.offerAutopilotSettings && offer.content.offerAutopilotSettings.targetMaxThroughput) ||
            offer.content.offerThroughput);

        return throughputApplyShortDelayMessage(
          this.isAutoPilotSelected(),
          throughput,
          this._getThroughputUnit(),
          this.collection.databaseId,
          this.collection.id(),
          targetThroughput
        );
      }

      if (!this.hasAutoPilotV2FeatureFlag() && this.overrideWithProvisionedThroughputSettings()) {
        return AutoPilotUtils.manualToAutoscaleDisclaimer;
      }

      if (
        throughputExceedsBackendLimits &&
        !!this.collection.partitionKey &&
        !this._isFixedContainer() &&
        !ttlFieldFocused &&
        !this.indexingPolicyElementFocused()
      ) {
        return updateThroughputBeyondLimitWarningMessage;
      }

      if (
        throughputExceedsMaxValue &&
        !!this.collection.partitionKey &&
        !this._isFixedContainer() &&
        !ttlFieldFocused &&
        !this.indexingPolicyElementFocused()
      ) {
        return updateThroughputDelayedApplyWarningMessage;
      }

      if (this.pendingNotification()) {
        const throughputUnit: string = this._getThroughputUnit();
        const matches: string[] = this.pendingNotification().description.match(
          `Throughput update for (.*) ${throughputUnit}`
        );

        const throughput = this.throughput();
        const targetThroughput: number = matches.length > 1 && Number(matches[1]);
        if (targetThroughput) {
          return throughputApplyLongDelayMessage(
            this.isAutoPilotSelected(),
            throughput,
            throughputUnit,
            this.collection.databaseId,
            this.collection.id(),
            targetThroughput
          );
        }
      }

      if (ttlOrIndexingPolicyFieldsDirty) {
        return indexingPolicyTTLWarningMessage;
      }

      return "";
    });

    this.warningMessage.subscribe((warning: string) => {
      if (warning.length > 0) {
        this.notificationStatusInfo("");
      }
    });

    this.shouldShowStatusBar = ko.computed<boolean>(
      () => this.shouldShowNotificationStatusPrompt() || (this.warningMessage && this.warningMessage().length > 0)
    );

    this.isTemplateReady = ko.observable<boolean>(false);
    this.isTemplateReady.subscribe((isTemplateReady: boolean) => {
      if (!this.indexingPolicyEditor() && !this.isIndexingPolicyEditorInitializing() && isTemplateReady) {
        this._createIndexingPolicyEditor();
      }
    });

    this._buildCommandBarOptions();
  }

  public shouldUpdateCollection(): boolean {
    return (
      this.timeToLive.editableIsDirty() ||
      (this.timeToLive() === "on" && this.timeToLiveSeconds.editableIsDirty()) ||
      this.geospatialConfigType.editableIsDirty() ||
      this.conflictResolutionPolicyMode.editableIsDirty() ||
      this.conflictResolutionPolicyPath.editableIsDirty() ||
      this.conflictResolutionPolicyProcedure.editableIsDirty() ||
      this.indexingPolicyContent.editableIsDirty() ||
      this.changeFeedPolicyToggled.editableIsDirty() ||
      this.analyticalStorageTtlSelection.editableIsDirty() ||
      (this.analyticalStorageTtlSelection() === "on" && this.analyticalStorageTtlSeconds.editableIsDirty())
    );
  }

  public onSaveClick = async (): Promise<any> => {
    this.isExecutionError(false);

    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateSettings, {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });

    const newCollectionAttributes: any = {};

    try {
      if (this.shouldUpdateCollection()) {
        let defaultTtl: number;
        switch (this.timeToLive()) {
          case "on":
            defaultTtl = Number(this.timeToLiveSeconds());
            break;
          case "on-nodefault":
            defaultTtl = -1;
            break;
          case "off":
          default:
            defaultTtl = undefined;
            break;
        }

        newCollectionAttributes.defaultTtl = defaultTtl;

        newCollectionAttributes.indexingPolicy = this.indexingPolicyContent();

        newCollectionAttributes.changeFeedPolicy =
          this.changeFeedPolicyVisible() && this.changeFeedPolicyToggled() === ChangeFeedPolicyToggledState.On
            ? ({
                retentionDuration: Constants.BackendDefaults.maxChangeFeedRetentionDuration
              } as DataModels.ChangeFeedPolicy)
            : undefined;

        newCollectionAttributes.analyticalStorageTtl = this.isAnalyticalStorageEnabled
          ? this.analyticalStorageTtlSelection() === "on"
            ? Number(this.analyticalStorageTtlSeconds())
            : Constants.AnalyticalStorageTtl.Infinite
          : undefined;

        newCollectionAttributes.geospatialConfig = {
          type: this.geospatialConfigType()
        };

        const conflictResolutionChanges: DataModels.ConflictResolutionPolicy = this.getUpdatedConflictResolutionPolicy();
        if (!!conflictResolutionChanges) {
          newCollectionAttributes.conflictResolutionPolicy = conflictResolutionChanges;
        }

        const newCollection: DataModels.Collection = _.extend(
          {},
          this.collection.rawDataModel,
          newCollectionAttributes
        );
        const updatedCollection: DataModels.Collection = await updateCollection(
          this.collection.databaseId,
          this.collection.id(),
          newCollection
        );

        if (updatedCollection) {
          this.collection.rawDataModel = updatedCollection;
          this.collection.defaultTtl(updatedCollection.defaultTtl);
          this.collection.analyticalStorageTtl(updatedCollection.analyticalStorageTtl);
          this.collection.id(updatedCollection.id);
          this.collection.indexingPolicy(updatedCollection.indexingPolicy);
          this.collection.conflictResolutionPolicy(updatedCollection.conflictResolutionPolicy);
          this.collection.changeFeedPolicy(updatedCollection.changeFeedPolicy);
          this.collection.geospatialConfig(updatedCollection.geospatialConfig);
        }
      }

      if (
        this.throughput.editableIsDirty() ||
        this.rupm.editableIsDirty() ||
        this._isAutoPilotDirty() ||
        this._hasProvisioningTypeChanged()
      ) {
        const newThroughput = this.throughput();
        const isRUPerMinuteThroughputEnabled: boolean = this.rupm() === Constants.RUPMStates.on;
        let newOffer: DataModels.Offer = _.extend({}, this.collection.offer());
        const originalThroughputValue: number = this.throughput.getEditableOriginalValue();

        if (newOffer.content) {
          newOffer.content.offerThroughput = newThroughput;
          newOffer.content.offerIsRUPerMinuteThroughputEnabled = isRUPerMinuteThroughputEnabled;
        } else {
          newOffer = _.extend({}, newOffer, {
            content: {
              offerThroughput: newThroughput,
              offerIsRUPerMinuteThroughputEnabled: isRUPerMinuteThroughputEnabled
            }
          });
        }

        const headerOptions: RequestOptions = { initialHeaders: {} };

        if (this.isAutoPilotSelected()) {
          if (!this.hasAutoPilotV2FeatureFlag()) {
            newOffer.content.offerAutopilotSettings = {
              maxThroughput: this.autoPilotThroughput()
            };
          } else {
            newOffer.content.offerAutopilotSettings = {
              tier: this.selectedAutoPilotTier()
            };
          }

          // user has changed from provisioned --> autoscale
          if (!this.hasAutoPilotV2FeatureFlag() && this._hasProvisioningTypeChanged()) {
            headerOptions.initialHeaders[Constants.HttpHeaders.migrateOfferToAutopilot] = "true";
            delete newOffer.content.offerAutopilotSettings;
          } else {
            delete newOffer.content.offerThroughput;
          }
        } else {
          this.isAutoPilotSelected(false);
          this.userCanChangeProvisioningTypes(false || !this.hasAutoPilotV2FeatureFlag());

          // user has changed from autoscale --> provisioned
          if (!this.hasAutoPilotV2FeatureFlag() && this._hasProvisioningTypeChanged()) {
            headerOptions.initialHeaders[Constants.HttpHeaders.migrateOfferToManualThroughput] = "true";
          } else {
            delete newOffer.content.offerAutopilotSettings;
          }
        }

        if (
          this.maxRUs() <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
          newThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
          this.container != null
        ) {
          const requestPayload = {
            subscriptionId: userContext.subscriptionId,
            databaseAccountName: userContext.databaseAccount.name,
            resourceGroup: userContext.resourceGroup,
            databaseName: this.collection.databaseId,
            collectionName: this.collection.id(),
            throughput: newThroughput,
            offerIsRUPerMinuteThroughputEnabled: isRUPerMinuteThroughputEnabled
          };

          await updateOfferThroughputBeyondLimit(requestPayload);
          this.collection.offer().content.offerThroughput = originalThroughputValue;
          this.throughput(originalThroughputValue);
          this.notificationStatusInfo(
            throughputApplyDelayedMessage(
              this.isAutoPilotSelected(),
              originalThroughputValue,
              this._getThroughputUnit(),
              this.collection.databaseId,
              this.collection.id(),
              newThroughput
            )
          );
          this.throughput.valueHasMutated(); // force component re-render
        } else {
          const updatedOffer: DataModels.Offer = await updateOffer(this.collection.offer(), newOffer, headerOptions);
          this.collection.offer(updatedOffer);
          this.collection.offer.valueHasMutated();
        }
      }

      this.container.isRefreshingExplorer(false);
      this._setBaseline();
      this._wasAutopilotOriginallySet(this.isAutoPilotSelected());
      TelemetryProcessor.traceSuccess(
        Action.UpdateSettings,
        {
          databaseAccountName: this.container.databaseAccount().name,
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle()
        },
        startKey
      );
    } catch (error) {
      this.container.isRefreshingExplorer(false);
      this.isExecutionError(true);
      console.error(error);
      TelemetryProcessor.traceFailure(
        Action.UpdateSettings,
        {
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.collection && this.collection.databaseId,
          collectionName: this.collection && this.collection.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle(),
          error: error
        },
        startKey
      );
    }

    this.isExecuting(false);
  };

  public onRevertClick = (): Q.Promise<any> => {
    this.throughput.setBaseline(this.throughput.getEditableOriginalValue());
    this.timeToLive.setBaseline(this.timeToLive.getEditableOriginalValue());
    this.timeToLiveSeconds.setBaseline(this.timeToLiveSeconds.getEditableOriginalValue());
    this.geospatialConfigType.setBaseline(this.geospatialConfigType.getEditableOriginalValue());
    this.analyticalStorageTtlSelection.setBaseline(this.analyticalStorageTtlSelection.getEditableOriginalValue());
    this.analyticalStorageTtlSeconds.setBaseline(this.analyticalStorageTtlSeconds.getEditableOriginalValue());
    this.rupm.setBaseline(this.rupm.getEditableOriginalValue());
    this.changeFeedPolicyToggled.setBaseline(this.changeFeedPolicyToggled.getEditableOriginalValue());

    this.conflictResolutionPolicyMode.setBaseline(this.conflictResolutionPolicyMode.getEditableOriginalValue());
    this.conflictResolutionPolicyPath.setBaseline(this.conflictResolutionPolicyPath.getEditableOriginalValue());
    this.conflictResolutionPolicyProcedure.setBaseline(
      this.conflictResolutionPolicyProcedure.getEditableOriginalValue()
    );

    const indexingPolicyContent = this.indexingPolicyContent.getEditableOriginalValue();
    const value: string = JSON.stringify(indexingPolicyContent, null, 4);
    this.indexingPolicyContent.setBaseline(indexingPolicyContent);

    const indexingPolicyEditor = this.indexingPolicyEditor();
    if (indexingPolicyEditor) {
      const indexingPolicyEditorModel = indexingPolicyEditor.getModel();
      indexingPolicyEditorModel.setValue(value);
    }

    if (this.userCanChangeProvisioningTypes()) {
      this.isAutoPilotSelected(this._wasAutopilotOriginallySet());
    }

    if (this.isAutoPilotSelected()) {
      const originalAutoPilotSettings = this.collection.offer().content.offerAutopilotSettings;
      if (!this.hasAutoPilotV2FeatureFlag()) {
        const originalAutoPilotMaxThroughput = originalAutoPilotSettings && originalAutoPilotSettings.maxThroughput;
        this.autoPilotThroughput(originalAutoPilotMaxThroughput);
      } else {
        const originalAutoPilotTier = originalAutoPilotSettings && originalAutoPilotSettings.tier;
        this.selectedAutoPilotTier(originalAutoPilotTier);
      }
    }

    return Q();
  };

  public onValidIndexingPolicyEdit(): Q.Promise<any> {
    this.indexingPolicyContent.editableIsValid(true);
    return Q();
  }

  public onInvalidIndexingPolicyEdit(): Q.Promise<any> {
    this.indexingPolicyContent.editableIsValid(false);
    return Q();
  }

  public onActivate(): Q.Promise<any> {
    return super.onActivate().then(async () => {
      this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Settings);
      const database: ViewModels.Database = this.collection.getDatabase();
      await database.loadOffer();
    });
  }

  public toggleScale(): void {
    this.scaleExpanded(!this.scaleExpanded());
  }

  public toggleSettings(): void {
    if (this.hasDatabaseSharedThroughput()) {
      return;
    }

    this.settingsExpanded(!this.settingsExpanded());
  }

  public toggleConflictResolution(): void {
    this.conflictResolutionExpanded(!this.conflictResolutionExpanded());
  }

  public onScaleKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.toggleScale();
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onConflictResolutionKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.toggleConflictResolution();
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onSettingsKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.toggleSettings();
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onTtlOffKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.timeToLive("off");
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onTtlOnNoDefaultKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.timeToLive("on-nodefault");
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onTtlOnKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.timeToLive("on");
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onGeographyKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.geospatialConfigType(this.GEOGRAPHY);
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onGeometryKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.geospatialConfigType(this.GEOMETRY);
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onAnalyticalStorageTtlOnNoDefaultKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.analyticalStorageTtlSelection("on-nodefault");
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onAnalyticalStorageTtlOnKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.analyticalStorageTtlSelection("on");
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onChangeFeedPolicyOffKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.changeFeedPolicyToggled(ChangeFeedPolicyToggledState.Off);
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onChangeFeedPolicyOnKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.changeFeedPolicyToggled(ChangeFeedPolicyToggledState.On);
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onConflictResolutionCustomKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.conflictResolutionPolicyMode(DataModels.ConflictResolutionMode.Custom);
      event.stopPropagation();
      return false;
    }

    return true;
  }

  public onConflictResolutionLWWKeyPress(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.conflictResolutionPolicyMode(DataModels.ConflictResolutionMode.LastWriterWins);
      event.stopPropagation();
      return false;
    }

    return true;
  }

  private _getThroughputUnit(): string {
    return this.rupm() === Constants.RUPMStates.on ? "RU/m" : "RU/s";
  }

  public getUpdatedConflictResolutionPolicy(): DataModels.ConflictResolutionPolicy {
    if (
      !this.conflictResolutionPolicyMode.editableIsDirty() &&
      !this.conflictResolutionPolicyPath.editableIsDirty() &&
      !this.conflictResolutionPolicyProcedure.editableIsDirty()
    ) {
      return null;
    }

    const policy: DataModels.ConflictResolutionPolicy = {
      mode: SettingsTab.parseConflictResolutionMode(this.conflictResolutionPolicyMode())
    };

    if (
      policy.mode === DataModels.ConflictResolutionMode.Custom &&
      !!this.conflictResolutionPolicyProcedure() &&
      this.conflictResolutionPolicyProcedure().length > 0
    ) {
      policy.conflictResolutionProcedure = Constants.HashRoutePrefixes.sprocWithIds(
        this.collection.databaseId,
        this.collection.id(),
        this.conflictResolutionPolicyProcedure(),
        false
      );
    }

    if (policy.mode === DataModels.ConflictResolutionMode.LastWriterWins) {
      policy.conflictResolutionPath = this.conflictResolutionPolicyPath();
      if (
        policy.conflictResolutionPath &&
        policy.conflictResolutionPath.length > 0 &&
        policy.conflictResolutionPath[0] !== "/"
      ) {
        policy.conflictResolutionPath = "/" + policy.conflictResolutionPath;
      }
    }

    return policy;
  }

  public static parseConflictResolutionMode(modeFromBackend: string): DataModels.ConflictResolutionMode {
    // Backend can contain different casing as it does case-insensitive comparisson
    if (!modeFromBackend) {
      return null;
    }

    const modeAsLowerCase: string = modeFromBackend.toLowerCase();
    if (modeAsLowerCase === DataModels.ConflictResolutionMode.Custom.toLowerCase()) {
      return DataModels.ConflictResolutionMode.Custom;
    }

    // Default is LWW
    return DataModels.ConflictResolutionMode.LastWriterWins;
  }

  public static parseConflictResolutionProcedure(procedureFromBackEnd: string): string {
    // Backend data comes in /dbs/xxxx/colls/xxxx/sprocs/{name}, to make it easier for users, we just use the name
    if (!procedureFromBackEnd) {
      return null;
    }

    if (procedureFromBackEnd.indexOf("/") >= 0) {
      const sprocsIndex: number = procedureFromBackEnd.indexOf(Constants.HashRoutePrefixes.sprocHash);
      if (sprocsIndex === -1) {
        return null;
      }

      return procedureFromBackEnd.substr(sprocsIndex + Constants.HashRoutePrefixes.sprocHash.length);
    }

    // No path, just a name, in case backend returns just the name
    return procedureFromBackEnd;
  }

  private _setBaseline() {
    const sixMonthsInSeconds = 15768000;
    const defaultTtl = this.collection.defaultTtl();

    let timeToLive: string = this.timeToLive();
    let timeToLiveSeconds = this.timeToLiveSeconds();
    switch (defaultTtl) {
      case null:
      case undefined:
      case 0:
        timeToLive = "off";
        timeToLiveSeconds = sixMonthsInSeconds;
        break;
      case -1:
        timeToLive = "on-nodefault";
        timeToLiveSeconds = sixMonthsInSeconds;
        break;
      default:
        timeToLive = "on";
        timeToLiveSeconds = defaultTtl;
        break;
    }

    if (this.isAnalyticalStorageEnabled) {
      const analyticalStorageTtl: number = this.collection.analyticalStorageTtl();
      if (analyticalStorageTtl === Constants.AnalyticalStorageTtl.Infinite) {
        this.analyticalStorageTtlSelection.setBaseline("on-nodefault");
      } else {
        this.analyticalStorageTtlSelection.setBaseline("on");
        this.analyticalStorageTtlSeconds.setBaseline(analyticalStorageTtl);
      }
    }

    const offerThroughput =
      this.collection &&
      this.collection.offer &&
      this.collection.offer() &&
      this.collection.offer().content &&
      this.collection.offer().content.offerThroughput;

    const offerIsRUPerMinuteThroughputEnabled =
      this.collection &&
      this.collection.offer &&
      this.collection.offer() &&
      this.collection.offer().content &&
      this.collection.offer().content.offerIsRUPerMinuteThroughputEnabled;

    const changeFeedPolicyToggled: ChangeFeedPolicyToggledState = this.changeFeedPolicyToggled();
    this.changeFeedPolicyToggled.setBaseline(changeFeedPolicyToggled);
    this.throughput.setBaseline(offerThroughput);
    this.timeToLive.setBaseline(timeToLive);
    this.timeToLiveSeconds.setBaseline(timeToLiveSeconds);
    this.indexingPolicyContent.setBaseline(this.collection.indexingPolicy());
    const conflictResolutionPolicy: DataModels.ConflictResolutionPolicy =
      this.collection.conflictResolutionPolicy && this.collection.conflictResolutionPolicy();
    this.conflictResolutionPolicyMode.setBaseline(
      SettingsTab.parseConflictResolutionMode(conflictResolutionPolicy && conflictResolutionPolicy.mode)
    );
    this.conflictResolutionPolicyPath.setBaseline(
      conflictResolutionPolicy && conflictResolutionPolicy.conflictResolutionPath
    );
    this.conflictResolutionPolicyProcedure.setBaseline(
      SettingsTab.parseConflictResolutionProcedure(
        conflictResolutionPolicy && conflictResolutionPolicy.conflictResolutionProcedure
      )
    );
    this.rupm.setBaseline(offerIsRUPerMinuteThroughputEnabled ? Constants.RUPMStates.on : Constants.RUPMStates.off);

    const indexingPolicyContent = this.collection.indexingPolicy();
    const value: string = JSON.stringify(indexingPolicyContent, null, 4);

    this.indexingPolicyContent.setBaseline(indexingPolicyContent);

    if (!this.indexingPolicyEditor() && !this.isIndexingPolicyEditorInitializing()) {
      this._createIndexingPolicyEditor();
    } else {
      const indexingPolicyEditorModel = this.indexingPolicyEditor().getModel();
      indexingPolicyEditorModel.setValue(value);
    }

    const geospatialConfigType: string =
      (this.collection.geospatialConfig &&
        this.collection.geospatialConfig() &&
        this.collection.geospatialConfig().type) ||
      this.GEOMETRY;
    this.geospatialConfigType.setBaseline(geospatialConfigType);

    if (!this.hasAutoPilotV2FeatureFlag()) {
      const maxThroughput =
        this.collection &&
        this.collection.offer &&
        this.collection.offer() &&
        this.collection.offer().content &&
        this.collection.offer().content.offerAutopilotSettings &&
        this.collection.offer().content.offerAutopilotSettings.maxThroughput;

      this.autoPilotThroughput(maxThroughput || AutoPilotUtils.minAutoPilotThroughput);
    }
  }

  private _createIndexingPolicyEditor() {
    this.isIndexingPolicyEditorInitializing(true);

    // TODO: Remove this check once we unify Editor creation among all tabs
    if (!this._getIndexingPolicyEditorContainer()) {
      setTimeout(() => {
        this._createIndexingPolicyEditor();
      }, Constants.ClientDefaults.waitForDOMElementMs);
      return;
    }

    let value: string = JSON.stringify(this.indexingPolicyContent(), null, 4);

    // TODO: Use consistent logic to create editor throughout DataExplorer avoiding any race conditions
    $(document).ready(() => {
      let indexingPolicyEditor = monaco.editor.create(this._getIndexingPolicyEditorContainer(), {
        value: value,
        language: "json",
        readOnly: false,
        ariaLabel: "Indexing Policy"
      });
      indexingPolicyEditor.onDidFocusEditorText(() => this.indexingPolicyElementFocused(true));
      indexingPolicyEditor.onDidBlurEditorText(() => this.indexingPolicyElementFocused(false));
      const indexingPolicyEditorModel = indexingPolicyEditor.getModel();
      indexingPolicyEditorModel.onDidChangeContent(this._onEditorContentChange.bind(this));
      this.indexingPolicyEditor(indexingPolicyEditor);
      this.isIndexingPolicyEditorInitializing(false);
      if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
        TelemetryProcessor.traceSuccess(
          Action.Tab,
          {
            databaseAccountName: this.container.databaseAccount().name,
            databaseName: this.collection.databaseId,
            collectionName: this.collection.id(),
            defaultExperience: this.container.defaultExperience(),
            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: this.tabTitle()
          },
          this.onLoadStartKey
        );
        this.onLoadStartKey = null;
      }
    });
  }

  private _onEditorContentChange(e: monaco.editor.IModelContentChangedEvent) {
    const indexingPolicyEditorModel = this.indexingPolicyEditor().getModel();
    try {
      let parsed: any = JSON.parse(indexingPolicyEditorModel.getValue());
      this.indexingPolicyContent(parsed);
      this.onValidIndexingPolicyEdit();
    } catch (e) {
      this.onInvalidIndexingPolicyEdit();
    }
  }

  private _getIndexingPolicyEditorContainer(): HTMLElement {
    return document.getElementById(this.indexingPolicyEditorId);
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.saveSettingsButton.visible()) {
      const label = "Save";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onSaveClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveSettingsButton.enabled()
      });
    }

    if (this.discardSettingsChangesButton.visible()) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: this.onRevertClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardSettingsChangesButton.enabled()
      });
    }
    return buttons;
  }

  private _buildCommandBarOptions(): void {
    ko.computed(() =>
      ko.toJSON([
        this.saveSettingsButton.visible,
        this.saveSettingsButton.enabled,
        this.discardSettingsChangesButton.visible,
        this.discardSettingsChangesButton.enabled
      ])
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }
}
