import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import { traceStart, traceFailure, traceSuccess, trace } from "../../../Shared/Telemetry/TelemetryProcessor";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import Explorer from "../../Explorer";
import { updateOffer } from "../../../Common/dataAccess/updateOffer";
import { updateCollection, updateMongoDBCollectionThroughRP } from "../../../Common/dataAccess/updateCollection";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import SettingsTab from "../../Tabs/SettingsTabV2";
import { mongoIndexingPolicyAADError } from "./SettingsRenderUtils";
import { ScaleComponent, ScaleComponentProps } from "./SettingsSubComponents/ScaleComponent";
import {
  MongoIndexingPolicyComponent,
  MongoIndexingPolicyComponentProps,
} from "./SettingsSubComponents/MongoIndexingPolicy/MongoIndexingPolicyComponent";
import {
  hasDatabaseSharedThroughput,
  GeospatialConfigType,
  TtlType,
  ChangeFeedPolicyState,
  SettingsV2TabTypes,
  getTabTitle,
  isDirty,
  AddMongoIndexProps,
  MongoIndexTypes,
  parseConflictResolutionMode,
  parseConflictResolutionProcedure,
  getMongoNotification,
} from "./SettingsUtils";
import {
  ConflictResolutionComponent,
  ConflictResolutionComponentProps,
} from "./SettingsSubComponents/ConflictResolutionComponent";
import { SubSettingsComponent, SubSettingsComponentProps } from "./SettingsSubComponents/SubSettingsComponent";
import { Pivot, PivotItem, IPivotProps, IPivotItemProps } from "office-ui-fabric-react";
import "./SettingsComponent.less";
import { IndexingPolicyComponent, IndexingPolicyComponentProps } from "./SettingsSubComponents/IndexingPolicyComponent";
import { MongoDBCollectionResource, MongoIndex } from "../../../Utils/arm/generatedClients/2020-04-01/types";
import { readMongoDBCollectionThroughRP } from "../../../Common/dataAccess/readMongoDBCollection";
import { getIndexTransformationProgress } from "../../../Common/dataAccess/getIndexTransformationProgress";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { isEmpty } from "underscore";

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

export interface SettingsComponentState {
  throughput: number;
  throughputBaseline: number;
  autoPilotThroughput: number;
  autoPilotThroughputBaseline: number;
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  isScaleSaveable: boolean;
  isScaleDiscardable: boolean;

  timeToLive: TtlType;
  timeToLiveBaseline: TtlType;
  timeToLiveSeconds: number;
  timeToLiveSecondsBaseline: number;
  geospatialConfigType: GeospatialConfigType;
  geospatialConfigTypeBaseline: GeospatialConfigType;
  analyticalStorageTtlSelection: TtlType;
  analyticalStorageTtlSelectionBaseline: TtlType;
  analyticalStorageTtlSeconds: number;
  analyticalStorageTtlSecondsBaseline: number;
  changeFeedPolicy: ChangeFeedPolicyState;
  changeFeedPolicyBaseline: ChangeFeedPolicyState;
  isSubSettingsSaveable: boolean;
  isSubSettingsDiscardable: boolean;

  indexingPolicyContent: DataModels.IndexingPolicy;
  indexingPolicyContentBaseline: DataModels.IndexingPolicy;
  shouldDiscardIndexingPolicy: boolean;
  isIndexingPolicyDirty: boolean;

  isMongoIndexingPolicySaveable: boolean;
  isMongoIndexingPolicyDiscardable: boolean;
  currentMongoIndexes: MongoIndex[];
  indexesToDrop: number[];
  indexesToAdd: AddMongoIndexProps[];
  indexTransformationProgress: number;

  conflictResolutionPolicyMode: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyModeBaseline: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyPath: string;
  conflictResolutionPolicyPathBaseline: string;
  conflictResolutionPolicyProcedure: string;
  conflictResolutionPolicyProcedureBaseline: string;
  isConflictResolutionDirty: boolean;

  initialNotification: DataModels.Notification;
  selectedTab: SettingsV2TabTypes;
}

export class SettingsComponent extends React.Component<SettingsComponentProps, SettingsComponentState> {
  private static readonly sixMonthsInSeconds = 15768000;
  private saveSettingsButton: ButtonV2;
  private discardSettingsChangesButton: ButtonV2;

