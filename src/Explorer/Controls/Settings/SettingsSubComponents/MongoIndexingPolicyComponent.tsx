import * as React from "react";
import { DetailsList, DetailsListLayoutMode, MessageBar, MessageBarType, Stack, IconButton } from "office-ui-fabric-react";
import { titleAndInputStackProps } from "../SettingsRenderUtils";
import { MongoIndex } from "../../../../Utils/arm/generatedClients/2020-04-01/types";

export interface MongoIndexingPolicyComponentProps {
  mongoIndexes: MongoIndex[];
  onMongoIndexingPolicyDirtyChange: (isMongoIndexingPolicyDirty: boolean) => void;
}

interface MongoIndexingPolicyComponentState {
}

interface MongoIndexDisplayProps {
    definition: string;
    type: string;
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
    //this.onComponentUpdate();
  }

  componentDidMount(): void {
    //this.onComponentUpdate();
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
    /*
    if (
      isDirty(this.props.indexingPolicyContent, this.props.indexingPolicyContentBaseline) &&
      this.state.indexingPolicyContentIsValid
    ) {
      return true;
    }
    */
    return false;
  };

  public render(): JSX.Element {
    const items : MongoIndexDisplayProps[] = this.props.mongoIndexes.map((mongoIndex: MongoIndex) => {
        const keys = mongoIndex.key.keys
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

        return {
            definition: keys.join(","),
            type: type,
            dropIndex:         <IconButton
            iconProps={{ iconName: "Delete" }}
            onClick={() => alert("delete clicked")}
          />
         
        } as MongoIndexDisplayProps
    })
    return (
      <Stack {...titleAndInputStackProps}>
          <DetailsList
            disableSelectionZone
            items={items}
            columns={this.columns}
            layoutMode={DetailsListLayoutMode.justified}
          />
      </Stack>
    );
  }
}
