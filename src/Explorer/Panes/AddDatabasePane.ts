import * as AutoPilotUtils from "../../Utils/AutoPilotUtils";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ErrorParserUtility from "../../Common/ErrorParserUtility";
import * as ko from "knockout";
import * as PricingUtils from "../../Utils/PricingUtils";
import * as SharedConstants from "../../Shared/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import editable from "../../Common/EditableUtility";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { createDatabase } from "../../Common/dataAccess/createDatabase";
import { PlatformType } from "../../PlatformType";

export default class AddDatabasePane extends ContextualPaneBase {
  public defaultExperience: ko.Computed<string>;
  public databaseIdLabel: ko.Computed<string>;
  public databaseId: ko.Observable<string>;
  public databaseIdTooltipText: ko.Computed<string>;
  public databaseLevelThroughputTooltipText: ko.Computed<string>;
  public databaseCreateNewShared: ko.Observable<boolean>;
  public formErrorsDetails: ko.Observable<string>;
  public throughput: ViewModels.Editable<number>;
  public maxThroughputRU: ko.Observable<number>;
  public minThroughputRU: ko.Observable<number>;
  public maxThroughputRUText: ko.PureComputed<string>;
  public throughputRangeText: ko.Computed<string>;
  public throughputSpendAckText: ko.Observable<string>;
  public throughputSpendAck: ko.Observable<boolean>;
  public throughputSpendAckVisible: ko.Computed<boolean>;
  public requestUnitsUsageCost: ko.Computed<string>;
  public canRequestSupport: ko.PureComputed<boolean>;
  public costsVisible: ko.PureComputed<boolean>;
  public upsellMessage: ko.PureComputed<string>;
  public upsellMessageAriaLabel: ko.PureComputed<string>;
  public upsellAnchorUrl: ko.PureComputed<string>;
  public upsellAnchorText: ko.PureComputed<string>;
  public isAutoPilotSelected: ko.Observable<boolean>;
  public selectedAutoPilotTier: ko.Observable<DataModels.AutopilotTier>;
  public autoPilotTiersList: ko.ObservableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>;
  public maxAutoPilotThroughputSet: ko.Observable<number>;
  public autoPilotUsageCost: ko.Computed<string>;
  public canExceedMaximumValue: ko.PureComputed<boolean>;
  public hasAutoPilotV2FeatureFlag: ko.PureComputed<boolean>;
  public ruToolTipText: ko.Computed<string>;
  public isFreeTierAccount: ko.Computed<boolean>;
  public canConfigureThroughput: ko.PureComputed<boolean>;
  public showUpsellMessage: ko.PureComputed<boolean>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.title((this.container && this.container.addDatabaseText()) || "New Database");
    this.databaseId = ko.observable<string>();
    this.hasAutoPilotV2FeatureFlag = ko.pureComputed(() => this.container.hasAutoPilotV2FeatureFlag());
    this.ruToolTipText = ko.pureComputed(() => PricingUtils.getRuToolTipText(this.hasAutoPilotV2FeatureFlag()));
    this.canConfigureThroughput = ko.pureComputed(() => !this.container.isServerlessEnabled());
    this.showUpsellMessage = ko.pureComputed(() => !this.container.isServerlessEnabled());

    this.canExceedMaximumValue = ko.pureComputed(() => this.container.canExceedMaximumValue());

    // TODO 388844: get defaults from parent frame
    this.databaseCreateNewShared = ko.observable<boolean>(this.getSharedThroughputDefault());

    this.container.subscriptionType &&
      this.container.subscriptionType.subscribe(subscriptionType => {
        this.databaseCreateNewShared(this.getSharedThroughputDefault());
      });

    this.databaseIdLabel = ko.computed<string>(() =>
      this.container.isPreferredApiCassandra() ? "Keyspace id" : "Database id"
    );
    this.databaseIdTooltipText = ko.computed<string>(() => {
      const isCassandraAccount: boolean = this.container.isPreferredApiCassandra();
      return `A ${isCassandraAccount ? "keyspace" : "database"} is a logical container of one or more ${
        isCassandraAccount ? "tables" : "collections"
      }`;
    });
    this.databaseLevelThroughputTooltipText = ko.computed<string>(() => {
      const isCassandraAccount: boolean = this.container.isPreferredApiCassandra();
      const databaseLabel: string = isCassandraAccount ? "keyspace" : "database";
      const collectionsLabel: string = isCassandraAccount ? "tables" : "collections";
      return `Provisioned throughput at the ${databaseLabel} level will be shared across all ${collectionsLabel} within the ${databaseLabel}.`;
    });

