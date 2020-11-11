import { Label, MessageBar, MessageBarType, Stack, Text, TextField } from "office-ui-fabric-react";
import * as React from "react";
import * as Constants from "../../../../Common/Constants";
import { configContext, Platform } from "../../../../ConfigContext";
import * as DataModels from "../../../../Contracts/DataModels";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";
import Explorer from "../../../Explorer";
import {
  getTextFieldStyles,
  getThroughputApplyShortDelayMessage,
  subComponentStackProps,
  throughputUnit,
  titleAndInputStackProps
} from "../SettingsRenderUtils";
import { getMinRUs, hasDatabaseSharedThroughput } from "../SettingsUtils";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";

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

  public getThroughputTitle = (): string => {
    if (this.props.isAutoPilotSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText();
    }

    const minThroughput: string = getMinRUs(this.props.collection, this.props.container).toLocaleString();
    const maxThroughput: string = !this.props.isFixedContainer ? "unlimited" : "10000";
    return `Throughput (${minThroughput} - ${maxThroughput} RU/s)`;
  };

  public getInitialNotificationElement = (): JSX.Element => {
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

  private getThroughputInputComponent = (): JSX.Element => (
    <ThroughputInputAutoPilotV3Component
      databaseAccount={this.props.container.databaseAccount()}
      serverId={this.props.container.serverId()}
      throughput={this.props.throughput}
      throughputBaseline={this.props.throughputBaseline}
      onThroughputChange={this.props.onThroughputChange}
      minimum={getMinRUs(this.props.collection, this.props.container)}
      isEnabled={!hasDatabaseSharedThroughput(this.props.collection)}
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