  private isAnalyticalStorageEnabled: boolean;
  private collection: ViewModels.Collection;
  private container: Explorer;
  private changeFeedPolicyVisible: boolean;
  private isFixedContainer: boolean;
  private shouldShowIndexingPolicyEditor: boolean;
  public mongoDBCollectionResource: MongoDBCollectionResource;

  constructor(props: SettingsComponentProps) {
    super(props);

    this.collection = this.props.settingsTab.collection as ViewModels.Collection;
    this.container = this.collection?.container;
    this.isAnalyticalStorageEnabled = !!this.collection?.analyticalStorageTtl();
    this.shouldShowIndexingPolicyEditor =
      this.container && !this.container.isPreferredApiCassandra() && !this.container.isPreferredApiMongoDB();

    this.changeFeedPolicyVisible = this.collection?.container.isFeatureEnabled(
      Constants.Features.enableChangeFeedPolicy
    );

    // Mongo container with system partition key still treat as "Fixed"
    this.isFixedContainer =
      this.container.isPreferredApiMongoDB() &&
      (!this.collection.partitionKey || this.collection.partitionKey.systemKey);

    this.state = {
      throughput: undefined,
      throughputBaseline: undefined,
      autoPilotThroughput: undefined,
      autoPilotThroughputBaseline: undefined,
      isAutoPilotSelected: false,
      wasAutopilotOriginallySet: false,
      isScaleSaveable: false,
      isScaleDiscardable: false,

      timeToLive: undefined,
      timeToLiveBaseline: undefined,
      timeToLiveSeconds: undefined,
      timeToLiveSecondsBaseline: undefined,
      geospatialConfigType: undefined,
      geospatialConfigTypeBaseline: undefined,
      analyticalStorageTtlSelection: undefined,
      analyticalStorageTtlSelectionBaseline: undefined,
      analyticalStorageTtlSeconds: undefined,
      analyticalStorageTtlSecondsBaseline: undefined,
      changeFeedPolicy: undefined,
      changeFeedPolicyBaseline: undefined,
      isSubSettingsSaveable: false,
      isSubSettingsDiscardable: false,

      indexingPolicyContent: undefined,
      indexingPolicyContentBaseline: undefined,
      shouldDiscardIndexingPolicy: false,
      isIndexingPolicyDirty: false,

      indexesToDrop: [],
      indexesToAdd: [],
      currentMongoIndexes: undefined,
      isMongoIndexingPolicySaveable: false,
      isMongoIndexingPolicyDiscardable: false,
      indexTransformationProgress: undefined,

      conflictResolutionPolicyMode: undefined,
      conflictResolutionPolicyModeBaseline: undefined,
      conflictResolutionPolicyPath: undefined,
      conflictResolutionPolicyPathBaseline: undefined,
      conflictResolutionPolicyProcedure: undefined,
      conflictResolutionPolicyProcedureBaseline: undefined,
      isConflictResolutionDirty: false,

      initialNotification: undefined,
      selectedTab: SettingsV2TabTypes.ScaleTab,
    };

    this.saveSettingsButton = {
      isEnabled: this.isSaveSettingsButtonEnabled,
      isVisible: () => {
        return true;
      },
    };

    this.discardSettingsChangesButton = {
      isEnabled: this.isDiscardSettingsButtonEnabled,
      isVisible: () => {
        return true;
      },
    };
  }

  componentDidMount(): void {
    this.refreshIndexTransformationProgress();
    this.loadMongoIndexes();
    this.setAutoPilotStates();
    this.setBaseline();
    if (this.props.settingsTab.isActive()) {
      this.props.settingsTab.getSettingsTabContainer().onUpdateTabsButtons(this.getTabsButtons());
    }
  }

  componentDidUpdate(): void {
    if (this.props.settingsTab.isActive()) {
      this.props.settingsTab.getSettingsTabContainer().onUpdateTabsButtons(this.getTabsButtons());
    }
  }

  public loadMongoIndexes = async (): Promise<void> => {
    if (
      this.container.isPreferredApiMongoDB() &&
      this.container.isEnableMongoCapabilityPresent() &&
      this.container.databaseAccount()
    ) {
      this.mongoDBCollectionResource = await readMongoDBCollectionThroughRP(
        this.collection.databaseId,
        this.collection.id()
      );

      if (this.mongoDBCollectionResource) {
        this.setState({
          currentMongoIndexes: [...this.mongoDBCollectionResource.indexes],
        });
      }
    }
  };