    this.throughput = editable.observable<number>();
    this.maxThroughputRU = ko.observable<number>();
    this.minThroughputRU = ko.observable<number>();
    this.throughputSpendAckText = ko.observable<string>();
    this.throughputSpendAck = ko.observable<boolean>(false);
    this.selectedAutoPilotTier = ko.observable<DataModels.AutopilotTier>();
    this.autoPilotTiersList = ko.observableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>(
      AutoPilotUtils.getAvailableAutoPilotTiersOptions()
    );
    this.isAutoPilotSelected = ko.observable<boolean>(false);
    this.maxAutoPilotThroughputSet = ko.observable<number>(AutoPilotUtils.minAutoPilotThroughput);
    this.autoPilotUsageCost = ko.pureComputed<string>(() => {
      const autoPilot = this._isAutoPilotSelectedAndWhatTier();
      if (!autoPilot) {
        return "";
      }
      return !this.hasAutoPilotV2FeatureFlag()
        ? PricingUtils.getAutoPilotV3SpendHtml(autoPilot.maxThroughput, true /* isDatabaseThroughput */)
        : PricingUtils.getAutoPilotV2SpendHtml(autoPilot.autopilotTier, true /* isDatabaseThroughput */);
    });
    this.throughputRangeText = ko.pureComputed<string>(() => {
      if (this.isAutoPilotSelected()) {
        return AutoPilotUtils.getAutoPilotHeaderText(this.hasAutoPilotV2FeatureFlag());
      }
      return `Throughput (${this.minThroughputRU().toLocaleString()} - ${this.maxThroughputRU().toLocaleString()} RU/s)`;
    });

