import * as React from "react";
import { AccessibleElement } from "../../AccessibleElement/AccessibleElement";
import TriangleRight from "../../../../../images/Triangle-right.svg";
import TriangleDown from "../../../../../images/Triangle-down.svg";
import InfoBubble from "../../../../../images/info-bubble.svg";
import { StatefulValue } from "../../StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import {
  hasDatabaseSharedThroughput,
  GeospatialConfigType,
  TtlType,
  ChangeFeedPolicyToggledState
} from "../SettingsUtils";
import Explorer from "../../../Explorer";
import { Int32 } from "../../../Panes/Tables/Validators/EntityPropertyValidationCommon";

export interface SubSettingsComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  tabId: string;
  isAnalyticalStorageEnabled: boolean;
  changeFeedPolicyVisible: boolean;
  indexingPolicyDiv: React.RefObject<HTMLDivElement>;
  timeToLive: StatefulValue<TtlType>;
  onTtlOffKeyPress: () => void;
  onTtlOnNoDefaultKeyPress: () => void;
  onTtlOnKeyPress: () => void;
  onTtlOffKeyFocus: () => void;
  onTtlOnNoDefaultKeyFocus: () => void;
  onTtlOnKeyFocus: () => void;
  onTimeToLiveChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  timeToLiveSeconds: StatefulValue<number>;
  onTimeToLiveSecondsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  geospatialConfigType: StatefulValue<GeospatialConfigType>;
  onGeoSpatialConfigTypeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGeographyKeyPress: () => void;
  onGeometryKeyPress: () => void;

  analyticalStorageTtlSelection: StatefulValue<TtlType>;
  onAnalyticalStorageTtlSelectionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyticalStorageTtlOnNoDefaultKeyPress: () => void;
  onAnalyticalStorageTtlOnKeyPress: () => void;
  analyticalStorageTtlSeconds: StatefulValue<number>;
  onAnalyticalStorageTtlSecondsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  changeFeedPolicyToggled: StatefulValue<ChangeFeedPolicyToggledState>;
  onChangeFeedPolicyOffKeyPress: () => void;
  onChangeFeedPolicyOnKeyPress: () => void;
  onChangeFeedPolicyToggled: (event: React.ChangeEvent<HTMLInputElement>) => void;

  indexingPolicyContent: StatefulValue<DataModels.IndexingPolicy>;
  isIndexingPolicyEditorInitializing: boolean;
  createIndexingPolicyEditor: () => void;
}

interface SubSettingsComponentState {
  settingsExpanded: boolean;
}

export class SubSettingsComponent extends React.Component<SubSettingsComponentProps, SubSettingsComponentState> {
  private changeFeedPolicyOffId: string;
  private changeFeedPolicyOnId: string;
  private ttlOffId: string;
  private ttlOnId: string;
  private ttlOnNoDefaultId: string;
  private shouldShowIndexingPolicyEditor: boolean;
  private ttlVisible: boolean;
  private geospatialVisible: boolean;
  private partitionKeyValue: string;
  private partitionKeyName: string;

  constructor(props: SubSettingsComponentProps) {
    super(props);
    this.state = {
      settingsExpanded: true
    };
    this.ttlOffId = `ttlOffId${this.props.tabId}`;
    this.ttlOnNoDefaultId = `ttlOnNoDefault${this.props.tabId}`;
    this.ttlOnId = `ttlOn${this.props.tabId}`;
    this.changeFeedPolicyOffId = `changeFeedOff${this.props.tabId}`;
    this.changeFeedPolicyOnId = `changeFeedOn${this.props.tabId}`;
    this.shouldShowIndexingPolicyEditor =
      this.props.container &&
      !this.props.container.isPreferredApiCassandra() &&
      !this.props.container.isPreferredApiMongoDB();
    this.ttlVisible = (this.props.container && !this.props.container.isPreferredApiCassandra()) || false;
    this.geospatialVisible = this.props.container.isPreferredApiDocumentDB();
    this.partitionKeyValue = "/" + this.props.collection.partitionKeyProperty;
    this.partitionKeyName = this.props.container.isPreferredApiMongoDB() ? "Shard key" : "Partition key";
  }

  private toggleSettings = (): void => {
    if (hasDatabaseSharedThroughput(this.props.collection)) {
      return;
    }
    this.setState({ settingsExpanded: !this.state.settingsExpanded }, () => {
      if (this.state.settingsExpanded && !this.props.isIndexingPolicyEditorInitializing) {
        this.props.createIndexingPolicyEditor();
      }
    });
  };

