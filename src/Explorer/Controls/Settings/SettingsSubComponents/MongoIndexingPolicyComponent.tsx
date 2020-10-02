import * as React from "react";
import { DetailsList, DetailsListLayoutMode, MessageBar, MessageBarType, Stack, IconButton, Text, SelectionMode, IDetailsRowProps, IDetailsRowStyles, DetailsRow, ImageIcon } from "office-ui-fabric-react";
import { titleAndInputStackProps } from "../SettingsRenderUtils";
import { MongoIndex } from "../../../../Utils/arm/generatedClients/2020-04-01/types";

export interface MongoIndexingPolicyComponentProps {
  mongoIndexes: MongoIndex[];
  onIndexDelete: (index: number) => void
  indexesToDelete: number[];
  onRevertIndexDelete: (index:number) => void
  indexesToAdd: MongoIndex[];
  onRevertIndexAdd: (index: number) => void
  onIndexAdd: (newMongoIndex: MongoIndex) => void
  onMongoIndexingPolicyDirtyChange: (isMongoIndexingPolicyDirty: boolean) => void;
}

interface MongoIndexingPolicyComponentState {
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
    { key: 'definition', name: 'Definition', fieldName: "definition", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: 'type', name: 'Type', fieldName: "type", minWidth: 100, maxWidth: 200, isResizable: true },
    { key: 'dropIndex', name: 'Drop Index', fieldName: "dropIndex", minWidth: 100, maxWidth: 200, isResizable: true },
  ];

  constructor(props: MongoIndexingPolicyComponentProps) {
    super(props);
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
    return this.props.indexesToAdd.length > 0 || this.props.indexesToDelete.length > 0  
  };

  private onRenderRow(props: IDetailsRowProps): JSX.Element {
    const rowStyles: Partial<IDetailsRowStyles> = {
      root: {
        selectors: {
          ':hover': {
            background: 'transparent'
          }
        }
      }
    };
                                                                                                                 
    return <DetailsRow {...props} styles={rowStyles} />;
  }

  public getType = (keys: string[]) : string => {
    const length = keys.length
    let type : string
    if (length === 1) {
        if (keys[0].indexOf("$**") !== -1) {
            type = "WildCard"
        } else {
            type = "Single"
        }
    } else {
        type = "Compound"
    }
    return type
  }

  public render(): JSX.Element {
    const originalItems : MongoIndexDisplayProps[] = this.props.mongoIndexes.map((mongoIndex: MongoIndex, index: number) => {
        const keys = mongoIndex.key.keys
        const type = this.getType(keys)
        return {
            definition: <Text>{keys.join(",")}</Text>,
            type: <Text>{type}</Text>,
            dropIndex:         <IconButton
            disabled={this.props.indexesToDelete.includes(index)}
            iconProps={{ iconName: "Delete" }}
            onClick={() => {
              this.props.onIndexDelete(index)
            }}
          />
         
        } as MongoIndexDisplayProps
    })

    const deleteItems : MongoIndexDisplayProps[] = this.props.indexesToDelete.map((deleteIndex: number, index: number) => {
      const keys = this.props.mongoIndexes[deleteIndex].key.keys
      const type = this.getType(keys)
      return {
          definition: <Text>{keys.join(",")}</Text>,
          type: <Text>{type}</Text>,
          dropIndex:         <IconButton
          iconProps={{ iconName: "Delete" }}
          onClick={() => {
            this.props.onRevertIndexDelete(index)
          }}
        />
       
      } as MongoIndexDisplayProps
    })

    const addItems : MongoIndexDisplayProps[] = this.props.indexesToAdd.map((mongoIndex: MongoIndex, index: number) => {
      const keys = mongoIndex.key.keys
      const type = this.getType(keys)
      return {
          definition: <Text>{keys.join(",")}</Text>,
          type: <Text>{type}</Text>,
          dropIndex:         <IconButton
          iconProps={{ iconName: "Delete" }}
          onClick={() => {
            this.props.onRevertIndexAdd(index)
          }}
        />
       
      } as MongoIndexDisplayProps
    })

    return (
      <Stack {...titleAndInputStackProps}>
          <Text>Existing Indexes</Text>
          <DetailsList
            disableSelectionZone
            items={originalItems}
            columns={this.columns}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
            layoutMode={DetailsListLayoutMode.justified}
          />
          <IconButton
          iconProps={{ iconName: "Add" }}
          onClick={() => {
            const newMongoIndex = {key: {keys: ["sample_Index" + Math.random()]}} as MongoIndex
            this.props.onIndexAdd(newMongoIndex)
          }}
          />
          <Text>Indexes to be added</Text>
          <DetailsList
            disableSelectionZone
            items={addItems}
            columns={this.columns}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
            layoutMode={DetailsListLayoutMode.justified}
          />

          <Text>Indexes to be deleted</Text>
          <DetailsList
            disableSelectionZone
            items={deleteItems}
            columns={this.columns}
            selectionMode={SelectionMode.none}
            onRenderRow={this.onRenderRow}
            layoutMode={DetailsListLayoutMode.justified}
          />
          
      </Stack>
    );
  }
}
