import * as React from "react";
import {
  DetailsList,
  DetailsListLayoutMode,
  MessageBar,
  MessageBarType,
  Stack,
  IconButton,
  Text,
  SelectionMode,
  IDetailsRowProps,
  IDetailsRowStyles,
  DetailsRow,
  Label,
  TextField,
  IDropdownOption,
  Dropdown
} from "office-ui-fabric-react";
import { titleAndInputStackProps } from "../SettingsRenderUtils";
import { MongoIndex } from "../../../../Utils/arm/generatedClients/2020-04-01/types";
import { MongoIndexTypes } from "../SettingsUtils";

export interface MongoIndexingPolicyComponentProps {
  mongoIndexes: MongoIndex[];
  onIndexDelete: (index: number) => void;
  indexesToDelete: number[];
  onRevertIndexDelete: (index: number) => void;
  indexesToAdd: MongoIndex[];
  onRevertIndexAdd: (index: number) => void;
  onIndexAdd: (newMongoIndex: MongoIndex) => void;
  onMongoIndexingPolicyDirtyChange: (isMongoIndexingPolicyDirty: boolean) => void;
}

interface MongoIndexingPolicyComponentState {
  isAddingIndex: boolean;
  newIndexDefinition: string;
  newIndexType: MongoIndexTypes;
  errorMessage: string;
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
  private columns = [
    { key: "definition", name: "Definition", fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "type", name: "Type", fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: "dropIndex", name: "Drop Index", fieldName: "dropIndex", minWidth: 100, maxWidth: 200, isResizable: true }
  ];
  private indexTypes: IDropdownOption[] = [MongoIndexTypes.Single, MongoIndexTypes.WildCard].map((value: string) => ({
    text: value,
    key: value
  }));

  constructor(props: MongoIndexingPolicyComponentProps) {
    super(props);
    this.state = {
      isAddingIndex: false,
      newIndexDefinition: undefined,
      newIndexType: undefined,
      errorMessage: undefined
    };
  }

  componentDidUpdate(): void {
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
    return this.props.indexesToAdd.length > 0 || this.props.indexesToDelete.length > 0;
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

  public getType = (keys: string[]): string => {
    const length = keys.length;
    let type: string = undefined;
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
        <Label>Existing Indexes</Label>
        <DetailsList
          disableSelectionZone
          items={initialIndexes}
          columns={this.columns}
          selectionMode={SelectionMode.none}
          onRenderRow={this.onRenderRow}
          layoutMode={DetailsListLayoutMode.justified}
        />
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
              iconProps={{ iconName: "Delete" }}
              onClick={() => {
                this.props.onRevertIndexDelete(index);
              }}
            />
          )
        } as MongoIndexDisplayProps;
      }
    );

    return indexesToBeDeleted.length != 0 ? (
      <Stack {...titleAndInputStackProps}>
        <Label>Indexes to be deleted</Label>
        <DetailsList
          disableSelectionZone
          items={indexesToBeDeleted}
          columns={this.columns}
          selectionMode={SelectionMode.none}
          onRenderRow={this.onRenderRow}
          layoutMode={DetailsListLayoutMode.justified}
        />
      </Stack>
    ) : (
      <></>
    );
  };

  public renderIndexesToBeAdded = (): JSX.Element => {
    const indexesToBeAdded: MongoIndexDisplayProps[] = this.props.indexesToAdd.map(
      (mongoIndex: MongoIndex, index: number) => {
        const keys = mongoIndex.key.keys;
        const type = this.getType(keys);
        return {
          definition: <Text>{keys.join(",")}</Text>,
          type: <Text>{type}</Text>,
          dropIndex: (
            <IconButton
              iconProps={{ iconName: "Delete" }}
              onClick={() => {
                this.props.onRevertIndexAdd(index);
              }}
            />
          )
        } as MongoIndexDisplayProps;
      }
    );

    return indexesToBeAdded.length != 0 ? (
      <Stack {...titleAndInputStackProps}>
        <Label>Indexes to be added</Label>
        <DetailsList
          disableSelectionZone
          items={indexesToBeAdded}
          columns={this.columns}
          selectionMode={SelectionMode.none}
          onRenderRow={this.onRenderRow}
          layoutMode={DetailsListLayoutMode.justified}
        />
      </Stack>
    ) : (
      <></>
    );
  };

  private onNewIndexDefinitionChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string
  ): void => this.setState({ newIndexDefinition: newValue });

  private onNewIndexTypeChange = (
    event: React.FormEvent<HTMLDivElement>,
    option?: IDropdownOption,
    index?: number
  ): void => this.setState({ newIndexType: MongoIndexTypes[option.key as keyof typeof MongoIndexTypes] });

  public renderAddIndexComponent = (): JSX.Element => {
    return (
      <Stack {...titleAndInputStackProps}>
        <IconButton
          iconProps={{ iconName: "Add" }}
          disabled={this.state.isAddingIndex}
          onClick={() => {
            this.setState({ isAddingIndex: true });
          }}
        />
        {this.state.isAddingIndex && (
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <TextField
              styles={{ root: { width: 300 } }}
              label="Defintion"
              placeholder={this.state.newIndexType === MongoIndexTypes.WildCard ? "placeholder.$**" : undefined}
              onChange={this.onNewIndexDefinitionChange}
            />

            <Dropdown
              styles={{ dropdown: { width: 300 } }}
              placeholder="Select an index type"
              label="Type"
              options={this.indexTypes}
              onChange={this.onNewIndexTypeChange}
            />

            <IconButton
              iconProps={{ iconName: "Save" }}
              onClick={() => {
                if (this.state.newIndexType === undefined) {
                  this.setState({ errorMessage: "Please select the type of the index" });
                  return;
                }

                if (
                  this.state.newIndexType === MongoIndexTypes.WildCard &&
                  this.state.newIndexDefinition.indexOf("$**") === -1
                ) {
                  this.setState({ errorMessage: "Wild Card path is not present" });
                  return;
                }

                const newMongoIndex = { key: { keys: [this.state.newIndexDefinition] } } as MongoIndex;
                this.props.onIndexAdd(newMongoIndex);
                this.setState({
                  isAddingIndex: false,
                  newIndexDefinition: undefined,
                  newIndexType: undefined,
                  errorMessage: undefined
                });
              }}
            />
            <IconButton
              iconProps={{ iconName: "Cancel" }}
              onClick={() => {
                this.setState({
                  isAddingIndex: false,
                  newIndexDefinition: undefined,
                  newIndexType: undefined,
                  errorMessage: undefined
                });
              }}
            />
          </Stack>
        )}
        {this.state.errorMessage && (
          <MessageBar messageBarType={MessageBarType.error}>{this.state.errorMessage}</MessageBar>
        )}
      </Stack>
    );
  };

  public render(): JSX.Element {
    return (
      <Stack {...titleAndInputStackProps}>
        {this.renderInitialIndexes()}
        {this.renderIndexesToBeAdded()}
        {this.renderAddIndexComponent()}
        {this.renderIndexesToBeDeleted()}
      </Stack>
    );
  }
}
