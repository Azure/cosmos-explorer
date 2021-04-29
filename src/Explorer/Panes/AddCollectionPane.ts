import * as ko from "knockout";
import * as _ from "underscore";
import * as Constants from "../../Common/Constants";
import { createCollection } from "../../Common/dataAccess/createCollection";
import editable from "../../Common/EditableUtility";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { configContext, Platform } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { SubscriptionType } from "../../Contracts/SubscriptionType";
import * as ViewModels from "../../Contracts/ViewModels";
import * as AddCollectionUtility from "../../Shared/AddCollectionUtility";
import * as SharedConstants from "../../Shared/Constants";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import * as AutoPilotUtils from "../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../Utils/PricingUtils";
import { DynamicListItem } from "../Controls/DynamicList/DynamicListComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";

export interface AddCollectionPaneOptions extends ViewModels.PaneOptions {
  isPreferredApiTable: ko.Computed<boolean>;
  databaseId?: string;
  databaseSelfLink?: string;
}

export default class AddCollectionPane extends ContextualPaneBase {
  public defaultExperience: ko.Computed<string>;
  public databaseIds: ko.ObservableArray<string>;
  public collectionId: ko.Observable<string>;
  public collectionIdTitle: ko.Observable<string>;
  public databaseId: ko.Observable<string>;
  public databaseCreateNew: ko.Observable<boolean>;
  public collectionWithThroughputInSharedTitle: ko.Observable<string>;
  public collectionWithThroughputInShared: ko.Observable<boolean>;
  public databaseCreateNewShared: ko.Observable<boolean>;
  public databaseHasSharedOffer: ko.Observable<boolean>;
  public formErrorsDetails: ko.Observable<string>;
  public formWarnings: ko.Observable<string>;
  public partitionKey: ko.Observable<string>;
  public partitionKeyName: ko.Computed<string>;
  public lowerCasePartitionKeyName: ko.Computed<string>;
  public partitionKeyVisible: ko.Computed<boolean>;
  public partitionKeyPattern: ko.Computed<string>;
  public partitionKeyTitle: ko.Computed<string>;
  public storage: ko.Observable<string>;
  public throughputSinglePartition: ViewModels.Editable<number>;
  public throughputMultiPartition: ViewModels.Editable<number>;
  public throughputDatabase: ViewModels.Editable<number>;
  public isPreferredApiTable: ko.Computed<boolean>;
  public partitionKeyPlaceholder: ko.Computed<string>;
  public isTryCosmosDBSubscription: ko.Observable<boolean>;
  public maxThroughputRU: ko.Observable<number>;
  public minThroughputRU: ko.Observable<number>;
  public throughputRangeText: ko.Computed<string>;
  public sharedThroughputRangeText: ko.Computed<string>;
  public throughputSpendAckText: ko.Observable<string>;
  public throughputSpendAck: ko.Observable<boolean>;
  public throughputSpendAckVisible: ko.Computed<boolean>;
  public maxCollectionsReached: ko.Computed<boolean>;
  public maxCollectionsReachedMessage: ko.Observable<string>;
  public requestUnitsUsageCost: ko.Computed<string>;
  public dedicatedRequestUnitsUsageCost: ko.Computed<string>;
  public canRequestSupport: ko.PureComputed<boolean>;
  public largePartitionKey: ko.Observable<boolean> = ko.observable<boolean>(false);
  public useIndexingForSharedThroughput: ko.Observable<boolean> = ko.observable<boolean>(true);
  public costsVisible: ko.PureComputed<boolean>;
  public uniqueKeysVisible: ko.Computed<boolean>;
  public uniqueKeys: ko.ObservableArray<DynamicListItem>;
  public uniqueKeysPlaceholder: ko.Computed<string>;
  public upsellMessage: ko.PureComputed<string>;
  public upsellMessageAriaLabel: ko.PureComputed<string>;
  public upsellAnchorUrl: ko.PureComputed<string>;
  public upsellAnchorText: ko.PureComputed<string>;
  public debugstring: ko.Computed<string>;
  public displayCollectionThroughput: ko.Computed<boolean>;
  public isAutoPilotSelected: ko.Observable<boolean>;
  public isSharedAutoPilotSelected: ko.Observable<boolean>;
  public autoPilotThroughput: ko.Observable<number>;
  public sharedAutoPilotThroughput: ko.Observable<number>;
  public autoPilotUsageCost: ko.Computed<string>;
  public shouldUseDatabaseThroughput: ko.Computed<boolean>;
  public isFreeTierAccount: ko.Computed<boolean>;
  public showIndexingOptionsForSharedThroughput: ko.Computed<boolean>;
  public showAnalyticalStore: ko.Computed<boolean>;
  public showEnableSynapseLink: ko.Computed<boolean>;
  public isSynapseLinkSupported: ko.Computed<boolean>;
  public isAnalyticalStorageOn: ko.Observable<boolean>;
  public isSynapseLinkUpdating: ko.Computed<boolean>;
  public canExceedMaximumValue: ko.PureComputed<boolean>;
  public ruToolTipText: ko.Computed<string>;
  public freeTierExceedThroughputTooltip: ko.Computed<string>;
  public canConfigureThroughput: ko.PureComputed<boolean>;
  public showUpsellMessage: ko.PureComputed<boolean>;
  public shouldCreateMongoWildcardIndex: ko.Observable<boolean>;

  private _isSynapseLinkEnabled: ko.Computed<boolean>;

