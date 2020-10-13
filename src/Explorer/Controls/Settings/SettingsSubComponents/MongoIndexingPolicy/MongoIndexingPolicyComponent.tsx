import * as React from "react";
import {
  DetailsList,
  DetailsListLayoutMode,
  Stack,
  IconButton,
  Text,
  SelectionMode,
  IDetailsRowProps,
  IDetailsRowStyles,
  DetailsRow,
  Label,
  ProgressIndicator,
  ITextField,
  ITextFieldProps,
  ImageIcon,
  Icon
} from "office-ui-fabric-react";
import { accordionStackTokens, titleAndInputStackProps } from "../../SettingsRenderUtils";
import { MongoIndex } from "../../../../../Utils/arm/generatedClients/2020-04-01/types";
import { MongoIndexTypes, AddMongoIndexProps } from "../../SettingsUtils";
import { AddMongoIndexComponent } from "./AddMongoIndexComponent";

export interface MongoIndexingPolicyComponentProps {
  mongoIndexes: MongoIndex[];
  onIndexDelete: (index: number) => void;
  indexesToDelete: number[];
  onRevertIndexDelete: (index: number) => void;
  indexesToAdd: AddMongoIndexProps[];
  onRevertIndexAdd: (index: number) => void;
  onIndexAddOrChange: (index: number, description: string, type: MongoIndexTypes) => void;
  onMongoIndexingPolicyDirtyChange: (isMongoIndexingPolicyDirty: boolean) => void;
}

interface MongoIndexingPolicyComponentState {
  indexesToBeAddedExpanded: boolean;
  indexesToBeDeletedExpanded: boolean;
  initialIndexesExpanded: boolean;
}

interface MongoIndexDisplayProps {
  definition: JSX.Element;
  type: JSX.Element;
  dropIndex: JSX.Element;
}
export class MongoIndexingPolicyComponent extends React.Component<
  MongoIndexingPolicyComponentProps,
  MongoIndexingPolicyComponentState
