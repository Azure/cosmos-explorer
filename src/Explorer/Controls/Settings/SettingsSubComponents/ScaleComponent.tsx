import * as React from "react";
import { AccessibleElement } from "../../AccessibleElement/AccessibleElement";
import TriangleRight from "../../../../../images/Triangle-right.svg";
import TriangleDown from "../../../../../images/Triangle-down.svg";
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
  getEstimatedAutoscaleSpendElement
} from "../SettingsRenderUtils";
import { getMaxRUs, getMinRUs, hasDatabaseSharedThroughput, canThroughputExceedMaximumValue } from "../SettingsUtils";
import * as AutoPilotUtils from "../../../../Utils/AutoPilotUtils";

export interface ScaleComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  tabId: string;
  hasProvisioningTypeChanged: () => boolean;
  hasAutoPilotV2FeatureFlag: boolean;
  isFixedContainer: boolean;
  autoPilotTiersList: ViewModels.DropdownOption<DataModels.AutopilotTier>[];
  onRupmChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rupm: StatefulValue<string>;
  setThroughput: (newThroughput: number) => void;
  throughput: StatefulValue<number>;
  autoPilotThroughput: StatefulValue<number>;
  selectedAutoPilotTier: DataModels.AutopilotTier;
  isAutoPilotSelected: boolean;
  wasAutopilotOriginallySet: boolean;
  userCanChangeProvisioningTypes: boolean;
  overrideWithProvisionedThroughputSettings: () => boolean;
  setAutoPilotSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setAutoPilotTier: (selectedAutoPilotTier: DataModels.AutopilotTier) => void;
  setMaxAutoPilotThroughput: (newThroughput: number) => void;
}

interface ScaleComponentState {
  scaleExpanded: boolean;
}

export class ScaleComponent extends React.Component<ScaleComponentProps, ScaleComponentState> {
  public rupmOnId: string;
  public rupmOffId: string;
  public testId: string;
  public canExceedMaximumValue: boolean;
  private costsVisible: boolean;
  public throughputAutoPilotRadioId: string;
  public throughputProvisionedRadioId: string;
  public throughputModeRadioName: string;

  constructor(props: ScaleComponentProps) {
    super(props);
    this.state = {
      scaleExpanded: true
    };
    this.testId = `settingsThroughputValue${this.props.tabId}`;
    this.rupmOnId = `rupmOn${this.props.tabId}`;
    this.rupmOffId = `rupmOff${this.props.tabId}`;
    this.throughputAutoPilotRadioId = `editDatabaseThroughput-autoPilotRadio${this.props.tabId}`;
    this.throughputProvisionedRadioId = `editDatabaseThroughput-manualRadio${this.props.tabId}`;
    this.throughputModeRadioName = `throughputModeRadio${this.props.tabId}`;
    this.canExceedMaximumValue = this.props.container.canExceedMaximumValue();
    this.costsVisible = !this.props.container.isEmulator;
  }

  private toggleScale = (): void => {
    this.setState({ scaleExpanded: !this.state.scaleExpanded });
  };

  private isRupmVisible = (): boolean => {
    if (this.props.container.isEmulator) {
      return false;
    }
    if (this.props.container.isFeatureEnabled(Constants.Features.enableRupm)) {
      return true;
    }
    for (let i = 0, len = this.props.container.databases().length; i < len; i++) {
      for (let j = 0, len2 = this.props.container.databases()[i].collections().length; j < len2; j++) {
        const collectionOffer = this.props.container
          .databases()
          // eslint-disable-next-line no-unexpected-multiline
          [i].collections()
          // eslint-disable-next-line no-unexpected-multiline
          [j].offer();
        if (collectionOffer && collectionOffer.content && collectionOffer.content.offerIsRUPerMinuteThroughputEnabled) {
          return true;
        }
      }
    }

    return false;
  };

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

  private getThroughputAriaLabel = (): string => {
    return this.getThroughputTitle() + this.getRequestUnitsUsageCost();
  };

