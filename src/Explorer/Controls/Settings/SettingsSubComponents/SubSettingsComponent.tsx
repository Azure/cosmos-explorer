import * as React from "react";
import { AccessibleElement } from "../../AccessibleElement/AccessibleElement";
import TriangleRight from "../../../../../images/Triangle-right.svg";
import TriangleDown from "../../../../../images/Triangle-down.svg";
import InfoBubble from "../../../../../images/info-bubble.svg";
import { StatefulValue } from "../../StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import * as DataModels from "../../../../Contracts/DataModels";
import { hasDatabaseSharedThroughput, GeospatialConfigType, TtlType, ChangeFeedPolicyState } from "../SettingsUtils";
import Explorer from "../../../Explorer";
import { Int32 } from "../../../Panes/Tables/Validators/EntityPropertyValidationCommon";
import { Label, TextField, ITextFieldProps, ITextFieldStyleProps, ITextFieldStyles } from "office-ui-fabric-react";
import * as Constants from "../../../../Common/Constants";
import { getTextFieldStyles } from "../SettingsRenderUtils";

export interface SubSettingsComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;
  tabId: string;
  isAnalyticalStorageEnabled: boolean;
  changeFeedPolicyVisible: boolean;
  indexingPolicyDiv: React.RefObject<HTMLDivElement>;
  timeToLive: StatefulValue<TtlType>;
  onTtlChange: (ttlType: TtlType) => void;
  onTtlFocusChange: (ttlType: TtlType) => void;
  timeToLiveSeconds: StatefulValue<number>;
  onTimeToLiveSecondsChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;

  geospatialConfigType: StatefulValue<GeospatialConfigType>;
  onGeoSpatialConfigTypeChange: (geoSpatialConfigType: GeospatialConfigType) => void;

  analyticalStorageTtlSelection: StatefulValue<TtlType>;
  onAnalyticalStorageTtlSelectionChange: (ttltype: TtlType) => void;
  analyticalStorageTtlSeconds: StatefulValue<number>;
  onAnalyticalStorageTtlSecondsChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;

  changeFeedPolicy: StatefulValue<ChangeFeedPolicyState>;
  onChangeFeedPolicyChange: (changeFeedPolicyState: ChangeFeedPolicyState) => void;

  indexingPolicyContent: StatefulValue<DataModels.IndexingPolicy>;
  isIndexingPolicyEditorInitializing: boolean;
  createIndexingPolicyEditor: () => void;
}

interface SubSettingsComponentState {
  settingsExpanded: boolean;
}

export class SubSettingsComponent extends React.Component<SubSettingsComponentProps, SubSettingsComponentState> {
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

