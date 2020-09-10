import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as SharedConstants from "../../../Shared/Constants";
import * as ViewModels from "../../../Contracts/ViewModels";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import InfoColor from "../../../../images/info_color.svg";
import Warning from "../../../../images/warning.svg";
import { traceStart, traceFailure, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
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
import { ScaleComponent } from "./SettingsSubComponents/ScaleComponent";
import {
  getMaxRUs,
  getMinRUs,
  hasDatabaseSharedThroughput,
  canThroughputExceedMaximumValue,
  GeospatialConfigType,
  TtlType,
  ChangeFeedPolicyState,
  SettingsV2TabTypes,
  getTabTitle,
  isDirty
} from "./SettingsUtils";
import { ConflictResolutionComponent } from "./SettingsSubComponents/ConflictResolutionComponent";
import { SubSettingsComponent } from "./SettingsSubComponents/SubSettingsComponent";
import { Pivot, PivotItem, IPivotProps, IPivotItemProps, IChoiceGroupOption } from "office-ui-fabric-react";
import "./SettingsComponent.less";
import { IndexingPolicyComponent } from "./SettingsSubComponents/IndexingPolicyComponent";

interface SettingsV2TabInfo {
  tab: SettingsV2TabTypes;
  content: JSX.Element;
}

interface ButtonV2 {
  isVisible: () => boolean;
  isEnabled: () => boolean;
  isSelected?: () => boolean;
}

export interface SettingsComponentProps {
  settingsTab: SettingsTab;
}

interface SettingsComponentState {
  throughput: number;
  throughputBaseline: number;
  timeToLive: TtlType;
  timeToLiveBaseline: TtlType;
  timeToLiveSeconds: number;
  timeToLiveSecondsBaseline: number;
  geospatialConfigType: GeospatialConfigType;
  geospatialConfigTypeBaseline: GeospatialConfigType;
  indexingPolicyContent: DataModels.IndexingPolicy;
  indexingPolicyContentBaseline: DataModels.IndexingPolicy;
  indexingPolicyContentIsValid: boolean;
  conflictResolutionPolicyMode: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyModeBaseline: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyPath: string;
  conflictResolutionPolicyPathBaseline: string;
  conflictResolutionPolicyProcedure: string;
  conflictResolutionPolicyProcedureBaseline: string;
  analyticalStorageTtlSelection: TtlType;
  analyticalStorageTtlSelectionBaseline: TtlType;
  analyticalStorageTtlSeconds: number;
  analyticalStorageTtlSecondsBaseline: number;
  changeFeedPolicy: ChangeFeedPolicyState;
  changeFeedPolicyBaseline: ChangeFeedPolicyState;
  autoPilotThroughput: number;
  autoPilotThroughputBaseline: number;
  shouldDiscardIndexingPolicy: boolean;
  indexingPolicyElementFocussed: boolean;
  notificationStatusInfo: JSX.Element;
  userCanChangeProvisioningTypes: boolean;
  selectedAutoPilotTier: DataModels.AutopilotTier;
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  selectedTab: SettingsV2TabTypes;
}

export class SettingsComponent extends React.Component<SettingsComponentProps, SettingsComponentState> {
  private static readonly sixMonthsInSeconds = 15768000;

  public saveSettingsButton: ButtonV2;
  public discardSettingsChangesButton: ButtonV2;

  public isAnalyticalStorageEnabled: boolean;
  private collection: ViewModels.Collection;
  private container: Explorer;
  private hasAutoPilotV2FeatureFlag: boolean;
  private changeFeedPolicyVisible: boolean;
  private isFixedContainer: boolean;
  private autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  private shouldShowIndexingPolicyEditor: boolean;

  constructor(props: SettingsComponentProps) {
    super(props);

    this.collection = this.props.settingsTab.collection as ViewModels.Collection;
    this.container = this.collection?.container;
    this.isAnalyticalStorageEnabled = !!this.collection?.analyticalStorageTtl();

    this.shouldShowIndexingPolicyEditor =
      this.container && !this.container.isPreferredApiCassandra() && !this.container.isPreferredApiMongoDB();

    this.hasAutoPilotV2FeatureFlag = this.container.hasAutoPilotV2FeatureFlag();
    this.changeFeedPolicyVisible = this.collection?.container.isFeatureEnabled(
      Constants.Features.enableChangeFeedPolicy
    );
    // Mongo container with system partition key still treat as "Fixed"

    this.isFixedContainer =
      !this.collection.partitionKey ||
      (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey);

    this.state = {
      shouldDiscardIndexingPolicy: false,
      throughput: undefined,
      throughputBaseline: undefined,
      timeToLive: undefined,
      timeToLiveBaseline: undefined,
      timeToLiveSeconds: undefined,
      timeToLiveSecondsBaseline: undefined,
      geospatialConfigType: undefined,
      geospatialConfigTypeBaseline: undefined,
      indexingPolicyContent: undefined,
      indexingPolicyContentBaseline: undefined,
      indexingPolicyContentIsValid: true,
      conflictResolutionPolicyMode: undefined,
      conflictResolutionPolicyModeBaseline: undefined,
      conflictResolutionPolicyPath: undefined,
      conflictResolutionPolicyPathBaseline: undefined,
      conflictResolutionPolicyProcedure: undefined,
      conflictResolutionPolicyProcedureBaseline: undefined,
      analyticalStorageTtlSelection: undefined,
      analyticalStorageTtlSelectionBaseline: undefined,
      analyticalStorageTtlSeconds: undefined,
      analyticalStorageTtlSecondsBaseline: undefined,
      changeFeedPolicy: undefined,
      changeFeedPolicyBaseline: undefined,
      autoPilotThroughput: undefined,
      autoPilotThroughputBaseline: undefined,
      isAutoPilotSelected: false,
      wasAutopilotOriginallySet: false,
      selectedAutoPilotTier: undefined,
      indexingPolicyElementFocussed: false,
      notificationStatusInfo: undefined,
      userCanChangeProvisioningTypes: undefined,
      selectedTab: SettingsV2TabTypes.ScaleTab
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
                AutoPilotUtils.isValidAutoPilotThroughput(this.state.autoPilotThroughput)) ||
              (this.hasAutoPilotV2FeatureFlag &&
                this.isAutoPilotDirty() &&
                AutoPilotUtils.isValidAutoPilotTier(this.state.selectedAutoPilotTier));
            if (validAutopilotChange) {
              return true;
            }
          } else {
            const isMissingThroughput = !this.state.throughput;
            if (isMissingThroughput) {
              return false;
            }

            const isThroughputLessThanMinRus = this.state.throughput < getMinRUs(this.collection, this.container);
            if (isThroughputLessThanMinRus) {
              return false;
            }

            const isThroughputGreaterThanMaxRus = this.state.throughput > getMaxRUs(this.collection, this.container);
            const isEmulator = this.container.isEmulator;
            if (isThroughputGreaterThanMaxRus && isEmulator) {
              return false;
            }

            if (isThroughputGreaterThanMaxRus && this.isFixedContainer) {
              return false;
            }

            const isThroughputMoreThan1Million =
              this.state.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
            if (!canThroughputExceedMaximumValue(this.collection, this.container) && isThroughputMoreThan1Million) {
              return false;
            }

            if (isDirty(this.state.throughput, this.state.throughputBaseline)) {
              return true;
            }
          }
        }

        if (
          this.hasConflictResolution() &&
          (isDirty(this.state.conflictResolutionPolicyMode, this.state.conflictResolutionPolicyModeBaseline) ||
            isDirty(this.state.conflictResolutionPolicyPath, this.state.conflictResolutionPolicyPathBaseline) ||
            isDirty(this.state.conflictResolutionPolicyProcedure, this.state.conflictResolutionPolicyProcedureBaseline))
        ) {
          return true;
        }

        if (this.state.timeToLive === TtlType.On && !this.state.timeToLiveSeconds) {
          return false;
        }

        if (this.state.analyticalStorageTtlSelection === TtlType.On && !this.state.analyticalStorageTtlSeconds) {
          return false;
        }

        if (isDirty(this.state.timeToLive, this.state.timeToLiveBaseline)) {
          return true;
        }

        if (isDirty(this.state.geospatialConfigType, this.state.geospatialConfigTypeBaseline)) {
          return true;
        }

        if (isDirty(this.state.analyticalStorageTtlSelection, this.state.analyticalStorageTtlSelectionBaseline)) {
          return true;
        }

        if (isDirty(this.state.changeFeedPolicy, this.state.changeFeedPolicyBaseline)) {
          return true;
        }

        if (
          this.state.timeToLive === TtlType.On &&
          isDirty(this.state.timeToLiveSeconds, this.state.timeToLiveSecondsBaseline)
        ) {
          return true;
        }

        if (
          this.state.analyticalStorageTtlSelection === TtlType.On &&
          isDirty(this.state.analyticalStorageTtlSeconds, this.state.analyticalStorageTtlSecondsBaseline)
        ) {
          return true;
        }

        if (
          isDirty(this.state.indexingPolicyContent, this.state.indexingPolicyContentBaseline) &&
          this.state.indexingPolicyContentIsValid
        ) {
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

        if (isDirty(this.state.throughput, this.state.throughputBaseline)) {
          return true;
        }

        if (isDirty(this.state.timeToLive, this.state.timeToLiveBaseline)) {
          return true;
        }

        if (isDirty(this.state.geospatialConfigType, this.state.geospatialConfigTypeBaseline)) {
          return true;
        }

        if (isDirty(this.state.analyticalStorageTtlSelection, this.state.analyticalStorageTtlSelectionBaseline)) {
          return true;
        }

        if (
          this.state.timeToLive === TtlType.On &&
          isDirty(this.state.timeToLiveSeconds, this.state.timeToLiveSecondsBaseline)
        ) {
          return true;
        }

        if (
          this.state.analyticalStorageTtlSelection === TtlType.On &&
          isDirty(this.state.analyticalStorageTtlSeconds, this.state.analyticalStorageTtlSecondsBaseline)
        ) {
          return true;
        }

        if (isDirty(this.state.changeFeedPolicy, this.state.changeFeedPolicyBaseline)) {
          return true;
        }

        if (isDirty(this.state.indexingPolicyContent, this.state.indexingPolicyContentBaseline)) {
          return true;
        }

        if (
          isDirty(this.state.conflictResolutionPolicyMode, this.state.conflictResolutionPolicyModeBaseline) ||
          isDirty(this.state.conflictResolutionPolicyPath, this.state.conflictResolutionPolicyPathBaseline) ||
          isDirty(this.state.conflictResolutionPolicyProcedure, this.state.conflictResolutionPolicyProcedureBaseline)
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
      isDirty(this.state.timeToLive, this.state.timeToLiveBaseline) ||
      (this.state.timeToLive === TtlType.On &&
        isDirty(this.state.timeToLiveSeconds, this.state.timeToLiveSecondsBaseline)) ||
      isDirty(this.state.geospatialConfigType, this.state.geospatialConfigTypeBaseline) ||
      isDirty(this.state.conflictResolutionPolicyMode, this.state.conflictResolutionPolicyModeBaseline) ||
      isDirty(this.state.conflictResolutionPolicyPath, this.state.conflictResolutionPolicyPathBaseline) ||
      isDirty(this.state.conflictResolutionPolicyProcedure, this.state.conflictResolutionPolicyProcedureBaseline) ||
      isDirty(this.state.indexingPolicyContent, this.state.indexingPolicyContentBaseline) ||
      isDirty(this.state.changeFeedPolicy, this.state.changeFeedPolicyBaseline) ||
      isDirty(this.state.analyticalStorageTtlSelection, this.state.analyticalStorageTtlSelectionBaseline) ||
      (this.state.analyticalStorageTtlSelection === TtlType.On &&
        isDirty(this.state.analyticalStorageTtlSeconds, this.state.analyticalStorageTtlSecondsBaseline))
    );
  };

  private setAutoPilotStates = (): void => {
    const offer = this.collection?.offer && this.collection.offer();
    const offerAutopilotSettings = offer?.content?.offerAutopilotSettings;

    this.setState({
      userCanChangeProvisioningTypes: !!offerAutopilotSettings || !this.hasAutoPilotV2FeatureFlag
    });

    if (!this.hasAutoPilotV2FeatureFlag) {
      if (offerAutopilotSettings && offerAutopilotSettings.maxThroughput) {
        if (AutoPilotUtils.isValidAutoPilotThroughput(offerAutopilotSettings.maxThroughput)) {
          this.setState({
            isAutoPilotSelected: true,
            wasAutopilotOriginallySet: true,
            autoPilotThroughput: offerAutopilotSettings.maxThroughput,
            autoPilotThroughputBaseline: offerAutopilotSettings.maxThroughput
          });
        }
      }
    } else {
      if (offerAutopilotSettings?.tier) {
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
      (!this.hasAutoPilotV2FeatureFlag && this.state.autoPilotThroughput !== originalAutoPilotSetting) ||
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
      (this.container?.databaseAccount &&
        this.container.databaseAccount()?.properties?.enableMultipleWriteLocations &&
        this.collection.conflictResolutionPolicy &&
        !!this.collection.conflictResolutionPolicy()) ||
      false
    );
  };

  private isOfferReplacePending = (): boolean => {
    const offer = this.collection?.offer && this.collection.offer();
    return (
      offer &&
      Object.keys(offer).find(value => value === "headers") &&
      !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
    );
  };

  private getWarningMessage = (): JSX.Element => {
    const throughputExceedsBackendLimits: boolean =
      canThroughputExceedMaximumValue(this.collection, this.container) &&
      getMaxRUs(this.collection, this.container) <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
      this.state.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;

    const throughputExceedsMaxValue: boolean =
      !this.container.isEmulator && this.state.throughput > getMaxRUs(this.collection, this.container);

    const ttlOptionDirty: boolean = isDirty(this.state.timeToLive, this.state.timeToLiveBaseline);
    const ttlOrIndexingPolicyFieldsDirty: boolean =
      isDirty(this.state.timeToLive, this.state.timeToLiveBaseline) ||
      isDirty(this.state.indexingPolicyContent, this.state.indexingPolicyContentBaseline) ||
      isDirty(this.state.timeToLiveSeconds, this.state.timeToLiveSecondsBaseline);
    const offer = this.collection?.offer && this.collection.offer();

    if (ttlOptionDirty && this.state.timeToLive === TtlType.On) {
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
        (offer?.content?.offerAutopilotSettings && offer.content.offerAutopilotSettings.targetMaxThroughput) ||
        offer?.content?.offerThroughput;

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
      !this.state.indexingPolicyElementFocussed
    ) {
      return updateThroughputBeyondLimitWarningMessage;
    }

    if (
      throughputExceedsMaxValue &&
      !!this.collection.partitionKey &&
      !this.isFixedContainer &&
      !this.state.indexingPolicyElementFocussed
    ) {
      return updateThroughputDelayedApplyWarningMessage;
    }

    if (this.props.settingsTab.pendingNotification()) {
      const throughputUnit: string = this.getThroughputUnit();
      const matches: string[] = this.props.settingsTab
        .pendingNotification()
        .description.match(`Throughput update for (.*) ${throughputUnit}`);

      const throughput = this.state.throughput;
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
    const startKey: number = traceStart(Action.UpdateSettings, {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.settingsTab.tabTitle()
    });

    const newCollection: DataModels.Collection = { ...this.collection.rawDataModel };

    try {
      if (this.shouldUpdateCollection()) {
        let defaultTtl: number;
        switch (this.state.timeToLive) {
          case TtlType.On:
            defaultTtl = Number(this.state.timeToLiveSeconds);
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

        newCollection.indexingPolicy = this.state.indexingPolicyContent;

        newCollection.changeFeedPolicy =
          this.changeFeedPolicyVisible && this.state.changeFeedPolicy === ChangeFeedPolicyState.On
            ? ({
                retentionDuration: Constants.BackendDefaults.maxChangeFeedRetentionDuration
              } as DataModels.ChangeFeedPolicy)
            : undefined;

        newCollection.analyticalStorageTtl = this.getAnalyticalStorageTtl();

        newCollection.geospatialConfig = {
          type: this.state.geospatialConfigType
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
        isDirty(this.state.throughput, this.state.throughputBaseline) ||
        this.isAutoPilotDirty() ||
        this.hasProvisioningTypeChanged()
      ) {
        const newThroughput = this.state.throughput;
        const newOffer: DataModels.Offer = { ...this.collection.offer() };
        const originalThroughputValue: number = this.state.throughput;

        if (newOffer.content) {
          newOffer.content.offerThroughput = newThroughput;
        } else {
          newOffer.content = {
            offerThroughput: newThroughput,
            offerIsRUPerMinuteThroughputEnabled: false
          };
        }

        const headerOptions: RequestOptions = { initialHeaders: {} };

        if (this.state.isAutoPilotSelected) {
          if (!this.hasAutoPilotV2FeatureFlag) {
            newOffer.content.offerAutopilotSettings = {
              maxThroughput: this.state.autoPilotThroughput
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
            userCanChangeProvisioningTypes: !this.hasAutoPilotV2FeatureFlag
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
          this.container
        ) {
          const requestPayload = {
            subscriptionId: userContext.subscriptionId,
            databaseAccountName: userContext.databaseAccount.name,
            resourceGroup: userContext.resourceGroup,
            databaseName: this.collection.databaseId,
            collectionName: this.collection.id(),
            throughput: newThroughput,
            offerIsRUPerMinuteThroughputEnabled: false
          };
          try {
            await updateOfferThroughputBeyondLimit(requestPayload);
            this.collection.offer().content.offerThroughput = originalThroughputValue;
            this.setState({
              throughput: originalThroughputValue,
              throughputBaseline: originalThroughputValue,
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
            traceFailure(
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
      traceSuccess(
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
      traceFailure(
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
    this.setState({
      throughput: this.state.throughputBaseline,
      timeToLive: this.state.timeToLiveBaseline,
      timeToLiveSeconds: this.state.timeToLiveSecondsBaseline,
      geospatialConfigType: this.state.geospatialConfigTypeBaseline,
      indexingPolicyContent: this.state.indexingPolicyContentBaseline,
      conflictResolutionPolicyMode: this.state.conflictResolutionPolicyModeBaseline,
      conflictResolutionPolicyPath: this.state.conflictResolutionPolicyPathBaseline,
      conflictResolutionPolicyProcedure: this.state.conflictResolutionPolicyProcedureBaseline,
      analyticalStorageTtlSelection: this.state.analyticalStorageTtlSelectionBaseline,
      analyticalStorageTtlSeconds: this.state.analyticalStorageTtlSecondsBaseline,
      changeFeedPolicy: this.state.changeFeedPolicyBaseline,
      autoPilotThroughput: this.state.autoPilotThroughputBaseline,
      shouldDiscardIndexingPolicy: true
    });

    if (this.state.userCanChangeProvisioningTypes) {
      this.setState({ isAutoPilotSelected: this.state.wasAutopilotOriginallySet });
    }

    if (this.state.isAutoPilotSelected) {
      const originalAutoPilotSettings = this.collection.offer().content.offerAutopilotSettings;
      if (!this.hasAutoPilotV2FeatureFlag) {
        const originalAutoPilotMaxThroughput = originalAutoPilotSettings?.maxThroughput;
        this.setState({
          autoPilotThroughput: originalAutoPilotMaxThroughput,
          autoPilotThroughputBaseline: originalAutoPilotMaxThroughput
        });
      } else {
        const originalAutoPilotTier = originalAutoPilotSettings?.tier;
        this.setState({ selectedAutoPilotTier: originalAutoPilotTier });
      }
    }
  };

  private setIndexingPolicyElementFocussed = (indexingPolicyElementFocussed: boolean): void => {
    this.setState({ indexingPolicyElementFocussed: indexingPolicyElementFocussed });
  };

  private setIndexingPolicyContent = (newIndexingPolicy: DataModels.IndexingPolicy): void => {
    this.setState({ indexingPolicyContent: newIndexingPolicy });
  };

  private setIndexingPolicyValidity = (isValid: boolean): void => {
    this.setState({ indexingPolicyContentIsValid: isValid });
  };

  private resetShouldDiscardIndexingPolicy = (): void => {
    this.setState({ shouldDiscardIndexingPolicy: false });
  };

  private logIndexingPolicySuccessMessage = (): void => {
    if (this.props.settingsTab.onLoadStartKey) {
      traceSuccess(
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
  };

  private onConflictResolutionPolicyModeChange = (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void => {
    this.setState({
      conflictResolutionPolicyMode:
        DataModels.ConflictResolutionMode[option.key as keyof typeof DataModels.ConflictResolutionMode]
    });
  };

  private onConflictResolutionPolicyPathChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({ conflictResolutionPolicyPath: newValue });
  };

  private onConflictResolutionPolicyProcedureChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({ conflictResolutionPolicyProcedure: newValue });
  };

  private getTtlValue = (value: string): TtlType => {
    switch (value) {
      case "on":
        return TtlType.On;
      case "off":
        return TtlType.Off;
      case "on-nodefault":
        return TtlType.OnNoDefault;
    }
    return undefined;
  };

  private onTtlChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void => {
    this.setState({ timeToLive: this.getTtlValue(option.key) });
  };

  private onTimeToLiveSecondsChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({ timeToLiveSeconds: parseInt(newValue) });
  };

  private onGeoSpatialConfigTypeChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void => {
    this.setState({ geospatialConfigType: GeospatialConfigType[option.key as keyof typeof GeospatialConfigType] });
  };

  private onAnalyticalStorageTtlSelectionChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void => {
    this.setState({ analyticalStorageTtlSelection: this.getTtlValue(option.key) });
  };

  private onAnalyticalStorageTtlSecondsChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    this.setState({ analyticalStorageTtlSeconds: parseInt(newValue) });
  };

  private onChangeFeedPolicyChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void => {
    this.setState({ changeFeedPolicy: ChangeFeedPolicyState[option.key as keyof typeof ChangeFeedPolicyState] });
  };

  private getThroughputUnit = (): string => {
    return "RU/s";
  };

  private getAnalyticalStorageTtl = (): number => {
    if (this.isAnalyticalStorageEnabled) {
      if (this.state.analyticalStorageTtlSelection === TtlType.On) {
        return Number(this.state.analyticalStorageTtlSeconds);
      } else {
        return Constants.AnalyticalStorageTtl.Infinite;
      }
    }
    return undefined;
  };

  private getUpdatedConflictResolutionPolicy = (): DataModels.ConflictResolutionPolicy => {
    if (
      !isDirty(this.state.conflictResolutionPolicyMode, this.state.conflictResolutionPolicyModeBaseline) &&
      !isDirty(this.state.conflictResolutionPolicyPath, this.state.conflictResolutionPolicyPathBaseline) &&
      !isDirty(this.state.conflictResolutionPolicyProcedure, this.state.conflictResolutionPolicyProcedureBaseline)
    ) {
      return undefined;
    }

    const policy: DataModels.ConflictResolutionPolicy = {
      mode: SettingsComponent.parseConflictResolutionMode(this.state.conflictResolutionPolicyMode)
    };

    if (
      policy.mode === DataModels.ConflictResolutionMode.Custom &&
      this.state.conflictResolutionPolicyProcedure?.length > 0
    ) {
      policy.conflictResolutionProcedure = Constants.HashRoutePrefixes.sprocWithIds(
        this.collection.databaseId,
        this.collection.id(),
        this.state.conflictResolutionPolicyProcedure,
        false
      );
    }

    if (policy.mode === DataModels.ConflictResolutionMode.LastWriterWins) {
      policy.conflictResolutionPath = this.state.conflictResolutionPolicyPath;
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

    let timeToLive: TtlType = this.state.timeToLive;
    let timeToLiveSeconds = this.state.timeToLiveSeconds;
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

    let analyticalStorageTtlSelection: TtlType;
    let analyticalStorageTtlSeconds: number;
    if (this.isAnalyticalStorageEnabled) {
      const analyticalStorageTtl: number = this.collection.analyticalStorageTtl();
      if (analyticalStorageTtl === Constants.AnalyticalStorageTtl.Infinite) {
        analyticalStorageTtlSelection = TtlType.OnNoDefault;
      } else {
        analyticalStorageTtlSelection = TtlType.On;
        analyticalStorageTtlSeconds = analyticalStorageTtl;
      }
    }

    const offerThroughput = this.collection?.offer && this.collection.offer()?.content?.offerThroughput;
    const changeFeedPolicy = this.collection.rawDataModel?.changeFeedPolicy
      ? ChangeFeedPolicyState.On
      : ChangeFeedPolicyState.Off;
    const indexingPolicyContent = this.collection.indexingPolicy();
    const conflictResolutionPolicy: DataModels.ConflictResolutionPolicy =
      this.collection.conflictResolutionPolicy && this.collection.conflictResolutionPolicy();

    const conflictResolutionPolicyMode = SettingsComponent.parseConflictResolutionMode(conflictResolutionPolicy?.mode);
    const conflictResolutionPolicyPath = conflictResolutionPolicy?.conflictResolutionPath;
    const conflictResolutionPolicyProcedure = SettingsComponent.parseConflictResolutionProcedure(
      conflictResolutionPolicy?.conflictResolutionProcedure
    );
    const geospatialConfigTypeString: string =
      (this.collection.geospatialConfig && this.collection.geospatialConfig()?.type) || GeospatialConfigType.Geometry;
    const geoSpatialConfigType = GeospatialConfigType[geospatialConfigTypeString as keyof typeof GeospatialConfigType];

    this.setState({
      throughput: offerThroughput,
      throughputBaseline: offerThroughput,
      changeFeedPolicy: changeFeedPolicy,
      changeFeedPolicyBaseline: changeFeedPolicy,
      timeToLive: timeToLive,
      timeToLiveBaseline: timeToLive,
      timeToLiveSeconds: timeToLiveSeconds,
      timeToLiveSecondsBaseline: timeToLiveSeconds,
      analyticalStorageTtlSelection: analyticalStorageTtlSelection,
      analyticalStorageTtlSelectionBaseline: analyticalStorageTtlSelection,
      analyticalStorageTtlSeconds: analyticalStorageTtlSeconds,
      analyticalStorageTtlSecondsBaseline: analyticalStorageTtlSeconds,
      indexingPolicyContent: indexingPolicyContent,
      indexingPolicyContentBaseline: indexingPolicyContent,
      conflictResolutionPolicyMode: conflictResolutionPolicyMode,
      conflictResolutionPolicyModeBaseline: conflictResolutionPolicyMode,
      conflictResolutionPolicyPath: conflictResolutionPolicyPath,
      conflictResolutionPolicyPathBaseline: conflictResolutionPolicyPath,
      conflictResolutionPolicyProcedure: conflictResolutionPolicyProcedure,
      conflictResolutionPolicyProcedureBaseline: conflictResolutionPolicyProcedure,
      geospatialConfigType: geoSpatialConfigType,
      geospatialConfigTypeBaseline: geoSpatialConfigType
    });

    if (!this.hasAutoPilotV2FeatureFlag) {
      const maxThroughput =
        this.collection?.offer && this.collection.offer()?.content?.offerAutopilotSettings?.maxThroughput;
      const autoPilotThroughput = maxThroughput || AutoPilotUtils.minAutoPilotThroughput;
      this.setState({
        autoPilotThroughput: autoPilotThroughput,
        autoPilotThroughputBaseline: autoPilotThroughput
      });
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
    this.setState({ autoPilotThroughput: newThroughput });
  };

  private setThroughput = (newThroughput: number): void => {
    this.setState({ throughput: newThroughput });
  };

  private setAutoPilotSelected = (isAutoPilotSelected: boolean): void => {
    this.setState({ isAutoPilotSelected: isAutoPilotSelected });
  };

  private setAutoPilotTier = (selectedAutoPilotTier: DataModels.AutopilotTier): void => {
    this.setState({ selectedAutoPilotTier: selectedAutoPilotTier });
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

  private onPivotChange = (item: PivotItem): void => {
    const selectedTab = SettingsV2TabTypes[item.props.itemKey as keyof typeof SettingsV2TabTypes];
    this.setState({ selectedTab: selectedTab });
  };

  public render(): JSX.Element {
    const tabs: SettingsV2TabInfo[] = [];
    if (!hasDatabaseSharedThroughput(this.collection)) {
      tabs.push({
        tab: SettingsV2TabTypes.ScaleTab,
        content: (
          <ScaleComponent
            collection={this.collection}
            container={this.container}
            hasProvisioningTypeChanged={this.hasProvisioningTypeChanged}
            hasAutoPilotV2FeatureFlag={this.hasAutoPilotV2FeatureFlag}
            isFixedContainer={this.isFixedContainer}
            autoPilotTiersList={this.autoPilotTiersList}
            setThroughput={this.setThroughput}
            throughput={this.state.throughput}
            throughputBaseline={this.state.throughputBaseline}
            autoPilotThroughput={this.state.autoPilotThroughput}
            autoPilotThroughputBaseline={this.state.autoPilotThroughputBaseline}
            selectedAutoPilotTier={this.state.selectedAutoPilotTier}
            isAutoPilotSelected={this.state.isAutoPilotSelected}
            wasAutopilotOriginallySet={this.state.wasAutopilotOriginallySet}
            userCanChangeProvisioningTypes={this.state.userCanChangeProvisioningTypes}
            overrideWithProvisionedThroughputSettings={this.overrideWithProvisionedThroughputSettings}
            setAutoPilotSelected={this.setAutoPilotSelected}
            setAutoPilotTier={this.setAutoPilotTier}
            setMaxAutoPilotThroughput={this.setMaxAutoPilotThroughput}
          />
        )
      });
    }

    tabs.push({
      tab: SettingsV2TabTypes.SubSettingsTab,
      content: (
        <SubSettingsComponent
          collection={this.collection}
          container={this.container}
          isAnalyticalStorageEnabled={this.isAnalyticalStorageEnabled}
          changeFeedPolicyVisible={this.changeFeedPolicyVisible}
          timeToLive={this.state.timeToLive}
          timeToLiveBaseline={this.state.timeToLiveBaseline}
          onTtlChange={this.onTtlChange}
          timeToLiveSeconds={this.state.timeToLiveSeconds}
          timeToLiveSecondsBaseline={this.state.timeToLiveSecondsBaseline}
          onTimeToLiveSecondsChange={this.onTimeToLiveSecondsChange}
          geospatialConfigType={this.state.geospatialConfigType}
          geospatialConfigTypeBaseline={this.state.geospatialConfigTypeBaseline}
          onGeoSpatialConfigTypeChange={this.onGeoSpatialConfigTypeChange}
          analyticalStorageTtlSelection={this.state.analyticalStorageTtlSelection}
          analyticalStorageTtlSelectionBaseline={this.state.analyticalStorageTtlSelectionBaseline}
          onAnalyticalStorageTtlSelectionChange={this.onAnalyticalStorageTtlSelectionChange}
          analyticalStorageTtlSeconds={this.state.analyticalStorageTtlSeconds}
          analyticalStorageTtlSecondsBaseline={this.state.analyticalStorageTtlSecondsBaseline}
          onAnalyticalStorageTtlSecondsChange={this.onAnalyticalStorageTtlSecondsChange}
          changeFeedPolicy={this.state.changeFeedPolicy}
          changeFeedPolicyBaseline={this.state.changeFeedPolicyBaseline}
          onChangeFeedPolicyChange={this.onChangeFeedPolicyChange}
        />
      )
    });

    if (this.shouldShowIndexingPolicyEditor) {
      tabs.push({
        tab: SettingsV2TabTypes.IndexingPolicyTab,
        content: (
          <IndexingPolicyComponent
            shouldDiscardIndexingPolicy={this.state.shouldDiscardIndexingPolicy}
            resetShouldDiscardIndexingPolicy={this.resetShouldDiscardIndexingPolicy}
            indexingPolicyContent={this.state.indexingPolicyContent}
            setIndexingPolicyElementFocussed={this.setIndexingPolicyElementFocussed}
            setIndexingPolicyContent={this.setIndexingPolicyContent}
            setIndexingPolicyValidity={this.setIndexingPolicyValidity}
            logIndexingPolicySuccessMessage={this.logIndexingPolicySuccessMessage}
          />
        )
      });
    }

    if (this.hasConflictResolution()) {
      tabs.push({
        tab: SettingsV2TabTypes.ConflictResolutionTab,
        content: (
          <ConflictResolutionComponent
            collection={this.collection}
            container={this.container}
            conflictResolutionPolicyMode={this.state.conflictResolutionPolicyMode}
            conflictResolutionPolicyModeBaseline={this.state.conflictResolutionPolicyModeBaseline}
            onConflictResolutionPolicyModeChange={this.onConflictResolutionPolicyModeChange}
            conflictResolutionPolicyPath={this.state.conflictResolutionPolicyPath}
            conflictResolutionPolicyPathBaseline={this.state.conflictResolutionPolicyPathBaseline}
            onConflictResolutionPolicyPathChange={this.onConflictResolutionPolicyPathChange}
            conflictResolutionPolicyProcedure={this.state.conflictResolutionPolicyProcedure}
            conflictResolutionPolicyProcedureBaseline={this.state.conflictResolutionPolicyProcedureBaseline}
            onConflictResolutionPolicyProcedureChange={this.onConflictResolutionPolicyProcedureChange}
          />
        )
      });
    }

    const pivotProps: IPivotProps = {
      onLinkClick: this.onPivotChange,
      selectedKey: SettingsV2TabTypes[this.state.selectedTab]
    };

    const pivotItems = tabs.map(tab => {
      const pivotItemProps: IPivotItemProps = {
        itemKey: SettingsV2TabTypes[tab.tab],
        style: { marginTop: 20 },
        headerText: getTabTitle(tab.tab)
      };

      return (
        <PivotItem key={pivotItemProps.itemKey} {...pivotItemProps}>
          {tab.content}
        </PivotItem>
      );
    });

    return (
      <div className="settingsV2MainContainer">
        {this.shouldShowStatusBar() && this.getStatusBarComponent()}

        {this.shouldShowKeyspaceSharedThroughputMessage() && (
          <div>This table shared throughput is configured at the keyspace</div>
        )}

        <div className="settingsV2TabsContainer">
          <Pivot {...pivotProps}>{pivotItems}</Pivot>
        </div>
      </div>
    );
  }
}
