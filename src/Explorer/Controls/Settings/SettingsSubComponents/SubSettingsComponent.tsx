import {
  ChoiceGroup,
  IChoiceGroupOption,
  Label,
  Link,
  MessageBar,
  Stack,
  Text,
  TextField,
  TooltipHost,
  mergeStyleSets,
} from "@fluentui/react";
import * as React from "react";
import * as ViewModels from "../../../../Contracts/ViewModels";
import { Keys } from "Localization/Keys.generated";
import { t } from "Localization/t";
import { userContext } from "../../../../UserContext";
import { Int32 } from "../../../Panes/Tables/Validators/EntityPropertyValidationCommon";
import {
  changeFeedPolicyToolTip,
  getChoiceGroupStyles,
  getTextFieldStyles,
  messageBarStyles,
  subComponentStackProps,
  titleAndInputStackProps,
  ttlWarning,
} from "../SettingsRenderUtils";
import {
  ChangeFeedPolicyState,
  GeospatialConfigType,
  IsComponentDirtyResult,
  TtlOff,
  TtlOn,
  TtlOnNoDefault,
  TtlType,
  getSanitizedInputValue,
  isDirty,
} from "../SettingsUtils";
import { ToolTipLabelComponent } from "./ToolTipLabelComponent";

const classNames = mergeStyleSets({
  hintText: {
    color: "var(--colorNeutralForeground1)", // theme-aware
  },
});
export interface SubSettingsComponentProps {
  collection: ViewModels.Collection;
  timeToLive: TtlType;
  timeToLiveBaseline: TtlType;

  onTtlChange: (newTtl: TtlType) => void;
  timeToLiveSeconds: number;
  timeToLiveSecondsBaseline: number;
  onTimeToLiveSecondsChange: (newTimeToLiveSeconds: number) => void;
  displayedTtlSeconds: string;
  onDisplayedTtlSecondsChange: (newDisplayedTtlSeconds: string) => void;

  geospatialConfigType: GeospatialConfigType;
  geospatialConfigTypeBaseline: GeospatialConfigType;
  onGeoSpatialConfigTypeChange: (newGeoSpatialConfigType: GeospatialConfigType) => void;

  isAnalyticalStorageEnabled: boolean;
  analyticalStorageTtlSelection: TtlType;
  analyticalStorageTtlSelectionBaseline: TtlType;
  onAnalyticalStorageTtlSelectionChange: (newAnalyticalStorageTtlSelection: TtlType) => void;

  analyticalStorageTtlSeconds: number;
  analyticalStorageTtlSecondsBaseline: number;
  onAnalyticalStorageTtlSecondsChange: (newAnalyticalStorageTtlSeconds: number) => void;

  changeFeedPolicyVisible: boolean;
  changeFeedPolicy: ChangeFeedPolicyState;
  changeFeedPolicyBaseline: ChangeFeedPolicyState;
  onChangeFeedPolicyChange: (newChangeFeedPolicyState: ChangeFeedPolicyState) => void;
  onSubSettingsSaveableChange: (isSubSettingsSaveable: boolean) => void;
  onSubSettingsDiscardableChange: (isSubSettingsDiscardable: boolean) => void;
}

export class SubSettingsComponent extends React.Component<SubSettingsComponentProps> {
  private shouldCheckComponentIsDirty = true;
  private geospatialVisible: boolean;
  private partitionKeyValue: string;
  private partitionKeyName: string;
  private uniqueKeyName: string;
  private uniqueKeyValue: string;

  constructor(props: SubSettingsComponentProps) {
    super(props);
    this.geospatialVisible = userContext.apiType === "SQL";
    this.partitionKeyName =
      userContext.apiType === "Mongo"
        ? t(Keys.controls.settings.partitionKey.shardKey)
        : t(Keys.controls.settings.partitionKey.partitionKey);
    this.partitionKeyValue = this.getPartitionKeyValue();
    this.uniqueKeyName = t(Keys.controls.settings.subSettings.uniqueKeys);
    this.uniqueKeyValue = this.getUniqueKeyValue();
  }

  componentDidMount(): void {
    this.onComponentUpdate();
  }

  componentDidUpdate(prevProps: SubSettingsComponentProps): void {
    if (
      (prevProps.timeToLive === TtlType.Off || prevProps.timeToLive === TtlType.OnNoDefault) &&
      this.props.timeToLive === TtlType.On &&
      this.props.timeToLiveBaseline !== TtlType.On
    ) {
      this.props.onDisplayedTtlSecondsChange("");
    }
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }

