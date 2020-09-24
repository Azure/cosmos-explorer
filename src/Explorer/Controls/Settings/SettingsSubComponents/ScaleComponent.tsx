import * as React from "react";
import * as Constants from "../../../../Common/Constants";
import { ThroughputInputComponent } from "./ThroughputInputComponents/ThroughputInputComponent";
import { ThroughputInputAutoPilotV3Component } from "./ThroughputInputComponents/ThroughputInputAutoPilotV3Component";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import * as SharedConstants from "../../../../Shared/Constants";
import Explorer from "../../../Explorer";
import { PlatformType } from "../../../../PlatformType";
import {
  getAutoPilotV3SpendElement,
  getAutoPilotV2SpendElement,
  getEstimatedSpendElement,
  getEstimatedAutoscaleSpendElement,
  getTextFieldStyles,
  subComponentStackProps,
  titleAndInputStackProps,
  throughputUnit,
  getThroughputApplyLongDelayMessage,
  getThroughputApplyShortDelayMessage,
  manualToAutoscaleDisclaimerElement,
  updateThroughputBeyondLimitWarningMessage,
  updateThroughputDelayedApplyWarningMessage
} from "../SettingsRenderUtils";
import { getMaxRUs, getMinRUs, hasDatabaseSharedThroughput } from "../SettingsUtils";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";
import { Text, TextField, Stack, Label, MessageBar, MessageBarType } from "office-ui-fabric-react";

export interface ScaleComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  hasProvisioningTypeChanged: () => boolean;
  hasAutoPilotV2FeatureFlag: boolean;
  isFixedContainer: boolean;
  autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  onThroughputChange: (newThroughput: number) => void;
  throughput: number;
  throughputBaseline: number;
  autoPilotThroughput: number;
  autoPilotThroughputBaseline: number;
  selectedAutoPilotTier: DataModels.AutopilotTier;
  selectedAutoPilotTierBaseline: DataModels.AutopilotTier;
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  userCanChangeProvisioningTypes: boolean;
  overrideWithProvisionedThroughputSettings: () => boolean;
  onAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  onAutoPilotTierChange: (selectedAutoPilotTier: DataModels.AutopilotTier) => void;
  onMaxAutoPilotThroughputChange: (newThroughput: number) => void;
  onScaleSaveableChange: (isScaleSaveable: boolean) => void;
  onScaleDiscardableChange: (isScaleDiscardable: boolean) => void;
  initialNotification: DataModels.Notification;
}

export class ScaleComponent extends React.Component<ScaleComponentProps> {
  private canExceedMaximumValue: boolean;
  private isEmulator: boolean;
  constructor(props: ScaleComponentProps) {
    super(props);
    this.canExceedMaximumValue = this.props.container.canExceedMaximumValue();
    this.isEmulator = this.props.container.isEmulator;
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
    if (this.props.container?.getPlatformType() === PlatformType.Hosted && this.props.collection.partitionKey) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
    }