  constructor(options: AddCollectionPaneOptions) {
    super(options);
    this.ruToolTipText = ko.pureComputed(() => PricingUtils.getRuToolTipText());
    this.canConfigureThroughput = ko.pureComputed(() => !this.container.isServerlessEnabled());
    this.formWarnings = ko.observable<string>();
    this.collectionId = ko.observable<string>();
    this.databaseId = ko.observable<string>();
    this.databaseCreateNew = ko.observable<boolean>(true);
    this.databaseCreateNewShared = ko.observable<boolean>(this.getSharedThroughputDefault());
    this.collectionWithThroughputInShared = ko.observable<boolean>(false);
    this.databaseIds = ko.observableArray<string>();
    this.uniqueKeys = ko.observableArray<DynamicListItem>();

    if (this.container) {
      this.container.databases.subscribe((newDatabases: ViewModels.Database[]) => {
        this._onDatabasesChange(newDatabases);
      });
      this._onDatabasesChange(this.container.databases());
    }

    this.isPreferredApiTable = options.isPreferredApiTable;
    this.partitionKey = ko.observable<string>();
    this.partitionKey.subscribe((newPartitionKey: string) => {
      if (userContext.apiType === "Mongo" || !newPartitionKey || newPartitionKey[0] === "/") {
        return;
      }

      this.partitionKey(`/${newPartitionKey}`);
    });
    this.partitionKey.extend({ rateLimit: 100 });
    this.partitionKeyPattern = ko.pureComputed(() => {
      if (userContext.apiType === "Gremlin") {
        return "^/[^/]*";
      }
      return ".*";
    });
    this.partitionKeyTitle = ko.pureComputed(() => {
      if (userContext.apiType === "Gremlin") {
        return "May not use composite partition key";
      }
      return "";
    });

    this.canExceedMaximumValue = ko.pureComputed(() => this.container.canExceedMaximumValue());

    this.storage = ko.observable<string>();
    this.throughputSinglePartition = editable.observable<number>();
    this.throughputMultiPartition = editable.observable<number>();
    this.throughputDatabase = editable.observable<number>();
    this.collectionIdTitle = ko.observable<string>();
    this.collectionWithThroughputInSharedTitle = ko.observable<string>();
    this.maxThroughputRU = ko.observable<number>();
    this.minThroughputRU = ko.observable<number>();
    this.throughputSpendAckText = ko.observable<string>();
    this.throughputSpendAck = ko.observable<boolean>(false);
    this.maxCollectionsReachedMessage = ko.observable<string>();
    this.databaseHasSharedOffer = ko.observable<boolean>(true);
    this.throughputRangeText = ko.pureComputed<string>(() => {
      if (this.isAutoPilotSelected()) {
        return AutoPilotUtils.getAutoPilotHeaderText();
      }
      return `Throughput (${this.minThroughputRU().toLocaleString()} - ${this.maxThroughputRU().toLocaleString()} RU/s)`;
    });
    this.sharedThroughputRangeText = ko.pureComputed<string>(() => {
      if (this.isSharedAutoPilotSelected()) {
        return AutoPilotUtils.getAutoPilotHeaderText();
      }
      return `Throughput (${this.minThroughputRU().toLocaleString()} - ${this.maxThroughputRU().toLocaleString()} RU/s)`;
    });

    this.databaseId(options.databaseId);

    this.requestUnitsUsageCost = ko.computed(() => {
      const offerThroughput: number = this._getThroughput();
      if (
        offerThroughput < this.minThroughputRU() ||
        (offerThroughput > this.maxThroughputRU() && !this.canExceedMaximumValue())
      ) {
        return "";
      }

      const account = this.container.databaseAccount();
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

      let throughputSpendAckText: string;
      let estimatedSpend: string;
      if (!this.isSharedAutoPilotSelected()) {
        throughputSpendAckText = PricingUtils.getEstimatedSpendAcknowledgeString(
          offerThroughput,
          userContext.portalEnv,
          regions,
          multimaster,
          this.isSharedAutoPilotSelected()
        );
        estimatedSpend = PricingUtils.getEstimatedSpendHtml(
          offerThroughput,
          userContext.portalEnv,
          regions,
          multimaster
        );
      } else {
        throughputSpendAckText = PricingUtils.getEstimatedSpendAcknowledgeString(
          this.sharedAutoPilotThroughput(),
          userContext.portalEnv,
          regions,
          multimaster,
          this.isSharedAutoPilotSelected()
        );
        estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
          this.sharedAutoPilotThroughput(),
          userContext.portalEnv,
          regions,
          multimaster
        );
      }
      // TODO: change throughputSpendAckText to be a computed value, instead of having this side effect
      this.throughputSpendAckText(throughputSpendAckText);
      return estimatedSpend;
    });

