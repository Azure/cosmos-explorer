import * as React from "react";
import * as AutoPilotUtils from "../../../Utils/AutoPilotUtils";
import * as Constants from "../../../Common/Constants";
import * as DataModels from "../../../Contracts/DataModels";
import * as SharedConstants from "../../../Shared/Constants";
import * as ViewModels from "../../../Contracts/ViewModels";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
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
import { throughputUnit } from "./SettingsRenderUtils";
import { ScaleComponent, ScaleComponentProps } from "./SettingsSubComponents/ScaleComponent";
import {
  MongoIndexingPolicyComponent,
  MongoIndexingPolicyComponentProps
} from "./SettingsSubComponents/MongoIndexingPolicyComponent";
import {
  getMaxRUs,
  hasDatabaseSharedThroughput,
  GeospatialConfigType,
  TtlType,
  ChangeFeedPolicyState,
  SettingsV2TabTypes,
  getTabTitle,
  isDirty,
  TtlOff,
  TtlOn,
  TtlOnNoDefault,
  parseConflictResolutionMode,
  parseConflictResolutionProcedure
} from "./SettingsUtils";
import {
  ConflictResolutionComponent,
  ConflictResolutionComponentProps
} from "./SettingsSubComponents/ConflictResolutionComponent";
import { SubSettingsComponent, SubSettingsComponentProps } from "./SettingsSubComponents/SubSettingsComponent";
import { Pivot, PivotItem, IPivotProps, IPivotItemProps, IChoiceGroupOption } from "office-ui-fabric-react";
import "./SettingsComponent.less";
import { IndexingPolicyComponent, IndexingPolicyComponentProps } from "./SettingsSubComponents/IndexingPolicyComponent";
import { MongoDBCollectionGetResults, MongoIndex } from "../../../Utils/arm/generatedClients/2020-04-01/types";
import {
  createUpdateMongoDBCollection,
  getMongoDBCollection
} from "../../../Utils/arm/generatedClients/2020-04-01/mongoDBResources";

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
  indexingPolicyElementFocussed: boolean;
  isIndexingPolicyDirty: boolean;

  isMongoIndexingPolicyDirty: boolean;
  indexesToDelete: number[];
  indexesToAdd: MongoIndex[];

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
  private static readonly zeroSeconds = 0;

  public saveSettingsButton: ButtonV2;
  public discardSettingsChangesButton: ButtonV2;

  public isAnalyticalStorageEnabled: boolean;
  private collection: ViewModels.Collection;
  private container: Explorer;
  private changeFeedPolicyVisible: boolean;
  private isFixedContainer: boolean;
  private autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  private shouldShowIndexingPolicyEditor: boolean;
  private mongoDBCollectionGetResult: MongoDBCollectionGetResults;

  constructor(props: SettingsComponentProps) {
    super(props);

    this.collection = this.props.settingsTab.collection as ViewModels.Collection;
    this.container = this.collection?.container;
    this.loadMongoIndexes();
    this.isAnalyticalStorageEnabled = !!this.collection?.analyticalStorageTtl();
    this.shouldShowIndexingPolicyEditor =
      this.container && !this.container.isPreferredApiCassandra() && !this.container.isPreferredApiMongoDB();

    this.changeFeedPolicyVisible = this.collection?.container.isFeatureEnabled(
      Constants.Features.enableChangeFeedPolicy
    );
    // Mongo container with system partition key still treat as "Fixed"

    this.isFixedContainer =
      !this.collection.partitionKey ||
      (this.container.isPreferredApiMongoDB() && this.collection.partitionKey.systemKey);

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
      indexingPolicyElementFocussed: false,
      shouldDiscardIndexingPolicy: false,
      isIndexingPolicyDirty: false,

      indexesToDelete: [],
      indexesToAdd: [],
      isMongoIndexingPolicyDirty: false,

      conflictResolutionPolicyMode: undefined,
      conflictResolutionPolicyModeBaseline: undefined,
      conflictResolutionPolicyPath: undefined,
      conflictResolutionPolicyPathBaseline: undefined,
      conflictResolutionPolicyProcedure: undefined,
      conflictResolutionPolicyProcedureBaseline: undefined,
      isConflictResolutionDirty: false,

      initialNotification: undefined,
      selectedTab: SettingsV2TabTypes.ScaleTab
    };

    this.saveSettingsButton = {
      isEnabled: this.isSaveSettingsButtonEnabled,
      isVisible: () => {
        return true;
      }
    };

    this.discardSettingsChangesButton = {
      isEnabled: this.isDiscardSettingsButtonEnabled,
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
  }

  componentDidUpdate(): void {
    if (this.props.settingsTab.isActive()) {
      this.props.settingsTab.getSettingsTabContainer().onUpdateTabsButtons(this.getTabsButtons());
    }
  }

  public loadMongoIndexes = async (): Promise<void> => {
    if (this.container.isPreferredApiMongoDB() && this.container.databaseAccount()) {
      this.mongoDBCollectionGetResult = await getMongoDBCollection(
        this.container.databaseAccount().id,
        this.collection.databaseId,
        this.collection.id()
      );
      this.forceUpdate();
    }
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
      (this.mongoDBCollectionGetResult && this.state.isMongoIndexingPolicyDirty)
    );
  };

  public isDiscardSettingsButtonEnabled = (): boolean => {
    return (
      this.state.isScaleDiscardable ||
      this.state.isSubSettingsDiscardable ||
      this.state.isIndexingPolicyDirty ||
      this.state.isConflictResolutionDirty ||
      (this.mongoDBCollectionGetResult && this.state.isMongoIndexingPolicyDirty)
    );
  };

  private setAutoPilotStates = (): void => {
    const offer = this.collection?.offer && this.collection.offer();
    const offerAutopilotSettings = offer?.content?.offerAutopilotSettings;

    if (
      offerAutopilotSettings &&
      offerAutopilotSettings.maxThroughput &&
      AutoPilotUtils.isValidAutoPilotThroughput(offerAutopilotSettings.maxThroughput)
    ) {
      this.setState({
        isAutoPilotSelected: true,
        wasAutopilotOriginallySet: true,
        autoPilotThroughput: offerAutopilotSettings.maxThroughput,
        autoPilotThroughputBaseline: offerAutopilotSettings.maxThroughput
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
    const offer = this.collection?.offer && this.collection.offer();
    return (
      offer &&
      Object.keys(offer).find(value => value === "headers") &&
      !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
    );
  };

  public onSaveClick = async (): Promise<void> => {
    this.props.settingsTab.isExecutionError(false);

    this.props.settingsTab.isExecuting(true);
    const startKey: number = traceStart(Action.UpdateSettings, {
      databaseAccountName: this.container.databaseAccount()?.name,
      defaultExperience: this.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.props.settingsTab.tabTitle()
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

        newCollection.defaultTtl = defaultTtl;

        newCollection.changeFeedPolicy =
          this.changeFeedPolicyVisible && this.state.changeFeedPolicy === ChangeFeedPolicyState.On
            ? {
                retentionDuration: Constants.BackendDefaults.maxChangeFeedRetentionDuration
              }
            : undefined;

        newCollection.analyticalStorageTtl = this.getAnalyticalStorageTtl();

        newCollection.geospatialConfig = {
          type: this.state.geospatialConfigType
        };

        const conflictResolutionChanges: DataModels.ConflictResolutionPolicy = this.getUpdatedConflictResolutionPolicy();
        if (conflictResolutionChanges) {
          newCollection.conflictResolutionPolicy = conflictResolutionChanges;
        }

        newCollection.indexingPolicy = this.state.indexingPolicyContent;

        const updatedCollection: DataModels.Collection = await updateCollection(
          this.collection.databaseId,
          this.collection.id(),
          newCollection
        );
        console.log("updated coll:" + JSON.stringify(updatedCollection));
        this.collection.rawDataModel = updatedCollection;
        this.collection.defaultTtl(updatedCollection.defaultTtl);
        this.collection.analyticalStorageTtl(updatedCollection.analyticalStorageTtl);
        this.collection.id(updatedCollection.id);
        this.collection.indexingPolicy(updatedCollection.indexingPolicy);
        this.collection.conflictResolutionPolicy(updatedCollection.conflictResolutionPolicy);
        this.collection.changeFeedPolicy(updatedCollection.changeFeedPolicy);
        this.collection.geospatialConfig(updatedCollection.geospatialConfig);
        this.setState({
          isSubSettingsSaveable: false,
          isSubSettingsDiscardable: false,
          isIndexingPolicyDirty: false,
          isConflictResolutionDirty: false
        });
      }

      if (this.state.isMongoIndexingPolicyDirty) {
        const newMongoIndexes = this.getMongoIndexesToSave();
        this.mongoDBCollectionGetResult = (await createUpdateMongoDBCollection(
          this.container.databaseAccount().id,
          this.collection.databaseId,
          this.collection.id(),
          {
            properties: {
              resource: {
                ...this.mongoDBCollectionGetResult.properties.resource,
                indexes: newMongoIndexes
              },
              options: {}
            }
          }
        )) as MongoDBCollectionGetResults;

        this.setState({
          isMongoIndexingPolicyDirty: false,
          indexesToDelete: [],
          indexesToAdd: []
        });
        this.forceUpdate();
      }

      if (this.state.isScaleSaveable) {
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
          newOffer.content.offerAutopilotSettings = {
            maxThroughput: this.state.autoPilotThroughput
          };

          // user has changed from provisioned --> autoscale
          if (this.hasProvisioningTypeChanged()) {
            headerOptions.initialHeaders[Constants.HttpHeaders.migrateOfferToAutopilot] = "true";
            delete newOffer.content.offerAutopilotSettings;
          } else {
            delete newOffer.content.offerThroughput;
          }
        } else {
          this.setState({
            isAutoPilotSelected: false
          });

          // user has changed from autoscale --> provisioned
          if (this.hasProvisioningTypeChanged()) {
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
              initialNotification: {
                description: `Throughput update for ${newThroughput} ${throughputUnit}`
              } as DataModels.Notification
            });
            this.setState({ isScaleSaveable: false, isScaleDiscardable: false });
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
          this.setState({ isScaleSaveable: false, isScaleDiscardable: false });
          if (this.state.isAutoPilotSelected) {
            this.setState({
              autoPilotThroughput: updatedOffer.content.offerAutopilotSettings.maxThroughput,
              autoPilotThroughputBaseline: updatedOffer.content.offerAutopilotSettings.maxThroughput
            });
          } else {
            this.setState({
              throughput: updatedOffer.content.offerThroughput,
              throughputBaseline: updatedOffer.content.offerThroughput
            });
          }
        }
      }
      this.container.isRefreshingExplorer(false);
      this.setBaseline();
      this.setState({ wasAutopilotOriginallySet: this.state.isAutoPilotSelected });
      traceSuccess(
        Action.UpdateSettings,
        {
          databaseAccountName: this.container.databaseAccount()?.name,
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
          databaseAccountName: this.container.databaseAccount()?.name,
          defaultExperience: this.container.defaultExperience(),
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.props.settingsTab.tabTitle()
        },
        startKey
      );
    }
    this.props.settingsTab.isExecuting(false);
  };

  public onRevertClick = (): void => {
    this.setState({
      throughput: this.state.throughputBaseline,
      timeToLive: this.state.timeToLiveBaseline,
      timeToLiveSeconds: this.state.timeToLiveSecondsBaseline,
      geospatialConfigType: this.state.geospatialConfigTypeBaseline,
      indexingPolicyContent: this.state.indexingPolicyContentBaseline,
      indexesToAdd: [],
      indexesToDelete: [],
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
      isMongoIndexingPolicyDirty: false,
      isConflictResolutionDirty: false
    });
  };

  private getMongoIndexesToSave = (): MongoIndex[] => {
    let finalIndexes: MongoIndex[] = [];
    this.mongoDBCollectionGetResult.properties.resource.indexes.map((mongoIndex: MongoIndex, index: number) => {
      if (!this.state.indexesToDelete.includes(index)) {
        finalIndexes.push(mongoIndex);
      }
    });
    finalIndexes = finalIndexes.concat(this.state.indexesToAdd);
    return finalIndexes;
  };

  private onScaleSaveableChange = (isScaleSaveable: boolean): void =>
    this.setState({ isScaleSaveable: isScaleSaveable });

  private onScaleDiscardableChange = (isScaleDiscardable: boolean): void =>
    this.setState({ isScaleDiscardable: isScaleDiscardable });

  private onIndexingPolicyElementFocusChange = (indexingPolicyElementFocussed: boolean): void =>
    this.setState({ indexingPolicyElementFocussed: indexingPolicyElementFocussed });

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
          tabTitle: this.props.settingsTab.tabTitle()
        },
        this.props.settingsTab.onLoadStartKey
      );
      this.props.settingsTab.onLoadStartKey = undefined;
    }
  };

  private onIndexDelete = (index: number): void =>
    this.setState({ indexesToDelete: [...this.state.indexesToDelete, index] });

  private onRevertIndexDelete = (index: number): void => {
    let indexesToDelete = [...this.state.indexesToDelete];
    indexesToDelete.splice(index, 1);
    this.setState({ indexesToDelete: [...indexesToDelete] });
  };

  private onRevertIndexAdd = (index: number): void => {
    let indexesToAdd = [...this.state.indexesToAdd];
    indexesToAdd.splice(index, 1);
    this.setState({ indexesToAdd: [...indexesToAdd] });
  };

  private onIndexAdd = (newMongoIndex: MongoIndex): void =>
    this.setState({ indexesToAdd: [...this.state.indexesToAdd, newMongoIndex] });

  private onConflictResolutionPolicyModeChange = (
    event?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void =>
    this.setState({
      conflictResolutionPolicyMode:
        DataModels.ConflictResolutionMode[option.key as keyof typeof DataModels.ConflictResolutionMode]
    });

  private onConflictResolutionPolicyPathChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => this.setState({ conflictResolutionPolicyPath: newValue });

  private onConflictResolutionPolicyProcedureChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => this.setState({ conflictResolutionPolicyProcedure: newValue });

  private onConflictResolutionDirtyChange = (isConflictResolutionDirty: boolean): void =>
    this.setState({ isConflictResolutionDirty: isConflictResolutionDirty });

  public getTtlValue = (value: string): TtlType => {
    switch (value) {
      case TtlOn:
        return TtlType.On;
      case TtlOff:
        return TtlType.Off;
      case TtlOnNoDefault:
        return TtlType.OnNoDefault;
    }
    return undefined;
  };

  private onTtlChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void =>
    this.setState({ timeToLive: this.getTtlValue(option.key) });

  private onTimeToLiveSecondsChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    let newTimeToLiveSeconds = parseInt(newValue);
    newTimeToLiveSeconds = isNaN(newTimeToLiveSeconds) ? SettingsComponent.zeroSeconds : newTimeToLiveSeconds;
    this.setState({ timeToLiveSeconds: newTimeToLiveSeconds });
  };

  private onGeoSpatialConfigTypeChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void =>
    this.setState({ geospatialConfigType: GeospatialConfigType[option.key as keyof typeof GeospatialConfigType] });

  private onAnalyticalStorageTtlSelectionChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void => this.setState({ analyticalStorageTtlSelection: this.getTtlValue(option.key) });

  private onAnalyticalStorageTtlSecondsChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => {
    let newAnalyticalStorageTtlSeconds = parseInt(newValue);
    newAnalyticalStorageTtlSeconds = isNaN(newAnalyticalStorageTtlSeconds)
      ? SettingsComponent.zeroSeconds
      : newAnalyticalStorageTtlSeconds;
    this.setState({ analyticalStorageTtlSeconds: newAnalyticalStorageTtlSeconds });
  };

  private onChangeFeedPolicyChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void =>
    this.setState({ changeFeedPolicy: ChangeFeedPolicyState[option.key as keyof typeof ChangeFeedPolicyState] });

  private onSubSettingsSaveableChange = (isSubSettingsSaveable: boolean): void =>
    this.setState({ isSubSettingsSaveable: isSubSettingsSaveable });

  private onSubSettingsDiscardableChange = (isSubSettingsDiscardable: boolean): void =>
    this.setState({ isSubSettingsDiscardable: isSubSettingsDiscardable });

  private onIndexingPolicyDirtyChange = (isIndexingPolicyDirty: boolean): void =>
    this.setState({ isIndexingPolicyDirty: isIndexingPolicyDirty });

  private onMongoIndexingPolicyDirtyChange = (isMongoIndexingPolicyDirty: boolean): void =>
    this.setState({ isMongoIndexingPolicyDirty: isMongoIndexingPolicyDirty });

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
      mode: parseConflictResolutionMode(this.state.conflictResolutionPolicyMode)
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

    const offerThroughput = this.collection?.offer && this.collection.offer()?.content?.offerThroughput;
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
      geospatialConfigTypeBaseline: geoSpatialConfigType
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
      autoPilotTiersList: this.autoPilotTiersList,
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
      initialNotification: this.props.settingsTab.pendingNotification()
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
      onSubSettingsDiscardableChange: this.onSubSettingsDiscardableChange
    };

    const indexingPolicyComponentProps: IndexingPolicyComponentProps = {
      shouldDiscardIndexingPolicy: this.state.shouldDiscardIndexingPolicy,
      resetShouldDiscardIndexingPolicy: this.resetShouldDiscardIndexingPolicy,
      indexingPolicyContent: this.state.indexingPolicyContent,
      indexingPolicyContentBaseline: this.state.indexingPolicyContentBaseline,
      onIndexingPolicyElementFocusChange: this.onIndexingPolicyElementFocusChange,
      onIndexingPolicyContentChange: this.onIndexingPolicyContentChange,
      logIndexingPolicySuccessMessage: this.logIndexingPolicySuccessMessage,
      onIndexingPolicyDirtyChange: this.onIndexingPolicyDirtyChange
    };

    const mongoIndexingPolicyComponentProps: MongoIndexingPolicyComponentProps = {
      mongoIndexes: this.mongoDBCollectionGetResult?.properties.resource.indexes,
      onIndexDelete: this.onIndexDelete,
      indexesToDelete: this.state.indexesToDelete,
      onRevertIndexDelete: this.onRevertIndexDelete,
      indexesToAdd: this.state.indexesToAdd,
      onRevertIndexAdd: this.onRevertIndexAdd,
      onIndexAdd: this.onIndexAdd,
      onMongoIndexingPolicyDirtyChange: this.onMongoIndexingPolicyDirtyChange
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
      onConflictResolutionDirtyChange: this.onConflictResolutionDirtyChange
    };

    const tabs: SettingsV2TabInfo[] = [];
    if (!hasDatabaseSharedThroughput(this.collection)) {
      tabs.push({
        tab: SettingsV2TabTypes.ScaleTab,
        content: <ScaleComponent {...scaleComponentProps} />
      });
    }

    tabs.push({
      tab: SettingsV2TabTypes.SubSettingsTab,
      content: <SubSettingsComponent {...subSettingsComponentProps} />
    });

    if (this.shouldShowIndexingPolicyEditor) {
      tabs.push({
        tab: SettingsV2TabTypes.IndexingPolicyTab,
        content: <IndexingPolicyComponent {...indexingPolicyComponentProps} />
      });
    } else if (this.mongoDBCollectionGetResult) {
      tabs.push({
        tab: SettingsV2TabTypes.IndexingPolicyTab,
        content: <MongoIndexingPolicyComponent {...mongoIndexingPolicyComponentProps} />
      });
    }

    if (this.hasConflictResolution()) {
      tabs.push({
        tab: SettingsV2TabTypes.ConflictResolutionTab,
        content: <ConflictResolutionComponent {...conflictResolutionPolicyComponentProps} />
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
