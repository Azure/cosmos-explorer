import * as ko from "knockout";
import Q from "q";
import DiscardIcon from "../../../images/discard.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import * as Constants from "../../Common/Constants";
import { updateOffer } from "../../Common/dataAccess/updateOffer";
import editable from "../../Common/EditableUtility";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { configContext, Platform } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import * as SharedConstants from "../../Shared/Constants";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import * as AutoPilotUtils from "../../Utils/AutoPilotUtils";
import * as PricingUtils from "../../Utils/PricingUtils";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import Explorer from "../Explorer";
import template from "./DatabaseSettingsTab.html";
import TabsBase from "./TabsBase";

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

const throughputApplyShortDelayMessage = (isAutoscale: boolean, throughput: number, databaseName: string) =>
  `A request to increase the throughput is currently in progress. 
  This operation will take some time to complete.<br />
  Database: ${databaseName}, ${currentThroughput(isAutoscale, throughput)}`;

const throughputApplyLongDelayMessage = (isAutoscale: boolean, throughput: number, databaseName: string) =>
  `A request to increase the throughput is currently in progress. 
  This operation will take 1-3 business days to complete. View the latest status in Notifications.<br />
  Database: ${databaseName}, ${currentThroughput(isAutoscale, throughput)}`;

export default class DatabaseSettingsTab extends TabsBase implements ViewModels.WaitsForTemplate {
  public static readonly component = { name: "database-settings-tab", template };
  // editables
  public isAutoPilotSelected: ViewModels.Editable<boolean>;
  public throughput: ViewModels.Editable<number>;
  public autoPilotThroughput: ViewModels.Editable<number>;
  public throughputIncreaseFactor: number = Constants.ClientDefaults.databaseThroughputIncreaseFactor;

  public saveSettingsButton: ViewModels.Button;
  public discardSettingsChangesButton: ViewModels.Button;

  public canRequestSupport: ko.PureComputed<boolean>;
  public canThroughputExceedMaximumValue: ko.Computed<boolean>;
  public costsVisible: ko.Computed<boolean>;
  public displayedError: ko.Observable<string>;
  public isFreeTierAccount: ko.Computed<boolean>;
  public isTemplateReady: ko.Observable<boolean>;
  public minRUAnotationVisible: ko.Computed<boolean>;
  public minRUs: ko.Observable<number>;
  public maxRUs: ko.Observable<number>;
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
  public autoPilotUsageCost: ko.PureComputed<string>;
  public warningMessage: ko.Computed<string>;
  public canExceedMaximumValue: ko.PureComputed<boolean>;
  public overrideWithAutoPilotSettings: ko.Computed<boolean>;
  public overrideWithProvisionedThroughputSettings: ko.Computed<boolean>;
  public testId: string;
  public throughputAutoPilotRadioId: string;
  public throughputProvisionedRadioId: string;
  public throughputModeRadioName: string;
  public freeTierExceedThroughputWarning: ko.Computed<string>;

  private _hasProvisioningTypeChanged: ko.Computed<boolean>;
  private _wasAutopilotOriginallySet: ko.Observable<boolean>;
  private _offerReplacePending: ko.Observable<boolean>;
  private container: Explorer;

  constructor(options: ViewModels.TabOptions) {
    super(options);

    this.container = options.node && (options.node as ViewModels.Database).container;
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

    const autoscaleMaxThroughput = this.database?.offer()?.autoscaleMaxThroughput;
    if (autoscaleMaxThroughput) {
      if (AutoPilotUtils.isValidAutoPilotThroughput(autoscaleMaxThroughput)) {
        this._wasAutopilotOriginallySet(true);
        this.isAutoPilotSelected(true);
        this.autoPilotThroughput(autoscaleMaxThroughput);
      }
    }

    this._hasProvisioningTypeChanged = ko.pureComputed<boolean>(() => {
      if (this._wasAutopilotOriginallySet() !== this.isAutoPilotSelected()) {
        return true;
      }
      return false;
    });

    this.autoPilotUsageCost = ko.pureComputed<string>(() => {
      const autoPilot = this.autoPilotThroughput();
      if (!autoPilot) {
        return "";
      }
      return PricingUtils.getAutoPilotV3SpendHtml(autoPilot, true /* isDatabaseThroughput */);
    });

    this.requestUnitsUsageCost = ko.pureComputed(() => {
      const account = userContext.databaseAccount;
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
      if (!this.isAutoPilotSelected()) {
        estimatedSpend = PricingUtils.getEstimatedSpendHtml(
          // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
          this.overrideWithAutoPilotSettings() ? this.autoPilotThroughput() : this.throughput(),
          userContext.portalEnv,
          regions,
          multimaster
        );
      } else {
        estimatedSpend = PricingUtils.getEstimatedAutoscaleSpendHtml(
          this.autoPilotThroughput(),
          userContext.portalEnv,
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
      return this._hasProvisioningTypeChanged() && this._wasAutopilotOriginallySet();
    });

    this.overrideWithProvisionedThroughputSettings = ko.pureComputed(() => {
      return this._hasProvisioningTypeChanged() && !this._wasAutopilotOriginallySet();
    });

    this.minRUs = ko.observable<number>(
      this.database.offer()?.minimumThroughput || this.container.collectionCreationDefaults.throughput.unlimitedmin
    );

    this.minRUAnotationVisible = ko.computed<boolean>(() => {
      return PricingUtils.isLargerThanDefaultMinRU(this.minRUs());
    });

    this.maxRUs = ko.observable<number>(this.container.collectionCreationDefaults.throughput.unlimitedmax);

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
        return AutoPilotUtils.getAutoPilotHeaderText();
      }

      return `Throughput (${this.minRUs().toLocaleString()} - unlimited RU/s)`;
    });

