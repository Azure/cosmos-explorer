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
  updateThroughputDelayedApplyWarningMessage
} from "../SettingsRenderUtils";
import { getMaxRUs, getMinRUs, hasDatabaseSharedThroughput } from "../SettingsUtils";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";
import { Text, TextField, Stack, Label, MessageBar, MessageBarType } from "office-ui-fabric-react";
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
    // Mongo container with system partition key still treat as "Fixed"
    const isFixed =
      !this.props.collection.partitionKey ||
      (this.props.container.isPreferredApiMongoDB() && this.props.collection.partitionKey.systemKey);
    const capacity: string = isFixed ? "Fixed" : "Unlimited";
    return (
      <Stack {...titleAndInputStackProps}>
        <Label>Storage capacity</Label>
        <Text>{capacity}</Text>
      </Stack>
    );
  };

  public getMaxRUThroughputInputLimit = (): number => {
    if (configContext.platform === Platform.Hosted && this.props.collection.partitionKey) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
    }

    return getMaxRUs(this.props.collection, this.props.container);
  };

  public getThroughputTitle = (): string => {
    if (this.props.isAutoPilotSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText();
    }

    const minThroughput: string = getMinRUs(this.props.collection, this.props.container).toLocaleString();
    const maxThroughput: string =
      this.canThroughputExceedMaximumValue() && !this.props.isFixedContainer
        ? "unlimited"
        : getMaxRUs(this.props.collection, this.props.container).toLocaleString();
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

    const offer = this.props.collection?.offer && this.props.collection.offer();
    if (
      offer &&
      Object.keys(offer).find(value => {
        return value === "headers";
      }) &&
      !!(offer as DataModels.OfferWithHeaders).headers[Constants.HttpHeaders.offerReplacePending]
    ) {
      const throughput = offer?.content?.offerAutopilotSettings?.maxThroughput;

      const targetThroughput =
        offer.content?.offerAutopilotSettings?.targetMaxThroughput || offer?.content?.offerThroughput;

      return getThroughputApplyShortDelayMessage(
        this.props.isAutoPilotSelected,
        throughput,
        throughputUnit,
        this.props.collection.databaseId,
        this.props.collection.id(),
        targetThroughput
      );
    }

    return undefined;
  };

  public getThroughputWarningMessage = (): JSX.Element => {
    const throughputExceedsBackendLimits: boolean =
      this.canThroughputExceedMaximumValue() &&
      getMaxRUs(this.props.collection, this.props.container) <=
        SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
      this.props.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;

    if (throughputExceedsBackendLimits && !!this.props.collection.partitionKey && !this.props.isFixedContainer) {
      return updateThroughputBeyondLimitWarningMessage;
    }

    const throughputExceedsMaxValue: boolean =
      !this.isEmulator && this.props.throughput > getMaxRUs(this.props.collection, this.props.container);

    if (throughputExceedsMaxValue && !!this.props.collection.partitionKey && !this.props.isFixedContainer) {
      return updateThroughputDelayedApplyWarningMessage;
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
      serverId={this.props.container.serverId()}
      throughput={this.props.throughput}
      throughputBaseline={this.props.throughputBaseline}
      onThroughputChange={this.props.onThroughputChange}
      minimum={getMinRUs(this.props.collection, this.props.container)}
      maximum={this.getMaxRUThroughputInputLimit()}
      isEnabled={!hasDatabaseSharedThroughput(this.props.collection)}
      canExceedMaximumValue={this.canThroughputExceedMaximumValue()}
      label={this.getThroughputTitle()}
      isEmulator={this.isEmulator}
      isFixed={this.props.isFixedContainer}
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
    />
  );

  public render(): JSX.Element {
    return (
      <Stack {...subComponentStackProps}>
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
