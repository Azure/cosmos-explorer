import { IPivotItemProps, IPivotProps, Pivot, PivotItem, Stack } from "@fluentui/react";
import { sendMessage } from "Common/MessageHandler";
import { FabricMessageTypes } from "Contracts/FabricMessageTypes";
import {
  ComputedPropertiesComponent,
  ComputedPropertiesComponentProps,
} from "Explorer/Controls/Settings/SettingsSubComponents/ComputedPropertiesComponent";
import {
  ContainerPolicyComponent,
  ContainerPolicyComponentProps,
} from "Explorer/Controls/Settings/SettingsSubComponents/ContainerPolicyComponent";
import {
  ThroughputBucketsComponent,
  ThroughputBucketsComponentProps,
} from "Explorer/Controls/Settings/SettingsSubComponents/ThroughputInputComponents/ThroughputBucketsComponent";
import { useIndexingPolicyStore } from "Explorer/Tabs/QueryTab/ResultsView";
import { useDatabases } from "Explorer/useDatabases";
import { isFabricNative } from "Platform/Fabric/FabricUtil";
import { isVectorSearchEnabled } from "Utils/CapabilityUtils";
import { isRunningOnPublicCloud } from "Utils/CloudUtils";
import * as React from "react";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import { AuthType } from "../../../AuthType";
import * as Constants from "../../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../../Common/ErrorHandlingUtils";
import { getIndexTransformationProgress } from "../../../Common/dataAccess/getIndexTransformationProgress";
import { readMongoDBCollectionThroughRP } from "../../../Common/dataAccess/readMongoDBCollection";
import { updateCollection } from "../../../Common/dataAccess/updateCollection";
import { updateOffer } from "../../../Common/dataAccess/updateOffer";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { Action, ActionModifiers } from "../../../Shared/Telemetry/TelemetryConstants";
import { trace, traceFailure, traceStart, traceSuccess } from "../../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../../UserContext";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import { MongoDBCollectionResource, MongoIndex } from "../../../Utils/arm/generatedClients/cosmos/types";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import {
  PartitionKeyComponent,
  PartitionKeyComponentProps,
} from "../../Controls/Settings/SettingsSubComponents/PartitionKeyComponent";
import { useCommandBar } from "../../Menus/CommandBar/CommandBarComponentAdapter";
import { SettingsTabV2 } from "../../Tabs/SettingsTabV2";
import "./SettingsComponent.less";
import { mongoIndexingPolicyAADError } from "./SettingsRenderUtils";
import {
  ConflictResolutionComponent,
  ConflictResolutionComponentProps,
} from "./SettingsSubComponents/ConflictResolutionComponent";
import { DataMaskingComponent, DataMaskingComponentProps } from "./SettingsSubComponents/DataMaskingComponent";
import {
  GlobalSecondaryIndexComponent,
  GlobalSecondaryIndexComponentProps,
} from "./SettingsSubComponents/GlobalSecondaryIndexComponent";
import { IndexingPolicyComponent, IndexingPolicyComponentProps } from "./SettingsSubComponents/IndexingPolicyComponent";
import {
  MongoIndexingPolicyComponent,
  MongoIndexingPolicyComponentProps,
} from "./SettingsSubComponents/MongoIndexingPolicy/MongoIndexingPolicyComponent";
import { ScaleComponent, ScaleComponentProps } from "./SettingsSubComponents/ScaleComponent";
import { SubSettingsComponent, SubSettingsComponentProps } from "./SettingsSubComponents/SubSettingsComponent";
import {
  AddMongoIndexProps,
  ChangeFeedPolicyState,
  GeospatialConfigType,
  MongoIndexTypes,
  SettingsV2TabTypes,
  TtlType,
  getMongoNotification,
  getTabTitle,
  hasDatabaseSharedThroughput,
  isDataMaskingEnabled,
  isDirty,
  parseConflictResolutionMode,
  parseConflictResolutionProcedure,
} from "./SettingsUtils";
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
  settingsTab: SettingsTabV2;
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
  throughputBuckets: DataModels.ThroughputBucket[];
  throughputBucketsBaseline: DataModels.ThroughputBucket[];
  throughputError: string;

  timeToLive: TtlType;
  timeToLiveBaseline: TtlType;
  timeToLiveSeconds: number;
  timeToLiveSecondsBaseline: number;
  displayedTtlSeconds: string;
  displayedTtlSecondsBaseline: string;
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
  isThroughputBucketsSaveable: boolean;

  vectorEmbeddingPolicy: DataModels.VectorEmbeddingPolicy;
  vectorEmbeddingPolicyBaseline: DataModels.VectorEmbeddingPolicy;
  fullTextPolicy: DataModels.FullTextPolicy;
  fullTextPolicyBaseline: DataModels.FullTextPolicy;
  shouldDiscardContainerPolicies: boolean;
  isContainerPolicyDirty: boolean;

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

  computedPropertiesContent: DataModels.ComputedProperties;
  computedPropertiesContentBaseline: DataModels.ComputedProperties;
  shouldDiscardComputedProperties: boolean;
  isComputedPropertiesDirty: boolean;

  conflictResolutionPolicyMode: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyModeBaseline: DataModels.ConflictResolutionMode;
  conflictResolutionPolicyPath: string;
  conflictResolutionPolicyPathBaseline: string;
  conflictResolutionPolicyProcedure: string;
  conflictResolutionPolicyProcedureBaseline: string;
  isConflictResolutionDirty: boolean;

  dataMaskingContent: DataModels.DataMaskingPolicy;
  dataMaskingContentBaseline: DataModels.DataMaskingPolicy;
  shouldDiscardDataMasking: boolean;
  isDataMaskingDirty: boolean;
  dataMaskingValidationErrors: string[];

  selectedTab: SettingsV2TabTypes;
}

