import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  IconButton,
  IMessageBarStyles,
  MessageBar,
  MessageBarType,
  SelectionMode,
  Separator,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from "@fluentui/react";
import * as React from "react";
import { MongoIndex } from "../../../../../Utils/arm/generatedClients/cosmos/types";
import { CollapsibleSectionComponent } from "../../../CollapsiblePanel/CollapsibleSectionComponent";
import {
  addMongoIndexStackProps,
  createAndAddMongoIndexStackProps,
  customDetailsListStyles,
  infoAndToolTipTextStyle,
  mediumWidthStackStyles,
  mongoCompoundIndexNotSupportedMessage,
  mongoIndexingPolicyDisclaimer,
  onRenderRow,
  separatorStyles,
  subComponentStackProps,
  unsavedEditorWarningMessage,
} from "../../SettingsRenderUtils";
import {
  AddMongoIndexProps,
  getMongoIndexType,
  getMongoIndexTypeText,
  isIndexTransforming,
  MongoIndexIdField,
  MongoIndexTypes,
  MongoNotificationType,
} from "../../SettingsUtils";
import { IndexingPolicyRefreshComponent } from "../IndexingPolicyRefresh/IndexingPolicyRefreshComponent";
import { AddMongoIndexComponent } from "./AddMongoIndexComponent";

export interface MongoIndexingPolicyComponentProps {
  mongoIndexes: MongoIndex[];
  onIndexDrop: (index: number) => void;
  indexesToDrop: number[];
  onRevertIndexDrop: (index: number) => void;
  indexesToAdd: AddMongoIndexProps[];
  onRevertIndexAdd: (index: number) => void;
  onIndexAddOrChange: (index: number, description: string, type: MongoIndexTypes) => void;
  indexTransformationProgress: number;
  refreshIndexTransformationProgress: () => Promise<void>;
  onMongoIndexingPolicySaveableChange: (isMongoIndexingPolicySaveable: boolean) => void;
  onMongoIndexingPolicyDiscardableChange: (isMongoIndexingPolicyDiscardable: boolean) => void;
}

interface MongoIndexDisplayProps {
  definition: JSX.Element;
  type: JSX.Element;
  actionButton: JSX.Element;
}

export class MongoIndexingPolicyComponent extends React.Component<MongoIndexingPolicyComponentProps> {
  private shouldCheckComponentIsDirty = true;
  private addMongoIndexComponentRefs: React.RefObject<AddMongoIndexComponent>[] = [];

  private darkThemeMessageBarStyles: Partial<IMessageBarStyles> = {
    root: {
      selectors: {
        "&.ms-MessageBar--warning": {
          backgroundColor: "var(--colorStatusWarningBackground1)",
          border: "1px solid var(--colorStatusWarningBorder1)",
        },
        ".ms-MessageBar-icon": {
          color: "var(--colorNeutralForeground1)",
        },
        ".ms-MessageBar-text": {
          color: "var(--colorNeutralForeground1)",
        },
      },
    },
  };

  private initialIndexesColumns: IColumn[] = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    {
      key: "actionButton",
      name: "Drop Index",
      fieldName: "actionButton",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
  ];

  private indexesToBeDroppedColumns: IColumn[] = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    {
      key: "actionButton",
      name: "Add index back",
      fieldName: "actionButton",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
  ];

  componentDidUpdate(prevProps: MongoIndexingPolicyComponentProps): void {
    if (this.props.indexesToAdd.length > prevProps.indexesToAdd.length) {
      this.addMongoIndexComponentRefs[prevProps.indexesToAdd.length]?.current?.focus();
    }
    this.onComponentUpdate();
  }

  componentDidMount(): void {
    this.onComponentUpdate();
  }

  private onComponentUpdate = (): void => {
    if (!this.shouldCheckComponentIsDirty) {
      this.shouldCheckComponentIsDirty = true;
      return;
    }
    this.props.onMongoIndexingPolicySaveableChange(this.isMongoIndexingPolicySaveable());
    this.props.onMongoIndexingPolicyDiscardableChange(this.isMongoIndexingPolicyDiscardable());
    this.shouldCheckComponentIsDirty = false;
  };

