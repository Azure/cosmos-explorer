import * as React from "react";
import {
  DetailsList,
  DetailsListLayoutMode,
  Stack,
  IconButton,
  Text,
  SelectionMode,
  IDetailsRowProps,
  DetailsRow,
  Label,
  ProgressIndicator,
  ITextField,
  Icon,
  IColumn,
  MessageBar,
  MessageBarType
} from "office-ui-fabric-react";
import {
  accordionIconStyles,
  accordionStackTokens,
  addMongoIndexStackProps,
  customDetailsListStyles,
  longGrayLine,
  mongoIndexingPolicyDisclaimer,
  mediumWidthStackStyles,
  subComponentStackProps,
  transparentDetailsRowStyles
} from "../../SettingsRenderUtils";
import { MongoIndex } from "../../../../../Utils/arm/generatedClients/2020-04-01/types";
import {
  MongoIndexTypes,
  AddMongoIndexProps,
  MongoIndexIdField,
  MongoNotificationType,
  getMongoIndexType
} from "../../SettingsUtils";
import { AddMongoIndexComponent } from "./AddMongoIndexComponent";

export interface MongoIndexingPolicyComponentProps {
  mongoIndexes: MongoIndex[];
  onIndexDrop: (index: number) => void;
  indexesToDrop: number[];
  onRevertIndexDrop: (index: number) => void;
  indexesToAdd: AddMongoIndexProps[];
  onRevertIndexAdd: (index: number) => void;
  onIndexAddOrChange: (index: number, description: string, type: MongoIndexTypes) => void;
  onMongoIndexingPolicySaveableChange: (isMongoIndexingPolicySaveable: boolean) => void;
  onMongoIndexingPolicyDiscardableChange: (isMongoIndexingPolicyDiscardable: boolean) => void;
}

interface MongoIndexingPolicyComponentState {
  indexesToBeAddedExpanded: boolean;
  indexesToBeDroppedExpanded: boolean;
  initialIndexesExpanded: boolean;
}

interface MongoIndexDisplayProps {
  definition: JSX.Element;
  type: JSX.Element;
  actionButton: JSX.Element;
}

export class MongoIndexingPolicyComponent extends React.Component<
  MongoIndexingPolicyComponentProps,
  MongoIndexingPolicyComponentState
