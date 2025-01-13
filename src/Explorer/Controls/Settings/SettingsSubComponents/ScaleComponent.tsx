import { Link, MessageBar, MessageBarType, Stack, Text, TextField } from "@fluentui/react";
import * as React from "react";
import * as Constants from "../../../../Common/Constants";
import { Platform, configContext } from "../../../../ConfigContext";
import * as DataModels from "../../../../Contracts/DataModels";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as SharedConstants from "../../../../Shared/Constants";
import { userContext } from "../../../../UserContext";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";
import { isRunningOnNationalCloud } from "../../../../Utils/CloudUtils";
import {
  getTextFieldStyles,
  getThroughputApplyShortDelayMessage,
  subComponentStackProps,
  throughputUnit,
  titleAndInputStackProps,
} from "../SettingsRenderUtils";
import { hasDatabaseSharedThroughput } from "../SettingsUtils";
import { ThroughputBucketsComponent } from "./ThroughputInputComponents/ThroughputBucketsComponent";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";

export interface ScaleComponentProps {
  collection: ViewModels.Collection;
  database: ViewModels.Database;
  isFixedContainer: boolean;
  onThroughputChange: (newThroughput: number) => void;
  throughput: number;
  throughputBaseline: number;
  autoPilotThroughput: number;
  autoPilotThroughputBaseline: number;
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  onAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  onMaxAutoPilotThroughputChange: (newThroughput: number) => void;
  onScaleSaveableChange: (isScaleSaveable: boolean) => void;
  onScaleDiscardableChange: (isScaleDiscardable: boolean) => void;
  throughputBuckets: DataModels.ThroughputBucket[];
  throughputBucketsBaseline: DataModels.ThroughputBucket[];
  enableThroughputBuckets: boolean;
  onThroughputBucketChange: (throughputBuckets: DataModels.ThroughputBucket[]) => void;
  throughputError?: string;
}

interface ScaleComponentState {
  isThroughputSaveable: boolean;
  isBucketsSaveable: boolean;
  isThroughputDiscardable: boolean;
  isBucketsDiscardable: boolean;
}

export class ScaleComponent extends React.Component<ScaleComponentProps, ScaleComponentState> {
  private isEmulator: boolean;
  private offer: DataModels.Offer;
  private databaseId: string;
  private collectionId: string;

  constructor(props: ScaleComponentProps) {
    super(props);
    this.isEmulator = configContext.platform === Platform.Emulator;
    this.offer = this.props.database?.offer() || this.props.collection?.offer();
    this.databaseId = this.props.database?.id() || this.props.collection.databaseId;
    this.collectionId = this.props.collection?.id();
    this.state = {
      isThroughputSaveable: false,
      isBucketsSaveable: false,
      isThroughputDiscardable: false,
      isBucketsDiscardable: false,
    };
  }

  public isAutoScaleEnabled = (): boolean => {
    const accountCapabilities: DataModels.Capability[] = userContext?.databaseAccount?.properties?.capabilities;
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

  public getMaxRUs = (): number => {
    if (userContext.isTryCosmosDBSubscription) {
      return Constants.TryCosmosExperience.maxRU;
    }

    if (this.props.isFixedContainer) {
      return SharedConstants.CollectionCreation.MaxRUPerPartition;
    }

    return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
  };

  public getMinRUs = (): number => {
    if (userContext.isTryCosmosDBSubscription) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
    }

    return this.offer?.minimumThroughput || SharedConstants.CollectionCreation.DefaultCollectionRUs400;
  };

  public getThroughputTitle = (): string => {
    if (this.props.isAutoPilotSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText();
    }

    const minThroughput: string = this.getMinRUs().toLocaleString();
    const maxThroughput: string = !this.props.isFixedContainer ? "unlimited" : this.getMaxRUs().toLocaleString();
    return `Throughput (${minThroughput} - ${maxThroughput} RU/s)`;
  };

  public canThroughputExceedMaximumValue = (): boolean => {
    return !this.props.isFixedContainer && configContext.platform === Platform.Portal && !isRunningOnNationalCloud();
  };

  public getInitialNotificationElement = (): JSX.Element => {
    if (this.offer?.offerReplacePending) {
      const throughput = this.offer.manualThroughput || this.offer.autoscaleMaxThroughput;
      return getThroughputApplyShortDelayMessage(
        this.props.isAutoPilotSelected,
        throughput,
        throughputUnit,
        this.databaseId,
        this.collectionId,
      );
    }

    return undefined;
  };