> {
  private shouldCheckComponentIsDirty = true;
  private currentTextFields: ITextField[] = [];
  private initialIndexesColumns = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "dropIndex", name: "Drop Index", fieldName: "dropIndex", minWidth: 100, maxWidth: 200, isResizable: true }
  ];

  private indexesToBeAddedColumns = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "dropIndex", name: "Undo", fieldName: "dropIndex", minWidth: 100, maxWidth: 200, isResizable: true }
  ];

  constructor(props: MongoIndexingPolicyComponentProps) {
    super(props);
    this.state = {
      indexesToBeAddedExpanded: true,
      indexesToBeDeletedExpanded: true,
      initialIndexesExpanded: true
    };
  }

  componentDidUpdate(prevProps: MongoIndexingPolicyComponentProps): void {
    if (this.props.indexesToAdd.length > prevProps.indexesToAdd.length) {
      this.currentTextFields[prevProps.indexesToAdd.length].focus();
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
    this.props.onMongoIndexingPolicyDirtyChange(this.IsComponentDirty());
    this.shouldCheckComponentIsDirty = false;
  };

  public IsComponentDirty = (): boolean => {
    const addErrorsExist = this.props.indexesToAdd.find(
      (addMongoIndexProps: AddMongoIndexProps) => addMongoIndexProps.errorMessage
    );
    return !addErrorsExist || this.props.indexesToDelete.length > 0;
  };

  private onRenderRow(props: IDetailsRowProps): JSX.Element {
    const rowStyles: Partial<IDetailsRowStyles> = {
      root: {
        selectors: {
          ":hover": {
            background: "transparent"
          }
        }
      }
    };

    return <DetailsRow {...props} styles={rowStyles} />;
  }

  public getType = (keys: string[]): MongoIndexTypes => {
    const length = keys.length;
    let type: MongoIndexTypes = undefined;
    if (length === 1) {
      if (keys[0].indexOf("$**") !== -1) {
        type = MongoIndexTypes.WildCard;
      } else {
        type = MongoIndexTypes.Single;
      }
    }
    return type;
  };

  public renderInitialIndexes = (): JSX.Element => {
    const initialIndexes: MongoIndexDisplayProps[] = this.props.mongoIndexes.map(
      (mongoIndex: MongoIndex, index: number) => {
        const keys = mongoIndex.key.keys;
        const type = this.getType(keys);
        const definition = keys.join();
        return type
          ? ({
              definition: <Text>{definition}</Text>,
              type: <Text>{type}</Text>,
              dropIndex:
                definition === "_id" ? (
                  <></>
                ) : (
                  <IconButton
                    disabled={this.props.indexesToDelete.includes(index)}
                    iconProps={{ iconName: "Delete" }}
                    onClick={() => {
                      this.props.onIndexDelete(index);
                    }}
                  />
                )
            } as MongoIndexDisplayProps)
          : undefined;
      }
    );

    return (
      <Stack {...titleAndInputStackProps}>
        <Stack
          horizontal
          tokens={accordionStackTokens}
          onClick={() => this.setState({ initialIndexesExpanded: !this.state.initialIndexesExpanded })}
        >
          <Icon
            iconName={this.state.initialIndexesExpanded ? "ChevronDown" : "ChevronRight"}
            styles={{ root: { verticalAlign: "middle" } }}
          />
          <Label>Existing Indexes</Label>
        </Stack>
        {this.state.initialIndexesExpanded && (
          <DetailsList
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

  public renderIndexesToBeDeleted = (): JSX.Element => {
    const indexesToBeDeleted: MongoIndexDisplayProps[] = this.props.indexesToDelete.map(
      (deleteIndex: number, index: number) => {
        const keys = this.props.mongoIndexes[deleteIndex].key.keys;
        const type = this.getType(keys);
        return {
          definition: <Text>{keys.join(",")}</Text>,
          type: <Text>{type}</Text>,
          dropIndex: (
            <IconButton
              iconProps={{ iconName: "Undo" }}
              onClick={() => {
                this.props.onRevertIndexDelete(index);
              }}
            />
          )
        } as MongoIndexDisplayProps;
      }
    );

    return (
      <Stack {...titleAndInputStackProps}>
        <Stack
          horizontal
          tokens={accordionStackTokens}
          onClick={() => this.setState({ indexesToBeDeletedExpanded: !this.state.indexesToBeDeletedExpanded })}
        >
          <Icon
            iconName={this.state.indexesToBeDeletedExpanded ? "ChevronDown" : "ChevronRight"}
            styles={{ root: { verticalAlign: "middle" } }}
          />
          <Label>Indexes to be deleted</Label>
        </Stack>
        {this.state.indexesToBeDeletedExpanded && indexesToBeDeleted.length > 0 && (
          <DetailsList
            disableSelectionZone
            items={indexesToBeDeleted}
            columns={this.indexesToBeAddedColumns}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
            layoutMode={DetailsListLayoutMode.justified}
          />
        )}
      </Stack>
    );
  };

  public renderIndexesToBeAdded = (): JSX.Element => {
    const indexesToAddLength = this.props.indexesToAdd.length;
    return (
      <Stack {...titleAndInputStackProps}>
        <Stack
          horizontal
          tokens={accordionStackTokens}
          onClick={() => this.setState({ indexesToBeAddedExpanded: !this.state.indexesToBeAddedExpanded })}
        >
          <Icon
            iconName={this.state.indexesToBeAddedExpanded ? "ChevronDown" : "ChevronRight"}
            styles={{ root: { verticalAlign: "middle" } }}
          />
          <Label>Index To Be Added</Label>
        </Stack>
        {this.state.indexesToBeAddedExpanded && (
          <>
            {this.props.indexesToAdd.map((mongoIndexWithType: AddMongoIndexProps, index: number) => {
              const keys = mongoIndexWithType.mongoIndex.key.keys;
              const type = mongoIndexWithType.type;
              const errorMessage = mongoIndexWithType.errorMessage;
              return (
                <AddMongoIndexComponent
                  key={index}
                  description={keys.join()}
                  type={type}
                  errorMessage={errorMessage}
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
              description={undefined}
              type={undefined}
              errorMessage={undefined}
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

  public render(): JSX.Element {
    return this.props.mongoIndexes ? (
      <Stack {...titleAndInputStackProps}>
        {this.renderIndexesToBeAdded()}
        {this.renderIndexesToBeDeleted()}
        {this.renderInitialIndexes()}
      </Stack>
    ) : (
      <ProgressIndicator />
    );
  }
}
