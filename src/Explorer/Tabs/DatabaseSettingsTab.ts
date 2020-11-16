import * as AutoPilotUtils from "../../Utils/AutoPilotUtils";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ErrorParserUtility from "../../Common/ErrorParserUtility";
import * as ko from "knockout";
import * as PricingUtils from "../../Utils/PricingUtils";
import * as SharedConstants from "../../Shared/Constants";
import * as ViewModels from "../../Contracts/ViewModels";
import DiscardIcon from "../../../images/discard.svg";
import editable from "../../Common/EditableUtility";
import SaveIcon from "../../../images/save-cosmos.svg";
import TabsBase from "./TabsBase";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import Explorer from "../Explorer";
import { updateOffer } from "../../Common/dataAccess/updateOffer";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { userContext } from "../../UserContext";
import { updateOfferThroughputBeyondLimit } from "../../Common/dataAccess/updateOfferThroughputBeyondLimit";
import { configContext, Platform } from "../../ConfigContext";

const updateThroughputBeyondLimitWarningMessage: string = `
You are about to request an increase in throughput beyond the pre-allocated capacity.
The service will scale out and increase throughput for the selected database.
This operation will take 1-3 business days to complete. You can track the status of this request in Notifications.`;

const updateThroughputDelayedApplyWarningMessage: string = `
You are about to request an increase in throughput beyond the pre-allocated capacity.
This operation will take some time to complete.`;

const currentThroughput: (isAutoscale: boolean, throughput: number) => string = (isAutoscale, throughput) =>
  isAutoscale
    ? `Current autoscale throughput: ${Math.round(throughput / 10)} - ${throughput} RU/s`
    : `Current manual throughput: ${throughput} RU/s`;

const throughputApplyDelayedMessage = (isAutoscale: boolean, throughput: number, databaseName: string) =>
  `The request to increase the throughput has successfully been submitted.
  This operation will take 1-3 business days to complete. View the latest status in Notifications.<br />
  Database: ${databaseName}, ${currentThroughput(isAutoscale, throughput)}`;

const throughputApplyShortDelayMessage = (isAutoscale: boolean, throughput: number, databaseName: string) =>
  `A request to increase the throughput is currently in progress.
  This operation will take some time to complete.<br />
  Database: ${databaseName}, ${currentThroughput(isAutoscale, throughput)}`;

const throughputApplyLongDelayMessage = (isAutoscale: boolean, throughput: number, databaseName: string) =>
  `A request to increase the throughput is currently in progress.
  This operation will take 1-3 business days to complete. View the latest status in Notifications.<br />
  Database: ${databaseName}, ${currentThroughput(isAutoscale, throughput)}`;

export default class DatabaseSettingsTab extends TabsBase implements ViewModels.WaitsForTemplate {
  // editables
  public isAutoPilotSelected: ViewModels.Editable<boolean>;
  public throughput: ViewModels.Editable<number>;
  public selectedAutoPilotTier: ViewModels.Editable<DataModels.AutopilotTier>;
  public autoPilotThroughput: ViewModels.Editable<number>;
  public throughputIncreaseFactor: number = Constants.ClientDefaults.databaseThroughputIncreaseFactor;

  public saveSettingsButton: ViewModels.Button;
  public discardSettingsChangesButton: ViewModels.Button;