  public refreshIndexTransformationProgress = async (): Promise<void> => {
    const currentProgress = await getIndexTransformationProgress(this.collection.databaseId, this.collection.id());
    this.setState({ indexTransformationProgress: currentProgress });
  };

  public isSaveSettingsButtonEnabled = (): boolean => {
    if (this.isOfferReplacePending()) {
      return false;
    }

    return (
      this.state.isScaleSaveable ||
      this.state.isSubSettingsSaveable ||
      this.state.isIndexingPolicyDirty ||
      this.state.isConflictResolutionDirty ||
      (!!this.state.currentMongoIndexes && this.state.isMongoIndexingPolicySaveable)
    );
  };

  public isDiscardSettingsButtonEnabled = (): boolean => {
    return (
      this.state.isScaleDiscardable ||
      this.state.isSubSettingsDiscardable ||
      this.state.isIndexingPolicyDirty ||
      this.state.isConflictResolutionDirty ||
      (!!this.state.currentMongoIndexes && this.state.isMongoIndexingPolicyDiscardable)
    );
  };

  private setAutoPilotStates = (): void => {
    const autoscaleMaxThroughput = this.collection?.offer()?.autoscaleMaxThroughput;

    if (autoscaleMaxThroughput && AutoPilotUtils.isValidAutoPilotThroughput(autoscaleMaxThroughput)) {
      this.setState({
        isAutoPilotSelected: true,
        wasAutopilotOriginallySet: true,
        autoPilotThroughput: autoscaleMaxThroughput,
        autoPilotThroughputBaseline: autoscaleMaxThroughput,
      });
    }
  };

  public hasProvisioningTypeChanged = (): boolean =>
    this.state.wasAutopilotOriginallySet !== this.state.isAutoPilotSelected;

  public shouldShowKeyspaceSharedThroughputMessage = (): boolean =>
    this.container && this.container.isPreferredApiCassandra() && hasDatabaseSharedThroughput(this.collection);

  public hasConflictResolution = (): boolean =>
    this.container?.databaseAccount &&
    this.container.databaseAccount()?.properties?.enableMultipleWriteLocations &&
    this.collection.conflictResolutionPolicy &&
    !!this.collection.conflictResolutionPolicy();

  public isOfferReplacePending = (): boolean => {
    return this.collection?.offer()?.offerReplacePending;
  };