  private getRequestUnitsUsageCost = (): JSX.Element => {
    const account = this.props.container.databaseAccount();
    if (!account) {
      return <></>;
    }

    const serverId: string = this.props.container.serverId();
    const offerThroughput: number = this.props.throughput.current;
    const rupmEnabled = this.props.rupm.current === Constants.RUPMStates.on;

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
        rupmEnabled
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
        testId={this.testId}
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
        ariaLabel={this.getThroughputAriaLabel()}
        costsVisible={this.costsVisible}
        requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
        throughputAutoPilotRadioId={this.throughputAutoPilotRadioId}
        throughputProvisionedRadioId={this.throughputProvisionedRadioId}
        throughputModeRadioName={this.throughputModeRadioName}
        showAutoPilot={this.props.userCanChangeProvisioningTypes}
        isAutoPilotSelected={this.props.isAutoPilotSelected}
        setAutoPilotSelected={this.props.setAutoPilotSelected}
        autoPilotTiersList={this.props.autoPilotTiersList}
        selectedAutoPilotTier={this.props.selectedAutoPilotTier}
        setAutoPilotTier={this.props.setAutoPilotTier}
        autoPilotUsageCost={this.getAutoPilotUsageCost()}
      />
    ) : (
      <ThroughputInputAutoPilotV3Component
        testId={this.testId}
        throughput={this.props.throughput}
        setThroughput={this.props.setThroughput}
        minimum={getMinRUs(this.props.collection, this.props.container)}
        maximum={this.getMaxRUThroughputInputLimit()}
        isEnabled={!hasDatabaseSharedThroughput(this.props.collection)}
        canExceedMaximumValue={canThroughputExceedMaximumValue(this.props.collection, this.props.container)}
        label={this.getThroughputTitle()}
        ariaLabel={this.getThroughputAriaLabel()}
        costsVisible={this.costsVisible}
        requestUnitsUsageCost={this.getRequestUnitsUsageCost()}
        throughputAutoPilotRadioId={this.throughputAutoPilotRadioId}
        throughputProvisionedRadioId={this.throughputProvisionedRadioId}
        throughputModeRadioName={this.throughputModeRadioName}
        showAutoPilot={this.props.userCanChangeProvisioningTypes}
        isAutoPilotSelected={this.props.isAutoPilotSelected}
        setAutoPilotSelected={this.props.setAutoPilotSelected}
        maxAutoPilotThroughput={this.props.autoPilotThroughput}
        setMaxAutoPilotThroughput={this.props.setMaxAutoPilotThroughput}
        autoPilotUsageCost={this.getAutoPilotUsageCost()}
        overrideWithAutoPilotSettings={this.overrideWithAutoPilotSettings()}
        overrideWithProvisionedThroughputSettings={this.props.overrideWithProvisionedThroughputSettings()}
      />
    );
  };

  private getRupmComponent = (): JSX.Element => {
    return (
      <>
        <div className="formTitle">RU/m</div>
        <div className="tabs" aria-label="RU/m">
          <div className="tab">
            <label
              htmlFor={this.rupmOnId}
              className={`${this.props.rupm.isDirty() ? "dirty" : ""} ${
                this.props.rupm.current === Constants.RUPMStates.on ? "selectedRadio" : "unselectedRadio"
              }`}
            >
              On
            </label>
            <input
              type="radio"
              name="rupm"
              value={Constants.RUPMStates.on}
              className="radio"
              onChange={this.props.onRupmChange}
              id={this.rupmOnId}
              checked={this.props.rupm.current === Constants.RUPMStates.on}
            />
          </div>
          <div className="tab">
            <label
              htmlFor={this.rupmOffId}
              className={`${this.props.rupm.isDirty() ? "dirty" : ""} ${
                this.props.rupm.current === Constants.RUPMStates.off ? "selectedRadio" : "unselectedRadio"
              }`}
            >
              Off
            </label>
            <input
              type="radio"
              name="rupm"
              value={Constants.RUPMStates.off}
              className="radio"
              id={this.rupmOffId}
              onChange={this.props.onRupmChange}
              checked={this.props.rupm.current === Constants.RUPMStates.off}
            />
          </div>
        </div>
      </>
    );
  };

  public render() {
    return (
      <>
        <AccessibleElement
          as="div"
          className="scaleDivison"
          onClick={this.toggleScale}
          onActivated={this.toggleScale}
          aria-expanded={this.state.scaleExpanded}
          role="button"
          tabIndex={0}
          aria-label="Scale"
          aria-controls="scaleRegion"
        >
          {!this.state.scaleExpanded && (
            <span className="themed-images" id="ExpandChevronRightScale">
              <img
                className="imgiconwidth ssExpandCollapseIcon ssCollapseIcon "
                src={TriangleRight}
                alt="Show scale properties"
              />
            </span>
          )}

          {this.state.scaleExpanded && (
            <span className="themed-images" id="ExpandChevronDownScale">
              <img className="imgiconwidth ssExpandCollapseIcon " src={TriangleDown} alt="Hide scale properties" />
            </span>
          )}

          <span className="scaleSettingTitle">Scale</span>
        </AccessibleElement>

        {this.state.scaleExpanded && (
          <div className="ssTextAllignment" id="scaleRegion">
            {!this.isAutoScaleEnabled() && (
              <>
                {this.getThroughputInputComponent()}
                <div className="storageCapacityTitle throughputStorageValue">{this.getStorageCapacityTitle()}</div>
              </>
            )}

            {this.isRupmVisible() && this.getRupmComponent()}

            {/*<!-- TODO: Replace link with call to the Azure Support blade -->*/}
            {this.isAutoScaleEnabled() && (
              <div>
                <div className="autoScaleThroughputTitle">Throughput (RU/s)</div>
                <input className="formReadOnly collid-white" readOnly aria-label="Throughput input" />
                <div className="autoScaleDescription">
                  Your account has custom settings that prevents setting throughput at the container level. Please work
                  with your Cosmos DB engineering team point of contact to make changes.
                </div>
              </div>
            )}
          </div>
        )}
      </>
    );
  }
}