    this.dedicatedRequestUnitsUsageCost = ko.computed(() => {
      const offerThroughput: number = this._getThroughput();
      if (
        offerThroughput < this.minThroughputRU() ||
        (offerThroughput > this.maxThroughputRU() && !this.canExceedMaximumValue())
      ) {
        return "";
      }

      const account = this.container.databaseAccount();
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

      let throughputSpendAckText: string;
      let estimatedSpend: string;
      if (!this.isAutoPilotSelected()) {
        throughputSpendAckText = PricingUtils.getEstimatedSpendAcknowledgeString(
          this.throughputMultiPartition(),
          userContext.portalEnv,
          regions,
          multimaster,
          this.isAutoPilotSelected()
        );
        estimatedSpend = PricingUtils.getEstimatedSpendHtml(
          this.throughputMultiPartition(),
          userContext.portalEnv,
          regions,
          multimaster
        );
      } else {
        throughputSpendAckText = PricingUtils.getEstimatedSpendAcknowledgeString(
          this.autoPilotThroughput(),
          userContext.portalEnv,
          regions,
          multimaster,
          this.isAutoPilotSelected()
        );
        estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
          this.autoPilotThroughput(),
          userContext.portalEnv,
          regions,
          multimaster
        );
      }
      // TODO: change throughputSpendAckText to be a computed value, instead of having this side effect
      this.throughputSpendAckText(throughputSpendAckText);
      return estimatedSpend;
    });

    this.isTryCosmosDBSubscription = ko.observable<boolean>(userContext.isTryCosmosDBSubscription || false);

    this.isTryCosmosDBSubscription.subscribe((isTryCosmosDB: boolean) => {
      if (!!isTryCosmosDB) {
        this.resetData();
      }
    });

    this.canRequestSupport = ko.pureComputed(() => {
      if (
        configContext.platform !== Platform.Emulator &&
        !userContext.isTryCosmosDBSubscription &&
        configContext.platform !== Platform.Portal
      ) {
        const offerThroughput: number = this._getThroughput();
        return offerThroughput <= 100000;
      }

      return false;
    });

    this.costsVisible = ko.pureComputed(() => {
      return configContext.platform !== Platform.Emulator;
    });

    this.maxCollectionsReached = ko.computed<boolean>(() => {
      if (!this.isTryCosmosDBSubscription()) {
        return false;
      }

      const currentCollections = this.container
        .databases()
        .map((db: ViewModels.Database) => {
          if (db.collections() && "length" in db.collections()) {
            return db.collections().length;
          }

          return 0;
        })
        .reduce((totalCollections: number, collections: number) => {
          return totalCollections + collections;
        }, 0);

      const maxCollections = Constants.TryCosmosExperience.collectionsPerAccount;

      if (currentCollections >= maxCollections) {
        let typeOfContainer = "collection";
        if (userContext.apiType === "Gremlin" || userContext.apiType === "Tables") {
          typeOfContainer = "container";
        }

        this.maxCollectionsReachedMessage(
          `You cannot create more than ${maxCollections} ${typeOfContainer}(s) during the Try Cosmos DB trial period.`
        );
        return true;
      }

      return false;
    });

    this.storage.subscribe(() => {
      if (this.isFixedStorageSelected()) {
        this.isAutoPilotSelected(false);
        this.partitionKey("");
      }
      this._updateThroughputLimitByStorage();
    });

    // TODO: Create derived classes for Tables and Mongo to replace the If statements below
    this.partitionKeyName = ko.computed<string>(() => {
      if (userContext.apiType === "Mongo") {
        return "Shard key";
      }

      return "Partition key";
    });

    this.lowerCasePartitionKeyName = ko.computed<string>(() => this.partitionKeyName().toLowerCase());

    this.partitionKeyPlaceholder = ko.computed<string>(() => {
      if (userContext.apiType === "Mongo") {
        return "e.g., address.zipCode";
      }

      if (userContext.apiType === "Gremlin") {
        return "e.g., /address";
      }

      return "e.g., /address/zipCode";
    });

    this.uniqueKeysPlaceholder = ko.pureComputed<string>(() => {
      if (userContext.apiType === "Mongo") {
        return "Comma separated paths e.g. firstName,address.zipCode";
      }

      return "Comma separated paths e.g. /firstName,/address/zipCode";
    });

    this.uniqueKeysVisible = ko.pureComputed<boolean>(() => {
      if (userContext.apiType === "SQL") {
        return true;
      }

      return false;
    });

    this.partitionKeyVisible = ko.computed<boolean>(() => {
      if (this.container == null || userContext.apiType === "Tables") {
        return false;
      }

      if (userContext.apiType === "Mongo" && !this.isUnlimitedStorageSelected() && this.databaseHasSharedOffer()) {
        return false;
      }

      if (!this.isUnlimitedStorageSelected() && !this.databaseHasSharedOffer()) {
        return false;
      }

      return true;
    });

    this.throughputSpendAckVisible = ko.pureComputed<boolean>(() => {
      const autoscaleThroughput = this.autoPilotThroughput() * 1;
      if (this.isAutoPilotSelected()) {
        return autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
      }
      const selectedThroughput: number = this._getThroughput();
      const maxRU: number = this.maxThroughputRU && this.maxThroughputRU();

      const isMaxRUGreaterThanDefault: boolean = maxRU > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
      const isThroughputSetGreaterThanDefault: boolean =
        selectedThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;

      if (this.canExceedMaximumValue()) {
        return isThroughputSetGreaterThanDefault;
      }

      return isThroughputSetGreaterThanDefault && isMaxRUGreaterThanDefault;
    });

    this.databaseCreateNew.subscribe((createNew: boolean) => {
      if (!createNew) {
        this.databaseCreateNewShared(this.getSharedThroughputDefault());
      }
    });

    this.databaseId.subscribe((selectedDatabaseId: string) => {
      if (!selectedDatabaseId) {
        return;
      }

      if (!this.databaseCreateNew()) {
        const selectedDatabase: ViewModels.Database = this.container
          .databases()
          .find((database: ViewModels.Database) => database.id() === selectedDatabaseId);
        this.databaseHasSharedOffer(!!selectedDatabase?.offer());
      }
    });

    this.databaseCreateNewShared.subscribe((useShared: boolean) => {
      this._updateThroughputLimitByStorage();
      this.databaseHasSharedOffer(useShared);
    });

    this.isAutoPilotSelected = ko.observable<boolean>(false);
    this.isSharedAutoPilotSelected = ko.observable<boolean>(false);
    this.autoPilotThroughput = ko.observable<number>(AutoPilotUtils.minAutoPilotThroughput);
    this.sharedAutoPilotThroughput = ko.observable<number>(AutoPilotUtils.minAutoPilotThroughput);
    this.autoPilotUsageCost = ko.pureComputed<string>(() => {
      const autoPilot = this._getAutoPilot();
      if (!autoPilot) {
        return "";
      }
      const isDatabaseThroughput: boolean = this.databaseCreateNewShared();
      return PricingUtils.getAutoPilotV3SpendHtml(autoPilot.maxThroughput, isDatabaseThroughput);
    });

    this.resetData();

    this.freeTierExceedThroughputTooltip = ko.pureComputed<string>(() =>
      this.isFreeTierAccount() && !this.container.isFirstResourceCreated()
        ? "The first 400 RU/s in this account are free. Billing will apply to any throughput beyond 400 RU/s."
        : ""
    );

    this.upsellMessage = ko.pureComputed<string>(() => {
      return PricingUtils.getUpsellMessage(
        userContext.portalEnv,
        this.isFreeTierAccount(),
        this.container.isFirstResourceCreated(),
        userContext.apiType,
        true
      );
    });

    this.upsellMessageAriaLabel = ko.pureComputed<string>(() => {
      return `${this.upsellMessage()}. Click ${this.isFreeTierAccount() ? "to learn more" : "for more details"}`;
    });

    this.upsellAnchorUrl = ko.pureComputed<string>(() => {
      return this.isFreeTierAccount() ? Constants.Urls.freeTierInformation : Constants.Urls.cosmosPricing;
    });

    this.upsellAnchorText = ko.pureComputed<string>(() => {
      return this.isFreeTierAccount() ? "Learn more" : "More details";
    });

    this.displayCollectionThroughput = ko.computed<boolean>(() => {
      const createNewDatabase = this.databaseCreateNew();
      const useExisitingDatabaseWithThroughput = !this.databaseCreateNew() && this.databaseHasSharedOffer();
      const useExisitingDatabaseWithoutThroughput = !this.databaseCreateNew() && !this.databaseHasSharedOffer();
      const provisionDatabaseThroughputIsChecked = this.databaseCreateNewShared();
      const provisionDedicatedThroughputForContainerIsChecked = this.collectionWithThroughputInShared();

      if (createNewDatabase && provisionDatabaseThroughputIsChecked) {
        return false;
      }

      if (createNewDatabase && !provisionDatabaseThroughputIsChecked) {
        return true;
      }

      if (useExisitingDatabaseWithThroughput && !provisionDedicatedThroughputForContainerIsChecked) {
        return false;
      }

      if (useExisitingDatabaseWithThroughput && provisionDedicatedThroughputForContainerIsChecked) {
        return true;
      }

      if (useExisitingDatabaseWithoutThroughput) {
        return true;
      }

      return false;
    });

    this.isFreeTierAccount = ko.computed<boolean>(() => {
      const databaseAccount = this.container && this.container.databaseAccount && this.container.databaseAccount();
      const isFreeTierAccount =
        databaseAccount && databaseAccount.properties && databaseAccount.properties.enableFreeTier;
      return isFreeTierAccount;
    });

    this.showUpsellMessage = ko.pureComputed(() => {
      if (this.container.isServerlessEnabled()) {
        return false;
      }

      if (
        this.isFreeTierAccount() &&
        !this.databaseCreateNew() &&
        this.databaseHasSharedOffer() &&
        !this.collectionWithThroughputInShared()
      ) {
        return false;
      }

      return true;
    });

    this.showIndexingOptionsForSharedThroughput = ko.computed<boolean>(() => {
      const newDatabaseWithSharedOffer = this.databaseCreateNew() && this.databaseCreateNewShared();
      const existingDatabaseWithSharedOffer = !this.databaseCreateNew() && this.databaseHasSharedOffer();

      if ((newDatabaseWithSharedOffer || existingDatabaseWithSharedOffer) && this.isFreeTierAccount()) {
        return true;
      }

      return false;
    });

    this.shouldUseDatabaseThroughput = ko.computed<boolean>(() => {
      // new database with shared offer
      if (this.databaseCreateNew() && this.databaseCreateNewShared()) {
        return true;
      }

      // existing database with shared offer and not provisioning collection level throughput
      if (!this.databaseCreateNew() && this.databaseHasSharedOffer() && !this.collectionWithThroughputInShared()) {
        return true;
      }

      return false;
    });

    this.isSynapseLinkSupported = ko.computed(() => {
      if (configContext.platform === Platform.Emulator) {
        return false;
      }

      if (this.container.isServerlessEnabled()) {
        return false;
      }

      if (userContext.apiType === "SQL") {
        return true;
      }

      if (userContext.apiType === "Mongo") {
        return true;
      }

      if (userContext.apiType === "Cassandra" && this.container.hasStorageAnalyticsAfecFeature()) {
        return true;
      }

      return false;
    });

    this._isSynapseLinkEnabled = ko.computed(() => {
      const databaseAccount =
        (this.container && this.container.databaseAccount && this.container.databaseAccount()) ||
        ({} as DataModels.DatabaseAccount);
      const properties = databaseAccount.properties || ({} as DataModels.DatabaseAccountExtendedProperties);

      // TODO: remove check for capability once all accounts have been migrated
      const capabilities = properties.capabilities || ([] as DataModels.Capability[]);
      if (capabilities.some((capability) => capability.name === Constants.CapabilityNames.EnableStorageAnalytics)) {
        return true;
      }

      const enableAnalyticalStorage: boolean = properties.enableAnalyticalStorage;
      if (enableAnalyticalStorage) {
        return true;
      }

      return false;
    });

    this.showEnableSynapseLink = ko.computed<boolean>(() => {
      return this.isSynapseLinkSupported() && !this._isSynapseLinkEnabled();
    });

    this.showAnalyticalStore = ko.computed(() => {
      return this.isSynapseLinkSupported() && this._isSynapseLinkEnabled();
    });

    this.isAnalyticalStorageOn = ko.observable<boolean>(this._isSynapseLinkEnabled());

    this._isSynapseLinkEnabled.subscribe((isSynapseLinkEnabled: boolean) => {
      this.isAnalyticalStorageOn(isSynapseLinkEnabled);
    });

    this.isSynapseLinkUpdating = ko.computed(() => this.container.isSynapseLinkUpdating());

    this.useIndexingForSharedThroughput.subscribe((value) => {
      TelemetryProcessor.traceMark(Action.ModifyOptionForThroughputWithSharedDatabase, {
        changedSelectedValueTo: value ? ActionModifiers.IndexAll : ActionModifiers.NoIndex,
      });
    });

    this.shouldCreateMongoWildcardIndex = ko.observable(this.container.isMongoIndexingEnabled());
  }

  public getSharedThroughputDefault(): boolean {
    const subscriptionType = userContext.subscriptionType;
    if (subscriptionType === SubscriptionType.EA || this.container.isServerlessEnabled()) {
      return false;
    }

    return true;
  }

  public onMoreDetailsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.showErrorDetails();
      return false;
    }
    return true;
  };

  public async open(databaseId?: string) {
    super.open();
    // TODO: Figure out if a database level partition split is about to happen once shared throughput read is available
    this.formWarnings("");
    this.databaseCreateNewShared(this.getSharedThroughputDefault());
    this.shouldCreateMongoWildcardIndex(this.container.isMongoIndexingEnabled());
    if (!this.container.isServerlessEnabled()) {
      this.isAutoPilotSelected(this.container.isAutoscaleDefaultEnabled());
      this.isSharedAutoPilotSelected(this.container.isAutoscaleDefaultEnabled());
    }
    if (this.isPreferredApiTable() && !databaseId) {
      databaseId = SharedConstants.CollectionCreation.TablesAPIDefaultDatabase;
    }

    this.databaseCreateNew(!databaseId);
    this.collectionWithThroughputInShared(false);
    this.databaseId(databaseId);

    const addCollectionPaneOpenMessage = {
      collection: ko.toJS({
        id: this.collectionId(),
        storage: this.storage(),
        offerThroughput: this._getThroughput(),
        partitionKey: this.partitionKey(),
        databaseId: this.databaseId(),
      }),
      subscriptionType: userContext.subscriptionType,
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        storage: this.storage() === Constants.BackendDefaults.singlePartitionStorageInGb ? "f" : "u",
        throughput: this._getThroughput(),
        flight: userContext.addCollectionFlight,
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
    };

    await this.container.loadDatabaseOffers();
    this._onDatabasesChange(this.container.databases());
    this._setFocus();

    TelemetryProcessor.trace(Action.CreateCollection, ActionModifiers.Open, addCollectionPaneOpenMessage);
  }

  private transferFocus(elementIdToKeepVisible: string, elementIdToFocus: string): void {
    document.getElementById(elementIdToKeepVisible).style.visibility = "visible";
    document.getElementById(elementIdToFocus).focus();
  }

  private onFocusOut(_: any, event: any): void {
    event.target.parentElement.style.visibility = "";
  }

  private onMouseOut(_: any, event: any): void {
    event.target.style.visibility = "";
  }

  private onKeyDown(previousActiveElementId: string, _: any, event: KeyboardEvent): boolean {
    if (event.shiftKey && event.keyCode == Constants.KeyCodes.Tab) {
      document.getElementById(previousActiveElementId).focus();
      return false;
    } else {
      // Execute default action
      return true;
    }
  }

  private isMongo(): boolean {
    return userContext.apiType === "Mongo";
  }

  private _onDatabasesChange(newDatabaseIds: ViewModels.Database[]) {
    this.databaseIds(newDatabaseIds?.map((database: ViewModels.Database) => database.id()));
  }

  private _computeOfferThroughput(): number {
    if (!this.canConfigureThroughput()) {
      return undefined;
    }

    // return undefined if autopilot is selected for the new database/collection
    if (this.databaseCreateNew()) {
      // database is shared and autopilot is sleected for the database
      if (this.databaseCreateNewShared() && this.isSharedAutoPilotSelected()) {
        return undefined;
      }
      // database is not shared and autopilot is selected for the collection
      if (!this.databaseCreateNewShared() && this.isAutoPilotSelected()) {
        return undefined;
      }
    }

    return this._getThroughput();
  }

  public submit() {
    if (!this.isValid()) {
      return;
    }

    if (userContext.apiType === "Tables") {
      // Table require fixed Database: TablesDB, and fixed Partition Key: /'$pk'
      this.databaseId(SharedConstants.CollectionCreation.TablesAPIDefaultDatabase);
      this.partitionKey("/'$pk'");
    }

    let partitionKeyPath: string = this.partitionKey();
    const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = this._getUniqueKeyPolicy();
    const offerThroughput: number = this._computeOfferThroughput();

    let partitionKeyVersion: number = this.largePartitionKey() ? 2 : undefined;
    let partitionKey: DataModels.PartitionKey = partitionKeyPath.trim()
      ? {
          paths: [partitionKeyPath],
          kind: Constants.BackendDefaults.partitionKeyKind,
          version: partitionKeyVersion,
        }
      : null;
    const autoPilot: DataModels.AutoPilotCreationSettings = this._getAutoPilot();

    const addCollectionPaneStartMessage = {
      database: ko.toJS({
        id: this.databaseId(),
        new: this.databaseCreateNew(),
        shared: this.databaseHasSharedOffer(),
      }),
      offerThroughput: offerThroughput,
      offerAutopilot: autoPilot,
      collection: ko.toJS({
        id: this.collectionId(),
        storage: this.storage(),
        partitionKey,
        uniqueKeyPolicy,
        collectionWithThroughputInShared: this.collectionWithThroughputInShared(),
      }),
      subscriptionType: userContext.subscriptionType,
      subscriptionQuotaId: userContext.quotaId,
      defaultsCheck: {
        storage: this.storage() === Constants.BackendDefaults.singlePartitionStorageInGb ? "f" : "u",
        throughput: offerThroughput,
        flight: userContext.addCollectionFlight,
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
      useIndexingForSharedThroughput: this.useIndexingForSharedThroughput(),
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateCollection, addCollectionPaneStartMessage);

    let databaseId: string = this.databaseCreateNew() ? this.databaseId().trim() : this.databaseId();
    let collectionId: string = this.collectionId().trim();

    let indexingPolicy: DataModels.IndexingPolicy;
    let createMongoWildcardIndex: boolean;
    // todo - remove mongo indexing policy ticket # 616274
    if (userContext.apiType === "Mongo" && this.container.isEnableMongoCapabilityPresent()) {
      createMongoWildcardIndex = this.shouldCreateMongoWildcardIndex();
    } else if (this.showIndexingOptionsForSharedThroughput()) {
      if (this.useIndexingForSharedThroughput()) {
        indexingPolicy = SharedConstants.IndexingPolicies.AllPropertiesIndexed;
      } else {
        indexingPolicy = SharedConstants.IndexingPolicies.SharedDatabaseDefault;
      }
    } else {
      indexingPolicy = SharedConstants.IndexingPolicies.AllPropertiesIndexed;
    }

    this.formErrors("");
    this.isExecuting(true);

    const databaseLevelThroughput: boolean = this.databaseCreateNew()
      ? this.databaseCreateNewShared()
      : this.databaseHasSharedOffer() && !this.collectionWithThroughputInShared();
    const autoPilotMaxThroughput: number = databaseLevelThroughput
      ? this.isSharedAutoPilotSelected() && this.sharedAutoPilotThroughput()
      : this.isAutoPilotSelected() && this.autoPilotThroughput();
    const createCollectionParams: DataModels.CreateCollectionParams = {
      createNewDatabase: this.databaseCreateNew(),
      collectionId,
      databaseId,
      databaseLevelThroughput,
      offerThroughput,
      analyticalStorageTtl: this._getAnalyticalStorageTtl(),
      autoPilotMaxThroughput,
      indexingPolicy,
      partitionKey,
      uniqueKeyPolicy,
      createMongoWildcardIndex,
    };

    createCollection(createCollectionParams).then(
      () => {
        this.isExecuting(false);
        this.close();
        this.container.refreshAllDatabases();
        const addCollectionPaneSuccessMessage = {
          database: ko.toJS({
            id: this.databaseId(),
            new: this.databaseCreateNew(),
            shared: this.databaseHasSharedOffer(),
          }),
          offerThroughput,
          collection: ko.toJS({
            id: this.collectionId(),
            storage: this.storage(),
            partitionKey,
            uniqueKeyPolicy,
            collectionWithThroughputInShared: this.collectionWithThroughputInShared(),
          }),
          subscriptionType: userContext.subscriptionType,
          subscriptionQuotaId: userContext.quotaId,
          defaultsCheck: {
            storage: this.storage() === Constants.BackendDefaults.singlePartitionStorageInGb ? "f" : "u",
            throughput: offerThroughput,
            flight: userContext.addCollectionFlight,
          },
          dataExplorerArea: Constants.Areas.ContextualPane,
        };
        TelemetryProcessor.traceSuccess(Action.CreateCollection, addCollectionPaneSuccessMessage, startKey);
        this.resetData();
        this.container.refreshAllDatabases();
      },
      (error: any) => {
        this.isExecuting(false);
        const errorMessage: string = getErrorMessage(error);
        this.formErrors(errorMessage);
        this.formErrorsDetails(errorMessage);
        const addCollectionPaneFailedMessage = {
          database: ko.toJS({
            id: this.databaseId(),
            new: this.databaseCreateNew(),
            shared: this.databaseHasSharedOffer(),
          }),
          offerThroughput: offerThroughput,
          collection: {
            id: this.collectionId(),
            storage: this.storage(),
            partitionKey,
            uniqueKeyPolicy,
            collectionWithThroughputInShared: this.collectionWithThroughputInShared(),
          },
          subscriptionType: userContext.subscriptionType,
          subscriptionQuotaId: userContext.quotaId,
          defaultsCheck: {
            storage: this.storage() === Constants.BackendDefaults.singlePartitionStorageInGb ? "f" : "u",
            throughput: offerThroughput,
            flight: userContext.addCollectionFlight,
          },
          dataExplorerArea: Constants.Areas.ContextualPane,
          error: errorMessage,
          errorStack: getErrorStack(error),
        };
        TelemetryProcessor.traceFailure(Action.CreateCollection, addCollectionPaneFailedMessage, startKey);
      }
    );
  }

  public resetData() {
    this.collectionId("");
    this.databaseId("");
    this.partitionKey("");
    this.throughputSpendAck(false);
    if (!this.container.isServerlessEnabled()) {
      this.isAutoPilotSelected(this.container.isAutoscaleDefaultEnabled());
      this.isSharedAutoPilotSelected(this.container.isAutoscaleDefaultEnabled());
    }
    this.autoPilotThroughput(AutoPilotUtils.minAutoPilotThroughput);
    this.sharedAutoPilotThroughput(AutoPilotUtils.minAutoPilotThroughput);

    this.shouldCreateMongoWildcardIndex = ko.observable(this.container.isMongoIndexingEnabled());

    this.uniqueKeys([]);
    this.useIndexingForSharedThroughput(true);

    const defaultStorage = this.container.collectionCreationDefaults.storage;
    this.storage(defaultStorage);

    const defaultThroughput = this.container.collectionCreationDefaults.throughput;
    this.throughputSinglePartition(defaultThroughput.fixed);
    this.throughputMultiPartition(
      AddCollectionUtility.getMaxThroughput(this.container.collectionCreationDefaults, this.container)
    );

    this.throughputDatabase(defaultThroughput.shared);
    this.databaseCreateNew(true);
    this.databaseHasSharedOffer(this.getSharedThroughputDefault());
    this.collectionWithThroughputInShared(false);
    this.databaseCreateNewShared(this.getSharedThroughputDefault());
    if (this.isTryCosmosDBSubscription()) {
      this._resetDataForTryCosmosDB();
    }

    this.largePartitionKey(false);

    this._updateThroughputLimitByStorage();
    super.resetData();
  }

  public isNonTableApi = (): boolean => {
    return userContext.apiType !== "Tables";
  };

  public isUnlimitedStorageSelected = (): boolean => {
    return this.storage() === Constants.BackendDefaults.multiPartitionStorageInGb;
  };

  public isFixedStorageSelected = (): boolean => {
    return this.storage() === Constants.BackendDefaults.singlePartitionStorageInGb;
  };

  public onStorageOptionsKeyDown(source: any, event: KeyboardEvent): boolean {
    if (event.keyCode === Constants.KeyCodes.RightArrow) {
      this.storage(Constants.BackendDefaults.multiPartitionStorageInGb);
      return false;
    }

    if (event.keyCode === Constants.KeyCodes.LeftArrow) {
      this.storage(Constants.BackendDefaults.singlePartitionStorageInGb);
      return false;
    }

    return true;
  }

  public onEnableSynapseLinkButtonClicked() {
    this.container.openEnableSynapseLinkDialog();
  }

  public ttl90DaysEnabled: () => boolean = () => userContext.features.ttl90Days;

  public isValid(): boolean {
    // TODO add feature flag that disables validation for customers with custom accounts
    if ((this.databaseCreateNewShared() && this.isSharedAutoPilotSelected()) || this.isAutoPilotSelected()) {
      const autoPilot = this._getAutoPilot();
      if (
        !autoPilot ||
        !autoPilot.maxThroughput ||
        !AutoPilotUtils.isValidAutoPilotThroughput(autoPilot.maxThroughput)
      ) {
        this.formErrors(
          `Please enter a value greater than ${AutoPilotUtils.minAutoPilotThroughput} for autopilot throughput`
        );
        return false;
      }
    }

    const throughput = this._getThroughput();
    if (throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && !this.throughputSpendAck()) {
      this.formErrors(`Please acknowledge the estimated daily spend.`);
      return false;
    }

    if (userContext.apiType === "Gremlin" && (this.partitionKey() === "/id" || this.partitionKey() === "/label")) {
      this.formErrors("/id and /label as partition keys are not allowed for graph.");
      return false;
    }

    const autoscaleThroughput = this.autoPilotThroughput() * 1;

    if (
      this.isAutoPilotSelected() &&
      autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K &&
      !this.throughputSpendAck()
    ) {
      this.formErrors(`Please acknowledge the estimated monthly spend.`);
      return false;
    }

    return true;
  }

  private _setFocus() {
    // Autofocus is enabled on AddCollectionPane based on the preferred API
    if (userContext.apiType === "Tables") {
      const focusTableId = document.getElementById("containerId");
      focusTableId && focusTableId.focus();
      return;
    }

    if (this.databaseCreateNew()) {
      const focusDatabaseId = document.getElementById("databaseId");
      focusDatabaseId && focusDatabaseId.focus();
      return;
    }

    const focusExistingDatabaseId = document.getElementById("containerId");
    focusExistingDatabaseId && focusExistingDatabaseId.focus();
  }

  private _getThroughput(): number {
    let throughput: number =
      this.storage() === Constants.BackendDefaults.singlePartitionStorageInGb
        ? this.throughputSinglePartition()
        : this.throughputMultiPartition();
    if (this.databaseHasSharedOffer()) {
      if (this.collectionWithThroughputInShared()) {
        throughput = this.throughputMultiPartition();
      } else {
        throughput = this.throughputDatabase();
      }
    }

    return isNaN(throughput) ? 0 : Number(throughput);
  }

  private _getAutoPilot(): DataModels.AutoPilotCreationSettings {
    if (this.databaseCreateNewShared() && this.isSharedAutoPilotSelected() && this.sharedAutoPilotThroughput()) {
      return {
        maxThroughput: this.sharedAutoPilotThroughput() * 1,
      };
    }
    if (this.isAutoPilotSelected() && this.autoPilotThroughput()) {
      return {
        maxThroughput: this.autoPilotThroughput() * 1,
      };
    }

    return undefined;
  }

  private _calculateNumberOfPartitions(): number {
    // Note: this will not validate properly on accounts that have been set up for custom partitioning,
    // but there is no way to know the number of partitions for that case.
    return this.storage() === Constants.BackendDefaults.singlePartitionStorageInGb
      ? SharedConstants.CollectionCreation.NumberOfPartitionsInFixedCollection
      : SharedConstants.CollectionCreation.NumberOfPartitionsInUnlimitedCollection;
  }

  private _convertShardKeyToPartitionKey(shardKey: string): string {
    if (!shardKey) {
      return shardKey;
    }

    const shardKeyParts = shardKey.split(".");
    let partitionKey = shardKeyParts.join("/");

    if (partitionKey[0] !== "/") {
      partitionKey = "/" + partitionKey;
    }
    return partitionKey;
  }

  private _resetDataForTryCosmosDB() {
    this.storage(Constants.BackendDefaults.multiPartitionStorageInGb);
    this.throughputSinglePartition(Constants.TryCosmosExperience.defaultRU);
    this.throughputDatabase(SharedConstants.CollectionCreation.DefaultCollectionRUs400);
  }

  private _updateThroughputLimitByStorage() {
    if (this.databaseCreateNewShared()) {
      this._updateThroughputLimitByDatabase();
    } else {
      this._updateThroughputLimitByCollectionStorage();
    }
  }

  private _updateThroughputLimitByCollectionStorage() {
    const storage = this.storage();
    const minThroughputRU =
      storage === SharedConstants.CollectionCreation.storage10Gb
        ? SharedConstants.CollectionCreation.DefaultCollectionRUs400
        : this.container.collectionCreationDefaults.throughput.unlimitedmin;

    let maxThroughputRU;
    if (this.isTryCosmosDBSubscription()) {
      maxThroughputRU = Constants.TryCosmosExperience.maxRU;
    } else {
      maxThroughputRU =
        storage === SharedConstants.CollectionCreation.storage10Gb
          ? SharedConstants.CollectionCreation.DefaultCollectionRUs10K
          : this.container.collectionCreationDefaults.throughput.unlimitedmax;
    }

    this.minThroughputRU(minThroughputRU);
    this.maxThroughputRU(maxThroughputRU);
  }

  private _updateThroughputLimitByDatabase() {
    const defaultThruoghput = this.container.collectionCreationDefaults.throughput;
    this.maxThroughputRU(defaultThruoghput.unlimitedmax);
    this.minThroughputRU(defaultThruoghput.unlimitedmin);
  }

  /**
   * Obtains the UniqueKeyPolicy and applies transformations for Mongo APIs
   */
  private _getUniqueKeyPolicy(): DataModels.UniqueKeyPolicy {
    let transform = (value: string) => {
      return value;
    };
    if (userContext.apiType === "Mongo") {
      transform = (value: string) => {
        return this._convertShardKeyToPartitionKey(value);
      };
    }

    return this._parseUniqueIndexes(transform);
  }

  /**
   * Obtains the current added unique keys and applies cleaning, removing spaces and empty entries
   * @param transform Transformation process for each detected key
   */
  private _parseUniqueIndexes(transform: (value: string) => string): DataModels.UniqueKeyPolicy {
    if (this.uniqueKeys().length === 0) {
      return null;
    }

    const uniqueKeyPolicy: DataModels.UniqueKeyPolicy = { uniqueKeys: [] };
    this.uniqueKeys().forEach((uniqueIndexPaths: DynamicListItem) => {
      const uniqueIndexPathValue: string = uniqueIndexPaths.value();
      if (!!uniqueIndexPathValue && uniqueIndexPathValue.length > 0) {
        const validPaths: string[] = _.filter(
          uniqueIndexPathValue.split(","),
          (path: string) => !!path && path.length > 0
        );
        const cleanedUpPaths: string[] = validPaths.map((path: string) => {
          return transform(path.trim());
        });
        if (cleanedUpPaths.length > 0) {
          const uniqueKey: DataModels.UniqueKey = { paths: cleanedUpPaths };
          uniqueKeyPolicy.uniqueKeys.push(uniqueKey);
        }
      }
    });

    return uniqueKeyPolicy;
  }

  private _getAnalyticalStorageTtl(): number {
    if (!this.showAnalyticalStore()) {
      return undefined;
    }

    if (this.isAnalyticalStorageOn()) {
      // TODO: always default to 90 days once the backend hotfix is deployed
      return userContext.features.ttl90Days
        ? Constants.AnalyticalStorageTtl.Days90
        : Constants.AnalyticalStorageTtl.Infinite;
    }

    return Constants.AnalyticalStorageTtl.Disabled;
  }
}
