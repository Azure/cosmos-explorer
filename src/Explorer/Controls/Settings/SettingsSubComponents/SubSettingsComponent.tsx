import * as React from "react";
import { StatefulValue } from "../../StatefulValue/StatefulValue";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { GeospatialConfigType, TtlType, ChangeFeedPolicyState } from "../SettingsUtils";
import Explorer from "../../../Explorer";
import { Int32 } from "../../../Panes/Tables/Validators/EntityPropertyValidationCommon";
import { Label, Text, TextField, Stack, IChoiceGroupOption, ChoiceGroup } from "office-ui-fabric-react";
import {
  getTextFieldStyles,
  changeFeedPolicyToolTip,
  subComponentStackProps,
  titleAndInputStackProps,
  choiceGroupOptionStyles,
  getChoiceGroupStyles
} from "../SettingsRenderUtils";
import { ToolTipLabelComponent } from "./ToolTipLabelComponent";

export interface SubSettingsComponentProps {
  collection: ViewModels.Collection;
  container: Explorer;

  timeToLive: StatefulValue<TtlType>;
  onTtlChange: (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption) => void;
  timeToLiveSeconds: StatefulValue<number>;
  onTimeToLiveSecondsChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;

  geospatialConfigType: StatefulValue<GeospatialConfigType>;
  onGeoSpatialConfigTypeChange: (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ) => void;

  isAnalyticalStorageEnabled: boolean;
  analyticalStorageTtlSelection: StatefulValue<TtlType>;
  onAnalyticalStorageTtlSelectionChange: (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ) => void;
  analyticalStorageTtlSeconds: StatefulValue<number>;
  onAnalyticalStorageTtlSecondsChange: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ) => void;

  changeFeedPolicyVisible: boolean;
  changeFeedPolicy: StatefulValue<ChangeFeedPolicyState>;
  onChangeFeedPolicyChange: (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption) => void;
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

  private ttlChoiceGroupOptions: IChoiceGroupOption[] = [
    { key: TtlType.Off, text: "Off", styles: choiceGroupOptionStyles },
    { key: TtlType.OnNoDefault, text: "On (no default)", styles: choiceGroupOptionStyles },
    { key: TtlType.On, text: "On", styles: choiceGroupOptionStyles }
  ];

  private getTtlComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <ChoiceGroup
          id="timeToLive"
          label="Time to Live"
          tabIndex={0}
          selectedKey={this.props.timeToLive.current}
          options={this.ttlChoiceGroupOptions}
          onChange={this.props.onTtlChange}
          //onFocus=?
          styles={getChoiceGroupStyles(this.props.timeToLive)}
        />
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

  private analyticalTtlChoiceGroupOptions: IChoiceGroupOption[] = [
    { key: TtlType.Off, text: "Off", styles: choiceGroupOptionStyles, disabled: true },
    { key: TtlType.OnNoDefault, text: "On (no default)", styles: choiceGroupOptionStyles },
    { key: TtlType.On, text: "On", styles: choiceGroupOptionStyles }
  ];

  private getAnalyticalStorageTtlComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <ChoiceGroup
          id="analyticalStorageTimeToLive"
          label="Analytical Storage Time to Live"
          tabIndex={0}
          selectedKey={this.props.analyticalStorageTtlSelection.current}
          options={this.analyticalTtlChoiceGroupOptions}
          onChange={this.props.onAnalyticalStorageTtlSelectionChange}
          styles={getChoiceGroupStyles(this.props.analyticalStorageTtlSelection)}
        />
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

  private geoSpatialConfigTypeChoiceGroupOptions: IChoiceGroupOption[] = [
    { key: GeospatialConfigType.Geography, text: "Geography", styles: choiceGroupOptionStyles },
    { key: GeospatialConfigType.Geometry, text: "Geometry", styles: choiceGroupOptionStyles }
  ];

  private getGeoSpatialComponent = (): JSX.Element => {
    return (
      <ChoiceGroup
        id="geoSpatialConfig"
        label="Geospatial Configuration"
        tabIndex={0}
        selectedKey={this.props.geospatialConfigType.current}
        options={this.geoSpatialConfigTypeChoiceGroupOptions}
        onChange={this.props.onGeoSpatialConfigTypeChange}
        styles={getChoiceGroupStyles(this.props.geospatialConfigType)}
      />
    );
  };

  private changeFeedChoiceGroupOptions: IChoiceGroupOption[] = [
    { key: ChangeFeedPolicyState.Off, text: "Off", styles: choiceGroupOptionStyles },
    { key: ChangeFeedPolicyState.On, text: "On", styles: choiceGroupOptionStyles }
  ];

  private getChangeFeedComponent = (): JSX.Element => {
    const labelId = "settingsV2ChangeFeedLabelId";

    return (
      <Stack>
        <Label id={labelId}>
          <ToolTipLabelComponent label="Change feed log retention policy" toolTipElement={changeFeedPolicyToolTip} />
        </Label>
        <ChoiceGroup
          id="changeFeedPolicy"
          tabIndex={0}
          selectedKey={this.props.changeFeedPolicy.current}
          options={this.changeFeedChoiceGroupOptions}
          onChange={this.props.onChangeFeedPolicyChange}
          styles={getChoiceGroupStyles(this.props.changeFeedPolicy)}
          aria-labelledby={labelId}
        />
      </Stack>
    );
  };

  private getPartitionKeyComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        {this.getPartitionKeyVisible() && (
          <TextField
            label="Partition Key"
            disabled
            styles={getTextFieldStyles()}
            defaultValue={this.partitionKeyValue}
          />
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
    return this.props.collection.partitionKey?.version >= 2;
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
