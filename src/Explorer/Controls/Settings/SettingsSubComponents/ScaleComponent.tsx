import * as React from "react";
import * as Constants from "../../../../Common/Constants";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import * as SharedConstants from "../../../../Shared/Constants";
import Explorer from "../../../Explorer";
import {
  getTextFieldStyles,
  subComponentStackProps,
  titleAndInputStackProps,
  throughputUnit,
  getThroughputApplyLongDelayMessage,
  getThroughputApplyShortDelayMessage,
  updateThroughputBeyondLimitWarningMessage,
} from "../SettingsRenderUtils";
import { hasDatabaseSharedThroughput } from "../SettingsUtils";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";
import { Link, Text, TextField, Stack, Label, MessageBar, MessageBarType } from "office-ui-fabric-react";
import { configContext, Platform } from "../../../../ConfigContext";

export interface ScaleComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
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
  initialNotification: DataModels.Notification;
}

export class ScaleComponent extends React.Component<ScaleComponentProps> {
  private isEmulator: boolean;
  constructor(props: ScaleComponentProps) {
    super(props);
    this.isEmulator = configContext.platform === Platform.Emulator;
  }

  public isAutoScaleEnabled = (): boolean => {
    const accountCapabilities: DataModels.Capability[] = this.props.container?.databaseAccount()?.properties
      ?.capabilities;
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

  private getStorageCapacityTitle = (): JSX.Element => {
    const capacity: string = this.props.isFixedContainer ? "Fixed" : "Unlimited";
    return (
      <Stack {...titleAndInputStackProps}>
        <Label>Storage capacity</Label>
        <Text>{capacity}</Text>
      </Stack>
    );
  };

  public getMaxRUs = (): number => {
    if (this.props.container?.isTryCosmosDBSubscription()) {
      return Constants.TryCosmosExperience.maxRU;
    }

    if (this.props.isFixedContainer) {
      return SharedConstants.CollectionCreation.MaxRUPerPartition;
    }

    return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
  };

  public getMinRUs = (): number => {
    if (this.props.container?.isTryCosmosDBSubscription()) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs400;
    }

    return (
      this.props.collection.offer()?.minimumThroughput || SharedConstants.CollectionCreation.DefaultCollectionRUs400
    );
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
    return (
      !this.props.isFixedContainer &&
      configContext.platform === Platform.Portal &&
      !this.props.container.isRunningOnNationalCloud()
    );
  };

  public getInitialNotificationElement = (): JSX.Element => {
    if (this.props.initialNotification) {
      return this.getLongDelayMessage();
    }

    const offer = this.props.collection?.offer();
    if (offer?.offerReplacePending) {
      const throughput = offer.manualThroughput || offer.autoscaleMaxThroughput;
      return getThroughputApplyShortDelayMessage(
        this.props.isAutoPilotSelected,
        throughput,
        throughputUnit,
        this.props.collection.databaseId,
        this.props.collection.id()
      );
    }

    return undefined;
  };

  public getThroughputWarningMessage = (): JSX.Element => {
    const throughputExceedsBackendLimits: boolean =
      this.canThroughputExceedMaximumValue() &&
      this.props.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;

    if (throughputExceedsBackendLimits && !!this.props.collection.partitionKey && !this.props.isFixedContainer) {
      return updateThroughputBeyondLimitWarningMessage;
    }

    return undefined;
  };

  public getLongDelayMessage = (): JSX.Element => {
    const matches: string[] = this.props.initialNotification?.description.match(
      `Throughput update for (.*) ${throughputUnit}`
    );

    const throughput = this.props.throughputBaseline;
    const targetThroughput: number = matches.length > 1 && Number(matches[1]);
    if (targetThroughput) {
      return getThroughputApplyLongDelayMessage(
        this.props.wasAutopilotOriginallySet,
        throughput,
        throughputUnit,
        this.props.collection.databaseId,
        this.props.collection.id(),
        targetThroughput
      );
    }
    return <></>;
  };

  private getThroughputInputComponent = (): JSX.Element => (
    <ThroughputInputAutoPilotV3Component
      databaseAccount={this.props.container.databaseAccount()}
      databaseName={this.props.collection.databaseId}
      collectionName={this.props.collection.id()}
      serverId={this.props.container.serverId()}
      throughput={this.props.throughput}
      throughputBaseline={this.props.throughputBaseline}
      onThroughputChange={this.props.onThroughputChange}
      minimum={this.getMinRUs()}
      maximum={this.getMaxRUs()}
      isEnabled={!hasDatabaseSharedThroughput(this.props.collection)}
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
      onScaleSaveableChange={this.props.onScaleSaveableChange}
      onScaleDiscardableChange={this.props.onScaleDiscardableChange}
      getThroughputWarningMessage={this.getThroughputWarningMessage}
      usageSizeInKB={this.props.collection.usageSizeInKB()}
    />
  );

  private isFreeTierAccount(): boolean {
    const databaseAccount = this.props.container?.databaseAccount();
    return databaseAccount?.properties?.enableFreeTier;
  }

  private getFreeTierInfoMessage(): JSX.Element {
    return (
      <Text>
        With free tier, you will get the first 400 RU/s and 5 GB of storage in this account for free. To keep your
        account free, keep the total RU/s across all resources in the account to 400 RU/s.
        <Link
          href="https://docs.microsoft.com/en-us/azure/cosmos-db/understand-your-bill#billing-examples-with-free-tier-accounts"
          target="_blank"
        >
          Learn more.
        </Link>
      </Text>
    );
  }

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
        {!this.isAutoScaleEnabled() && (
          <Stack {...subComponentStackProps}>
            {this.getThroughputInputComponent()}
            {this.getStorageCapacityTitle()}
          </Stack>
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