  private getTtlComponent = (): JSX.Element => {
    return (
      <>
        <div className="formTitle">Time to Live</div>
        <div className="tabs disableFocusDefaults" aria-label="Time to Live" role="radiogroup">
          <div className="tab">
            <AccessibleElement
              as="label"
              tabIndex={0}
              aria-label="ttlOffLable"
              role="radio"
              aria-checked={this.props.timeToLive.current === TtlType.Off ? "true" : false}
              className={`ttlIndexingPolicyFocusElement ${this.props.timeToLive.isDirty() ? "dirty" : ""} ${
                this.props.timeToLive.current === TtlType.Off ? "selectedRadio" : "unselectedRadio"
              }`}
              onActivated={this.props.onTtlOffKeyPress}
              onFocus={this.props.onTtlOffKeyFocus}
            >
              Off
            </AccessibleElement>
            <input
              type="radio"
              name="ttl"
              value={TtlType.Off}
              className="radio"
              id={this.ttlOffId}
              checked={this.props.timeToLive.current === TtlType.Off}
              onChange={this.props.onTimeToLiveChange}
            />
          </div>

          <div className="tab">
            <AccessibleElement
              as="label"
              tabIndex={0}
              aria-label="ttlOnNoDefaultLabel"
              role="radio"
              aria-checked={this.props.timeToLive.current === TtlType.OnNoDefault ? "true" : "false"}
              className={`ttlIndexingPolicyFocusElement ${this.props.timeToLive.isDirty() ? "dirty" : ""} ${
                this.props.timeToLive.current === TtlType.OnNoDefault ? "selectedRadio" : "unselectedRadio"
              }`}
              onActivated={this.props.onTtlOnNoDefaultKeyPress}
              onFocus={this.props.onTtlOnNoDefaultKeyFocus}
            >
              On (no default)
            </AccessibleElement>
            <input
              type="radio"
              name="ttl"
              value={TtlType.OnNoDefault}
              className="radio"
              id={this.ttlOnNoDefaultId}
              checked={this.props.timeToLive.current === TtlType.OnNoDefault}
              onChange={this.props.onTimeToLiveChange}
            />
          </div>

          <div className="tab">
            <AccessibleElement
              as="label"
              tabIndex={0}
              aria-label="ttlOnLabel"
              role="radio"
              aria-checked={this.props.timeToLive.current === TtlType.On ? "true" : "false"}
              className={`ttlIndexingPolicyFocusElement ${this.props.timeToLive.isDirty() ? "dirty" : ""} ${
                this.props.timeToLive.current === TtlType.On ? "selectedRadio" : "unselectedRadio"
              }`}
              onActivated={this.props.onTtlOnKeyPress}
              onFocus={this.props.onTtlOnKeyFocus}
            >
              On
            </AccessibleElement>
            <input
              type="radio"
              name="ttl"
              value={TtlType.On}
              className="radio"
              id={this.ttlOnId}
              checked={this.props.timeToLive.current === TtlType.On}
              onChange={this.props.onTimeToLiveChange}
            />
          </div>
        </div>

        {this.props.timeToLive.current === TtlType.On && (
          <>
            <input
              type="number"
              required
              min="1"
              max={Int32.Max}
              aria-label="Time to live in seconds"
              value={this.props.timeToLiveSeconds.current}
              className={`dirtyTextbox ${this.props.timeToLiveSeconds.isDirty() ? "dirty" : ""}`}
              disabled={this.props.timeToLive.current !== TtlType.On}
              onChange={this.props.onTimeToLiveSecondsChange}
            />
            {` second(s)`}
          </>
        )}
      </>
    );
  };

