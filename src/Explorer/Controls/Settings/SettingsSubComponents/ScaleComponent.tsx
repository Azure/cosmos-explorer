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
  titleAndInputStackProps
} from "../SettingsRenderUtils";
import { getMaxRUs, getMinRUs, hasDatabaseSharedThroughput, canThroughputExceedMaximumValue } from "../SettingsUtils";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";
import { Text, TextField, Stack } from "office-ui-fabric-react";

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
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  userCanChangeProvisioningTypes: boolean;
  overrideWithProvisionedThroughputSettings: () => boolean;
  onAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  onAutoPilotTierChange: (selectedAutoPilotTier: DataModels.AutopilotTier) => void;
  onMaxAutoPilotThroughputChange: (newThroughput: number) => void;
}

export class ScaleComponent extends React.Component<ScaleComponentProps> {
  private canExceedMaximumValue: boolean;
  private costsVisible: boolean;
  constructor(props: ScaleComponentProps) {
    super(props);
    this.canExceedMaximumValue = this.props.container.canExceedMaximumValue();
    this.costsVisible = !this.props.container.isEmulator;
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
        <Text>Storage capacity</Text>
        <Text>
          <b>{capacity}</b>
        </Text>
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
      ? getAutoPilotV3SpendElement(autoPilot, false /* isDatabaseThroughput */)
      : getAutoPilotV2SpendElement(autoPilot, false /* isDatabaseThroughput */);
  };

  public getThroughputTitle = (): string => {
    if (this.props.isAutoPilotSelected) {
      return AutoPilotUtils.getAutoPilotHeaderText(this.props.hasAutoPilotV2FeatureFlag);
    }

    const minThroughput: string = getMinRUs(this.props.collection, this.props.container).toLocaleString();
    const maxThroughput: string =
      canThroughputExceedMaximumValue(this.props.collection, this.props.container) && !this.props.isFixedContainer
        ? "unlimited"
        : getMaxRUs(this.props.collection, this.props.container).toLocaleString();
    return `Throughput (${minThroughput} - ${maxThroughput} RU/s)`;
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
          canThroughputExceedMaximumValue(this.props.collection, this.props.container) || this.canExceedMaximumValue
        }
        label={this.getThroughputTitle()}
        costsVisible={this.costsVisible}
        requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
        showAutoPilot={this.props.userCanChangeProvisioningTypes}
        isAutoPilotSelected={this.props.isAutoPilotSelected}
        onAutoPilotSelected={this.props.onAutoPilotSelected}
        autoPilotTiersList={this.props.autoPilotTiersList}
        spendAckChecked={false}
        selectedAutoPilotTier={this.props.selectedAutoPilotTier}
        onAutoPilotTierChange={this.props.onAutoPilotTierChange}
        autoPilotUsageCost={this.getAutoPilotUsageCost()}
      />
    ) : (
      <ThroughputInputAutoPilotV3Component
        throughput={this.props.throughput}
        throughputBaseline={this.props.throughputBaseline}
        onThroughputChange={this.props.onThroughputChange}
        minimum={getMinRUs(this.props.collection, this.props.container)}
        maximum={this.getMaxRUThroughputInputLimit()}
        isEnabled={!hasDatabaseSharedThroughput(this.props.collection)}
        canExceedMaximumValue={canThroughputExceedMaximumValue(this.props.collection, this.props.container)}
        label={this.getThroughputTitle()}
        costsVisible={this.costsVisible}
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
      />
    );

  public render(): JSX.Element {
    return (
      <>
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
      </>
    );
  }
}