> {
  private shouldCheckComponentIsDirty = true;
  private currentTextFields: ITextField[] = [];
  private initialIndexesColumns: IColumn[] = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    {
      key: "actionButton",
      name: "Drop Index",
      fieldName: "actionButton",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true
    }
  ];

  private indexesToBeAddedColumns: IColumn[] = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "actionButton", name: "Undo", fieldName: "actionButton", minWidth: 100, maxWidth: 200, isResizable: true }
  ];

  constructor(props: MongoIndexingPolicyComponentProps) {
    super(props);
    this.state = {
      indexesToBeAddedExpanded: true,
      indexesToBeDroppedExpanded: true,
      initialIndexesExpanded: true
    };
  }

  componentDidUpdate(prevProps: MongoIndexingPolicyComponentProps): void {
    if (this.props.indexesToAdd.length > prevProps.indexesToAdd.length) {
      this.currentTextFields[prevProps.indexesToAdd.length]?.focus();
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

  private toggleIndexesToBeAddedExpanded = (): void => {
    this.setState({ indexesToBeAddedExpanded: !this.state.indexesToBeAddedExpanded });
  };

  private toggleIndexesToBeDroppedExpanded = (): void => {
    this.setState({ indexesToBeDroppedExpanded: !this.state.indexesToBeDroppedExpanded });
  };

  private toggleInitialIndexesExpanded = (): void => {
    this.setState({ initialIndexesExpanded: !this.state.initialIndexesExpanded });
  };

  public isMongoIndexingPolicySaveable = (): boolean => {
    const addErrorsExist = this.props.indexesToAdd.find(
      (addMongoIndexProps: AddMongoIndexProps) => addMongoIndexProps.notification
    );
    return (this.props.indexesToAdd.length > 0 && !addErrorsExist) || this.props.indexesToDrop.length > 0;
  };

  public isMongoIndexingPolicyDiscardable = (): boolean => {
    return this.props.indexesToAdd.length > 0 || this.props.indexesToDrop.length > 0;
  };

  public getMongoWarningNotificationMessage = (): string => {
    return this.props.indexesToAdd.find(
      (addMongoIndexProps: AddMongoIndexProps) =>
        addMongoIndexProps.notification?.type === MongoNotificationType.Warning
    )?.notification.message;
  };

  private onRenderRow = (props: IDetailsRowProps): JSX.Element => {
    return <DetailsRow {...props} styles={transparentDetailsRowStyles} />;
  };

  private getActionButton = (arrayPosition: number, isCurrentIndex: boolean): JSX.Element => {
    return isCurrentIndex ? (
      <IconButton
        disabled={this.props.indexesToDrop.includes(arrayPosition)}
        iconProps={{ iconName: "Delete" }}
        onClick={() => {
          this.props.onIndexDrop(arrayPosition);
        }}
      />
    ) : (
      <IconButton
        iconProps={{ iconName: "Undo" }}
        onClick={() => {
          this.props.onRevertIndexDrop(arrayPosition);
        }}
      />
    );
  };

  private getMongoIndexDisplayProps = (
    mongoIndex: MongoIndex,
    arrayPosition: number,
    isCurrentIndex: boolean
  ): MongoIndexDisplayProps => {
    const keys = mongoIndex.key.keys;
    const type = getMongoIndexType(keys);
    const definition = keys.join();
    let mongoIndexDisplayProps: MongoIndexDisplayProps;
    if (type) {
      mongoIndexDisplayProps = {
        definition: <Text>{definition}</Text>,
        type: <Text>{type}</Text>,
        actionButton: definition === MongoIndexIdField ? <></> : this.getActionButton(arrayPosition, isCurrentIndex)
      };
    }
    return mongoIndexDisplayProps;
  };

  private renderIndexesToBeAdded = (): JSX.Element => {
    const indexesToAddLength = this.props.indexesToAdd.length;
    return (
      <Stack {...addMongoIndexStackProps} styles={mediumWidthStackStyles}>
        <Stack
          className="collapsibleLabel"
          horizontal
          tokens={accordionStackTokens}
          onClick={this.toggleIndexesToBeAddedExpanded}
        >
          <Icon
            iconName={this.state.indexesToBeAddedExpanded ? "ChevronDown" : "ChevronRight"}
            styles={accordionIconStyles}
          />
          <Label>Index(es) to be added</Label>
        </Stack>
        {this.state.indexesToBeAddedExpanded && (
          <>
            {this.props.indexesToAdd.map((mongoIndexWithType: AddMongoIndexProps, index: number) => {
              const keys = mongoIndexWithType.mongoIndex.key.keys;
              const type = mongoIndexWithType.type;
              const notification = mongoIndexWithType.notification;
              return (
                <AddMongoIndexComponent
                  key={index}
                  isFirst={index === 0}
                  description={keys.join()}
                  type={type}
                  notification={notification}
                  setRef={(textField: ITextField) => (this.currentTextFields[index] = textField)}
                  onIndexAddOrChange={(description: string, type: MongoIndexTypes) =>
                    this.props.onIndexAddOrChange(index, description, type)
                  }
                  onDiscard={() => {
                    this.currentTextFields.splice(index, 1);
                    this.props.onRevertIndexAdd(index);
                  }}
                />
              );
            })}
            <AddMongoIndexComponent
              key={indexesToAddLength}
              isFirst={indexesToAddLength === 0}
              description={undefined}
              type={undefined}
              notification={undefined}
              setRef={(textField: ITextField) => (this.currentTextFields[indexesToAddLength] = textField)}
              onIndexAddOrChange={(description: string, type: MongoIndexTypes) =>
                this.props.onIndexAddOrChange(indexesToAddLength, description, type)
              }
              onDiscard={() => {
                this.props.onRevertIndexAdd(indexesToAddLength);
              }}
            />
          </>
        )}
      </Stack>
    );
  };

  private renderInitialIndexes = (): JSX.Element => {
    const initialIndexes: MongoIndexDisplayProps[] = this.props.mongoIndexes.map(
      (mongoIndex: MongoIndex, arrayPosition: number) => this.getMongoIndexDisplayProps(mongoIndex, arrayPosition, true)
    );

    return (
      <Stack styles={mediumWidthStackStyles}>
        <Stack
          className="collapsibleLabel"
          horizontal
          tokens={accordionStackTokens}
          onClick={this.toggleInitialIndexesExpanded}
        >
          <Icon
            iconName={this.state.initialIndexesExpanded ? "ChevronDown" : "ChevronRight"}
            styles={accordionIconStyles}
          />
          <Label>Current index(es)</Label>
        </Stack>
        {this.state.initialIndexesExpanded && (
          <DetailsList
            styles={customDetailsListStyles}
            disableSelectionZone
            items={initialIndexes}
            columns={this.initialIndexesColumns}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
            layoutMode={DetailsListLayoutMode.justified}
          />
        )}
      </Stack>
    );
  };

  private renderIndexesToBeDropped = (): JSX.Element => {
    const indexesToBeDropped: MongoIndexDisplayProps[] = this.props.indexesToDrop.map(
      (dropIndex: number, arrayPosition: number) =>
        this.getMongoIndexDisplayProps(this.props.mongoIndexes[dropIndex], arrayPosition, false)
    );

    return (
      <Stack styles={mediumWidthStackStyles}>
        <Stack
          className="collapsibleLabel"
          horizontal
          tokens={accordionStackTokens}
          onClick={this.toggleIndexesToBeDroppedExpanded}
        >
          <Icon
            iconName={this.state.indexesToBeDroppedExpanded ? "ChevronDown" : "ChevronRight"}
            styles={accordionIconStyles}
          />
          <Label>Index(es) to be dropped</Label>
        </Stack>
        {this.state.indexesToBeDroppedExpanded && indexesToBeDropped.length > 0 && (
          <DetailsList
            styles={customDetailsListStyles}
            disableSelectionZone
            items={indexesToBeDropped}
            columns={this.indexesToBeAddedColumns}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
            layoutMode={DetailsListLayoutMode.justified}
          />
        )}
      </Stack>
    );
  };

  private renderWarningMessage = (): JSX.Element => {
    let warningMessage: string;
    if (this.getMongoWarningNotificationMessage()) {
      warningMessage = this.getMongoWarningNotificationMessage();
    } else if (this.isMongoIndexingPolicySaveable()) {
      warningMessage =
        "You have not saved the latest changes made to your indexing policy. Please click save to confirm the changes.";
    }

    return (
      warningMessage && (
        <MessageBar messageBarType={MessageBarType.warning}>
          <Text>{warningMessage}</Text>
        </MessageBar>
      )
    );
  };

  public render(): JSX.Element {
    return this.props.mongoIndexes ? (
      <Stack {...subComponentStackProps}>
        {this.renderWarningMessage()}
        {mongoIndexingPolicyDisclaimer}
        {this.renderIndexesToBeAdded()}
        {longGrayLine}
        {this.renderIndexesToBeDropped()}
        {longGrayLine}
        {this.renderInitialIndexes()}
      </Stack>
    ) : (
      <ProgressIndicator />
    );
  }
}