  private getGeoSpatialComponent = (): JSX.Element => {
    return (
      <>
        <div className="formTitle">Geospatial Configuration</div>

        <div className="tabs disableFocusDefaults" aria-label="Geospatial Configuration" role="radiogroup">
          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="GeospatialGeographyLabel"
              tabIndex={0}
              role="radio"
              aria-checked={
                this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geography.toLowerCase()
                  ? "true"
                  : "false"
              }
              className={`${this.props.geospatialConfigType.isDirty() ? "dirty" : ""} ${
                this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geography.toLowerCase()
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onActivated={this.props.onGeographyKeyPress}
            >
              Geography
            </AccessibleElement>
            <input
              type="radio"
              name="geospatial"
              id="geography"
              className="radio"
              value={GeospatialConfigType.Geography}
              onChange={this.props.onGeoSpatialConfigTypeChange}
              checked={this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geography}
            />
          </div>

          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="GeospatialGeometryLabel"
              tabIndex={0}
              role="radio"
              aria-checked={
                this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geometry.toLowerCase()
                  ? "true"
                  : "false"
              }
              className={`${this.props.geospatialConfigType.isDirty() ? "dirty" : ""} ${
                this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geometry.toLowerCase()
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onActivated={this.props.onGeometryKeyPress}
            >
              Geometry
            </AccessibleElement>
            <input
              type="radio"
              name="geospatial"
              id="geometry"
              className="radio"
              value={GeospatialConfigType.Geometry}
              onChange={this.props.onGeoSpatialConfigTypeChange}
              checked={this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geometry}
            />
          </div>
        </div>
      </>
    );
  };

  private getAnalyticalStorageTtlComponent = (): JSX.Element => {
    return (
      <>
        <div className="formTitle">Analytical Storage Time to Live</div>
        <div className="tabs disableFocusDefaults" aria-label="Analytical Storage Time to Live" role="radiogroup">
          <div className="tab">
            <label tabIndex={0} role="radio" className="disabledRadio">
              Off
            </label>
          </div>
          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="AnalyticalStorageTtlOnNoDefaultLabel"
              tabIndex={0}
              role="radio"
              aria-checked={this.props.analyticalStorageTtlSelection.current === TtlType.OnNoDefault ? "true" : "false"}
              className={`${this.props.analyticalStorageTtlSelection.isDirty() ? "dirty" : ""} ${
                this.props.analyticalStorageTtlSelection.current === TtlType.OnNoDefault
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onActivated={this.props.onAnalyticalStorageTtlOnNoDefaultKeyPress}
            >
              On (no default)
            </AccessibleElement>
            <input
              type="radio"
              name="analyticalStorageTtl"
              value={TtlType.OnNoDefault}
              className="radio"
              id="analyticalStorageTtlOnNoDefaultId"
              onChange={this.props.onAnalyticalStorageTtlSelectionChange}
              checked={this.props.analyticalStorageTtlSelection.current === TtlType.OnNoDefault}
            />
          </div>

          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="AnalyticalStorageTtlOnLabel"
              tabIndex={0}
              role="radio"
              aria-checked={this.props.analyticalStorageTtlSelection.current === TtlType.On ? "true" : "false"}
              className={`${this.props.analyticalStorageTtlSelection.isDirty() ? "dirty" : ""} ${
                this.props.analyticalStorageTtlSelection.current === TtlType.On ? "selectedRadio" : "unselectedRadio"
              }`}
              onActivated={this.props.onAnalyticalStorageTtlOnKeyPress}
            >
              On
            </AccessibleElement>
            <input
              type="radio"
              name="analyticalStorageTtl"
              value={TtlType.On}
              className="radio"
              id="analyticalStorageTtlOnId"
              onChange={this.props.onAnalyticalStorageTtlSelectionChange}
              checked={this.props.analyticalStorageTtlSelection.current === TtlType.On}
            />
          </div>
        </div>
        {this.props.analyticalStorageTtlSelection.current === TtlType.On && (
          <>
            <input
              type="number"
              required
              min="1"
              max="2147483647"
              value={
                this.props.analyticalStorageTtlSeconds.current === undefined
                  ? ""
                  : this.props.analyticalStorageTtlSeconds.current
              }
              aria-label="Time to live in seconds"
              className={`dirtyTextbox ${this.props.analyticalStorageTtlSeconds.isDirty() ? "dirty" : ""}`}
              onChange={this.props.onAnalyticalStorageTtlSecondsChange}
            />
            {` second(s)`}
          </>
        )}
      </>
    );
  };

  private getChangeFeedComponent = (): JSX.Element => {
    return (
      <>
        <div className="formTitle">
          <span>Change feed log retention policy</span>
          <span className="infoTooltip" role="tooltip" tabIndex={0}>
            <img className="infoImg" src={InfoBubble} alt="More information" />
            <span className="tooltiptext infoTooltipWidth">
              Enable change feed log retention policy to retain last 10 minutes of history for items in the container by
              default. To support this, the request unit (RU) charge for this container will be multiplied by a factor
              of two for writes. Reads are unaffected.
            </span>
          </span>
        </div>
        <div className="tabs disableFocusDefaults" aria-label="Change feed selection tabs">
          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="ChangeFeedPolicyOffLabel"
              tabIndex={0}
              className={`${this.props.changeFeedPolicyToggled.isDirty() ? "dirty" : ""} ${
                this.props.changeFeedPolicyToggled.current === ChangeFeedPolicyToggledState.Off
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onActivated={this.props.onChangeFeedPolicyOffKeyPress}
            >
              Off
            </AccessibleElement>
            <input
              type="radio"
              name="changeFeedPolicy"
              value={ChangeFeedPolicyToggledState.Off}
              className="radio"
              id={this.changeFeedPolicyOffId}
              onChange={this.props.onChangeFeedPolicyToggled}
              checked={this.props.changeFeedPolicyToggled.current === ChangeFeedPolicyToggledState.Off}
            />
          </div>
          <div className="tab">
            <AccessibleElement
              as="label"
              aria-label="ChangeFeedPolicyOnLabel"
              tabIndex={0}
              className={`${this.props.changeFeedPolicyToggled.isDirty() ? "dirty" : ""} ${
                this.props.changeFeedPolicyToggled.current === ChangeFeedPolicyToggledState.On
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onActivated={this.props.onChangeFeedPolicyOnKeyPress}
            >
              On
            </AccessibleElement>
            <input
              type="radio"
              name="changeFeedPolicy"
              value={ChangeFeedPolicyToggledState.On}
              className="radio"
              id={this.changeFeedPolicyOnId}
              onChange={this.props.onChangeFeedPolicyToggled}
              checked={this.props.changeFeedPolicyToggled.current === ChangeFeedPolicyToggledState.On}
            />
          </div>
        </div>
      </>
    );
  };

  private getPartitionKeyComponent = (): JSX.Element => {
    return (
      <>
        {this.getPartitionKeyVisible() && (
          <>
            <div className="formTitle">Partition Key</div>
            <input
              className="formReadOnly collid-white"
              aria-label={this.partitionKeyName}
              defaultValue={this.partitionKeyValue}
              readOnly
            />
          </>
        )}

        {this.isLargePartitionKeyEnabled() && (
          <div className="largePartitionKeyEnabled">
            <p>
              Large <span>{this.getLowerCasePartitionKeyName()}</span> has been enabled
            </p>
          </div>
        )}
      </>
    );
  };

  private getLowerCasePartitionKeyName = (): string => this.partitionKeyName.toLowerCase();
  private getPartitionKeyVisible = (): boolean => {
    if (this.props.container.isPreferredApiCassandra() || this.props.container.isPreferredApiTable()) {
      return false;
    }

    if (!this.props.collection.partitionKeyProperty) {
      return false;
    }

    if (this.props.container.isPreferredApiMongoDB() && this.props.collection.partitionKey.systemKey) {
      return false;
    }

    return true;
  };

  private isLargePartitionKeyEnabled = (): boolean => {
    return (
      !!this.props.collection.partitionKey &&
      !!this.props.collection.partitionKey.version &&
      this.props.collection.partitionKey.version >= 2
    );
  };

  public render(): JSX.Element {
    return (
      <>
        {(this.shouldShowIndexingPolicyEditor || this.ttlVisible) && (
          <AccessibleElement
            as="div"
            className="formTitle"
            onClick={this.toggleSettings}
            onActivated={this.toggleSettings}
            aria-expanded={this.state.settingsExpanded}
            role="button"
            tabIndex={0}
            aria-label="Settings"
            aria-controls="settingsRegion"
          >
            {!this.state.settingsExpanded && !hasDatabaseSharedThroughput(this.props.collection) && (
              <span className="themed-images" id="ExpandChevronRightSettings">
                <img
                  className="imgiconwidth ssExpandCollapseIcon ssCollapseIcon"
                  src={TriangleRight}
                  alt="Show settings"
                />
              </span>
            )}

            {this.state.settingsExpanded && !hasDatabaseSharedThroughput(this.props.collection) && (
              <span className="themed-images" id="ExpandChevronDownSettings">
                <img className="imgiconwidth ssExpandCollapseIcon" src={TriangleDown} alt="Show settings" />
              </span>
            )}
            <span className="scaleSettingTitle">Settings</span>
          </AccessibleElement>
        )}

        {this.state.settingsExpanded && (
          <div className="ssTextAllignment" id="settingsRegion">
            {this.ttlVisible && this.getTtlComponent()}

            {this.geospatialVisible && this.getGeoSpatialComponent()}

            {this.props.isAnalyticalStorageEnabled && this.getAnalyticalStorageTtlComponent()}

            {this.props.changeFeedPolicyVisible && this.getChangeFeedComponent()}

            {this.getPartitionKeyComponent()}

            {this.shouldShowIndexingPolicyEditor && (
              <>
                <div className="formTitle">Indexing Policy</div>
                <div
                  key="indexingPolicyEditorDiv"
                  className="indexingPolicyEditor ttlIndexingPolicyFocusElement"
                  tabIndex={0}
                  ref={this.props.indexingPolicyDiv}
                ></div>
              </>
            )}
          </div>
        )}
      </>
    );
  }
}