export class SettingsComponent extends React.Component<SettingsComponentProps, SettingsComponentState> {
  private static readonly sixMonthsInSeconds = 15768000;
  private saveSettingsButton: ButtonV2;
  private discardSettingsChangesButton: ButtonV2;

  private isAnalyticalStorageEnabled: boolean;
  private isCollectionSettingsTab: boolean;
  private collection: ViewModels.Collection;
  private database: ViewModels.Database;
  private offer: DataModels.Offer;
  private changeFeedPolicyVisible: boolean;
  private isFixedContainer: boolean;
  private shouldShowComputedPropertiesEditor: boolean;
  private shouldShowIndexingPolicyEditor: boolean;
  private shouldShowPartitionKeyEditor: boolean;
  private isGlobalSecondaryIndex: boolean;
  private isVectorSearchEnabled: boolean;
  private isFullTextSearchEnabled: boolean;
  private totalThroughputUsed: number;
  private throughputBucketsEnabled: boolean;
  public mongoDBCollectionResource: MongoDBCollectionResource;
  private unsubscribe: () => void;
  constructor(props: SettingsComponentProps) {
    super(props);

    this.isCollectionSettingsTab = this.props.settingsTab.tabKind === ViewModels.CollectionTabKind.CollectionSettingsV2;
    if (this.isCollectionSettingsTab) {
      this.collection = this.props.settingsTab.collection as ViewModels.Collection;
      this.offer = this.collection?.offer();
      this.isAnalyticalStorageEnabled = !!this.collection?.analyticalStorageTtl();
      this.shouldShowComputedPropertiesEditor = userContext.apiType === "SQL";
      this.shouldShowIndexingPolicyEditor = userContext.apiType !== "Cassandra" && userContext.apiType !== "Mongo";
      this.shouldShowPartitionKeyEditor = userContext.apiType === "SQL" && isRunningOnPublicCloud();
      this.isGlobalSecondaryIndex =
        !!this.collection?.materializedViewDefinition() || !!this.collection?.materializedViews();
      this.isVectorSearchEnabled = isVectorSearchEnabled() && !hasDatabaseSharedThroughput(this.collection);
      this.isFullTextSearchEnabled = userContext.apiType === "SQL";

      this.changeFeedPolicyVisible = userContext.features.enableChangeFeedPolicy;
      this.throughputBucketsEnabled = userContext.throughputBucketsEnabled;

      // Mongo container with system partition key still treat as "Fixed"
      this.isFixedContainer =
        userContext.apiType === "Mongo" && (!this.collection?.partitionKey || this.collection?.partitionKey.systemKey);
    } else {
      this.database = this.props.settingsTab.database;
      this.offer = this.database?.offer();
    }

    const initialState: SettingsComponentState = {
      throughput: undefined,
      throughputBaseline: undefined,
      autoPilotThroughput: undefined,
      autoPilotThroughputBaseline: undefined,
      isAutoPilotSelected: false,
      wasAutopilotOriginallySet: false,
      isScaleSaveable: false,
      isScaleDiscardable: false,
      throughputBuckets: undefined,
      throughputBucketsBaseline: undefined,
      throughputError: undefined,

      timeToLive: undefined,
      timeToLiveBaseline: undefined,
      timeToLiveSeconds: undefined,
      timeToLiveSecondsBaseline: undefined,
      displayedTtlSeconds: undefined,
      displayedTtlSecondsBaseline: undefined,
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
      isThroughputBucketsSaveable: false,

      vectorEmbeddingPolicy: undefined,
      vectorEmbeddingPolicyBaseline: undefined,
      fullTextPolicy: undefined,
      fullTextPolicyBaseline: undefined,
      shouldDiscardContainerPolicies: false,
      isContainerPolicyDirty: false,

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

      computedPropertiesContent: undefined,
      computedPropertiesContentBaseline: undefined,
      shouldDiscardComputedProperties: false,
      isComputedPropertiesDirty: false,

      dataMaskingContent: undefined,
      dataMaskingContentBaseline: undefined,
      shouldDiscardDataMasking: false,
      isDataMaskingDirty: false,
      dataMaskingValidationErrors: [],

      conflictResolutionPolicyMode: undefined,
      conflictResolutionPolicyModeBaseline: undefined,
      conflictResolutionPolicyPath: undefined,
      conflictResolutionPolicyPathBaseline: undefined,
      conflictResolutionPolicyProcedure: undefined,
      conflictResolutionPolicyProcedureBaseline: undefined,
      isConflictResolutionDirty: false,

      selectedTab: SettingsV2TabTypes.ScaleTab,
    };

    this.state = {
      ...initialState,
      ...this.getBaselineValues(),
      ...this.getAutoscaleBaselineValues(),
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

    const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
    if (throughputCap && throughputCap !== -1) {
      this.calculateTotalThroughputUsed();
    }
  }

  componentDidMount(): void {
    if (this.isCollectionSettingsTab) {
      this.refreshIndexTransformationProgress();
      this.loadMongoIndexes();
      this.unsubscribe = useIndexingPolicyStore.subscribe(
        () => {
          this.refreshCollectionData();
        },
        (state) => state.indexingPolicies[this.collection?.id()],
      );
      this.refreshCollectionData();
    }

    this.setBaseline();
    if (this.props.settingsTab.isActive()) {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }
  }
  componentWillUnmount(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
  componentDidUpdate(): void {
    if (this.props.settingsTab.isActive()) {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }
  }

  public loadMongoIndexes = async (): Promise<void> => {
    if (userContext.apiType === "Mongo" && userContext?.databaseAccount) {
      this.mongoDBCollectionResource = await readMongoDBCollectionThroughRP(
        this.collection.databaseId,
        this.collection.id(),
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
    if (this.isOfferReplacePending() || this.props.settingsTab.isExecuting()) {
      return false;
    }

    if (this.state.throughputError) {
      return false;
    }

    if (this.state.dataMaskingValidationErrors.length > 0) {
      return false;
    }

    return (
      this.state.isScaleSaveable ||
      this.state.isSubSettingsSaveable ||
      this.state.isContainerPolicyDirty ||
      this.state.isIndexingPolicyDirty ||
      this.state.isConflictResolutionDirty ||
      this.state.isComputedPropertiesDirty ||
      this.state.isDataMaskingDirty ||
      (!!this.state.currentMongoIndexes && this.state.isMongoIndexingPolicySaveable) ||
      this.state.isThroughputBucketsSaveable
    );
  };

  public isDiscardSettingsButtonEnabled = (): boolean => {
    if (this.props.settingsTab.isExecuting()) {
      return false;
    }
    return (
      this.state.isScaleDiscardable ||
      this.state.isSubSettingsDiscardable ||
      this.state.isContainerPolicyDirty ||
      this.state.isIndexingPolicyDirty ||
      this.state.isConflictResolutionDirty ||
      this.state.isComputedPropertiesDirty ||
      this.state.isDataMaskingDirty ||
      (!!this.state.currentMongoIndexes && this.state.isMongoIndexingPolicyDiscardable) ||
      this.state.isThroughputBucketsSaveable
    );
  };

  private getAutoscaleBaselineValues = (): Partial<SettingsComponentState> => {
    const autoscaleMaxThroughput = this.offer?.autoscaleMaxThroughput;

    if (autoscaleMaxThroughput && AutoPilotUtils.isValidAutoPilotThroughput(autoscaleMaxThroughput)) {
      return {
        isAutoPilotSelected: true,
        wasAutopilotOriginallySet: true,
        autoPilotThroughput: autoscaleMaxThroughput,
        autoPilotThroughputBaseline: autoscaleMaxThroughput,
      };
    }

    return {
      isAutoPilotSelected: false,
      wasAutopilotOriginallySet: false,
      autoPilotThroughput: undefined,
      autoPilotThroughputBaseline: undefined,
    };
  };

  public hasProvisioningTypeChanged = (): boolean =>
    this.state.wasAutopilotOriginallySet !== this.state.isAutoPilotSelected;

  public shouldShowKeyspaceSharedThroughputMessage = (): boolean =>
    userContext.apiType === "Cassandra" && hasDatabaseSharedThroughput(this.collection);

  public hasConflictResolution = (): boolean =>
    userContext?.databaseAccount?.properties?.enableMultipleWriteLocations &&
    this.collection.conflictResolutionPolicy &&
    !!this.collection.conflictResolutionPolicy();

  public isOfferReplacePending = (): boolean => {
    return this.offer?.offerReplacePending;
  };

  public onSaveClick = async (): Promise<void> => {
    this.props.settingsTab.isExecutionError(false);

    this.props.settingsTab.isExecuting(true);
    const startKey: number = traceStart(Action.SettingsV2Updated, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.settingsTab.tabTitle(),
    });

    try {
      await (this.isCollectionSettingsTab
        ? this.saveCollectionSettings(startKey)
        : this.saveDatabaseSettings(startKey));
    } catch (error) {
      this.props.settingsTab.isExecutionError(true);
      traceFailure(
        Action.SettingsV2Updated,
        {
          databaseName: this.collection?.databaseId,
          collectionName: this.collection?.id(),

          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle(),
          error: getErrorMessage(error),
          errorStack: getErrorStack(error),
        },
        startKey,
      );
    } finally {
      this.props.settingsTab.isExecuting(false);

      if (isFabricNative() && this.isCollectionSettingsTab) {
        sendMessage({
          type: FabricMessageTypes.ContainerUpdated,
          params: { updateType: "settings" },
        });
      }
    }
  };

  public onRevertClick = (): void => {
    if (this.props.settingsTab.isExecuting()) {
      return;
    }
    trace(Action.SettingsV2Discarded, ActionModifiers.Mark, {
      message: "Settings Discarded",
    });

    this.setState({
      throughput: this.state.throughputBaseline,
      throughputBuckets: this.state.throughputBucketsBaseline,
      throughputBucketsBaseline: this.state.throughputBucketsBaseline,
      timeToLive: this.state.timeToLiveBaseline,
      timeToLiveSeconds: this.state.timeToLiveSecondsBaseline,
      displayedTtlSeconds: this.state.displayedTtlSecondsBaseline,
      geospatialConfigType: this.state.geospatialConfigTypeBaseline,
      vectorEmbeddingPolicy: this.state.vectorEmbeddingPolicyBaseline,
      fullTextPolicy: this.state.fullTextPolicyBaseline,
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
      shouldDiscardContainerPolicies: true,
      shouldDiscardIndexingPolicy: true,
      isScaleSaveable: false,
      isScaleDiscardable: false,
      isSubSettingsSaveable: false,
      isThroughputBucketsSaveable: false,
      isSubSettingsDiscardable: false,
      isContainerPolicyDirty: false,
      isIndexingPolicyDirty: false,
      isMongoIndexingPolicySaveable: false,
      isMongoIndexingPolicyDiscardable: false,
      isConflictResolutionDirty: false,
      computedPropertiesContent: this.state.computedPropertiesContentBaseline,
      shouldDiscardComputedProperties: true,
      isComputedPropertiesDirty: false,
      dataMaskingContent: this.state.dataMaskingContentBaseline,
      shouldDiscardDataMasking: true,
      isDataMaskingDirty: false,
      dataMaskingValidationErrors: [],
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

  private onVectorEmbeddingPolicyChange = (newVectorEmbeddingPolicy: DataModels.VectorEmbeddingPolicy): void =>
    this.setState({ vectorEmbeddingPolicy: newVectorEmbeddingPolicy });

  private onFullTextPolicyChange = (newFullTextPolicy: DataModels.FullTextPolicy): void =>
    this.setState({ fullTextPolicy: newFullTextPolicy });

  private onIndexingPolicyContentChange = (newIndexingPolicy: DataModels.IndexingPolicy): void =>
    this.setState({ indexingPolicyContent: newIndexingPolicy });

  private onThroughputBucketsSaveableChange = (isSaveable: boolean): void => {
    this.setState({ isThroughputBucketsSaveable: isSaveable });
  };

  private resetShouldDiscardContainerPolicies = (): void => this.setState({ shouldDiscardContainerPolicies: false });

  private resetShouldDiscardIndexingPolicy = (): void => this.setState({ shouldDiscardIndexingPolicy: false });

  private logIndexingPolicySuccessMessage = (): void => {
    if (this.props.settingsTab.onLoadStartKey) {
      traceSuccess(
        Action.Tab,
        {
          databaseName: this.collection.databaseId,
          collectionName: this.collection.id(),

          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle(),
        },
        this.props.settingsTab.onLoadStartKey,
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

  private onDisplayedTtlChange = (newDisplayedTtlSeconds: string): void =>
    this.setState({ displayedTtlSeconds: newDisplayedTtlSeconds });

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

  private onVectorEmbeddingPolicyDirtyChange = (isVectorEmbeddingPolicyDirty: boolean): void =>
    this.setState({ isContainerPolicyDirty: isVectorEmbeddingPolicyDirty });

  private onFullTextPolicyDirtyChange = (isFullTextPolicyDirty: boolean): void =>
    this.setState({ isContainerPolicyDirty: isFullTextPolicyDirty });

  private onIndexingPolicyDirtyChange = (isIndexingPolicyDirty: boolean): void =>
    this.setState({ isIndexingPolicyDirty: isIndexingPolicyDirty });

  private onMongoIndexingPolicySaveableChange = (isMongoIndexingPolicySaveable: boolean): void =>
    this.setState({ isMongoIndexingPolicySaveable });

  private onMongoIndexingPolicyDiscardableChange = (isMongoIndexingPolicyDiscardable: boolean): void =>
    this.setState({ isMongoIndexingPolicyDiscardable });

  private onComputedPropertiesContentChange = (newComputedProperties: DataModels.ComputedProperties): void =>
    this.setState({ computedPropertiesContent: newComputedProperties });

  private resetShouldDiscardComputedProperties = (): void => this.setState({ shouldDiscardComputedProperties: false });

  private logComputedPropertiesSuccessMessage = (): void => {
    if (this.props.settingsTab.onLoadStartKey) {
      traceSuccess(
        Action.Tab,
        {
          databaseName: this.collection.databaseId,
          collectionName: this.collection.id(),

          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle(),
        },
        this.props.settingsTab.onLoadStartKey,
      );
      this.props.settingsTab.onLoadStartKey = undefined;
    }
  };

  private onComputedPropertiesDirtyChange = (isComputedPropertiesDirty: boolean): void =>
    this.setState({ isComputedPropertiesDirty: isComputedPropertiesDirty });

  private onDataMaskingContentChange = (newDataMasking: DataModels.DataMaskingPolicy): void => {
    const validationErrors = [];
    if (newDataMasking.includedPaths === undefined || newDataMasking.includedPaths === null) {
      validationErrors.push("includedPaths is required");
    } else if (!Array.isArray(newDataMasking.includedPaths)) {
      validationErrors.push("includedPaths must be an array");
    }
    if (newDataMasking.excludedPaths !== undefined && !Array.isArray(newDataMasking.excludedPaths)) {
      validationErrors.push("excludedPaths must be an array if provided");
    }

    this.setState({
      dataMaskingContent: newDataMasking,
      dataMaskingValidationErrors: validationErrors,
    });
  };

  private resetShouldDiscardDataMasking = (): void => this.setState({ shouldDiscardDataMasking: false });

  private onDataMaskingDirtyChange = (isDataMaskingDirty: boolean): void =>
    this.setState({ isDataMaskingDirty: isDataMaskingDirty });

  private calculateTotalThroughputUsed = (): void => {
    this.totalThroughputUsed = 0;
    (useDatabases.getState().databases || []).forEach(async (database) => {
      if (database.offer()) {
        const dbThroughput = database.offer().autoscaleMaxThroughput || database.offer().manualThroughput;
        this.totalThroughputUsed += dbThroughput;
      }

      (database.collections() || []).forEach(async (collection) => {
        if (collection.offer()) {
          const colThroughput = collection.offer().autoscaleMaxThroughput || collection.offer().manualThroughput;
          this.totalThroughputUsed += colThroughput;
        }
      });
    });

    const numberOfRegions = userContext.databaseAccount?.properties.locations?.length || 1;
    this.totalThroughputUsed *= numberOfRegions;
  };

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
        false,
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
    const baselineValues = this.getBaselineValues();
    const autoscaleBaselineValues = this.getAutoscaleBaselineValues();
    this.setState({ ...baselineValues, ...autoscaleBaselineValues } as SettingsComponentState);
  };

  private getBaselineValues = (): Partial<SettingsComponentState> => {
    const offerThroughput = this.offer?.manualThroughput;

    if (!this.isCollectionSettingsTab) {
      return {
        throughput: offerThroughput,
        throughputBaseline: offerThroughput,
      };
    }

    const defaultTtl = this.collection.defaultTtl();

    let timeToLive: TtlType;
    let timeToLiveSeconds: number;
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

    const displayedTtlSeconds: string = timeToLive === TtlType.On ? timeToLiveSeconds.toString() : "";

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

    const changeFeedPolicy = this.collection.rawDataModel?.changeFeedPolicy
      ? ChangeFeedPolicyState.On
      : ChangeFeedPolicyState.Off;
    const vectorEmbeddingPolicy: DataModels.VectorEmbeddingPolicy =
      this.collection.vectorEmbeddingPolicy && this.collection.vectorEmbeddingPolicy();
    const fullTextPolicy: DataModels.FullTextPolicy =
      this.collection.fullTextPolicy && this.collection.fullTextPolicy();
    const indexingPolicyContent = this.collection.indexingPolicy();
    const dataMaskingContent: DataModels.DataMaskingPolicy = {
      includedPaths: this.collection.dataMaskingPolicy?.()?.includedPaths || [],
      excludedPaths: this.collection.dataMaskingPolicy?.()?.excludedPaths || [],
    };
    const conflictResolutionPolicy: DataModels.ConflictResolutionPolicy =
      this.collection.conflictResolutionPolicy && this.collection.conflictResolutionPolicy();
    const conflictResolutionPolicyMode = parseConflictResolutionMode(conflictResolutionPolicy?.mode);
    const conflictResolutionPolicyPath = conflictResolutionPolicy?.conflictResolutionPath;
    const conflictResolutionPolicyProcedure = parseConflictResolutionProcedure(
      conflictResolutionPolicy?.conflictResolutionProcedure,
    );
    const geospatialConfigTypeString: string =
      (this.collection.geospatialConfig && this.collection.geospatialConfig()?.type) || GeospatialConfigType.Geometry;
    const geoSpatialConfigType = GeospatialConfigType[geospatialConfigTypeString as keyof typeof GeospatialConfigType];
    let computedPropertiesContent = this.collection.computedProperties();
    if (!computedPropertiesContent || computedPropertiesContent.length === 0) {
      computedPropertiesContent = [
        { name: "name_of_property", query: "query_to_compute_property" },
      ] as DataModels.ComputedProperties;
    }
    const throughputBuckets = this.offer?.throughputBuckets;

    return {
      throughput: offerThroughput,
      throughputBaseline: offerThroughput,
      throughputBuckets,
      throughputBucketsBaseline: throughputBuckets,
      changeFeedPolicy: changeFeedPolicy,
      changeFeedPolicyBaseline: changeFeedPolicy,
      timeToLive: timeToLive,
      timeToLiveBaseline: timeToLive,
      timeToLiveSeconds: timeToLiveSeconds,
      timeToLiveSecondsBaseline: timeToLiveSeconds,
      displayedTtlSeconds: displayedTtlSeconds,
      displayedTtlSecondsBaseline: displayedTtlSeconds,
      analyticalStorageTtlSelection: analyticalStorageTtlSelection,
      analyticalStorageTtlSelectionBaseline: analyticalStorageTtlSelection,
      analyticalStorageTtlSeconds: analyticalStorageTtlSeconds,
      analyticalStorageTtlSecondsBaseline: analyticalStorageTtlSeconds,
      vectorEmbeddingPolicy: vectorEmbeddingPolicy,
      vectorEmbeddingPolicyBaseline: vectorEmbeddingPolicy,
      fullTextPolicy: fullTextPolicy,
      fullTextPolicyBaseline: fullTextPolicy,
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
      computedPropertiesContent: computedPropertiesContent,
      computedPropertiesContentBaseline: computedPropertiesContent,
      dataMaskingContent: dataMaskingContent,
      dataMaskingContentBaseline: dataMaskingContent,
    };
  };

  private getTabsButtons = (): CommandButtonComponentProps[] => {
    const buttons: CommandButtonComponentProps[] = [];
    const isExecuting = this.props.settingsTab.isExecuting();
    if (this.saveSettingsButton.isVisible()) {
      const label = "Save";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: async () => await this.onSaveClick(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: isExecuting || !this.saveSettingsButton.isEnabled(),
      });
    }

    if (this.discardSettingsChangesButton.isVisible()) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: () => {
          if (isExecuting) {
            return;
          }
          this.onRevertClick();
        },
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: isExecuting || !this.discardSettingsChangesButton.isEnabled(),
      });
    }
    return buttons;
  };

  private onMaxAutoPilotThroughputChange = (newThroughput: number): void => {
    let throughputError = "";
    const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
    const numberOfRegions = userContext.databaseAccount?.properties.locations?.length || 1;
    const throughputDelta = (newThroughput - this.offer.autoscaleMaxThroughput) * numberOfRegions;
    if (throughputCap && throughputCap !== -1 && throughputCap - this.totalThroughputUsed < throughputDelta) {
      throughputError = `Your account is currently configured with a total throughput limit of ${throughputCap} RU/s. This update isn't possible because it would increase the total throughput to ${
        this.totalThroughputUsed + throughputDelta
      } RU/s. Change total throughput limit in cost management.`;
    }
    this.setState({ autoPilotThroughput: newThroughput, throughputError });
  };

  private onThroughputChange = (newThroughput: number): void => {
    let throughputError = "";
    const throughputCap = userContext.databaseAccount?.properties.capacity?.totalThroughputLimit;
    const numberOfRegions = userContext.databaseAccount?.properties.locations?.length || 1;
    const throughputDelta = (newThroughput - this.offer.manualThroughput) * numberOfRegions;
    if (throughputCap && throughputCap !== -1 && throughputCap - this.totalThroughputUsed < throughputDelta) {
      throughputError = `Your account is currently configured with a total throughput limit of ${throughputCap} RU/s. This update isn't possible because it would increase the total throughput to ${
        this.totalThroughputUsed + throughputDelta
      } RU/s. Change total throughput limit in cost management.`;
    }
    this.setState({ throughput: newThroughput, throughputError });
  };

  private onThroughputBucketChange = (throughputBuckets: DataModels.ThroughputBucket[]): void => {
    this.setState({ throughputBuckets });
  };

  private onAutoPilotSelected = (isAutoPilotSelected: boolean): void =>
    this.setState({ isAutoPilotSelected: isAutoPilotSelected });

  private onPivotChange = (item: PivotItem): void => {
    const selectedTab = SettingsV2TabTypes[item.props.itemKey as keyof typeof SettingsV2TabTypes];
    this.setState({ selectedTab: selectedTab });
  };

  private saveDatabaseSettings = async (startKey: number): Promise<void> => {
    if (this.state.isScaleSaveable) {
      const updateOfferParams: DataModels.UpdateOfferParams = {
        databaseId: this.database.id(),
        currentOffer: this.database.offer(),
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
      this.database.offer(updatedOffer);
      this.offer = updatedOffer;
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

    this.setBaseline();
    this.setState({ wasAutopilotOriginallySet: this.state.isAutoPilotSelected });
    traceSuccess(
      Action.SettingsV2Updated,
      {
        databaseName: this.database.id(),

        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: this.props.settingsTab.tabTitle(),
      },
      startKey,
    );
  };
  private refreshCollectionData = async (): Promise<void> => {
    const containerId = this.collection.id();
    const latestIndexingPolicy = useIndexingPolicyStore.getState().indexingPolicies[containerId];
    const rawPolicy = latestIndexingPolicy ?? this.collection.indexingPolicy();

    const latestCollection: DataModels.IndexingPolicy = {
      automatic: rawPolicy?.automatic ?? true,
      indexingMode: rawPolicy?.indexingMode ?? "consistent",
      includedPaths: rawPolicy?.includedPaths ?? [],
      excludedPaths: rawPolicy?.excludedPaths ?? [],
      compositeIndexes: rawPolicy?.compositeIndexes ?? [],
      spatialIndexes: rawPolicy?.spatialIndexes ?? [],
      vectorIndexes: rawPolicy?.vectorIndexes ?? [],
      fullTextIndexes: rawPolicy?.fullTextIndexes ?? [],
    };

    this.collection.rawDataModel.indexingPolicy = latestCollection;
    this.setState({
      indexingPolicyContent: latestCollection,
      indexingPolicyContentBaseline: latestCollection,
    });
  };

  private saveCollectionSettings = async (startKey: number): Promise<void> => {
    const newCollection: DataModels.Collection = { ...this.collection.rawDataModel };
    if (
      this.state.isSubSettingsSaveable ||
      this.state.isContainerPolicyDirty ||
      this.state.isIndexingPolicyDirty ||
      this.state.isConflictResolutionDirty ||
      this.state.isComputedPropertiesDirty ||
      this.state.isDataMaskingDirty
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

      newCollection.vectorEmbeddingPolicy = this.state.vectorEmbeddingPolicy;

      newCollection.fullTextPolicy = this.state.fullTextPolicy;

      // Only send data masking policy if it was modified (dirty) and data masking is enabled
      if (this.state.isDataMaskingDirty && isDataMaskingEnabled(this.collection.dataMaskingPolicy?.())) {
        newCollection.dataMaskingPolicy = this.state.dataMaskingContent;
      }

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

      if (this.state.isComputedPropertiesDirty) {
        newCollection.computedProperties = this.state.computedPropertiesContent;
      }

      const updatedCollection: DataModels.Collection = await updateCollection(
        this.collection.databaseId,
        this.collection.id(),
        newCollection,
      );
      this.collection.rawDataModel = updatedCollection;
      this.collection.defaultTtl(updatedCollection.defaultTtl);
      this.collection.analyticalStorageTtl(updatedCollection.analyticalStorageTtl);
      this.collection.id(updatedCollection.id);
      this.collection.indexingPolicy(updatedCollection.indexingPolicy);
      this.collection.conflictResolutionPolicy(updatedCollection.conflictResolutionPolicy);
      this.collection.changeFeedPolicy(updatedCollection.changeFeedPolicy);
      this.collection.geospatialConfig(updatedCollection.geospatialConfig);
      this.collection.computedProperties(updatedCollection.computedProperties);
      this.collection.vectorEmbeddingPolicy(updatedCollection.vectorEmbeddingPolicy);
      this.collection.fullTextPolicy(updatedCollection.fullTextPolicy);

      if (wasIndexingPolicyModified) {
        await this.refreshIndexTransformationProgress();
      }

      // Update collection object with new data
      this.collection.dataMaskingPolicy(updatedCollection.dataMaskingPolicy);

      this.setState({
        dataMaskingContentBaseline: this.state.dataMaskingContent,
        isSubSettingsSaveable: false,
        isSubSettingsDiscardable: false,
        isContainerPolicyDirty: false,
        isIndexingPolicyDirty: false,
        isConflictResolutionDirty: false,
        isComputedPropertiesDirty: false,
        isDataMaskingDirty: false,
      });
    }

    if (this.state.isMongoIndexingPolicySaveable && this.mongoDBCollectionResource) {
      try {
        const newMongoIndexes = this.getMongoIndexesToSave();
        const newMongoCollection = {
          ...this.mongoDBCollectionResource,
          indexes: newMongoIndexes,
        };

        this.mongoDBCollectionResource = await updateCollection(
          this.collection.databaseId,
          this.collection.id(),
          newMongoCollection,
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
            databaseName: this.collection?.databaseId,
            collectionName: this.collection?.id(),

            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: this.props.settingsTab.tabTitle(),
          },
          startKey,
        );
      } catch (error) {
        traceFailure(
          Action.MongoIndexUpdated,
          {
            databaseName: this.collection?.databaseId,
            collectionName: this.collection?.id(),

            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: this.props.settingsTab.tabTitle(),
            error: getErrorMessage(error),
            errorStack: getErrorStack(error),
          },
          startKey,
        );
        throw error;
      }
    }

    if (this.throughputBucketsEnabled && this.state.isThroughputBucketsSaveable) {
      const updatedOffer: DataModels.Offer = await updateOffer({
        databaseId: this.collection.databaseId,
        collectionId: this.collection.id(),
        currentOffer: this.collection.offer(),
        autopilotThroughput: this.collection.offer?.()?.autoscaleMaxThroughput
          ? this.collection.offer?.()?.autoscaleMaxThroughput
          : undefined,
        manualThroughput: this.collection.offer?.()?.manualThroughput
          ? this.collection.offer?.()?.manualThroughput
          : undefined,
        throughputBuckets: this.state.throughputBuckets,
      });
      this.collection.offer(updatedOffer);
      this.offer = updatedOffer;
      this.setState({ isThroughputBucketsSaveable: false });
    }

    if (this.state.isScaleSaveable) {
      const updateOfferParams: DataModels.UpdateOfferParams = {
        databaseId: this.collection.databaseId,
        collectionId: this.collection.id(),
        currentOffer: this.collection.offer(),
        autopilotThroughput: this.state.isAutoPilotSelected ? this.state.autoPilotThroughput : undefined,
        manualThroughput: this.state.isAutoPilotSelected ? undefined : this.state.throughput,
        throughputBuckets: this.throughputBucketsEnabled ? this.state.throughputBuckets : undefined,
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
      this.offer = updatedOffer;
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
    this.setBaseline();
    this.setState({ wasAutopilotOriginallySet: this.state.isAutoPilotSelected });
    traceSuccess(
      Action.SettingsV2Updated,
      {
        databaseName: this.collection?.databaseId,
        collectionName: this.collection?.id(),
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle: this.props.settingsTab.tabTitle(),
      },
      startKey,
    );
  };

  public getMongoIndexTabContent = (
    mongoIndexingPolicyComponentProps: MongoIndexingPolicyComponentProps,
  ): JSX.Element => {
    if (userContext.authType === AuthType.AAD) {
      if (userContext.apiType === "Mongo") {
        return <MongoIndexingPolicyComponent {...mongoIndexingPolicyComponentProps} />;
      }
      return undefined;
    }
    return mongoIndexingPolicyAADError;
  };

  public render(): JSX.Element {
    const scaleComponentProps: ScaleComponentProps = {
      collection: this.collection,
      database: this.database,
      isFixedContainer: this.isFixedContainer,
      isGlobalSecondaryIndex: this.isGlobalSecondaryIndex,
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
      throughputError: this.state.throughputError,
    };
    if (!this.isCollectionSettingsTab) {
      return (
        <div className="settingsV2MainContainer">
          <div className="settingsV2TabsContainer">
            <ScaleComponent {...scaleComponentProps} />
          </div>
        </div>
      );
    }

    const subSettingsComponentProps: SubSettingsComponentProps = {
      collection: this.collection,
      isAnalyticalStorageEnabled: this.isAnalyticalStorageEnabled,
      changeFeedPolicyVisible: this.changeFeedPolicyVisible,
      timeToLive: this.state.timeToLive,
      timeToLiveBaseline: this.state.timeToLiveBaseline,
      onTtlChange: this.onTtlChange,
      timeToLiveSeconds: this.state.timeToLiveSeconds,
      timeToLiveSecondsBaseline: this.state.timeToLiveSecondsBaseline,
      onTimeToLiveSecondsChange: this.onTimeToLiveSecondsChange,
      displayedTtlSeconds: this.state.displayedTtlSeconds,
      onDisplayedTtlSecondsChange: this.onDisplayedTtlChange,
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

    const containerPolicyComponentProps: ContainerPolicyComponentProps = {
      vectorEmbeddingPolicy: this.state.vectorEmbeddingPolicy,
      vectorEmbeddingPolicyBaseline: this.state.vectorEmbeddingPolicyBaseline,
      onVectorEmbeddingPolicyChange: this.onVectorEmbeddingPolicyChange,
      onVectorEmbeddingPolicyDirtyChange: this.onVectorEmbeddingPolicyDirtyChange,
      isVectorSearchEnabled: this.isVectorSearchEnabled,
      fullTextPolicy: this.state.fullTextPolicy,
      fullTextPolicyBaseline: this.state.fullTextPolicyBaseline,
      onFullTextPolicyChange: this.onFullTextPolicyChange,
      onFullTextPolicyDirtyChange: this.onFullTextPolicyDirtyChange,
      isFullTextSearchEnabled: this.isFullTextSearchEnabled,
      shouldDiscardContainerPolicies: this.state.shouldDiscardContainerPolicies,
      resetShouldDiscardContainerPolicyChange: this.resetShouldDiscardContainerPolicies,
      isGlobalSecondaryIndex: this.isGlobalSecondaryIndex,
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
      isVectorSearchEnabled: this.isVectorSearchEnabled,
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

    const computedPropertiesComponentProps: ComputedPropertiesComponentProps = {
      computedPropertiesContent: this.state.computedPropertiesContent,
      computedPropertiesContentBaseline: this.state.computedPropertiesContentBaseline,
      logComputedPropertiesSuccessMessage: this.logComputedPropertiesSuccessMessage,
      onComputedPropertiesContentChange: this.onComputedPropertiesContentChange,
      onComputedPropertiesDirtyChange: this.onComputedPropertiesDirtyChange,
      resetShouldDiscardComputedProperties: this.resetShouldDiscardComputedProperties,
      shouldDiscardComputedProperties: this.state.shouldDiscardComputedProperties,
    };

    const conflictResolutionPolicyComponentProps: ConflictResolutionComponentProps = {
      collection: this.collection,
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

    const throughputBucketsComponentProps: ThroughputBucketsComponentProps = {
      currentBuckets: this.state.throughputBuckets,
      throughputBucketsBaseline: this.state.throughputBucketsBaseline,
      onBucketsChange: this.onThroughputBucketChange,
      onSaveableChange: this.onThroughputBucketsSaveableChange,
    };

    const partitionKeyComponentProps: PartitionKeyComponentProps = {
      database: useDatabases.getState().findDatabaseWithId(this.collection.databaseId),
      collection: this.collection,
      explorer: this.props.settingsTab.getContainer(),
      isReadOnly: isFabricNative(),
    };

    const globalSecondaryIndexComponentProps: GlobalSecondaryIndexComponentProps = {
      collection: this.collection,
      explorer: this.props.settingsTab.getContainer(),
    };

    const tabs: SettingsV2TabInfo[] = [];
    if (!hasDatabaseSharedThroughput(this.collection) && this.offer) {
      tabs.push({
        tab: SettingsV2TabTypes.ScaleTab,
        content: <ScaleComponent {...scaleComponentProps} />,
      });
    }

    tabs.push({
      tab: SettingsV2TabTypes.SubSettingsTab,
      content: <SubSettingsComponent {...subSettingsComponentProps} />,
    });

    if (this.isVectorSearchEnabled || this.isFullTextSearchEnabled) {
      tabs.push({
        tab: SettingsV2TabTypes.ContainerVectorPolicyTab,
        content: <ContainerPolicyComponent {...containerPolicyComponentProps} />,
      });
    }

    if (this.shouldShowIndexingPolicyEditor) {
      tabs.push({
        tab: SettingsV2TabTypes.IndexingPolicyTab,
        content: <IndexingPolicyComponent {...indexingPolicyComponentProps} />,
      });
    } else if (userContext.apiType === "Mongo") {
      const mongoIndexTabContext = this.getMongoIndexTabContent(mongoIndexingPolicyComponentProps);
      if (mongoIndexTabContext) {
        tabs.push({
          tab: SettingsV2TabTypes.IndexingPolicyTab,
          content: mongoIndexTabContext,
        });
      }
    }

    if (this.hasConflictResolution()) {
      tabs.push({
        tab: SettingsV2TabTypes.ConflictResolutionTab,
        content: <ConflictResolutionComponent {...conflictResolutionPolicyComponentProps} />,
      });
    }

    if (this.shouldShowPartitionKeyEditor) {
      tabs.push({
        tab: SettingsV2TabTypes.PartitionKeyTab,
        content: <PartitionKeyComponent {...partitionKeyComponentProps} />,
      });
    }

    if (this.shouldShowComputedPropertiesEditor) {
      tabs.push({
        tab: SettingsV2TabTypes.ComputedPropertiesTab,
        content: <ComputedPropertiesComponent {...computedPropertiesComponentProps} />,
      });
    }

    if (isDataMaskingEnabled(this.collection.dataMaskingPolicy?.())) {
      const dataMaskingComponentProps: DataMaskingComponentProps = {
        shouldDiscardDataMasking: this.state.shouldDiscardDataMasking,
        resetShouldDiscardDataMasking: this.resetShouldDiscardDataMasking,
        dataMaskingContent: this.state.dataMaskingContent,
        dataMaskingContentBaseline: this.state.dataMaskingContentBaseline,
        onDataMaskingContentChange: this.onDataMaskingContentChange,
        onDataMaskingDirtyChange: this.onDataMaskingDirtyChange,
        validationErrors: this.state.dataMaskingValidationErrors,
      };

      tabs.push({
        tab: SettingsV2TabTypes.DataMaskingTab,
        content: <DataMaskingComponent {...dataMaskingComponentProps} />,
      });
    }

    if (this.throughputBucketsEnabled && !hasDatabaseSharedThroughput(this.collection) && this.offer) {
      tabs.push({
        tab: SettingsV2TabTypes.ThroughputBucketsTab,
        content: <ThroughputBucketsComponent {...throughputBucketsComponentProps} />,
      });
    }

    if (this.isGlobalSecondaryIndex) {
      tabs.push({
        tab: SettingsV2TabTypes.GlobalSecondaryIndexTab,
        content: <GlobalSecondaryIndexComponent {...globalSecondaryIndexComponentProps} />,
      });
    }

    const pivotProps: IPivotProps = {
      onLinkClick: this.onPivotChange,
      selectedKey: SettingsV2TabTypes[this.state.selectedTab],
    };

    const pivotStyles = {
      root: {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorNeutralForeground1)",
        selectors: {
          "& .ms-Pivot-link": {
            color: "var(--colorNeutralForeground1)",
          },
          "& .ms-Pivot-link.is-selected::before": {
            backgroundColor: "var(--colorCompoundBrandBackground)",
          },
        },
      },
      link: {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorNeutralForeground1)",
        selectors: {
          "&:hover": {
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          },
          "&:active": {
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          },
          '&[aria-selected="true"]': {
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
            selectors: {
              "&:hover": {
                backgroundColor: "var(--colorNeutralBackground1)",
                color: "var(--colorNeutralForeground1)",
              },
              "&:active": {
                backgroundColor: "var(--colorNeutralBackground1)",
                color: "var(--colorNeutralForeground1)",
              },
            },
          },
        },
      },

      itemContainer: {
        // padding: '20px 24px',
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorNeutralForeground1)",
      },
    };

    const contentStyles = {
      root: {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorNeutralForeground1)",
        // padding: '20px 24px'
      },
    };

    return (
      <div
        className="settingsV2MainContainer"
        style={
          {
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
            position: "relative",
          } as React.CSSProperties
        }
      >
        {this.shouldShowKeyspaceSharedThroughputMessage() && (
          <div>This table shared throughput is configured at the keyspace</div>
        )}

        <div
          className="settingsV2TabsContainer"
          style={
            {
              backgroundColor: "var(--colorNeutralBackground1)",
              color: "var(--colorNeutralForeground1)",
              position: "relative",
              padding: "20px 24px",
            } as React.CSSProperties
          }
        >
          <Pivot {...pivotProps} styles={pivotStyles}>
            {tabs.map((tab) => {
              const pivotItemProps: IPivotItemProps = {
                itemKey: SettingsV2TabTypes[tab.tab],
                style: {
                  marginTop: 20,
                  backgroundColor: "var(--colorNeutralBackground1)",
                  color: "var(--colorNeutralForeground1)",
                },
                headerText: getTabTitle(tab.tab),
                headerButtonProps: {
                  "data-test": `settings-tab-header/${SettingsV2TabTypes[tab.tab]}`,
                },
              };

              return (
                <PivotItem key={pivotItemProps.itemKey} {...pivotItemProps}>
                  <Stack styles={contentStyles}>{tab.content}</Stack>
                </PivotItem>
              );
            })}
          </Pivot>
        </div>
      </div>
    );
  }
}