    return getMaxRUs(this.props.collection, this.props.container);
  };

  private getAutoPilotUsageCost = (): JSX.Element => {
    const autoPilot = !this.props.hasAutoPilotV2FeatureFlag
      ? this.props.autoPilotThroughput
      : this.props.selectedAutoPilotTier;
    if (!autoPilot) {
      return <></>;
    }
    return !this.props.hasAutoPilotV2FeatureFlag
      ? getAutoPilotV3SpendElement(
          autoPilot,
          false /* isDatabaseThroughput */,
          !this.isEmulator ? this.getRequestUnitsUsageCost() : <></>
        )
      : getAutoPilotV2SpendElement(autoPilot, false /* isDatabaseThroughput */);
  };

  public getThroughputTitle = (): string => {
    if (this.props.isAutoPilotSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText(this.props.hasAutoPilotV2FeatureFlag);
    }

    const minThroughput: string = getMinRUs(this.props.collection, this.props.container).toLocaleString();
    const maxThroughput: string =
      this.canThroughputExceedMaximumValue() && !this.props.isFixedContainer
        ? "unlimited"
        : getMaxRUs(this.props.collection, this.props.container).toLocaleString();
    return `Throughput (${minThroughput} - ${maxThroughput} RU/s)`;
  };

  public canThroughputExceedMaximumValue = (): boolean => {
    const isPublicAzurePortal: boolean =
      this.props.container.getPlatformType() === PlatformType.Portal && !this.props.container.isRunningOnNationalCloud();
    const hasPartitionKey = !!this.props.collection.partitionKey;
  
    return isPublicAzurePortal && hasPartitionKey;
  };
  
  private getRequestUnitsUsageCost = (): JSX.Element => {
    const account = this.props.container.databaseAccount();
    if (!account) {
      return <></>;
    }

    const serverId: string = this.props.container.serverId();
    const offerThroughput: number = this.props.throughput;

    const regions = account?.properties?.readLocations?.length || 1;
    const multimaster = account?.properties?.enableMultipleWriteLocations || false;

    let estimatedSpend: JSX.Element;

    if (!this.props.isAutoPilotSelected) {
      estimatedSpend = getEstimatedSpendElement(
        // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
        this.overrideWithAutoPilotSettings() ? this.props.autoPilotThroughput : offerThroughput,
        serverId,
        regions,
        multimaster,
        false
      );
    } else {
      estimatedSpend = getEstimatedAutoscaleSpendElement(
        this.props.autoPilotThroughput,
        serverId,
        regions,
        multimaster
      );
    }
    return estimatedSpend;
  };

  public overrideWithAutoPilotSettings = (): boolean => {
    if (this.props.hasAutoPilotV2FeatureFlag) {
      return false;
    }
    return this.props.hasProvisioningTypeChanged() && this.props.wasAutopilotOriginallySet;
  };

  private getWarningMessage = (): JSX.Element => {
    const throughputExceedsBackendLimits: boolean =
      this.canThroughputExceedMaximumValue() &&
      getMaxRUs(this.props.collection, this.props.container) <=
        SharedConstants.CollectionCreation.DefaultCollectionRUs1Million &&
      this.props.throughput > SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;

    const throughputExceedsMaxValue: boolean =
      !this.isEmulator && this.props.throughput > getMaxRUs(this.props.collection, this.props.container);

    const offer = this.props.collection?.offer && this.props.collection.offer();

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
      if (offer?.content?.offerAutopilotSettings) {
        if (!this.props.hasAutoPilotV2FeatureFlag) {
          throughput = offer.content.offerAutopilotSettings.maxThroughput;
        } else {
          throughput = offer.content.offerAutopilotSettings.maximumTierThroughput;
        }
      }

      const targetThroughput =
        (offer?.content?.offerAutopilotSettings && offer.content.offerAutopilotSettings.targetMaxThroughput) ||
        offer?.content?.offerThroughput;

      return getThroughputApplyShortDelayMessage(
        this.props.isAutoPilotSelected,
        throughput,
        throughputUnit,
        this.props.collection.databaseId,
        this.props.collection.id(),
        targetThroughput
      );
    }

    if (!this.props.hasAutoPilotV2FeatureFlag && this.props.overrideWithProvisionedThroughputSettings()) {
      return manualToAutoscaleDisclaimerElement;
    }

    if (throughputExceedsBackendLimits && !!this.props.collection.partitionKey && !this.props.isFixedContainer) {
      return updateThroughputBeyondLimitWarningMessage;
    }

    if (throughputExceedsMaxValue && !!this.props.collection.partitionKey && !this.props.isFixedContainer) {
      return updateThroughputDelayedApplyWarningMessage;
    }

    return undefined;
  };

  private getThroughputInputComponent = (): JSX.Element =>
    this.props.hasAutoPilotV2FeatureFlag ? (
      <ThroughputInputComponent
        showAsMandatory={false}
        isFixed={false}
        throughput={this.props.throughput}
        throughputBaseline={this.props.throughputBaseline}
        onThroughputChange={this.props.onThroughputChange}
        minimum={getMinRUs(this.props.collection, this.props.container)}
        maximum={this.getMaxRUThroughputInputLimit()}
        isEnabled={!hasDatabaseSharedThroughput(this.props.collection)}
        canExceedMaximumValue={
          this.canThroughputExceedMaximumValue() || this.canExceedMaximumValue
        }
        label={this.getThroughputTitle()}
        isEmulator={this.isEmulator}
        requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
        showAutoPilot={this.props.userCanChangeProvisioningTypes}
        isAutoPilotSelected={this.props.isAutoPilotSelected}
        onAutoPilotSelected={this.props.onAutoPilotSelected}
        autoPilotTiersList={this.props.autoPilotTiersList}
        spendAckChecked={false}
        selectedAutoPilotTier={this.props.selectedAutoPilotTier}
        selectedAutoPilotTierBaseline={this.props.selectedAutoPilotTierBaseline}
        onAutoPilotTierChange={this.props.onAutoPilotTierChange}
        autoPilotUsageCost={this.getAutoPilotUsageCost()}
        hasProvisioningTypeChanged={this.props.hasProvisioningTypeChanged}
        onScaleSaveableChange={this.props.onScaleSaveableChange}
        onScaleDiscardableChange={this.props.onScaleDiscardableChange}
        getWarningMessage={this.getWarningMessage}
      />
    ) : (
      <ThroughputInputAutoPilotV3Component
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
        requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
        showAutoPilot={this.props.userCanChangeProvisioningTypes}
        isAutoPilotSelected={this.props.isAutoPilotSelected}
        onAutoPilotSelected={this.props.onAutoPilotSelected}
        maxAutoPilotThroughput={this.props.autoPilotThroughput}
        maxAutoPilotThroughputBaseline={this.props.autoPilotThroughputBaseline}
        onMaxAutoPilotThroughputChange={this.props.onMaxAutoPilotThroughputChange}
        autoPilotUsageCost={this.getAutoPilotUsageCost()}
        overrideWithAutoPilotSettings={this.overrideWithAutoPilotSettings()}
        overrideWithProvisionedThroughputSettings={this.props.overrideWithProvisionedThroughputSettings()}
        spendAckChecked={false}
        hasProvisioningTypeChanged={this.props.hasProvisioningTypeChanged}
        onScaleSaveableChange={this.props.onScaleSaveableChange}
        onScaleDiscardableChange={this.props.onScaleDiscardableChange}
        getWarningMessage={this.getWarningMessage}
      />
    );

  private getInitialNotificationElement = (): JSX.Element => {
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

  public render(): JSX.Element {
    return (
      <Stack {...subComponentStackProps}>
        {this.props.initialNotification && (
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
