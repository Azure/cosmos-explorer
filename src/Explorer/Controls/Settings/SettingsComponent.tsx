import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as monaco from "monaco-editor";
import * as SharedConstants from "../../../Shared/Constants";
import * as ViewModels from "../../../Contracts/ViewModels";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import InfoColor from "../../../../images/info_color.svg";
import Warning from "../../../../images/warning.svg";
import TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import Explorer from "../../Explorer";
import { updateOffer } from "../../../Common/DocumentClientUtilityBase";
import { updateCollection } from "../../../Common/dataAccess/updateCollection";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import { userContext } from "../../../UserContext";
import { updateOfferThroughputBeyondLimit } from "../../../Common/dataAccess/updateOfferThroughputBeyondLimit";
import SettingsTab from "../../Tabs/SettingsTabV2";
import {
  manualToAutoscaleDisclaimerElement,
  ttlWarning,
  indexingPolicyTTLWarningMessage,
  updateThroughputBeyondLimitWarningMessage,
  updateThroughputDelayedApplyWarningMessage,
  getThroughputApplyDelayedMessage,
  getThroughputApplyShortDelayMessage,
  getThroughputApplyLongDelayMessage
} from "./SettingsRenderUtils";
import { StatefulValue } from "../StatefulValue";
import { ScaleComponent } from "./SettingsSubComponents/ScaleComponent";
import {
  getMaxRUs,
  getMinRUs,
  hasDatabaseSharedThroughput,
  canThroughputExceedMaximumValue,
  GeospatialConfigType,
  TtlType,
  ChangeFeedPolicyToggledState
} from "./SettingsUtils";
import { ConflictResolutionComponent } from "./SettingsSubComponents/ConflictResolutionComponent";
import { SubSettingsComponent } from "./SettingsSubComponents/SubSettingsComponent";

type StatefulValuesType = boolean | string | number | DataModels.IndexingPolicy;

interface ButtonV2 {
  isVisible: () => boolean;
  isEnabled: () => boolean;
  isSelected?: () => boolean;
}

enum StatefulValueNames {
  Throughput = "throughput",
  TimeToLive = "timeToLive",
  TimeToLiveSeconds = "timeToLiveSeconds",
  GeospatialConfigType = "geospatialConfigType",
  IndexingPolicyContent = "indexingPolicyContent",
  Rupm = "rupm",
  ConflictResolutionPolicyMode = "conflictResolutionPolicyMode",
  ConflictResolutionPolicyPath = "conflictResolutionPolicyPath",
  ConflictResolutionPolicyProcedure = "conflictResolutionPolicyProcedure",
  AnalyticalStorageTtlSelection = "analyticalStorageTtlSelection",
  AnalyticalStorageTtlSeconds = "analyticalStorageTtlSeconds",
  ChangeFeedPolicyToggled = "changeFeedPolicyToggled",
  AutoPilotThroughput = "autoPilotThroughput"
}

interface UpdateStatefulValueParams {
  key: keyof SettingsComponentState;
  value: StatefulValuesType;
  updateBaseline?: boolean;
}

export interface SettingsComponentProps {
  settingsTab: SettingsTab;
}

interface SettingsComponentState {
  throughput: StatefulValue<number>;
  timeToLive: StatefulValue<TtlType>;
  timeToLiveSeconds: StatefulValue<number>;
  geospatialConfigType: StatefulValue<GeospatialConfigType>;
  indexingPolicyContent: StatefulValue<DataModels.IndexingPolicy>;
  rupm: StatefulValue<string>;
  conflictResolutionPolicyMode: StatefulValue<DataModels.ConflictResolutionMode>;
  conflictResolutionPolicyPath: StatefulValue<string>;
  conflictResolutionPolicyProcedure: StatefulValue<string>;
  analyticalStorageTtlSelection: StatefulValue<TtlType>;
  analyticalStorageTtlSeconds: StatefulValue<number>;
  changeFeedPolicyToggled: StatefulValue<ChangeFeedPolicyToggledState>;
  isIndexingPolicyEditorInitializing: boolean;
  indexingPolicyElementFocused: boolean;
  notificationStatusInfo: JSX.Element;
  ttlOffFocused: boolean;
  ttlOnDefaultFocused: boolean;
  ttlOnFocused: boolean;
  userCanChangeProvisioningTypes: boolean;
  selectedAutoPilotTier: DataModels.AutopilotTier;
  isAutoPilotSelected: boolean;
  autoPilotThroughput: StatefulValue<number>;
  wasAutopilotOriginallySet: boolean;
}

export class SettingsComponent extends React.Component<SettingsComponentProps, SettingsComponentState> {
  private static readonly sixMonthsInSeconds = 15768000;

  public saveSettingsButton: ButtonV2;
  public discardSettingsChangesButton: ButtonV2;