  private getThroughputInputComponent = (): JSX.Element => (
    <ThroughputInputAutoPilotV3Component
      databaseAccount={userContext?.databaseAccount}
      databaseName={this.databaseId}
      collectionName={this.collectionId}
      throughput={this.props.throughput}
      throughputBaseline={this.props.throughputBaseline}
      onThroughputChange={this.props.onThroughputChange}
      minimum={this.getMinRUs()}
      maximum={this.getMaxRUs()}
      isEnabled={!!this.props.database || !hasDatabaseSharedThroughput(this.props.collection)}
      canExceedMaximumValue={this.canThroughputExceedMaximumValue()}
      label={this.getThroughputTitle()}
      isEmulator={this.isEmulator}
      isFixed={this.props.isFixedContainer}
      isFreeTierAccount={this.isFreeTierAccount()}
      isAutoPilotSelected={this.props.isAutoPilotSelected}
      onAutoPilotSelected={this.props.onAutoPilotSelected}
      wasAutopilotOriginallySet={this.props.wasAutopilotOriginallySet}
      maxAutoPilotThroughput={this.props.autoPilotThroughput}
      maxAutoPilotThroughputBaseline={this.props.autoPilotThroughputBaseline}
      onMaxAutoPilotThroughputChange={this.props.onMaxAutoPilotThroughputChange}
      spendAckChecked={false}
      onScaleSaveableChange={this.handleThroughputSaveableChange}
      onScaleDiscardableChange={this.handleThroughputDiscardableChange}
      usageSizeInKB={this.props.collection?.usageSizeInKB()}
      throughputError={this.props.throughputError}
      instantMaximumThroughput={this.offer?.instantMaximumThroughput}
      softAllowedMaximumThroughput={this.offer?.softAllowedMaximumThroughput}
    />
  );

  private isFreeTierAccount(): boolean {
    return userContext?.databaseAccount?.properties?.enableFreeTier;
  }

  private getFreeTierInfoMessage(): JSX.Element {
    const freeTierLimits = SharedConstants.FreeTierLimits;
    return (
      <Text>
        With free tier, you will get the first {freeTierLimits.RU} RU/s and {freeTierLimits.Storage} GB of storage in
        this account for free. To keep your account free, keep the total RU/s across all resources in the account to{" "}
        {freeTierLimits.RU} RU/s.
        <Link
          href="https://docs.microsoft.com/en-us/azure/cosmos-db/understand-your-bill#billing-examples-with-free-tier-accounts"
          target="_blank"
        >
          Learn more.
        </Link>
      </Text>
    );
  }

  private updateScaleSettingsState = (updates: Partial<ScaleComponentState>) => {
    this.setState(
      (prevState) => {
        const hasChanges = Object.keys(updates).some(
          (key) => prevState[key as keyof ScaleComponentState] !== updates[key as keyof ScaleComponentState],
        );
        return hasChanges ? { ...prevState, ...updates } : null;
      },
      () => {
        const isSaveable = this.state.isThroughputSaveable || this.state.isBucketsSaveable;
        const isDiscardable = this.state.isThroughputDiscardable || this.state.isBucketsDiscardable;
        this.props.onScaleSaveableChange(isSaveable);
        this.props.onScaleDiscardableChange(isDiscardable);
      },
    );
  };

  private handleThroughputSaveableChange = (isSaveable: boolean) => {
    this.updateScaleSettingsState({ isThroughputSaveable: isSaveable });
  };

  private handleThroughputDiscardableChange = (isDiscardable: boolean) => {
    this.updateScaleSettingsState({ isThroughputDiscardable: isDiscardable });
  };

  private handleBucketsSaveableChange = (isSaveable: boolean) => {
    this.updateScaleSettingsState({ isBucketsSaveable: isSaveable });
  };

  private handleBucketsDiscardableChange = (isDiscardable: boolean) => {
    this.updateScaleSettingsState({ isBucketsDiscardable: isDiscardable });
  };

  public render(): JSX.Element {
    return (
      <Stack {...subComponentStackProps}>
        {this.isFreeTierAccount() && (
          <MessageBar
            messageBarIconProps={{ iconName: "InfoSolid", className: "messageBarInfoIcon" }}
            styles={{ text: { fontSize: 14 } }}
          >
            {this.getFreeTierInfoMessage()}
          </MessageBar>
        )}
        {this.getInitialNotificationElement() && (
          <MessageBar messageBarType={MessageBarType.warning}>{this.getInitialNotificationElement()}</MessageBar>
        )}
        {!this.isAutoScaleEnabled() && <Stack {...subComponentStackProps}>{this.getThroughputInputComponent()}</Stack>}
        {this.props.enableThroughputBuckets && !this.props.isAutoPilotSelected && (
          <ThroughputBucketsComponent
            currentBuckets={this.props.throughputBuckets}
            throughputBucketsBaseline={this.props.throughputBucketsBaseline}
            onBucketsChange={this.props.onThroughputBucketChange}
            onSaveableChange={this.handleBucketsSaveableChange}
            onDiscardableChange={this.handleBucketsDiscardableChange}
          />
        )}

        {/* TODO: Replace link with call to the Azure Support blade */}
        {this.isAutoScaleEnabled() && (
          <Stack {...titleAndInputStackProps}>
            <Text>Throughput (RU/s)</Text>
            <TextField disabled styles={getTextFieldStyles(undefined, undefined)} />
            <Text>
              Your account has custom settings that prevents setting throughput at the container level. Please work with
              your Cosmos DB engineering team point of contact to make changes.
            </Text>
          </Stack>
        )}
      </Stack>
    );
  }
}