  public canRequestSupport: ko.PureComputed<boolean>;
  public canThroughputExceedMaximumValue: ko.Computed<boolean>;
  public costsVisible: ko.Computed<boolean>;
  public displayedError: ko.Observable<string>;
  public isTemplateReady: ko.Observable<boolean>;
  public minRUAnotationVisible: ko.Computed<boolean>;
  public minRUs: ko.Computed<number>;
  public maxRUs: ko.Computed<number>;
  public maxRUsText: ko.PureComputed<string>;
  public maxRUThroughputInputLimit: ko.Computed<number>;
  public notificationStatusInfo: ko.Observable<string>;
  public pendingNotification: ko.Observable<DataModels.Notification>;
  public requestUnitsUsageCost: ko.PureComputed<string>;
  public autoscaleCost: ko.PureComputed<string>;
  public shouldShowNotificationStatusPrompt: ko.Computed<boolean>;
  public shouldDisplayPortalUsePrompt: ko.Computed<boolean>;
  public shouldShowStatusBar: ko.Computed<boolean>;
  public throughputTitle: ko.PureComputed<string>;
  public throughputAriaLabel: ko.PureComputed<string>;
  public userCanChangeProvisioningTypes: ko.Observable<boolean>;
  public autoPilotTiersList: ko.ObservableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>;
  public autoPilotUsageCost: ko.PureComputed<string>;
  public warningMessage: ko.Computed<string>;
  public canExceedMaximumValue: ko.PureComputed<boolean>;
  public hasAutoPilotV2FeatureFlag: ko.PureComputed<boolean>;
  public overrideWithAutoPilotSettings: ko.Computed<boolean>;
  public overrideWithProvisionedThroughputSettings: ko.Computed<boolean>;
  public testId: string;
  public throughputAutoPilotRadioId: string;
  public throughputProvisionedRadioId: string;
  public throughputModeRadioName: string;

  private _hasProvisioningTypeChanged: ko.Computed<boolean>;
  private _wasAutopilotOriginallySet: ko.Observable<boolean>;
  private _offerReplacePending: ko.Computed<boolean>;
  private container: Explorer;