  public isMongoIndexingPolicySaveable = (): boolean => {
    if (this.props.indexesToAdd.length === 0 && this.props.indexesToDrop.length === 0) {
      return false;
    }

    const addErrorsExist = !!this.props.indexesToAdd.find((addMongoIndexProps) => addMongoIndexProps.notification);

    if (addErrorsExist) {
      return false;
    }

    return true;
  };

  public isMongoIndexingPolicyDiscardable = (): boolean => {
    return this.props.indexesToAdd.length > 0 || this.props.indexesToDrop.length > 0;
  };

  public getMongoWarningNotificationMessage = (): JSX.Element => {
    const warningMessage = this.props.indexesToAdd.find(
      (addMongoIndexProps) => addMongoIndexProps.notification?.type === MongoNotificationType.Warning,
    )?.notification.message;

    if (warningMessage) {
      return <Text styles={infoAndToolTipTextStyle}>{warningMessage}</Text>;
    }
    return undefined;
  };

  private getActionButton = (arrayPosition: number, isCurrentIndex: boolean): JSX.Element => {
    return isCurrentIndex ? (
      <IconButton
        ariaLabel="Delete index Button"
        iconProps={{ iconName: "Delete" }}
        disabled={isIndexTransforming(this.props.indexTransformationProgress)}
        onClick={() => {
          this.props.onIndexDrop(arrayPosition);
        }}
      />
    ) : (
      <IconButton
        ariaLabel="Add back Index Button"
        iconProps={{ iconName: "Add" }}
        onClick={() => {
          this.props.onRevertIndexDrop(arrayPosition);
        }}
      />
    );
  };

  private getMongoIndexDisplayProps = (
    mongoIndex: MongoIndex,
    arrayPosition: number,
    isCurrentIndex: boolean,
  ): MongoIndexDisplayProps => {
    const keys = mongoIndex?.key?.keys;
    const type = getMongoIndexType(keys);
    const definition = keys?.join();
    let mongoIndexDisplayProps: MongoIndexDisplayProps;
    if (type) {
      mongoIndexDisplayProps = {
        definition: <Text style={{ color: "var(--colorNeutralForeground1)" }}>{definition}</Text>,
        type: <Text style={{ color: "var(--colorNeutralForeground1)" }}>{getMongoIndexTypeText(type)}</Text>,
        actionButton: definition === MongoIndexIdField ? <></> : this.getActionButton(arrayPosition, isCurrentIndex),
      };
    }
    return mongoIndexDisplayProps;
  };

  private renderIndexesToBeAdded = (): JSX.Element => {
    const indexesToAddLength = this.props.indexesToAdd.length;
    for (let i = 0; i < indexesToAddLength; i++) {
      const existingIndexToAddRef = React.createRef<AddMongoIndexComponent>();
      this.addMongoIndexComponentRefs[i] = existingIndexToAddRef;
    }
    const newIndexToAddRef = React.createRef<AddMongoIndexComponent>();
    this.addMongoIndexComponentRefs[indexesToAddLength] = newIndexToAddRef;

    return (
      <Stack {...addMongoIndexStackProps} styles={mediumWidthStackStyles}>
        {this.props.indexesToAdd.map((mongoIndexWithType, arrayPosition) => {
          const keys = mongoIndexWithType.mongoIndex.key.keys;
          const type = mongoIndexWithType.type;
          const notification = mongoIndexWithType.notification;
          return (
            <AddMongoIndexComponent
              ref={this.addMongoIndexComponentRefs[arrayPosition]}
              position={arrayPosition}
              key={arrayPosition}
              description={keys.join()}
              type={type}
              notification={notification}
              onIndexAddOrChange={(description, type) =>
                this.props.onIndexAddOrChange(arrayPosition, description, type)
              }
              onDiscard={() => {
                this.addMongoIndexComponentRefs.splice(arrayPosition, 1);
                this.props.onRevertIndexAdd(arrayPosition);
              }}
            />
          );
        })}

        <AddMongoIndexComponent
          ref={this.addMongoIndexComponentRefs[indexesToAddLength]}
          disabled={isIndexTransforming(this.props.indexTransformationProgress)}
          position={indexesToAddLength}
          key={indexesToAddLength}
          description={undefined}
          type={undefined}
          notification={undefined}
          onIndexAddOrChange={(description, type) =>
            this.props.onIndexAddOrChange(indexesToAddLength, description, type)
          }
          onDiscard={() => {
            this.props.onRevertIndexAdd(indexesToAddLength);
          }}
        />
      </Stack>
    );
  };

