import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as monaco from "monaco-editor";
import * as PricingUtils from "../../../Utils/PricingUtils";
import * as SharedConstants from "../../../Shared/Constants";
import * as ViewModels from "../../../Contracts/ViewModels";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import InfoColor from "../../../../images/info_color.svg";
import Warning from "../../../../images/warning.svg";
import TriangleRight from "../../../../images/Triangle-right.svg";
import TriangleDown from "../../../../images/Triangle-down.svg";
import InfoBubble from "../../../../images/info-bubble.svg";
import TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import { Action } from "../../../Shared/Telemetry/TelemetryConstants";
import { PlatformType } from "../../../PlatformType";
import { RequestOptions } from "@azure/cosmos/dist-esm";
import Explorer from "../../Explorer";
import { updateOffer, updateCollection } from "../../../Common/DocumentClientUtilityBase";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import { userContext } from "../../../UserContext";
import { updateOfferThroughputBeyondLimit } from "../../../Common/dataAccess/updateOfferThroughputBeyondLimit";
import SettingsTab from "../../Tabs/SettingsTabV2";
import { ThroughputInputAutoPilotV3Component } from "../ThroughputInput/ThroughputInputReactComponentAutoPilotV3";
import { ThroughputInputComponent } from "../ThroughputInput/ThroughputInputReactComponent";
import {
  StatefulValuesType,
  StatefulValue,
  isDirty,
  getAutoPilotV3SpendElement,
  getAutoPilotV2SpendElement,
  getEstimatedSpendElement,
  getEstimatedAutoscaleSpendElement,
  manualToAutoscaleDisclaimerElement
} from "./SettingsUtils";
import { AccessibleElement } from "../AccessibleElement/AccessibleElement";

enum ChangeFeedPolicyToggledState {
  Off = "Off",
  On = "On"
}

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
  ChangeFeedPolicyToggled = "changeFeedPolicyToggled"
}

interface UpdateStatefulValueParams {
  key: keyof SettingsComponentState;
  value: StatefulValuesType;
  updateCurrent: boolean;
  updateBaseline?: boolean;
}

export interface SettingsComponentProps {
  settingsTab: SettingsTab;
}

interface SettingsComponentState {
  throughput: StatefulValue<number>;
  timeToLive: StatefulValue<string>;
  timeToLiveSeconds: StatefulValue<number>;
  geospatialConfigType: StatefulValue<string>;
  indexingPolicyContent: StatefulValue<DataModels.IndexingPolicy>;
  rupm: StatefulValue<string>;
  conflictResolutionPolicyMode: StatefulValue<string>;
  conflictResolutionPolicyPath: StatefulValue<string>;
  conflictResolutionPolicyProcedure: StatefulValue<string>;
  analyticalStorageTtlSelection: StatefulValue<string>;
  analyticalStorageTtlSeconds: StatefulValue<number>;
  changeFeedPolicyToggled: StatefulValue<ChangeFeedPolicyToggledState>;
  geospatialVisible: boolean;
  isIndexingPolicyEditorInitializing: boolean;
  conflictResolutionExpanded: boolean;
  indexingPolicyElementFocused: boolean;
  notificationStatusInfo: JSX.Element;
  scaleExpanded: boolean;
  settingsExpanded: boolean;
  ttlOffFocused: boolean;
  ttlOnDefaultFocused: boolean;
  ttlOnFocused: boolean;
  userCanChangeProvisioningTypes: boolean;
  autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  selectedAutoPilotTier: DataModels.AutopilotTier;
  isAutoPilotSelected: boolean;
  autoPilotThroughput: number;
  wasAutopilotOriginallySet: boolean;
}

export class SettingsComponent extends React.Component<SettingsComponentProps, SettingsComponentState> {
  private ttlWarning: JSX.Element = (
    <span>
      The system will automatically delete items based on the TTL value (in seconds) you provide, without needing a
      delete operation explicitly issued by a client application. For more information see,{" "}
      <a target="_blank" href="https://aka.ms/cosmos-db-ttl">
        Time to Live (TTL) in Azure Cosmos DB
      </a>
      .
    </span>
  );

  private indexingPolicyTTLWarningMessage: JSX.Element = (
    <span>
      Changing the Indexing Policy impacts query results while the index transformation occurs. When a change is made
      and the indexing mode is set to consistent or lazy, queries return eventual results until the operation completes.
      For more information see,{" "}
      <a target="_blank" href="https://aka.ms/cosmosdb/modify-index-policy">
        Modifying Indexing Policies
      </a>
      .
    </span>
  );

  private updateThroughputBeyondLimitWarningMessage: JSX.Element = (
    <span>
      You are about to request an increase in throughput beyond the pre-allocated capacity. The service will scale out
      and increase throughput for the selected container. This operation will take 1-3 business days to complete. You
      can track the status of this request in Notifications.
    </span>
  );

  private updateThroughputDelayedApplyWarningMessage: JSX.Element = (
    <span>
      You are about to request an increase in throughput beyond the pre-allocated capacity. This operation will take
      some time to complete.
    </span>
  );

  private getCurrentThroughput = (
    isAutoscale: boolean,
    throughput: number,
    throughputUnit: string,
    targetThroughput?: number
  ): string => {
    if (targetThroughput) {
      if (throughput) {
        return isAutoscale
          ? `, Current autoscale throughput: ${Math.round(
              throughput / 10
            )} - ${throughput} ${throughputUnit}, Target autoscale throughput: ${Math.round(
              targetThroughput / 10
            )} - ${targetThroughput} ${throughputUnit}`
          : `, Current manual throughput: ${throughput} ${throughputUnit}, Target manual throughput: ${targetThroughput}`;
      } else {
        return isAutoscale
          ? `, Target autoscale throughput: ${Math.round(
              targetThroughput / 10
            )} - ${targetThroughput} ${throughputUnit}`
          : `, Target manual throughput: ${targetThroughput} ${throughputUnit}`;
      }
    }

    if (!targetThroughput && throughput) {
      return isAutoscale
        ? `, Current autoscale throughput: ${Math.round(throughput / 10)} - ${throughput} ${throughputUnit}`
        : `, Current manual throughput: ${throughput} ${throughputUnit}`;
    }

    return "";
  };