    this.throughputAriaLabel = ko.pureComputed<string>(() => {
      return this.throughputTitle() + this.requestUnitsUsageCost();
    });
    this.pendingNotification = ko.observable<DataModels.Notification>();
    this._offerReplacePending = ko.observable<boolean>(!!this.database.offer()?.offerReplacePending);
    this.notificationStatusInfo = ko.observable<string>("");
    this.shouldShowNotificationStatusPrompt = ko.computed<boolean>(() => this.notificationStatusInfo().length > 0);
    this.warningMessage = ko.computed<string>(() => {
      if (this.overrideWithProvisionedThroughputSettings()) {
        return AutoPilotUtils.manualToAutoscaleDisclaimer;
      }

      const offer = this.database.offer();
      if (offer?.offerReplacePending) {
        const throughput = offer.manualThroughput || offer.autoscaleMaxThroughput;
        return throughputApplyShortDelayMessage(this.isAutoPilotSelected(), throughput, this.database.id());
      }

      if (
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
          if (!AutoPilotUtils.isValidAutoPilotThroughput(this.autoPilotThroughput())) {
            return false;
          }
          if (this.isAutoPilotSelected.editableIsDirty()) {
            return true;
          }
          if (this.autoPilotThroughput.editableIsDirty()) {
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

          if (this.isAutoPilotSelected.editableIsDirty()) {
            return true;
          }
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
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
      }),
    };

    this.isTemplateReady = ko.observable<boolean>(false);

    this.isFreeTierAccount = ko.computed<boolean>(() => {
      const databaseAccount = userContext.databaseAccount;
      return databaseAccount?.properties?.enableFreeTier;
    });

    this.freeTierExceedThroughputWarning = ko.computed<string>(() =>
      this.isFreeTierAccount()
        ? "Billing will apply if you provision more than 400 RU/s of manual throughput, or if the resource scales beyond 400 RU/s with autoscale."
        : ""
    );

    this._buildCommandBarOptions();
  }

  public onSaveClick = async (): Promise<any> => {
    this.isExecutionError(false);

    this.isExecuting(true);

    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateSettings, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });

    try {
      const updateOfferParams: DataModels.UpdateOfferParams = {
        databaseId: this.database.id(),
        currentOffer: this.database.offer(),
        autopilotThroughput: this.isAutoPilotSelected() ? this.autoPilotThroughput() : undefined,
        manualThroughput: this.isAutoPilotSelected() ? undefined : this.throughput(),
      };

      if (this._hasProvisioningTypeChanged()) {
        if (this.isAutoPilotSelected()) {
          updateOfferParams.migrateToAutoPilot = true;
        } else {
          updateOfferParams.migrateToManual = true;
        }
      }

      const updatedOffer: DataModels.Offer = await updateOffer(updateOfferParams);
      this.database.offer(updatedOffer);
      this.database.offer.valueHasMutated();
      this._setBaseline();
      this._wasAutopilotOriginallySet(this.isAutoPilotSelected());
    } catch (error) {
      this.isExecutionError(true);
      console.error(error);
      const errorMessage = getErrorMessage(error);
      this.displayedError(errorMessage);
      TelemetryProcessor.traceFailure(
        Action.UpdateSettings,
        {
          databaseName: this.database && this.database.id(),

          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle(),
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
    } finally {
      this.isExecuting(false);
    }
  };

  public onRevertClick = (): Q.Promise<any> => {
    this.throughput.setBaseline(this.throughput.getEditableOriginalValue());
    this.isAutoPilotSelected.setBaseline(this.isAutoPilotSelected.getEditableOriginalValue());
    this.autoPilotThroughput.setBaseline(this.autoPilotThroughput.getEditableOriginalValue());

    return Q();
  };

  public async onActivate(): Promise<void> {
    super.onActivate();
    this.database.selectedSubnodeKind(ViewModels.CollectionTabKind.DatabaseSettings);
    await this.database.loadOffer();
  }

  private _setBaseline() {
    const offer = this.database && this.database.offer && this.database.offer();
    this.isAutoPilotSelected.setBaseline(AutoPilotUtils.isValidAutoPilotThroughput(offer.autoscaleMaxThroughput));
    this.autoPilotThroughput.setBaseline(offer.autoscaleMaxThroughput);
    this.throughput.setBaseline(offer.manualThroughput);
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
        disabled: !this.saveSettingsButton.enabled(),
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
        disabled: !this.discardSettingsChangesButton.enabled(),
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
        this.discardSettingsChangesButton.enabled,
      ])
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }
}
