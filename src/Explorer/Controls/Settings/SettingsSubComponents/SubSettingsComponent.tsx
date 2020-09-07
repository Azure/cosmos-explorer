import * as React from "react";
import { StatefulValue } from "../../StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { GeospatialConfigType, TtlType, ChangeFeedPolicyState } from "../SettingsUtils";
import Explorer from "../../../Explorer";
import { Int32 } from "../../../Panes/Tables/Validators/EntityPropertyValidationCommon";
import { Label, Text, TextField, Stack } from "office-ui-fabric-react";
import * as Constants from "../../../../Common/Constants";
import {
  getTextFieldStyles,
  changeFeedPolicyToolTip,
  subComponentStackProps,
  titleAndInputStackProps
} from "../SettingsRenderUtils";
import { ToolTipLabelComponent } from "./ToolTipLabelComponent";

export interface SubSettingsComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;

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

  isAnalyticalStorageEnabled: boolean;
  analyticalStorageTtlSelection: StatefulValue<TtlType>;
  onAnalyticalStorageTtlSelectionChange: (ttltype: TtlType) => void;
  analyticalStorageTtlSeconds: StatefulValue<number>;
  onAnalyticalStorageTtlSecondsChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;

  changeFeedPolicyVisible: boolean;
  changeFeedPolicy: StatefulValue<ChangeFeedPolicyState>;
  onChangeFeedPolicyChange: (changeFeedPolicyState: ChangeFeedPolicyState) => void;
}

export class SubSettingsComponent extends React.Component<SubSettingsComponentProps> {
  private ttlVisible: boolean;
  private geospatialVisible: boolean;
  private partitionKeyValue: string;
  private partitionKeyName: string;

  constructor(props: SubSettingsComponentProps) {
    super(props);
    this.ttlVisible = (this.props.container && !this.props.container.isPreferredApiCassandra()) || false;
    this.geospatialVisible = this.props.container.isPreferredApiDocumentDB();
    this.partitionKeyValue = "/" + this.props.collection.partitionKeyProperty;
    this.partitionKeyName = this.props.container.isPreferredApiMongoDB() ? "Shard key" : "Partition key";
  }

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
      <Stack {...titleAndInputStackProps}>
        <Text>Time to Live</Text>
        <div className="tabs" id="timeToLive" aria-label="Time to Live" role="radiogroup">
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
          <TextField
            id="timeToLiveSeconds"
            styles={getTextFieldStyles(this.props.timeToLiveSeconds)}
            type="number"
            required
            min={1}
            max={Int32.Max}
            value={this.props.timeToLiveSeconds.current?.toString()}
            onChange={this.props.onTimeToLiveSecondsChange}
            suffix="second(s)"
          />
        )}
      </Stack>
    );
  };

  private getGeoSpatialComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <Text>Geospatial Configuration</Text>
        <div className="tabs" id="geoSpatialConfig" aria-label="Geospatial Configuration" role="radiogroup">
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
      </Stack>
    );
  };

  private getAnalyticalStorageTtlComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <Text>Analytical Storage Time to Live</Text>
        <div
          className="tabs"
          id="analyticalStorageTimeToLive"
          aria-label="Analytical Storage Time to Live"
          role="radiogroup"
        >
          <div className="tab">
            <Label tabIndex={0} role="radio" disabled className="settingsV2Label-disabled">
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
          <TextField
            id="analyticalStorageTimeToLiveSeconds"
            styles={getTextFieldStyles(this.props.analyticalStorageTtlSeconds)}
            type="number"
            required
            min={1}
            max={Int32.Max}
            value={this.props.analyticalStorageTtlSeconds.current?.toString()}
            suffix="second(s)"
            onChange={this.props.onAnalyticalStorageTtlSecondsChange}
          />
        )}
      </Stack>
    );
  };

  private getChangeFeedComponent = (): JSX.Element => {
    const labelId = "settingsV2ChangeFeedLabelId";
    return (
      <Stack.Item>
        <Label id={labelId}>
          <ToolTipLabelComponent label="Change feed log retention policy" toolTipElement={changeFeedPolicyToolTip} />
        </Label>
        <div aria-labelledby={labelId} className="tabs" id="changeFeedPolicy" aria-label="Change feed selection tabs">
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
      </Stack.Item>
    );
  };

  private getPartitionKeyComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        {this.getPartitionKeyVisible() && (
          <>
            <Text>Partition Key</Text>
            <TextField disabled styles={getTextFieldStyles()} defaultValue={this.partitionKeyValue} />
          </>
        )}

        {this.isLargePartitionKeyEnabled() && <Text>Large {this.getLowerCasePartitionKeyName()} has been enabled</Text>}
      </Stack>
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
      <Stack {...subComponentStackProps}>
        {this.ttlVisible && this.getTtlComponent()}

        {this.geospatialVisible && this.getGeoSpatialComponent()}

        {this.props.isAnalyticalStorageEnabled && this.getAnalyticalStorageTtlComponent()}

        {this.props.changeFeedPolicyVisible && this.getChangeFeedComponent()}

        {this.getPartitionKeyComponent()}
      </Stack>
    );
  }
}