    this.requestUnitsUsageCost = ko.computed(() => {
      const offerThroughput: number = this.throughput();
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

      const serverId = this.container.serverId();
      const regions =
        (account &&
          account.properties &&
          account.properties.readLocations &&
          account.properties.readLocations.length) ||
        1;
      const multimaster = (account && account.properties && account.properties.enableMultipleWriteLocations) || false;

      let estimatedSpendAcknowledge: string;
      let estimatedSpend: string;
      if (!this.isAutoPilotSelected()) {
        estimatedSpend = PricingUtils.getEstimatedSpendHtml(
          offerThroughput,
          serverId,
          regions,
          multimaster,
          false /*rupmEnabled*/
        );
        estimatedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
          offerThroughput,
          serverId,
          regions,
          multimaster,
          false /*rupmEnabled*/,
          this.isAutoPilotSelected()
        );
      } else {
        estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
          this.maxAutoPilotThroughputSet(),
          serverId,
          regions,
          multimaster
        );
        estimatedSpendAcknowledge = PricingUtils.getEstimatedSpendAcknowledgeString(
          this.maxAutoPilotThroughputSet(),
          serverId,
          regions,
          multimaster,
          false /*rupmEnabled*/,
          this.isAutoPilotSelected()
        );
      }
      // TODO: change throughputSpendAckText to be a computed value, instead of having this side effect
      this.throughputSpendAckText(estimatedSpendAcknowledge);
      return estimatedSpend;
    });

    this.canRequestSupport = ko.pureComputed(() => {
      if (
        !this.container.isEmulator &&
        !this.container.isTryCosmosDBSubscription() &&
        this.container.getPlatformType() !== PlatformType.Portal
      ) {
        const offerThroughput: number = this.throughput();
        return offerThroughput <= 100000;
      }

      return false;
    });

    this.isFreeTierAccount = ko.computed<boolean>(() => {
      const databaseAccount = this.container && this.container.databaseAccount && this.container.databaseAccount();
      const isFreeTierAccount =
        databaseAccount && databaseAccount.properties && databaseAccount.properties.enableFreeTier;
      return isFreeTierAccount;
    });

    this.maxThroughputRUText = ko.pureComputed(() => {
      return this.maxThroughputRU().toLocaleString();
    });

    this.costsVisible = ko.pureComputed(() => {
      return !this.container.isEmulator;
    });

    this.throughputSpendAckVisible = ko.pureComputed<boolean>(() => {
      const autoscaleThroughput = this.maxAutoPilotThroughputSet() * 1;
      if (!this.hasAutoPilotV2FeatureFlag() && this.isAutoPilotSelected()) {
        return autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
      }

      const selectedThroughput: number = this.throughput();
      const maxRU: number = this.maxThroughputRU && this.maxThroughputRU();

      const isMaxRUGreaterThanDefault: boolean = maxRU > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;
      const isThroughputSetGreaterThanDefault: boolean =
        selectedThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K;

      if (this.canExceedMaximumValue()) {
        return isThroughputSetGreaterThanDefault;
      }

      return isThroughputSetGreaterThanDefault && isMaxRUGreaterThanDefault;
    });

    this.databaseCreateNewShared.subscribe((useShared: boolean) => {
      this._updateThroughputLimitByDatabase();
    });

    this.resetData();
    this.container.flight.subscribe(() => {
      this.resetData();
    });

    this.upsellMessage = ko.pureComputed<string>(() => {
      return PricingUtils.getUpsellMessage(this.container.serverId(), this.isFreeTierAccount());
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
  }

  public onMoreDetailsKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.showErrorDetails();
      return false;
    }
    return true;
  };

  public open() {
    super.open();
    this.resetData();
    const addDatabasePaneOpenMessage = {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      subscriptionType: ViewModels.SubscriptionType[this.container.subscriptionType()],
      subscriptionQuotaId: this.container.quotaId(),
      defaultsCheck: {
        throughput: this.throughput(),
        flight: this.container.flight()
      },
      dataExplorerArea: Constants.Areas.ContextualPane
    };
    const focusElement = document.getElementById("database-id");
    focusElement && focusElement.focus();
    TelemetryProcessor.trace(Action.CreateDatabase, ActionModifiers.Open, addDatabasePaneOpenMessage);
  }

  public submit() {
    if (!this._isValid()) {
      return;
    }

    const offerThroughput: number = this._computeOfferThroughput();

    const addDatabasePaneStartMessage = {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      database: ko.toJS({
        id: this.databaseId(),
        shared: this.databaseCreateNewShared()
      }),
      offerThroughput,
      subscriptionType: ViewModels.SubscriptionType[this.container.subscriptionType()],
      subscriptionQuotaId: this.container.quotaId(),
      defaultsCheck: {
        flight: this.container.flight()
      },
      dataExplorerArea: Constants.Areas.ContextualPane
    };
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDatabase, addDatabasePaneStartMessage);
    this.formErrors("");
    this.isExecuting(true);

    const createDatabaseParams: DataModels.CreateDatabaseParams = {
      autoPilotMaxThroughput: this.maxAutoPilotThroughputSet(),
      databaseId: addDatabasePaneStartMessage.database.id,
      databaseLevelThroughput: addDatabasePaneStartMessage.database.shared,
      offerThroughput: addDatabasePaneStartMessage.offerThroughput
    };

    createDatabase(createDatabaseParams).then(
      (database: DataModels.Database) => {
        this._onCreateDatabaseSuccess(offerThroughput, startKey);
      },
      (reason: any) => {
        this._onCreateDatabaseFailure(reason, offerThroughput, reason);
      }
    );
  }

  public resetData() {
    this.databaseId("");
    this.databaseCreateNewShared(this.getSharedThroughputDefault());
    this.selectedAutoPilotTier(undefined);
    this.isAutoPilotSelected(false);
    this.maxAutoPilotThroughputSet(AutoPilotUtils.minAutoPilotThroughput);
    this._updateThroughputLimitByDatabase();
    this.throughputSpendAck(false);
    super.resetData();
  }

  public getSharedThroughputDefault(): boolean {
    const subscriptionType: ViewModels.SubscriptionType =
      this.container.subscriptionType && this.container.subscriptionType();

    if (subscriptionType === ViewModels.SubscriptionType.EA) {
      return false;
    }

    return true;
  }

  private _onCreateDatabaseSuccess(offerThroughput: number, startKey: number): void {
    this.isExecuting(false);
    this.close();
    this.container.refreshAllDatabases();
    const addDatabasePaneSuccessMessage = {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      database: ko.toJS({
        id: this.databaseId(),
        shared: this.databaseCreateNewShared()
      }),
      offerThroughput: offerThroughput,
      subscriptionType: ViewModels.SubscriptionType[this.container.subscriptionType()],
      subscriptionQuotaId: this.container.quotaId(),
      defaultsCheck: {
        flight: this.container.flight()
      },
      dataExplorerArea: Constants.Areas.ContextualPane
    };
    TelemetryProcessor.traceSuccess(Action.CreateDatabase, addDatabasePaneSuccessMessage, startKey);
    this.resetData();
  }

  private _onCreateDatabaseFailure(reason: any, offerThroughput: number, startKey: number): void {
    this.isExecuting(false);
    const message = ErrorParserUtility.parse(reason);
    this.formErrors(message[0].message);
    this.formErrorsDetails(message[0].message);
    const addDatabasePaneFailedMessage = {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      database: ko.toJS({
        id: this.databaseId(),
        shared: this.databaseCreateNewShared()
      }),
      offerThroughput: offerThroughput,
      subscriptionType: ViewModels.SubscriptionType[this.container.subscriptionType()],
      subscriptionQuotaId: this.container.quotaId(),
      defaultsCheck: {
        flight: this.container.flight()
      },
      dataExplorerArea: Constants.Areas.ContextualPane,
      error: reason
    };
    TelemetryProcessor.traceFailure(Action.CreateDatabase, addDatabasePaneFailedMessage, startKey);
  }

  private _getThroughput(): number {
    const throughput: number = this.throughput();
    return isNaN(throughput) ? 0 : Number(throughput);
  }

  private _computeOfferThroughput(): number {
    if (!this.canConfigureThroughput()) {
      return undefined;
    }

    if (this.isAutoPilotSelected()) {
      return undefined;
    }

    return this._getThroughput();
  }

  private _isValid(): boolean {
    // TODO add feature flag that disables validation for customers with custom accounts
    if (this.isAutoPilotSelected()) {
      const autoPilot = this._isAutoPilotSelectedAndWhatTier();
      if (
        (!this.hasAutoPilotV2FeatureFlag() &&
          (!autoPilot ||
            !autoPilot.maxThroughput ||
            !AutoPilotUtils.isValidAutoPilotThroughput(autoPilot.maxThroughput))) ||
        (this.hasAutoPilotV2FeatureFlag() &&
          (!autoPilot || !autoPilot.autopilotTier || !AutoPilotUtils.isValidAutoPilotTier(autoPilot.autopilotTier)))
      ) {
        this.formErrors(
          !this.hasAutoPilotV2FeatureFlag()
            ? `Please enter a value greater than ${AutoPilotUtils.minAutoPilotThroughput} for autopilot throughput`
            : "Please select an Autopilot tier from the list."
        );
        return false;
      }
    }
    const throughput = this._getThroughput();

    if (throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K && !this.throughputSpendAck()) {
      this.formErrors(`Please acknowledge the estimated daily spend.`);
      return false;
    }

    const autoscaleThroughput = this.maxAutoPilotThroughputSet() * 1;

    if (
      !this.hasAutoPilotV2FeatureFlag() &&
      this.isAutoPilotSelected() &&
      autoscaleThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs100K &&
      !this.throughputSpendAck()
    ) {
      this.formErrors(`Please acknowledge the estimated monthly spend.`);
      return false;
    }

    return true;
  }

  private _isAutoPilotSelectedAndWhatTier(): DataModels.AutoPilotCreationSettings {
    if (
      (!this.hasAutoPilotV2FeatureFlag() && this.isAutoPilotSelected() && this.maxAutoPilotThroughputSet()) ||
      (this.hasAutoPilotV2FeatureFlag() && this.isAutoPilotSelected() && this.selectedAutoPilotTier())
    ) {
      return !this.hasAutoPilotV2FeatureFlag()
        ? {
            maxThroughput: this.maxAutoPilotThroughputSet() * 1
          }
        : { autopilotTier: this.selectedAutoPilotTier() };
    }
    return undefined;
  }

  private _updateThroughputLimitByDatabase() {
    const throughputDefaults = this.container.collectionCreationDefaults.throughput;
    this.throughput(throughputDefaults.shared);
    this.maxThroughputRU(throughputDefaults.unlimitedmax);
    this.minThroughputRU(throughputDefaults.unlimitedmin);
  }
}