  public onSaveClick = async (): Promise<void> => {
    this.props.settingsTab.isExecutionError(false);

    this.props.settingsTab.isExecuting(true);
    const startKey: number = traceStart(Action.SettingsV2Updated, {
      databaseAccountName: this.container.databaseAccount()?.name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.settingsTab.tabTitle(),
    });

    const newCollection: DataModels.Collection = { ...this.collection.rawDataModel };

    try {
      if (
        this.state.isSubSettingsSaveable ||
        this.state.isIndexingPolicyDirty ||
        this.state.isConflictResolutionDirty
      ) {
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

        const wasIndexingPolicyModified = this.state.isIndexingPolicyDirty;
        newCollection.defaultTtl = defaultTtl;

        newCollection.indexingPolicy = this.state.indexingPolicyContent;

        newCollection.changeFeedPolicy =
          this.changeFeedPolicyVisible && this.state.changeFeedPolicy === ChangeFeedPolicyState.On
            ? {
                retentionDuration: Constants.BackendDefaults.maxChangeFeedRetentionDuration,
              }
            : undefined;

        newCollection.analyticalStorageTtl = this.getAnalyticalStorageTtl();

        newCollection.geospatialConfig = {
          type: this.state.geospatialConfigType,
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

        if (wasIndexingPolicyModified) {
          await this.refreshIndexTransformationProgress();
        }

        this.setState({
          isSubSettingsSaveable: false,
          isSubSettingsDiscardable: false,
          isIndexingPolicyDirty: false,
          isConflictResolutionDirty: false,
        });
      }

      if (this.state.isMongoIndexingPolicySaveable && this.mongoDBCollectionResource) {
        try {
          const newMongoIndexes = this.getMongoIndexesToSave();
          const newMongoCollection: MongoDBCollectionResource = {
            ...this.mongoDBCollectionResource,
            indexes: newMongoIndexes,
          };

          this.mongoDBCollectionResource = await updateMongoDBCollectionThroughRP(
            this.collection.databaseId,
            this.collection.id(),
            newMongoCollection
          );

          await this.refreshIndexTransformationProgress();
          this.setState({
            isMongoIndexingPolicySaveable: false,
            indexesToDrop: [],
            indexesToAdd: [],
            currentMongoIndexes: [...this.mongoDBCollectionResource.indexes],
          });
          traceSuccess(
            Action.MongoIndexUpdated,
            {
              databaseAccountName: this.container.databaseAccount()?.name,
              databaseName: this.collection?.databaseId,
              collectionName: this.collection?.id(),
              defaultExperience: this.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.props.settingsTab.tabTitle(),
            },
            startKey
          );
        } catch (error) {
          traceFailure(
            Action.MongoIndexUpdated,
            {
              databaseAccountName: this.container.databaseAccount()?.name,
              databaseName: this.collection?.databaseId,
              collectionName: this.collection?.id(),
              defaultExperience: this.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.props.settingsTab.tabTitle(),
              error: getErrorMessage(error),
              errorStack: getErrorStack(error),
            },
            startKey
          );
          throw error;
        }
      }

      if (this.state.isScaleSaveable) {
        const updateOfferParams: DataModels.UpdateOfferParams = {
          databaseId: this.collection.databaseId,
          collectionId: this.collection.id(),
          currentOffer: this.collection.offer(),
          autopilotThroughput: this.state.isAutoPilotSelected ? this.state.autoPilotThroughput : undefined,
          manualThroughput: this.state.isAutoPilotSelected ? undefined : this.state.throughput,
        };
        if (this.hasProvisioningTypeChanged()) {
          if (this.state.isAutoPilotSelected) {
            updateOfferParams.migrateToAutoPilot = true;
          } else {
            updateOfferParams.migrateToManual = true;
          }
        }
        const updatedOffer: DataModels.Offer = await updateOffer(updateOfferParams);
        this.collection.offer(updatedOffer);
        this.setState({ isScaleSaveable: false, isScaleDiscardable: false });
        if (this.state.isAutoPilotSelected) {
          this.setState({
            autoPilotThroughput: updatedOffer.autoscaleMaxThroughput,
            autoPilotThroughputBaseline: updatedOffer.autoscaleMaxThroughput,
          });
        } else {
          this.setState({
            throughput: updatedOffer.manualThroughput,
            throughputBaseline: updatedOffer.manualThroughput,
          });
        }
      }
      this.container.isRefreshingExplorer(false);
      this.setBaseline();
      this.setState({ wasAutopilotOriginallySet: this.state.isAutoPilotSelected });
      traceSuccess(
        Action.SettingsV2Updated,
        {
          databaseAccountName: this.container.databaseAccount()?.name,
          databaseName: this.collection?.databaseId,
          collectionName: this.collection?.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle(),
        },
        startKey
      );
    } catch (error) {
      this.container.isRefreshingExplorer(false);
      this.props.settingsTab.isExecutionError(true);
      console.error(error);
      traceFailure(
        Action.SettingsV2Updated,
        {
          databaseAccountName: this.container.databaseAccount()?.name,
          databaseName: this.collection?.databaseId,
          collectionName: this.collection?.id(),
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle(),
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey
      );
    }
    this.props.settingsTab.isExecuting(false);
  };

  public onRevertClick = (): void => {
    trace(Action.SettingsV2Discarded, ActionModifiers.Mark, {
      message: "Settings Discarded",
    });

    this.setState({
      throughput: this.state.throughputBaseline,
      timeToLive: this.state.timeToLiveBaseline,
      timeToLiveSeconds: this.state.timeToLiveSecondsBaseline,
      geospatialConfigType: this.state.geospatialConfigTypeBaseline,
      indexingPolicyContent: this.state.indexingPolicyContentBaseline,
      indexesToAdd: [],
      indexesToDrop: [],
      conflictResolutionPolicyMode: this.state.conflictResolutionPolicyModeBaseline,
      conflictResolutionPolicyPath: this.state.conflictResolutionPolicyPathBaseline,
      conflictResolutionPolicyProcedure: this.state.conflictResolutionPolicyProcedureBaseline,
      analyticalStorageTtlSelection: this.state.analyticalStorageTtlSelectionBaseline,
      analyticalStorageTtlSeconds: this.state.analyticalStorageTtlSecondsBaseline,
      changeFeedPolicy: this.state.changeFeedPolicyBaseline,
      autoPilotThroughput: this.state.autoPilotThroughputBaseline,
      isAutoPilotSelected: this.state.wasAutopilotOriginallySet,
      shouldDiscardIndexingPolicy: true,
      isScaleSaveable: false,
      isScaleDiscardable: false,
      isSubSettingsSaveable: false,
      isSubSettingsDiscardable: false,
      isIndexingPolicyDirty: false,
      isMongoIndexingPolicySaveable: false,
      isMongoIndexingPolicyDiscardable: false,
      isConflictResolutionDirty: false,
    });
  };

  private getMongoIndexesToSave = (): MongoIndex[] => {
    let finalIndexes: MongoIndex[] = [];
    this.state.currentMongoIndexes?.map((mongoIndex: MongoIndex, index: number) => {
      if (!this.state.indexesToDrop.includes(index)) {
        finalIndexes.push(mongoIndex);
      }
    });
    finalIndexes = finalIndexes.concat(this.state.indexesToAdd.map((m: AddMongoIndexProps) => m.mongoIndex));
    return finalIndexes;
  };

  private onScaleSaveableChange = (isScaleSaveable: boolean): void =>
    this.setState({ isScaleSaveable: isScaleSaveable });

  private onScaleDiscardableChange = (isScaleDiscardable: boolean): void =>
    this.setState({ isScaleDiscardable: isScaleDiscardable });

  private onIndexingPolicyContentChange = (newIndexingPolicy: DataModels.IndexingPolicy): void =>
    this.setState({ indexingPolicyContent: newIndexingPolicy });

  private resetShouldDiscardIndexingPolicy = (): void => this.setState({ shouldDiscardIndexingPolicy: false });

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
          tabTitle: this.props.settingsTab.tabTitle(),
        },
        this.props.settingsTab.onLoadStartKey
      );
      this.props.settingsTab.onLoadStartKey = undefined;
    }
  };

  private onIndexDrop = (index: number): void => this.setState({ indexesToDrop: [...this.state.indexesToDrop, index] });

  private onRevertIndexDrop = (index: number): void => {
    const indexesToDrop = [...this.state.indexesToDrop];
    indexesToDrop.splice(index, 1);
    this.setState({ indexesToDrop });
  };

  private onRevertIndexAdd = (index: number): void => {
    const indexesToAdd = [...this.state.indexesToAdd];
    indexesToAdd.splice(index, 1);
    this.setState({ indexesToAdd });
  };

  private onIndexAddOrChange = (index: number, description: string, type: MongoIndexTypes): void => {
    const newIndexesToAdd = [...this.state.indexesToAdd];
    const notification = getMongoNotification(description, type);
    const newMongoIndexWithType: AddMongoIndexProps = {
      mongoIndex: { key: { keys: [description] } } as MongoIndex,
      type: type,
      notification: notification,
    };
    if (index === newIndexesToAdd.length) {
      newIndexesToAdd.push(newMongoIndexWithType);
    } else {
      newIndexesToAdd[index] = newMongoIndexWithType;
    }
    this.setState({ indexesToAdd: newIndexesToAdd });
  };

  private onConflictResolutionPolicyModeChange = (newMode: DataModels.ConflictResolutionMode): void =>
    this.setState({ conflictResolutionPolicyMode: newMode });

  private onConflictResolutionPolicyPathChange = (newPath: string): void =>
    this.setState({ conflictResolutionPolicyPath: newPath });

  private onConflictResolutionPolicyProcedureChange = (newProcedure: string): void =>
    this.setState({ conflictResolutionPolicyProcedure: newProcedure });

  private onConflictResolutionDirtyChange = (isConflictResolutionDirty: boolean): void =>
    this.setState({ isConflictResolutionDirty: isConflictResolutionDirty });

  private onTtlChange = (newTtl: TtlType): void => this.setState({ timeToLive: newTtl });

  private onTimeToLiveSecondsChange = (newTimeToLiveSeconds: number): void =>
    this.setState({ timeToLiveSeconds: newTimeToLiveSeconds });

  private onGeoSpatialConfigTypeChange = (newGeoSpatialConfigType: GeospatialConfigType): void =>
    this.setState({ geospatialConfigType: newGeoSpatialConfigType });

  private onAnalyticalStorageTtlSelectionChange = (newAnalyticalStorageTtlSelection: TtlType): void =>
    this.setState({ analyticalStorageTtlSelection: newAnalyticalStorageTtlSelection });

  private onAnalyticalStorageTtlSecondsChange = (newAnalyticalStorageTtlSeconds: number): void =>
    this.setState({ analyticalStorageTtlSeconds: newAnalyticalStorageTtlSeconds });

  private onChangeFeedPolicyChange = (newChangeFeedPolicy: ChangeFeedPolicyState): void =>
    this.setState({ changeFeedPolicy: newChangeFeedPolicy });

  private onSubSettingsSaveableChange = (isSubSettingsSaveable: boolean): void =>
    this.setState({ isSubSettingsSaveable: isSubSettingsSaveable });

  private onSubSettingsDiscardableChange = (isSubSettingsDiscardable: boolean): void =>
    this.setState({ isSubSettingsDiscardable: isSubSettingsDiscardable });

  private onIndexingPolicyDirtyChange = (isIndexingPolicyDirty: boolean): void =>
    this.setState({ isIndexingPolicyDirty: isIndexingPolicyDirty });

  private onMongoIndexingPolicySaveableChange = (isMongoIndexingPolicySaveable: boolean): void =>
    this.setState({ isMongoIndexingPolicySaveable });

  private onMongoIndexingPolicyDiscardableChange = (isMongoIndexingPolicyDiscardable: boolean): void =>
    this.setState({ isMongoIndexingPolicyDiscardable });

  public getAnalyticalStorageTtl = (): number => {
    if (this.isAnalyticalStorageEnabled) {
      if (this.state.analyticalStorageTtlSelection === TtlType.On) {
        return Number(this.state.analyticalStorageTtlSeconds);
      } else {
        return Constants.AnalyticalStorageTtl.Infinite;
      }
    }
    return undefined;
  };

  public getUpdatedConflictResolutionPolicy = (): DataModels.ConflictResolutionPolicy => {
    if (
      !isDirty(this.state.conflictResolutionPolicyMode, this.state.conflictResolutionPolicyModeBaseline) &&
      !isDirty(this.state.conflictResolutionPolicyPath, this.state.conflictResolutionPolicyPathBaseline) &&
      !isDirty(this.state.conflictResolutionPolicyProcedure, this.state.conflictResolutionPolicyProcedureBaseline)
    ) {
      return undefined;
    }

    const policy: DataModels.ConflictResolutionPolicy = {
      mode: parseConflictResolutionMode(this.state.conflictResolutionPolicyMode),
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
      if (!policy.conflictResolutionPath?.startsWith("/")) {
        policy.conflictResolutionPath = "/" + policy.conflictResolutionPath;
      }
    }

    return policy;
  };

  public setBaseline = (): void => {
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

    const offerThroughput = this.collection.offer()?.manualThroughput;
    const changeFeedPolicy = this.collection.rawDataModel?.changeFeedPolicy
      ? ChangeFeedPolicyState.On
      : ChangeFeedPolicyState.Off;
    const indexingPolicyContent = this.collection.indexingPolicy();
    const conflictResolutionPolicy: DataModels.ConflictResolutionPolicy =
      this.collection.conflictResolutionPolicy && this.collection.conflictResolutionPolicy();

    const conflictResolutionPolicyMode = parseConflictResolutionMode(conflictResolutionPolicy?.mode);
    const conflictResolutionPolicyPath = conflictResolutionPolicy?.conflictResolutionPath;
    const conflictResolutionPolicyProcedure = parseConflictResolutionProcedure(
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
      geospatialConfigTypeBaseline: geoSpatialConfigType,
    });
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
        disabled: !this.saveSettingsButton.isEnabled(),
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
        disabled: !this.discardSettingsChangesButton.isEnabled(),
      });
    }
    return buttons;
  };

  private onMaxAutoPilotThroughputChange = (newThroughput: number): void =>
    this.setState({ autoPilotThroughput: newThroughput });

  private onThroughputChange = (newThroughput: number): void => this.setState({ throughput: newThroughput });

  private onAutoPilotSelected = (isAutoPilotSelected: boolean): void =>
    this.setState({ isAutoPilotSelected: isAutoPilotSelected });

  private onPivotChange = (item: PivotItem): void => {
    const selectedTab = SettingsV2TabTypes[item.props.itemKey as keyof typeof SettingsV2TabTypes];
    this.setState({ selectedTab: selectedTab });
  };

  public render(): JSX.Element {
    const scaleComponentProps: ScaleComponentProps = {
      collection: this.collection,
      container: this.container,
      isFixedContainer: this.isFixedContainer,
      onThroughputChange: this.onThroughputChange,
      throughput: this.state.throughput,
      throughputBaseline: this.state.throughputBaseline,
      autoPilotThroughput: this.state.autoPilotThroughput,
      autoPilotThroughputBaseline: this.state.autoPilotThroughputBaseline,
      isAutoPilotSelected: this.state.isAutoPilotSelected,
      wasAutopilotOriginallySet: this.state.wasAutopilotOriginallySet,
      onAutoPilotSelected: this.onAutoPilotSelected,
      onMaxAutoPilotThroughputChange: this.onMaxAutoPilotThroughputChange,
      onScaleSaveableChange: this.onScaleSaveableChange,
      onScaleDiscardableChange: this.onScaleDiscardableChange,
      initialNotification: this.props.settingsTab.pendingNotification(),
    };

    const subSettingsComponentProps: SubSettingsComponentProps = {
      collection: this.collection,
      container: this.container,
      isAnalyticalStorageEnabled: this.isAnalyticalStorageEnabled,
      changeFeedPolicyVisible: this.changeFeedPolicyVisible,
      timeToLive: this.state.timeToLive,
      timeToLiveBaseline: this.state.timeToLiveBaseline,
      onTtlChange: this.onTtlChange,
      timeToLiveSeconds: this.state.timeToLiveSeconds,
      timeToLiveSecondsBaseline: this.state.timeToLiveSecondsBaseline,
      onTimeToLiveSecondsChange: this.onTimeToLiveSecondsChange,
      geospatialConfigType: this.state.geospatialConfigType,
      geospatialConfigTypeBaseline: this.state.geospatialConfigTypeBaseline,
      onGeoSpatialConfigTypeChange: this.onGeoSpatialConfigTypeChange,
      analyticalStorageTtlSelection: this.state.analyticalStorageTtlSelection,
      analyticalStorageTtlSelectionBaseline: this.state.analyticalStorageTtlSelectionBaseline,
      onAnalyticalStorageTtlSelectionChange: this.onAnalyticalStorageTtlSelectionChange,
      analyticalStorageTtlSeconds: this.state.analyticalStorageTtlSeconds,
      analyticalStorageTtlSecondsBaseline: this.state.analyticalStorageTtlSecondsBaseline,
      onAnalyticalStorageTtlSecondsChange: this.onAnalyticalStorageTtlSecondsChange,
      changeFeedPolicy: this.state.changeFeedPolicy,
      changeFeedPolicyBaseline: this.state.changeFeedPolicyBaseline,
      onChangeFeedPolicyChange: this.onChangeFeedPolicyChange,
      onSubSettingsSaveableChange: this.onSubSettingsSaveableChange,
      onSubSettingsDiscardableChange: this.onSubSettingsDiscardableChange,
    };

    const indexingPolicyComponentProps: IndexingPolicyComponentProps = {
      shouldDiscardIndexingPolicy: this.state.shouldDiscardIndexingPolicy,
      resetShouldDiscardIndexingPolicy: this.resetShouldDiscardIndexingPolicy,
      indexingPolicyContent: this.state.indexingPolicyContent,
      indexingPolicyContentBaseline: this.state.indexingPolicyContentBaseline,
      onIndexingPolicyContentChange: this.onIndexingPolicyContentChange,
      logIndexingPolicySuccessMessage: this.logIndexingPolicySuccessMessage,
      indexTransformationProgress: this.state.indexTransformationProgress,
      refreshIndexTransformationProgress: this.refreshIndexTransformationProgress,
      onIndexingPolicyDirtyChange: this.onIndexingPolicyDirtyChange,
    };

    const mongoIndexingPolicyComponentProps: MongoIndexingPolicyComponentProps = {
      mongoIndexes: this.state.currentMongoIndexes,
      onIndexDrop: this.onIndexDrop,
      indexesToDrop: this.state.indexesToDrop,
      onRevertIndexDrop: this.onRevertIndexDrop,
      indexesToAdd: this.state.indexesToAdd,
      onRevertIndexAdd: this.onRevertIndexAdd,
      onIndexAddOrChange: this.onIndexAddOrChange,
      indexTransformationProgress: this.state.indexTransformationProgress,
      refreshIndexTransformationProgress: this.refreshIndexTransformationProgress,
      onMongoIndexingPolicySaveableChange: this.onMongoIndexingPolicySaveableChange,
      onMongoIndexingPolicyDiscardableChange: this.onMongoIndexingPolicyDiscardableChange,
    };

    const conflictResolutionPolicyComponentProps: ConflictResolutionComponentProps = {
      collection: this.collection,
      container: this.container,
      conflictResolutionPolicyMode: this.state.conflictResolutionPolicyMode,
      conflictResolutionPolicyModeBaseline: this.state.conflictResolutionPolicyModeBaseline,
      onConflictResolutionPolicyModeChange: this.onConflictResolutionPolicyModeChange,
      conflictResolutionPolicyPath: this.state.conflictResolutionPolicyPath,
      conflictResolutionPolicyPathBaseline: this.state.conflictResolutionPolicyPathBaseline,
      onConflictResolutionPolicyPathChange: this.onConflictResolutionPolicyPathChange,
      conflictResolutionPolicyProcedure: this.state.conflictResolutionPolicyProcedure,
      conflictResolutionPolicyProcedureBaseline: this.state.conflictResolutionPolicyProcedureBaseline,
      onConflictResolutionPolicyProcedureChange: this.onConflictResolutionPolicyProcedureChange,
      onConflictResolutionDirtyChange: this.onConflictResolutionDirtyChange,
    };

    const tabs: SettingsV2TabInfo[] = [];
    if (!hasDatabaseSharedThroughput(this.collection) && this.collection.offer()) {
      tabs.push({
        tab: SettingsV2TabTypes.ScaleTab,
        content: <ScaleComponent {...scaleComponentProps} />,
      });
    }

    tabs.push({
      tab: SettingsV2TabTypes.SubSettingsTab,
      content: <SubSettingsComponent {...subSettingsComponentProps} />,
    });

    if (this.shouldShowIndexingPolicyEditor) {
      tabs.push({
        tab: SettingsV2TabTypes.IndexingPolicyTab,
        content: <IndexingPolicyComponent {...indexingPolicyComponentProps} />,
      });
    } else if (this.container.isPreferredApiMongoDB()) {
      if (isEmpty(this.container.features())) {
        tabs.push({
          tab: SettingsV2TabTypes.IndexingPolicyTab,
          content: mongoIndexingPolicyAADError,
        });
      } else if (this.container.isEnableMongoCapabilityPresent()) {
        tabs.push({
          tab: SettingsV2TabTypes.IndexingPolicyTab,
          content: <MongoIndexingPolicyComponent {...mongoIndexingPolicyComponentProps} />,
        });
      }
    }

    if (this.hasConflictResolution()) {
      tabs.push({
        tab: SettingsV2TabTypes.ConflictResolutionTab,
        content: <ConflictResolutionComponent {...conflictResolutionPolicyComponentProps} />,
      });
    }

    const pivotProps: IPivotProps = {
      onLinkClick: this.onPivotChange,
      selectedKey: SettingsV2TabTypes[this.state.selectedTab],
    };

    const pivotItems = tabs.map((tab) => {
      const pivotItemProps: IPivotItemProps = {
        itemKey: SettingsV2TabTypes[tab.tab],
        style: { marginTop: 20 },
        headerText: getTabTitle(tab.tab),
      };

      return (
        <PivotItem key={pivotItemProps.itemKey} {...pivotItemProps}>
          {tab.content}
        </PivotItem>
      );
    });

    return (
      <div className="settingsV2MainContainer">
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