  private getThroughputApplyDelayedMessage = (
    isAutoscale: boolean,
    throughput: number,
    throughputUnit: string,
    databaseName: string,
    collectionName: string,
    requestedThroughput: number
  ): JSX.Element => (
    <span>
      The request to increase the throughput has successfully been submitted. This operation will take 1-3 business days
      to complete. View the latest status in Notifications.
      <br />
      Database: {databaseName}, Container: {collectionName}{" "}
      {this.getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
    </span>
  );

  private getThroughputApplyShortDelayMessage = (
    isAutoscale: boolean,
    throughput: number,
    throughputUnit: string,
    databaseName: string,
    collectionName: string,
    targetThroughput: number
  ): JSX.Element => (
    <span>
      A request to increase the throughput is currently in progress. This operation will take some time to complete.
      <br />
      Database: {databaseName}, Container: {collectionName}{" "}
      {this.getCurrentThroughput(isAutoscale, throughput, throughputUnit, targetThroughput)}
    </span>
  );

  private getThroughputApplyLongDelayMessage = (
    isAutoscale: boolean,
    throughput: number,
    throughputUnit: string,
    databaseName: string,
    collectionName: string,
    requestedThroughput: number
  ): JSX.Element => (
    <span>
      A request to increase the throughput is currently in progress. This operation will take 1-3 business days to
      complete. View the latest status in Notifications.
      <br />
      Database: {databaseName}, Container: {collectionName}{" "}
      {this.getCurrentThroughput(isAutoscale, throughput, throughputUnit, requestedThroughput)}
    </span>
  );

  private static readonly GEOGRAPHY = "Geography";
  private static readonly GEOMETRY = "Geometry";
  private static readonly sixMonthsInSeconds = 15768000;

  public saveSettingsButton: ButtonV2;
  public discardSettingsChangesButton: ButtonV2;

  public changeFeedPolicyOffId: string;
  public changeFeedPolicyOnId: string;
  public conflictResolutionPolicyModeCustom: string;
  public conflictResolutionPolicyModeCRDT: string;
  public conflictResolutionPolicyModeLWW: string;
  public rupmOnId: string;
  public rupmOffId: string;
  public ttlOffId: string;
  public ttlOnId: string;
  public ttlOnNoDefaultId: string;
  public isAnalyticalStorageEnabled: boolean;
  public testId: string;
  public throughputAutoPilotRadioId: string;
  public throughputProvisionedRadioId: string;
  public throughputModeRadioName: string;
  private collection: ViewModels.Collection;
  private container: Explorer;
  private indexingPolicyEditor: monaco.editor.IStandaloneCodeEditor;
  private indexingPolicyDiv = React.createRef<HTMLDivElement>();
  private shouldShowIndexingPolicyEditor: boolean;
  private initialChangeFeedLoggingState: ChangeFeedPolicyToggledState;
  private hasAutoPilotV2FeatureFlag: boolean;
  private canExceedMaximumValue: boolean;
  private changeFeedPolicyVisible: boolean;
  private isFixedContainer: boolean;
  private ttlVisible: boolean;
  private costsVisible: boolean;
  private isTryCosmosDBSubscription: boolean;
  private shouldDisplayPortalUsePrompt: boolean;
  private maxRUsText: string;
  private partitionKeyValue: string;
  private partitionKeyName: string;
  private tabId: string;
  private statefulValuesArray = Object.values(StatefulValueNames) as string[];

  constructor(props: SettingsComponentProps) {
    super(props);

    this.tabId = this.props.settingsTab.getTabId();
    this.collection = this.props.settingsTab.collection as ViewModels.Collection;
    this.container = this.collection && this.collection.container;
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
    this.isAnalyticalStorageEnabled = this.collection && !!this.collection.analyticalStorageTtl();
    this.shouldShowIndexingPolicyEditor =
      this.container && !this.container.isPreferredApiCassandra() && !this.container.isPreferredApiMongoDB();

    this.initialChangeFeedLoggingState = this.collection.rawDataModel?.changeFeedPolicy
      ? ChangeFeedPolicyToggledState.On
      : ChangeFeedPolicyToggledState.Off;

    this.hasAutoPilotV2FeatureFlag = this.container.hasAutoPilotV2FeatureFlag();
    this.canExceedMaximumValue = this.container.canExceedMaximumValue();
    this.changeFeedPolicyVisible =
      this.collection && this.collection.container.isFeatureEnabled(Constants.Features.enableChangeFeedPolicy);
    // Mongo container with system partition key still treat as "Fixed"

    this.isFixedContainer =
      !this.collection.partitionKey ||
      (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey);
    this.ttlVisible = (this.container && !this.container.isPreferredApiCassandra()) || false;
    this.costsVisible = !this.container.isEmulator;
    this.isTryCosmosDBSubscription = (this.container && this.container.isTryCosmosDBSubscription()) || false;
    this.shouldDisplayPortalUsePrompt =
      this.container.getPlatformType() === PlatformType.Hosted && !!this.collection.partitionKey;
    this.maxRUsText = SharedConstants.CollectionCreation.DefaultCollectionRUs1Million.toLocaleString();
    this.partitionKeyValue = "/" + this.collection.partitionKeyProperty;
    this.partitionKeyName = this.container.isPreferredApiMongoDB() ? "Shard key" : "Partition key";

    this.state = {
      isIndexingPolicyEditorInitializing: false,
      geospatialVisible: this.container.isPreferredApiDocumentDB(),
      changeFeedPolicyToggled: {
        baseline: this.initialChangeFeedLoggingState,
        current: this.initialChangeFeedLoggingState,
        isValid: true
      },
      scaleExpanded: true,
      settingsExpanded: true,
      conflictResolutionExpanded: true,
      throughput: { baseline: undefined, current: undefined, isValid: true },
      conflictResolutionPolicyMode: { baseline: undefined, current: undefined, isValid: true },
      conflictResolutionPolicyPath: { baseline: undefined, current: undefined, isValid: true },
      conflictResolutionPolicyProcedure: { baseline: undefined, current: undefined, isValid: true },
      timeToLive: { baseline: undefined, current: undefined, isValid: true },
      timeToLiveSeconds: { baseline: undefined, current: undefined, isValid: true },
      geospatialConfigType: { baseline: undefined, current: undefined, isValid: true },
      analyticalStorageTtlSelection: { baseline: undefined, current: undefined, isValid: true },
      analyticalStorageTtlSeconds: { baseline: undefined, current: undefined, isValid: true },
      indexingPolicyContent: { baseline: undefined, current: undefined, isValid: true },
      rupm: { baseline: undefined, current: undefined, isValid: true },
      isAutoPilotSelected: false,
      wasAutopilotOriginallySet: false,
      selectedAutoPilotTier: undefined,
      autoPilotTiersList: undefined,
      autoPilotThroughput: AutoPilotUtils.minAutoPilotThroughput,
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

        const isCollectionThroughput = !this.hasDatabaseSharedThroughput();
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
            const isMissingThroughput = !this.state.throughput.current;
            if (isMissingThroughput) {
              return false;
            }

            const isThroughputLessThanMinRus = this.state.throughput.current < this.getMinRUs();
            if (isThroughputLessThanMinRus) {
              return false;
            }

            const isThroughputGreaterThanMaxRus = this.state.throughput.current > this.getMaxRUs();
            const isEmulator = this.container.isEmulator;
            if (isThroughputGreaterThanMaxRus && isEmulator) {
              return false;
            }

            if (isThroughputGreaterThanMaxRus && this.isFixedContainer) {
              return false;
            }

            const isThroughputMoreThan1Million =
              this.state.throughput.current > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
            if (!this.canThroughputExceedMaximumValue() && isThroughputMoreThan1Million) {
              return false;
            }

            if (isDirty(this.state.throughput)) {
              return true;
            }
          }
        }

        if (
          this.hasConflictResolution() &&
          (isDirty(this.state.conflictResolutionPolicyMode) ||
            isDirty(this.state.conflictResolutionPolicyPath) ||
            isDirty(this.state.conflictResolutionPolicyProcedure))
        ) {
          return true;
        }

        if (this.state.timeToLive.current === "on" && !this.state.timeToLiveSeconds.current) {
          return false;
        }

        if (this.state.analyticalStorageTtlSelection.current === "on" && !this.state.analyticalStorageTtlSeconds) {
          return false;
        }

        if (
          this.state.rupm.current === Constants.RUPMStates.on &&
          this.state.throughput.current >
            SharedConstants.CollectionCreation.MaxRUPMPerPartition * this.collection.quotaInfo().numPartitions
        ) {
          return false;
        }

        if (isDirty(this.state.timeToLive)) {
          return true;
        }

        if (isDirty(this.state.geospatialConfigType)) {
          return true;
        }

        if (isDirty(this.state.analyticalStorageTtlSelection)) {
          return true;
        }

        if (isDirty(this.state.changeFeedPolicyToggled)) {
          return true;
        }

        if (this.state.timeToLive.current === "on" && isDirty(this.state.timeToLiveSeconds)) {
          return true;
        }

        if (
          this.state.analyticalStorageTtlSelection.current === "on" &&
          isDirty(this.state.analyticalStorageTtlSeconds)
        ) {
          return true;
        }

        if (isDirty(this.state.indexingPolicyContent) && this.state.indexingPolicyContent.isValid) {
          return true;
        }

        if (isDirty(this.state.rupm)) {
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

        if (isDirty(this.state.throughput)) {
          return true;
        }

        if (isDirty(this.state.timeToLive)) {
          return true;
        }

        if (isDirty(this.state.geospatialConfigType)) {
          return true;
        }

        if (isDirty(this.state.analyticalStorageTtlSelection)) {
          return true;
        }

        if (this.state.timeToLive.current === "on" && isDirty(this.state.timeToLiveSeconds)) {
          return true;
        }

        if (
          this.state.analyticalStorageTtlSelection.current === "on" &&
          isDirty(this.state.analyticalStorageTtlSeconds)
        ) {
          return true;
        }

        if (isDirty(this.state.changeFeedPolicyToggled)) {
          return true;
        }

        if (isDirty(this.state.indexingPolicyContent)) {
          return true;
        }

        if (isDirty(this.state.rupm)) {
          return true;
        }

        if (
          isDirty(this.state.conflictResolutionPolicyMode) ||
          isDirty(this.state.conflictResolutionPolicyPath) ||
          isDirty(this.state.conflictResolutionPolicyProcedure)
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
    if (params.updateCurrent) {
      currentStateValue.current = params.value;
    }
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
      isDirty(this.state.timeToLive) ||
      (this.state.timeToLive.current === "on" && isDirty(this.state.timeToLiveSeconds)) ||
      isDirty(this.state.geospatialConfigType) ||
      isDirty(this.state.conflictResolutionPolicyMode) ||
      isDirty(this.state.conflictResolutionPolicyPath) ||
      isDirty(this.state.conflictResolutionPolicyProcedure) ||
      isDirty(this.state.indexingPolicyContent) ||
      isDirty(this.state.changeFeedPolicyToggled) ||
      isDirty(this.state.analyticalStorageTtlSelection) ||
      (this.state.analyticalStorageTtlSelection.current === "on" && isDirty(this.state.analyticalStorageTtlSeconds))
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
            wasAutopilotOriginallySet: true,
            autoPilotThroughput: offerAutopilotSettings.maxThroughput
          });
        }
      }
    } else {
      if (offerAutopilotSettings && offerAutopilotSettings.tier) {
        if (AutoPilotUtils.isValidAutoPilotTier(offerAutopilotSettings.tier)) {
          const availableAutoPilotTiers = AutoPilotUtils.getAvailableAutoPilotTiersOptions(offerAutopilotSettings.tier);
          this.setState({
            isAutoPilotSelected: true,
            wasAutopilotOriginallySet: true,
            selectedAutoPilotTier: offerAutopilotSettings.tier,
            autoPilotTiersList: availableAutoPilotTiers
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

  private overrideWithAutoPilotSettings = (): boolean => {
    if (this.hasAutoPilotV2FeatureFlag) {
      return false;
    }
    return this.hasProvisioningTypeChanged() && this.state.wasAutopilotOriginallySet;
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

  private getAutoPilotUsageCost = (): JSX.Element => {
    const autoPilot = !this.hasAutoPilotV2FeatureFlag
      ? this.state.autoPilotThroughput
      : this.state.selectedAutoPilotTier;
    if (!autoPilot) {
      return <></>;
    }
    return !this.hasAutoPilotV2FeatureFlag
      ? getAutoPilotV3SpendElement(autoPilot, false /* isDatabaseThroughput */)
      : getAutoPilotV2SpendElement(autoPilot, false /* isDatabaseThroughput */);
  };

  private getRequestUnitsUsageCost = (): JSX.Element => {
    const account = this.container.databaseAccount();
    if (!account) {
      return <></>;
    }

    const serverId: string = this.container.serverId();
    const offerThroughput: number = this.state.throughput.current;
    const rupmEnabled = this.state.rupm.current === Constants.RUPMStates.on;

    const regions =
      (account && account.properties && account.properties.readLocations && account.properties.readLocations.length) ||
      1;
    const multimaster = (account && account.properties && account.properties.enableMultipleWriteLocations) || false;

    let estimatedSpend: JSX.Element;

    if (!this.state.isAutoPilotSelected) {
      estimatedSpend = getEstimatedSpendElement(
        // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
        this.overrideWithAutoPilotSettings() ? this.state.autoPilotThroughput : offerThroughput,
        serverId,
        regions,
        multimaster,
        rupmEnabled
      );
    } else {
      estimatedSpend = getEstimatedAutoscaleSpendElement(
        this.state.autoPilotThroughput,
        serverId,
        regions,
        multimaster
      );
    }
    return estimatedSpend;
  };

  private isAutoScaleEnabled = (): boolean => {
    const accountCapabilities: DataModels.Capability[] =
      this.container &&
      this.container.databaseAccount() &&
      this.container.databaseAccount().properties &&
      this.container.databaseAccount().properties.capabilities;
    const enableAutoScaleCapability =
      accountCapabilities &&
      accountCapabilities.find((capability: DataModels.Capability) => {
        return (
          capability &&
          capability.name &&
          capability.name.toLowerCase() === Constants.CapabilityNames.EnableAutoScale.toLowerCase()
        );
      });

    return !!enableAutoScaleCapability;
  };

  private hasDatabaseSharedThroughput = (): boolean => {
    const database: ViewModels.Database = this.collection.getDatabase();
    return database && database.isDatabaseShared && !this.collection.offer();
  };

  private shouldShowKeyspaceSharedThroughputMessage = (): boolean => {
    return this.container && this.container.isPreferredApiCassandra() && this.hasDatabaseSharedThroughput();
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

  private isRupmVisible = (): boolean => {
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
          // eslint-disable-next-line no-unexpected-multiline
          [i].collections()
          // eslint-disable-next-line no-unexpected-multiline
          [j].offer();
        if (collectionOffer && collectionOffer.content && collectionOffer.content.offerIsRUPerMinuteThroughputEnabled) {
          return true;
        }
      }
    }

    return false;
  };

  private canThroughputExceedMaximumValue = (): boolean => {
    const isPublicAzurePortal: boolean =
      this.container.getPlatformType() === PlatformType.Portal && !this.container.isRunningOnNationalCloud();
    const hasPartitionKey = !!this.collection.partitionKey;

    return isPublicAzurePortal && hasPartitionKey;
  };

  private getMinRUs = (): number => {
    if (this.isTryCosmosDBSubscription) {
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

    const baseRU = SharedConstants.CollectionCreation.DefaultCollectionRUs400;

    const quotaInKb = this.collection.quotaInfo().collectionSize;
    const quotaInGb = PricingUtils.usageInGB(quotaInKb);

    const perPartitionGBQuota: number = Math.max(10, quotaInGb / numPartitions);
    const baseRUbyPartitions: number = ((numPartitions * perPartitionGBQuota) / 10) * 100;

    return Math.max(baseRU, baseRUbyPartitions);
  };

  private getMaxRUs = (): number => {
    const isTryCosmosDBSubscription = this.isTryCosmosDBSubscription;
    if (isTryCosmosDBSubscription) {
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
  };

  private getMaxRUThroughputInputLimit = (): number => {
    if (this.container && this.container.getPlatformType() === PlatformType.Hosted && this.collection.partitionKey) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
    }

    return this.getMaxRUs();
  };

  private getThroughputTitle = (): string => {
    if (this.state.isAutoPilotSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText(this.hasAutoPilotV2FeatureFlag);
    }

    const minThroughput: string = this.getMinRUs().toLocaleString();
    const maxThroughput: string =
      this.canThroughputExceedMaximumValue() && !this.isFixedContainer
        ? "unlimited"
        : this.getMaxRUs().toLocaleString();
    return `Throughput (${minThroughput} - ${maxThroughput} RU/s)`;
  };

  private getThroughputAriaLabel = (): string => {
    return this.getThroughputTitle() + this.getRequestUnitsUsageCost();
  };

  private getStorageCapacityTitle = (): JSX.Element => {
    // Mongo container with system partition key still treat as "Fixed"
    const isFixed =
      !this.collection.partitionKey ||
      (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey);
    const capacity: string = isFixed ? "Fixed" : "Unlimited";
    return <span>Storage capacity <br /><b>{capacity}</b></span>
  };

  private getPartitionKeyVisible = (): boolean => {
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
  };

  private getLowerCasePartitionKeyName = (): string => this.partitionKeyName.toLowerCase();

  private isLargePartitionKeyEnabled = (): boolean => {
    return (
      !!this.collection.partitionKey &&
      !!this.collection.partitionKey.version &&
      this.collection.partitionKey.version >= 2
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
      this.canThroughputExceedMaximumValue() &&
      this.getMaxRUs() <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
      this.state.throughput.current > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;

    const throughputExceedsMaxValue: boolean =
      !this.container.isEmulator && this.state.throughput.current > this.getMaxRUs();

    const ttlOptionDirty: boolean = isDirty(this.state.timeToLive);
    const ttlOrIndexingPolicyFieldsDirty: boolean =
      isDirty(this.state.timeToLive) ||
      isDirty(this.state.indexingPolicyContent) ||
      isDirty(this.state.timeToLiveSeconds);
    const ttlFieldFocused: boolean =
      this.state.ttlOffFocused || this.state.ttlOnDefaultFocused || this.state.ttlOnFocused;
    const offer = this.collection && this.collection.offer && this.collection.offer();

    if (ttlOptionDirty && this.state.timeToLive.current === "on") {
      return this.ttlWarning;
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

      var throughput = undefined;
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

      return this.getThroughputApplyShortDelayMessage(
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
      return this.updateThroughputBeyondLimitWarningMessage;
    }

    if (
      throughputExceedsMaxValue &&
      !!this.collection.partitionKey &&
      !this.isFixedContainer &&
      !ttlFieldFocused &&
      !this.state.indexingPolicyElementFocused
    ) {
      return this.updateThroughputDelayedApplyWarningMessage;
    }

    if (this.props.settingsTab.pendingNotification()) {
      const throughputUnit: string = this.getThroughputUnit();
      const matches: string[] = this.props.settingsTab
        .pendingNotification()
        .description.match(`Throughput update for (.*) ${throughputUnit}`);

      const throughput = this.state.throughput.baseline;
      const targetThroughput: number = matches.length > 1 && Number(matches[1]);
      if (targetThroughput) {
        return this.getThroughputApplyLongDelayMessage(
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
      return this.indexingPolicyTTLWarningMessage;
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
          case "on":
            defaultTtl = Number(this.state.timeToLiveSeconds.current);
            break;
          case "on-nodefault":
            defaultTtl = -1;
            break;
          case "off":
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
          this.collection,
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
        isDirty(this.state.throughput) ||
        isDirty(this.state.rupm) ||
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
          this.getMaxRUs() <= SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
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
              updateCurrent: true,
              updateBaseline: true
            });

            this.setState({
              notificationStatusInfo: this.getThroughputApplyDelayedMessage(
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
      const stateElement = this.state[key] as StatefulValue<unknown>;
      this.updateStatefulValue({
        key: key,
        value: stateElement.baseline,
        updateCurrent: true
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
        this.setState({ autoPilotThroughput: originalAutoPilotMaxThroughput });
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

  private toggleScale = (): void => {
    this.setState({ scaleExpanded: !this.state.scaleExpanded });
  };

  private toggleSettings = (): void => {
    if (this.hasDatabaseSharedThroughput()) {
      return;
    }
    this.setState({ settingsExpanded: !this.state.settingsExpanded }, () => {
      if (this.state.settingsExpanded && !this.state.isIndexingPolicyEditorInitializing) {
        this.createIndexingPolicyEditor();
      }
    });
  };

  private toggleConflictResolution = (): void => {
    this.setState({ conflictResolutionExpanded: !this.state.conflictResolutionExpanded });
  };

  private onTtlOffKeyPress = (): void => {
    this.updateStatefulValue({key: StatefulValueNames.TimeToLive, value: "off", updateCurrent: true})
  };

  private onTtlOnNoDefaultKeyPress = (): void => {
    this.updateStatefulValue({key: StatefulValueNames.TimeToLive, value: "on-nodefault", updateCurrent: true})
  };

  private onTtlOnKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.TimeToLive, value: "on", updateCurrent: true})
  };

  private onGeographyKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.GeospatialConfigType, value: SettingsComponent.GEOGRAPHY, updateCurrent: true})
  };

  private onGeometryKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.GeospatialConfigType, value: SettingsComponent.GEOMETRY, updateCurrent: true})
  };

  private onAnalyticalStorageTtlOnNoDefaultKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.AnalyticalStorageTtlSelection, value: "on-nodefault", updateCurrent: true})
  };

  private onAnalyticalStorageTtlOnKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.AnalyticalStorageTtlSelection, value: "on", updateCurrent: true})
  };

  private onChangeFeedPolicyOffKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.ChangeFeedPolicyToggled, value: ChangeFeedPolicyToggledState.Off, updateCurrent: true})
  };

  private onChangeFeedPolicyOnKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.ChangeFeedPolicyToggled, value: ChangeFeedPolicyToggledState.On, updateCurrent: true})
  };

  private onConflictResolutionCustomKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.ConflictResolutionPolicyMode, value: DataModels.ConflictResolutionMode.Custom, updateCurrent: true})
  };

  private onConflictResolutionLWWKeyPress = (event: React.KeyboardEvent<HTMLLabelElement>): void => {
    this.updateStatefulValue({key: StatefulValueNames.ConflictResolutionPolicyMode, value: DataModels.ConflictResolutionMode.LastWriterWins, updateCurrent: true})
  };

  private onConflictResolutionChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyMode,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onRupmChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.Rupm,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onConflictResolutionPolicyPathChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyPath,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onConflictResolutionPolicyProcedureChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyProcedure,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onTimeToLiveChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLive,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onTimeToLiveSecondsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLiveSeconds,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onGeoSpatialConfigTypeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.GeospatialConfigType,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onAnalyticalStorageTtlSelectionChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.AnalyticalStorageTtlSelection,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onAnalyticalStorageTtlSecondsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.AnalyticalStorageTtlSeconds,
      value: event.currentTarget.value,
      updateCurrent: true
    });
  };

  private onChangeFeedPolicyToggled = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.ChangeFeedPolicyToggled,
      value: ChangeFeedPolicyToggledState[event.currentTarget.value as ChangeFeedPolicyToggledState],
      updateCurrent: true
    });
  };

  private getThroughputUnit = (): string => {
    return this.state.rupm.current === Constants.RUPMStates.on ? "RU/m" : "RU/s";
  };

  private getAnalyticalStorageTtl = (): number => {
    if (this.isAnalyticalStorageEnabled) {
      if (this.state.analyticalStorageTtlSelection.current === "on") {
        return Number(this.state.analyticalStorageTtlSeconds.current);
      } else {
        return Constants.AnalyticalStorageTtl.Infinite;
      }
    }
    return undefined;
  };

  private getUpdatedConflictResolutionPolicy = (): DataModels.ConflictResolutionPolicy => {
    if (
      !isDirty(this.state.conflictResolutionPolicyMode) &&
      !isDirty(this.state.conflictResolutionPolicyPath) &&
      !isDirty(this.state.conflictResolutionPolicyProcedure)
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
        timeToLive = "off";
        timeToLiveSeconds = SettingsComponent.sixMonthsInSeconds;
        break;
      case -1:
        timeToLive = "on-nodefault";
        timeToLiveSeconds = SettingsComponent.sixMonthsInSeconds;
        break;
      default:
        timeToLive = "on";
        timeToLiveSeconds = defaultTtl;
        break;
    }

    if (this.isAnalyticalStorageEnabled) {
      const analyticalStorageTtl: number = this.collection.analyticalStorageTtl();
      if (analyticalStorageTtl === Constants.AnalyticalStorageTtl.Infinite) {
        this.updateStatefulValue({
          key: StatefulValueNames.AnalyticalStorageTtlSelection,
          value: "on-nodefault",
          updateCurrent: true,
          updateBaseline: true
        });
      } else {
        this.updateStatefulValue({
          key: StatefulValueNames.AnalyticalStorageTtlSelection,
          value: "on",
          updateCurrent: true,
          updateBaseline: true
        });
        this.updateStatefulValue({
          key: StatefulValueNames.AnalyticalStorageTtlSeconds,
          value: analyticalStorageTtl,
          updateCurrent: true,
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
      updateCurrent: true,
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
      updateCurrent: true,
      updateBaseline: true
    });

    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLive,
      value: timeToLive,
      updateCurrent: true,
      updateBaseline: true
    });

    this.updateStatefulValue({
      key: StatefulValueNames.TimeToLiveSeconds,
      value: timeToLiveSeconds,
      updateCurrent: true,
      updateBaseline: true
    });

    this.updateStatefulValue({
      key: StatefulValueNames.IndexingPolicyContent,
      value: this.collection.indexingPolicy(),
      updateCurrent: true,
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
      updateCurrent: true,
      updateBaseline: true
    });

    const conflictResolutionPolicyPath = conflictResolutionPolicy && conflictResolutionPolicy.conflictResolutionPath;
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyPath,
      value: conflictResolutionPolicyPath,
      updateCurrent: true,
      updateBaseline: true
    });

    const conflictResolutionPolicyProcedure = SettingsComponent.parseConflictResolutionProcedure(
      conflictResolutionPolicy && conflictResolutionPolicy.conflictResolutionProcedure
    );
    this.updateStatefulValue({
      key: StatefulValueNames.ConflictResolutionPolicyProcedure,
      value: conflictResolutionPolicyProcedure,
      updateCurrent: true,
      updateBaseline: true
    });

    const rupm = offerIsRUPerMinuteThroughputEnabled ? Constants.RUPMStates.on : Constants.RUPMStates.off;
    this.updateStatefulValue({ key: StatefulValueNames.Rupm, value: rupm, updateCurrent: true, updateBaseline: true });

    const indexingPolicyContent = this.collection.indexingPolicy();
    this.updateStatefulValue({
      key: StatefulValueNames.IndexingPolicyContent,
      value: indexingPolicyContent,
      updateCurrent: true,
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
      SettingsComponent.GEOMETRY;

    this.updateStatefulValue({
      key: StatefulValueNames.GeospatialConfigType,
      value: geospatialConfigType,
      updateCurrent: true,
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

      this.setState({ autoPilotThroughput: maxThroughput || AutoPilotUtils.minAutoPilotThroughput });
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
      const parsed: unknown = JSON.parse(indexingPolicyEditorModel.getValue());
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
    this.setState({ autoPilotThroughput: newThroughput });
  };

  private setThroughput = (newThroughput: number): void => {
    this.updateStatefulValue({
      key: StatefulValueNames.Throughput,
      value: newThroughput,
      updateCurrent: true
    });
  };

  private setAutoPilotSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ isAutoPilotSelected: e.currentTarget.value === "true" });
  };

  private setAutoPilotTier = (selectedAutoPilotTier: DataModels.AutopilotTier): void => {
    this.setState({ selectedAutoPilotTier });
  };

  public render(): JSX.Element {
    return (
      <div className="tab-pane flexContainer" id={this.tabId} role="tabpanel">
        {this.shouldShowStatusBar() && (
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
        )}
        <div className="tabForm scaleSettingScrollable">
          {this.shouldShowKeyspaceSharedThroughputMessage() && (
            <div>This table shared throughput is configured at the keyspace</div>
          )}

          {!this.hasDatabaseSharedThroughput() && (
            <>
              <AccessibleElement
                as="div"
                className="scaleDivison"
                onClick={this.toggleScale}
                onActivated={this.toggleScale}
                aria-expanded={this.state.scaleExpanded}
                role="button"
                tabIndex={0}
                aria-label="Scale"
                aria-controls="scaleRegion"
              >
                {!this.state.scaleExpanded && (
                  <span className="themed-images" id="ExpandChevronRightScale">
                    <img
                      className="imgiconwidth ssExpandCollapseIcon ssCollapseIcon "
                      src={TriangleRight}
                      alt="Show scale properties"
                    />
                  </span>
                )}

                {this.state.scaleExpanded && (
                  <span className="themed-images" id="ExpandChevronDownScale">
                    <img
                      className="imgiconwidth ssExpandCollapseIcon "
                      src={TriangleDown}
                      alt="Hide scale properties"
                    />
                  </span>
                )}

                <span className="scaleSettingTitle">Scale</span>
              </AccessibleElement>

              {this.state.scaleExpanded && (
                <div className="ssTextAllignment" id="scaleRegion">
                  {!this.isAutoScaleEnabled() && (
                    <>
                      {!this.hasAutoPilotV2FeatureFlag && (
                        <ThroughputInputAutoPilotV3Component
                          testId={this.testId}
                          throughput={this.state.throughput}
                          setThroughput={this.setThroughput}
                          minimum={this.getMinRUs()}
                          maximum={this.getMaxRUThroughputInputLimit()}
                          isEnabled={!this.hasDatabaseSharedThroughput()}
                          canExceedMaximumValue={this.canThroughputExceedMaximumValue()}
                          label={this.getThroughputTitle()}
                          ariaLabel={this.getThroughputAriaLabel()}
                          costsVisible={this.costsVisible}
                          requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
                          throughputAutoPilotRadioId={this.throughputAutoPilotRadioId}
                          throughputProvisionedRadioId={this.throughputProvisionedRadioId}
                          throughputModeRadioName={this.throughputModeRadioName}
                          showAutoPilot={this.state.userCanChangeProvisioningTypes}
                          isAutoPilotSelected={this.state.isAutoPilotSelected}
                          setAutoPilotSelected={this.setAutoPilotSelected}
                          maxAutoPilotThroughput={this.state.autoPilotThroughput}
                          setMaxAutoPilotThroughput={this.setMaxAutoPilotThroughput}
                          autoPilotUsageCost={this.getAutoPilotUsageCost()}
                          overrideWithAutoPilotSettings={this.overrideWithAutoPilotSettings()}
                          overrideWithProvisionedThroughputSettings={this.overrideWithProvisionedThroughputSettings()}
                        />
                      )}
                      {this.hasAutoPilotV2FeatureFlag && (
                        <ThroughputInputComponent
                          testId={this.testId}
                          showAsMandatory={false}
                          isFixed={false}
                          throughput={this.state.throughput}
                          setThroughput={this.setThroughput}
                          minimum={this.getMinRUs()}
                          maximum={this.getMaxRUThroughputInputLimit()}
                          isEnabled={!this.hasDatabaseSharedThroughput()}
                          canExceedMaximumValue={this.canThroughputExceedMaximumValue() || this.canExceedMaximumValue}
                          label={this.getThroughputTitle()}
                          ariaLabel={this.getThroughputAriaLabel()}
                          costsVisible={this.costsVisible}
                          requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
                          throughputAutoPilotRadioId={this.throughputAutoPilotRadioId}
                          throughputProvisionedRadioId={this.throughputProvisionedRadioId}
                          throughputModeRadioName={this.throughputModeRadioName}
                          showAutoPilot={this.state.userCanChangeProvisioningTypes}
                          isAutoPilotSelected={this.state.isAutoPilotSelected}
                          setAutoPilotSelected={this.setAutoPilotSelected}
                          autoPilotTiersList={this.state.autoPilotTiersList}
                          selectedAutoPilotTier={this.state.selectedAutoPilotTier}
                          setAutoPilotTier={this.setAutoPilotTier}
                          autoPilotUsageCost={this.getAutoPilotUsageCost()}
                        />
                      )}
                      <div
                        className="storageCapacityTitle throughputStorageValue"
                      >
                        {this.getStorageCapacityTitle()}
                      </div>
                    </>
                  )}

                  {this.isRupmVisible() && (
                    <>
                      <div className="formTitle">RU/m</div>
                      <div className="tabs" aria-label="RU/m">
                        <div className="tab">
                          <label
                            htmlFor={this.rupmOnId}
                            className={`${isDirty(this.state.rupm) ? "dirty" : ""} ${
                              this.state.rupm.current === "on" ? "selectedRadio" : "unselectedRadio"
                            }`}
                          >
                            On
                          </label>
                          <input
                            type="radio"
                            name="rupm"
                            value="on"
                            className="radio"
                            onChange={this.onRupmChange}
                            id={this.rupmOnId}
                            checked={this.state.rupm.current === "on"}
                          />
                        </div>
                        <div className="tab">
                          <label
                            htmlFor={this.rupmOffId}
                            className={`${isDirty(this.state.rupm) ? "dirty" : ""} ${
                              this.state.rupm.current === "off" ? "selectedRadio" : "unselectedRadio"
                            }`}
                          >
                            Off
                          </label>
                          <input
                            type="radio"
                            name="rupm"
                            value="off"
                            className="radio"
                            id={this.rupmOffId}
                            onChange={this.onRupmChange}
                            checked={this.state.rupm.current === "off"}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/*<!-- TODO: Replace link with call to the Azure Support blade -->*/}
                  {this.isAutoScaleEnabled() && (
                    <div>
                      <div className="autoScaleThroughputTitle">Throughput (RU/s)</div>
                      <input className="formReadOnly collid-white" readOnly aria-label="Throughput input" />
                      <div className="autoScaleDescription">
                        Your account has custom settings that prevents setting throughput at the container level. Please
                        work with your Cosmos DB engineering team point of contact to make changes.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {this.hasConflictResolution() && (
            <>
              <AccessibleElement
                as="div"
                className="formTitle"
                onClick={this.toggleConflictResolution}
                onActivated={this.toggleConflictResolution}
                aria-expanded={this.state.conflictResolutionExpanded}
                role="button"
                tabIndex={0}
                aria-label="Conflict Resolution"
                aria-controls="conflictResolutionRegion"
              >
                {!this.state.conflictResolutionExpanded && (
                  <span className="themed-images" id="ExpandChevronRightConflictResolution">
                    <img
                      className="imgiconwidth ssExpandCollapseIcon ssCollapseIcon"
                      src={TriangleRight}
                      alt="Show conflict resolution"
                    />
                  </span>
                )}

                {this.state.conflictResolutionExpanded && (
                  <span className="themed-images" id="ExpandChevronDownConflictResolution">
                    <img
                      className="imgiconwidth ssExpandCollapseIcon"
                      src={TriangleDown}
                      alt="Show conflict resolution"
                    />
                  </span>
                )}
                <span className="scaleSettingTitle">Conflict resolution</span>
              </AccessibleElement>
              {this.state.conflictResolutionExpanded && (
                <div id="conflictResolutionRegion" className="ssTextAllignment">
                  <div className="formTitle">Mode</div>
                  <div className="tabs" aria-label="Mode" role="radiogroup">
                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="ConflictResolutionLWWLabel"
                        tabIndex={0}
                        role="radio"
                        aria-checked={
                          this.state.conflictResolutionPolicyMode.current !== "LastWriterWins" ? "true" : "false"
                        }
                        className={`${isDirty(this.state.conflictResolutionPolicyMode) ? "dirty" : ""} ${
                          this.state.conflictResolutionPolicyMode.current === "LastWriterWins"
                            ? "selectedRadio"
                            : "unselectedRadio"
                        }`}
                        onActivated={this.onConflictResolutionLWWKeyPress}
                      >
                        Last Write Wins (default)
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="conflictresolution"
                        value="LastWriterWins"
                        className="radio"
                        id={this.conflictResolutionPolicyModeLWW}
                        onChange={this.onConflictResolutionChange}
                        checked={this.state.conflictResolutionPolicyMode.current === "LastWriterWins"}
                      />
                    </div>

                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="ConflictResolutionCutomLabel"
                        tabIndex={0}
                        role="radio"
                        aria-checked={this.state.conflictResolutionPolicyMode.current === "Custom" ? "true" : "false"}
                        className={`${isDirty(this.state.conflictResolutionPolicyMode) ? "dirty" : ""} ${
                          this.state.conflictResolutionPolicyMode.current === "Custom"
                            ? "selectedRadio"
                            : "unselectedRadio"
                        }`}
                        onActivated={this.onConflictResolutionCustomKeyPress}
                      >
                        Merge Procedure (custom)
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="conflictresolution"
                        value="Custom"
                        className="radio"
                        id={this.conflictResolutionPolicyModeCustom}
                        onChange={this.onConflictResolutionChange}
                        checked={this.state.conflictResolutionPolicyMode.current === "Custom"}
                      />
                    </div>
                  </div>
                  {this.state.conflictResolutionPolicyMode.current === "LastWriterWins" && (
                    <>
                      <p className="formTitle">
                        Conflict Resolver Property
                        <span className="infoTooltip" role="tooltip" tabIndex={0}>
                          <img className="infoImg" src={InfoBubble} alt="More information" />
                          <span className="tooltiptext infoTooltipWidth">
                            Gets or sets the name of a integer property in your documents which is used for the Last
                            Write Wins (LWW) based conflict resolution scheme. By default, the system uses the system
                            defined timestamp property, _ts to decide the winner for the conflicting versions of the
                            document. Specify your own integer property if you want to override the default timestamp
                            based conflict resolution.
                          </span>
                        </span>
                      </p>
                      <p>
                        <input
                          type="text"
                          aria-label="Document path for conflict resolution"
                          value={
                            this.state.conflictResolutionPolicyPath.current === undefined
                              ? ""
                              : this.state.conflictResolutionPolicyPath.current
                          }
                          className={`${isDirty(this.state.conflictResolutionPolicyPath) ? "dirty" : ""}`}
                          onChange={this.onConflictResolutionPolicyPathChange}
                        />
                      </p>
                    </>
                  )}
                  {this.state.conflictResolutionPolicyMode.current === "Custom" && (
                    <>
                      <p className="formTitle">
                        Stored procedure
                        <span className="infoTooltip" role="tooltip" tabIndex={0}>
                          <img className="infoImg" src={InfoBubble} alt="More information" />
                          <span className="tooltiptext infoTooltipWidth">
                            Gets or sets the name of a stored procedure (aka merge procedure) for resolving the
                            conflicts. You can write application defined logic to determine the winner of the
                            conflicting versions of a document. The stored procedure will get executed transactionally,
                            exactly once, on the server side. If you do not provide a stored procedure, the conflicts
                            will be populated in the
                            <a
                              className="linkDarkBackground"
                              href="https://aka.ms/dataexplorerconflics"
                              // eslint-disable-next-line react/jsx-no-target-blank
                              target="_blank"
                            >
                              {` conflicts feed`}
                            </a>
                            . You can update/re-register the stored procedure at any time.
                          </span>
                        </span>
                      </p>
                      <p>
                        <input
                          type="text"
                          aria-label="Stored procedure name for conflict resolution"
                          value={
                            this.state.conflictResolutionPolicyProcedure.current == undefined
                              ? ""
                              : this.state.conflictResolutionPolicyProcedure.current
                          }
                          className={`${isDirty(this.state.conflictResolutionPolicyProcedure) ? "dirty" : ""}`}
                          onChange={this.onConflictResolutionPolicyProcedureChange}
                        />
                      </p>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {(this.shouldShowIndexingPolicyEditor || this.ttlVisible) && (
            <AccessibleElement
              as="div"
              className="formTitle"
              onClick={this.toggleSettings}
              onActivated={this.toggleSettings}
              aria-expanded={this.state.settingsExpanded}
              role="button"
              tabIndex={0}
              aria-label="Settings"
              aria-controls="settingsRegion"
            >
              {!this.state.settingsExpanded && !this.hasDatabaseSharedThroughput() && (
                <span className="themed-images" id="ExpandChevronRightSettings">
                  <img
                    className="imgiconwidth ssExpandCollapseIcon ssCollapseIcon"
                    src={TriangleRight}
                    alt="Show settings"
                  />
                </span>
              )}

              {this.state.settingsExpanded && !this.hasDatabaseSharedThroughput() && (
                <span className="themed-images" id="ExpandChevronDownSettings">
                  <img className="imgiconwidth ssExpandCollapseIcon" src={TriangleDown} alt="Show settings" />
                </span>
              )}
              <span className="scaleSettingTitle">Settings</span>
            </AccessibleElement>
          )}
          {this.state.settingsExpanded && (
            <div className="ssTextAllignment" id="settingsRegion">
              {this.ttlVisible && (
                <>
                  <div className="formTitle">Time to Live</div>
                  <div className="tabs disableFocusDefaults" aria-label="Time to Live" role="radiogroup">
                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        tabIndex={0}
                        aria-label="ttlOffLable"
                        role="radio"
                        aria-checked={this.state.timeToLive.current === "off" ? "true" : false}
                        className={`ttlIndexingPolicyFocusElement ${isDirty(this.state.timeToLive) ? "dirty" : ""} ${
                          this.state.timeToLive.current === "off" ? "selectedRadio" : "unselectedRadio"
                        }`}
                        onActivated={this.onTtlOffKeyPress}
                        onFocus={() => {
                          this.setState({ ttlOffFocused: true, ttlOnFocused: false, ttlOnDefaultFocused: false });
                        }}
                      >
                        Off
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="ttl"
                        value="off"
                        className="radio"
                        id={this.ttlOffId}
                        checked={this.state.timeToLive.current === "off"}
                        onChange={this.onTimeToLiveChange}
                      />
                    </div>

                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        tabIndex={0}
                        aria-label="ttlOnNoDefaultLabel"
                        role="radio"
                        aria-checked={this.state.timeToLive.current === "on-nodefault" ? "true" : "false"}
                        className={`ttlIndexingPolicyFocusElement ${isDirty(this.state.timeToLive) ? "dirty" : ""} ${
                          this.state.timeToLive.current === "on-nodefault" ? "selectedRadio" : "unselectedRadio"
                        }`}
                        onActivated={this.onTtlOnNoDefaultKeyPress}
                        onFocus={() => {
                          this.setState({ ttlOffFocused: false, ttlOnFocused: false, ttlOnDefaultFocused: true });
                        }}
                      >
                        On (no default)
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="ttl"
                        value="on-nodefault"
                        className="radio"
                        id={this.ttlOnNoDefaultId}
                        checked={this.state.timeToLive.current === "on-nodefault"}
                        onChange={this.onTimeToLiveChange}
                      />
                    </div>

                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        tabIndex={0}
                        aria-label="ttlOnLabel"
                        role="radio"
                        aria-checked={this.state.timeToLive.current === "on" ? "true" : "false"}
                        className={`ttlIndexingPolicyFocusElement ${isDirty(this.state.timeToLive) ? "dirty" : ""} ${
                          this.state.timeToLive.current === "on" ? "selectedRadio" : "unselectedRadio"
                        }`}
                        onActivated={this.onTtlOnKeyPress}
                        onFocus={() => {
                          this.setState({ ttlOffFocused: false, ttlOnFocused: true, ttlOnDefaultFocused: false });
                        }}
                      >
                        On
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="ttl"
                        value="on"
                        className="radio"
                        id={this.ttlOnId}
                        checked={this.state.timeToLive.current === "on"}
                        onChange={this.onTimeToLiveChange}
                      />
                    </div>
                  </div>
                  {this.state.timeToLive.current === "on" && (
                    <>
                      <input
                        type="number"
                        required
                        min="1"
                        max="2147483647"
                        aria-label="Time to live in seconds"
                        value={this.state.timeToLiveSeconds.current}
                        className={`dirtyTextbox ${isDirty(this.state.timeToLiveSeconds) ? "dirty" : ""}`}
                        disabled={this.state.timeToLive.current !== "on"}
                        onChange={this.onTimeToLiveSecondsChange}
                      />
                      {` second(s)`}
                    </>
                  )}
                </>
              )}

              {/*<!--  Geospatial - start -->*/}
              {this.state.geospatialVisible && (
                <>
                  <div className="formTitle">Geospatial Configuration</div>

                  <div className="tabs disableFocusDefaults" aria-label="Geospatial Configuration" role="radiogroup">
                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="GeospatialGeographyLabel"
                        tabIndex={0}
                        role="radio"
                        aria-checked={
                          this.state.geospatialConfigType.current?.toLowerCase() !==
                          SettingsComponent.GEOMETRY.toLowerCase()
                            ? "true"
                            : "false"
                        }
                        className={`${isDirty(this.state.geospatialConfigType) ? "dirty" : ""} ${
                          this.state.geospatialConfigType.current?.toLowerCase() !==
                          SettingsComponent.GEOMETRY.toLowerCase()
                            ? "selectedRadio"
                            : "unselectedRadio"
                        }`}
                        onActivated={this.onGeographyKeyPress}
                      >
                        Geography
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="geospatial"
                        id="geography"
                        className="radio"
                        value={SettingsComponent.GEOGRAPHY}
                        onChange={this.onGeoSpatialConfigTypeChange}
                        checked={this.state.geospatialConfigType.current?.toLowerCase() === SettingsComponent.GEOGRAPHY}
                      />
                    </div>

                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="GeospatialGeometryLabel"
                        tabIndex={0}
                        role="radio"
                        aria-checked={
                          this.state.geospatialConfigType.current?.toLowerCase() ===
                          SettingsComponent.GEOMETRY.toLowerCase()
                            ? "true"
                            : "false"
                        }
                        className={`${isDirty(this.state.geospatialConfigType) ? "dirty" : ""} ${
                          this.state.geospatialConfigType.current?.toLowerCase() ===
                          SettingsComponent.GEOMETRY.toLowerCase()
                            ? "selectedRadio"
                            : "unselectedRadio"
                        }`}
                        onActivated={this.onGeometryKeyPress}
                      >
                        Geometry
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="geospatial"
                        id="geometry"
                        className="radio"
                        value={SettingsComponent.GEOMETRY}
                        onChange={this.onGeoSpatialConfigTypeChange}
                        checked={this.state.geospatialConfigType.current?.toLowerCase() === SettingsComponent.GEOMETRY}
                      />
                    </div>
                  </div>
                </>
              )}
              {/*<!-- Geospatial - end -->*/}

              {this.isAnalyticalStorageEnabled && (
                <>
                  <div className="formTitle">Analytical Storage Time to Live</div>
                  <div
                    className="tabs disableFocusDefaults"
                    aria-label="Analytical Storage Time to Live"
                    role="radiogroup"
                  >
                    <div className="tab">
                      <label tabIndex={0} role="radio" className="disabledRadio">
                        Off
                      </label>
                    </div>
                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="AnalyticalStorageTtlOnNoDefaultLabel"
                        tabIndex={0}
                        role="radio"
                        aria-checked={
                          this.state.analyticalStorageTtlSelection.current === "on-nodefault" ? "true" : "false"
                        }
                        className={`${isDirty(this.state.analyticalStorageTtlSelection) ? "dirty" : ""} ${
                          this.state.analyticalStorageTtlSelection.current === "on-nodefault"
                            ? "selectedRadio"
                            : "unselectedRadio"
                        }`}
                        onActivated={this.onAnalyticalStorageTtlOnNoDefaultKeyPress}
                      >
                        On (no default)
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="analyticalStorageTtl"
                        value="on-nodefault"
                        className="radio"
                        id="analyticalStorageTtlOnNoDefaultId"
                        onChange={this.onAnalyticalStorageTtlSelectionChange}
                        checked={this.state.analyticalStorageTtlSelection.current === "on-nodefault"}
                      />
                    </div>

                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="AnalyticalStorageTtlOnLabel"                      
                        tabIndex={0}
                        role="radio"
                        aria-checked={this.state.analyticalStorageTtlSelection.current === "on" ? "true" : "false"}
                        className={`${isDirty(this.state.analyticalStorageTtlSelection) ? "dirty" : ""} ${
                          this.state.analyticalStorageTtlSelection.current === "on"
                            ? "selectedRadio"
                            : "unselectedRadio"
                        }`}
                        onActivated={this.onAnalyticalStorageTtlOnKeyPress}
                      >
                        On
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="analyticalStorageTtl"
                        value="on"
                        className="radio"
                        id="analyticalStorageTtlOnId"
                        onChange={this.onAnalyticalStorageTtlSelectionChange}
                        checked={this.state.analyticalStorageTtlSelection.current === "on"}
                      />
                    </div>
                  </div>
                  {this.state.analyticalStorageTtlSelection.current === "on" && (
                    <>
                      <input
                        type="number"
                        required
                        min="1"
                        max="2147483647"
                        value={
                          this.state.analyticalStorageTtlSeconds.current == undefined
                            ? ""
                            : this.state.analyticalStorageTtlSeconds.current
                        }
                        aria-label="Time to live in seconds"
                        className={`dirtyTextbox ${isDirty(this.state.analyticalStorageTtlSeconds) ? "dirty" : ""}`}
                        onChange={this.onAnalyticalStorageTtlSecondsChange}
                      />
                      {` second(s)`}
                    </>
                  )}
                </>
              )}
              {this.changeFeedPolicyVisible && (
                <>
                  <div className="formTitle">
                    <span>Change feed log retention policy</span>
                    <span className="infoTooltip" role="tooltip" tabIndex={0}>
                      <img className="infoImg" src={InfoBubble} alt="More information" />
                      <span className="tooltiptext infoTooltipWidth">
                        Enable change feed log retention policy to retain last 10 minutes of history for items in the
                        container by default. To support this, the request unit (RU) charge for this container will be
                        multiplied by a factor of two for writes. Reads are unaffected.
                      </span>
                    </span>
                  </div>
                  <div className="tabs disableFocusDefaults" aria-label="Change feed selection tabs">
                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="ChangeFeedPolicyOffLabel"
                        tabIndex={0}
                        className={`${isDirty(this.state.changeFeedPolicyToggled) ? "dirty" : ""} ${
                          this.state.changeFeedPolicyToggled.current === "Off" ? "selectedRadio" : "unselectedRadio"
                        }`}
                        onActivated={this.onChangeFeedPolicyOffKeyPress}
                      >
                        Off
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="changeFeedPolicy"
                        value="Off"
                        className="radio"
                        id={this.changeFeedPolicyOffId}
                        onChange={this.onChangeFeedPolicyToggled}
                        checked={this.state.changeFeedPolicyToggled.current === ChangeFeedPolicyToggledState.Off}
                      />
                    </div>
                    <div className="tab">
                      <AccessibleElement
                        as="label"
                        aria-label="ChangeFeedPolicyOnLabel"
                        tabIndex={0}
                        className={`${isDirty(this.state.changeFeedPolicyToggled) ? "dirty" : ""} ${
                          this.state.changeFeedPolicyToggled.current === "On" ? "selectedRadio" : "unselectedRadio"
                        }`}
                        onActivated={this.onChangeFeedPolicyOnKeyPress}
                      >
                        On
                      </AccessibleElement>
                      <input
                        type="radio"
                        name="changeFeedPolicy"
                        value="On"
                        className="radio"
                        id={this.changeFeedPolicyOnId}
                        onChange={this.onChangeFeedPolicyToggled}
                        checked={this.state.changeFeedPolicyToggled.current === ChangeFeedPolicyToggledState.On}
                      />
                    </div>
                  </div>
                </>
              )}

              {this.getPartitionKeyVisible() && (
                <>
                  <div className="formTitle">Partition Key</div>
                  <input
                    className="formReadOnly collid-white"
                    aria-label={this.partitionKeyName}
                    defaultValue={this.partitionKeyValue}
                    readOnly
                  />
                </>
              )}

              {this.isLargePartitionKeyEnabled() && (
                <div className="largePartitionKeyEnabled">
                  <p>
                    Large <span>{this.getLowerCasePartitionKeyName()}</span> has been enabled
                  </p>
                </div>
              )}

              {this.shouldShowIndexingPolicyEditor && (
                <>
                  <div className="formTitle">Indexing Policy</div>
                  <div
                    key="indexingPolicyEditorDiv"
                    className="indexingPolicyEditor ttlIndexingPolicyFocusElement"
                    tabIndex={0}
                    ref={this.indexingPolicyDiv}
                  ></div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