    const isComponentDirtyResult = this.IsComponentDirty();
    this.props.onSubSettingsSaveableChange(isComponentDirtyResult.isSaveable);
    this.props.onSubSettingsDiscardableChange(isComponentDirtyResult.isDiscardable);

    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = (): IsComponentDirtyResult => {
    if (
      (this.props.timeToLive === TtlType.On && !this.props.timeToLiveSeconds) ||
      (this.props.analyticalStorageTtlSelection === TtlType.On && !this.props.analyticalStorageTtlSeconds) ||
      (this.props.timeToLive === TtlType.On && this.props.displayedTtlSeconds === "")
    ) {
      return { isSaveable: false, isDiscardable: true };
    } else if (
      isDirty(this.props.timeToLive, this.props.timeToLiveBaseline) ||
      (this.props.timeToLive === TtlType.On &&
        isDirty(this.props.timeToLiveSeconds, this.props.timeToLiveSecondsBaseline)) ||
      isDirty(this.props.analyticalStorageTtlSelection, this.props.analyticalStorageTtlSelectionBaseline) ||
      (this.props.analyticalStorageTtlSelection === TtlType.On &&
        isDirty(this.props.analyticalStorageTtlSeconds, this.props.analyticalStorageTtlSecondsBaseline)) ||
      isDirty(this.props.geospatialConfigType, this.props.geospatialConfigTypeBaseline) ||
      isDirty(this.props.changeFeedPolicy, this.props.changeFeedPolicyBaseline)
    ) {
      return { isSaveable: true, isDiscardable: true };
    }

    return { isSaveable: false, isDiscardable: false };
  };

  private ttlChoiceGroupOptions: IChoiceGroupOption[] = [
    { key: TtlType.Off, text: t(Keys.controls.settings.subSettings.ttlOff), ariaLabel: "ttl-off-option" },
    {
      key: TtlType.OnNoDefault,
      text: t(Keys.controls.settings.subSettings.ttlOnNoDefault),
      ariaLabel: "ttl-on-no-default-option",
    },
    { key: TtlType.On, text: t(Keys.controls.settings.subSettings.ttlOn), ariaLabel: "ttl-on-option" },
  ];

  public getTtlValue = (value: string): TtlType => {
    switch (value) {
      case TtlOn:
        return TtlType.On;
      case TtlOff:
        return TtlType.Off;
      case TtlOnNoDefault:
        return TtlType.OnNoDefault;
    }
    return undefined;
  };

  private onTtlChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void =>
    this.props.onTtlChange(this.getTtlValue(option.key));

  private onTimeToLiveSecondsChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    const newTimeToLiveSeconds = getSanitizedInputValue(newValue, Int32.Max);
    this.props.onDisplayedTtlSecondsChange(newTimeToLiveSeconds.toString());
    this.props.onTimeToLiveSecondsChange(newTimeToLiveSeconds);
  };

  private onGeoSpatialConfigTypeChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption,
  ): void =>
    this.props.onGeoSpatialConfigTypeChange(GeospatialConfigType[option.key as keyof typeof GeospatialConfigType]);

  private onAnalyticalStorageTtlSelectionChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption,
  ): void => this.props.onAnalyticalStorageTtlSelectionChange(this.getTtlValue(option.key));

  private onAnalyticalStorageTtlSecondsChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ): void => {
    const newAnalyticalStorageTtlSeconds = getSanitizedInputValue(newValue, Int32.Max);
    this.props.onAnalyticalStorageTtlSecondsChange(newAnalyticalStorageTtlSeconds);
  };

  private onChangeFeedPolicyChange = (
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption,
  ): void =>
    this.props.onChangeFeedPolicyChange(ChangeFeedPolicyState[option.key as keyof typeof ChangeFeedPolicyState]);

  private getTtlComponent = (): JSX.Element =>
    userContext.apiType === "Mongo" ? (
      <MessageBar
        messageBarIconProps={{ iconName: "InfoSolid", className: "messageBarInfoIcon" }}
        styles={{
          root: {
            backgroundColor: "var(--colorNeutralBackground1)",
            color: "var(--colorNeutralForeground1)",
          },
          text: {
            fontSize: 14,
            color: "var(--colorNeutralForeground1)",
          },
          icon: {
            color: "var(--colorNeutralForeground1)",
          },
        }}
      >
        <Text style={{ color: "var(--colorNeutralForeground1)" }}>
          {t(Keys.controls.settings.subSettings.mongoTtlMessage)}{" "}
          <Link
            href="https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb-time-to-live"
            target="_blank"
            style={{ color: "var(--colorBrandForeground1)" }}
          >
            {t(Keys.controls.settings.subSettings.mongoTtlLinkText)}
          </Link>
          .
        </Text>
      </MessageBar>
    ) : (
      <Stack {...titleAndInputStackProps}>
        <ChoiceGroup
          id="timeToLive"
          label={t(Keys.controls.settings.subSettings.timeToLive)}
          selectedKey={this.props.timeToLive}
          options={this.ttlChoiceGroupOptions}
          onChange={this.onTtlChange}
          styles={getChoiceGroupStyles(this.props.timeToLive, this.props.timeToLiveBaseline)}
        />
        {isDirty(this.props.timeToLive, this.props.timeToLiveBaseline) && this.props.timeToLive === TtlType.On && (
          <MessageBar
            messageBarIconProps={{ iconName: "InfoSolid", className: "messageBarInfoIcon" }}
            styles={messageBarStyles}
          >
            {ttlWarning}
          </MessageBar>
        )}
        {this.props.timeToLive === TtlType.On && (
          <TextField
            id="timeToLiveSeconds"
            styles={getTextFieldStyles(this.props.timeToLiveSeconds, this.props.timeToLiveSecondsBaseline)}
            type="number"
            required
            min={1}
            max={Int32.Max}
            value={this.props.displayedTtlSeconds}
            onChange={this.onTimeToLiveSecondsChange}
            suffix={t(Keys.controls.settings.subSettings.seconds)}
            ariaLabel={t(Keys.controls.settings.subSettings.timeToLiveInSeconds)}
            data-test="ttl-input"
          />
        )}
      </Stack>
    );

  private analyticalTtlChoiceGroupOptions: IChoiceGroupOption[] = [
    { key: TtlType.Off, text: t(Keys.controls.settings.subSettings.ttlOff), disabled: true },
    { key: TtlType.OnNoDefault, text: t(Keys.controls.settings.subSettings.ttlOnNoDefault) },
    { key: TtlType.On, text: t(Keys.controls.settings.subSettings.ttlOn) },
  ];

  private getAnalyticalStorageTtlComponent = (): JSX.Element => (
    <Stack {...titleAndInputStackProps}>
      <ChoiceGroup
        id="analyticalStorageTimeToLive"
        label={t(Keys.controls.settings.subSettings.analyticalStorageTtl)}
        selectedKey={this.props.analyticalStorageTtlSelection}
        options={this.analyticalTtlChoiceGroupOptions}
        onChange={this.onAnalyticalStorageTtlSelectionChange}
        styles={getChoiceGroupStyles(
          this.props.analyticalStorageTtlSelection,
          this.props.analyticalStorageTtlSelectionBaseline,
        )}
      />
      {this.props.analyticalStorageTtlSelection === TtlType.On && (
        <TextField
          id="analyticalStorageTimeToLiveSeconds"
          styles={getTextFieldStyles(
            this.props.analyticalStorageTtlSeconds,
            this.props.analyticalStorageTtlSecondsBaseline,
          )}
          type="number"
          required
          min={1}
          max={Int32.Max}
          value={this.props.analyticalStorageTtlSeconds?.toString()}
          suffix={t(Keys.controls.settings.subSettings.seconds)}
          onChange={this.onAnalyticalStorageTtlSecondsChange}
        />
      )}
    </Stack>
  );

  private geoSpatialConfigTypeChoiceGroupOptions: IChoiceGroupOption[] = [
    {
      key: GeospatialConfigType.Geography,
      text: t(Keys.controls.settings.subSettings.geography),
      ariaLabel: "geography-option",
    },
    {
      key: GeospatialConfigType.Geometry,
      text: t(Keys.controls.settings.subSettings.geometry),
      ariaLabel: "geometry-option",
    },
  ];

  private getGeoSpatialComponent = (): JSX.Element => (
    <ChoiceGroup
      id="geoSpatialConfig"
      label={t(Keys.controls.settings.subSettings.geospatialConfiguration)}
      selectedKey={this.props.geospatialConfigType}
      options={this.geoSpatialConfigTypeChoiceGroupOptions}
      onChange={this.onGeoSpatialConfigTypeChange}
      styles={getChoiceGroupStyles(this.props.geospatialConfigType, this.props.geospatialConfigTypeBaseline)}
    />
  );

  private changeFeedChoiceGroupOptions: IChoiceGroupOption[] = [
    { key: ChangeFeedPolicyState.Off, text: t(Keys.controls.settings.subSettings.ttlOff) },
    { key: ChangeFeedPolicyState.On, text: t(Keys.controls.settings.subSettings.ttlOn) },
  ];

  private getChangeFeedComponent = (): JSX.Element => {
    const labelId = "settingsV2ChangeFeedLabelId";

    return (
      <Stack>
        <Label id={labelId}>
          <ToolTipLabelComponent
            label={t(Keys.controls.settings.changeFeed.label)}
            toolTipElement={changeFeedPolicyToolTip}
          />
        </Label>
        <ChoiceGroup
          id="changeFeedPolicy"
          selectedKey={this.props.changeFeedPolicy}
          options={this.changeFeedChoiceGroupOptions}
          onChange={this.onChangeFeedPolicyChange}
          styles={getChoiceGroupStyles(this.props.changeFeedPolicy, this.props.changeFeedPolicyBaseline)}
          aria-labelledby={labelId}
        />
      </Stack>
    );
  };

  private getPartitionKeyValue = (): string => {
    if (userContext.apiType === "Mongo") {
      return this.props.collection.partitionKeyProperties?.[0] || "";
    }

    return (this.props.collection.partitionKeyProperties || []).map((property) => "/" + property).join(", ");
  };

  private getPartitionKeyComponent = (): JSX.Element => (
    <Stack {...titleAndInputStackProps}>
      {this.getPartitionKeyVisible() && (
        <TooltipHost
          content={t(Keys.controls.settings.subSettings.partitionKeyTooltipTemplate, {
            partitionKeyName: this.partitionKeyName.toLowerCase(),
            partitionKeyValue: this.partitionKeyValue,
          })}
          styles={{
            root: {
              display: "block",
            },
          }}
        >
          <TextField
            label={this.partitionKeyName}
            disabled
            styles={getTextFieldStyles(undefined, undefined)}
            defaultValue={this.partitionKeyValue}
          />
        </TooltipHost>
      )}

      {userContext.apiType === "SQL" && this.isLargePartitionKeyEnabled() && (
        <Text className={classNames.hintText}>
          {t(Keys.controls.settings.subSettings.largePartitionKeyEnabled, {
            partitionKeyName: this.partitionKeyName.toLowerCase(),
          })}
        </Text>
      )}

      {userContext.apiType === "SQL" &&
        (this.isHierarchicalPartitionedContainer() ? (
          <Text className={classNames.hintText}>{t(Keys.controls.settings.subSettings.hierarchicalPartitioned)}</Text>
        ) : (
          <Text className={classNames.hintText}>
            {t(Keys.controls.settings.subSettings.nonHierarchicalPartitioned)}
          </Text>
        ))}
    </Stack>
  );

  public getPartitionKeyVisible = (): boolean => {
    if (
      userContext.apiType === "Cassandra" ||
      userContext.apiType === "Tables" ||
      !this.props.collection.partitionKeyProperties ||
      this.props.collection.partitionKeyProperties.length === 0 ||
      (userContext.apiType === "Mongo" && this.props.collection.partitionKey.systemKey)
    ) {
      return false;
    }
    return true;
  };

  public isLargePartitionKeyEnabled = (): boolean => this.props.collection.partitionKey?.version >= 2;
  public isHierarchicalPartitionedContainer = (): boolean => this.props.collection.partitionKey?.kind === "MultiHash";

  public getUniqueKeyVisible = (): boolean => {
    return this.props.collection.rawDataModel.uniqueKeyPolicy?.uniqueKeys.length > 0 && userContext.apiType === "SQL";
  };

  private getUniqueKeyValue = (): string => {
    const paths = this.props.collection.rawDataModel.uniqueKeyPolicy?.uniqueKeys?.[0]?.paths;
    return paths?.join(", ") || "";
  };

  private getUniqueKeyComponent = (): JSX.Element => (
    <Stack {...titleAndInputStackProps}>
      {this.getUniqueKeyVisible() && (
        <TextField
          label={this.uniqueKeyName}
          disabled
          styles={getTextFieldStyles(undefined, undefined)}
          defaultValue={this.uniqueKeyValue}
        />
      )}
    </Stack>
  );

  public render(): JSX.Element {
    return (
      <Stack {...subComponentStackProps}>
        {userContext.apiType !== "Cassandra" && this.getTtlComponent()}

        {this.geospatialVisible && this.getGeoSpatialComponent()}

        {this.props.isAnalyticalStorageEnabled && this.getAnalyticalStorageTtlComponent()}

        {this.props.changeFeedPolicyVisible && this.getChangeFeedComponent()}

        {this.getPartitionKeyComponent()}

        {this.getUniqueKeyComponent()}
      </Stack>
    );
  }
}