  public isAnalyticalStorageEnabled: boolean;
  public testId: string;
  private collection: ViewModels.Collection;
  private container: Explorer;
  private indexingPolicyEditor: monaco.editor.IStandaloneCodeEditor;
  private indexingPolicyDiv = React.createRef<HTMLDivElement>();
  private initialChangeFeedLoggingState: ChangeFeedPolicyToggledState;
  private hasAutoPilotV2FeatureFlag: boolean;
  private changeFeedPolicyVisible: boolean;
  private isFixedContainer: boolean;
  private tabId: string;
  private statefulValuesArray = Object.values(StatefulValueNames) as string[];
  private autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];

  constructor(props: SettingsComponentProps) {
    super(props);

    this.tabId = this.props.settingsTab.getTabId();
    this.collection = this.props.settingsTab.collection as ViewModels.Collection;
    this.container = this.collection && this.collection.container;
    this.testId = `settingsThroughputValue${this.tabId}`;
    this.isAnalyticalStorageEnabled = this.collection && !!this.collection.analyticalStorageTtl();

    this.initialChangeFeedLoggingState = this.collection.rawDataModel?.changeFeedPolicy
      ? ChangeFeedPolicyToggledState.On
      : ChangeFeedPolicyToggledState.Off;

    this.hasAutoPilotV2FeatureFlag = this.container.hasAutoPilotV2FeatureFlag();
    this.changeFeedPolicyVisible =
      this.collection && this.collection.container.isFeatureEnabled(Constants.Features.enableChangeFeedPolicy);
    // Mongo container with system partition key still treat as "Fixed"

    this.isFixedContainer =
      !this.collection.partitionKey ||
      (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey);

    this.state = {
      isIndexingPolicyEditorInitializing: false,
      changeFeedPolicyToggled: new StatefulValue(this.initialChangeFeedLoggingState),
      throughput: new StatefulValue(),
      conflictResolutionPolicyMode: new StatefulValue(),
      conflictResolutionPolicyPath: new StatefulValue(),
      conflictResolutionPolicyProcedure: new StatefulValue(),
      timeToLive: new StatefulValue(),
      timeToLiveSeconds: new StatefulValue(),
      geospatialConfigType: new StatefulValue(),
      analyticalStorageTtlSelection: new StatefulValue(),
      analyticalStorageTtlSeconds: new StatefulValue(),
      indexingPolicyContent: new StatefulValue(),
      rupm: new StatefulValue(),
      isAutoPilotSelected: false,
      wasAutopilotOriginallySet: false,
      selectedAutoPilotTier: undefined,
      autoPilotThroughput: new StatefulValue(AutoPilotUtils.minAutoPilotThroughput),
      ttlOffFocused: false,
      ttlOnDefaultFocused: false,
      ttlOnFocused: false,
      indexingPolicyElementFocused: false,
      notificationStatusInfo: undefined,
      userCanChangeProvisioningTypes: undefined
    };

    this.saveSettingsButton = {
      isEnabled: () => {
        // TODO: move validations to editables and display validation errors
        if (this.isOfferReplacePending()) {
          return false;
        }

        const isCollectionThroughput = !hasDatabaseSharedThroughput(this.collection);
        if (isCollectionThroughput) {
          if (this.hasProvisioningTypeChanged()) {
            return true;
          } else if (this.state.isAutoPilotSelected) {
            const validAutopilotChange =
              (!this.hasAutoPilotV2FeatureFlag &&
                this.isAutoPilotDirty() &&
                AutoPilotUtils.isValidAutoPilotThroughput(this.state.autoPilotThroughput.current)) ||
              (this.hasAutoPilotV2FeatureFlag &&
                this.isAutoPilotDirty() &&
                AutoPilotUtils.isValidAutoPilotTier(this.state.selectedAutoPilotTier));
            if (validAutopilotChange) {
              return true;
            }
          } else {
            const isMissingThroughput = !this.state.throughput.current;
            if (isMissingThroughput) {
              return false;
            }

            const isThroughputLessThanMinRus =
              this.state.throughput.current < getMinRUs(this.collection, this.container);
            if (isThroughputLessThanMinRus) {
              return false;
            }

            const isThroughputGreaterThanMaxRus =
              this.state.throughput.current > getMaxRUs(this.collection, this.container);
            const isEmulator = this.container.isEmulator;
            if (isThroughputGreaterThanMaxRus && isEmulator) {
              return false;
            }

            if (isThroughputGreaterThanMaxRus && this.isFixedContainer) {
              return false;
            }

            const isThroughputMoreThan1Million =
              this.state.throughput.current > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
            if (!canThroughputExceedMaximumValue(this.collection, this.container) && isThroughputMoreThan1Million) {
              return false;
            }

            if (this.state.throughput.isDirty()) {
              return true;
            }
          }
        }

        if (
          this.hasConflictResolution() &&
          (this.state.conflictResolutionPolicyMode.isDirty() ||
            this.state.conflictResolutionPolicyPath.isDirty() ||
            this.state.conflictResolutionPolicyProcedure.isDirty())
        ) {
          return true;
        }

        if (this.state.timeToLive.current === TtlType.On && !this.state.timeToLiveSeconds.current) {
          return false;
        }

        if (
          this.state.analyticalStorageTtlSelection.current === TtlType.On &&
          !this.state.analyticalStorageTtlSeconds
        ) {
          return false;
        }

        if (
          this.state.rupm.current === Constants.RUPMStates.on &&
          this.state.throughput.current >
            SharedConstants.CollectionCreation.MaxRUPMPerPartition * this.collection.quotaInfo().numPartitions
        ) {
          return false;
        }

        if (this.state.timeToLive.isDirty()) {
          return true;
        }

        if (this.state.geospatialConfigType.isDirty()) {
          return true;
        }

        if (this.state.analyticalStorageTtlSelection.isDirty()) {
          return true;
        }

        if (this.state.changeFeedPolicyToggled.isDirty()) {
          return true;
        }

        if (this.state.timeToLive.current === TtlType.On && this.state.timeToLiveSeconds.isDirty()) {
          return true;
        }

        if (
          this.state.analyticalStorageTtlSelection.current === TtlType.On &&
          this.state.analyticalStorageTtlSeconds.isDirty()
        ) {
          return true;
        }

        if (this.state.indexingPolicyContent.isDirty() && this.state.indexingPolicyContent.isValid) {
          return true;
        }

        if (this.state.rupm.isDirty()) {
          return true;
        }

        return false;
      },

      isVisible: () => {
        return true;
      }
    };

    this.discardSettingsChangesButton = {
      isEnabled: () => {
        if (this.hasProvisioningTypeChanged()) {
          return true;
        }
        if (this.state.isAutoPilotSelected && this.isAutoPilotDirty()) {
          return true;
        }

        if (this.state.throughput.isDirty()) {
          return true;
        }

        if (this.state.timeToLive.isDirty()) {
          return true;
        }

        if (this.state.geospatialConfigType.isDirty()) {
          return true;
        }

        if (this.state.analyticalStorageTtlSelection.isDirty()) {
          return true;
        }

        if (this.state.timeToLive.current === TtlType.On && this.state.timeToLiveSeconds.isDirty()) {
          return true;
        }

        if (
          this.state.analyticalStorageTtlSelection.current === TtlType.On &&
          this.state.analyticalStorageTtlSeconds.isDirty()
        ) {
          return true;
        }

        if (this.state.changeFeedPolicyToggled.isDirty()) {
          return true;
        }

        if (this.state.indexingPolicyContent.isDirty()) {
          return true;
        }

        if (this.state.rupm.isDirty()) {
          return true;
        }

        if (
          this.state.conflictResolutionPolicyMode.isDirty() ||
          this.state.conflictResolutionPolicyPath.isDirty() ||
          this.state.conflictResolutionPolicyProcedure.isDirty()
        ) {
          return true;
        }

        return false;
      },

      isVisible: () => {
        return true;
      }
    };
  }

  private updateStatefulValue = (params: UpdateStatefulValueParams): void => {
    const currentStateValue = this.state[params.key] as StatefulValue<StatefulValuesType>;
    currentStateValue.current = params.value;
    if (params.updateBaseline) {
      currentStateValue.baseline = params.value;
    }

    const stateObject = (): unknown => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const returnObj: any = {};
      returnObj[params.key] = currentStateValue as StatefulValue<StatefulValuesType>;
      return returnObj;
    };
    this.setState(stateObject);
  };

  componentDidMount(): void {
    this.setAutoPilotStates();
    this.setBaseline();
    if (this.props.settingsTab.isActive()) {
      this.props.settingsTab.getSettingsTabContainer().onUpdateTabsButtons(this.getTabsButtons());
    }
    if (!!this.getWarningMessage() && !!this.state.notificationStatusInfo) {
      this.setState({ notificationStatusInfo: undefined });
    }
  }

  componentDidUpdate(): void {
    if (this.props.settingsTab.isActive()) {
      this.props.settingsTab.getSettingsTabContainer().onUpdateTabsButtons(this.getTabsButtons());
    }

    if (!!this.getWarningMessage() && !!this.state.notificationStatusInfo) {
      this.setState({ notificationStatusInfo: undefined });
    }
  }

  private shouldUpdateCollection = (): boolean => {
    return (
      this.state.timeToLive.isDirty() ||
      (this.state.timeToLive.current === TtlType.On && this.state.timeToLiveSeconds.isDirty()) ||
      this.state.geospatialConfigType.isDirty() ||
      this.state.conflictResolutionPolicyMode.isDirty() ||
      this.state.conflictResolutionPolicyPath.isDirty() ||
      this.state.conflictResolutionPolicyProcedure.isDirty() ||
      this.state.indexingPolicyContent.isDirty() ||
      this.state.changeFeedPolicyToggled.isDirty() ||
      this.state.analyticalStorageTtlSelection.isDirty() ||
      (this.state.analyticalStorageTtlSelection.current === TtlType.On &&
        this.state.analyticalStorageTtlSeconds.isDirty())
    );
  };

  private setAutoPilotStates = (): void => {
    const offer = this.collection && this.collection.offer && this.collection.offer();
    const offerAutopilotSettings = offer && offer.content && offer.content.offerAutopilotSettings;

    this.setState({
      userCanChangeProvisioningTypes: !!offerAutopilotSettings || !this.hasAutoPilotV2FeatureFlag
    });

    if (!this.hasAutoPilotV2FeatureFlag) {
      if (offerAutopilotSettings && offerAutopilotSettings.maxThroughput) {
        if (AutoPilotUtils.isValidAutoPilotThroughput(offerAutopilotSettings.maxThroughput)) {
          this.setState({
            isAutoPilotSelected: true,
            wasAutopilotOriginallySet: true
          });
          this.updateStatefulValue({
            key: StatefulValueNames.AutoPilotThroughput,
            value: offerAutopilotSettings.maxThroughput,
            updateBaseline: true
          });
        }
      }
    } else {
      if (offerAutopilotSettings && offerAutopilotSettings.tier) {
        if (AutoPilotUtils.isValidAutoPilotTier(offerAutopilotSettings.tier)) {
          const availableAutoPilotTiers = AutoPilotUtils.getAvailableAutoPilotTiersOptions(offerAutopilotSettings.tier);
          this.autoPilotTiersList = availableAutoPilotTiers;
          this.setState({
            isAutoPilotSelected: true,
            wasAutopilotOriginallySet: true,
            selectedAutoPilotTier: offerAutopilotSettings.tier
          });
        }
      }
    }
  };

  private hasProvisioningTypeChanged = (): boolean => {
    if (!this.state.userCanChangeProvisioningTypes) {
      return false;
    }
    if (this.state.wasAutopilotOriginallySet !== this.state.isAutoPilotSelected) {
      return true;
    }
    return false;
  };

  private overrideWithProvisionedThroughputSettings = (): boolean => {
    if (this.hasAutoPilotV2FeatureFlag) {
      return false;
    }
    return this.hasProvisioningTypeChanged() && !this.state.wasAutopilotOriginallySet;
  };

  private isAutoPilotDirty = (): boolean => {
    if (!this.state.isAutoPilotSelected) {
      return false;
    }
    const originalAutoPilotSettings = this.collection?.offer()?.content?.offerAutopilotSettings;
    if (!originalAutoPilotSettings) {
      return false;
    }
    const originalAutoPilotSetting = !this.hasAutoPilotV2FeatureFlag
      ? originalAutoPilotSettings?.maxThroughput
      : originalAutoPilotSettings?.tier;
    if (
      (!this.hasAutoPilotV2FeatureFlag && this.state.autoPilotThroughput.current !== originalAutoPilotSetting) ||
      (this.hasAutoPilotV2FeatureFlag && this.state.selectedAutoPilotTier !== originalAutoPilotSetting)
    ) {
      return true;
    }
    return false;
  };

  private shouldShowKeyspaceSharedThroughputMessage = (): boolean => {
    return this.container && this.container.isPreferredApiCassandra() && hasDatabaseSharedThroughput(this.collection);
  };

  private hasConflictResolution = (): boolean => {
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
  };

  private isOfferReplacePending = (): boolean => {
    const offer = this.collection && this.collection.offer && this.collection.offer();
    return (
      offer &&
      Object.keys(offer).find(value => {
        return value === "headers";
      }) &&
      !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
    );
  };

  private getWarningMessage = (): JSX.Element => {
    const throughputExceedsBackendLimits: boolean =
      canThroughputExceedMaximumValue(this.collection, this.container) &&
      getMaxRUs(this.collection, this.container) <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
      this.state.throughput.current > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;

    const throughputExceedsMaxValue: boolean =
      !this.container.isEmulator && this.state.throughput.current > getMaxRUs(this.collection, this.container);

    const ttlOptionDirty: boolean = this.state.timeToLive.isDirty();
    const ttlOrIndexingPolicyFieldsDirty: boolean =
      this.state.timeToLive.isDirty() ||
      this.state.indexingPolicyContent.isDirty() ||
      this.state.timeToLiveSeconds.isDirty();
    const ttlFieldFocused: boolean =
      this.state.ttlOffFocused || this.state.ttlOnDefaultFocused || this.state.ttlOnFocused;
    const offer = this.collection && this.collection.offer && this.collection.offer();

    if (ttlOptionDirty && this.state.timeToLive.current === TtlType.On) {
      return ttlWarning;
    }

    if (
      offer &&
      Object.keys(offer).find(value => {
        return value === "headers";
      }) &&
      !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
    ) {
      if (AutoPilotUtils.isValidV2AutoPilotOffer(offer)) {
        return <span>Tier upgrade will take some time to complete.</span>;
      }

      let throughput: number;
      if (offer.content.offerAutopilotSettings) {
        if (!this.hasAutoPilotV2FeatureFlag) {
          throughput = offer.content.offerAutopilotSettings.maxThroughput;
        } else {
          throughput = offer.content.offerAutopilotSettings.maximumTierThroughput;
        }
      }

      const targetThroughput =
        offer &&
        offer.content &&
        ((offer.content.offerAutopilotSettings && offer.content.offerAutopilotSettings.targetMaxThroughput) ||
          offer.content.offerThroughput);

      return getThroughputApplyShortDelayMessage(
        this.state.isAutoPilotSelected,
        throughput,
        this.getThroughputUnit(),
        this.collection.databaseId,
        this.collection.id(),
        targetThroughput
      );
    }

    if (!this.hasAutoPilotV2FeatureFlag && this.overrideWithProvisionedThroughputSettings()) {
      return manualToAutoscaleDisclaimerElement;
    }

    if (
      throughputExceedsBackendLimits &&
      !!this.collection.partitionKey &&
      !this.isFixedContainer &&
      !ttlFieldFocused &&
      !this.state.indexingPolicyElementFocused
    ) {
      return updateThroughputBeyondLimitWarningMessage;
    }

    if (
      throughputExceedsMaxValue &&
      !!this.collection.partitionKey &&
      !this.isFixedContainer &&
      !ttlFieldFocused &&
      !this.state.indexingPolicyElementFocused
    ) {
      return updateThroughputDelayedApplyWarningMessage;
    }

    if (this.props.settingsTab.pendingNotification()) {
      const throughputUnit: string = this.getThroughputUnit();
      const matches: string[] = this.props.settingsTab
        .pendingNotification()
        .description.match(`Throughput update for (.*) ${throughputUnit}`);

      const throughput = this.state.throughput.baseline;
      const targetThroughput: number = matches.length > 1 && Number(matches[1]);
      if (targetThroughput) {
        return getThroughputApplyLongDelayMessage(
          this.state.isAutoPilotSelected,
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

    return undefined;
  };

  private shouldShowNotificationStatusPrompt = (): boolean => !!this.state.notificationStatusInfo;

  private shouldShowStatusBar = (): boolean => {
    return this.shouldShowNotificationStatusPrompt() || !!this.getWarningMessage();
  };

  private onSaveClick = async (): Promise<void> => {
    this.props.settingsTab.isExecutionError(false);

    this.props.settingsTab.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateSettings, {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.settingsTab.tabTitle()
    });

    const newCollection: DataModels.Collection = { ...this.collection.rawDataModel };

    try {
      if (this.shouldUpdateCollection()) {
        let defaultTtl: number;
        switch (this.state.timeToLive.current) {
          case TtlType.On:
            defaultTtl = Number(this.state.timeToLiveSeconds.current);
            break;
          case TtlType.OnNoDefault:
            defaultTtl = -1;
            break;
          case TtlType.Off:
          default:
            defaultTtl = undefined;
            break;
        }

        newCollection.defaultTtl = defaultTtl;

        newCollection.indexingPolicy = this.state.indexingPolicyContent.current;

        newCollection.changeFeedPolicy =
          this.changeFeedPolicyVisible && this.state.changeFeedPolicyToggled.current === ChangeFeedPolicyToggledState.On
            ? ({
                retentionDuration: Constants.BackendDefaults.maxChangeFeedRetentionDuration
              } as DataModels.ChangeFeedPolicy)
            : undefined;

        newCollection.analyticalStorageTtl = this.getAnalyticalStorageTtl();

        newCollection.geospatialConfig = {
          type: this.state.geospatialConfigType.current
        };

        const conflictResolutionChanges: DataModels.ConflictResolutionPolicy = this.getUpdatedConflictResolutionPolicy();
        if (conflictResolutionChanges) {
          newCollection.conflictResolutionPolicy = conflictResolutionChanges;
        }

        const updatedCollection: DataModels.Collection = await updateCollection(
          this.collection.databaseId,
          this.collection.id(),
          newCollection
        );
        this.collection.rawDataModel = updatedCollection;
        this.collection.defaultTtl(updatedCollection.defaultTtl);
        this.collection.analyticalStorageTtl(updatedCollection.analyticalStorageTtl);
        this.collection.id(updatedCollection.id);
        this.collection.indexingPolicy(updatedCollection.indexingPolicy);
        this.collection.conflictResolutionPolicy(updatedCollection.conflictResolutionPolicy);
        this.collection.changeFeedPolicy(updatedCollection.changeFeedPolicy);
        this.collection.geospatialConfig(updatedCollection.geospatialConfig);
      }

      if (
        this.state.throughput.isDirty() ||
        this.state.rupm.isDirty() ||
        this.isAutoPilotDirty() ||
        this.hasProvisioningTypeChanged()
      ) {
        const newThroughput = this.state.throughput.current;
        const isRUPerMinuteThroughputEnabled: boolean = this.state.rupm.current === Constants.RUPMStates.on;
        let newOffer: DataModels.Offer = { ...this.collection.offer() };
        const originalThroughputValue: number = this.state.throughput.baseline;

        if (newOffer.content) {
          newOffer.content.offerThroughput = newThroughput;
          newOffer.content.offerIsRUPerMinuteThroughputEnabled = isRUPerMinuteThroughputEnabled;
        } else {
          newOffer = {
            ...newOffer,
            ...{
              content: {
                offerThroughput: newThroughput,
                offerIsRUPerMinuteThroughputEnabled: isRUPerMinuteThroughputEnabled
              }
            }
          };
        }

        const headerOptions: RequestOptions = { initialHeaders: {} };

        if (this.state.isAutoPilotSelected) {
          if (!this.hasAutoPilotV2FeatureFlag) {
            newOffer.content.offerAutopilotSettings = {
              maxThroughput: this.state.autoPilotThroughput.current
            };
          } else {
            newOffer.content.offerAutopilotSettings = {
              tier: this.state.selectedAutoPilotTier
            };
          }

          // user has changed from provisioned --> autoscale
          if (!this.hasAutoPilotV2FeatureFlag && this.hasProvisioningTypeChanged()) {
            headerOptions.initialHeaders[Constants.HttpHeaders.migrateOfferToAutopilot] = "true";
            delete newOffer.content.offerAutopilotSettings;
          } else {
            delete newOffer.content.offerThroughput;
          }
        } else {
          this.setState({
            isAutoPilotSelected: false,
            userCanChangeProvisioningTypes: false || !this.hasAutoPilotV2FeatureFlag
          });

          // user has changed from autoscale --> provisioned
          if (!this.hasAutoPilotV2FeatureFlag && this.hasProvisioningTypeChanged()) {
            headerOptions.initialHeaders[Constants.HttpHeaders.migrateOfferToManualThroughput] = "true";
          } else {
            delete newOffer.content.offerAutopilotSettings;
          }
        }

        if (
          getMaxRUs(this.collection, this.container) <=
            SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
          newThroughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
          this.container !== undefined
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
          try {
            await updateOfferThroughputBeyondLimit(requestPayload);
            this.collection.offer().content.offerThroughput = originalThroughputValue;

            this.updateStatefulValue({
              key: StatefulValueNames.Throughput,
              value: originalThroughputValue,
              updateBaseline: true
            });

            this.setState({
              notificationStatusInfo: getThroughputApplyDelayedMessage(
                this.state.isAutoPilotSelected,
                originalThroughputValue,
                this.getThroughputUnit(),
                this.collection.databaseId,
                this.collection.id(),
                newThroughput
              )
            });
          } catch (error) {
            TelemetryProcessor.traceFailure(
              Action.UpdateSettings,
              {
                databaseAccountName: this.container.databaseAccount().name,
                databaseName: this.collection && this.collection.databaseId,
                collectionName: this.collection && this.collection.id(),
                defaultExperience: this.container.defaultExperience(),
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.props.settingsTab.tabTitle(),
                error: error
              },
              startKey
            );
            throw error;
          }
        } else {
          const updatedOffer: DataModels.Offer = await updateOffer(this.collection.offer(), newOffer, headerOptions);
          this.collection.offer(updatedOffer);
          this.collection.offer.valueHasMutated();
        }
      }
      this.container.isRefreshingExplorer(false);
      this.setBaseline();
      this.collection.readSettings();
      this.setState({ wasAutopilotOriginallySet: this.state.isAutoPilotSelected });
      TelemetryProcessor.traceSuccess(
        Action.UpdateSettings,
        {
          databaseAccountName: this.container.databaseAccount().name,
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle()
        },
        startKey
      );
    } catch (reason) {
      this.container.isRefreshingExplorer(false);
      this.props.settingsTab.isExecutionError(true);
      console.error(reason);
      TelemetryProcessor.traceFailure(
        Action.UpdateSettings,
        {
          databaseAccountName: this.container.databaseAccount().name,
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle()
        },
        startKey
      );
    }
    this.props.settingsTab.isExecuting(false);
  };

  private onRevertClick = (): void => {
    this.statefulValuesArray.forEach((key: keyof SettingsComponentState) => {
      const stateElement = this.state[key] as StatefulValue<StatefulValuesType>;
      this.updateStatefulValue({
        key: key,
        value: stateElement.baseline
      });
    });

    const value = this.state.indexingPolicyContent.baseline;
    const indexingPolicyEditor = this.indexingPolicyEditor;
    if (indexingPolicyEditor) {
      const indexingPolicyEditorModel = indexingPolicyEditor.getModel();
      indexingPolicyEditorModel.setValue(JSON.stringify(value, undefined, 4));
    }

    if (this.state.userCanChangeProvisioningTypes) {
      this.setState({ isAutoPilotSelected: this.state.wasAutopilotOriginallySet });
    }

    if (this.state.isAutoPilotSelected) {
      const originalAutoPilotSettings = this.collection.offer().content.offerAutopilotSettings;
      if (!this.hasAutoPilotV2FeatureFlag) {
        const originalAutoPilotMaxThroughput = originalAutoPilotSettings && originalAutoPilotSettings.maxThroughput;
        this.updateStatefulValue({
          key: StatefulValueNames.AutoPilotThroughput,
          value: originalAutoPilotMaxThroughput,
          updateBaseline: true
        });
      } else {
        const originalAutoPilotTier = originalAutoPilotSettings && originalAutoPilotSettings.tier;
        this.setState({ selectedAutoPilotTier: originalAutoPilotTier });
      }
    }
  };

  private onValidIndexingPolicyEdit = (): void => {
    const indexingPolicyContent = this.state.indexingPolicyContent;
    indexingPolicyContent.isValid = true;
    this.setState({ indexingPolicyContent: indexingPolicyContent });
  };

  private onInvalidIndexingPolicyEdit = (): void => {
    const indexingPolicyContent = this.state.indexingPolicyContent;
    indexingPolicyContent.isValid = false;
    this.setState({ indexingPolicyContent: indexingPolicyContent });
  };

  private onTtlOffKeyPress = (): void => {
    this.updateStatefulValue({ key: StatefulValueNames.TimeToLive, value: TtlType.Off });
  };

  private onTtlOnNoDefaultKeyPress = (): void => {
    this.updateStatefulValue({ key: StatefulValueNames.TimeToLive, value: TtlType.OnNoDefault });
  };

  private onTtlOnKeyPress = (): void => {
    this.updateStatefulValue({ key: StatefulValueNames.TimeToLive, value: TtlType.On });
  };

  private onTtlOffKeyFocus = (): void => {
    this.setState({ ttlOffFocused: true, ttlOnFocused: false, ttlOnDefaultFocused: false });
  };

  private onTtlOnNoDefaultKeyFocus = (): void => {
    this.setState({ ttlOffFocused: false, ttlOnFocused: false, ttlOnDefaultFocused: true });
  };

  private onTtlOnKeyFocus = (): void => {
    this.setState({ ttlOffFocused: false, ttlOnFocused: true, ttlOnDefaultFocused: false });
  };

  private onGeographyKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.GeospatialConfigType,
      value: GeospatialConfigType.Geography
    });
  };

  private onGeometryKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.GeospatialConfigType,
      value: GeospatialConfigType.Geometry
    });
  };

  private onAnalyticalStorageTtlOnNoDefaultKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.AnalyticalStorageTtlSelection,
      value: TtlType.OnNoDefault
    });
  };

  private onAnalyticalStorageTtlOnKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.AnalyticalStorageTtlSelection,
      value: TtlType.On
    });
  };

  private onChangeFeedPolicyOffKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ChangeFeedPolicyToggled,
      value: ChangeFeedPolicyToggledState.Off
    });
  };

  private onChangeFeedPolicyOnKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ChangeFeedPolicyToggled,
      value: ChangeFeedPolicyToggledState.On
    });
  };

  private onConflictResolutionCustomKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyMode,
      value: DataModels.ConflictResolutionMode.Custom
    });
  };

  private onConflictResolutionLWWKeyPress = (): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyMode,
      value: DataModels.ConflictResolutionMode.LastWriterWins
    });
  };

  private onConflictResolutionChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyMode,
      value: event.currentTarget.value
    });
  };

  private onRupmChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.Rupm,
      value: event.currentTarget.value
    });
  };

  private onConflictResolutionPolicyPathChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyPath,
      value: event.currentTarget.value
    });
  };

  private onConflictResolutionPolicyProcedureChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyProcedure,
      value: event.currentTarget.value
    });
  };

  private onTimeToLiveChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLive,
      value: event.currentTarget.value
    });
  };

  private onTimeToLiveSecondsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLiveSeconds,
      value: event.currentTarget.value
    });
  };

  private onGeoSpatialConfigTypeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.GeospatialConfigType,
      value: event.currentTarget.value
    });
  };

  private onAnalyticalStorageTtlSelectionChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.AnalyticalStorageTtlSelection,
      value: event.currentTarget.nodeValue
    });
  };

  private onAnalyticalStorageTtlSecondsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.AnalyticalStorageTtlSeconds,
      value: event.currentTarget.value
    });
  };

  private onChangeFeedPolicyToggled = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ChangeFeedPolicyToggled,
      value: event.currentTarget.value
    });
  };

  private getThroughputUnit = (): string => {
    return this.state.rupm.current === Constants.RUPMStates.on ? "RU/m" : "RU/s";
  };

  private getAnalyticalStorageTtl = (): number => {
    if (this.isAnalyticalStorageEnabled) {
      if (this.state.analyticalStorageTtlSelection.current === TtlType.On) {
        return Number(this.state.analyticalStorageTtlSeconds.current);
      } else {
        return Constants.AnalyticalStorageTtl.Infinite;
      }
    }
    return undefined;
  };

  private getUpdatedConflictResolutionPolicy = (): DataModels.ConflictResolutionPolicy => {
    if (
      !this.state.conflictResolutionPolicyMode.isDirty() &&
      !this.state.conflictResolutionPolicyPath.isDirty() &&
      !this.state.conflictResolutionPolicyProcedure.isDirty()
    ) {
      return undefined;
    }

    const policy: DataModels.ConflictResolutionPolicy = {
      mode: SettingsComponent.parseConflictResolutionMode(this.state.conflictResolutionPolicyMode.current)
    };

    if (
      policy.mode === DataModels.ConflictResolutionMode.Custom &&
      this.state.conflictResolutionPolicyProcedure.current?.length > 0
    ) {
      policy.conflictResolutionProcedure = Constants.HashRoutePrefixes.sprocWithIds(
        this.collection.databaseId,
        this.collection.id(),
        this.state.conflictResolutionPolicyProcedure.current,
        false
      );
    }

    if (policy.mode === DataModels.ConflictResolutionMode.LastWriterWins) {
      policy.conflictResolutionPath = this.state.conflictResolutionPolicyPath.current;
      if (policy.conflictResolutionPath?.startsWith("/")) {
        policy.conflictResolutionPath = "/" + policy.conflictResolutionPath;
      }
    }

    return policy;
  };

  private static parseConflictResolutionMode = (modeFromBackend: string): DataModels.ConflictResolutionMode => {
    // Backend can contain different casing as it does case-insensitive comparisson
    if (!modeFromBackend) {
      return undefined;
    }

    const modeAsLowerCase: string = modeFromBackend.toLowerCase();
    if (modeAsLowerCase === DataModels.ConflictResolutionMode.Custom.toLowerCase()) {
      return DataModels.ConflictResolutionMode.Custom;
    }

    // Default is LWW
    return DataModels.ConflictResolutionMode.LastWriterWins;
  };

  private static parseConflictResolutionProcedure = (procedureFromBackEnd: string): string => {
    // Backend data comes in /dbs/xxxx/colls/xxxx/sprocs/{name}, to make it easier for users, we just use the name
    if (!procedureFromBackEnd) {
      return undefined;
    }

    if (procedureFromBackEnd.indexOf("/") >= 0) {
      const sprocsIndex: number = procedureFromBackEnd.indexOf(Constants.HashRoutePrefixes.sprocHash);
      if (sprocsIndex === -1) {
        return undefined;
      }

      return procedureFromBackEnd.substr(sprocsIndex + Constants.HashRoutePrefixes.sprocHash.length);
    }

    // No path, just a name, in case backend returns just the name
    return procedureFromBackEnd;
  };

  private setBaseline = (): void => {
    const defaultTtl = this.collection.defaultTtl();

    let timeToLive: string = this.state.timeToLive.current;
    let timeToLiveSeconds = this.state.timeToLiveSeconds.current;
    switch (defaultTtl) {
      case undefined:
      case 0:
        timeToLive = TtlType.Off;
        timeToLiveSeconds = SettingsComponent.sixMonthsInSeconds;
        break;
      case -1:
        timeToLive = TtlType.OnNoDefault;
        timeToLiveSeconds = SettingsComponent.sixMonthsInSeconds;
        break;
      default:
        timeToLive = TtlType.On;
        timeToLiveSeconds = defaultTtl;
        break;
    }

    if (this.isAnalyticalStorageEnabled) {
      const analyticalStorageTtl: number = this.collection.analyticalStorageTtl();
      if (analyticalStorageTtl === Constants.AnalyticalStorageTtl.Infinite) {
        this.updateStatefulValue({
          key: StatefulValueNames.AnalyticalStorageTtlSelection,
          value: TtlType.OnNoDefault,
          updateBaseline: true
        });
      } else {
        this.updateStatefulValue({
          key: StatefulValueNames.AnalyticalStorageTtlSelection,
          value: TtlType.On,
          updateBaseline: true
        });
        this.updateStatefulValue({
          key: StatefulValueNames.AnalyticalStorageTtlSeconds,
          value: analyticalStorageTtl,
          updateBaseline: true
        });
      }
    }

    const offerThroughput =
      this.collection &&
      this.collection.offer &&
      this.collection.offer() &&
      this.collection.offer().content &&
      this.collection.offer().content.offerThroughput;

    this.updateStatefulValue({
      key: StatefulValueNames.Throughput,
      value: offerThroughput,
      updateBaseline: true
    });

    const offerIsRUPerMinuteThroughputEnabled =
      this.collection &&
      this.collection.offer &&
      this.collection.offer() &&
      this.collection.offer().content &&
      this.collection.offer().content.offerIsRUPerMinuteThroughputEnabled;

    const changeFeedPolicyToggled: ChangeFeedPolicyToggledState = this.state.changeFeedPolicyToggled.current;
    this.updateStatefulValue({
      key: StatefulValueNames.ChangeFeedPolicyToggled,
      value: changeFeedPolicyToggled,
      updateBaseline: true
    });

    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLive,
      value: timeToLive,
      updateBaseline: true
    });

    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLiveSeconds,
      value: timeToLiveSeconds,
      updateBaseline: true
    });

    this.updateStatefulValue({
      key: StatefulValueNames.IndexingPolicyContent,
      value: this.collection.indexingPolicy(),
      updateBaseline: true
    });

    const conflictResolutionPolicy: DataModels.ConflictResolutionPolicy =
      this.collection.conflictResolutionPolicy && this.collection.conflictResolutionPolicy();

    const conflictResolutionPolicyMode = SettingsComponent.parseConflictResolutionMode(
      conflictResolutionPolicy && conflictResolutionPolicy.mode
    );
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyMode,
      value: conflictResolutionPolicyMode,
      updateBaseline: true
    });

    const conflictResolutionPolicyPath = conflictResolutionPolicy && conflictResolutionPolicy.conflictResolutionPath;
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyPath,
      value: conflictResolutionPolicyPath,
      updateBaseline: true
    });

    const conflictResolutionPolicyProcedure = SettingsComponent.parseConflictResolutionProcedure(
      conflictResolutionPolicy && conflictResolutionPolicy.conflictResolutionProcedure
    );
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyProcedure,
      value: conflictResolutionPolicyProcedure,
      updateBaseline: true
    });

    const rupm = offerIsRUPerMinuteThroughputEnabled ? Constants.RUPMStates.on : Constants.RUPMStates.off;
    this.updateStatefulValue({ key: StatefulValueNames.Rupm, value: rupm, updateBaseline: true });

    const indexingPolicyContent = this.collection.indexingPolicy();
    this.updateStatefulValue({
      key: StatefulValueNames.IndexingPolicyContent,
      value: indexingPolicyContent,
      updateBaseline: true
    });

    if (!this.indexingPolicyEditor && !this.state.isIndexingPolicyEditorInitializing) {
      this.createIndexingPolicyEditor();
    } else {
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      const value: string = JSON.stringify(indexingPolicyContent, undefined, 4);
      indexingPolicyEditorModel.setValue(value);
    }

    const geospatialConfigType: string =
      (this.collection.geospatialConfig &&
        this.collection.geospatialConfig() &&
        this.collection.geospatialConfig().type) ||
      GeospatialConfigType.Geometry;

    this.updateStatefulValue({
      key: StatefulValueNames.GeospatialConfigType,
      value: geospatialConfigType,
      updateBaseline: true
    });

    if (!this.hasAutoPilotV2FeatureFlag) {
      const maxThroughput =
        this.collection &&
        this.collection.offer &&
        this.collection.offer() &&
        this.collection.offer().content &&
        this.collection.offer().content.offerAutopilotSettings &&
        this.collection.offer().content.offerAutopilotSettings.maxThroughput;

      this.updateStatefulValue({
        key: StatefulValueNames.AutoPilotThroughput,
        value: maxThroughput || AutoPilotUtils.minAutoPilotThroughput,
        updateBaseline: true
      });
    }
  };

  private createIndexingPolicyEditor = (): void => {
    this.setState({ isIndexingPolicyEditorInitializing: true });

    const value: string = JSON.stringify(this.state.indexingPolicyContent.current, undefined, 4);

    this.indexingPolicyEditor = monaco.editor.create(this.indexingPolicyDiv.current, {
      value: value,
      language: "json",
      readOnly: false,
      ariaLabel: "Indexing Policy"
    });
    if (this.indexingPolicyEditor) {
      this.indexingPolicyEditor.onDidFocusEditorText(() => this.setState({ indexingPolicyElementFocused: true }));
      this.indexingPolicyEditor.onDidBlurEditorText(() => this.setState({ indexingPolicyElementFocused: false }));
      const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
      indexingPolicyEditorModel.onDidChangeContent(this.onEditorContentChange.bind(this));
      this.setState({ isIndexingPolicyEditorInitializing: false });
      if (this.props.settingsTab.onLoadStartKey !== undefined && this.props.settingsTab.onLoadStartKey !== undefined) {
        TelemetryProcessor.traceSuccess(
          Action.Tab,
          {
            databaseAccountName: this.container.databaseAccount().name,
            databaseName: this.collection.databaseId,
            collectionName: this.collection.id(),
            defaultExperience: this.container.defaultExperience(),
            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: this.props.settingsTab.tabTitle()
          },
          this.props.settingsTab.onLoadStartKey
        );
        this.props.settingsTab.onLoadStartKey = undefined;
      }
    }
  };

  private onEditorContentChange = (): void => {
    const indexingPolicyEditorModel = this.indexingPolicyEditor.getModel();
    try {
      const parsed = JSON.parse(indexingPolicyEditorModel.getValue()) as DataModels.IndexingPolicy;
      const indexingPolicyContent = this.state.indexingPolicyContent;
      indexingPolicyContent.current = parsed;
      this.setState({ indexingPolicyContent: indexingPolicyContent });
      this.onValidIndexingPolicyEdit();
    } catch (e) {
      this.onInvalidIndexingPolicyEdit();
    }
  };

  private getTabsButtons = (): CommandButtonComponentProps[] => {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.saveSettingsButton.isVisible()) {
      const label = "Save";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: async () => await this.onSaveClick(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveSettingsButton.isEnabled()
      });
    }

    if (this.discardSettingsChangesButton.isVisible()) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: this.onRevertClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardSettingsChangesButton.isEnabled()
      });
    }
    return buttons;
  };

  private setMaxAutoPilotThroughput = (newThroughput: number): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.AutoPilotThroughput,
      value: newThroughput
    });
  };

  private setThroughput = (newThroughput: number): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.Throughput,
      value: newThroughput
    });
  };

  private setAutoPilotSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ isAutoPilotSelected: e.currentTarget.value === "true" });
  };

  private setAutoPilotTier = (selectedAutoPilotTier: DataModels.AutopilotTier): void => {
    this.setState({ selectedAutoPilotTier });
  };

  private getStatusBarComponent = (): JSX.Element => {
    return (
      <div className="warningErrorContainer scaleWarningContainer">
        <>
          {this.shouldShowNotificationStatusPrompt() && (
            <div className="warningErrorContent">
              <span>
                <img src={InfoColor} alt="Info" />
              </span>
              <div className="warningErrorDetailsLinkContainer">{this.state.notificationStatusInfo}</div>
            </div>
          )}
          {!this.shouldShowNotificationStatusPrompt() && (
            <div className="warningErrorContent">
              <span>
                <img src={Warning} alt="Warning" />
              </span>
              <div className="warningErrorDetailsLinkContainer">
                {!!this.getWarningMessage() && this.getWarningMessage()}
              </div>
            </div>
          )}
        </>
      </div>
    );
  };

  public render(): JSX.Element {
    return (
      <div className="tab-pane flexContainer" id={this.tabId} role="tabpanel">
        {this.shouldShowStatusBar() && this.getStatusBarComponent()}

        <div className="tabForm scaleSettingScrollable">
          {this.shouldShowKeyspaceSharedThroughputMessage() && (
            <div>This table shared throughput is configured at the keyspace</div>
          )}

          {!hasDatabaseSharedThroughput(this.collection) && (
            <ScaleComponent
              collection={this.collection}
              container={this.container}
              tabId={this.tabId}
              hasProvisioningTypeChanged={this.hasProvisioningTypeChanged}
              hasAutoPilotV2FeatureFlag={this.hasAutoPilotV2FeatureFlag}
              isFixedContainer={this.isFixedContainer}
              autoPilotTiersList={this.autoPilotTiersList}
              onRupmChange={this.onRupmChange}
              rupm={this.state.rupm}
              setThroughput={this.setThroughput}
              throughput={this.state.throughput}
              autoPilotThroughput={this.state.autoPilotThroughput}
              selectedAutoPilotTier={this.state.selectedAutoPilotTier}
              isAutoPilotSelected={this.state.isAutoPilotSelected}
              wasAutopilotOriginallySet={this.state.wasAutopilotOriginallySet}
              userCanChangeProvisioningTypes={this.state.userCanChangeProvisioningTypes}
              overrideWithProvisionedThroughputSettings={this.overrideWithProvisionedThroughputSettings}
              setAutoPilotSelected={this.setAutoPilotSelected}
              setAutoPilotTier={this.setAutoPilotTier}
              setMaxAutoPilotThroughput={this.setMaxAutoPilotThroughput}
            />
          )}

          {this.hasConflictResolution() && (
            <ConflictResolutionComponent
              collection={this.collection}
              container={this.container}
              tabId={this.tabId}
              conflictResolutionPolicyMode={this.state.conflictResolutionPolicyMode}
              conflictResolutionPolicyPath={this.state.conflictResolutionPolicyPath}
              conflictResolutionPolicyProcedure={this.state.conflictResolutionPolicyProcedure}
              onConflictResolutionChange={this.onConflictResolutionChange}
              onConflictResolutionLWWKeyPress={this.onConflictResolutionLWWKeyPress}
              onConflictResolutionPolicyPathChange={this.onConflictResolutionPolicyPathChange}
              onConflictResolutionCustomKeyPress={this.onConflictResolutionCustomKeyPress}
              onConflictResolutionPolicyProcedureChange={this.onConflictResolutionPolicyProcedureChange}
            />
          )}

          <SubSettingsComponent
            collection={this.collection}
            container={this.container}
            tabId={this.tabId}
            isAnalyticalStorageEnabled={this.isAnalyticalStorageEnabled}
            changeFeedPolicyVisible={this.changeFeedPolicyVisible}
            indexingPolicyDiv={this.indexingPolicyDiv}
            timeToLive={this.state.timeToLive}
            onTtlOffKeyPress={this.onTtlOffKeyPress}
            onTtlOnNoDefaultKeyPress={this.onTtlOnNoDefaultKeyPress}
            onTtlOnKeyPress={this.onTtlOnKeyPress}
            onTtlOffKeyFocus={this.onTtlOffKeyFocus}
            onTtlOnNoDefaultKeyFocus={this.onTtlOnNoDefaultKeyFocus}
            onTtlOnKeyFocus={this.onTtlOnKeyFocus}
            onTimeToLiveChange={this.onTimeToLiveChange}
            timeToLiveSeconds={this.state.timeToLiveSeconds}
            onTimeToLiveSecondsChange={this.onTimeToLiveSecondsChange}
            geospatialConfigType={this.state.geospatialConfigType}
            onGeoSpatialConfigTypeChange={this.onGeoSpatialConfigTypeChange}
            onGeographyKeyPress={this.onGeographyKeyPress}
            onGeometryKeyPress={this.onGeometryKeyPress}
            analyticalStorageTtlSelection={this.state.analyticalStorageTtlSelection}
            onAnalyticalStorageTtlSelectionChange={this.onAnalyticalStorageTtlSelectionChange}
            onAnalyticalStorageTtlOnNoDefaultKeyPress={this.onAnalyticalStorageTtlOnNoDefaultKeyPress}
            onAnalyticalStorageTtlOnKeyPress={this.onAnalyticalStorageTtlOnKeyPress}
            analyticalStorageTtlSeconds={this.state.analyticalStorageTtlSeconds}
            onAnalyticalStorageTtlSecondsChange={this.onAnalyticalStorageTtlSecondsChange}
            changeFeedPolicyToggled={this.state.changeFeedPolicyToggled}
            onChangeFeedPolicyOffKeyPress={this.onChangeFeedPolicyOffKeyPress}
            onChangeFeedPolicyOnKeyPress={this.onChangeFeedPolicyOnKeyPress}
            onChangeFeedPolicyToggled={this.onChangeFeedPolicyToggled}
            indexingPolicyContent={this.state.indexingPolicyContent}
            isIndexingPolicyEditorInitializing={this.state.isIndexingPolicyEditorInitializing}
            createIndexingPolicyEditor={this.createIndexingPolicyEditor}
          />
        </div>
      </div>
    );
  }
}