  constructor(options: ViewModels.TabOptions) {
    super(options);

    this.container = options.node && (options.node as ViewModels.Database).container;
    this.hasAutoPilotV2FeatureFlag = ko.pureComputed(() => this.container.hasAutoPilotV2FeatureFlag());
    this.selectedAutoPilotTier = editable.observable<DataModels.AutopilotTier>();
    this.autoPilotTiersList = ko.observableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>();
    this.canExceedMaximumValue = ko.pureComputed(() => this.container.canExceedMaximumValue());

    // html element ids
    this.testId = `scaleSettingThroughputValue${this.tabId}`;
    this.throughputAutoPilotRadioId = `editContainerThroughput-autoPilotRadio${this.tabId}`;
    this.throughputProvisionedRadioId = `editContainerThroughput-manualRadio${this.tabId}`;
    this.throughputModeRadioName = `throughputModeRadio${this.tabId}`;

    this.throughput = editable.observable<number>();
    this._wasAutopilotOriginallySet = ko.observable(false);
    this.isAutoPilotSelected = editable.observable(false);
    this.autoPilotThroughput = editable.observable<number>();
    const offer = this.database && this.database.offer && this.database.offer();
    const offerAutopilotSettings = offer && offer.content && offer.content.offerAutopilotSettings;
    this.userCanChangeProvisioningTypes = ko.observable(!!offerAutopilotSettings || !this.hasAutoPilotV2FeatureFlag());
    if (!this.hasAutoPilotV2FeatureFlag()) {
      if (offerAutopilotSettings && offerAutopilotSettings.maxThroughput) {
        if (AutoPilotUtils.isValidAutoPilotThroughput(offerAutopilotSettings.maxThroughput)) {
          this._wasAutopilotOriginallySet(true);
          this.isAutoPilotSelected(true);
          this.autoPilotThroughput(offerAutopilotSettings.maxThroughput);
        }
      }
    } else {
      if (offerAutopilotSettings && offerAutopilotSettings.tier) {
        if (AutoPilotUtils.isValidAutoPilotTier(offerAutopilotSettings.tier)) {
          this._wasAutopilotOriginallySet(true);
          this.isAutoPilotSelected(true);
          this.selectedAutoPilotTier(offerAutopilotSettings.tier);
          this.autoPilotTiersList(AutoPilotUtils.getAvailableAutoPilotTiersOptions(offerAutopilotSettings.tier));
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

    this.autoPilotUsageCost = ko.pureComputed<string>(() => {
      const autoPilot = !this.hasAutoPilotV2FeatureFlag() ? this.autoPilotThroughput() : this.selectedAutoPilotTier();
      if (!autoPilot) {
        return "";
      }
      return !this.hasAutoPilotV2FeatureFlag()
        ? PricingUtils.getAutoPilotV3SpendHtml(autoPilot, true /* isDatabaseThroughput */)
        : PricingUtils.getAutoPilotV2SpendHtml(autoPilot, true /* isDatabaseThroughput */);
    });

    this.requestUnitsUsageCost = ko.pureComputed(() => {
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

      let estimatedSpend: string;
      if (!this.isAutoPilotSelected()) {
        estimatedSpend = PricingUtils.getEstimatedSpendHtml(
          // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
          this.overrideWithAutoPilotSettings() ? this.autoPilotThroughput() : this.throughput(),
          serverId,
          regions,
          multimaster,
          false /*rupmEnabled*/
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

    this.costsVisible = ko.computed(() => {
      return configContext.platform !== Platform.Emulator;
    });

    this.shouldDisplayPortalUsePrompt = ko.pureComputed<boolean>(() => configContext.platform === Platform.Hosted);
    this.canThroughputExceedMaximumValue = ko.pureComputed<boolean>(
      () => configContext.platform === Platform.Portal && !this.container.isRunningOnNationalCloud()
    );
    this.canRequestSupport = ko.pureComputed(() => {
      if (
        configContext.platform === Platform.Emulator ||
        configContext.platform === Platform.Hosted ||
        this.canThroughputExceedMaximumValue()
      ) {
        return false;
      }

      return true;
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

    this.minRUs = ko.computed<number>(() => {
      const offerContent =
        this.database && this.database.offer && this.database.offer() && this.database.offer().content;

      // TODO: backend is returning 1,000,000 as min throughput which seems wrong
      // Setting to min throughput to not block and let the backend pass or fail
      if (offerContent && offerContent.offerAutopilotSettings) {
        return 400;
      }

      const collectionThroughputInfo: DataModels.OfferThroughputInfo =
        offerContent && offerContent.collectionThroughputInfo;

      if (collectionThroughputInfo && !!collectionThroughputInfo.minimumRUForCollection) {
        return collectionThroughputInfo.minimumRUForCollection;
      }
      const throughputDefaults = this.container.collectionCreationDefaults.throughput;
      return throughputDefaults.unlimitedmin;
    });

    this.minRUAnotationVisible = ko.computed<boolean>(() => {
      return PricingUtils.isLargerThanDefaultMinRU(this.minRUs());
    });

    this.maxRUs = ko.computed<number>(() => {
      const collectionThroughputInfo: DataModels.OfferThroughputInfo =
        this.database &&
        this.database.offer &&
        this.database.offer() &&
        this.database.offer().content &&
        this.database.offer().content.collectionThroughputInfo;
      const numPartitions = collectionThroughputInfo && collectionThroughputInfo.numPhysicalPartitions;
      if (!!numPartitions) {
        return SharedConstants.CollectionCreation.MaxRUPerPartition * numPartitions;
      }

      const throughputDefaults = this.container.collectionCreationDefaults.throughput;
      return throughputDefaults.unlimitedmax;
    });

    this.maxRUThroughputInputLimit = ko.pureComputed<number>(() => {
      if (configContext.platform === Platform.Hosted) {
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

      return `Throughput (${this.minRUs().toLocaleString()} - unlimited RU/s)`;
    });

    this.throughputAriaLabel = ko.pureComputed<string>(() => {
      return this.throughputTitle() + this.requestUnitsUsageCost();
    });
    this.pendingNotification = ko.observable<DataModels.Notification>();
    this._offerReplacePending = ko.pureComputed<boolean>(() => {
      const offer = this.database && this.database.offer && this.database.offer();
      return (
        offer &&
        offer.hasOwnProperty("headers") &&
        !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
      );
    });
    this.notificationStatusInfo = ko.observable<string>("");
    this.shouldShowNotificationStatusPrompt = ko.computed<boolean>(() => this.notificationStatusInfo().length > 0);
    this.warningMessage = ko.computed<string>(() => {
      const offer = this.database && this.database.offer && this.database.offer();

      if (!this.hasAutoPilotV2FeatureFlag() && this.overrideWithProvisionedThroughputSettings()) {
        return AutoPilotUtils.manualToAutoscaleDisclaimer;
      }

      if (
        offer &&
        offer.hasOwnProperty("headers") &&
        !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
      ) {
        const throughput = offer.content.offerAutopilotSettings
          ? !this.hasAutoPilotV2FeatureFlag()
            ? offer.content.offerAutopilotSettings.maxThroughput
            : offer.content.offerAutopilotSettings.maximumTierThroughput
          : offer.content.offerThroughput;

        return throughputApplyShortDelayMessage(this.isAutoPilotSelected(), throughput, this.database.id());
      }

      if (
        this.maxRUs() <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
        this.throughput() > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
        this.canThroughputExceedMaximumValue()
      ) {
        return updateThroughputBeyondLimitWarningMessage;
      }

      if (this.throughput() > this.maxRUs()) {
        return updateThroughputDelayedApplyWarningMessage;
      }

      if (this.pendingNotification()) {
        const matches: string[] = this.pendingNotification().description.match("Throughput update for (.*) RU/s");
        const throughput: number = matches.length > 1 && Number(matches[1]);

        if (throughput) {
          return throughputApplyLongDelayMessage(this.isAutoPilotSelected(), throughput, this.database.id());
        }
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

    this.displayedError = ko.observable<string>("");

    this._setBaseline();

    this.saveSettingsButton = {
      enabled: ko.computed<boolean>(() => {
        if (this._hasProvisioningTypeChanged()) {
          return true;
        }

        if (this._offerReplacePending && this._offerReplacePending()) {
          return false;
        }

        const isAutoPilot = this.isAutoPilotSelected();
        const isManual = !this.isAutoPilotSelected();
        if (isAutoPilot) {
          if (
            (!this.hasAutoPilotV2FeatureFlag() &&
              !AutoPilotUtils.isValidAutoPilotThroughput(this.autoPilotThroughput())) ||
            (this.hasAutoPilotV2FeatureFlag() && !AutoPilotUtils.isValidAutoPilotTier(this.selectedAutoPilotTier()))
          ) {
            return false;
          }
          if (this.isAutoPilotSelected.editableIsDirty()) {
            return true;
          }
          if (
            (!this.hasAutoPilotV2FeatureFlag() && this.autoPilotThroughput.editableIsDirty()) ||
            (this.hasAutoPilotV2FeatureFlag() && this.selectedAutoPilotTier.editableIsDirty())
          ) {
            return true;
          }
        }
        if (isManual) {
          if (!this.throughput()) {
            return false;
          }

          if (this.throughput() < this.minRUs()) {
            return false;
          }

          if (
            !this.canThroughputExceedMaximumValue() &&
            this.throughput() > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million
          ) {
            return false;
          }

          if (this.throughput.editableIsDirty()) {
            return true;
          }

          if (
            (!this.hasAutoPilotV2FeatureFlag() && this.isAutoPilotSelected.editableIsDirty()) ||
            (this.hasAutoPilotV2FeatureFlag() && this.selectedAutoPilotTier.editableIsDirty())
          ) {
            return true;
          }
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      })
    };

    this.discardSettingsChangesButton = {
      enabled: ko.computed<boolean>(() => {
        if (this.throughput.editableIsDirty()) {
          return true;
        }
        if (this.isAutoPilotSelected.editableIsDirty()) {
          return true;
        }
        if (this.autoPilotThroughput.editableIsDirty()) {
          return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      })
    };

    this.isTemplateReady = ko.observable<boolean>(false);

    this._buildCommandBarOptions();
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

    const headerOptions: RequestOptions = { initialHeaders: {} };

    try {
      if (this.isAutoPilotSelected()) {
        const updateOfferParams: DataModels.UpdateOfferParams = {
          databaseId: this.database.id(),
          currentOffer: this.database.offer(),
          autopilotThroughput: this.autoPilotThroughput(),
          manualThroughput: undefined,
          migrateToAutoPilot: this._hasProvisioningTypeChanged()
        };

        const updatedOffer: DataModels.Offer = await updateOffer(updateOfferParams);
        this.database.offer(updatedOffer);
        this.database.offer.valueHasMutated();
        this._wasAutopilotOriginallySet(this.isAutoPilotSelected());
      } else {
        if (this.throughput.editableIsDirty() || this.isAutoPilotSelected.editableIsDirty()) {
          const originalThroughputValue = this.throughput.getEditableOriginalValue();
          const newThroughput = this.throughput();

          if (
            this.canThroughputExceedMaximumValue() &&
            this.maxRUs() <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
            this.throughput() > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million
          ) {
            const requestPayload = {
              subscriptionId: userContext.subscriptionId,
              databaseAccountName: userContext.databaseAccount.name,
              resourceGroup: userContext.resourceGroup,
              databaseName: this.database.id(),
              throughput: newThroughput,
              offerIsRUPerMinuteThroughputEnabled: false
            };
            await updateOfferThroughputBeyondLimit(requestPayload);
            this.database.offer().content.offerThroughput = originalThroughputValue;
            this.throughput(originalThroughputValue);
            this.notificationStatusInfo(
              throughputApplyDelayedMessage(this.isAutoPilotSelected(), newThroughput, this.database.id())
            );
            this.throughput.valueHasMutated(); // force component re-render
          } else {
            const updateOfferParams: DataModels.UpdateOfferParams = {
              databaseId: this.database.id(),
              currentOffer: this.database.offer(),
              autopilotThroughput: undefined,
              manualThroughput: newThroughput,
              migrateToManual: this._hasProvisioningTypeChanged()
            };

            const updatedOffer = await updateOffer(updateOfferParams);
            this._wasAutopilotOriginallySet(this.isAutoPilotSelected());
            this.database.offer(updatedOffer);
            this.database.offer.valueHasMutated();
          }
        }
      }
    } catch (error) {
      this.container.isRefreshingExplorer(false);
      this.isExecutionError(true);
      console.error(error);
      this.displayedError(ErrorParserUtility.parse(error)[0].message);
      TelemetryProcessor.traceFailure(
        Action.UpdateSettings,
        {
          databaseAccountName: this.container.databaseAccount().name,
          databaseName: this.database && this.database.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle(),
          error: error
        },
        startKey
      );
    } finally {
      this.isExecuting(false);
    }
  };

  public onRevertClick = async (): Promise<any> => {
    this.throughput.setBaseline(this.throughput.getEditableOriginalValue());
    this.isAutoPilotSelected.setBaseline(this.isAutoPilotSelected.getEditableOriginalValue());
    if (!this.hasAutoPilotV2FeatureFlag()) {
      this.autoPilotThroughput.setBaseline(this.autoPilotThroughput.getEditableOriginalValue());
    } else {
      this.selectedAutoPilotTier.setBaseline(this.selectedAutoPilotTier.getEditableOriginalValue());
    }
  };

  public onActivate(): Promise<any> {
    return super.onActivate().then(async () => {
      this.database.selectedSubnodeKind(ViewModels.CollectionTabKind.DatabaseSettings);
      await this.database.loadOffer();
    });
  }

  private _setBaseline() {
    const offer = this.database && this.database.offer && this.database.offer();
    const offerThroughput = offer.content && offer.content.offerThroughput;
    const offerAutopilotSettings = offer && offer.content && offer.content.offerAutopilotSettings;

    this.throughput.setBaseline(offerThroughput);
    this.userCanChangeProvisioningTypes(!!offerAutopilotSettings || !this.hasAutoPilotV2FeatureFlag());

    if (this.hasAutoPilotV2FeatureFlag()) {
      const selectedAutoPilotTier = offerAutopilotSettings && offerAutopilotSettings.tier;
      this.isAutoPilotSelected.setBaseline(AutoPilotUtils.isValidAutoPilotTier(selectedAutoPilotTier));
      this.selectedAutoPilotTier.setBaseline(selectedAutoPilotTier);
    } else {
      const maxThroughputForAutoPilot = offerAutopilotSettings && offerAutopilotSettings.maxThroughput;
      this.isAutoPilotSelected.setBaseline(AutoPilotUtils.isValidAutoPilotThroughput(maxThroughputForAutoPilot));
      this.autoPilotThroughput.setBaseline(maxThroughputForAutoPilot || AutoPilotUtils.minAutoPilotThroughput);
    }
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    const label = "Save";
    if (this.saveSettingsButton.visible()) {
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