  private renderInitialIndexes = (): JSX.Element => {
    const initialIndexes = this.props.mongoIndexes
      .map((mongoIndex, arrayPosition) => this.getMongoIndexDisplayProps(mongoIndex, arrayPosition, true))
      .filter((value, arrayPosition) => !!value && !this.props.indexesToDrop.includes(arrayPosition));

    return (
      <Stack {...createAndAddMongoIndexStackProps} styles={mediumWidthStackStyles}>
        <CollapsibleSectionComponent title="Current index(es)" isExpandedByDefault={true}>
          {
            <>
              <DetailsList
                styles={customDetailsListStyles}
                disableSelectionZone
                items={initialIndexes}
                columns={this.initialIndexesColumns}
                selectionMode={SelectionMode.none}
                onRenderRow={onRenderRow}
                layoutMode={DetailsListLayoutMode.justified}
              />
              {this.renderIndexesToBeAdded()}
            </>
          }
        </CollapsibleSectionComponent>
      </Stack>
    );
  };

  private renderIndexesToBeDropped = (): JSX.Element => {
    const indexesToBeDropped = this.props.indexesToDrop.map((dropIndex, arrayPosition) =>
      this.getMongoIndexDisplayProps(this.props.mongoIndexes[dropIndex], arrayPosition, false),
    );

    return (
      <Stack styles={mediumWidthStackStyles}>
        <CollapsibleSectionComponent title="Index(es) to be dropped" isExpandedByDefault={true}>
          {indexesToBeDropped.length > 0 && (
            <DetailsList
              styles={customDetailsListStyles}
              disableSelectionZone
              items={indexesToBeDropped}
              columns={this.indexesToBeDroppedColumns}
              selectionMode={SelectionMode.none}
              onRenderRow={onRenderRow}
              layoutMode={DetailsListLayoutMode.justified}
            />
          )}
        </CollapsibleSectionComponent>
      </Stack>
    );
  };

  public hasCompoundIndex = (): boolean => {
    for (let index = 0; index < this.props.mongoIndexes.length; index++) {
      if (this.props.mongoIndexes[index].key?.keys?.length > 1) {
        return true;
      }
    }
    return false;
  };

  private renderWarningMessage = (): JSX.Element => {
    let warningMessage: JSX.Element;
    if (this.getMongoWarningNotificationMessage()) {
      warningMessage = this.getMongoWarningNotificationMessage();
    } else if (this.isMongoIndexingPolicySaveable()) {
      warningMessage = unsavedEditorWarningMessage("indexPolicy");
    }

    return (
      <>
        <IndexingPolicyRefreshComponent
          indexTransformationProgress={this.props.indexTransformationProgress}
          refreshIndexTransformationProgress={this.props.refreshIndexTransformationProgress}
        />
        {warningMessage && (
          <MessageBar
            messageBarType={MessageBarType.warning}
            messageBarIconProps={{ iconName: "WarningSolid", className: "messageBarWarningIcon" }}
            styles={this.darkThemeMessageBarStyles}
          >
            {warningMessage}
          </MessageBar>
        )}
      </>
    );
  };

  public render(): JSX.Element {
    if (this.props.mongoIndexes) {
      if (this.hasCompoundIndex()) {
        return mongoCompoundIndexNotSupportedMessage;
      }
      return (
        <Stack {...subComponentStackProps}>
          {this.renderWarningMessage()}
          {mongoIndexingPolicyDisclaimer}
          {this.renderInitialIndexes()}
          <Separator styles={separatorStyles} />
          {this.renderIndexesToBeDropped()}
        </Stack>
      );
    } else {
      return <Spinner size={SpinnerSize.large} />;
    }
  }
}