  private onTtlOffKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onTtlOffLabelClick();
    }
  };

  private onTtlOffLabelClick = (): void => {
    this.props.onTtlChange(TtlType.Off);
  };

  private onTtlOnNoDefaultKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onTtlOnNoDefaultLabelClick();
    }
  };

  private onTtlOnNoDefaultLabelClick = (): void => {
    this.props.onTtlChange(TtlType.OnNoDefault);
  };

  private onTtlOnKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onTtlOnLabelClick();
    }
  };

  private onTtlOnLabelClick = (): void => {
    this.props.onTtlChange(TtlType.On);
  };

  private onTtlOffLabelFocus = (): void => {
    this.props.onTtlFocusChange(TtlType.Off);
  };

  private onTtlOnNoDefaultLabelFocus = (): void => {
    this.props.onTtlFocusChange(TtlType.OnNoDefault);
  };

  private onTtlOnLabelFocus = (): void => {
    this.props.onTtlFocusChange(TtlType.On);
  };

  private onGeographyKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onGeographyLabelClick();
    }
  };

  private onGeographyLabelClick = (): void => {
    this.props.onGeoSpatialConfigTypeChange(GeospatialConfigType.Geography);
  };

  private onGeometryKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onGeometryLabelClick();
    }
  };

  private onGeometryLabelClick = (): void => {
    this.props.onGeoSpatialConfigTypeChange(GeospatialConfigType.Geometry);
  };

  private onAnalyticalStorageTtlOnNoDefaultKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onAnalyticalStorageTtlOnNoDefaultLabelClick();
    }
  };

  private onAnalyticalStorageTtlOnNoDefaultLabelClick = (): void => {
    this.props.onAnalyticalStorageTtlSelectionChange(TtlType.OnNoDefault);
  };

  private onAnalyticalStorageTtlOnKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onAnalyticalStorageTtlOnLabelClick();
    }
  };

  private onAnalyticalStorageTtlOnLabelClick = (): void => {
    this.props.onAnalyticalStorageTtlSelectionChange(TtlType.On);
  };

  private onChangeFeedPolicyOffKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onChangeFeedPolicyOffLabelClick();
    }
  };

  private onChangeFeedPolicyOffLabelClick = (): void => {
    this.props.onChangeFeedPolicyChange(ChangeFeedPolicyState.Off);
  };

  private onChangeFeedPolicyOnKeyPress = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      event.stopPropagation();
      event.preventDefault();
      this.onChangeFeedPolicyOnLabelClick();
    }
  };

  private onChangeFeedPolicyOnLabelClick = (): void => {
    this.props.onChangeFeedPolicyChange(ChangeFeedPolicyState.On);
  };

  private getTtlComponent = (): JSX.Element => {
    return (
      <>
        <div className="formTitle">Time to Live</div>
        <div className="tabs disableFocusDefaults" aria-label="Time to Live" role="radiogroup">
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label ttlIndexingPolicyFocusElement ${
                this.props.timeToLive.isDirty() ? "dirty" : ""
              } ${this.props.timeToLive.current === TtlType.Off ? "selectedRadio" : "unselectedRadio"}`}
              onClick={this.onTtlOffLabelClick}
              onKeyPress={this.onTtlOffKeyPress}
              onFocus={this.onTtlOffLabelFocus}
            >
              Off
            </Label>
          </div>
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label ttlIndexingPolicyFocusElement ${
                this.props.timeToLive.isDirty() ? "dirty" : ""
              } ${this.props.timeToLive.current === TtlType.OnNoDefault ? "selectedRadio" : "unselectedRadio"}`}
              onClick={this.onTtlOnNoDefaultLabelClick}
              onKeyPress={this.onTtlOnNoDefaultKeyPress}
              onFocus={this.onTtlOnNoDefaultLabelFocus}
            >
              On (no default)
            </Label>
          </div>
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label ttlIndexingPolicyFocusElement ${
                this.props.timeToLive.isDirty() ? "dirty" : ""
              } ${this.props.timeToLive.current === TtlType.On ? "selectedRadio" : "unselectedRadio"}`}
              onClick={this.onTtlOnLabelClick}
              onKeyPress={this.onTtlOnKeyPress}
              onFocus={this.onTtlOnLabelFocus}
            >
              On
            </Label>
          </div>
        </div>

        {this.props.timeToLive.current === TtlType.On && (
          <>
            <TextField
              styles={getTextFieldStyles(this.props.timeToLiveSeconds)}
              type="number"
              required
              min={1}
              max={Int32.Max}
              value={this.props.timeToLiveSeconds.current?.toString()}
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
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label  ${this.props.geospatialConfigType.isDirty() ? "dirty" : ""} ${
                this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geography.toLowerCase()
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onClick={this.onGeographyLabelClick}
              onKeyPress={this.onGeographyKeyPress}
            >
              Geography
            </Label>
          </div>

          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label ${this.props.geospatialConfigType.isDirty() ? "dirty" : ""} ${
                this.props.geospatialConfigType.current?.toLowerCase() === GeospatialConfigType.Geometry.toLowerCase()
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onClick={this.onGeometryLabelClick}
              onKeyPress={this.onGeometryKeyPress}
            >
              Geometry
            </Label>
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
            <Label 
              tabIndex={0}
              role="radio" 
              disabled
              className="settingsV2Label-disabled">
              Off
            </Label>
          </div>
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label ${this.props.analyticalStorageTtlSelection.isDirty() ? "dirty" : ""} ${
                this.props.analyticalStorageTtlSelection.current === TtlType.OnNoDefault
                  ? "selectedRadio"
                  : "unselectedRadio"
              }`}
              onClick={this.onAnalyticalStorageTtlOnNoDefaultLabelClick}
              onKeyPress={this.onAnalyticalStorageTtlOnNoDefaultKeyPress}
            >
              On (no default)
            </Label>
          </div>
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label  ${this.props.analyticalStorageTtlSelection.isDirty() ? "dirty" : ""} ${
                this.props.analyticalStorageTtlSelection.current === TtlType.On ? "selectedRadio" : "unselectedRadio"
              }`}
              onClick={this.onAnalyticalStorageTtlOnLabelClick}
              onKeyPress={this.onAnalyticalStorageTtlOnKeyPress}
            >
              On
            </Label>
          </div>
        </div>
        {this.props.analyticalStorageTtlSelection.current === TtlType.On && (
          <>
            <TextField
              styles={getTextFieldStyles(this.props.analyticalStorageTtlSeconds)}
              type="number"
              required
              min={1}
              max={Int32.Max}
              value={this.props.analyticalStorageTtlSeconds.current?.toString()}
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
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label  ${this.props.changeFeedPolicy.isDirty() ? "dirty" : ""} ${
                this.props.changeFeedPolicy.current === ChangeFeedPolicyState.Off ? "selectedRadio" : "unselectedRadio"
              }`}
              onClick={this.onChangeFeedPolicyOffLabelClick}
              onKeyPress={this.onChangeFeedPolicyOffKeyPress}
            >
              Off
            </Label>
          </div>
          <div className="tab">
            <Label
              tabIndex={0}
              role="radio"
              className={`settingsV2Label  ${this.props.changeFeedPolicy.isDirty() ? "dirty" : ""} ${
                this.props.changeFeedPolicy.current === ChangeFeedPolicyState.On ? "selectedRadio" : "unselectedRadio"
              }`}
              onClick={this.onChangeFeedPolicyOnLabelClick}
              onKeyPress={this.onChangeFeedPolicyOnKeyPress}
            >
              On
            </Label>
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
            <TextField disabled styles={getTextFieldStyles()} defaultValue={this.partitionKeyValue} />
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
