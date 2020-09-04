import * as React from "react";
import * as Constants from "../../../../Common/Constants";
import { StatefulValue } from "../../StatefulValue";
import { ThroughputInputComponent } from "../../ThroughputInput/ThroughputInputReactComponent";
import { ThroughputInputAutoPilotV3Component } from "../../ThroughputInput/ThroughputInputReactComponentAutoPilotV3";
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
  getTextFieldStyles
} from "../SettingsRenderUtils";
import { getMaxRUs, getMinRUs, hasDatabaseSharedThroughput, canThroughputExceedMaximumValue } from "../SettingsUtils";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";
import { TextField } from "office-ui-fabric-react";

export interface ScaleComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  tabId: string;
  hasProvisioningTypeChanged: () => boolean;
  hasAutoPilotV2FeatureFlag: boolean;
  isFixedContainer: boolean;
  autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  setThroughput: (newThroughput: number) => void;
  throughput: StatefulValue<number>;
  autoPilotThroughput: StatefulValue<number>;
  selectedAutoPilotTier: DataModels.AutopilotTier;
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  userCanChangeProvisioningTypes: boolean;
  overrideWithProvisionedThroughputSettings: () => boolean;
  setAutoPilotSelected: (isAutoPilotSelected: boolean) => void;
  setAutoPilotTier: (selectedAutoPilotTier: DataModels.AutopilotTier) => void;
  setMaxAutoPilotThroughput: (newThroughput: number) => void;
}

export class ScaleComponent extends React.Component<ScaleComponentProps> {
  public canExceedMaximumValue: boolean;
  private costsVisible: boolean;
  constructor(props: ScaleComponentProps) {
    super(props);
    this.canExceedMaximumValue = this.props.container.canExceedMaximumValue();
    this.costsVisible = !this.props.container.isEmulator;
  }

  private isAutoScaleEnabled = (): boolean => {
    const accountCapabilities: DataModels.Capability[] =
      this.props.container &&
      this.props.container.databaseAccount() &&
      this.props.container.databaseAccount().properties &&
      this.props.container.databaseAccount().properties.capabilities;
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
      <span>
        Storage capacity <br />
        <b>{capacity}</b>
      </span>
    );
  };

  private getMaxRUThroughputInputLimit = (): number => {
    if (
      this.props.container &&
      this.props.container.getPlatformType() === PlatformType.Hosted &&
      this.props.collection.partitionKey
    ) {
      return SharedConstants.CollectionCreation.DefaultCollectionRUs1Million;
    }

    return getMaxRUs(this.props.collection, this.props.container);
  };

  private getAutoPilotUsageCost = (): JSX.Element => {
    const autoPilot = !this.props.hasAutoPilotV2FeatureFlag
      ? this.props.autoPilotThroughput.current
      : this.props.selectedAutoPilotTier;
    if (!autoPilot) {
      return <></>;
    }
    return !this.props.hasAutoPilotV2FeatureFlag
      ? getAutoPilotV3SpendElement(autoPilot, false /* isDatabaseThroughput */)
      : getAutoPilotV2SpendElement(autoPilot, false /* isDatabaseThroughput */);
  };

  private getThroughputTitle = (): string => {
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
    const offerThroughput: number = this.props.throughput.current;

    const regions =
      (account && account.properties && account.properties.readLocations && account.properties.readLocations.length) ||
      1;
    const multimaster = (account && account.properties && account.properties.enableMultipleWriteLocations) || false;

    let estimatedSpend: JSX.Element;

    if (!this.props.isAutoPilotSelected) {
      estimatedSpend = getEstimatedSpendElement(
        // if migrating from autoscale to manual, we use the autoscale RUs value as that is what will be set...
        this.overrideWithAutoPilotSettings() ? this.props.autoPilotThroughput.current : offerThroughput,
        serverId,
        regions,
        multimaster,
        false
      );
    } else {
      estimatedSpend = getEstimatedAutoscaleSpendElement(
        this.props.autoPilotThroughput.current,
        serverId,
        regions,
        multimaster
      );
    }
    return estimatedSpend;
  };

  private overrideWithAutoPilotSettings = (): boolean => {
    if (this.props.hasAutoPilotV2FeatureFlag) {
      return false;
    }
    return this.props.hasProvisioningTypeChanged() && this.props.wasAutopilotOriginallySet;
  };

  private getThroughputInputComponent = (): JSX.Element => {
    return this.props.hasAutoPilotV2FeatureFlag ? (
      <ThroughputInputComponent
        showAsMandatory={false}
        isFixed={false}
        throughput={this.props.throughput}
        setThroughput={this.props.setThroughput}
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
        setAutoPilotSelected={this.props.setAutoPilotSelected}
        autoPilotTiersList={this.props.autoPilotTiersList}
        spendAckChecked={false}
        selectedAutoPilotTier={this.props.selectedAutoPilotTier}
        setAutoPilotTier={this.props.setAutoPilotTier}
        autoPilotUsageCost={this.getAutoPilotUsageCost()}
        spendAckId="123"
        spendAckText="longer text for testing"
        spendAckVisible={true}
        infoBubbleText="info bubble text"
      />
    ) : (
      <ThroughputInputAutoPilotV3Component
        throughput={this.props.throughput}
        setThroughput={this.props.setThroughput}
        minimum={getMinRUs(this.props.collection, this.props.container)}
        maximum={this.getMaxRUThroughputInputLimit()}
        isEnabled={!hasDatabaseSharedThroughput(this.props.collection)}
        canExceedMaximumValue={canThroughputExceedMaximumValue(this.props.collection, this.props.container)}
        label={this.getThroughputTitle()}
        costsVisible={this.costsVisible}
        requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
        showAutoPilot={this.props.userCanChangeProvisioningTypes}
        isAutoPilotSelected={this.props.isAutoPilotSelected}
        setAutoPilotSelected={this.props.setAutoPilotSelected}
        maxAutoPilotThroughput={this.props.autoPilotThroughput}
        setMaxAutoPilotThroughput={this.props.setMaxAutoPilotThroughput}
        autoPilotUsageCost={this.getAutoPilotUsageCost()}
        overrideWithAutoPilotSettings={this.overrideWithAutoPilotSettings()}
        overrideWithProvisionedThroughputSettings={this.props.overrideWithProvisionedThroughputSettings()}
        spendAckChecked={false}
        spendAckId="123"
        spendAckText="longer text for testing"
        spendAckVisible={true}
        infoBubbleText="info bubble text"
      />
    );
  };

  public render(): JSX.Element {
    return (
      <>
        {!this.isAutoScaleEnabled() && (
          <>
            {this.getThroughputInputComponent()}
            <div className="storageCapacityTitle throughputStorageValue">{this.getStorageCapacityTitle()}</div>
          </>
        )}

        {/* TODO: Replace link with call to the Azure Support blade */}
        {this.isAutoScaleEnabled() && (
          <div>
            <div className="autoScaleThroughputTitle">Throughput (RU/s)</div>
            <TextField disabled styles={getTextFieldStyles()} />
            <div className="autoScaleDescription">
              Your account has custom settings that prevents setting throughput at the container level. Please work with
              your Cosmos DB engineering team point of contact to make changes.
            </div>
          </div>
        )}
      </>
    );
  }
}
